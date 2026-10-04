/**
 * The bottom of the site owner's screen: "How secure is this?" (an "i" that opens the details),
 * the tour, and links to the documentation and to report a problem.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import Icon from '../ui/components/Icon';

const REPO = 'https://github.com/george-stathopoulos/fixpass';

const SECURITY = [
	[
		__( 'Security first', 'fixpass' ),
		__(
			'The support account is a full administrator: the same access you have, so it can see and change what you can. Only create a link when you need help. There’s no password: WordPress creates the account, but password login is switched off for it.',
			'fixpass'
		),
	],
	[
		__( 'The link', 'fixpass' ),
		__(
			'It’s a random 256-bit code, and only a fingerprint (hash) of it is stored. A one-time link works for a single login. A reusable link (the default) lets support log in as often as they need until access ends, so share it only with your support, as you would a password. It isn’t stored on your site: it’s rebuilt each time from a random value and your site’s own secret keys. Both kinds open a confirmation page first, so email scanners that check links can’t use them.',
			'fixpass'
		),
	],
	[
		__( 'You stay in control', 'fixpass' ),
		__(
			'End access at any time. However access ends (you end it, support ends it, it runs out, the support account is deleted, or Fixpass is deactivated), the account is deleted for good, not just switched off.',
			'fixpass'
		),
	],
	[
		__( 'What support sees', 'fixpass' ),
		__(
			'Once logged in, support gets site details, health checks, the end of your debug log and troubleshooting mode. Passwords, keys and email addresses are removed from the details Fixpass collects. Troubleshooting mode only changes support’s own browser: visitors see your site as normal.',
			'fixpass'
		),
	],
	[
		__( 'Spotlight', 'fixpass' ),
		__(
			'Nothing on your screen is recorded or uploaded. A spot keeps the page address, the spot you pointed at, your note, your screen size and browser, and any errors on that page.',
			'fixpass'
		),
	],
	[
		__( 'Tip', 'fixpass' ),
		__(
			'If your support works in another time zone, 1 day can run out before they get to you. 3 days or a week is safer, and you can end access early at any time.',
			'fixpass'
		),
	],
];

function SecurityDialog( { onClose } ) {
	const close = useRef( null );
	useEffect( () => {
		const previous = window.document.activeElement;
		close.current?.focus();
		const onKey = ( e ) => e.key === 'Escape' && onClose();
		window.document.addEventListener( 'keydown', onKey );
		return () => {
			window.document.removeEventListener( 'keydown', onKey );
			previous?.focus?.();
		};
	}, [ onClose ] );
	return (
		<>
			<div className="hdh-scrim" aria-hidden="true" onClick={ onClose } />
			<div
				className="hdh-dialog fxp-security"
				role="dialog"
				aria-modal="true"
				aria-labelledby="fxp-security-title"
			>
				<div className="fxp-security__head">
					<h2 id="fxp-security-title">
						{ __( 'How secure is this?', 'fixpass' ) }
					</h2>
					<button
						ref={ close }
						type="button"
						className="hdh-btn is-ghost is-icon"
						aria-label={ __( 'Close', 'fixpass' ) }
						onClick={ onClose }
					>
						<Icon name="x" size={ 16 } />
					</button>
				</div>
				{ SECURITY.map( ( [ title, text ] ) => (
					<p key={ title }>
						<strong>{ title }.</strong> { text }
					</p>
				) ) }
			</div>
		</>
	);
}

export default function PageFoot( { onTour } ) {
	const [ open, setOpen ] = useState( false );
	return (
		<div className="fxp-foot">
			<div className="fxp-foot__row">
				<button
					type="button"
					className="fxp-foot__info"
					onClick={ () => setOpen( true ) }
				>
					<span className="fxp-foot__i" aria-hidden="true">
						i
					</span>
					{ __( 'How secure is this?', 'fixpass' ) }
				</button>
				<button
					type="button"
					className="fxp-foot__info"
					onClick={ onTour }
				>
					<Icon name="play" size={ 14 } />
					{ __( 'Take the tour', 'fixpass' ) }
				</button>
				<a
					className="fxp-foot__info"
					href={ `${ REPO }/tree/main/docs#readme` }
					target="_blank"
					rel="noopener noreferrer"
				>
					<Icon name="bookmark" size={ 14 } />
					{ __( 'Documentation', 'fixpass' ) }
				</a>
				<a
					className="fxp-foot__info"
					href={ `${ REPO }/issues` }
					target="_blank"
					rel="noopener noreferrer"
				>
					<Icon name="message" size={ 14 } />
					{ __( 'Report a problem with Fixpass', 'fixpass' ) }
				</a>
			</div>
			{ open && <SecurityDialog onClose={ () => setOpen( false ) } /> }
		</div>
	);
}
