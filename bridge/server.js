#!/usr/bin/env node

/**
 * Bridge Server — HTTP API that spawns Claude Code CLI
 * Jobs persisted to disk (survives restarts).
 * On startup, recovers orphaned jobs.
 */

const http = require('http')
const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const PORT = process.env.BRIDGE_PORT || 3001
const SECRET = process.env.BRIDGE_SECRET || 'equator-bridge-secret-change-me'
const PROJECTS_DIR = path.join(__dirname, '..', 'tmp-sites')
const JOBS_DIR = path.join(__dirname, 'jobs')

// Load Supabase credentials from super-admin .env.local (if not in env)
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', 'apps', 'super-admin', '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.+)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}
loadEnvFile()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Ensure dirs exist
for (const dir of [PROJECTS_DIR, JOBS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ─── Job persistence ───
function saveJob(jobId, data) {
  fs.writeFileSync(path.join(JOBS_DIR, `${jobId}.json`), JSON.stringify(data, null, 2))
}

function loadJob(jobId) {
  const file = path.join(JOBS_DIR, `${jobId}.json`)
  if (!fs.existsSync(file)) return null
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) }
  catch { return null }
}

function updateJob(jobId, updates) {
  const job = loadJob(jobId) || {}
  const updated = { ...job, ...updates }
  saveJob(jobId, updated)
  return updated
}

// ─── On startup: recover orphaned "running" jobs ───
function recoverOrphanedJobs() {
  if (!fs.existsSync(JOBS_DIR)) return
  const files = fs.readdirSync(JOBS_DIR).filter(f => f.endsWith('.json'))
  for (const file of files) {
    try {
      const job = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, file), 'utf-8'))
      if (job.status === 'running') {
        const jobId = file.replace('.json', '')
        const projectDir = path.join(PROJECTS_DIR, job.projectId || jobId.split('-chat-')[0])

        // Check if code was actually generated (claude finished but bridge died before updating)
        const appJsx = path.join(projectDir, 'src', 'App.jsx')
        if (fs.existsSync(appJsx)) {
          const generatedCode = fs.readFileSync(appJsx, 'utf-8')
          if (generatedCode.length > 500) {
            console.log(`Recovering orphaned job ${jobId} — code found, building...`)
            // Try to build and deploy in background
            buildAndDeploy(jobId, projectDir, generatedCode)
            continue
          }
        }

        // Code wasn't generated — mark as error
        console.log(`Recovering orphaned job ${jobId} — no code found, marking error`)
        updateJob(jobId, {
          status: 'error',
          error: 'Bridge restarted during generation. Please retry.',
          finishedAt: Date.now(),
        })
        const orphanProjectId = jobId.split('-chat-')[0]
        notifySupabase(orphanProjectId, { status: 'draft' })
      }
    } catch {}
  }
}

async function buildAndDeploy(jobId, projectDir, generatedCode) {
  let vercelUrl = null
  try {
    // Reset vercel.json to known-good state (Claude CLI may have corrupted it)
    fs.writeFileSync(path.join(projectDir, 'vercel.json'), JSON.stringify({
      headers: [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Frame-Options", value: "ALLOWALL" },
            { key: "Content-Security-Policy", value: "frame-ancestors *" }
          ]
        }
      ]
    }, null, 2))

    execSync('npm install', { cwd: projectDir, timeout: 60000, stdio: 'pipe' })
    execSync('npx vite build', { cwd: projectDir, timeout: 60000, stdio: 'pipe' })
    const deployOutput = execSync(
      'npx --yes vercel deploy --prod --yes 2>&1',
      { cwd: projectDir, timeout: 120000, encoding: 'utf-8' }
    )
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/)
    if (urlMatch) vercelUrl = urlMatch[0]

    // Disable Vercel SSO protection so site is publicly accessible + embeddable in iframe
    disableVercelProtection(projectDir)
  } catch (err) {
    console.error(`Build/deploy error for ${jobId}:`, err.message)
  }

  updateJob(jobId, {
    status: 'done',
    generatedCode,
    vercelUrl,
    finishedAt: Date.now(),
    error: null,
  })
  console.log(`Job ${jobId} done → ${vercelUrl || 'no deploy URL'}`)

  // Push to Supabase as safety net (in case polling died)
  const isChatJob = jobId.includes('-chat-')
  const projectId = isChatJob ? jobId.split('-chat-')[0] : jobId
  const job = loadJob(jobId)
  notifySupabase(projectId, {
    status: 'review',
    generated_code: generatedCode || null,
    vercel_url: vercelUrl || null,
  }, isChatJob ? (job?.output || 'Зміни застосовано.') : null)
}

