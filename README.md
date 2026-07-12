# LivUp Invoice Generator

A zero-build static web app that generates **LivUp-branded PDF invoices**, matching the supplied
sample design. Edit the fields on the left, watch the live preview update, then click **Download PDF**.

No build tooling, no Node.js, no server — it's plain HTML/CSS/JS with the PDF libraries vendored locally.

## Run locally

Just open the file in a browser:

```bash
open index.html      # macOS
```

> The Poppins font loads from Google Fonts, so keep an internet connection for the exact font in the PDF.
> Everything else (logo, PDF libraries) is bundled and works offline.

## Features

- **Full form generator** — edit header/contact, date, invoice number, client, line items, bank details, footer.
- **Dynamic line items** — add/remove rows. Enter a **negative price** for a discount.
- **Auto totals** — subtotal, discount, and total calculate automatically. The DISCOUNT line only
  shows when a discount exists (discount is optional).
- **Optional logo** — defaults to the LivUp logo; upload your own to override.
- **Pixel-matched PDF** — exports an A4 PDF that mirrors the on-screen invoice.

## Deploy to Netlify

**Option A — drag & drop:** go to Netlify → *Add new site → Deploy manually* → drag this folder in. Done.

**Option B — connect a Git repo:**
- Build command: *(leave empty)*
- Publish directory: `.`

`netlify.toml` already encodes these settings.

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | App shell — form panel + live invoice preview |
| `styles.css` | App chrome + pixel-matched invoice layout (Poppins) |
| `app.js` | State, dynamic line items, totals, PDF export |
| `logo.js` | LivUp logo inlined as a base64 data URI |
| `vendor/` | `jspdf` + `html2canvas` (vendored, no runtime CDN) |
| `netlify.toml` | Netlify config (no build, publish root) |
| `assets/` | Original sample invoice + logo source |
