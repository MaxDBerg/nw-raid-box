import { app, BrowserWindow, ipcMain } from "electron/main";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { activeWindow } from "get-windows";
import zmq from "zeromq";

let win;
let gameActive = false;
const os = process.platform;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gameProcessName = "VLC media player"; // macOS/Linux: Process name of the game
const sock = new zmq.Request();

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
	sock.connect("tcp://127.0.0.1:5555");
	console.log("Publisher bound to port 5555");
	win = createWindow();
	win.setIgnoreMouseEvents(true, { forward: true });
	setInterval(checkFocus, 1000);
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.setIgnoreMouseEvents(ignore, options);
});

const checkFocus = async () => {
	try {
		const currentWindow = await checkActiveWindow();
		//console.log(currentWindow);
		if (currentWindow.owner.name === gameProcessName || currentWindow.owner.name === "Electron") {
			if (!gameActive) {
				gameActive = true;
				win.webContents.send("is-game", true);
				await handleZMQCommand("start");
			}
			console.log("Game is open. Displaying overlay...");
		} else {
			if (gameActive) {
				gameActive = false;
				win.webContents.send("is-game", false);
				await handleZMQCommand("stop");
			}
			console.log("Game is not open. Hiding overlay...");
		}
	} catch (error) {
		console.error("Error checking game state:", error);
	}
};

const handleZMQCommand = async (command, retries = 3) => {
	let attempts = 0;
	while (attempts < retries) {
		try {
			await sock.send([command]);
			const result = await receiveWithTimeout(1000);
			console.log(`Received: ${result}`);
			return result; // Success, return the result
		} catch (error) {
			attempts++;
			console.error(`Attempt ${attempts} failed:`, error);
		}
	}
	console.error(`Failed to send ZMQ command '${command}' after ${retries} attempts`);
};

const receiveWithTimeout = (timeout) => {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error("ZMQ response timed out"));
		}, timeout);

		sock.receive()
			.then((result) => {
				clearTimeout(timer); // Clear timeout if result is received
				resolve(result);
			})
			.catch((error) => {
				clearTimeout(timer); // Clear timeout on error
				reject(error);
			});
	});
};

async function checkActiveWindow() {
	if (os === "win32") {
		return await activeWindow();
	}
}
