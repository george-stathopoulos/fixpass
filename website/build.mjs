/**
 * Builds the Fixpass website into website/dist (bin/publish-site.sh publishes it to GitHub Pages).
 *
 * Pages: home, live demo, the Help center generated from ../docs/*.md (so the website and the docs
 * never drift apart), the changelog from readme.txt, and a 404 page. The live demo is a WordPress
 * Playground blueprint served from the site itself (demo/), with the plugin zip next to it. Same layout, footer and project list as
 * the other project sites.
 *
 * Run from the repository root, after npm run zip: node website/build.mjs
 */
import MarkdownIt from 'markdown-it';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

/* ------------------------------------------------------------------ Config */

const SITE = {
	name: 'Fixpass',
	url: 'https://george-stathopoulos.github.io/fixpass/',
	base: '/fixpass/', // Used only by 404.html, which GitHub Pages serves from any path.
	author: 'George Stathopoulos',
	authorUrl: 'https://george-stathopoulos.github.io/',
	repo: 'https://github.com/george-stathopoulos/fixpass',
	download: 'https://github.com/george-stathopoulos/fixpass/releases/latest',
};

// Every project site lists the others (and the personal site keeps them all). Keep this list the
// same in each project's website build.
const PROJECTS = [
	{ name: 'Fixpass', url: 'https://george-stathopoulos.github.io/fixpass/', text: 'Spotlight the problem and give support safe, temporary access' },
	{ name: 'Gatehouse', url: 'https://george-stathopoulos.github.io/gatehouse/', text: 'AI governance and cost control for WordPress' },
	{ name: 'Helpdesk Hero', url: 'https://george-stathopoulos.github.io/helpdesk-hero/', text: 'WordPress support with diagnostics and password-free access' },
];

const ROOT = process.cwd();
const OUT = join( ROOT, 'website/dist' );
const SRC = join( ROOT, 'website/src' );
const readme = readFileSync( join( ROOT, 'readme.txt' ), 'utf8' );
const VERSION = /Stable tag:\s*(\S+)/.exec( readme )[ 1 ];
const PLAYGROUND = `https://playground.wordpress.net/?blueprint-url=${ encodeURIComponent( SITE.url + 'demo/blueprint.json' ) }`;

rmSync( OUT, { recursive: true, force: true } );
mkdirSync( OUT, { recursive: true } );
cpSync( join( SRC, 'assets' ), join( OUT, 'assets' ), { recursive: true } );
writeFileSync( join( OUT, '.nojekyll' ), '' );

// The plugin zip, for the live demo (downloads link to the GitHub release).
{
	const from = join( ROOT, 'dist/fixpass.zip' );
	if ( ! existsSync( from ) ) throw new Error( 'Missing dist/fixpass.zip: run npm run zip first.' );
	mkdirSync( join( OUT, 'downloads' ), { recursive: true } );
	cpSync( from, join( OUT, 'downloads/fixpass.zip' ) );
}

/* ------------------------------------------------------------------ Live demo (WordPress Playground) */

