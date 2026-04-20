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
      }
    } catch {}
  }
}

async function buildAndDeploy(jobId, projectDir, generatedCode) {
  let vercelUrl = null
  try {
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
  console.log(`Job ${jobId} recovered → ${vercelUrl || 'no deploy URL'}`)
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
  const { cwd, maxTurns, timeout } = options
  const args = [
    '-p', prompt,
    '--output-format', 'text',
    '--dangerously-skip-permissions',
    '--verbose',
  ]
  if (maxTurns) args.push('--max-turns', String(maxTurns))

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const proc = spawn('claude', args, {
      cwd: cwd || process.cwd(),
      timeout: timeout || 300000,
      env: { ...process.env, FORCE_COLOR: '0' },
    })
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

  // Vercel config: disable SSO protection + allow iframe embedding
  fs.writeFileSync(path.join(projectDir, 'vercel.json'), JSON.stringify({
    headers: [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" }
        ]
      }
    ],
    oidcTokenConfig: { enabled: false }
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

      // Build & deploy
      await buildAndDeploy(jobId, projectDir, generatedCode)

      // Update output
      const job = loadJob(jobId)
      if (job) updateJob(jobId, { output })

    } catch (err) {
      updateJob(jobId, { status: 'error', error: err.message, finishedAt: Date.now() })
    }
  })()

  respond(res, 202, { jobId, status: 'running' })
}

// ─── Chat revision: async ───
async function handleChat(req, res, projectId) {
  const { message } = await parseBody(req)
  if (!message?.trim()) return respond(res, 400, { error: 'message required' })

  const projectDir = path.join(PROJECTS_DIR, projectId)
  if (!fs.existsSync(projectDir)) return respond(res, 404, { error: 'project not found' })

  const jobId = `${projectId}-chat-${Date.now()}`
  saveJob(jobId, { status: 'running', projectId, startedAt: Date.now() })

  const chatPrompt = `
# КОНТЕКСТ
Ти — агент-конструктор сайтів Equator Agency.

## БЕЗПЕКА
⛔ Працюй ВИКЛЮЧНО в поточній папці проекту.
⛔ Заборонено: доступ поза проектом, батьківські директорії, системні команди, .env файли.
✅ Дозволено: файли в поточній папці, npm пакети локально, build/dev команди.

## ЗАПИТ ВІД ДИЗАЙНЕРА
${message}

## ЩО РОБИТИ
- Дизайн → редагуй src/App.jsx
- Нові функції (Google Maps, слайдер) → встанови npm пакет і підключи
- Етап 2 (адмінка, Supabase, CRM, аналітика, SEO, Telegram) → підключи інтеграцію
- Після змін — підтверди що змінено
`

  ;(async () => {
    try {
      const output = await runClaude(chatPrompt, {
        cwd: projectDir,
        maxTurns: 15,
        timeout: 600000,
      })

      let generatedCode = ''
      try { generatedCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8') }
      catch {}

      await buildAndDeploy(jobId, projectDir, generatedCode)
      const job = loadJob(jobId)
      if (job) updateJob(jobId, { output })

    } catch (err) {
      updateJob(jobId, { status: 'error', error: err.message, finishedAt: Date.now() })
    }
  })()

  respond(res, 202, { jobId, status: 'running' })
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

    const chatMatch = pathname.match(/^\/chat\/([a-f0-9-]+)$/)
    if (req.method === 'POST' && chatMatch) return await handleChat(req, res, chatMatch[1])

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
