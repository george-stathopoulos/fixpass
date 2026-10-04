import { __, sprintf } from '@wordpress/i18n';
import { useRoute, useTheme } from './ui/lib/hooks';
import { ToastProvider, ErrorBoundary } from './ui/components/ui';
import Icon from './ui/components/Icon';
import Home from './pages/Home';
import Health from './pages/Health';
import Debug from './pages/Debug';
import SupportSession from './pages/SupportSession';
import Troubleshoot from './pages/Troubleshoot';

const boot = window.hdhBoot || {};

// Support's tabs. The site owner has a single screen (Home) and never sees these.
const SUPPORT_ROUTES = [
	{
		id: 'session',
		label: __( 'Session', 'fixpass' ),
		icon: 'key',
		Page: SupportSession,
	},
	{
		id: 'details',
		label: __( 'Site details', 'fixpass' ),
		icon: 'gauge',
		Page: Health,
	},
	{
		id: 'debug',
		label: __( 'Debugging', 'fixpass' ),
		icon: 'code',
		Page: Debug,
	},
	{
		id: 'troubleshoot',
		label: __( 'Troubleshoot', 'fixpass' ),
		icon: 'wrench',
		Page: Troubleshoot,
	},
];

const THEMES = [
	{
		id: 'system',
		icon: 'monitor',
		label: __( 'Theme: match system', 'fixpass' ),
	},
	{ id: 'light', icon: 'sun', label: __( 'Theme: light', 'fixpass' ) },
	{ id: 'dark', icon: 'moon', label: __( 'Theme: dark', 'fixpass' ) },
];

export function Shell( { nav, current, children } ) {
	const [ theme, setTheme ] = useTheme();
	const themeIndex = Math.max(
		0,
		THEMES.findIndex( ( t ) => t.id === theme )
	);
	const nextTheme = THEMES[ ( themeIndex + 1 ) % THEMES.length ];
	return (
		<div
			className="hdh-root fxp-app"
			data-theme={ theme === 'system' ? undefined : theme }
		>
			<ToastProvider>
				<header className="hdh-header">
					<div className="hdh-header__inner">
						<div className="hdh-brand">
							<span className="hdh-brand__mark">
								<Icon name="key" size={ 20 } />
							</span>
							<span>
								<div className="hdh-brand__name">
									{ __( 'Fixpass', 'fixpass' ) }
								</div>
								<div className="hdh-brand__sub">
									{ boot.siteName }
								</div>
							</span>
						</div>
						{ nav && (
							<nav
								className="hdh-nav"
								aria-label={ __(
									'Fixpass sections',
									'fixpass'
								) }
							>
								{ nav.map( ( r ) => (
									<a
										key={ r.id }
										href={ `#/${ r.id }` }
										className={ `hdh-nav__item ${
											r.id === current ? 'is-active' : ''
										}` }
										aria-current={
											r.id === current
												? 'page'
												: undefined
										}
									>
										<Icon name={ r.icon } size={ 15 } />
										{ r.label }
									</a>
								) ) }
							</nav>
						) }
						<div className="hdh-header__end">
							<button
								type="button"
								className="hdh-btn is-ghost is-icon"
								onClick={ () => setTheme( nextTheme.id ) }
								title={ THEMES[ themeIndex ].label }
								aria-label={ `${
									THEMES[ themeIndex ].label
								}. ${ __( 'Click to change.', 'fixpass' ) }` }
							>
								<Icon
									name={ THEMES[ themeIndex ].icon }
									size={ 17 }
								/>
							</button>
						</div>
					</div>
				</header>
				{ children }
				<footer className="hdh-footer">
					<span>{ __( 'Fixpass', 'fixpass' ) }</span>
					<span className="hdh-footer__links">
						<span>
							{ sprintf(
								/* translators: %s: plugin version number. */
								__( 'Version %s', 'fixpass' ),
								boot.version
							) }
						</span>
					</span>
				</footer>
			</ToastProvider>
		</div>
	);
}

/**
 * The site owner's screen.
 *
 * @return {JSX.Element} Screen.
 */
function OwnerApp() {
	return (
		<Shell>
			<main className="hdh-shell">
				<ErrorBoundary resetKey="home">
					<Home />
				</ErrorBoundary>
			</main>
		</Shell>
	);
}

export default function App() {
	const [ route ] = useRoute( 'session' );
	if ( ! boot.isSupport ) {
		return <OwnerApp />;
	}
	const [ section ] = route.split( /[/?]/ );
	const current =
		SUPPORT_ROUTES.find( ( r ) => r.id === section ) || SUPPORT_ROUTES[ 0 ];
	const { Page } = current;
	return (
		<Shell nav={ SUPPORT_ROUTES } current={ current.id }>
			<main className="hdh-shell" key={ current.id }>
				<ErrorBoundary resetKey={ current.id }>
					<Page />
				</ErrorBoundary>
			</main>
		</Shell>
	);
}
