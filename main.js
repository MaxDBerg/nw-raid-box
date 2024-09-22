import { app, BrowserWindow, ipcMain } from "electron/main";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { activeWindow } from "get-windows";

let win;
const os = process.platform;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gameProcessName = "valheim.exe"; // macOS/Linux: Process name of the game

const createWindow = () => {
	const win = new BrowserWindow({
		title: "raid-box",
		acceptFirstMouse: true,
		alwaysOnTop: true,
		closable: true,
		frame: false,
		fullscreen: true,
		hasShadow: false,
		maximizable: false,
		minimizable: false,
		resizable: false,
		skipTaskbar: false,
		transparent: true,
		useContentSize: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
	});
	win.openDevTools({ mode: "detach" });

	win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	win.setAlwaysOnTop(true, "screen-saver", 1);
	win.setFullScreenable(false);

	win.loadFile("./src/index.html");
	return win;
};

if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.whenReady().then(() => {
	const win = createWindow();
	win.setIgnoreMouseEvents(true, { forward: true });
	setInterval(async () => {
		try {
			const currentWindow = await checkActiveWindow();
			console.log(currentWindow);
			if (currentWindow.owner.name === gameProcessName || currentWindow.owner.name === "Electron") {
				win.webContents.send("is-game", true);
				console.log("Game is open. Displaying overlay...");
			} else {
				win.webContents.send("is-game", false);
				console.log("Game is not open. Hiding overlay...");
			}
		} catch (error) {
			console.error("Error checking game state:", error);
		}
	}, 1000);
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.setIgnoreMouseEvents(ignore, options);
});

async function checkActiveWindow() {
	if (os === "win32") {
		return await activeWindow();
	}
}
