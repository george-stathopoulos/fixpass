=== Fixpass ===
Contributors: mindanticipation
Tags: support, remote access, temporary login, debugging, troubleshooting
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.1.0
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

Optionally, Fixpass deactivates and deletes itself when access ends, together with its access history.

Documentation: https://github.com/george-stathopoulos/fixpass/tree/main/docs

== Installation ==

1. Install and activate Fixpass from Plugins → Add New, or upload the zip.
2. Fixpass opens with a short tour.
3. To get help, choose "Show the problem, then give access" (recommended) or "Just give access". With the first, you point at the problem on your site, add a note, then give access. Then copy the details and send them to your support team.

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

= 1.1.0 =
* New: let support extend access themselves. Optional, off by default: support can add 1 or 24 hours at a time from their Support session page, up to a limit you set (1 week, 2 weeks or 30 days from now, or a specific date). You get an email each time, and support stays logged in.
* New: the access history now says who did what (you, support or Fixpass), in plain words. Access given, extended and ended stand out with colour; what support did is shown in smaller text between them. The CSV has a "Who" column.
* Fix: Fixpass's own screens no longer clutter the history with lines like "Saved data through the REST API".

= 1.0.3 =
* New: Access history on the Fixpass page: when access was given, extended and ended, when support logged in and out, and what support did. Download it (CSV), delete it, and choose to keep it for 30, 90 or 365 days.
* New: the Spotlight button keeps pulsing on your site, with a hint beside it, after you choose "Show the problem, then give access".
* New: the Fixpass page checks for support logging in every few seconds, and as soon as you return to the tab.
* Change: the login link choice and the delete option are always visible, and shown before the Give access button.
* Change: "Remove Fixpass when access ends" is now "Delete Fixpass when access ends", and says that the access history is deleted with it.
* Change: Skip the tour now hides the tour for good (take it again any time from the page).
* Change: shorter time estimates on the two start buttons.

= 1.0.2 =
* Fix: in troubleshooting mode, Fixpass switched itself off for support (it showed as inactive and couldn't be activated) when the plugin folder wasn't called "fixpass", for example after installing GitHub's "Download ZIP". Fixpass now always stays on, whatever its folder is called.
* Change: support can no longer install or delete themes, which could break the site for visitors. To try a default theme, support uses troubleshooting mode, which only changes their own browser.

= 1.0.1 =
* New: the Fixpass page now starts with two big choices, "Show the problem, then give access" (recommended) and "Just give access". The first walks you through Spotlight, shows your spots, and then gives access.
* New: the welcome tour starts with Spotlight and explains the two choices.
* Fix: the Fixpass page stayed on "Loading…" on WordPress 6.5, which has no JSX runtime script. It is now bundled.
* Fix: a clear message instead of an endless "Loading…" if the plugin's built files are missing (for example after installing GitHub's "Download ZIP").

= 1.0.0 =
* First release: support access with reusable or one-time links, Spotlight, copyable access details, live status, Support session with site details, debugging tools and troubleshooting mode, welcome tour.
