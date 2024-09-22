const { ipcRenderer } = require("electron");

let isEditModeEnabled = false;

if (!isEditModeEnabled) {
}

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
		if (isEditModeEnabled) {
			isEditModeEnabled = false;
			overlayEl.classList.add("not-visible");
		} else {
			isEditModeEnabled = true;
			overlayEl.classList.remove("not-visible");
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
