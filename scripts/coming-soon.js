#!/usr/bin/env node
/**
 * Toggle Coming Soon mode in src/App.jsx
 * Usage:
 *   npm run coming-soon:on   →  enables  Coming Soon gate
 *   npm run coming-soon:off  →  disables Coming Soon gate (go live)
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mode = process.argv[2]
if (!['on', 'off'].includes(mode)) {
  console.error('Usage: node scripts/coming-soon.js [on|off]')
  process.exit(1)
}

const appPath = join(__dirname, '../src/App.jsx')
const content = readFileSync(appPath, 'utf8')

const updated = content.replace(
  /const COMING_SOON = (true|false)/,
  `const COMING_SOON = ${mode === 'on'}`
)

if (!/const COMING_SOON = (true|false)/.test(content)) {
  console.error('❌  Could not find "const COMING_SOON = ..." in src/App.jsx')
  process.exit(1)
}

writeFileSync(appPath, updated)

if (mode === 'on') {
  console.log('✅  Coming Soon mode ENABLED  (COMING_SOON = true)')
  console.log('    Redeploy / restart the dev server to apply.')
} else {
  console.log('✅  Coming Soon mode DISABLED  (COMING_SOON = false)')
  console.log('    Redeploy / restart the dev server to go live.')
}
