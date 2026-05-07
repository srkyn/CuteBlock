import { FiltersEngine } from "@ghostery/adblocker";

(() => {
  const REPLACED_ATTR = "data-cuteblock-replaced";
  const SETTINGS_KEY = "cuteblockSettings";
  const FILTER_PATH = "filters/cosmetic-lite.txt";

  const DEFAULT_SETTINGS = {
    enabled: true,
    theme: "mixed",
    density: "balanced",
    imageSource: "local",
    imageFit: "smart",
    disabledSites: []
  };

  const ANIMALS = [
    { theme: "cats", files: { wide: "cat-wide.jpg", rect: "cat-rect.jpg", tall: "cat-tall.jpg" }, title: "Cat break", subtitle: "This ad is now a tiny nap zone." },
    { theme: "dogs", files: { wide: "dog-wide.jpg", rect: "dog-rect.jpg", tall: "dog-tall.jpg" }, title: "Dog break", subtitle: "Important update: good vibes detected." },
    { theme: "capybaras", files: { wide: "capybara-wide.jpg", rect: "capybara-rect.jpg", tall: "capybara-tall.jpg" }, title: "Capybara break", subtitle: "The internet has become calmer here." },
    { theme: "birds", files: { wide: "bird-wide.jpg", rect: "bird-rect.jpg", tall: "bird-tall.jpg" }, title: "Bird break", subtitle: "A small chirp replaced a loud ad." }
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
  const PAGE_CONTENT_TAGS = new Set(["ARTICLE", "MAIN", "NAV", "HEADER", "FOOTER", "FORM"]);
  const MAX_ENGINE_SELECTORS = 80;
  const MAX_HINT_ELEMENTS = 1200;
  const MAX_SELECTOR_MATCHES = 200;
  const MAX_HEURISTIC_CANDIDATES = 600;

  let settings = { ...DEFAULT_SETTINGS };
  let filterEngine = null;
  let cosmeticExceptionRules = [];
  let scanTimer = null;
  const pendingScanRoots = new Set();
  const replaced = new WeakMap();
  const remoteImageCache = [];

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

  function isSupportedRemoteImage(url) {
    return /\.(avif|jpe?g|png|webp)(\?.*)?$/i.test(url);
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json();
    });
  }

  function fetchRemoteDogImage(attempt = 0) {
    if (attempt > 3) return Promise.reject(new Error("No supported dog image returned."));

    return fetchJson("https://random.dog/woof.json")
      .then((data) => data.url)
      .then((url) => {
        if (isSupportedRemoteImage(url)) return url;
        return fetchRemoteDogImage(attempt + 1);
      })
      .catch(() => fetchJson("https://dog.ceo/api/breeds/image/random").then((data) => data.message));
  }

  function warmRemoteImageCache() {
    if (settings.imageSource !== "online-dogs" || remoteImageCache.length >= 3) return;
    fetchRemoteDogImage()
      .then((url) => {
        if (isSupportedRemoteImage(url)) remoteImageCache.push(url);
      })
      .catch(() => {});
  }

  function getAssetVariant(width, height) {
    const aspectRatio = width / Math.max(height, 1);
    if (aspectRatio > 2.35) return "wide";
    if (aspectRatio < 0.82) return "tall";
    return "rect";
  }

  function getAnimalAssetUrl(animal, width, height) {
    return getAssetUrl(animal.files[getAssetVariant(width, height)] || animal.files.rect);
  }

  function resolveAnimalImage(animal, width, height) {
    if (settings.imageSource !== "online-dogs") {
      return Promise.resolve(getAnimalAssetUrl(animal, width, height));
    }

    const cached = remoteImageCache.shift();
    warmRemoteImageCache();
    if (cached) return Promise.resolve(cached);

    return fetchRemoteDogImage()
      .then((url) => isSupportedRemoteImage(url) ? url : getAnimalAssetUrl(animal, width, height))
      .catch(() => getAnimalAssetUrl(animal, width, height));
  }

  function applyAnimalImage(card, img, url, source) {
    img.src = url;
    img.dataset.cuteblockImageSource = source;
    card.dataset.cuteblockImageSource = source;
    card.style.setProperty("background-image", `url("${url.replaceAll("\"", "%22")}")`, "important");
  }

  function getImageFitMode(width, height) {
    if (settings.imageFit === "cover" || settings.imageFit === "contain") return settings.imageFit;
    const aspectRatio = width / Math.max(height, 1);
    return settings.imageSource === "online-dogs" && (aspectRatio > 3.2 || height < 130) ? "contain" : "cover";
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

  function safeQueryLimited(root, selector, limit) {
    try {
      const matches = root.querySelectorAll(selector);
      const elements = [];
      for (const element of matches) {
        elements.push(element);
        if (elements.length >= limit) break;
      }
      return elements;
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

  function parseCosmeticException(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("!") || !trimmed.includes("#@#")) return null;
    const [domainPart, selector] = trimmed.split("#@#");
    if (!selector || selector.includes(":-abp-") || selector.includes(":has(")) return null;

    const domains = parseDomainList(domainPart);
    return {
      selector: selector.trim(),
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
        filterEngine = FiltersEngine.parse(text, {
          loadCosmeticFilters: true,
          loadNetworkFilters: false
        });
        cosmeticExceptionRules = text
          .split(/\r?\n/)
          .map(parseCosmeticException)
          .filter(Boolean)
          .filter(ruleApplies);
      })
      .catch(() => {
        filterEngine = null;
        cosmeticExceptionRules = [];
      });
  }

  function hasCosmeticException(element) {
    return cosmeticExceptionRules.some((rule) => safeMatches(element, rule.selector));
  }

  function splitSelectorList(selectorList) {
    const selectors = [];
    let current = "";
    let depth = 0;
    let quote = "";

    for (const char of selectorList) {
      if (quote) {
        current += char;
        if (char === quote) quote = "";
        continue;
      }

      if (char === "\"" || char === "'") {
        quote = char;
        current += char;
        continue;
      }

      if (char === "(" || char === "[") depth += 1;
      if (char === ")" || char === "]") depth = Math.max(0, depth - 1);

      if (char === "," && depth === 0) {
        const selector = current.trim();
        if (selector) selectors.push(selector);
        current = "";
      } else {
        current += char;
      }
    }

    const selector = current.trim();
    if (selector) selectors.push(selector);
    return selectors;
  }

  function selectorsFromStyles(styles) {
    const selectors = [];
    let remaining = styles || "";

    while (remaining.includes("{")) {
      const [selectorList, ...rest] = remaining.split("{");
      selectors.push(...splitSelectorList(selectorList));
      remaining = rest.join("{");
      const closeIndex = remaining.indexOf("}");
      if (closeIndex === -1) break;
      remaining = remaining.slice(closeIndex + 1);
    }

    return selectors.filter((selector) => !selector.includes(":-abp-") && !selector.includes(":has("));
  }

  function collectDomHints(root) {
    const classes = new Set();
    const ids = new Set();
    const hrefs = new Set();
    const selector = "[id], [class], a[href]";

    const addElement = (element) => {
      if (!(element instanceof HTMLElement)) return;
      if (element.id) ids.add(element.id);
      element.classList?.forEach((className) => classes.add(className));
      if (element instanceof HTMLAnchorElement && element.href) hrefs.add(element.href);
    };

    if (root instanceof HTMLElement && safeMatches(root, selector)) addElement(root);
    safeQueryLimited(root, selector, MAX_HINT_ELEMENTS).forEach(addElement);

    return {
      classes: [...classes],
      ids: [...ids],
      hrefs: [...hrefs]
    };
  }

  function getEngineSelectors(root) {
    if (!filterEngine) return [];

    const { classes, ids, hrefs } = collectDomHints(root);
    const hostname = currentHostname();
    const result = filterEngine.getCosmeticsFilters({
      url: window.location.href,
      hostname,
      domain: hostname,
      ancestors: [],
      classes,
      hrefs,
      ids,
      getBaseRules: true,
      getInjectionRules: false,
      getExtendedRules: false,
      getRulesFromDOM: true,
      getRulesFromHostname: true,
      hidingStyle: "display:none!important",
      callerContext: null
    });

    return selectorsFromStyles(result.styles).slice(0, MAX_ENGINE_SELECTORS);
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
    if (rect.width * rect.height > 900000) return false;

    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
  }

  function shouldReplace(element, source = "heuristic") {
    if (!isVisibleCandidate(element) || hasCosmeticException(element)) return false;
    if (source === "cosmetic") return true;

    const rect = element.getBoundingClientRect();
    return scoreHeuristic(element, rect) >= getDensityThreshold();
  }

  function isSafeReplacementTarget(element, childRect) {
    if (!(element instanceof HTMLElement)) return false;
    if (PAGE_CONTENT_TAGS.has(element.tagName)) return false;
    if (element.matches("article, main, nav, header, footer, form, [role='main'], [role='navigation']")) return false;
    if (element.querySelector("article, main, form, [role='main']")) return false;

    const rect = element.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return false;
    const area = rect.width * rect.height;
    const childArea = Math.max(childRect.width * childRect.height, 1);
    if (area > 900000) return false;
    return area <= childArea * 2.5;
  }

  function findReplacementTarget(element) {
    let target = element;
    let targetRect = element.getBoundingClientRect();
    let depth = 0;
    for (let current = element.parentElement; current && current !== document.body && depth < 2; current = current.parentElement, depth += 1) {
      const rect = current.getBoundingClientRect();
      const score = scoreHeuristic(current, rect);
      if (score < getDensityThreshold()) break;
      if (isSafeReplacementTarget(current, targetRect)) {
        target = current;
        targetRect = rect;
      }
    }
    return target;
  }

  function createCard(width, height) {
    const animal = pickAnimal();
    const compact = width < 180 || height < 95;
    const fitMode = getImageFitMode(width, height);
    const card = document.createElement("div");
    card.className = `cuteblock-card cuteblock-fit-${fitMode}${compact ? " cuteblock-compact" : ""}`;
    card.setAttribute("role", "img");
    card.setAttribute("aria-label", `${animal.title}. ${animal.subtitle}`);
    card.style.setProperty("width", "100%", "important");
    card.style.setProperty("height", `${Math.max(Math.round(height), 72)}px`, "important");
    card.style.setProperty("min-height", `${Math.max(Math.round(height), 72)}px`, "important");

    const img = document.createElement("img");
    img.className = "cuteblock-art";
    img.alt = "";
    img.decoding = "async";
    img.addEventListener("load", () => {
      card.classList.add("cuteblock-has-art");
      card.classList.remove("cuteblock-art-error");
    });
    img.addEventListener("error", () => {
      card.classList.add("cuteblock-art-error");
    });

    const fallbackUrl = getAnimalAssetUrl(animal, width, height);
    applyAnimalImage(card, img, fallbackUrl, "bundled");

    if (settings.imageSource === "online-dogs") {
      resolveAnimalImage(animal, width, height).then((url) => {
        applyAnimalImage(card, img, url, "online-dogs");
      });
    }

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
    restoreStyle(element, "min-width", original.style.minWidth, original.style.minWidthPriority);
    restoreStyle(element, "min-height", original.style.minHeight, original.style.minHeightPriority);
    restoreStyle(element, "overflow", original.style.overflow, original.style.overflowPriority);
    replaced.delete(element);
  }

  function restoreStyle(element, property, value, priority) {
    if (value) element.style.setProperty(property, value, priority);
    else element.style.removeProperty(property);
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
    getEngineSelectors(root)
      .forEach((selector) => {
        if (root instanceof HTMLElement && safeMatches(root, selector)) candidates.add(root);
        safeQueryLimited(root, selector, MAX_SELECTOR_MATCHES).forEach((element) => candidates.add(element));
      });
    return candidates;
  }

  function collectHeuristicCandidates(root) {
    const candidates = new Set();
    const selector = "[id], [class], [aria-label], [data-testid], [data-ad], [data-ad-client], [data-ad-slot], iframe, ins";
    if (root instanceof HTMLElement && safeMatches(root, selector)) candidates.add(root);
    safeQueryLimited(root, selector, MAX_HEURISTIC_CANDIDATES).forEach((element) => candidates.add(element));
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
    pendingScanRoots.add(root);
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => {
      const roots = [...pendingScanRoots].filter(Boolean);
      pendingScanRoots.clear();

      if (!roots.length || roots.includes(document) || roots.length > 20) {
        scan(document);
        return;
      }

      roots.forEach((scanRoot) => {
        if (scanRoot.isConnected || scanRoot === document) scan(scanRoot);
      });
    }, 200);
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
    const previousSettings = settings;
    settings = normalizeSettings(changes[SETTINGS_KEY].newValue);
    if (wasActive && !isActive()) restoreAll();
    else if (isActive() && settingsRequireRefresh(previousSettings, settings)) {
      restoreAll();
      scheduleScan();
    } else scheduleScan();
  });

  function settingsRequireRefresh(previous, next) {
    return previous.theme !== next.theme
      || previous.imageSource !== next.imageSource
      || previous.imageFit !== next.imageFit
      || previous.density !== next.density;
  }
})();
