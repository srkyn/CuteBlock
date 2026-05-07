# CuteBlock

CuteBlock is a playful browser extension that replaces obvious ad containers with cute animal panels instead of collapsing the page layout.

## Load It In Chrome Or Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable developer mode.
3. Choose **Load unpacked**.
4. Select this folder: `C:\Users\Admin\Documents\CSProjects\CuteBlock`.

## Try It

Open `test/ad-test.html` in the browser after loading the extension. The fake ad slots should become animal cards.

## Current MVP

- Manifest V3 extension.
- DOM-level replacement for common ad selectors, sponsored blocks, and ad-like class/id names.
- MutationObserver support for ads inserted after page load.
- Popup settings for enable/disable, animal theme, and replacement level.
- No external image requests.

## Next Good Steps

- Add an allowlist for sites where the user wants ads unchanged.
- Add stronger blocklist support from a maintained filter list.
- Add more bundled animal art packs.
- Add per-site replacement stats.

## Photo Credits

Bundled photos were resized and center-cropped for use as extension assets.

- Cat: [`Cat-1046544.jpg`](https://commons.wikimedia.org/wiki/File:Cat-1046544.jpg), Wikimedia Commons, CC0 1.0.
- Dog: [`1Cute-doggy.jpg`](https://commons.wikimedia.org/wiki/File:1Cute-doggy.jpg), Wikimedia Commons, CC0 1.0.
- Capybara: [`Bristol.zoo.capybara.arp.jpg`](https://commons.wikimedia.org/wiki/File:Bristol.zoo.capybara.arp.jpg), Wikimedia Commons, public domain.
- Bird: [`Colorful_Bird.jpg`](https://commons.wikimedia.org/wiki/File:Colorful_Bird.jpg) by Jim, Wikimedia Commons, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
