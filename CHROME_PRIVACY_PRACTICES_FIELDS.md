# Chrome Web Store Privacy Practices Fields

Use these on the **Privacy practices** tab.

## Single Purpose Description

```text
CuteBlock replaces likely ad containers on webpages with cute animal photos while preserving page layout. Users can pause CuteBlock globally or on individual sites, choose an animal theme, adjust replacement level, choose how photos fit ad slots, and optionally enable random dog photos after a warning and browser permission prompt.
```

## Host Permission Justification

```text
CuteBlock runs on webpages so it can detect likely ad containers and replace them with bundled animal photos. This is the extension's core purpose. CuteBlock needs page access to inspect page elements, identify likely ad slots, and replace those slots in the page layout. Users can pause CuteBlock globally or pause it for the current site from the popup.
```

## Optional Host Permission Justification

```text
CuteBlock asks for access to https://random.dog/* and https://dog.ceo/* only if the user chooses the optional Random dog API image source. Before requesting this permission, CuteBlock shows a warning explaining that those services may receive normal web request metadata. If the user declines, CuteBlock continues using bundled photos.
```

## Remote Code Use

If the form asks whether the extension uses remote code, answer:

```text
No
```

If the form still requests a text explanation, use:

```text
CuteBlock does not execute remotely hosted code. All JavaScript, CSS, filter rules, and animal photos are packaged with the extension. The extension does not load or execute scripts from remote servers.
```

## storage Justification

```text
CuteBlock uses storage to save user preferences, including whether the extension is enabled, paused sites, animal theme, replacement level, and photo fit mode. These settings are stored by the browser's extension storage system so the user's choices persist between browsing sessions.
```

## Optional Remote Image Disclosure

```text
Bundled animal photos are the default image source. If the user chooses Random dog API and approves the browser permission prompt, CuteBlock may request image URLs from random.dog or dog.ceo. Those services may receive normal web request metadata such as IP address and user agent. CuteBlock does not send browsing history or personal data to those services.
```

## Data Usage Certification

If Chrome asks you to certify compliance with Developer Program Policies, check the certification box after reviewing the fields above.

## Contact Email

This must be your publisher email, entered on the Chrome Web Store developer dashboard **Settings** page. After entering it, start the verification process and click the verification link Google sends you.

## Data Collection Answers

If the Privacy practices tab asks whether CuteBlock collects user data, use:

```text
No, this extension does not collect user data.
```

Rationale:

```text
CuteBlock stores user preferences locally through browser extension storage. CuteBlock does not collect, sell, or transmit browsing history, personal communications, location, financial information, health information, authentication information, or website content.
```
