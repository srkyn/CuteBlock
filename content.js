(() => {
  const REPLACED_ATTR = "data-cuteblock-replaced";
  const SETTINGS_KEY = "cuteblockSettings";
  const FILTER_PATH = "filters/cosmetic-lite.txt";

  const DEFAULT_SETTINGS = {
    enabled: true,
    theme: "mixed",
    density: "balanced",
    disabledSites: []
  };

  const ANIMALS = [
    { theme: "cats", file: "cat.jpg", title: "Cat break", subtitle: "This ad is now a tiny nap zone." },
    { theme: "dogs", file: "dog.jpg", title: "Dog break", subtitle: "Important update: good vibes detected." },
    { theme: "capybaras", file: "capybara.jpg", title: "Capybara break", subtitle: "The internet has become calmer here." },
    { theme: "birds", file: "bird.jpg", title: "Bird break", subtitle: "A small chirp replaced a loud ad." }
  ];

  const DIRECT_SELECTORS = [
    "ins.adsbygoogle",
    "[data-ad-client]",
    "[data-ad-slot]",
    "[id*='google_ads' i]",
    "[class*='adsbygoogle' i]",
    "iframe[src*='doubleclick.net']",
    "iframe[src*='googlesyndication.com']",
    "iframe[src*='adservice.google.']",
    "iframe[src*='amazon-adsystem.com']"
  ];

  const STRONG_TOKENS = new Set([
    "ad-container", "ad-wrapper", "ad-unit", "ad-slot", "ad-banner", "banner-ad",
    "advertisement", "advertising", "adsbygoogle", "dfp-ad", "google-ads", "leaderboard-ad",
    "native-ad", "paid-content", "sponsored-card", "sponsored-post", "promoted-post"
  ]);

  const STRONG_TOKEN_PARTS = [...STRONG_TOKENS];
  const WEAK_TOKENS = new Set(["sponsor", "sponsored", "promoted", "ad", "ads"]);
  const COMMON_AD_SIZES = [
    [728, 90], [970, 90], [970, 250], [300, 250], [336, 280], [320, 50], [300, 600], [160, 600]
  ];

  let settings = { ...DEFAULT_SETTINGS };
  let cosmeticRules = [];
  let scanTimer = null;
  const replaced = new WeakMap();

  const getAssetUrl = (file) => chrome.runtime.getURL(`assets/${file}`);

  function normalizeSettings(value = {}) {
    return {
      ...DEFAULT_SETTINGS,
      ...value,
      disabledSites: Array.isArray(value.disabledSites) ? value.disabledSites : []
    };
  }

  function currentHostname() {
    return window.location.hostname.toLowerCase();
  }

  function domainMatches(hostname, domain) {
    const normalized = domain.toLowerCase();
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  }

  function isSiteDisabled() {
    const hostname = currentHostname();
    return settings.disabledSites.some((site) => domainMatches(hostname, site));
  }

  function isActive() {
    return settings.enabled && !isSiteDisabled();
  }

  function pickAnimal() {
    const pool = settings.theme === "mixed"
      ? ANIMALS
      : ANIMALS.filter((animal) => animal.theme === settings.theme);
    const choices = pool.length ? pool : ANIMALS;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function getTokens(element) {
    const parts = [
      element.id,
      typeof element.className === "string" ? element.className : "",
      element.getAttribute("aria-label"),
      element.getAttribute("data-testid"),
      element.getAttribute("data-ad"),
      element.getAttribute("data-ad-unit"),
      element.getAttribute("data-ad-slot")
    ];

    return parts
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9_-]+/)
      .filter(Boolean);
  }

  function safeMatches(element, selector) {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  }

  function safeQueryAll(root, selector) {
    try {
      return [...root.querySelectorAll(selector)];
    } catch {
      return [];
    }
  }

  function parseDomainList(raw) {
    if (!raw) return { include: [], exclude: [] };
    return raw
      .split(",")
      .map((domain) => domain.trim())
      .filter(Boolean)
      .reduce((domains, domain) => {
        if (domain.startsWith("~")) domains.exclude.push(domain.slice(1).toLowerCase());
        else domains.include.push(domain.toLowerCase());
        return domains;
      }, { include: [], exclude: [] });
  }

  function parseCosmeticFilter(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("!") || trimmed.startsWith("[")) return null;

    const marker = trimmed.includes("#@#") ? "#@#" : trimmed.includes("##") ? "##" : null;
    if (!marker) return null;

    const [domainPart, selector] = trimmed.split(marker);
    if (!selector || selector.includes(":-abp-") || selector.includes(":has(")) return null;

    const domains = parseDomainList(domainPart);
    return {
      selector: selector.trim(),
      exception: marker === "#@#",
      include: domains.include,
      exclude: domains.exclude
    };
  }

  function ruleApplies(rule) {
    const hostname = currentHostname();
    if (rule.exclude.some((domain) => domainMatches(hostname, domain))) return false;
    if (!rule.include.length) return true;
    return rule.include.some((domain) => domainMatches(hostname, domain));
  }

  function loadCosmeticFilters() {
    return fetch(chrome.runtime.getURL(FILTER_PATH))
      .then((response) => response.text())
      .then((text) => {
        cosmeticRules = text
          .split(/\r?\n/)
          .map(parseCosmeticFilter)
          .filter(Boolean)
          .filter(ruleApplies);
      })
      .catch(() => {
        cosmeticRules = [];
      });
  }

  function hasCosmeticException(element) {
    return cosmeticRules.some((rule) => rule.exception && safeMatches(element, rule.selector));
  }

  function getDensityThreshold() {
    if (settings.density === "gentle") return 5;
    if (settings.density === "eager") return 3;
    return 4;
  }

  function hasAdSize(rect) {
    return COMMON_AD_SIZES.some(([width, height]) => {
      const widthClose = Math.abs(rect.width - width) <= Math.max(18, width * 0.08);
      const heightClose = Math.abs(rect.height - height) <= Math.max(18, height * 0.12);
      return widthClose && heightClose;
    });
  }

  function scoreHeuristic(element, rect) {
    let score = 0;
    const tokens = getTokens(element);
    const tokenSet = new Set(tokens);
    const aria = (element.getAttribute("aria-label") || "").toLowerCase();
    const src = (element.getAttribute("src") || "").toLowerCase();

    if (DIRECT_SELECTORS.some((selector) => safeMatches(element, selector))) score += 5;
    if (tokens.some((token) => STRONG_TOKENS.has(token) || STRONG_TOKEN_PARTS.some((part) => token.includes(part)))) score += 4;
    if (tokens.some((token) => WEAK_TOKENS.has(token))) score += 1;
    if (aria === "advertisement" || aria === "sponsored") score += 4;
    if (element.tagName === "IFRAME" && /doubleclick|googlesyndication|adservice|amazon-adsystem/.test(src)) score += 5;
    if (element.hasAttribute("data-ad-client") || element.hasAttribute("data-ad-slot")) score += 4;
    if (hasAdSize(rect)) score += 1;
    if (tokenSet.has("ad") && rect.width >= 180 && rect.height >= 80) score += 1;

    return score;
  }

  function isVisibleCandidate(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.closest(".cuteblock-card")) return false;
    if (element.hasAttribute(REPLACED_ATTR)) return false;
    if (replaced.has(element)) return false;
    if (["HTML", "BODY", "SCRIPT", "STYLE", "LINK", "META"].includes(element.tagName)) return false;

    const rect = element.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return false;
    if (rect.width * rect.height < 1200) return false;

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
  }

  function shouldReplace(element, source = "heuristic") {
    if (!isVisibleCandidate(element) || hasCosmeticException(element)) return false;
    if (source === "cosmetic") return true;

    const rect = element.getBoundingClientRect();
    return scoreHeuristic(element, rect) >= getDensityThreshold();
  }

  function findReplacementTarget(element) {
    let target = element;
    for (let current = element.parentElement; current && current !== document.body; current = current.parentElement) {
      const rect = current.getBoundingClientRect();
      const score = scoreHeuristic(current, rect);
      if (score < getDensityThreshold()) break;
      if (rect.width >= 24 && rect.height >= 24 && rect.width * rect.height <= 900000) target = current;
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

  function replaceAd(element, source = "heuristic") {
    const target = findReplacementTarget(element);
    if (!shouldReplace(target, source)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const original = {
      children: [...target.childNodes],
      style: {
        minWidth: target.style.getPropertyValue("min-width"),
        minWidthPriority: target.style.getPropertyPriority("min-width"),
        minHeight: target.style.getPropertyValue("min-height"),
        minHeightPriority: target.style.getPropertyPriority("min-height"),
        overflow: target.style.getPropertyValue("overflow"),
        overflowPriority: target.style.getPropertyPriority("overflow")
      }
    };

    const card = createCard(rect.width, rect.height);
    replaced.set(target, original);
    target.setAttribute(REPLACED_ATTR, "true");
    target.replaceChildren(card);
    target.style.setProperty("min-width", `${Math.round(rect.width)}px`, "important");
    target.style.setProperty("min-height", `${Math.round(rect.height)}px`, "important");
    target.style.setProperty("overflow", "hidden", "important");
  }

  function restoreElement(element, original) {
    element.replaceChildren(...original.children);
    element.removeAttribute(REPLACED_ATTR);
    element.style.setProperty("min-width", original.style.minWidth, original.style.minWidthPriority);
    element.style.setProperty("min-height", original.style.minHeight, original.style.minHeightPriority);
    element.style.setProperty("overflow", original.style.overflow, original.style.overflowPriority);
  }

  function restoreAll() {
    document.querySelectorAll(`[${REPLACED_ATTR}]`).forEach((element) => {
      const original = replaced.get(element);
      if (original) restoreElement(element, original);
      else element.removeAttribute(REPLACED_ATTR);
    });
  }

  function collectCosmeticCandidates(root) {
    const candidates = new Set();
    cosmeticRules
      .filter((rule) => !rule.exception)
      .forEach((rule) => {
        if (root instanceof HTMLElement && safeMatches(root, rule.selector)) candidates.add(root);
        safeQueryAll(root, rule.selector).forEach((element) => candidates.add(element));
      });
    return candidates;
  }

  function collectHeuristicCandidates(root) {
    const candidates = new Set();
    const selector = "[id], [class], [aria-label], [data-testid], [data-ad], [data-ad-client], [data-ad-slot], iframe, ins";
    if (root instanceof HTMLElement && safeMatches(root, selector)) candidates.add(root);
    safeQueryAll(root, selector).forEach((element) => candidates.add(element));
    return candidates;
  }

  function scan(root = document) {
    if (!isActive()) {
      restoreAll();
      return;
    }

    collectCosmeticCandidates(root).forEach((element) => replaceAd(element, "cosmetic"));
    collectHeuristicCandidates(root).forEach((element) => replaceAd(element, "heuristic"));
  }

  function scheduleScan(root = document) {
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => scan(root), 150);
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!isActive()) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement && !node.closest(".cuteblock-card")) scheduleScan(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  Promise.all([
    loadCosmeticFilters(),
    new Promise((resolve) => {
      chrome.storage.sync.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, (stored) => {
        settings = normalizeSettings(stored[SETTINGS_KEY]);
        resolve();
      });
    })
  ]).then(() => {
    scan();
    startObserver();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[SETTINGS_KEY]) return;
    const wasActive = isActive();
    settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
    if (wasActive && !isActive()) restoreAll();
    else scheduleScan();
  });
})();
