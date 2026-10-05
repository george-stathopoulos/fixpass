/**
 * Captures documentation screenshots from a local Playground site running dev/screenshots.json
 * (Bluebird Bakery with Fixpass active and the demo content seeded):
 *
 *   npx @wp-playground/cli@latest server --port=9507 --workers=1 \
 *     --mount=.:/wordpress/wp-content/plugins/fixpass --blueprint=dev/screenshots.json
 *
 * Usage: node dev/screenshots.mjs [baseUrl]
 * Writes PNGs to docs/images/. Start from a fresh site: the tour and Spotlight intro show only once,
 * and only one support access can be open at a time.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[ 2 ] || 'http://127.0.0.1:9507';
const FIXPASS = `${ BASE }/wp-admin/admin.php?page=fixpass`;
const OUT = 'docs/images';
mkdirSync( OUT, { recursive: true } );

const browser = await chromium.launch( { channel: 'chrome' } );

async function newContext( { width = 1440, height = 900, theme = 'light' } = {} ) {
	const context = await browser.newContext( {
		viewport: { width, height },
		deviceScaleFactor: 2,
		locale: 'en-US',
		colorScheme: theme,
		permissions: [ 'clipboard-read', 'clipboard-write' ],
		// A regular browser name in the spot details, not "HeadlessChrome".
		userAgent: ( await browser.newBrowserCDPSession().then( ( c ) => c.send( 'Browser.getVersion' ) ) ).userAgent.replace( 'HeadlessChrome', 'Chrome' ),
	} );
	return context;
}

async function logIn( page ) {
	await page.goto( `${ BASE }/wp-admin/` );
	// Playground may log the first visit in by itself (login: true); otherwise use its documented
	// default credentials for local test sites.
	if ( await page.locator( '#user_login' ).count() ) {
		await page.fill( '#user_login', 'admin' );
		await page.fill( '#user_pass', 'password' );
		await page.click( '#wp-submit' );
	}
	await page.waitForURL( /wp-admin/ );
	await page.waitForSelector( '#wpadminbar' );
}

async function settle( page, ms = 700 ) {
	await page.waitForLoadState( 'networkidle' ).catch( () => {} );
	await page.waitForTimeout( ms );
}

async function shot( page, name, opts = {} ) {
	if ( ! opts.keepMouse ) {
		await page.mouse.move( 1300, 860 );
	}
	await page.waitForTimeout( 300 );
	if ( opts.fullPage ) {
		// Grow the window to the page height so wp-admin's fixed sidebar spans the whole image.
		const size = page.viewportSize();
		const height = await page.evaluate( () => document.documentElement.scrollHeight );
		await page.setViewportSize( { width: size.width, height: Math.max( size.height, height ) } );
		await page.waitForTimeout( 500 );
		await page.screenshot( { path: `${ OUT }/${ name }.png` } );
		await page.setViewportSize( size );
	} else {
		await page.screenshot( { path: `${ OUT }/${ name }.png`, clip: opts.clip } );
	}
	console.log( `${ OUT }/${ name }.png` );
}

async function element( locator, name, pad = 0 ) {
	await locator.evaluate( ( el ) => el.scrollIntoView( { block: 'center' } ) );
	const page = locator.page();
	await page.waitForTimeout( 300 );
	const b = await locator.boundingBox();
	await page.screenshot( {
		path: `${ OUT }/${ name }.png`,
		clip: { x: Math.max( 0, b.x - pad ), y: Math.max( 0, b.y - pad ), width: b.width + pad * 2, height: b.height + pad * 2 },
	} );
	console.log( `${ OUT }/${ name }.png` );
}

/* ---------------------------------------------------------------- Site owner */

const owner = await newContext();
const page = await owner.newPage();
await logIn( page );

// The tour: welcome, then the Spotlight step (the toolbar button glows).
await page.goto( FIXPASS );
await page.waitForSelector( '.fxp-tour__title' );
await settle( page );
await shot( page, 'tour-welcome' );
await page.getByRole( 'button', { name: 'Next' } ).click();
await page.getByRole( 'button', { name: 'Next' } ).click();
await settle( page, 1200 );
await shot( page, 'tour-spotlight' );
await page.getByRole( 'button', { name: 'Next' } ).click();
await settle( page );
// Last step: "Don't show this again" is ticked by default; finish the tour.
await page.getByRole( 'button', { name: 'Let’s go' } ).click();
await settle( page, 1200 );
await shot( page, 'home', { fullPage: true } );

