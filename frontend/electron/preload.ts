import { contextBridge, ipcRenderer } from 'electron';

console.log('🔌 Preload script loaded');

// Безопасно выставляем API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
    // Показать системное уведомление
    showNotification: (title: string, body: string) => {
        console.log('📤 Sending notification from renderer:', title, body);
        ipcRenderer.send('show-notification', { title, body });
    },

    // Получить версию (опционально)
    getVersion: () => {
        return process.env.npm_package_version || '1.0.0';
    },
});

// Добавляем тип для TypeScript (чтобы не было ошибок)
declare global {
    interface Window {
        electronAPI: {
            showNotification: (title: string, body: string) => void;
            getVersion: () => string;
        };
    }
}