const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const fs = require('fs');

let nextProcess;

function ensureDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  const dbPath = path.join(dbDir, 'app_odonto.sqlite');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    // Copiar o banco inicial que vem no pacote
    const sourceDbPath = app.isPackaged 
      ? path.join(__dirname, '.next', 'standalone', 'database', 'app_odonto.sqlite')
      : path.join(__dirname, 'database', 'app_odonto.sqlite');
    
    if (fs.existsSync(sourceDbPath)) {
      fs.copyFileSync(sourceDbPath, dbPath);
    }
  }

  return dbPath;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'Imagens', 'AppIcone.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Necessário para alguns scripts antigos se houver
    },
  });

  win.loadURL('http://localhost:3000');
  
  // Ocultar menu padrão
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  const dbPath = ensureDatabase();
  
  // Iniciar o Next.js em modo produção se estiver empacotado, ou dev se não
  const isDev = !app.isPackaged;
  
  if (!isDev) {
    // No ambiente empacotado, usamos o standalone server.js
    const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');
    
    // Usamos o próprio executável do Electron para rodar o node
    nextProcess = spawn(process.execPath, [serverPath], {
      env: { 
        ...process.env, 
        ELECTRON_RUN_AS_NODE: '1',
        PORT: '3000', 
        NODE_ENV: 'production',
        HOSTNAME: 'localhost',
        DATABASE_URL: dbPath
      },
      cwd: path.join(__dirname, '.next', 'standalone'),
      detached: false,
      shell: false
    });
    
    nextProcess.stdout.on('data', (data) => console.log(`Next.js: ${data}`));
    nextProcess.stderr.on('data', (data) => console.error(`Next.js Error: ${data}`));
  }

  // Esperar o servidor Next.js subir antes de abrir a janela
  const opts = {
    resources: ['http://localhost:3000'],
    timeout: 30000,
  };

  waitOn(opts)
    .then(() => {
      createWindow();
    })
    .catch((err) => {
      console.error('Erro ao esperar pelo servidor:', err);
    });
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    // Tentar matar o processo do Next.js ao fechar o Electron
    const { exec } = require('child_process');
    exec(`taskkill /pid ${nextProcess.pid} /T /F`);
  }
  if (process.platform !== 'darwin') app.quit();
});
