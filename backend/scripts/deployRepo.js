import { Client } from 'ssh2';

const SSH_CONFIG = {
  host: '206.189.142.175',
  port: 22,
  username: 'hcfinvest',
  password: 'pune@N!lesh$2025'
};

const REMOTE_BASE = '/home/hcfinvest/hcfinvest';

const conn = new Client();

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => errOut += d);
      stream.on('close', (code) => {
        if (code === 0) resolve(out);
        else reject(new Error(`Command failed [${code}]: ${errOut || out}`));
      });
    });
  });
}

conn.on('ready', async () => {
  console.log('✅ SSH Connected for Repo Update');

  try {
    // 1. Fetch and Reset (to clear manual SSH uploads)
    console.log('\n📥 Syncing with GitHub (Resetting local changes)...');
    await runCommand(`cd ${REMOTE_BASE} && git fetch origin Production && git reset --hard origin/Production`);
    console.log('✅ Git Sync Successful');

    // 2. Backend Restart
    console.log('\n🔄 Restarting Backend (PM2)...');
    await runCommand('pm2 restart all');
    console.log('✅ Backend Restarted');

    // 3. Frontend Build (Optional but recommended for UI changes)
    console.log('\n🏗️  Building Frontend UI (Vite)...');
    const buildCmd = `cd ${REMOTE_BASE}/frontend && npm install && npm run build`;
    await runCommand(buildCmd);
    console.log('✅ Frontend Rebuild Successful');

    console.log('\n🚀 DEPLOYMENT VIA REPO COMPLETE!');
  } catch (err) {
    console.error(`\n❌ Deployment Failed: ${err.message}`);
  } finally {
    conn.end();
  }
});

conn.on('error', err => {
  console.error(`\n❌ SSH Connection Error: ${err.message}`);
});

conn.connect(SSH_CONFIG);
