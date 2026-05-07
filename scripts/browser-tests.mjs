import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const root = resolve(".");
const defaultSettings = {
  enabled: true,
  theme: "mixed",
  density: "balanced",
  imageSource: "local",
  imageFit: "smart",
  disabledSites: []
};

const mimeTypes = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".txt", "text/plain"]
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer() {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname === "/" ? "/test/ad-test.html" : url.pathname);
      const filePath = resolve(join(root, pathname));

      if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type": mimeTypes.get(extname(filePath)) || "application/octet-stream"
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function installHarness(page, origin) {
  await page.addInitScript(({ initialSettings, testOrigin }) => {
    let settings = { ...initialSettings };
    const listeners = [];
    const realFetch = window.fetch.bind(window);
    window.__cuteblockDogRequests = 0;

    window.fetch = (input, init) => {
      const url = String(input);
      if (url.startsWith("https://random.dog/")) {
        window.__cuteblockDogRequests += 1;
        return Promise.resolve(new Response(JSON.stringify({ url: `${testOrigin}/assets/dog-rect.jpg` }), {
          headers: { "content-type": "application/json" }
        }));
      }

      if (url.startsWith("https://dog.ceo/")) {
        window.__cuteblockDogRequests += 1;
        return Promise.resolve(new Response(JSON.stringify({ message: `${testOrigin}/assets/dog-rect.jpg` }), {
          headers: { "content-type": "application/json" }
        }));
      }

      return realFetch(input, init);
    };

    window.chrome = {
      runtime: {
        getURL(path) {
          return `${testOrigin}/${path}`;
        }
      },
      storage: {
        sync: {
          get(defaults, callback) {
            const key = Object.keys(defaults)[0];
            callback({ [key]: settings });
          },
          set(value, callback) {
            const key = Object.keys(value)[0];
            const oldValue = settings;
            settings = { ...initialSettings, ...value[key] };
            for (const listener of listeners) {
              listener({ [key]: { oldValue, newValue: settings } }, "sync");
            }
            callback?.();
          }
        },
        onChanged: {
          addListener(listener) {
            listeners.push(listener);
          }
        }
      }
    };
  }, { initialSettings: defaultSettings, testOrigin: origin });
}

async function setSettings(page, nextSettings) {
  await page.evaluate((settings) => {
    window.chrome.storage.sync.set({ cuteblockSettings: settings });
  }, { ...defaultSettings, ...nextSettings });
}

async function run() {
  const { server, origin } = await startServer();
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await installHarness(page, origin);
    await page.goto(`${origin}/test/ad-test.html`, { waitUntil: "domcontentloaded" });
    await page.addScriptTag({ path: join(root, "content.js") });

    await page.waitForFunction(() => document.querySelectorAll(".cuteblock-card").length >= 5);
    assert(await page.locator(".leaderboard-ad .cuteblock-card").count() === 1, "leaderboard ad was not replaced");
    assert(await page.locator("#google_ads_iframe_test .cuteblock-card").count() === 1, "inline ad container was not replaced");
    assert(await page.locator("aside .sponsored-card .cuteblock-card").count() === 1, "sponsored card was not replaced");
    assert(await page.locator(".article-promo .cuteblock-card").count() === 0, "legitimate article promo was replaced");

    const iframeDisplay = await page.locator(".iframe-slot").evaluate((element) => getComputedStyle(element).display);
    assert(iframeDisplay === "none", "iframe ad was not hidden");
    const iframeCardCount = await page.locator(".iframe-slot").evaluate((element) => {
      let previous = element.previousElementSibling;
      while (previous && !previous.classList.contains("cuteblock-card")) previous = previous.previousElementSibling;
      return previous?.classList.contains("cuteblock-card") ? 1 : 0;
    });
    assert(iframeCardCount === 1, "iframe ad did not receive a replacement card");

    await page.locator(".removable-iframe-slot").evaluate((element) => {
      const card = element.previousElementSibling;
      element.remove();
      return card?.classList.contains("cuteblock-card");
    });
    await page.waitForFunction(() => !document.querySelector(".removable-iframe-slot") && document.querySelectorAll("[data-cuteblock-frame-card]").length === 1);

    await page.waitForFunction(() => [...document.querySelectorAll(".cuteblock-card")].some((card) => card.parentElement?.classList.contains("dynamic-ad-container")));
    assert(await page.locator(".dynamic-ad-container .cuteblock-card").count() === 1, "dynamic ad was not replaced");

    await setSettings(page, { enabled: false });
    await page.waitForFunction(() => document.querySelectorAll(".cuteblock-card").length === 0);
    assert(await page.locator(".leaderboard-ad", { hasText: "Leaderboard advertisement" }).count() === 1, "disable did not restore leaderboard content");
    const restoredIframeDisplay = await page.locator(".iframe-slot").evaluate((element) => getComputedStyle(element).display);
    assert(restoredIframeDisplay !== "none", "disable did not restore iframe visibility");

    for (const [theme, title] of [["foxes", "Fox break"], ["rabbits", "Rabbit break"], ["otters", "Otter break"]]) {
      await setSettings(page, { enabled: true, theme, imageSource: "local" });
      await page.waitForFunction((expectedTitle) => [...document.querySelectorAll(".cuteblock-title")].some((node) => node.textContent === expectedTitle), title);
    }

    await setSettings(page, { enabled: true, theme: "birds", imageSource: "online-dogs" });
    await page.waitForFunction(() => [...document.querySelectorAll(".cuteblock-title")].some((title) => title.textContent === "Dog break"));
    assert(await page.locator(".cuteblock-title", { hasText: "Bird break" }).count() === 0, "online dog mode still used non-dog copy");
    assert(await page.evaluate(() => window.__cuteblockDogRequests) <= 2, "online dog mode made too many remote requests");

    console.log("browser ok");
  } finally {
    await browser.close();
  }

  await runRealExtensionSmoke(origin);
  server.close();
}

async function runRealExtensionSmoke(origin) {
  const userDataDir = await mkdtemp(join(tmpdir(), "cuteblock-profile-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${root}`,
      `--load-extension=${root}`
    ]
  });

  try {
    const page = await context.newPage();
    await page.goto(`${origin}/test/ad-test.html`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll(".cuteblock-card").length >= 5);
    assert(await page.locator(".leaderboard-ad .cuteblock-card").count() === 1, "real extension did not replace leaderboard ad");
    assert(await page.locator(".iframe-slot").evaluate((element) => getComputedStyle(element).display) === "none", "real extension did not hide iframe ad");
    console.log("extension smoke ok");
  } finally {
    await context.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
