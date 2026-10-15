/**
 * The site owner's screen: choose "Show the problem, then give access" or "Just give access", then copy the details, and the access status.
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
	Loading,
	ErrorNotice,
	useToast,
} from '../ui/components/ui';
import { Check, KeyValues, confirmAction } from '../ui/components/kit';
import { copyRich, copyText } from '../lib/copy';
import { message } from '../components/common';
import PageFoot from '../components/PageFoot';
import Onboarding from './Onboarding';
import Start from './Start';
import Activity from './Activity';

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
	// The message from giving access, kept while the page is open: its link isn't stored anywhere.
	const [ msg, setMsg ] = useState( null );
	const [ manual, setManual ] = useState( '' );
	const [ busy, setBusy ] = useState( '' );
	const [ spotlightInfo, setSpotlightInfo ] = useState( false );
	// null: as saved (shown until dismissed for good); true/false: opened or closed on this visit.
	// Arriving with spots from Spotlight, carry on rather than open the tour.
	const [ touring, setTouring ] = useState( () =>
		hashSpots().length ? false : null
	);
	// What the owner chose to start with: null (not yet), 'spot' (Spotlight, then access) or
	// 'access'. Arriving with spots from Spotlight means they chose Spotlight.
	const [ mode, setMode ] = useState( () => {
		try {
			if ( window.sessionStorage.getItem( 'fxp-start' ) === 'spot' ) {
				window.sessionStorage.removeItem( 'fxp-start' );
				return 'spot';
			}
		} catch ( e ) {}
		return hashSpots().length ? 'spot' : null;
	} );

	// Spots coming back from Spotlight are fetched first, so the screen doesn't flash the guide.
	const [ spotsLoading, setSpotsLoading ] = useState( () => hashSpots().length > 0 );

	// Back on this page: the site's Spotlight hint has done its job.
	useEffect( () => {
		try {
			window.sessionStorage.removeItem( 'fxpGuide' );
		} catch ( e ) {}
	}, [] );

	// Spots picked on a page: "Continue" lands here with #/?spot=…
	useEffect( () => {
		const ids = hashSpots();
		if ( ids.length ) {
			Promise.all(
				ids.map( ( id ) =>
					send( `admin/spot/${ id }` ).catch( () => null )
				)
			).then( ( list ) => {
				setSpots( list.filter( Boolean ) );
				setSpotsLoading( false );
			} );
		}
	}, [] );

	const live = !! ( data && data.access && data.access.active );
	// While access is open, the status refreshes by itself (support logging in, ending access):
	// every few seconds, and straight away when this tab is looked at again.
	useEffect( () => {
		if ( ! live ) {
			return;
		}
		const onVisible = () => {
			if ( ! document.hidden ) {
				reload();
			}
		};
		document.addEventListener( 'visibilitychange', onVisible );
		const id = window.setInterval( reload, 10000 );
		return () => {
			window.clearInterval( id );
			document.removeEventListener( 'visibilitychange', onVisible );
		};
	}, [ live, reload ] );

	// Until a spot is picked, point at the real toolbar button.
	const needsSpot = !! (
		data &&
		data.spotlight &&
		! live &&
		mode === 'spot' &&
		! spots.length
	);
	const tourOpen =
		touring === true || ( touring === null && data && ! data.onboarded );
	useEffect( () => {
		const button = document.getElementById(
			'wp-admin-bar-fixpass-spotlight'
		);
		if ( ! button || ! needsSpot || tourOpen ) {
			return;
		}
		button.classList.add( 'fxp-glow' );
		return () => button.classList.remove( 'fxp-glow' );
	}, [ needsSpot, tourOpen ] );

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

	// The message to copy: from giving access if this page still has it, otherwise rebuilt by the
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
			.then( ( r ) => {
				try {
					if ( enabled ) {
						window.sessionStorage.setItem( 'fxp-start', 'spot' );
					}
				} catch ( e ) {}
				return r;
			} )
			.then( () => window.location.reload() )
			.catch( ( e ) => toast( message( e ), 'alert' ) );

	const giveForm = (
		<div className="hdh-stack" style={ { gap: 16 } }>
			<div className="hdh-stack" style={ { gap: 16 } }>
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
									'Delete Fixpass when access ends',
									'fixpass'
								) }
								desc={ __(
									'Fixpass deactivates and deletes itself about a minute after access ends, and the access history is deleted with it. Download the history first if you want a copy.',
									'fixpass'
								) }
							/>

				</div>
			<div className="hdh-row">
				<select
					className="hdh-input hdh-select"
					style={ { width: 'auto' } }
					aria-label={ __( 'Access length', 'fixpass' ) }
					value={ length }
					onChange={ ( e ) =>
						setHours( parseInt( e.target.value, 10 ) )
					}
				>
					{ data.durations.map( ( d ) => (
						<option key={ d.hours } value={ d.hours }>
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
	);

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
								'As you asked, Fixpass deactivates and deletes itself in about a minute, now that access has ended. The access history is deleted with it.',
								'fixpass'
							) }
						</span>
					</div>
				) }

				{ live ? (
					<Card
						title={
							<StepTitle num="1" done>
								{ __( 'Access given', 'fixpass' ) }
							</StepTitle>
						}
						sub={
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
						}
					>
						<div className="hdh-stack">
							<div>
								<Pill tone={ copied ? 'good' : 'warning' } dot>
									{ copied
										? __( 'Details copied', 'fixpass' )
										: __(
												'Not sent yet: copy the details below',
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
										'Fixpass deletes itself when this access ends, and the access history goes with it. Download the history first if you want a copy.',
										'fixpass'
									) }
								</p>
							) }
						</div>
					</Card>
				) : spotsLoading ? (
					<Loading />
				) : (
					<Start
						mode={ mode }
						setMode={ ( m ) => {
							// Just access: nothing of an earlier Spotlight round goes with it.
							if ( m === 'access' ) {
								setSpots( [] );
							}
							setMode( m );
						} }
						data={ data }
						spots={ spots }
						setSpots={ setSpots }
						setSpotlight={ setSpotlight }
						form={ giveForm }
					/>
				) }

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

				<Activity
					refreshKey={ `${ access ? access.status : '' }|${
						access ? access.expires_at : ''
					}|${ access ? access.ended_at : '' }` }
					retention={ data.retention_days }
					onChanged={ reload }
				/>
			</div>

			<PageFoot onTour={ () => setTouring( true ) } />
		</>
	);
}