// ─── Disable Vercel SSO protection for deployed project ───
function disableVercelProtection(projectDir) {
  try {
    // Read .vercel/project.json to get project ID
    const vercelConfig = path.join(projectDir, '.vercel', 'project.json')
    if (!fs.existsSync(vercelConfig)) return

    const { projectId, orgId } = JSON.parse(fs.readFileSync(vercelConfig, 'utf-8'))
    if (!projectId) return

    // Get Vercel token from CLI auth
    const authFile = path.join(
      process.env.HOME || '/home/alexa',
      '.local/share/com.vercel.cli/auth.json'
    )
    if (!fs.existsSync(authFile)) return
    const { token } = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
    if (!token) return

    // Disable SSO protection via API
    const url = `https://api.vercel.com/v9/projects/${projectId}${orgId ? `?teamId=${orgId}` : ''}`
    execSync(`curl -s -X PATCH "${url}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"ssoProtection":null}'`, {
      timeout: 10000,
      stdio: 'pipe',
    })
    console.log(`SSO protection disabled for project ${projectId}`)
  } catch (err) {
    console.error('Failed to disable SSO protection:', err.message)
  }
}

// ─── Push completion to Supabase (safety net) ───
async function notifySupabase(projectId, updates, chatOutput) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return
  try {
    // If we have chat output, first fetch current chat_history to append to it
    if (chatOutput) {
      try {
        const getUrl = `${SUPABASE_URL}/rest/v1/site_projects?id=eq.${projectId}&select=chat_history`
        const getRes = await fetch(getUrl, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        })
        if (getRes.ok) {
          const [row] = await getRes.json()
          const chatHistory = [...(row?.chat_history || [])]
          chatHistory.push({
            role: 'assistant',
            content: chatOutput,
            tab: 'revisions',
            source: 'bridge',
            timestamp: new Date().toISOString(),
          })
          updates.chat_history = chatHistory
        }
      } catch (err) {
        console.warn(`Failed to fetch chat_history for append: ${err.message}`)
      }
    }

    const url = `${SUPABASE_URL}/rest/v1/site_projects?id=eq.${projectId}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
    })
    if (res.ok) console.log(`Supabase notified: ${projectId} → ${updates.status}`)
    else console.warn(`Supabase notify failed: ${projectId} → HTTP ${res.status}`)
  } catch (err) {
    console.warn(`Supabase notify error: ${projectId}`, err.message)
  }
}

// ─── Utils ───
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) }
      catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function auth(req) {
  return (req.headers.authorization || '') === `Bearer ${SECRET}`
}

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function runClaude(prompt, options = {}) {
  const { cwd, maxTurns, timeout, allowedTools } = options
  const args = [
    '-p', prompt,
    '--output-format', 'text',
    '--dangerously-skip-permissions',
    '--verbose',
  ]
  if (maxTurns) args.push('--max-turns', String(maxTurns))
  if (allowedTools) args.push('--allowedTools', allowedTools)

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const proc = spawn('claude', args, {
      cwd: cwd || process.cwd(),
      timeout: timeout || 300000,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    proc.stdin.end()
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(`claude exited ${code}: ${stderr.slice(0, 500) || stdout.slice(0, 500)}`))
    })
    proc.on('error', reject)
  })
}

// Chat-only mode: no tools, no file access, just text response
function runClaudeChat(prompt, options = {}) {
  const { timeout } = options
  const args = [
    '-p', prompt,
    '--output-format', 'text',
    '--max-turns', '1',
    '--allowedTools', '',
  ]

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const proc = spawn('claude', args, {
      cwd: '/tmp',
      timeout: timeout || 60000,
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    proc.stdin.end()
    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })
    proc.on('close', code => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(`claude exited ${code}: ${stderr.slice(0, 500) || stdout.slice(0, 500)}`))
    })
    proc.on('error', reject)
  })
}

// ─── Parse brief: sync ───
async function handleParseBrief(req, res) {
  const { description } = await parseBody(req)
  if (!description?.trim()) return respond(res, 400, { error: 'description required' })

  const prompt = `Ти — помічник веб-агентства Equator. Розбери вільний опис проекту на структуровані поля.

