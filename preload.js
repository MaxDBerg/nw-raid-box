const { ipcRenderer } = require("electron");

let isEditModeEnabled = false;

if (!isEditModeEnabled) {
}

function updateHealthBarImage(playerObject, playerId) {
	const imgElement = document.getElementById("health-bar" + playerId);
	imgElement.src = `data:image/png;base64,${playerObject.image}`;
	const percentElement = document.getElementById("player" + playerId + "-percent");
	percentElement.innerText = playerObject.health;
}

ipcRenderer.on("python-data", (event, dataBuffer) => {
	const decoder = new TextDecoder("utf-8"); // Create a new TextDecoder
	const dataString = decoder.decode(dataBuffer); // Decode Uint8Array to string

	console.log("Decoded string:", dataString); // Log the decoded string for debugging

	try {
		const data = JSON.parse(dataString); // Parse the JSON string
		console.log("Parsed data:", data); // Log the parsed data

		// Update all 5 health bar images
		updateHealthBarImage(data.player1, "1");
		updateHealthBarImage(data.player2, "2");
		updateHealthBarImage(data.player3, "3");
		updateHealthBarImage(data.player4, "4");
		updateHealthBarImage(data.player5, "5");
	} catch (error) {
		console.error("Error parsing JSON:", error); // Log any parsing errors
	}
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
