# Chrome Web Store Privacy Practices Fields

Use these on the **Privacy practices** tab.

## Single Purpose Description

```text
CuteBlock replaces likely ad containers on webpages with cute animal photos while preserving page layout. Users can pause CuteBlock globally or on individual sites, choose an animal theme, adjust replacement level, and optionally use random dog photos instead of bundled photos.
```

## activeTab Justification

```text
CuteBlock uses activeTab so the popup can identify the currently active tab and show a per-site pause control for that site. This permission is used only when the user opens the popup. CuteBlock does not use activeTab to collect browsing history or transmit tab information.
```

## Host Permission Justification

```text
CuteBlock runs on webpages so it can detect likely ad containers and replace them with bundled animal photos. This is the extension's core purpose. Users can pause CuteBlock globally or pause it for the current site from the popup.

CuteBlock also requests host access for https://random.dog/* and https://dog.ceo/* only to support the optional Random dog API image source. Bundled photos are the default, and these remote image services are not contacted unless the user chooses that image source.
```

## Remote Code Use Justification

```text
CuteBlock does not execute remotely hosted code. All extension JavaScript, CSS, filter rules, and bundled photos are packaged with the extension.

The optional Random dog API setting may fetch remote image files from random.dog or dog.ceo, but those responses are used only as image URLs for ad replacement cards. They are not executed as code.
```

If the form asks whether the extension uses remote code, answer:

```text
No
```

## storage Justification

```text
CuteBlock uses storage to save user preferences, including whether the extension is enabled, paused sites, animal theme, replacement level, image source, and photo fit mode. These settings are stored by the browser's extension storage system so the user's choices persist between browsing sessions.
```

## Data Usage Certification

If Chrome asks you to certify compliance with Developer Program Policies, check the certification box after reviewing the fields above.

## Contact Email

This must be your publisher email, entered on the Chrome Web Store developer dashboard **Settings** page. After entering it, start the verification process and click the verification link Google sends you.

Suggested public-facing support email, if you have one:

```text
Use your preferred support email here.
```

## Data Collection Answers

If the Privacy practices tab asks whether CuteBlock collects user data, use:

```text
No, this extension does not collect user data.
```

Rationale:

```text
CuteBlock stores user preferences locally through browser extension storage. CuteBlock does not collect, sell, or transmit browsing history, personal communications, location, financial information, health information, authentication information, or website content.
```

## Optional Remote Image Disclosure

If there is a field for additional privacy disclosure, use:

```text
Bundled animal photos are the default image source. If the user chooses the optional Random dog API image source, the browser may request image URLs from random.dog or dog.ceo. Those services may receive normal web request metadata such as IP address and user agent. CuteBlock does not send browsing history or personal data to those services.
```
