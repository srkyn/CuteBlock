const SETTINGS_KEY = "cuteblockSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  theme: "mixed",
  density: "balanced"
};

const enabled = document.querySelector("#enabled");
const theme = document.querySelector("#theme");
const status = document.querySelector("#status");
const densityInputs = [...document.querySelectorAll("input[name='density']")];

function getSelectedDensity() {
  return densityInputs.find((input) => input.checked)?.value || DEFAULT_SETTINGS.density;
}

function setStatus(message) {
  status.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    status.textContent = "";
  }, 1400);
}

function render(settings) {
  enabled.checked = settings.enabled;
  theme.value = settings.theme;
  densityInputs.forEach((input) => {
    input.checked = input.value === settings.density;
  });
}

function collectSettings() {
  return {
    enabled: enabled.checked,
    theme: theme.value,
    density: getSelectedDensity()
  };
}

function save() {
  chrome.storage.sync.set({ [SETTINGS_KEY]: collectSettings() }, () => {
    setStatus("Saved");
  });
}

chrome.storage.sync.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, (stored) => {
  render({ ...DEFAULT_SETTINGS, ...stored[SETTINGS_KEY] });
});

enabled.addEventListener("change", save);
theme.addEventListener("change", save);
densityInputs.forEach((input) => input.addEventListener("change", save));
