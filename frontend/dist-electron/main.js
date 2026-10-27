import { BrowserWindow, Notification, app, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
//#region electron/main.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true
		}
	});
	win.loadURL("http://localhost:5173");
	win.webContents.openDevTools();
}
ipcMain.on("show-notification", (event, { title, body }) => {
	console.log("🔔 System notification:", title, body);
	if (Notification.isSupported()) {
		const notification = new Notification({
			title: title || "Tempo",
			body: body || "",
			icon: path.join(__dirname, "../assets/icon.png"),
			silent: false
		});
		notification.show();
		notification.on("click", () => {
			console.log("Notification clicked");
			const windows = BrowserWindow.getAllWindows();
			if (windows.length > 0) {
				windows[0].show();
				windows[0].focus();
			}
		});
	} else console.log("⚠️ Notifications not supported on this platform");
});
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
//#endregion
export {};
