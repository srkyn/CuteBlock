const SETTINGS_KEY = "cuteblockSettings";
const DEFAULT_SETTINGS = {
  enabled: true,
  theme: "mixed",
  density: "balanced",
  imageSource: "local",
  imageFit: "smart",
  disabledSites: []
};
const RANDOM_DOG_ORIGINS = ["https://random.dog/*", "https://dog.ceo/*"];

const enabled = document.querySelector("#enabled");
const siteEnabled = document.querySelector("#site-enabled");
const siteLabel = document.querySelector("#site-label");
const theme = document.querySelector("#theme");
const imageSource = document.querySelector("#image-source");
const imageFit = document.querySelector("#image-fit");
const status = document.querySelector("#status");
const densityInputs = [...document.querySelectorAll("input[name='density']")];

let currentHost = "";
let settings = { ...DEFAULT_SETTINGS };

function normalizeSettings(value = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    disabledSites: Array.isArray(value.disabledSites) ? value.disabledSites : []
  };
}

function getSelectedDensity() {
  return densityInputs.find((input) => input.checked)?.value || DEFAULT_SETTINGS.density;
}

function hostMatches(hostname, site) {
  return hostname === site || hostname.endsWith(`.${site}`);
}

function isCurrentSiteDisabled() {
  return currentHost && settings.disabledSites.some((site) => hostMatches(currentHost, site));
}

function setStatus(message) {
  status.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    status.textContent = "";
  }, 1400);
}

function render() {
  enabled.checked = settings.enabled;
  theme.value = settings.theme;
  imageSource.value = settings.imageSource;
  imageFit.value = settings.imageFit;
  siteEnabled.checked = !isCurrentSiteDisabled();
  siteEnabled.disabled = !currentHost;
  siteLabel.textContent = currentHost ? `Allow on ${currentHost}` : "Current site";
  densityInputs.forEach((input) => {
    input.checked = input.value === settings.density;
  });
}

function collectSettings() {
  return {
    ...settings,
    enabled: enabled.checked,
    theme: theme.value,
    imageSource: imageSource.value,
    imageFit: imageFit.value,
    density: getSelectedDensity()
  };
}

function save(nextSettings = collectSettings()) {
  settings = normalizeSettings(nextSettings);
  chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, () => {
    render();
    setStatus("Saved");
  });
}

function setSiteEnabled(isEnabled) {
  if (!currentHost) return;

  const disabledSites = settings.disabledSites.filter((site) => !hostMatches(currentHost, site));
  if (!isEnabled) disabledSites.push(currentHost);
  save({ ...collectSettings(), disabledSites });
}

function setImageSource(nextSource) {
  if (nextSource !== "online-dogs") {
    chrome.permissions?.remove?.({ origins: RANDOM_DOG_ORIGINS });
    save({ ...collectSettings(), imageSource: "local" });
    return;
  }

  const warning = [
    "Random dog photos are optional.",
    "",
    "If enabled, CuteBlock may request images from random.dog or dog.ceo when it replaces an ad. Those services may receive normal web request metadata such as your IP address and browser user agent.",
    "",
    "Bundled photos remain available without external requests. Enable random dog photos?"
  ].join("\n");

  if (!window.confirm(warning)) {
    imageSource.value = settings.imageSource;
    return;
  }

  chrome.permissions.request({ origins: RANDOM_DOG_ORIGINS }, (granted) => {
    if (!granted) {
      imageSource.value = settings.imageSource;
      setStatus("Random dog access denied");
      return;
    }

    save({ ...collectSettings(), imageSource: "online-dogs" });
  });
}

function loadSettings() {
  chrome.storage.sync.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, (stored) => {
    settings = normalizeSettings(stored[SETTINGS_KEY]);
    render();
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.id) {
    loadSettings();
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "cuteblock-get-page-info" }, (response) => {
    currentHost = response?.hostname || "";
    loadSettings();
  });
});

enabled.addEventListener("change", () => save());
theme.addEventListener("change", () => save());
imageSource.addEventListener("change", () => setImageSource(imageSource.value));
imageFit.addEventListener("change", () => save());
siteEnabled.addEventListener("change", () => setSiteEnabled(siteEnabled.checked));
densityInputs.forEach((input) => input.addEventListener("change", () => save()));