Опис:
"""
${description}
"""

Верни ТІЛЬКИ чистий JSON (без markdown, без \`\`\`, без пояснень) з полями:
{
  "name": "Назва проекту",
  "companyName": "Назва компанії",
  "companyDescription": "Опис діяльності (2-3 речення)",
  "siteType": "one-page | multi-page | landing",
  "theme": "light | dark | auto",
  "designStyle": "minimalist | corporate | creative | premium",
  "structure": "1. Hero...\\n2. Про нас...\\n3. ...",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "phone": "",
  "email": "",
  "address": "",
  "socials": "",
  "extraWishes": ""
}

Пропускай поле якщо інформації немає. Кольори підбирай по опису.`

  try {
    const output = await runClaude(prompt, { timeout: 60000 })
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return respond(res, 500, { error: 'Failed to parse AI response' })
    const parsed = JSON.parse(jsonMatch[0])
    respond(res, 200, parsed)
  } catch (err) {
    respond(res, 500, { error: err.message })
  }
}

// ─── Generate site: async ───
async function handleGenerateSite(req, res) {
  const { projectId, formData, prompt } = await parseBody(req)
  if (!projectId || !prompt) return respond(res, 400, { error: 'projectId and prompt required' })

  const projectDir = path.join(PROJECTS_DIR, projectId)

  // Scaffold project
  fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true })

  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
    name: `site-${projectId.slice(0, 8)}`,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0' },
  }, null, 2))

  fs.writeFileSync(path.join(projectDir, 'vite.config.js'),
    `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`)

  // Vercel config: allow iframe embedding
  fs.writeFileSync(path.join(projectDir, 'vercel.json'), JSON.stringify({
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" }
        ]
      }
    ]
  }, null, 2))

  fs.writeFileSync(path.join(projectDir, 'index.html'),
    `<!DOCTYPE html>\n<html lang="uk">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n<title>${formData?.companyName || 'Site'}</title>\n</head>\n<body style="margin:0"><div id="root"></div>\n<script type="module" src="/src/main.jsx"></script>\n</body>\n</html>\n`)

  fs.writeFileSync(path.join(projectDir, 'src', 'main.jsx'),
    `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)\n`)

  const jobId = projectId
  saveJob(jobId, { status: 'running', projectId, startedAt: Date.now() })

  // Run in background
  ;(async () => {
    try {
      const skillPrompt = `/premium-web-design\n\n${prompt}`
      const output = await runClaude(skillPrompt, {
        cwd: projectDir,
        maxTurns: 30,
        timeout: 900000,
      })

      let generatedCode = ''
      try {
        generatedCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8')
      } catch {
        const srcFiles = fs.readdirSync(path.join(projectDir, 'src')).filter(f => f.endsWith('.jsx'))
        if (srcFiles.length > 0) generatedCode = fs.readFileSync(path.join(projectDir, 'src', srcFiles[0]), 'utf-8')
      }

      // Save output before build so it's available for notifySupabase
      updateJob(jobId, { output })

      // Init git and make first commit for version history
      try {
        execSync('git init', { cwd: projectDir, stdio: 'pipe' })
        execSync('git add -A', { cwd: projectDir, stdio: 'pipe' })
        execSync('git commit -m "initial site generation"', { cwd: projectDir, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_NAME: 'bridge', GIT_COMMITTER_NAME: 'bridge', GIT_AUTHOR_EMAIL: 'bridge@equator.agency', GIT_COMMITTER_EMAIL: 'bridge@equator.agency' } })
      } catch (e) { console.error('Git init error:', e.message) }

      // Build & deploy
      await buildAndDeploy(jobId, projectDir, generatedCode)

    } catch (err) {
      updateJob(jobId, { status: 'error', error: err.message, finishedAt: Date.now() })
      notifySupabase(projectId, { status: 'draft' })
    }
  })()

  respond(res, 202, { jobId, status: 'running' })
}

