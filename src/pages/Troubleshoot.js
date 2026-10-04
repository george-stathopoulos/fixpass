import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useApi, send } from '../ui/lib/hooks';
import { ago, when } from '../ui/lib/time';
import {
	Card,
	PageHead,
	Button,
	ErrorNotice,
	Loading,
	Pill,
	useToast,
} from '../ui/components/ui';
import { Check } from '../ui/components/kit';
import { message } from '../components/common';

/**
 * Troubleshooting mode, on support's Troubleshoot tab.
 *
 * @return {JSX.Element} Panel.
 */
export default function Troubleshoot() {
	const { data, error, reload } = useApi( 'admin/troubleshoot' );
	const [ keep, setKeep ] = useState( null );
	const [ theme, setTheme ] = useState( false );
	const [ busy, setBusy ] = useState( false );
	const toast = useToast();

	if ( error && ! data ) {
		return <ErrorNotice error={ error } onRetry={ reload } />;
	}
	if ( ! data ) {
		return <Loading />;
	}
	const selected =
		keep === null
			? data.plugins.filter( ( p ) => p.keep ).map( ( p ) => p.file )
			: keep;
	const useTheme = keep === null ? data.use_theme : theme;

	const apply = ( op ) => {
		setBusy( true );
		send( 'admin/troubleshoot', 'POST', {
			op,
			keep: selected,
			theme: useTheme,
		} )
			.then( () => window.location.reload() )
			.catch( ( e ) => {
				toast( message( e ), 'alert' );
				setBusy( false );
			} );
	};

	return (
		<>
			<PageHead
				title={ __( 'Troubleshooting mode', 'fixpass' ) }
				lede={ __(
					'Turn plugins off for your browser session only. Visitors and other users keep seeing the site exactly as it is. Switch off half, test, then narrow it down.',
					'fixpass'
				) }
			>
				{ data.active && (
					<Pill tone="warning" dot>
						{ __( 'On for your session', 'fixpass' ) }
					</Pill>
				) }
			</PageHead>
			<Card
				title={ __( 'Plugins to keep on', 'fixpass' ) }
				sub={
					data.active
						? `${ __( 'Switches itself off', 'fixpass' ) } ${ ago(
								data.expires_at
						  ) } (${ when( data.expires_at ) })`
						: null
				}
				action={
					<div className="hdh-row">
						<Button
							size="sm"
							variant="ghost"
							onClick={ () =>
								setKeep( data.plugins.map( ( p ) => p.file ) )
							}
						>
							{ __( 'Keep all', 'fixpass' ) }
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={ () => setKeep( [] ) }
						>
							{ __( 'Switch all off', 'fixpass' ) }
						</Button>
					</div>
				}
			>
				<div className="hdh-stack" style={ { gap: 0 } }>
					{ data.plugins.map( ( p ) => (
						<Check
							key={ p.file }
							label={ p.name }
							desc={ p.version }
							checked={ selected.includes( p.file ) }
							onChange={ ( on ) =>
								setKeep(
									on
										? [ ...selected, p.file ]
										: selected.filter(
												( f ) => f !== p.file
										  )
								)
							}
						/>
					) ) }
					{ data.default_theme && (
						<Check
							label={ __(
								'Also switch to a default theme',
								'fixpass'
							) }
							desc={ data.default_theme }
							checked={ useTheme }
							onChange={ ( v ) => {
								if ( keep === null ) {
									setKeep( selected );
								}
								setTheme( v );
							} }
						/>
					) }
				</div>
				<div className="hdh-row" style={ { marginTop: 16 } }>
					<Button
						variant="primary"
						disabled={ busy }
						onClick={ () => apply( 'start' ) }
					>
						{ data.active
							? __( 'Apply', 'fixpass' )
							: __( 'Start troubleshooting', 'fixpass' ) }
					</Button>
					{ data.active && (
						<Button
							variant="ghost"
							disabled={ busy }
							onClick={ () => apply( 'stop' ) }
						>
							{ __( 'Stop troubleshooting', 'fixpass' ) }
						</Button>
					) }
				</div>
			</Card>
		</>
	);
}
