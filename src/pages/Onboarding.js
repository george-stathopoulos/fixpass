/**
 * The welcome tour: four short steps, each with a small animation. Shown until the site owner
 * ticks "Don't show this again" (kept until Fixpass is reinstalled).
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import SpotlightDemo from '../ui/components/SpotlightDemo';

function WelcomeScene() {
	return (
		<svg
			className="fxp-scene fxp-scene--welcome"
			viewBox="0 0 320 170"
			aria-hidden="true"
			focusable="false"
		>
			{ /* A page with a problem on it */ }
			<rect
				x="20"
				y="40"
				width="150"
				height="112"
				rx="8"
				className="s-paper"
			/>
			<rect
				x="20"
				y="40"
				width="150"
				height="16"
				rx="8"
				className="s-ink"
			/>
			<rect
				x="34"
				y="70"
				width="88"
				height="7"
				rx="3.5"
				className="s-line"
			/>
			<rect
				x="34"
				y="84"
				width="112"
				height="7"
				rx="3.5"
				className="s-line"
			/>
			<rect
				x="34"
				y="122"
				width="64"
				height="16"
				rx="5"
				className="s-line"
			/>
			{ /* The spotlight, finding it */ }
			<g className="fxp-lamp">
				<path className="fxp-beam" d="M196 26 L104 92 L132 124 Z" />
				<rect
					x="186"
					y="14"
					width="30"
					height="20"
					rx="6"
					className="s-ink"
					transform="rotate(30 201 24)"
				/>
				<circle cx="196" cy="28" r="5" className="s-amber" />
			</g>
			<g className="fxp-bug">
				<circle cx="118" cy="106" r="14" className="fxp-catch" />
				<ellipse cx="118" cy="106" rx="6" ry="8" className="s-red" />
				<path
					d="M112 100 L106 96 M124 100 L130 96 M111 106 L104 106 M125 106 L132 106 M112 112 L106 116 M124 112 L130 116"
					className="s-red-line"
				/>
			</g>
			{ /* The pass: access for support, no password */ }
			<g className="fxp-pass">
				<rect
					x="214"
					y="66"
					width="88"
					height="56"
					rx="10"
					className="s-accent"
				/>
				<circle
					cx="240"
					cy="94"
					r="9"
					fill="none"
					stroke="#fff"
					strokeWidth="4"
				/>
				<path
					d="M249 94 H282 M274 94 V103 M282 94 V100"
					stroke="#fff"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</g>
		</svg>
	);
}

function LinkScene() {
	return (
		<svg
			className="fxp-scene fxp-scene--link"
			viewBox="0 0 320 170"
			aria-hidden="true"
			focusable="false"
		>
			{ /* Your site */ }
			<rect
				x="18"
				y="38"
				width="96"
				height="76"
				rx="8"
				fill="#fff"
				stroke="#e1e0d9"
				strokeWidth="2"
			/>
			<rect x="18" y="38" width="96" height="14" rx="7" fill="#1f1a4d" />
			<rect x="30" y="64" width="56" height="7" rx="3.5" fill="#e1e0d9" />
			<rect x="30" y="78" width="72" height="7" rx="3.5" fill="#e1e0d9" />
			<rect x="30" y="92" width="40" height="7" rx="3.5" fill="#e1e0d9" />
			{ /* The access details travelling to support */ }
			<g className="fxp-token">
				<rect
					x="126"
					y="66"
					width="48"
					height="22"
					rx="11"
					fill="#4a3aa7"
				/>
				<circle
					cx="140"
					cy="77"
					r="5"
					fill="none"
					stroke="#fff"
					strokeWidth="2.5"
				/>
				<path
					d="M145 77 H162 M157 77 V82"
					stroke="#fff"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
			</g>
			{ /* A support superhero, with a cape and a key badge */ }
			<g className="fxp-hero">
				<path
					className="fxp-cape"
					d="M240 70 L216 138 Q252 128 288 138 L264 70 Z"
					fill="#4a3aa7"
				/>
				<circle
					cx="252"
					cy="52"
					r="16"
					fill="#ffd9b8"
					stroke="#1f1a4d"
					strokeWidth="3"
				/>
				<path d="M238 46 Q252 30 266 46" fill="#1f1a4d" />
				<rect
					x="234"
					y="68"
					width="36"
					height="50"
					rx="10"
					fill="#1f1a4d"
				/>
				<path
					d="M252 80 C258 86 259 96 256 104 L248 104 C245 96 246 86 252 80 Z"
					fill="#fff"
				/>
				<rect
					x="236"
					y="116"
					width="12"
					height="20"
					rx="4"
					fill="#1f1a4d"
				/>
				<rect
					x="256"
					y="116"
					width="12"
					height="20"
					rx="4"
					fill="#1f1a4d"
				/>
			</g>
			<g className="fxp-check">
				<circle cx="288" cy="40" r="13" fill="#1baf7a" />
				<path
					d="M282 40 L287 45 L295 35"
					fill="none"
					stroke="#fff"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
		</svg>
	);
}

