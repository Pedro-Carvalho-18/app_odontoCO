const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

let nextProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'Imagens', 'AppIcone.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadURL('http://localhost:3000');
  
  // Ocultar menu padrão
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  // Iniciar o Next.js em modo produção se estiver empacotado, ou dev se não
  const isDev = !app.isPackaged;
  
  if (!isDev) {
    // No ambiente empacotado, assumimos que o usuário rodou o build e o start
    // Para simplificar esta primeira versão, vamos rodar o `npm start`
    nextProcess = spawn('npm.cmd', ['start'], {
      cwd: process.cwd(),
      detached: false,
      shell: true
    });
  } else {
    // Em dev não precisamos spawnar aqui pois usaremos concurrently
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