// Spotlight on the page with the problem.
await page.goto( `${ BASE }/order-a-cake/` );
await settle( page );
await page.click( '#wp-admin-bar-fixpass-spotlight a' );
await page.waitForSelector( '.fxp-pin-intro' );
await page.waitForTimeout( 500 );
await shot( page, 'spotlight-intro' );
await page.locator( '.fxp-pin-intro .fxp-pin-btn.is-primary' ).click();
const button = page.locator( '.wp-block-button__link' ).first();
const box = await button.boundingBox();
await page.mouse.move( box.x + box.width / 2, box.y + box.height / 2 );
await page.waitForTimeout( 500 );
await shot( page, 'spotlight-pick', { keepMouse: true } );
await page.mouse.down();
await page.mouse.up();
await page.waitForSelector( '.fxp-pin-panel' );
await page.locator( '.fxp-pin-panel input' ).fill( 'This button does nothing' );
await page.waitForTimeout( 400 );
await shot( page, 'spotlight-note', { keepMouse: true } );
await page.locator( '.fxp-pin-panel .fxp-pin-btn.is-primary' ).click();
await page.waitForURL( /page=fixpass/ );
await settle( page, 1500 );
await shot( page, 'give-access', { fullPage: true } );

// Give access, then copy the details (the clipboard holds the login link support will use).
await page.getByRole( 'button', { name: 'Give access' } ).click();
await settle( page, 1500 );
await page.getByRole( 'button', { name: /Copy details/ } ).first().click();
await page.waitForTimeout( 800 );
const details = await page.evaluate( () => navigator.clipboard.readText() );
const link = ( details.match( /https?:\/\/\S*fixpass\S*/i ) || details.match( /https?:\/\/\S+/ ) || [] )[ 0 ];
if ( ! link ) {
	throw new Error( 'No login link in the copied details:\n' + details.slice( 0, 400 ) );
}
await shot( page, 'access-open', { fullPage: true } );

// The Users screen labels the support account.
await page.goto( `${ BASE }/wp-admin/users.php` );
await settle( page );
await element( page.locator( '.wp-list-table' ), 'users-column', 2 );

/* ---------------------------------------------------------------- Support */

const support = await newContext();
const sp = await support.newPage();
await sp.goto( link.replace( /[)>.,]+$/, '' ) );
await settle( sp );
await shot( sp, 'support-confirm' );
await sp.getByRole( 'button', { name: /Log in as support/ } ).click();
await sp.waitForURL( /wp-admin/ );
await settle( sp, 1500 );
await shot( sp, 'support-session', { fullPage: true } );

// Open and highlight: the page with the owner's spot drawn on it.
const [ highlighted ] = await Promise.all( [
	support.waitForEvent( 'page', { timeout: 5000 } ).catch( () => null ),
	sp.getByRole( 'link', { name: /Open and highlight/ } ).first().click(),
] );
const hp = highlighted || sp;
await settle( hp, 1800 );
await shot( hp, 'support-highlight' );
if ( highlighted ) {
	await highlighted.close();
} else {
	await sp.goBack();
	await settle( sp, 1200 );
}

for ( const [ tab, name ] of [
	[ 'Site details', 'support-details' ],
	[ 'Debugging', 'support-debug' ],
	[ 'Troubleshoot', 'support-troubleshoot' ],
] ) {
	await sp.getByRole( 'link', { name: tab } ).or( sp.getByRole( 'button', { name: tab } ) ).first().click();
	await settle( sp, 1500 );
	await shot( sp, name, { fullPage: true } );
}

/* ---------------------------------------------------------------- Back to the owner */

await page.goto( FIXPASS );
await settle( page, 2000 );
await shot( page, 'status-working' );

// The same page in the dark theme.
const dark = await newContext( { theme: 'dark' } );
const dp = await dark.newPage();
await logIn( dp );
await dp.goto( FIXPASS );
await settle( dp, 2000 );
await shot( dp, 'status-working-dark' );

await browser.close();
