# Security

Fixpass gives someone else administrator access to your site, so it's built to keep that access narrow, short and visible.

## The account

- Support gets a **temporary full administrator** account, created when you give access. Only give access when you need help.
- **No password:** WordPress creates the account, but password login is switched off for it. The login link is the only way in.
- Support **can't manage users** (create, edit, promote or delete), so no account outlives their access, and **can't deactivate or delete Fixpass**.
- Support's login session can't last longer than the access.
- The account is listed in **Users**, labelled as a temporary support account.

## The link

- A **random 256-bit code**. Only a fingerprint (SHA-256 hash) of it is stored, so it can't be read back from your database.
- A **one-time link** works for a single login.
- A **reusable link** works until access ends, so share it only with your support team, as you would a password. It isn't stored on your site either: it's rebuilt each time from a random value and your site's own secret keys (in `wp-config.php`).
- Opening the link shows a **confirmation page** first, so email scanners that check links can't use it.
- Wrong links are **rate-limited**: 10 per address per hour.

## Access ends, the account goes

However access ends, the support account is **deleted for good**, not just switched off:

- you click **End access now**;
- support clicks **End access**;
- the time runs out (checked on every request, not only by scheduled tasks);
- someone deletes the support account;
- Fixpass is deactivated or uninstalled.

Content support created is kept and given to you.

## What support sees

- After logging in: site details, health checks, the end of your debug log and troubleshooting mode. **Passwords, keys and email addresses are removed** from the details Fixpass collects.
- As administrators, they can open any screen you can, so treat access as you would giving someone your keys for a few days.
- Troubleshooting mode only changes support's own browser.

## Spotlight

Nothing on your screen is recorded or uploaded. A spot keeps the page address and title, where on the page you pointed, your note, your screen size and browser, and errors on that page. The public highlight link only returns where the spot is on the page.

## What's sent outside your site

Nothing, automatically. Fixpass doesn't call any external service. The access details only leave your site when you copy and send them.

## Good to know

- A full administrator can install plugins or edit code, which could leave something behind after access ends. Only give access to people you trust.
- Login links are part of the URL, so they can appear in your web server's access logs. A reusable link stays valid until access ends.

## Reporting a vulnerability

Please don't open a public issue. See [SECURITY.md](../SECURITY.md).
