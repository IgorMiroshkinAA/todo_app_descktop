import { app, BrowserWindow, Menu, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'), // Включаем preload
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Убираем стандартное меню
  // Menu.setApplicationMenu(null);

  // Загружаем dev-сервер в разработке
  win.loadURL('http://localhost:5173');

  // Открываем DevTools для отладки
  win.webContents.openDevTools();
}

// Обработчик для системных уведомлений
ipcMain.on('show-notification', (event, { title, body }) => {
  console.log('🔔 System notification:', title, body);

  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title || 'Tempo',
      body: body || '',
      icon: path.join(__dirname, '../assets/icon.png'), // Опционально: иконка
      silent: false,
    });
    notification.show();

    // Обработка клика по уведомлению
    notification.on('click', () => {
      console.log('Notification clicked');
      // Можно активировать окно при клике
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].show();
        windows[0].focus();
      }
    });
  } else {
    console.log('⚠️ Notifications not supported on this platform');
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});