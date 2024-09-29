const { ipcRenderer } = require("electron");

let isEditModeEnabled = false;

if (!isEditModeEnabled) {
}

function updateHealthBar(playerId, healthPercent) {
	const healthBar = document.getElementById(`${playerId}-health`);
	const healthPercentElement = document.getElementById(`${playerId}-percent`);
	healthBar.style.width = `${healthPercent}%`;
	healthPercentElement.innerText = `${healthPercent}%`;
}

ipcRenderer.on("parser-data", (event, data) => {
	updateHealthBar("player1", data[0]);
	updateHealthBar("player2", data[1]);
	updateHealthBar("player3", data[2]);
	updateHealthBar("player4", data[3]);
	updateHealthBar("player5", data[4]);
});

window.addEventListener("DOMContentLoaded", () => {
	ipcRenderer.on("is-game", (_event, value) => {
		const bodyEl = document.body;
		console.log("What is the value? " + value);
		if (value) {
			bodyEl.classList.remove("not-visible");
		}
		if (!value) {
			bodyEl.classList.add("not-visible");
		}
	});
	const el = document.getElementById("editModeToggleElement");
	el.addEventListener("click", () => {
		const overlayEl = document.getElementById("editModeBlur");
		const selectorElement = document.getElementById("raid-container-selector");
		if (isEditModeEnabled) {
			isEditModeEnabled = false;
			overlayEl.classList.add("not-visible");
			selectorElement.classList.add("not-visible");
		} else {
			isEditModeEnabled = true;
			overlayEl.classList.remove("not-visible");
			selectorElement.classList.remove("not-visible");
		}
	});
	el.addEventListener("mouseenter", () => {
		if (!isEditModeEnabled) {
			console.log("Mouse entered");
			ipcRenderer.send("set-ignore-mouse-events", false);
		}
	});
	el.addEventListener("mouseleave", () => {
		if (!isEditModeEnabled) {
			console.log("Mouse left");
			ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
		}
	});
});
