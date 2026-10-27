import { contextBridge, ipcRenderer } from "electron";
//#region electron/preload.ts
console.log("🔌 Preload script loaded");
contextBridge.exposeInMainWorld("electronAPI", {
	showNotification: (title, body) => {
		console.log("📤 Sending notification from renderer:", title, body);
		ipcRenderer.send("show-notification", {
			title,
			body
		});
	},
	getVersion: () => {
		return process.env.npm_package_version || "1.0.0";
	}
});
//#endregion
export {};
