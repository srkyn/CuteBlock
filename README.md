# CuteBlock

CuteBlock is a playful browser extension that replaces obvious ad containers with cute animal photos instead of collapsing the page layout.

## Load It In Chrome Or Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Choose **Load unpacked**.
4. Select the cloned `CuteBlock` folder.

## Try It

Open `test/ad-test.html` in the browser after loading the extension. The fake ad slots should become animal cards. If you are using the local server from this workspace, visit `http://127.0.0.1:8765/test/ad-test.html`.

## Current Features

- Manifest V3 extension.
- DOM-level replacement for common ad selectors, sponsored blocks, and ad-like class/id names.
- Starter EasyList-style cosmetic filter support from `filters/cosmetic-lite.txt`.
- Ghostery's MPL-2.0 filtering engine powers cosmetic rule matching.
- Reversible replacements when CuteBlock is disabled or paused for the current site.
- MutationObserver support for ads inserted after page load.
- Popup settings for enable/disable, current-site control, animal theme, photo fit, and replacement level.
- Bundled photos are packaged with the extension, so ad replacement does not require external image requests.
- Bundled animal photos include wide, rectangle, and tall variants so ad slots get shape-appropriate images.

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

Run the full local checks:

```bash
npm run check
```

Run browser regression tests:

```bash
npm run test:browser
```

Create a Chrome Web Store ZIP:

```bash
npm run package
```

## Privacy And Notices

- Privacy notes live in [`PRIVACY.md`](PRIVACY.md).
- Third-party code and photo notices live in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- Store listing notes live in [`STORE_LISTING.md`](STORE_LISTING.md).

## Next Good Steps

- Add user-configurable external filter subscriptions powered by Ghostery's engine.
- Add stronger network-rule support for identifying ad iframes and images.
- Add more bundled animal art packs.
- Add per-site replacement stats.

## Photo Credits

Bundled photos were resized and center-cropped for use as extension assets.

- Cat: [`House cat lying.jpg`](https://commons.wikimedia.org/wiki/File:House_cat_lying.jpg), Wikimedia Commons, public domain.
- Dog: [`Dog on grass.jpg`](https://commons.wikimedia.org/wiki/File:Dog_on_grass.jpg), Wikimedia Commons, public domain source.
- Capybara: [`Bristol.zoo.capybara.arp.jpg`](https://commons.wikimedia.org/wiki/File:Bristol.zoo.capybara.arp.jpg), Wikimedia Commons, public domain.
- Bird: [`Bird on branch (Unsplash).jpg`](https://commons.wikimedia.org/wiki/File:Bird_on_branch_(Unsplash).jpg) by Pritiranjan Maharana, Wikimedia Commons, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
