# CuteBlock

CuteBlock is a playful browser extension that replaces likely ad containers with cute animal photos instead of collapsing the page layout.

![CuteBlock replacing ad slots with animal photos](store-assets/upload-ready/screenshot-1280x800.jpg)

Instead of leaving awkward blank spaces where ads used to be, CuteBlock keeps the original slot shape and fills it with bundled photos of cats, dogs, birds, capybaras, foxes, rabbits, and otters. Bundled photos are the default, so normal use does not make external image requests.

## Why It Matters

CuteBlock is a small browser-control project with a privacy-first default: replace the page elements locally, preserve layout, and avoid external image requests unless the user explicitly enables an optional online source.

The project is intentionally lighthearted, but the engineering focus is serious: Manifest V3 permissions, content-script behavior, cosmetic filter parsing, reversible DOM changes, and clear user control from the popup.

## Load It In Chrome Or Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Choose **Load unpacked**.
4. Select the cloned `CuteBlock` folder.

## Try It

Open `test/ad-test.html` in the browser after loading the extension. The fake ad slots should become animal cards. If you are using the local server from this workspace, visit `http://127.0.0.1:8765/test/ad-test.html`.

## Current Features

- Manifest V3 extension.
- Minimal default permission model: `storage` only, with online image hosts kept behind optional permissions.
- DOM-level replacement for common ad selectors, sponsored blocks, ad iframes, and ad-like class/id names.
- Starter EasyList-style cosmetic filter support from `filters/cosmetic-lite.txt`.
- Ghostery's MPL-2.0 filtering engine powers cosmetic rule matching.
- Reversible replacements when CuteBlock is disabled or paused for the current site.
- MutationObserver support for ads inserted after page load.
- Popup settings for enable/disable, current-site control, animal theme, photo fit, and replacement level.
- Bundled photos are packaged with the extension, so ad replacement does not require external image requests by default.
- Optional online dog images via `random.dog`, with `dog.ceo` as a fallback, can be enabled after a warning and permission prompt.
- Bundled animal photos include wide, rectangle, and tall variants so ad slots get shape-appropriate images without shipping oversized originals.

## Store Materials

- Upload fields: [`CHROME_STORE_UPLOAD_FIELDS.md`](CHROME_STORE_UPLOAD_FIELDS.md)
- Privacy practice answers: [`CHROME_PRIVACY_PRACTICES_FIELDS.md`](CHROME_PRIVACY_PRACTICES_FIELDS.md)
- Upload-ready images: [`store-assets/upload-ready`](store-assets/upload-ready)

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
- Fox: [`Red Fox (Vulpes vulpes) (48490221346).jpg`](https://commons.wikimedia.org/wiki/File:Red_Fox_(Vulpes_vulpes)_(48490221346).jpg) by GlacierNPS, Wikimedia Commons, public domain.
- Rabbit: [`Close rabbit (27710327815).jpg`](https://commons.wikimedia.org/wiki/File:Close_rabbit_(27710327815).jpg) by Mara Koenig/USFWS, Wikimedia Commons, public domain.
- Otter: [`Sea Otter (38683305191).jpg`](https://commons.wikimedia.org/wiki/File:Sea_Otter_(38683305191).jpg) by David Ledig/BLM, Wikimedia Commons, public domain.
