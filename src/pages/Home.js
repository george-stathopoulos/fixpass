/**
 * The site owner's screen: 1. give access, 2. copy the details, the access status, and Spotlight.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useApi, send } from '../ui/lib/hooks';
import { when } from '../ui/lib/time';
import {
	Card,
	PageHead,
	Button,
	Pill,
	Switch,
	Loading,
	ErrorNotice,
	useToast,
} from '../ui/components/ui';
import { Check, KeyValues, confirmAction } from '../ui/components/kit';
import SpotlightDemo from '../ui/components/SpotlightDemo';
import { copyRich, copyText } from '../lib/copy';
import { message } from '../components/common';
import PageFoot from '../components/PageFoot';
import Onboarding from './Onboarding';

// The latest access, as the site owner sees it: [ pill tone, label ].
const STATUS = {
	waiting: [ 'warning', __( 'Waiting for support to log in', 'fixpass' ) ],
	active: [ 'good', __( 'Support is working on your site', 'fixpass' ) ],
	logged_out: [ '', __( 'Support logged out', 'fixpass' ) ],
	left: [ '', __( 'Support ended the session', 'fixpass' ) ],
	support_revoked: [ 'bad', __( 'Support revoked access', 'fixpass' ) ],
	revoked: [ 'bad', __( 'You ended access', 'fixpass' ) ],
	expired: [ 'bad', __( 'Access expired', 'fixpass' ) ],
	deleted: [
		'bad',
		__( 'Access ended: the support account was deleted', 'fixpass' ),
	],
	deactivated: [
		'bad',
		__( 'Access ended: Fixpass was deactivated', 'fixpass' ),
	],
};

function hashSpots() {
	const query = window.location.hash.split( '?' )[ 1 ] || '';
	return ( new URLSearchParams( query ).get( 'spot' ) || '' )
		.split( ',' )
		.filter( Boolean )
		.slice( 0, 5 );
}

/**
 * "2 days, 3 hours, 4 minutes and 5 seconds".
 *
 * @param {number} total Seconds.
 * @return {string} Text.
 */
function duration( total ) {
	const d = Math.floor( total / 86400 );
	const h = Math.floor( ( total % 86400 ) / 3600 );
	const m = Math.floor( ( total % 3600 ) / 60 );
	const s = Math.floor( total % 60 );
	const parts = [];
	if ( d ) {
		/* translators: %d: number of days */
		const text = _n( '%d day', '%d days', d, 'fixpass' );
		parts.push( sprintf( text, d ) );
	}
	if ( d || h ) {
		/* translators: %d: number of hours */
		const text = _n( '%d hour', '%d hours', h, 'fixpass' );
		parts.push( sprintf( text, h ) );
	}
	if ( d || h || m ) {
		/* translators: %d: number of minutes */
		const text = _n( '%d minute', '%d minutes', m, 'fixpass' );
		parts.push( sprintf( text, m ) );
	}
	/* translators: %d: number of seconds */
	const secText = _n( '%d second', '%d seconds', s, 'fixpass' );
	parts.push( sprintf( secText, s ) );
	const last = parts.pop();
	if ( ! parts.length ) {
		return last;
	}
	/* translators: 1: list of time parts, 2: the last part */
	const joined = __( '%1$s and %2$s', 'fixpass' );
	return sprintf( joined, parts.join( ', ' ), last );
}

/**
 * Live time left until access ends, corrected for the difference between this computer's clock
 * and the server's.
 *
 * @param {Object}   props         Props.
 * @param {string}   props.expires Access end (ISO).
 * @param {number}   props.drift   Milliseconds this clock is ahead of the server.
 * @param {Function} props.onEnd   Called when it reaches zero.
 * @return {JSX.Element} Countdown.
 */
function Countdown( { expires, drift, onEnd } ) {
	const left = () =>
		Math.round(
			( new Date( expires ).getTime() - ( Date.now() - drift ) ) / 1000
		);
	const [ secs, setSecs ] = useState( left );
	useEffect( () => {
		const id = window.setInterval( () => {
			const n = left();
			setSecs( n );
			if ( n <= 0 ) {
				window.clearInterval( id );
				onEnd();
			}
		}, 1000 );
		return () => window.clearInterval( id );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ expires, drift ] );
	return (
		<strong>
			{ secs > 0 ? duration( secs ) : __( 'a moment', 'fixpass' ) }
		</strong>
	);
}

