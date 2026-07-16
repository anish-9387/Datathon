const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
const serverPath = path.join(__dirname, 'apps', 'web', '.next', 'standalone', 'server.js');

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT) },
});

process.on('SIGTERM', () => server.kill('SIGTERM'));
server.on('exit', (code) => process.exit(code ?? 1));