// ─── Discuss: sync (quick chat, no code changes) ───
async function handleDiscuss(req, res, projectId) {
  const { message, history, siteContext } = await parseBody(req)
  if (!message?.trim()) return respond(res, 400, { error: 'message required' })

  // Build context from recent history
  let historyContext = ''
  if (history?.length) {
    const recent = history.slice(-10)
    historyContext = '\n\n## ПОПЕРЕДНІ ПОВІДОМЛЕННЯ\n' + recent.map(m =>
      `${m.role === 'user' ? 'Користувач' : 'Агент'}: ${m.content}`
    ).join('\n')
  }

  // Build site info block
  let siteInfo = ''
  if (siteContext) {
    const lines = []
    if (siteContext.name) lines.push(`Назва проекту: ${siteContext.name}`)
    if (siteContext.companyName) lines.push(`Компанія: ${siteContext.companyName}`)
    if (siteContext.companyDescription) lines.push(`Опис: ${siteContext.companyDescription}`)
    if (siteContext.siteType) lines.push(`Тип сайту: ${siteContext.siteType}`)
    if (siteContext.designStyle) lines.push(`Стиль дизайну: ${siteContext.designStyle}`)
    if (siteContext.primaryColor) lines.push(`Основний колір: ${siteContext.primaryColor}`)
    if (siteContext.secondaryColor) lines.push(`Додатковий колір: ${siteContext.secondaryColor}`)
    if (siteContext.theme) lines.push(`Тема: ${siteContext.theme}`)
    if (siteContext.structure) lines.push(`Структура: ${siteContext.structure}`)
    if (siteContext.extraWishes) lines.push(`Побажання: ${siteContext.extraWishes}`)
    if (siteContext.vercelUrl) lines.push(`URL сайту: ${siteContext.vercelUrl}`)
    if (lines.length) siteInfo = '\n\n## ПОТОЧНИЙ САЙТ\n' + lines.join('\n')
  }

  const discussPrompt = `Ти — дизайн-консультант веб-агентства Equator. Відповідай коротко (2-4 речення), українською.
${siteInfo}

Допомагай з:
- Вибір кольорів, шрифтів, компонування саме для цього сайту
- UX/UI поради враховуючи нішу та стиль клієнта
- Структура сайту
- Конкретні пропозиції

Давай поради саме в контексті цього конкретного сайту та бізнесу клієнта. Ти НЕ вносиш зміни — тільки консультуєш.
${historyContext}

Користувач: ${message}

Відповідай коротко і конкретно.`

  try {
    const output = await runClaudeChat(discussPrompt, { timeout: 60000 })
    respond(res, 200, { reply: output })
  } catch (err) {
    respond(res, 500, { error: err.message })
  }
}

