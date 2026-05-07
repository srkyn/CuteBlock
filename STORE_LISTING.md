# Chrome Web Store Listing Draft

## Single Purpose

CuteBlock replaces likely ad containers with cute animal photos while preserving page layout. Users can pause CuteBlock globally or on specific sites.

## Short Description

Replace annoying ads with cute animal photos.

## Detailed Description

CuteBlock is a playful ad replacement extension. Instead of collapsing ad slots and leaving awkward blank space, it swaps likely ad containers for animal photos while keeping the original slot shape. Bundled photos are packaged with the extension by default, including cats, dogs, birds, capybaras, foxes, rabbits, and otters. Optional random dog photos can be enabled after a warning and browser permission prompt.

Current controls:

- Pause CuteBlock globally.
- Pause CuteBlock on the current site.
- Choose an animal theme.
- Choose bundled photos or optional random dog photos.
- Choose photo fit behavior.
- Adjust replacement level.

## Permission Rationale

- `storage`: Saves user settings such as theme, replacement level, and paused sites.
- Content script access on all sites: CuteBlock's core purpose is to replace ads across the web by default. Users can pause it globally or per site from the popup.
- Optional host access for `https://random.dog/*` and `https://dog.ceo/*`: Used only if the user chooses Random dog API and approves the browser permission prompt.

## Submission Checklist

- [ ] Run `npm run check`.
- [ ] Run `npm run package`.
- [ ] Upload `dist/CuteBlock-0.2.5.zip`.
- [ ] Add `store-assets/upload-ready/screenshot-1280x800.jpg` as a screenshot.
- [ ] Use `PRIVACY.md` for the privacy policy text or hosted privacy page.
- [ ] Confirm optional remote dog image behavior is disclosed.
