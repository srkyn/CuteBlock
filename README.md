# CuteBlock

CuteBlock is a playful browser extension that replaces obvious ad containers with cute animal photos instead of collapsing the page layout.

## Load It In Chrome Or Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Choose **Load unpacked**.
4. Select this folder: `C:\Users\Admin\Documents\CSProjects\CuteBlock`.

## Try It

Open `test/ad-test.html` in the browser after loading the extension. The fake ad slots should become animal cards. If you are using the local server from this workspace, visit `http://127.0.0.1:8765/test/ad-test.html`.

## Current Features

- Manifest V3 extension.
- DOM-level replacement for common ad selectors, sponsored blocks, and ad-like class/id names.
- Starter EasyList-style cosmetic filter support from `filters/cosmetic-lite.txt`.
- Ghostery's MPL-2.0 filtering engine powers cosmetic rule matching.
- Reversible replacements when CuteBlock is disabled or paused for the current site.
- MutationObserver support for ads inserted after page load.
- Popup settings for enable/disable, current-site control, animal theme, and replacement level.
- No external image requests.

## Cosmetic Filter Syntax

CuteBlock uses Ghostery's adblocker engine for cosmetic rule matching, with a small bundled starter list:

- `##selector`
- `domain.com##selector`
- `domain.com,~excluded.com##selector`
- `#@#` exception rules

Unsupported rules are ignored for now, including procedural selectors such as `:has()` and `:-abp-has()`.

## Development

Install dependencies once:

```bash
npm install
```

Build the bundled content script:

```bash
npm run build
```

Run the local checks:

```bash
npm run check
```

## Next Good Steps

- Add user-configurable external filter subscriptions powered by Ghostery's engine.
- Add stronger network-rule support for identifying ad iframes and images.
- Add more bundled animal art packs.
- Add per-site replacement stats.

## Photo Credits

Bundled photos were resized and center-cropped for use as extension assets.

- Cat: [`Cat-1046544.jpg`](https://commons.wikimedia.org/wiki/File:Cat-1046544.jpg), Wikimedia Commons, CC0 1.0.
- Dog: [`1Cute-doggy.jpg`](https://commons.wikimedia.org/wiki/File:1Cute-doggy.jpg), Wikimedia Commons, CC0 1.0.
- Capybara: [`Bristol.zoo.capybara.arp.jpg`](https://commons.wikimedia.org/wiki/File:Bristol.zoo.capybara.arp.jpg), Wikimedia Commons, public domain.
- Bird: [`Colorful_Bird.jpg`](https://commons.wikimedia.org/wiki/File:Colorful_Bird.jpg) by Jim, Wikimedia Commons, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