// ─── Chat revision: async ───
async function handleChat(req, res, projectId) {
  const { message } = await parseBody(req)
  if (!message?.trim()) return respond(res, 400, { error: 'message required' })

  const projectDir = path.join(PROJECTS_DIR, projectId)
  if (!fs.existsSync(projectDir)) return respond(res, 404, { error: 'project not found' })

  const jobId = `${projectId}-chat-${Date.now()}`
  saveJob(jobId, { status: 'running', projectId, startedAt: Date.now() })

  // Read current App.jsx so the agent sees the ACTUAL current state
  let currentCode = ''
  try { currentCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8') }
  catch {}

  const chatPrompt = `
# КОНТЕКСТ
Ти — агент-конструктор сайтів Equator Agency.

## БЕЗПЕКА
⛔ Працюй ВИКЛЮЧНО в поточній папці проекту.
⛔ Заборонено: доступ поза проектом, батьківські директорії, системні команди, .env файли.
✅ Дозволено: файли в поточній папці, npm пакети локально, build/dev команди.

## ⚠️ КРИТИЧНО: ПРАВИЛА РЕДАГУВАННЯ
1. Нижче наведено АКТУАЛЬНИЙ код src/App.jsx — це єдине джерело правди.
2. Вноси ТІЛЬКИ ті зміни, які просить дизайнер. Не змінюй нічого іншого.
3. Використовуй інструмент Edit для точкових змін. НЕ перезаписуй весь файл через Write.
4. Якщо потрібно змінити багато місць — роби кілька Edit викликів, але кожен — точковий.
5. ЗАБОРОНЕНО генерувати файл з пам'яті. Працюй ТІЛЬКИ з кодом, наведеним нижче.

## ПОТОЧНИЙ КОД src/App.jsx
\`\`\`jsx
${currentCode}
\`\`\`

## ЗАПИТ ВІД ДИЗАЙНЕРА
${message}

## ЩО РОБИТИ
- Дизайн → редагуй src/App.jsx (використовуй Edit, не Write)
- Нові функції (Google Maps, слайдер) → встанови npm пакет і підключи
- Етап 2 (адмінка, Supabase, CRM, аналітика, SEO, Telegram) → підключи інтеграцію
- Після змін — підтверди що саме змінено (список конкретних змін)
`

  ;(async () => {
    try {
      const output = await runClaude(chatPrompt, {
        cwd: projectDir,
        maxTurns: 30,
        timeout: 900000,
        allowedTools: 'Read,Edit,Bash,Glob,Grep',
      })

      let generatedCode = ''
      try { generatedCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8') }
      catch {}

      // Commit changes so we have version history for rollbacks
      try {
        execSync('git add -A', { cwd: projectDir, stdio: 'pipe' })
        const commitMsg = message.slice(0, 100).replace(/"/g, '\\"')
        execSync(`git commit -m "edit: ${commitMsg}"`, { cwd: projectDir, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_NAME: 'bridge', GIT_COMMITTER_NAME: 'bridge', GIT_AUTHOR_EMAIL: 'bridge@equator.agency', GIT_COMMITTER_EMAIL: 'bridge@equator.agency' } })
      } catch (e) { console.error('Git commit error:', e.message) }

      // Save output before build so notifySupabase in buildAndDeploy can read it
      updateJob(jobId, { output })

      await buildAndDeploy(jobId, projectDir, generatedCode)

    } catch (err) {
      updateJob(jobId, { status: 'error', error: err.message, finishedAt: Date.now() })
      notifySupabase(projectId, { status: 'review' })
    }
  })()

  respond(res, 202, { jobId, status: 'running' })
}

// ─── Version history ───
function handleVersions(res, projectId) {
  const projectDir = path.join(PROJECTS_DIR, projectId)
  if (!fs.existsSync(projectDir)) return respond(res, 404, { error: 'project not found' })

  try {
    const log = execSync('git log --oneline --max-count=20', { cwd: projectDir, encoding: 'utf-8' })
    const versions = log.trim().split('\n').filter(Boolean).map(line => {
      const [hash, ...rest] = line.split(' ')
      return { hash, message: rest.join(' ') }
    })
    respond(res, 200, { versions })
  } catch {
    respond(res, 200, { versions: [], note: 'no git history (project created before versioning)' })
  }
}

// ─── Rollback ───
async function handleRollback(req, res, projectId) {
  const projectDir = path.join(PROJECTS_DIR, projectId)
  if (!fs.existsSync(projectDir)) return respond(res, 404, { error: 'project not found' })

  const { commit } = await parseBody(req)
  const target = commit || 'HEAD~1'  // default: one step back

  const jobId = `${projectId}-chat-${Date.now()}`
  saveJob(jobId, { status: 'running', projectId, startedAt: Date.now() })

  ;(async () => {
    try {
      // Restore files from target commit
      execSync(`git checkout ${target} -- .`, { cwd: projectDir, stdio: 'pipe' })
      execSync('git add -A', { cwd: projectDir, stdio: 'pipe' })
      execSync(`git commit -m "rollback to ${target}"`, { cwd: projectDir, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_NAME: 'bridge', GIT_COMMITTER_NAME: 'bridge', GIT_AUTHOR_EMAIL: 'bridge@equator.agency', GIT_COMMITTER_EMAIL: 'bridge@equator.agency' } })

      let generatedCode = ''
      try { generatedCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8') }
      catch {}

      updateJob(jobId, { output: `Rolled back to ${target}` })
      await buildAndDeploy(jobId, projectDir, generatedCode)
    } catch (err) {
      updateJob(jobId, { status: 'error', error: err.message, finishedAt: Date.now() })
      notifySupabase(projectId, { status: 'review' })
    }
  })()

  respond(res, 202, { jobId, status: 'running', rollbackTo: target })
}

// ─── Snapshot (manual save) ───
async function handleSnapshot(req, res, projectId) {
  const projectDir = path.join(PROJECTS_DIR, projectId)
  if (!fs.existsSync(projectDir)) return respond(res, 404, { error: 'project not found' })

  const { label } = await parseBody(req)
  const commitMsg = `snapshot: ${(label || 'manual save').slice(0, 100)}`

  try {
    // Init git if not exists
    if (!fs.existsSync(path.join(projectDir, '.git'))) {
      execSync('git init', { cwd: projectDir, stdio: 'pipe' })
    }
    execSync('git add -A', { cwd: projectDir, stdio: 'pipe' })
    execSync(`git commit --allow-empty -m "${commitMsg.replace(/"/g, '\\"')}"`, {
      cwd: projectDir, stdio: 'pipe',
      env: { ...process.env, GIT_AUTHOR_NAME: 'bridge', GIT_COMMITTER_NAME: 'bridge', GIT_AUTHOR_EMAIL: 'bridge@equator.agency', GIT_COMMITTER_EMAIL: 'bridge@equator.agency' },
    })
    const hash = execSync('git rev-parse --short HEAD', { cwd: projectDir, encoding: 'utf-8' }).trim()
    respond(res, 200, { status: 'saved', hash, message: commitMsg })
  } catch (err) {
    respond(res, 500, { error: err.message })
  }
}

// ─── Job status ───
function handleJobStatus(res, jobId) {
  const job = loadJob(jobId)
  if (!job) return respond(res, 404, { error: 'job not found' })
  respond(res, 200, job)
}

// ─── Health check ───
function handleHealth(res) {
  respond(res, 200, { status: 'ok', uptime: process.uptime() })
}

// ─── HTTP Server ───
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (!auth(req)) return respond(res, 401, { error: 'unauthorized' })

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname

  try {
    if (pathname === '/health') return handleHealth(res)
    if (req.method === 'POST' && pathname === '/parse-brief') return await handleParseBrief(req, res)
    if (req.method === 'POST' && pathname === '/generate-site') return await handleGenerateSite(req, res)

    const discussMatch = pathname.match(/^\/discuss\/([a-f0-9-]+)$/)
    if (req.method === 'POST' && discussMatch) return await handleDiscuss(req, res, discussMatch[1])

    const chatMatch = pathname.match(/^\/chat\/([a-f0-9-]+)$/)
    if (req.method === 'POST' && chatMatch) return await handleChat(req, res, chatMatch[1])

    const versionsMatch = pathname.match(/^\/versions\/([a-f0-9-]+)$/)
    if (req.method === 'GET' && versionsMatch) return handleVersions(res, versionsMatch[1])

    const rollbackMatch = pathname.match(/^\/rollback\/([a-f0-9-]+)$/)
    if (req.method === 'POST' && rollbackMatch) return await handleRollback(req, res, rollbackMatch[1])

    const snapshotMatch = pathname.match(/^\/snapshot\/([a-f0-9-]+)$/)
    if (req.method === 'POST' && snapshotMatch) return await handleSnapshot(req, res, snapshotMatch[1])

    const jobMatch = pathname.match(/^\/job\/([a-f0-9-]+(?:-chat-\d+)?)$/)
    if (req.method === 'GET' && jobMatch) return handleJobStatus(res, jobMatch[1])

    respond(res, 404, { error: 'not found' })
  } catch (err) {
    console.error('Server error:', err)
    respond(res, 500, { error: err.message })
  }
})

// ─── Start ───
recoverOrphanedJobs()

server.listen(PORT, () => {
  console.log(`Bridge running on :${PORT} | Jobs dir: ${JOBS_DIR}`)
})
