import { app, BrowserWindow, ipcMain } from "electron/main";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { activeWindow } from "get-windows";
import zmq from "zeromq";

let win;
let gameActive = false;
let receivingData = false;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gameProcessName = "NewWorld.exe"; // macOS/Linux: Process name of the game
let commandSocket = new zmq.Request();
let dataSocket = new zmq.Pull();
commandSocket.linger = 0;

commandSocket.connect("tcp://127.0.0.1:5555");
console.log("Publisher bound to port 5555");
dataSocket.connect("tcp://127.0.0.1:5556");
console.log("Receiver bound to port 5556");

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
	win.setIgnoreMouseEvents(true, { forward: true });

	win.loadFile("./src/index.html");
	return win;
};

if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	win.setIgnoreMouseEvents(ignore, options);
});

app.whenReady().then(() => {
	win = createWindow();
	checkGameStatusLoop();
	dataListeningLoop();
});

async function checkGameStatusLoop() {
	setInterval(async () => {
		try {
			const currentWindow = await checkActiveWindow();

			if (["NewWorld.exe", "VLC media player", "Electron"].includes(currentWindow.owner.name)) {
				if (!gameActive) {
					gameActive = true;
					win.webContents.send("is-game", true);
					console.log("Game is active. Starting data reception...");
					await handleZMQCommand(["start"]);
					receivingData = true;
				}
			} else {
				if (gameActive) {
					gameActive = false;
					win.webContents.send("is-game", false);
					console.log("Game is not active. Stopping data reception...");
					await handleZMQCommand(["stop"]);
					receivingData = false;
				}
			}
		} catch (error) {
			console.log("Something went very wrong!");
			console.log(error);
		}
	}, 1000);
}

async function dataListeningLoop() {
	setInterval(async () => {
		if (receivingData) {
			try {
				const [message] = await dataSocket.receive();
				win.webContents.send("python-data", message);
			} catch (error) {
				try {
					dataSocket.close();
				} catch (closeError) {
					console.error("Error closing the data socket");
				}

				dataSocket = new zmq.Pull();
				dataSocket.connect("tcp://127.0.0.1:5556");
			}
		}
	}, 50);
}

const handleZMQCommand = async (command) => {
	try {
		await commandSocket.send([command]);
		let result = await receiveWithTimeout(1000);
		console.log(`Received: ${result}`);
		return result;
	} catch (error) {
		console.error(`Failed to send ZMQ command '${command}'!`);

		try {
			commandSocket.close();
		} catch (closeError) {
			console.error("Error closing the command socket:");
		}

		commandSocket = new zmq.Request();
		commandSocket.linger = 0;
		commandSocket.connect("tcp://127.0.0.1:5555");
	}
};

const receiveWithTimeout = (timeout) => {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error("ZMQ response timed out"));
		}, timeout);

		commandSocket
			.receive()
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
	if (process.platform === "win32") {
		return await activeWindow();
	}
}
