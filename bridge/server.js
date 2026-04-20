#!/usr/bin/env node

/**
 * Bridge Server — HTTP API that spawns Claude Code CLI
 * Runs on the same machine where Claude Code is installed.
 * Super-admin (Vercel) calls this server to use Claude via subscription.
 *
 * Endpoints:
 *   POST /parse-brief   — sync: parse free text into form fields
 *   POST /generate-site  — async: start site generation, returns jobId
 *   POST /chat/:id       — async: send revision to existing project
 *   GET  /job/:id        — check job status
 *
 * Auth: Bearer token via BRIDGE_SECRET env var
 */

const http = require('http')
const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = process.env.BRIDGE_PORT || 3001
const SECRET = process.env.BRIDGE_SECRET || 'equator-bridge-secret-change-me'
const PROJECTS_DIR = path.join(__dirname, '..', 'tmp-sites')

// In-memory job store
const jobs = new Map()

// Ensure tmp-sites exists
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true })
}

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
  const header = req.headers.authorization || ''
  return header === `Bearer ${SECRET}`
}

function respond(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ─── Run claude CLI and capture output ───
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
      timeout: timeout || 300000, // 5 min default
      env: { ...process.env, FORCE_COLOR: '0' },
    })

    proc.stdout.on('data', d => { stdout += d.toString() })
    proc.stderr.on('data', d => { stderr += d.toString() })

    proc.on('close', code => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(`claude exited ${code}: ${stderr || stdout}`))
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
    `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`
  )

  fs.writeFileSync(path.join(projectDir, 'index.html'),
    `<!DOCTYPE html>\n<html lang="uk">\n<head>\n<meta charset="UTF-8"/>\n<meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n<title>${formData?.companyName || 'Site'}</title>\n</head>\n<body style="margin:0"><div id="root"></div>\n<script type="module" src="/src/main.jsx"></script>\n</body>\n</html>\n`
  )

  fs.writeFileSync(path.join(projectDir, 'src', 'main.jsx'),
    `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)\n`
  )

  // Start async job
  const jobId = projectId
  jobs.set(jobId, { status: 'running', startedAt: Date.now(), output: '', error: null })

  // Run in background
  ;(async () => {
    try {
      // Step 1: Generate site
      const output = await runClaude(prompt, {
        cwd: projectDir,
        maxTurns: 30,
        timeout: 900000, // 15 min
      })

      // Step 2: Read generated code
      let generatedCode = ''
      try {
        generatedCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8')
      } catch {
        const srcFiles = fs.readdirSync(path.join(projectDir, 'src')).filter(f => f.endsWith('.jsx'))
        if (srcFiles.length > 0) {
          generatedCode = fs.readFileSync(path.join(projectDir, 'src', srcFiles[0]), 'utf-8')
        }
      }

      // Step 3: Build & deploy
      let vercelUrl = null
      try {
        execSync('npm install', { cwd: projectDir, timeout: 60000 })
        execSync('npx vite build', { cwd: projectDir, timeout: 60000 })
        const deployOutput = execSync(
          'npx --yes vercel deploy --prod --yes 2>&1',
          { cwd: projectDir, timeout: 120000, encoding: 'utf-8' }
        )
        const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/)
        if (urlMatch) vercelUrl = urlMatch[0]
      } catch (buildErr) {
        console.error('Build/deploy error:', buildErr.message)
      }

      jobs.set(jobId, {
        status: 'done',
        output,
        generatedCode,
        vercelUrl,
        finishedAt: Date.now(),
        error: null,
      })
    } catch (err) {
      jobs.set(jobId, {
        status: 'error',
        error: err.message,
        finishedAt: Date.now(),
      })
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
  jobs.set(jobId, { status: 'running', startedAt: Date.now() })

  const chatPrompt = `
# КОНТЕКСТ
Ти — агент-конструктор сайтів Equator Agency. Ти працюєш над сайтом клієнта.

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
        timeout: 600000, // 10 min
      })

      let generatedCode = ''
      try {
        generatedCode = fs.readFileSync(path.join(projectDir, 'src', 'App.jsx'), 'utf-8')
      } catch {}

      // Rebuild & redeploy
      let vercelUrl = null
      try {
        execSync('npx vite build', { cwd: projectDir, timeout: 60000 })
        const deployOutput = execSync(
          'npx --yes vercel deploy --prod --yes 2>&1',
          { cwd: projectDir, timeout: 120000, encoding: 'utf-8' }
        )
        const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/)
        if (urlMatch) vercelUrl = urlMatch[0]
      } catch {}

      jobs.set(jobId, {
        status: 'done',
        output,
        generatedCode,
        vercelUrl,
        finishedAt: Date.now(),
      })
    } catch (err) {
      jobs.set(jobId, { status: 'error', error: err.message, finishedAt: Date.now() })
    }
  })()

  respond(res, 202, { jobId, status: 'running' })
}

// ─── Job status ───
function handleJobStatus(res, jobId) {
  const job = jobs.get(jobId)
  if (!job) return respond(res, 404, { error: 'job not found' })
  respond(res, 200, job)
}

// ─── HTTP Server ───
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // Auth
  if (!auth(req)) return respond(res, 401, { error: 'unauthorized' })

  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname

  try {
    if (req.method === 'POST' && pathname === '/parse-brief') {
      return await handleParseBrief(req, res)
    }
    if (req.method === 'POST' && pathname === '/generate-site') {
      return await handleGenerateSite(req, res)
    }
    // POST /chat/:projectId
    const chatMatch = pathname.match(/^\/chat\/([a-f0-9-]+)$/)
    if (req.method === 'POST' && chatMatch) {
      return await handleChat(req, res, chatMatch[1])
    }
    // GET /job/:jobId
    const jobMatch = pathname.match(/^\/job\/([a-f0-9-]+(?:-chat-\d+)?)$/)
    if (req.method === 'GET' && jobMatch) {
      return handleJobStatus(res, jobMatch[1])
    }

    respond(res, 404, { error: 'not found' })
  } catch (err) {
    console.error('Server error:', err)
    respond(res, 500, { error: err.message })
  }
})

server.listen(PORT, () => {
  console.log(`🌉 Bridge server running on http://localhost:${PORT}`)
  console.log(`   Projects dir: ${PROJECTS_DIR}`)
  console.log(`   Auth: Bearer token required`)
})
