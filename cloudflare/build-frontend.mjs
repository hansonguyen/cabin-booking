import { spawnSync } from 'node:child_process'

const result = spawnSync('npm', ['run', 'build'], {
  cwd: new URL('../frontend/', import.meta.url),
  env: { ...process.env, NEXT_PUBLIC_SHARED_BACKEND: '1' },
  stdio: 'inherit',
  shell: process.platform === 'win32'
})
process.exit(result.status ?? 1)
