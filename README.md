# Fixpass

**Show support where it breaks. Let them in safely. Get it fixed.**

[Website](https://george-stathopoulos.github.io/fixpass/) · [Download](https://github.com/george-stathopoulos/fixpass/releases/latest) · [Documentation](docs/README.md)

Fixpass is a free WordPress plugin for the moment something on your site goes wrong and you need help. It does two things that usually take a long email thread:

- **Safe, temporary access for your support team.** One click creates a login link for a temporary administrator account. No password is shared, access ends by itself (1 day to a week), and the account is deleted when it does.
- **Spotlight.** Instead of describing the problem, point at it. Click the broken part of the page, or drag a box around it, add a note, and your support team opens that page with the spot highlighted: the address, your screen size and browser, and any errors on the page come with it.

Once support logs in, they get a Support session page with your spots, full site details, the debug log, scheduled tasks and **troubleshooting mode**, which switches plugins off in their browser only, so your visitors never notice.

> Lost in translation no more: your support team sees exactly what you see, and gets in without a password.

## Features

| | |
|---|---|
| **Give access** | Full administrator access for 1, 2, 3 or 5 days, or a week. Extend by 24 hours (up to 30 days), end it any time. |
| **Reusable or one-time link** | Reusable (recommended): support logs in as often as they need until access ends. One-time: a single login. |
| **Copy the details** | One button copies the login link, your spots, site health and your plugins and themes, formatted for email or as plain text. |
| **Live status** | Waiting for support, support working on your site, logged out, ended. Updates by itself. |
| **Spotlight** | "Spotlight a problem" in the toolbar, on the site and in the dashboard. Up to 5 spots per page, each with a note. |
| **Support session** | Support sees your spots, site details, the debug log, errors, scheduled tasks and troubleshooting mode. Only support sees these. |
| **Troubleshooting mode** | Switch plugins off, or use a default theme, for support's browser only. |
| **Clean up** | The support account is deleted when access ends. Optionally, Fixpass removes itself too. |
| **Welcome tour** | A short animated tour the first time, and any time after. |

## Install

1. Download `fixpass.zip` from the [latest release](https://github.com/george-stathopoulos/fixpass/releases/latest), or build it yourself (see [Development](#development)).
2. In WordPress, go to **Plugins → Add New → Upload Plugin**, choose the zip, then **Activate**.
3. You land on **Fixpass**, with a short tour.

Requires WordPress 6.5 or later and PHP 7.4 or later.

## Quick start

1. If you can see the problem, go to that page and click **Spotlight a problem** in the toolbar. Click it or drag a box around it, then **Continue**.
2. On the Fixpass page, choose how long support can stay and click **Give access**.
3. Click **Copy details** and paste them into a reply to your support team.
4. Watch the status: you'll see when support logs in and when they're done.

## Documentation

Full guides are in [`docs/`](docs/README.md):

- [Getting started](docs/getting-started.md)
- [Giving support access](docs/giving-access.md)
- [Spotlight](docs/spotlight.md)
- [For support teams](docs/for-support-teams.md)
- [Troubleshooting mode](docs/troubleshooting-mode.md)
- [Security](docs/security.md)
- [FAQ](docs/faq.md)
- [Developers](docs/developers.md)

## Security

Login links are random 256-bit codes; only a hash is stored. Password login is switched off for support accounts, they can't manage users, and every way access ends deletes the account. See [docs/security.md](docs/security.md), and report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development

```bash
npm install
npm run build      # build/ (the admin app)
npm run zip        # dist/fixpass.zip, ready to upload
```

`npm start` rebuilds as you edit. `dev/blueprint.json` is a [WordPress Playground](https://wordpress.org/playground/) blueprint for a test site with sample debug-log lines.

The website is built by `website/build.mjs` (the homepage, plus a help center generated from `docs/`); `bin/publish-site.sh` builds and publishes it to GitHub Pages.

Plugin code: `fixpass.php`, `includes/` (PHP), `assets/spotlight.js` (the Spotlight overlay, plain JavaScript), `src/` (the React admin app), `mu-plugin/` (troubleshooting mode loader).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
