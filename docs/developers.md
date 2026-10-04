# Developers

## Requirements and layout

WordPress 6.5+, PHP 7.4+.

| Path | What |
|---|---|
| `fixpass.php` | Bootstrap, constants (`FIXPASS_VERSION`, `FIXPASS_FILE`, `FIXPASS_DIR`, `FIXPASS_URL`) |
| `includes/` | PHP classes, prefixed `Fixpass_` |
| `assets/spotlight.js`, `assets/spotlight.css` | The Spotlight overlay and highlighter (plain JavaScript, any page) |
| `src/` | The React admin app (`@wordpress/scripts`), built to `build/` |
| `mu-plugin/fixpass-troubleshoot.php` | Copied to `wp-content/mu-plugins/` while troubleshooting mode is in use |
| `uninstall.php` | Removes everything on uninstall |
| `dev/blueprint.json` | WordPress Playground blueprint for a test site |

Build: `npm install`, then `npm run build`, or `npm run zip` for `dist/fixpass.zip`.

## Filters

| Filter | Arguments | Use |
|---|---|---|
| `fixpass_spotlight` | `bool $on` | Offer Spotlight ("Spotlight a problem" in the toolbar) or not. |
| `fixpass_diagnostics` | `array $data, string[] $sections` | Add to, or change, the site details support sees. |
| `fixpass_health_flags` | `array $flags, array $data` | Add or remove health flags ("things to look at"). |
| `fixpass_known_conflicts` | `array[] $rules` | Known plugin conflicts to flag. |
| `fixpass_overlap_groups` | `array $groups` | Groups of plugins that do the same job (two caching plugins, for example). |
| `fixpass_redact` | `string $text` | Redact more from text before support sees it (after Fixpass removes passwords, keys and email addresses). |
| `fixpass_describe_log` | `string $text, array $row` | How a log entry is described. |

Example: keep Spotlight off on a staging site.

```php
add_filter( 'fixpass_spotlight', function ( $on ) {
	return 'staging' === wp_get_environment_type() ? false : $on;
} );
```

## Actions

| Action | Arguments | When |
|---|---|---|
| `fixpass_access_granted` | `int $grant_id, array $args` | Support access was given. |
| `fixpass_access_changed` | `int $grant_id, string $event` | `extended`, `login`, `revoked`, `expired`, `support_ended`, `deleted` or `deactivated`. |

Example: post to a chat when support logs in.

```php
add_action( 'fixpass_access_changed', function ( $grant_id, $event ) {
	if ( 'login' === $event ) {
		// Notify your team.
	}
}, 10, 2 );
```

## REST API

Namespace `fixpass/v1`. All routes need a logged-in user and the standard `X-WP-Nonce` header.

**Site owner** (administrators; never a support account):

| Route | Method | |
|---|---|---|
| `/admin/state` | GET | Access status, lengths, Spotlight on or off |
| `/admin/link` | POST | Give access: `hours`, `pins` (comma-separated spot IDs), `reusable`, `cleanup`. Returns the access details (`subject`, `html`, `text`) |
| `/admin/copy` | POST | Mark the details copied; `fresh=1` rebuilds them (and the link) |
| `/admin/extend` | POST | +24 hours, up to 30 days from when access was given |
| `/admin/end` | POST | End access now |
| `/admin/spotlight` | POST | `enabled`: Spotlight on or off |
| `/admin/onboarding` | POST | `done`: hide or show the welcome tour |
| `/admin/spot` | POST | Save spots from the overlay |
| `/admin/spot/{id}` | GET | A spot, with its note and page details |

**Support** (logged in with a Fixpass link):

| Route | Method | |
|---|---|---|
| `/admin/session` | GET | The session and the spots sent |
| `/admin/session/leave` | POST | Log out; access stays open |
| `/admin/session/end` | POST | End access; the account is deleted |
| `/admin/health` | GET | Site details and health flags |
| `/admin/debug` | GET | debug.log (`lines`, `search`), errors, scheduled tasks, constants |
| `/admin/troubleshoot` | GET, POST | Troubleshooting mode (`keep`, `theme`; `op=stop`) |

**Public:** `/spot/{id}` (GET) returns only where a spot is on its page (selector, path, box), for the highlighter. The 32-character random ID is the key.

## Data stored

| Where | What |
|---|---|
| `{prefix}fixpass_grants` | One row per access: role, length, link hash, status, timestamps |
| `{prefix}fixpass_log` | Errors caught, support activity and access events; pruned after 90 days |
| `fixpass_settings` | Spotlight on or off |
| `fixpass_pins` | Spots (kept 90 days) |
| `fixpass_last_shared` | Which spots went with the latest link |
| `fixpass_onboarded` | The welcome tour was dismissed |
| `fixpass_troubleshoot` | Troubleshooting sessions |
| `fixpass_db` | Database version |
| User meta `fixpass_grant` | Marks support accounts |

Scheduled tasks: `fixpass_expire_access` (every 5 minutes), `fixpass_prune` (daily), `fixpass_self_remove` (once, when asked).

## Uninstall

Deletes every support account, both tables, all `fixpass_` options, the troubleshooting must-use plugin and the scheduled tasks.
