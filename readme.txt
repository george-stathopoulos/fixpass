=== Fixpass ===
Contributors: georgestathopoulos
Tags: support, remote access, temporary login, debugging, troubleshooting
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Give your support team safe, temporary access to your site, and Spotlight the exact spot that's broken.

== Description ==

Something's wrong with your site and you need help. Usually that means a long email thread: describing the problem, sharing a password, sending screenshots, answering "which page?" and "which browser?".

Fixpass does it in a minute:

* **Spotlight the problem.** Click "Spotlight a problem" in the toolbar, then click the broken part of the page or drag a box around it. Add a note. Your support team opens that page with the spot highlighted, along with your screen size, browser and any errors on the page. Nothing on your screen is recorded.
* **Give access, safely.** One click creates a temporary administrator account for your support team, with a login link instead of a password. Choose 1 day to a week; extend or end it any time. When access ends, the account is deleted.
* **Copy the details.** One button copies the login link, your spots, site health and your plugins and themes, ready to paste into an email or ticket.
* **See what's happening.** The status shows when support logs in, logs out or finishes, and updates by itself.

Once support logs in, they get a Support session page with your spots, full site details, the debug log, errors, scheduled tasks and **troubleshooting mode**, which switches plugins off in their browser only. Your visitors never notice.

= Security =

* Login links are random 256-bit codes; only a hash is stored.
* Reusable links (support can come back until access ends) or one-time links.
* Password login is switched off for support accounts. They can't manage users or remove Fixpass.
* However access ends, the support account is deleted.
* Nothing is sent outside your site unless you send it.

Optionally, Fixpass removes itself when access ends.

Documentation: https://github.com/george-stathopoulos/fixpass/tree/main/docs

== Installation ==

1. Install and activate Fixpass from Plugins → Add New, or upload the zip.
2. Fixpass opens with a short tour.
3. To get help: Spotlight the problem (optional), choose how long support can stay, click Give access, then Copy details and send them to your support team.

== Frequently Asked Questions ==

= Do I need an account anywhere? =

No. Fixpass runs entirely on your site.

= Who is "support"? =

Whoever helps you with your site: a developer, an agency, a plugin or theme vendor.

= Reusable or one-time link? =

Reusable, in most cases: support often needs to log in more than once over a few days. One-time is the strictest option.

= Will visitors notice anything? =

No. Spotlight and the support tools only show for administrators, and troubleshooting mode only affects support's browser.

= What does uninstalling remove? =

Every support account, Fixpass's tables and settings, the troubleshooting must-use plugin and Fixpass's scheduled tasks.

== Privacy ==

Fixpass doesn't send data to any external service. The access details (login link, spots, site health, plugins and themes) only leave your site when you copy and send them. Spots keep the page address, your note, your screen size and browser, and errors on that page, for 90 days. Passwords, keys and email addresses are removed from the site details support sees.

== Changelog ==

= 1.0.0 =
* First release: support access with reusable or one-time links, Spotlight, copyable access details, live status, Support session with site details, debugging tools and troubleshooting mode, welcome tour.