function StepTitle( { num, done, children } ) {
	return (
		<span className="fxp-step-title">
			<span className={ `fxp-step ${ done ? 'is-done' : '' }` }>
				{ done ? '✓' : num }
			</span>
			{ children }
		</span>
	);
}

export default function Home() {
	const { data, error, reload } = useApi( 'admin/state' );
	const toast = useToast();
	const [ hours, setHours ] = useState( 0 );
	// Ticked by default: once support is done, Fixpass tidies itself away.
	const [ cleanup, setCleanup ] = useState( true );
	const [ reusable, setReusable ] = useState( true );
	const [ spots, setSpots ] = useState( [] );
	// The message from step 1, kept while the page is open: its link isn't stored anywhere.
	const [ msg, setMsg ] = useState( null );
	const [ manual, setManual ] = useState( '' );
	const [ busy, setBusy ] = useState( '' );
	const [ spotlightInfo, setSpotlightInfo ] = useState( false );
	// null: as saved (shown until dismissed for good); true/false: opened or closed on this visit.
	// Arriving with spots from Spotlight, carry on rather than open the tour.
	const [ touring, setTouring ] = useState( () =>
		hashSpots().length ? false : null
	);

	// Spots picked on a page: "Continue" lands here with #/?spot=…
	useEffect( () => {
		const ids = hashSpots();
		if ( ids.length ) {
			Promise.all(
				ids.map( ( id ) =>
					send( `admin/spot/${ id }` ).catch( () => null )
				)
			).then( ( list ) => setSpots( list.filter( Boolean ) ) );
		}
	}, [] );

	const live = !! ( data && data.access && data.access.active );
	// While access is open, the status refreshes by itself (support logging in, ending access).
	useEffect( () => {
		if ( ! live ) {
			return;
		}
		const id = window.setInterval( reload, 30000 );
		return () => window.clearInterval( id );
	}, [ live, reload ] );

	if ( error && ! data ) {
		return <ErrorNotice error={ error } onRetry={ reload } />;
	}
	if ( ! data ) {
		return <Loading />;
	}
	if ( touring === true || ( touring === null && ! data.onboarded ) ) {
		return (
			<Onboarding
				onDone={ ( forGood ) => {
					setTouring( false );
					if ( forGood ) {
						send( 'admin/onboarding', 'POST', {
							done: true,
						} ).catch( () => {} );
					}
					window.scrollTo( { top: 0 } );
				} }
			/>
		);
	}
	const access = data.access;
	const drift = Date.now() - new Date( data.now ).getTime();
	const length = hours || data.default_hours;
	const [ tone, label ] = access
		? STATUS[ access.status ] || STATUS.revoked
		: [];
	const copied = live && access.copied;

	const run = ( key, promise, then ) => {
		setBusy( key );
		return promise
			.then( then )
			.catch( ( e ) => toast( message( e ), 'alert' ) )
			.finally( () => setBusy( '' ) );
	};

	const give = () =>
		run(
			'give',
			send( 'admin/link', 'POST', {
				hours: length,
				pins: spots.map( ( p ) => p.id ).join( ',' ),
				cleanup,
				reusable,
			} ),
			( r ) => {
				setMsg( r );
				setSpots( [] );
				reload();
			}
		);

	// The message to copy: from step 1 if this page still has it, otherwise rebuilt by the
	// server (a reusable link comes back the same; a one-time link is replaced).
	const getMessage = async () => {
		if ( msg ) {
			send( 'admin/copy', 'POST', {} ).catch( () => {} );
			return msg;
		}
		setBusy( 'copy' );
		try {
			const m = await send( 'admin/copy', 'POST', { fresh: true } );
			setMsg( m );
			return m;
		} finally {
			setBusy( '' );
		}
	};

	const copyDetails = async ( how ) => {
		setManual( '' );
		let m;
		try {
			m = await getMessage();
		} catch ( e ) {
			toast( message( e ), 'alert' );
			return;
		}
		if ( how === 'mail' ) {
			// Email apps cut long addresses short: the body carries the text up to a sensible length.
			const body =
				m.text.length > 1800
					? `${ m.text.slice( 0, 1800 ) }\n\n[…] ${ __(
							'Paste the full details from Fixpass’s Copy details.',
							'fixpass'
					  ) }`
					: m.text;
			window.location.href = `mailto:?subject=${ encodeURIComponent(
				m.subject
			) }&body=${ encodeURIComponent( body ) }`;
			reload();
			return;
		}
		( how === 'plain'
			? copyText( m.text )
			: copyRich( m.html, m.text ).catch( () => copyText( m.text ) )
		)
			.then( () =>
				toast(
					__(
						'Copied. Paste it into a reply to your support team.',
						'fixpass'
					)
				)
			)
			.catch( () => setManual( m.text ) )
			.finally( reload );
	};

	const extend = () =>
		run( 'extend', send( 'admin/extend', 'POST', {} ), reload );

	const revoke = async () => {
		const ok = await confirmAction(
			__(
				'End support access now? The support account is deleted and the link stops working.',
				'fixpass'
			),
			{ confirmText: __( 'End access', 'fixpass' ) }
		);
		if ( ok ) {
			run( 'revoke', send( 'admin/end', 'POST', {} ), () => {
				setMsg( null );
				reload();
			} );
		}
	};

	const setSpotlight = ( enabled ) =>
		send( 'admin/spotlight', 'POST', { enabled } )
			.then( () => window.location.reload() )
			.catch( ( e ) => toast( message( e ), 'alert' ) );

	return (
		<>
			<PageHead
				title={ __( 'Get help with your site', 'fixpass' ) }
				lede={ __(
					'Give your support team safe, temporary access to this site, with no password shared, and show them exactly where the problem is.',
					'fixpass'
				) }
			>
				<Button
					variant="ghost"
					icon="play"
					onClick={ () => setTouring( true ) }
				>
					{ __( 'Take the tour', 'fixpass' ) }
				</Button>
			</PageHead>

			<div className="hdh-stack" style={ { gap: 18 } }>
				{ data.removing && (
					<div className="hdh-policy-note">
						<span>
							{ __(
								'As you asked, Fixpass removes itself in about a minute, now that access has ended.',
								'fixpass'
							) }
						</span>
					</div>
				) }

				<Card
					title={
						<StepTitle num="1" done={ live }>
							{ live
								? __( 'Access given', 'fixpass' )
								: __( 'Give support access', 'fixpass' ) }
						</StepTitle>
					}
					sub={
						live ? (
							<>
								{ __(
									'Support access stays open for the next',
									'fixpass'
								) }{ ' ' }
								<Countdown
									expires={ access.expires_at }
									drift={ drift }
									onEnd={ reload }
								/>
								.
							</>
						) : (
							__(
								'Full administrator access for your support team, for the time you choose. End it any time; it also ends by itself.',
								'fixpass'
							)
						)
					}
				>
					{ live ? (
						<div className="hdh-stack">
							<div>
								<Pill tone={ copied ? 'good' : 'warning' } dot>
									{ copied
										? __( 'Details copied', 'fixpass' )
										: __(
												'Not sent yet: copy the details in step 2',
												'fixpass'
										  ) }
								</Pill>
							</div>
							<div className="hdh-row">
								<Button
									icon="clock"
									disabled={ !! busy || ! access.can_extend }
									title={
										access.can_extend
											? undefined
											: __(
													'Access can last up to 30 days from when it was given.',
													'fixpass'
											  )
									}
									onClick={ extend }
								>
									{ __( 'Extend +24h', 'fixpass' ) }
								</Button>
								<Button
									variant="danger"
									icon="x"
									disabled={ !! busy }
									onClick={ revoke }
								>
									{ __( 'End access now', 'fixpass' ) }
								</Button>
							</div>
							{ access.cleanup && (
								<p
									className="hdh-muted"
									style={ { margin: 0 } }
								>
									{ __(
										'Fixpass removes itself when this access ends.',
										'fixpass'
									) }
								</p>
							) }
						</div>
					) : (
						<div className="hdh-stack" style={ { gap: 16 } }>
							<div className="hdh-share-part">
								<strong>{ __( 'Spots', 'fixpass' ) }</strong>
								{ spots.length ? (
									<ul
										className="hdh-plain-list"
										style={ { marginTop: 6 } }
									>
										{ spots.map( ( p, i ) => (
											<li key={ p.id }>
												<span className="hdh-picked-spot__num">
													{ i + 1 }
												</span>
												{ p.label || p.title }{ ' ' }
												<button
													type="button"
													className="hdh-link-button"
													onClick={ () =>
														setSpots(
															spots.filter(
																( x ) =>
																	x.id !==
																	p.id
															)
														)
													}
												>
													{ __(
														'Remove',
														'fixpass'
													) }
												</button>
											</li>
										) ) }
									</ul>
								) : (
									<p
										className="hdh-muted"
										style={ { margin: '4px 0 0' } }
									>
										{ data.spotlight
											? __(
													'Optional: to show support where the problem is, go to that page and click Spotlight a problem in the toolbar. You’ll come back here.',
													'fixpass'
											  )
											: __(
													'Optional: turn on Spotlight below to point at the problem on the page.',
													'fixpass'
											  ) }
									</p>
								) }
							</div>

							<fieldset className="fxp-choice">
								<legend>
									{ __( 'Login link', 'fixpass' ) }
								</legend>
								<label htmlFor="fxp-link-reusable">
									<input
										id="fxp-link-reusable"
										type="radio"
										name="fxp-link"
										checked={ reusable }
										onChange={ () => setReusable( true ) }
									/>
									<span>
										<strong>
											{ __( 'Reusable link', 'fixpass' ) }
											<Pill tone="accent">
												{ __(
													'Recommended',
													'fixpass'
												) }
											</Pill>
										</strong>
										{ __(
											'Support can log in as often as they need until access ends: useful when they check and re-check over a few days.',
											'fixpass'
										) }
									</span>
								</label>
								<label htmlFor="fxp-link-once">
									<input
										id="fxp-link-once"
										type="radio"
										name="fxp-link"
										checked={ ! reusable }
										onChange={ () => setReusable( false ) }
									/>
									<span>
										<strong>
											{ __( 'One-time link', 'fixpass' ) }
										</strong>
										{ __(
											'Works for a single login. The most secure choice; support asks you for a new link to log in again.',
											'fixpass'
										) }
									</span>
								</label>
							</fieldset>

							<Check
								checked={ cleanup }
								onChange={ setCleanup }
								label={ __(
									'Remove Fixpass when access ends',
									'fixpass'
								) }
							/>

							<div className="hdh-row">
								<select
									className="hdh-input hdh-select"
									style={ { width: 'auto' } }
									aria-label={ __(
										'Access length',
										'fixpass'
									) }
									value={ length }
									onChange={ ( e ) =>
										setHours(
											parseInt( e.target.value, 10 )
										)
									}
								>
									{ data.durations.map( ( d ) => (
										<option
											key={ d.hours }
											value={ d.hours }
										>
											{ d.label }
										</option>
									) ) }
								</select>
								<Button
									variant="primary"
									icon="key"
									disabled={ !! busy }
									onClick={ give }
								>
									{ busy === 'give'
										? __( 'Giving access…', 'fixpass' )
										: __( 'Give access', 'fixpass' ) }
								</Button>
							</div>
						</div>
					) }
				</Card>

				{ live && (
					<Card
						title={
							<StepTitle num="2" done={ copied }>
								{ __( 'Copy the access details', 'fixpass' ) }
							</StepTitle>
						}
						sub={ __(
							'Everything support needs to start right away: the login link, your spots, site health, and your plugins and themes. Paste it into a reply to your support team.',
							'fixpass'
						) }
					>
						<div className="hdh-stack">
							<div className="hdh-row">
								<Button
									variant="primary"
									icon="copy"
									disabled={ !! busy }
									onClick={ () => copyDetails( 'rich' ) }
								>
									{ busy === 'copy'
										? __( 'Preparing…', 'fixpass' )
										: __( 'Copy details', 'fixpass' ) }
								</Button>
								<Button
									icon="copy"
									disabled={ !! busy }
									onClick={ () => copyDetails( 'plain' ) }
								>
									{ __( 'Copy as plain text', 'fixpass' ) }
								</Button>
								<Button
									variant="ghost"
									icon="mail"
									disabled={ !! busy }
									onClick={ () => copyDetails( 'mail' ) }
								>
									{ __( 'Open in email app', 'fixpass' ) }
								</Button>
							</div>
							{ ! msg && copied && ! access.reusable && (
								<p
									className="hdh-muted"
									style={ { margin: 0 } }
								>
									{ __(
										'Copying again makes a new login link; a link you copied earlier stops working.',
										'fixpass'
									) }
								</p>
							) }
							{ manual && (
								<div className="hdh-stack" style={ { gap: 6 } }>
									<p
										className="hdh-muted"
										style={ { margin: 0 } }
									>
										{ __(
											'Your browser blocked copying. Select the text below and copy it yourself.',
											'fixpass'
										) }
									</p>
									<textarea
										className="hdh-input"
										readOnly
										rows={ 8 }
										value={ manual }
										onFocus={ ( e ) => e.target.select() }
									/>
								</div>
							) }
						</div>
					</Card>
				) }

				{ access && (
					<Card
						title={
							live
								? __( 'Access status', 'fixpass' )
								: __( 'Last support access', 'fixpass' )
						}
					>
						<div className="hdh-stack">
							<div>
								<Pill tone={ tone } dot>
									{ label }
								</Pill>
							</div>
							<KeyValues
								rows={ [
									[
										__( 'Access given', 'fixpass' ),
										when( access.granted_at ),
									],
									live
										? [
												__( 'Expires', 'fixpass' ),
												when( access.expires_at ),
										  ]
										: [
												__( 'Ended', 'fixpass' ),
												when(
													access.ended_at ||
														access.expires_at
												),
										  ],
								] }
							/>
						</div>
					</Card>
				) }

				{ ! live && (
					<Card
						title={ __( 'Spotlight', 'fixpass' ) }
						sub={ __(
							'Show your support exactly where the problem is, instead of describing it.',
							'fixpass'
						) }
						action={
							<Switch
								label={ __(
									'Spotlight in the toolbar',
									'fixpass'
								) }
								checked={ data.spotlight }
								onChange={ setSpotlight }
							/>
						}
					>
						<button
							type="button"
							className="fxp-foot__info is-left"
							aria-expanded={ spotlightInfo }
							onClick={ () =>
								setSpotlightInfo( ! spotlightInfo )
							}
						>
							<span className="fxp-foot__i" aria-hidden="true">
								i
							</span>
							{ spotlightInfo
								? __( 'Hide how Spotlight works', 'fixpass' )
								: __( 'How Spotlight works', 'fixpass' ) }
						</button>
						{ spotlightInfo && (
							<>
								<SpotlightDemo />
								<ul className="fxp-rules">
									<li>
										{ __(
											'Go to the page with the problem and click Spotlight a problem in the toolbar at the top.',
											'fixpass'
										) }
									</li>
									<li>
										{ __(
											'Click the problem, or drag a box around it. Add a note, and up to 5 spots, all on that page.',
											'fixpass'
										) }
									</li>
									<li>
										{ __(
											'While Spotlight is on, the page is paused: links and buttons don’t work, so you can’t go to another page. Press Esc to stop.',
											'fixpass'
										) }
									</li>
									<li>
										{ __(
											'Continue brings you back here with your spots, ready for step 1. Nothing on your screen is recorded.',
											'fixpass'
										) }
									</li>
								</ul>
							</>
						) }
					</Card>
				) }
			</div>

			<PageFoot onTour={ () => setTouring( true ) } />
		</>
	);
}
