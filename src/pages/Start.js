/**
 * Where the site owner starts, before access is given: two big choices ("Show the problem, then
 * give access" or "Just give access"), the Spotlight guide for the first, and the spots picked.
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Card, Button, Pill } from '../ui/components/ui';
import Icon from '../ui/components/Icon';
import SpotlightDemo from '../ui/components/SpotlightDemo';

function Choice( { icon, title, badge, text, meta, onClick } ) {
	return (
		<button type="button" className="fxp-pick__btn" onClick={ onClick }>
			<span className="fxp-pick__icon" aria-hidden="true">
				<Icon name={ icon } size={ 28 } />
			</span>
			<span className="fxp-pick__body">
				<strong>
					{ title }
					{ badge && <Pill tone="accent">{ badge }</Pill> }
				</strong>
				<span>{ text }</span>
				<em>{ meta }</em>
			</span>
			<span className="fxp-pick__go" aria-hidden="true">
				<Icon name="chevron" size={ 20 } />
			</span>
		</button>
	);
}

function BackLink( { onClick } ) {
	return (
		<button
			type="button"
			className="hdh-link-button"
			style={ { alignSelf: 'flex-start' } }
			onClick={ onClick }
		>
			{ __( '← Back to the two options', 'fixpass' ) }
		</button>
	);
}

/**
 * @param {Object}   props               Props.
 * @param {string}   props.mode          null (choosing), 'spot' or 'access'.
 * @param {Function} props.setMode       Change mode.
 * @param {Object}   props.data          Page state.
 * @param {Array}    props.spots         Spots picked with Spotlight.
 * @param {Function} props.setSpots      Change the picked spots.
 * @param {Function} props.setSpotlight  Turn Spotlight on or off.
 * @param {Node}     props.form          The give-access form.
 * @return {JSX.Element} The start screen.
 */
