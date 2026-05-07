(() => {
  const REPLACED_ATTR = "data-cuteblock-replaced";
  const MIN_AREA = 2500;
  const SETTINGS_KEY = "cuteblockSettings";

  const DEFAULT_SETTINGS = {
    enabled: true,
    theme: "mixed",
    density: "balanced"
  };

  const ANIMALS = [
    { theme: "cats", file: "cat.jpg", title: "Cat break", subtitle: "This ad is now a tiny nap zone." },
    { theme: "dogs", file: "dog.jpg", title: "Dog break", subtitle: "Important update: good vibes detected." },
    { theme: "capybaras", file: "capybara.jpg", title: "Capybara break", subtitle: "The internet has become calmer here." },
    { theme: "birds", file: "bird.jpg", title: "Bird break", subtitle: "A small chirp replaced a loud ad." }
  ];

  const AD_PATTERNS = [
    "ad", "ads", "advert", "advertisement", "adunit", "ad-unit", "ad_slot", "ad-slot",
    "adcontainer", "ad-container", "adwrapper", "ad-wrapper", "banner-ad", "dfp",
    "doubleclick", "googlesyndication", "sponsored", "sponsor", "promoted", "taboola",
    "outbrain", "mgid", "native-ad", "paid-content"
  ];

  const AD_SELECTORS = [
    "iframe[src*='doubleclick']",
    "iframe[src*='googlesyndication']",
    "iframe[src*='adservice']",
    "iframe[src*='amazon-adsystem']",
    "ins.adsbygoogle",
    "[aria-label*='advertisement' i]",
    "[aria-label*='sponsored' i]",
    "[data-ad]",
    "[data-ad-client]",
    "[data-ad-slot]",
    "[data-testid*='ad' i]",
    "[id*='google_ads' i]",
    "[class*='adsbygoogle' i]"
  ];

  let settings = { ...DEFAULT_SETTINGS };
  let scanTimer = null;

  const getAssetUrl = (file) => chrome.runtime.getURL(`assets/${file}`);

  function pickAnimal() {
    const pool = settings.theme === "mixed"
      ? ANIMALS
      : ANIMALS.filter((animal) => animal.theme === settings.theme);
    const choices = pool.length ? pool : ANIMALS;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function getElementSignature(element) {
    return `${element.id || ""} ${element.className || ""} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("data-testid") || ""}`.toLowerCase();
  }

  function hasAdPattern(element) {
    const signature = getElementSignature(element);
    if (!signature) return false;
    return AD_PATTERNS.some((pattern) => {
      if (pattern === "ad" || pattern === "ads") {
        return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, "i").test(signature);
      }
      return signature.includes(pattern);
    });
  }

  function getDensityMinimum() {
    if (settings.density === "gentle") return 9000;
    if (settings.density === "eager") return 1200;
    return MIN_AREA;
  }

  function isVisibleAdCandidate(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.closest(".cuteblock-card")) return false;
    if (element.hasAttribute(REPLACED_ATTR)) return false;
    if (["HTML", "BODY", "SCRIPT", "STYLE", "LINK", "META"].includes(element.tagName)) return false;

    const rect = element.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return false;
    if (rect.width * rect.height < getDensityMinimum()) return false;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;

    return hasAdPattern(element) || AD_SELECTORS.some((selector) => element.matches(selector));
  }

  function findReplacementTarget(element) {
    let target = element;
    for (let current = element.parentElement; current && current !== document.body; current = current.parentElement) {
      if (!hasAdPattern(current)) break;
      const rect = current.getBoundingClientRect();
      if (rect.width >= 24 && rect.height >= 24) target = current;
    }
    return target;
  }

  function createCard(width, height) {
    const animal = pickAnimal();
    const compact = width < 180 || height < 95;
    const card = document.createElement("div");
    card.className = `cuteblock-card${compact ? " cuteblock-compact" : ""}`;
    card.setAttribute("role", "img");
    card.setAttribute("aria-label", `${animal.title}. ${animal.subtitle}`);
    card.style.setProperty("width", "100%", "important");
    card.style.setProperty("height", `${Math.max(Math.round(height), 72)}px`, "important");
    card.style.setProperty("min-height", `${Math.max(Math.round(height), 72)}px`, "important");

    const img = document.createElement("img");
    img.className = "cuteblock-art";
    img.src = getAssetUrl(animal.file);
    img.alt = "";
    img.loading = "lazy";

    const copy = document.createElement("span");
    copy.className = "cuteblock-copy";

    const title = document.createElement("span");
    title.className = "cuteblock-title";
    title.textContent = animal.title;

    const subtitle = document.createElement("span");
    subtitle.className = "cuteblock-subtitle";
    subtitle.textContent = animal.subtitle;

    copy.append(title, subtitle);
    card.append(img, copy);
    return card;
  }

  function replaceAd(element) {
    const target = findReplacementTarget(element);
    if (!isVisibleAdCandidate(target)) return;

    const rect = target.getBoundingClientRect();
    const card = createCard(rect.width, rect.height);

    target.setAttribute(REPLACED_ATTR, "true");
    target.replaceChildren(card);
    target.style.setProperty("min-width", `${Math.round(rect.width)}px`, "important");
    target.style.setProperty("min-height", `${Math.round(rect.height)}px`, "important");
    target.style.setProperty("overflow", "hidden", "important");
  }

  function scan(root = document) {
    if (!settings.enabled) return;

    const candidates = new Set();
    if (root instanceof HTMLElement && (hasAdPattern(root) || AD_SELECTORS.some((selector) => root.matches(selector)))) {
      candidates.add(root);
    }

    AD_SELECTORS.forEach((selector) => {
      root.querySelectorAll?.(selector).forEach((element) => candidates.add(element));
    });

    root.querySelectorAll?.("[id], [class], [aria-label], [data-testid]").forEach((element) => {
      if (hasAdPattern(element)) candidates.add(element);
    });

    candidates.forEach((element) => {
      if (isVisibleAdCandidate(element)) replaceAd(element);
    });
  }

  function scheduleScan(root = document) {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => scan(root), 120);
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!settings.enabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) scheduleScan(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  chrome.storage.sync.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, (stored) => {
    settings = { ...DEFAULT_SETTINGS, ...stored[SETTINGS_KEY] };
    scan();
    startObserver();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[SETTINGS_KEY]) return;
    settings = { ...DEFAULT_SETTINGS, ...changes[SETTINGS_KEY].newValue };
    scheduleScan();
  });
})();
