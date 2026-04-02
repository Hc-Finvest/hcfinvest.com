import { Client } from 'ssh2'

const conn = new Client()

function run(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err)
      let out = ''
      stream.on('data', d => out += d)
      stream.stderr.on('data', d => out += d)
      stream.on('close', () => resolve(out.trim()))
    })
  })
}

conn.on('ready', async () => {
  console.log('✅ Connected\n')

  try {
    console.log('=== .env locations ===')
    const envFiles = await run('find /home/hcfinvest -name ".env" 2>/dev/null')
    console.log(envFiles || 'none found')

    console.log('\n=== Home directory ===')
    const homeDir = await run('ls -la /home/hcfinvest/')
    console.log(homeDir)

    console.log('\n=== hcfinvest subdirs ===')
    const appDir = await run('ls /home/hcfinvest/hcfinvest/ 2>/dev/null || echo NOT_FOUND')
    console.log(appDir)

    console.log('\n=== PM2 list ===')
    const pm2 = await run('pm2 list --no-color')
    console.log(pm2)

    console.log('\n=== backend_env_production ===')
    const prodEnv = await run('cat /home/hcfinvest/backend_env_production 2>/dev/null | head -30')
    console.log(prodEnv)

  } catch (e) {
    console.error('Error:', e.message)
  }

  conn.end()
})

conn.on('error', e => { console.error('SSH error:', e.message); process.exit(1) })

conn.connect({
  host: '206.189.142.175',
  port: 22,
  username: 'hcfinvest',
  password: 'pune@N!lesh$2025'
})