function ControlScene() {
	return (
		<svg
			className="fxp-scene fxp-scene--control"
			viewBox="0 0 320 170"
			aria-hidden="true"
			focusable="false"
		>
			<circle
				cx="110"
				cy="85"
				r="52"
				fill="none"
				stroke="#e1e0d9"
				strokeWidth="10"
			/>
			<circle
				className="fxp-ring"
				cx="110"
				cy="85"
				r="52"
				fill="none"
				stroke="#4a3aa7"
				strokeWidth="10"
				strokeLinecap="round"
			/>
			<text x="110" y="82" textAnchor="middle" className="fxp-ring__big">
				3
			</text>
			<text
				x="110"
				y="102"
				textAnchor="middle"
				className="fxp-ring__small"
			>
				{ __( 'days', 'fixpass' ) }
			</text>
			<g className="fxp-shield">
				<path
					d="M226 34 L270 50 V86 C270 112 250 130 226 140 C202 130 182 112 182 86 V50 Z"
					fill="#1f1a4d"
				/>
				<path
					d="M208 86 L222 100 L246 72"
					fill="none"
					stroke="#1baf7a"
					strokeWidth="7"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</g>
		</svg>
	);
}

const STEPS = [
	{
		id: 'welcome',
		label: __( 'Welcome', 'fixpass' ),
		Scene: WelcomeScene,
		title: __( 'Your support team, one link away', 'fixpass' ),
		text: __(
			'Fixpass gives your support team safe, temporary access to your site, and shows them exactly where the problem is. No passwords to share, no long descriptions.',
			'fixpass'
		),
		points: [
			__(
				'Takes a minute: give access, copy the details, send them to your support team.',
				'fixpass'
			),
			__(
				'Access ends by itself, and you can end it any time.',
				'fixpass'
			),
		],
	},
	{
		id: 'access',
		label: __( 'Give access', 'fixpass' ),
		Scene: LinkScene,
		title: __( 'Give access in two steps', 'fixpass' ),
		text: __(
			'Choose how long support can stay (1 day to a week), then hand over the details.',
			'fixpass'
		),
		points: [
			__(
				'1. Give access. The reusable link is best: support can come back as often as they need.',
				'fixpass'
			),
			__(
				'2. Copy the details, and paste them into a reply to your support team.',
				'fixpass'
			),
		],
	},
	{
		id: 'spotlight',
		label: __( 'Spotlight', 'fixpass' ),
		Scene: SpotlightDemo,
		title: __( 'Show exactly where it hurts', 'fixpass' ),
		text: __(
			'Spotlight lets you point at the problem on the page itself, so support sees it straight away.',
			'fixpass'
		),
		points: [
			__(
				'On the page with the problem, click Spotlight a problem at the top right of the toolbar (it’s glowing now).',
				'fixpass'
			),
			__(
				'Click the problem or drag a box around it. Up to 5 spots, all on that page.',
				'fixpass'
			),
			__(
				'While Spotlight is on, the page is paused: links don’t work, so you can’t go to another page. Press Esc to stop.',
				'fixpass'
			),
		],
	},
	{
		id: 'control',
		label: __( 'You’re in control', 'fixpass' ),
		Scene: ControlScene,
		title: __( 'You stay in control', 'fixpass' ),
		text: __(
			'This page shows what support is doing while they have access, and updates by itself.',
			'fixpass'
		),
		points: [
			__( 'See when support logs in, logs out or finishes.', 'fixpass' ),
			__(
				'Extend by 24 hours, or revoke access with one click.',
				'fixpass'
			),
			__(
				'When access ends, the support account is deleted for good.',
				'fixpass'
			),
		],
	},
];

