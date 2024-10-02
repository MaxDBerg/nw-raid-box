const { ipcRenderer } = require("electron");

let isEditModeEnabled = false;

if (!isEditModeEnabled) {
}

function updateHealthBarImage(playerObject, playerId) {
	const imgElement = document.getElementById("health-bar" + playerId);
	const percentElement = document.getElementById("player" + playerId + "-percent");
	imgElement.src = `data:image/png;base64,${playerObject.image}`;
	if (percentElement.innerHTML !== playerObject.health.toString()) {
		percentElement.innerText = playerObject.health;
	}
}

function getSettingsFromForm() {
	const settings = {
		player_names: {
			player1: document.getElementById("player1-input-name").value,
			player2: document.getElementById("player2-input-name").value,
			player3: document.getElementById("player3-input-name").value,
			player4: document.getElementById("player4-input-name").value,
			player5: document.getElementById("player5-input-name").value,
		},
		use_number_parsing: document.getElementById("use-number-parsing").checked,
		use_data_filters: document.getElementById("use-data-filters").checked,
		use_health_bar_filters: document.getElementById("use-health-bar-filters").checked,
		border_red_when_dead: document.getElementById("border-red-when-dead").checked,
		focus_on_players: document.getElementById("focus-on-players").checked,
	};
	return settings;
}

function useSettings(settings) {
	console.log("Using settings...");
	console.log(settings);
	const players = {};
	players["player1"] = document.getElementById("player1-name");
	players["player2"] = document.getElementById("player2-name");
	players["player3"] = document.getElementById("player3-name");
	players["player4"] = document.getElementById("player4-name");
	players["player5"] = document.getElementById("player5-name");
	const healthBarFilters = document.getElementsByClassName("health-overlay");
	const healthPercent = document.getElementsByClassName("health-percent");

	players.player1.innerText = settings.player_names.player1;
	players.player2.innerText = settings.player_names.player2;
	players.player3.innerText = settings.player_names.player3;
	players.player4.innerText = settings.player_names.player4;
	players.player5.innerText = settings.player_names.player5;

	if (settings.use_health_bar_filters) {
		console.log(healthBarFilters);
		for (let index = 0; index < healthBarFilters.length; index++) {
			console.log(healthBarFilters[index]);
			healthBarFilters[index].classList.remove("not-visible");
		}
	} else {
		for (let index = 0; index < healthBarFilters.length; index++) {
			healthBarFilters[index].classList.add("not-visible");
		}
	}

	if (settings.use_number_parsing) {
		for (let index = 0; index < healthPercent.length; index++) {
			healthPercent[index].classList.remove("not-visible");
		}
	} else {
		for (let index = 0; index < healthPercent.length; index++) {
			healthPercent[index].classList.add("not-visible");
		}
	}

	//"focus_on_players": false,
	//"border_red_when_dead": false,
	//"use_savgol_filter": false
}

ipcRenderer.on("python-data", (event, dataBuffer) => {
	const decoder = new TextDecoder("utf-8"); // Create a new TextDecoder
	const dataString = decoder.decode(dataBuffer); // Decode Uint8Array to string

	// console.log("Decoded string:", dataString); // Log the decoded string for debugging

	try {
		const data = JSON.parse(dataString); // Parse the JSON string
		// console.log("Parsed data:", data); // Log the parsed data

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

ipcRenderer.on("init-settings", (event, settings) => {
	if (settings) {
		useSettings(settings);
		document.getElementById("player1-input-name").value = settings.player_names.player1;
		document.getElementById("player2-input-name").value = settings.player_names.player2;
		document.getElementById("player3-input-name").value = settings.player_names.player3;
		document.getElementById("player4-input-name").value = settings.player_names.player4;
		document.getElementById("player5-input-name").value = settings.player_names.player5;
		document.getElementById("use-number-parsing").checked = settings.use_number_parsing;
		document.getElementById("use-data-filters").checked = settings.use_data_filters;
		document.getElementById("use-health-bar-filters").checked = settings.use_health_bar_filters;
		document.getElementById("border-red-when-dead").checked = settings.border_red_when_dead;
		document.getElementById("focus-on-players").checked = settings.focus_on_players;
	}
});

ipcRenderer.on("overlay-settings", (event, settings) => {
	useSettings(settings);
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

	const updateButtonElement = document.getElementById("update-button");
	updateButtonElement.addEventListener("click", () => {
		const newSettings = getSettingsFromForm();
		ipcRenderer.send("send-settings-to-raid-parser", newSettings);
	});

	const el = document.getElementById("editModeToggleElement");
	el.addEventListener("click", () => {
		const overlayEl = document.getElementById("editModeBlur");
		const selectorElement = document.getElementById("raid-container-selector");
		const settingsElement = document.getElementById("settings-window");
		if (isEditModeEnabled) {
			isEditModeEnabled = false;
			overlayEl.classList.add("not-visible");
			selectorElement.classList.add("not-visible");
			settingsElement.classList.add("not-visible");
		} else {
			isEditModeEnabled = true;
			overlayEl.classList.remove("not-visible");
			selectorElement.classList.remove("not-visible");
			settingsElement.classList.remove("not-visible");
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
