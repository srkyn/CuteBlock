# Chrome Web Store Listing Draft

## Single Purpose

CuteBlock replaces obvious ad containers with bundled cute animal photos while preserving the page layout. Users can pause CuteBlock globally or on specific sites.

## Short Description

Replace annoying ads with cute animal photos.

## Detailed Description

CuteBlock is a playful ad replacement extension. Instead of collapsing ad slots and leaving awkward blank space, it swaps likely ad containers for bundled animal photos packaged with the extension.

Current controls:

- Pause CuteBlock globally.
- Pause CuteBlock on the current site.
- Choose an animal theme.
- Choose photo fit behavior.
- Adjust replacement level.

## Permission Rationale

- `storage`: Saves user settings such as theme, replacement level, and paused sites.
- Content script access on all sites: CuteBlock's core purpose is to replace ads across the web by default. Users can pause it globally or per site from the popup.

## Submission Checklist

- [ ] Run `npm run check`.
- [ ] Run `npm run package`.
- [ ] Upload `dist/CuteBlock-0.2.1.zip`.
- [ ] Add `store-assets/cuteblock-test-page.png` as a screenshot.
- [ ] Use `PRIVACY.md` for the privacy policy text or hosted privacy page.
