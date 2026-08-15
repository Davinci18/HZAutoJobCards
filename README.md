# HZ Auto Job Card App — No-Server Version

This version does **not** use IIS, ASP, a database, SMTP, or a mail server.

## How it works
1. Open the app on your phone.
2. Choose one of the three HZ Auto forms.
3. Fill it in and collect signatures.
4. Review the generated form.
5. Tap **Share PDF**.
6. The phone's normal share menu opens. Choose Gmail, Outlook, WhatsApp, Drive, etc.
7. If direct file sharing is unavailable, tap **Download PDF** and share the PDF from the phone's Downloads/Files app.

## Important limitation
A normal browser cannot securely and silently send an email with a PDF attachment just from an email address typed into the page. That would require an authenticated email service/API. This version deliberately avoids that complexity.

## Best way to use it on the road
Host these static files on any HTTPS static host (for example Cloudflare Pages or GitHub Pages). There is no backend code and your home PC can be switched off. Add the site to your phone's Home Screen so it behaves like an app.

The Web Share API is designed to pass files such as PDFs to installed apps, but availability depends on the phone/browser. The fallback is always Download PDF.

## Files actually needed for hosting
- index.html
- manifest.json
- sw.js
- assets/

The app contains no server-side code.

## Offline use
The app uses a service worker to cache its local files. The PDF libraries are currently loaded from CDN and are cached after they have been loaded while the app is online. For the safest first setup, open/reload the app while connected before relying on it offline.
