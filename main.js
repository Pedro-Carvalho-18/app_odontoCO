const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const fs = require('fs');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {

let nextProcess;
let mainWindow;

function ensureDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  const dbPath = path.join(dbDir, 'app_odonto.sqlite');

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    // Copiar o banco inicial que vem no pacote
    const sourceDbPath = path.join(__dirname, 'database', 'app_odonto.sqlite');
    
    if (fs.existsSync(sourceDbPath)) {
      try {
        const data = fs.readFileSync(sourceDbPath);
        fs.writeFileSync(dbPath, data);
      } catch (err) {
        console.error("Erro ao copiar banco de dados inicial:", err);
      }
    }
  }

  return dbPath;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'Imagens', 'AppLogo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);
  
  // Ocultar menu padrão
  mainWindow.setMenuBarVisibility(false);
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  const dbPath = ensureDatabase();
  
  const isDev = !app.isPackaged;
  
  if (!isDev) {
    const standaloneDir = path.join(process.resourcesPath, 'standalone');
    const serverPath = path.join(standaloneDir, 'server.js');
    
    // Encontrar uma porta livre dinamicamente para evitar erro EADDRINUSE
    const net = require('net');
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => {
        startNextJs(standaloneDir, serverPath, dbPath, port);
      });
    });
    
  } else {
    // Modo dev
    const opts = { resources: ['http://127.0.0.1:3000'], timeout: 30000 };
    waitOn(opts).then(() => createWindow(3000)).catch(err => {
      dialog.showErrorBox('Erro', `Falha ao conectar no servidor de desenvolvimento: ${err.message}`);
      app.quit();
    });
  }
});

function startNextJs(standaloneDir, serverPath, dbPath, port) {
    const extraNodeModules = path.join(standaloneDir, 'next_modules');
    nextProcess = spawn(process.execPath, [serverPath], {
      env: { 
        ...process.env, 
        ELECTRON_RUN_AS_NODE: '1',
        NODE_PATH: extraNodeModules,
        PORT: port.toString(), 
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        DATABASE_URL: dbPath
      },
      cwd: standaloneDir,
      detached: false,
      shell: false
    });
    
    let errorLog = '';
    let isReady = false;
    
    nextProcess.stdout.on('data', (data) => {
      const str = data.toString();
      console.log(`Next.js: ${str}`);
      // Detecta quando o Next.js está pronto ao invés de usar wait-on, que as vezes falha com IPv6/localhost
      if (!isReady && (str.toLowerCase().includes('ready') || str.toLowerCase().includes('started server') || str.toLowerCase().includes('listening on'))) {
        isReady = true;
        createWindow(port);
      }
    });
    
    nextProcess.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
      errorLog += data.toString();
    });
    
    nextProcess.on('close', (code) => {
      if (code !== 0 && !isReady) {
        dialog.showErrorBox('Erro no Servidor', `O servidor local parou com erro (código ${code}):\n\n${errorLog}`);
        app.quit();
      }
    });
}

// Limpeza segura do processo filho quando o app for fechar (evita processos fantasmas)
app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
    nextProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

} // end else