function stepState( i, step ) {
	if ( i === step ) {
		return 'is-current';
	}
	return i < step ? 'is-done' : '';
}

/**
 * @param {Object}   props        Props.
 * @param {Function} props.onDone Called with whether to hide the tour for good.
 * @return {JSX.Element} Tour.
 */
export default function Onboarding( { onDone } ) {
	const [ step, setStep ] = useState( 0 );
	const [ hide, setHide ] = useState( true );
	const current = STEPS[ step ];
	const last = step === STEPS.length - 1;
	const { Scene } = current;
	// On the Spotlight step, point at the real toolbar button.
	useEffect( () => {
		const button = document.getElementById(
			'wp-admin-bar-fixpass-spotlight'
		);
		if ( ! button ) {
			return;
		}
		button.classList.toggle( 'fxp-glow', current.id === 'spotlight' );
		return () => button.classList.remove( 'fxp-glow' );
	}, [ current.id ] );
	return (
		<div className="fxp-tour">
			<ol
				className="fxp-tour__steps"
				aria-label={ __( 'Welcome tour', 'fixpass' ) }
			>
				{ STEPS.map( ( s, i ) => (
					<li
						key={ s.id }
						className={ stepState( i, step ) }
						aria-current={ i === step ? 'step' : undefined }
					>
						<button type="button" onClick={ () => setStep( i ) }>
							<span className="fxp-tour__dot">
								{ i < step ? '✓' : i + 1 }
							</span>
							<span className="fxp-tour__label">{ s.label }</span>
						</button>
					</li>
				) ) }
			</ol>
			<section className="fxp-tour__card" key={ current.id }>
				<div className="fxp-tour__scene">
					<Scene />
				</div>
				<h1 className="fxp-tour__title">{ current.title }</h1>
				<p className="fxp-tour__text">{ current.text }</p>
				<ul className="fxp-tour__points">
					{ current.points.map( ( p ) => (
						<li key={ p }>{ p }</li>
					) ) }
				</ul>
				<div className="fxp-tour__foot">
					{ last ? (
						<label
							className="fxp-tour__check"
							htmlFor="fxp-tour-hide"
						>
							<input
								id="fxp-tour-hide"
								type="checkbox"
								checked={ hide }
								onChange={ ( e ) =>
									setHide( e.target.checked )
								}
							/>
							{ __( 'Don’t show this again', 'fixpass' ) }
						</label>
					) : (
						<button
							type="button"
							className="hdh-link-button"
							onClick={ () => onDone( false ) }
						>
							{ __( 'Skip the tour', 'fixpass' ) }
						</button>
					) }
					<div className="hdh-row">
						{ step > 0 && (
							<button
								type="button"
								className="hdh-btn is-ghost"
								onClick={ () => setStep( step - 1 ) }
							>
								{ __( 'Back', 'fixpass' ) }
							</button>
						) }
						<button
							type="button"
							className="hdh-btn is-primary"
							onClick={ () =>
								last ? onDone( hide ) : setStep( step + 1 )
							}
						>
							{ last
								? __( 'Let’s go', 'fixpass' )
								: __( 'Next', 'fixpass' ) }
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