export default function Start( {
	mode,
	setMode,
	data,
	spots,
	setSpots,
	setSpotlight,
	form,
} ) {
	if ( ! mode ) {
		return (
			<div className="hdh-stack" style={ { gap: 14 } }>
				<h2 className="fxp-pick__q">
					{ __( 'How do you want to ask for help?', 'fixpass' ) }
				</h2>
				<div className="fxp-pick">
					<Choice
						icon="eye"
						title={ __(
							'Show the problem, then give access',
							'fixpass'
						) }
						badge={ __( 'Recommended', 'fixpass' ) }
						text={ __(
							'Point at what’s wrong on your site and add a short note. Support sees exactly what you mean, so there’s less back and forth.',
							'fixpass'
						) }
						meta={
							data.spotlight
								? __( 'Takes about a minute', 'fixpass' )
								: __(
										'Turns on Spotlight first, which takes a moment',
										'fixpass'
								  )
						}
						onClick={ () =>
							data.spotlight ? setMode( 'spot' ) : setSpotlight( true )
						}
					/>
					<Choice
						icon="key"
						title={ __( 'Just give access', 'fixpass' ) }
						text={ __(
							'Quickest. Support logs in and looks around, and you describe the problem in your message. Good when the whole site is down or you can’t open the page.',
							'fixpass'
						) }
						meta={ __( 'Takes a few seconds', 'fixpass' ) }
						onClick={ () => setMode( 'access' ) }
					/>
				</div>
				{ data.spotlight && (
					<p className="hdh-muted fxp-pick__foot">
						{ __( 'Spotlight is on.', 'fixpass' ) }{ ' ' }
						<button
							type="button"
							className="hdh-link-button"
							onClick={ () => setSpotlight( false ) }
						>
							{ __( 'Turn it off', 'fixpass' ) }
						</button>
					</p>
				) }
			</div>
		);
	}

	if ( mode === 'access' ) {
		return (
			<div className="hdh-stack" style={ { gap: 14 } }>
				<BackLink onClick={ () => setMode( null ) } />
				<Card
					title={ __( 'Give support access', 'fixpass' ) }
					sub={ __(
						'Full administrator access for your support team, for the time you choose. End it any time; it also ends by itself.',
						'fixpass'
					) }
				>
					{ form }
				</Card>
			</div>
		);
	}

	// mode === 'spot'
	if ( ! spots.length ) {
		return (
			<div className="hdh-stack" style={ { gap: 14 } }>
				<BackLink onClick={ () => setMode( null ) } />
				<Card
					title={ __( 'Show support the problem', 'fixpass' ) }
					sub={ __(
						'Three quick steps. You’ll come back to this screen afterwards.',
						'fixpass'
					) }
				>
					<div className="hdh-stack" style={ { gap: 16 } }>
						<ol className="fxp-todo">
							<li>
								<span className="fxp-todo__n">1</span>
								<span>
									<strong>
										{ __(
											'Go to the page with the problem',
											'fixpass'
										) }
									</strong>
									{ __(
										'Open your site and browse to the exact page where it goes wrong.',
										'fixpass'
									) }
								</span>
							</li>
							<li>
								<span className="fxp-todo__n">2</span>
								<span>
									<strong>
										{ __(
											'Click “Spotlight a problem” in the toolbar',
											'fixpass'
										) }
									</strong>
									{ __(
										'It’s at the top right of the page (and glowing). Then click the problem, or drag a box around it. Add a short note to each spot if you like. You can mark up to 5 spots, all on that page.',
										'fixpass'
									) }
								</span>
							</li>
							<li>
								<span className="fxp-todo__n">3</span>
								<span>
									<strong>
										{ __( 'Click Continue', 'fixpass' ) }
									</strong>
									{ __(
										'You’ll land back here with your spots, ready to give access.',
										'fixpass'
									) }
								</span>
							</li>
						</ol>
						<div className="hdh-row">
							<Button
								variant="primary"
								icon="external"
								onClick={ () => {
									// The site keeps the Spotlight button pulsing, with a hint.
									try {
										window.sessionStorage.setItem(
											'fxpGuide',
											'1'
										);
									} catch ( e ) {}
									const url = new URL(
										( window.hdhBoot || {} ).homeUrl ||
											'/',
										window.location.origin
									);
									url.searchParams.set( 'fxp_guide', '1' );
									window.location.href = url.toString();
								} }
							>
								{ __( 'Open my site', 'fixpass' ) }
							</Button>
						</div>
						<SpotlightDemo />
						<p className="hdh-muted" style={ { margin: 0 } }>
							{ __(
								'While Spotlight is on, the page is paused: links don’t work, so you can’t go to another page. Press Esc to stop. Nothing on your screen is recorded.',
								'fixpass'
							) }{ ' ' }
							<button
								type="button"
								className="hdh-link-button"
								onClick={ () => setMode( 'access' ) }
							>
								{ __(
									'Can’t get to the page? Just give access.',
									'fixpass'
								) }
							</button>
						</p>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="hdh-stack" style={ { gap: 14 } }>
			<Card
				title={ sprintf(
					/* translators: %d: number of spots */
					_n(
						'%d spot ready to send',
						'%d spots ready to send',
						spots.length,
						'fixpass'
					),
					spots.length
				) }
				sub={ __(
					'Support will see these highlighted on your page. Want to add more? Go back to that page and click Spotlight a problem again.',
					'fixpass'
				) }
			>
				<ul className="hdh-plain-list">
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
										spots.filter( ( x ) => x.id !== p.id )
									)
								}
							>
								{ __( 'Remove', 'fixpass' ) }
							</button>
						</li>
					) ) }
				</ul>
			</Card>
			<Card
				title={ __( 'Now give support access', 'fixpass' ) }
				sub={ __(
					'Full administrator access for your support team, for the time you choose. Your spots go with it. End it any time; it also ends by itself.',
					'fixpass'
				) }
			>
				{ form }
			</Card>
		</div>
	);
}
