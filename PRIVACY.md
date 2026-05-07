# Privacy

CuteBlock replaces likely ad containers in the page with bundled animal photos by default.

## Default Mode

- CuteBlock runs locally in the browser.
- Bundled photos are loaded from the extension package.
- Settings are stored with Chrome/Edge extension sync storage.
- CuteBlock does not collect, sell, or transmit browsing history.

## Optional Random Dog API Mode

If you choose **Random dog photos** in the popup and approve the permission prompt, replaced ad slots may request images from:

- `https://random.dog/`
- `https://dog.ceo/`

Those services will receive normal web request metadata from your browser, such as IP address, user agent, and referrer behavior controlled by the browser. Bundled photos remain the default and do not require external image requests.

## Permissions

CuteBlock uses all-site content script matching so it can detect ad containers on pages where it is enabled. The popup includes a per-site pause control when you do not want CuteBlock active on a site.