{
	mkdirSync( join( OUT, 'demo' ), { recursive: true } );
	cpSync( join( SRC, 'demo-seed.php' ), join( OUT, 'demo/seed.php.txt' ) );
	const blueprint = {
		$schema: 'https://playground.wordpress.net/blueprint-schema.json',
		meta: { title: 'Fixpass demo', author: SITE.author, description: 'A small bakery site with Fixpass installed, and a page with a problem to spotlight.' },
		landingPage: '/wp-admin/admin.php?page=fixpass',
		preferredVersions: { php: '8.3', wp: 'latest' },
		login: true,
		steps: [
			{ step: 'setSiteOptions', options: { blogname: 'Bluebird Bakery' } },
			// A debug log for the support tools to show. Scheduled tasks stay off in the demo, so
			// "Remove Fixpass when access ends" never removes it while you're trying things.
			{ step: 'defineWpConfigConsts', consts: { WP_DEBUG: true, WP_DEBUG_LOG: true, WP_DEBUG_DISPLAY: false, DISABLE_WP_CRON: true } },
			{ step: 'installPlugin', pluginData: { resource: 'url', url: `${ SITE.url }downloads/fixpass.zip` }, options: { activate: true } },
			{ step: 'writeFile', path: '/wordpress/fixpass-seed.php', data: { resource: 'url', url: `${ SITE.url }demo/seed.php.txt` } },
			{ step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; require '/wordpress/fixpass-seed.php';" },
		],
	};
	writeFileSync( join( OUT, 'demo/blueprint.json' ), JSON.stringify( blueprint, null, '\t' ) + '\n' );
}

/* ------------------------------------------------------------------ Helpers */

const esc = ( s ) => String( s ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ).replace( /"/g, '&quot;' );
const slug = ( t ) =>
	t
		.toLowerCase()
		.replace( /<[^>]+>/g, '' )
		.replace( /[^\p{L}\p{N}\s_-]/gu, '' )
		.trim()
		.replace( /\s/g, '-' );

const svg = ( d, size = 22 ) => `<svg width="${ size }" height="${ size }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ d }</svg>`;
const I = {
	playSm: svg( '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>', 18 ),
	sun: svg( '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 18 ),
	menu: svg( '<path d="M4 7h16M4 12h16M4 17h16"/>', 20 ),
	download: svg( '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 18 ),
	play: svg( '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>' ),
	key: svg( '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>' ),
	spot: svg( '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>' ),
	shield: svg( '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>' ),
	wrench: svg( '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.4-.4-2.6z"/>' ),
	help: svg( '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>' ),
	users: svg( '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>' ),
	code: svg( '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13 4l-2 20"/>' ),
};

/* ------------------------------------------------------------------ Layout */

const NAV = [
	{ id: 'how', label: 'How it works', href: 'index.html#how' },
	{ id: 'features', label: 'Features', href: 'index.html#features' },
	{ id: 'support', label: 'For support teams', href: 'index.html#support' },
	{ id: 'demo', label: 'Live demo', href: 'demo/' },
	{ id: 'docs', label: 'Help center', href: 'docs/' },
];

function logo() {
	return 'Fixpass';
}

function layout( { title, description, root, current = '', body, canonical = '', extraHead = '', home = false } ) {
	const full = title === SITE.name ? `${ SITE.name }: show support where it breaks` : `${ title } · ${ SITE.name }`;
	const fix = ( href ) => ( root === '' && href.startsWith( 'index.html#' ) ? href.slice( 10 ) : root + href );
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${ esc( full ) }</title>
<meta name="description" content="${ esc( description ) }">
<meta name="theme-color" content="#4a3aa7">
<link rel="canonical" href="${ SITE.url }${ canonical }">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${ SITE.name }">
<meta property="og:title" content="${ esc( full ) }">
<meta property="og:description" content="${ esc( description ) }">
<meta property="og:url" content="${ SITE.url }${ canonical }">
<meta property="og:image" content="${ SITE.url }assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ root }assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${ root }assets/site.css?v=${ VERSION }">
<link rel="stylesheet" href="${ root }assets/home.css?v=${ VERSION }">
<script>try{var t=localStorage.getItem('hdh-site-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>
${ extraHead }
</head>
<body data-root="${ root }"${ home ? ' class="is-home"' : '' }>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
	<div class="wrap">
		<a class="brand" href="${ root || './' }">${ logo() }</a>
		<nav id="site-nav" class="nav" aria-label="Main">
			${ NAV.map( ( n ) => `<a href="${ fix( n.href ) }"${ current === n.id ? ' aria-current="page"' : '' }>${ n.label }</a>` ).join( '\n\t\t\t' ) }
		</nav>
		<div class="head-actions">
			<button class="icon-btn" type="button" data-theme-toggle aria-label="Dark theme" aria-pressed="false">${ I.sun }</button>
			<a class="btn btn-primary btn-sm" href="${ SITE.download }">${ I.download } Download</a>
			<button class="icon-btn menu-btn" type="button" data-menu-toggle aria-controls="site-nav" aria-expanded="false" aria-label="Menu">${ I.menu }</button>
		</div>
	</div>
</header>
<main id="main">
${ body }
</main>
<footer class="site-foot">
	<div class="wrap">
		<div class="foot-grid">
			<div class="foot-about">
				<a class="brand" href="${ root || './' }">${ logo() }</a>
				<p>Spotlight the exact spot that's broken, and give your support team safe, temporary access, with no password shared. Free and open source (GPL).</p>
			</div>
			<div>
				<h2>Product</h2>
				<ul>
					<li><a href="${ fix( 'index.html#how' ) }">How it works</a></li>
					<li><a href="${ fix( 'index.html#features' ) }">Features</a></li>
					<li><a href="${ root }demo/">Live demo</a></li>
					<li><a href="${ SITE.download }">Download</a></li>
					<li><a href="${ root }changelog/">Changelog</a></li>
				</ul>
			</div>
			<div>
				<h2>Help</h2>
				<ul>
					<li><a href="${ root }docs/">Help center</a></li>
					<li><a href="${ root }docs/getting-started/">Getting started</a></li>
					<li><a href="${ root }docs/for-support-teams/">For support teams</a></li>
					<li><a href="${ root }docs/faq/">FAQ</a></li>
				</ul>
			</div>
			<div>
				<h2>More projects</h2>
				<ul>
					${ PROJECTS.filter( ( p ) => p.name !== SITE.name ).map( ( p ) => `<li><a href="${ p.url }" title="${ esc( p.text ) }">${ esc( p.name ) }</a></li>` ).join( '' ) }
					<li><a href="${ SITE.authorUrl }#projects">All projects</a></li>
				</ul>
			</div>
			<div>
				<h2>Trust</h2>
				<ul>
					<li><a href="${ root }docs/security/">Security</a></li>
					<li><a href="${ root }docs/security/#whats-sent-outside-your-site">Privacy</a></li>
					<li><a href="${ SITE.repo }/security/advisories/new">Report a vulnerability</a></li>
					<li><a href="${ SITE.repo }/issues">Feedback and ideas</a></li>
				</ul>
			</div>
		</div>
		<div class="foot-bottom">
			<span>Made with <span class="heart" role="img" aria-label="love">♥</span> by <a href="${ SITE.authorUrl }">${ SITE.author }</a></span>
			<span>Fixpass ${ VERSION } · This website uses no cookies and no tracking.</span>
		</div>
	</div>
</footer>
<script src="${ root }assets/site.js?v=${ VERSION }" defer></script>
${ home ? `<script src="${ root }assets/home.js?v=${ VERSION }" defer></script>` : '' }
</body>
</html>
`;
}

function write( path, html ) {
	const file = join( OUT, path );
	mkdirSync( dirname( file ), { recursive: true } );
	writeFileSync( file, html );
}

/* ------------------------------------------------------------------ Help center (docs) */

const GROUPS = [
	{ label: 'Start here', pages: [ 'getting-started' ] },
	{ label: 'For site owners', pages: [ 'giving-access', 'spotlight', 'security', 'faq' ] },
	{ label: 'For support teams', pages: [ 'for-support-teams', 'troubleshooting-mode' ] },
	{ label: 'For developers', pages: [ 'developers' ] },
];
const ORDER = GROUPS.flatMap( ( g ) => g.pages );
const BLURB = {
	'getting-started': 'Install Fixpass, the welcome tour, and your first support request.',
	'giving-access': 'Lengths, reusable or one-time links, copying the details, the status, extending and ending access.',
	spotlight: 'Point at the problem on the page, so support sees exactly what you see.',
	security: 'How access is protected, and what support can and can’t do.',
	faq: 'Quick answers to the most common questions.',
	'for-support-teams': 'Logging in, the Support session page, site details and debugging.',
	'troubleshooting-mode': 'Switch plugins off in your browser only, to find conflicts safely.',
	developers: 'Hooks, the REST API, the data stored and uninstalling.',
};
const ICON = {
	'getting-started': I.play,
	'giving-access': I.key,
	spotlight: I.spot,
	security: I.shield,
	faq: I.help,
	'for-support-teams': I.users,
	'troubleshooting-mode': I.wrench,
	developers: I.code,
};

const docs = {};
const searchIndex = [];

for ( const name of ORDER ) {
	const md = new MarkdownIt( { html: false, linkify: false, typographer: false } );
	const headings = [];
	const used = {};
	let title = name;
	md.core.ruler.push( 'fxp', ( state ) => {
		state.tokens.forEach( ( tok, i ) => {
			if ( tok.type === 'heading_open' ) {
				const text = state.tokens[ i + 1 ].content;
				let id = slug( text );
				used[ id ] = ( used[ id ] || 0 ) + 1;
				if ( used[ id ] > 1 ) id += '-' + ( used[ id ] - 1 );
				tok.attrSet( 'id', id );
				if ( tok.tag === 'h1' ) title = text;
				else headings.push( { level: tok.tag, id, text: text.replace( /[`*]/g, '' ) } );
			}
			( state.tokens[ i ].children || [] ).forEach( ( c ) => {
				if ( c.type === 'link_open' ) {
					// The docs use GitHub-friendly links (other-guide.md#section); on the site they're pages.
					const href = c.attrGet( 'href' );
					const m = /^([a-z0-9-]+)\.md(#.+)?$/i.exec( href );
					if ( m ) c.attrSet( 'href', m[ 1 ] === 'README' ? `../${ m[ 2 ] || '' }` : `../${ m[ 1 ] }/${ m[ 2 ] || '' }` );
					else if ( /^\.\.\//.test( href ) ) c.attrSet( 'href', `${ SITE.repo }/blob/main/${ href.slice( 3 ) }` );
					else if ( /^https?:/.test( href ) ) c.attrSet( 'rel', 'noopener' );
				}
			} );
		} );
	} );
	const src = readFileSync( join( ROOT, 'docs', name + '.md' ), 'utf8' );
	let html = md.render( src );
	html = html
		.replace( /<pre>/g, '<pre tabindex="0">' )
		.replace( /<table>/g, '<table tabindex="0">' )
		.replace( /<(h[23]) id="([^"]+)">(.*?)<\/\1>/g, '<$1 id="$2">$3<a class="anchor" href="#$2" aria-label="Link to this section">#</a></$1>' );
	docs[ name ] = { title, html, headings, src };

	// Search entries: the page itself and each section.
	const plain = ( s ) => s.replace( /\[([^\]]+)\]\([^)]*\)/g, '$1' ).replace( /[`*_>#|]/g, ' ' ).replace( /:?-{3,}:?/g, ' ' ).replace( /\s+/g, ' ' ).trim();
	src.split( /\n(?=#{2,3} )/ ).forEach( ( part, i ) => {
		const m = /^(#{1,3}) (.+)\n/.exec( part.startsWith( '#' ) ? part : '# ' + title + '\n' + part );
		const heading = i === 0 ? '' : m ? m[ 2 ] : '';
		const id = heading ? headings.find( ( h ) => h.text === heading.replace( /[`*]/g, '' ) )?.id || '' : '';
		searchIndex.push( {
			t: title,
			s: heading.replace( /[`*]/g, '' ),
			u: `docs/${ name }/${ id ? '#' + id : '' }`,
			x: plain( part.replace( /^#{1,3} .+\n/, '' ) ).slice( 0, 600 ),
		} );
	} );
}

// site.js reads the search index from this global (shared with the other project sites).
writeFileSync( join( OUT, 'assets/search-index.js' ), 'window.HDH_SEARCH=' + JSON.stringify( searchIndex ) + ';' );

function searchBox( id, placeholder ) {
	return `<div class="search" data-search role="search">
	<label class="sr" for="${ id }">Search the help center</label>
	<input id="${ id }" type="search" placeholder="${ esc( placeholder ) }" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${ id }-results">
	<ul class="search-results" id="${ id }-results" role="listbox" aria-label="Search results" hidden></ul>
	<p class="sr" role="status" aria-live="polite"></p>
</div>`;
}

const SEARCH_SCRIPT = ( root ) => `<script src="${ root }assets/search-index.js?v=${ VERSION }" defer></script>`;

function docsNav( current ) {
	return `<aside class="docs-nav" aria-label="Help center">
	${ searchBox( 'side-search', 'Search help…' ) }
	<details open>
		<summary class="docs-nav-toggle">Browse all guides</summary>
		<ul><li><a href="../"${ current === '' ? ' aria-current="page"' : '' }>Help center home</a></li></ul>
		${ GROUPS.map( ( g ) => `<h2>${ g.label }</h2><ul>${ g.pages.map( ( p ) => `<li><a href="../${ p }/"${ current === p ? ' aria-current="page"' : '' }>${ esc( docs[ p ].title ) }</a></li>` ).join( '' ) }</ul>` ).join( '\n\t\t' ) }
	</details>
</aside>`;
}

ORDER.forEach( ( name, i ) => {
	const d = docs[ name ];
	const prev = ORDER[ i - 1 ];
	const next = ORDER[ i + 1 ];
	const toc = d.headings.filter( ( h ) => h.level === 'h2' );
	const body = `<div class="wrap docs-layout">
${ docsNav( name ) }
<article class="doc">
	<nav class="crumbs" aria-label="Breadcrumb"><a href="../">Help center</a> › ${ esc( d.title ) }</nav>
	${ d.html }
	<div class="help-strip"><p><strong>Still stuck?</strong> Check the <a href="../faq/">FAQ</a>, or <a href="${ SITE.repo }/issues">ask on GitHub</a>.</p></div>
	<nav class="pager" aria-label="Previous and next guide">
		${ prev ? `<a class="prev" href="../${ prev }/"><small>Previous</small>${ esc( docs[ prev ].title ) }</a>` : '' }
		${ next ? `<a class="next" href="../${ next }/"><small>Next</small>${ esc( docs[ next ].title ) }</a>` : '' }
	</nav>
</article>
${ toc.length > 1 ? `<nav class="on-page" aria-label="On this page" data-spy><h2>On this page</h2><ul>${ toc.map( ( h ) => `<li><a href="#${ h.id }">${ esc( h.text ) }</a></li>` ).join( '' ) }</ul></nav>` : '<div></div>' }
</div>`;
	write(
		`docs/${ name }/index.html`,
		layout( { title: d.title, description: BLURB[ name ] + ' Fixpass help center.', root: '../../', current: 'docs', canonical: `docs/${ name }/`, body, extraHead: SEARCH_SCRIPT( '../../' ) } )
	);
} );

// Help center home.
{
	const popular = [
		[ 'getting-started', 'your-first-support-request', 'Your first support request' ],
		[ 'spotlight', 'spotlight-a-problem', 'Spotlight a problem' ],
		[ 'giving-access', 'step-1-give-access', 'Reusable or one-time link?' ],
		[ 'giving-access', 'the-status', 'What the status means' ],
		[ 'for-support-teams', 'log-in', 'Log in as support' ],
		[ 'security', 'the-link', 'How the login link is protected' ],
	];
	const body = `<section class="docs-hero">
	<div class="wrap">
		<h1>How can we help?</h1>
		<p>Guides and answers for Fixpass, for site owners, support teams and developers.</p>
		${ searchBox( 'hero-search', 'Search, e.g. “reusable link”, “Spotlight”, “troubleshooting”' ) }
	</div>
</section>
<div class="wrap docs-groups">
	<h2>Popular</h2>
	<div class="grid-3">
		${ popular.map( ( [ p, a, label ] ) => `<a class="card" href="${ p }/${ a ? '#' + a : '' }"><h3>${ esc( label ) }</h3><p>${ esc( docs[ p ].title ) }</p><span class="more">Read the guide →</span></a>` ).join( '\n\t\t' ) }
	</div>
	${ GROUPS.map( ( g ) => `<h2>${ g.label }</h2>
	<div class="grid-3">
		${ g.pages.map( ( p ) => `<a class="card" href="${ p }/"><span class="ic">${ ICON[ p ] }</span><h3>${ esc( docs[ p ].title ) }</h3><p>${ esc( BLURB[ p ] ) }</p></a>` ).join( '\n\t\t' ) }
	</div>` ).join( '\n\t' ) }
</div>`;
	write( 'docs/index.html', layout( { title: 'Help center', description: 'Guides and answers for Fixpass: giving support access, Spotlight, security, and the tools for support teams.', root: '../', current: 'docs', canonical: 'docs/', body, extraHead: SEARCH_SCRIPT( '../' ) } ) );
}

/* ------------------------------------------------------------------ Home */

{
	const body = readFileSync( join( SRC, 'home.html' ), 'utf8' ).replace( /\{\{download\}\}/g, SITE.download ).replace( /\{\{repo\}\}/g, SITE.repo ).replace( /\{\{version\}\}/g, VERSION );
	write( 'index.html', layout( { title: SITE.name, description: 'Fixpass is a free WordPress plugin: Spotlight the exact spot that’s broken, and give your support team safe, temporary access, with no password shared.', root: '', current: '', body, home: true } ) );
}

/* ------------------------------------------------------------------ Live demo page */

{
	const r = '../';
	const steps = [
		[ '1 · The tour', 'Meet Fixpass', 'The demo opens on the Fixpass page with the welcome tour. On the Spotlight step, the <strong>Spotlight a problem</strong> button glows at the top right.' ],
		[ '2 · Spotlight', 'Point at the problem', 'Visit the site (<strong>Bluebird Bakery</strong> in the toolbar) and open <strong>Order a cake</strong> from the menu. Click <strong>Spotlight a problem</strong>, click the <strong>Place your order</strong> button or drag a box around it, add a note, and click <strong>Continue</strong>.' ],
		[ '3 · Give access', 'Let support in', 'Back on the Fixpass page, your spot is listed. Keep the reusable link, choose a length and click <strong>Give access</strong>. Then <strong>Copy details</strong> and paste them somewhere to see what support receives.' ],
		[ '4 · Be support', 'See their side', 'Open the login link from the details in the same tab and click <strong>Log in as support</strong>. You land on the Support session page: your spot with <strong>Open and highlight</strong>, site details, the debug log and troubleshooting mode.' ],
		[ '5 · Back as the owner', 'Watch the status', 'Click <strong>Leave session</strong>, then log in again as the site owner (username <code>admin</code>, password <code>password</code>). The Fixpass page shows what support did, and you can extend or end access.' ],
	];
	const body = `
<section class="page-head">
	<div class="wrap">
		<span class="kicker">Live demo</span>
		<h1>Try Fixpass in your browser</h1>
		<p>The demo runs on <a href="https://wordpress.org/playground/" rel="noopener">WordPress Playground</a>: a small bakery site with Fixpass installed, and a page with a problem to spotlight. It takes about a minute to start. Nothing is installed on your computer, and nothing you do is saved.</p>
		<div class="cta-row" style="justify-content:flex-start">
			<a class="btn btn-primary" href="${ PLAYGROUND }" target="_blank" rel="noopener">${ I.playSm } Launch the demo</a>
			<a class="btn btn-ghost" href="${ r }docs/getting-started/">Read the guide instead</a>
		</div>
		<p class="fx-meta">Opens playground.wordpress.net in a new tab. Works best in a desktop browser.</p>
	</div>
</section>
<section class="fx-section" aria-labelledby="tour-title">
	<div class="wrap">
		<div class="fx-head"><h2 id="tour-title" class="fx-h2">A five-minute tour</h2><p class="fx-big">Both sides of Fixpass: the site owner who needs help, and the support team that gives it.</p></div>
		<ol class="fx-steps">
			${ steps.map( ( [ pill, h, p ] ) => `<li class="fx-step-card"><span class="fx-pill">${ pill }</span><h3>${ h }</h3><p>${ p }</p></li>` ).join( '\n\t\t\t' ) }
		</ol>
	</div>
</section>
<section class="fx-section fx-section--alt" aria-labelledby="demo-notes">
	<div class="wrap">
		<div class="fx-head"><h2 id="demo-notes" class="fx-h2">About the demo</h2></div>
		<div class="prose">
			<ul>
				<li>Everything happens in one browser, so logging in as support logs you out as the owner. On a real site, support uses their own computer.</li>
				<li>Emails and scheduled tasks are switched off. Access still ends on time: Fixpass checks on every page load.</li>
				<li>Want to run it locally? The blueprint is at <a href="blueprint.json"><code>demo/blueprint.json</code></a>.</li>
			</ul>
		</div>
	</div>
</section>`;
	write( 'demo/index.html', layout( { title: 'Live demo', description: 'Try Fixpass in your browser: a bakery site with a problem to spotlight, running on WordPress Playground.', root: r, current: 'demo', canonical: 'demo/', body } ) );
}

/* ------------------------------------------------------------------ Changelog */

{
	const log = readme.split( '== Changelog ==' )[ 1 ].split( /\n== / )[ 0 ];
	const releases = log
		.split( /\n= / )
		.map( ( s ) => s.trim().replace( /^= /, '' ) )
		.filter( Boolean )
		.map( ( block ) => {
			const [ head, ...lines ] = block.split( '\n' );
			return { v: head.replace( /\s*=$/, '' ), items: lines.filter( ( l ) => l.startsWith( '* ' ) ).map( ( l ) => l.slice( 2 ) ) };
		} );
	const body = `
<section class="page-head"><div class="wrap"><span class="kicker">Changelog</span><h1>What's new</h1><p>Every Fixpass release, newest first.</p></div></section>
<div class="wrap" style="padding:64px 24px 120px">
	<div class="prose">
		${ releases.map( ( rel ) => `<section class="release"><h2 id="v${ rel.v.replace( /\./g, '-' ) }">Version ${ esc( rel.v ) }</h2><ul>${ rel.items.map( ( i ) => `<li>${ esc( i ) }</li>` ).join( '' ) }</ul></section>` ).join( '\n\t\t' ) }
	</div>
</div>`;
	write( 'changelog/index.html', layout( { title: 'Changelog', description: 'Release notes for every version of Fixpass.', root: '../', canonical: 'changelog/', body } ) );
}

/* ------------------------------------------------------------------ 404, sitemap, robots */

{
	const body = `<section class="page-head" style="border:0;text-align:center;padding:120px 0"><div class="wrap"><span class="kicker">404</span><h1>Nothing to spotlight here</h1><p style="margin:0 auto 28px">This page may have moved. Try the help center, or start from the home page.</p><div class="cta-row"><a class="btn btn-primary" href="${ SITE.base }">Home</a><a class="btn btn-ghost" href="${ SITE.base }docs/">Help center</a></div></div></section>`;
	write( '404.html', layout( { title: 'Page not found', description: 'Page not found.', root: SITE.base, body } ) );
	const urls = [ '', 'demo/', 'changelog/', 'docs/', ...ORDER.map( ( p ) => `docs/${ p }/` ) ];
	write( 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ urls.map( ( u ) => `<url><loc>${ SITE.url }${ u }</loc></url>` ).join( '\n' ) }\n</urlset>\n` );
	write( 'robots.txt', `User-agent: *\nAllow: /\nSitemap: ${ SITE.url }sitemap.xml\n` );
}

console.log( `website/dist built: ${ ORDER.length } help pages, ${ searchIndex.length } search entries, version ${ VERSION }` );
