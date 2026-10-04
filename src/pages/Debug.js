/**
 * Debugging tools: debug.log, errors caught, scheduled tasks, debugging settings.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useApi } from '../ui/lib/hooks';
import { ago, when } from '../ui/lib/time';
import {
	Card,
	PageHead,
	Button,
	Loading,
	ErrorNotice,
	Empty,
	Segmented,
	useToast,
} from '../ui/components/ui';
import { CodeBlock, KeyValues } from '../ui/components/kit';

export default function Debug() {
	const [ tab, setTab ] = useState( 'log' );
	const [ search, setSearch ] = useState( '' );
	const [ query, setQuery ] = useState( { lines: 200, search: '' } );
	const { data, error, reload } = useApi(
		addQueryArgs( 'admin/debug', query )
	);
	const toast = useToast();
	if ( error && ! data ) {
		return <ErrorNotice error={ error } onRetry={ reload } />;
	}
	if ( ! data ) {
		return <Loading />;
	}
	const log = data.log;
	const copy = ( text ) =>
		navigator.clipboard
			.writeText( text )
			.then( () => toast( __( 'Copied', 'fixpass' ) ) )
			.catch( () => toast( __( 'Couldn’t copy.', 'fixpass' ), 'alert' ) );
	return (
		<>
			<PageHead
				title={ __( 'Debugging', 'fixpass' ) }
				lede={ __(
					'Read-only tools to see what’s going wrong. Nothing here changes your site.',
					'fixpass'
				) }
			>
				<Button icon="refresh" variant="ghost" onClick={ reload }>
					{ __( 'Refresh', 'fixpass' ) }
				</Button>
			</PageHead>
			<div style={ { marginBottom: 14 } }>
				<Segmented
					label={ __( 'Tool', 'fixpass' ) }
					value={ tab }
					onChange={ setTab }
					options={ [
						{
							value: 'log',
							label: __( 'debug.log', 'fixpass' ),
						},
						{
							value: 'errors',
							label: sprintf(
								/* translators: %d: number of errors */
								__( 'Errors (%d)', 'fixpass' ),
								data.errors.length
							),
						},
						{
							value: 'cron',
							label: __( 'Scheduled tasks', 'fixpass' ),
						},
						{
							value: 'constants',
							label: __( 'Settings', 'fixpass' ),
						},
					] }
				/>
			</div>

			{ tab === 'log' && (
				<Card
					title={ __( 'debug.log', 'fixpass' ) }
					sub={
						log.exists
							? sprintf(
									/* translators: %s: size in KB */
									__(
										'The last lines of WordPress’s debug log (%s KB in total). Secrets and email addresses are removed.',
										'fixpass'
									),
									Math.round( log.size / 1024 )
							  )
							: null
					}
					action={
						log.lines.length > 0 && (
							<Button
								size="sm"
								icon="copy"
								onClick={ () => copy( log.lines.join( '\n' ) ) }
							>
								{ __( 'Copy', 'fixpass' ) }
							</Button>
						)
					}
				>
					{ ! log.enabled && (
						<div className="hdh-policy-note">
							<span>
								{ __(
									'WordPress isn’t writing a debug log. To turn it on, add these lines to wp-config.php (above “That’s all, stop editing”), or ask your host:',
									'fixpass'
								) }
								<CodeBlock
									text={
										"define( 'WP_DEBUG', true );\ndefine( 'WP_DEBUG_LOG', true );\ndefine( 'WP_DEBUG_DISPLAY', false );"
									}
								/>
								{ __(
									'Turn it off again when you’re done: the log can grow large.',
									'fixpass'
								) }
							</span>
						</div>
					) }
					{ log.enabled && ! log.exists && (
						<Empty
							compact
							title={ __(
								'The log is empty: no errors written yet.',
								'fixpass'
							) }
						/>
					) }
					{ log.enabled && log.exists && (
						<div className="hdh-stack">
							<div className="hdh-row">
								<input
									className="hdh-input"
									style={ { maxWidth: 280 } }
									aria-label={ __(
										'Search the log',
										'fixpass'
									) }
									placeholder={ __(
										'Search, e.g. Fatal or a plugin name',
										'fixpass'
									) }
									value={ search }
									onChange={ ( e ) =>
										setSearch( e.target.value )
									}
									onKeyDown={ ( e ) =>
										e.key === 'Enter' &&
										setQuery( { ...query, search } )
									}
								/>
								<Button
									size="sm"
									onClick={ () =>
										setQuery( { ...query, search } )
									}
								>
									{ __( 'Search', 'fixpass' ) }
								</Button>
								<select
									className="hdh-input hdh-select"
									style={ { width: 'auto' } }
									aria-label={ __( 'Lines', 'fixpass' ) }
									value={ query.lines }
									onChange={ ( e ) =>
										setQuery( {
											...query,
											lines: parseInt(
												e.target.value,
												10
											),
										} )
									}
								>
									{ [ 100, 200, 500, 1000 ].map( ( n ) => (
										<option key={ n } value={ n }>
											{ sprintf(
												/* translators: %d: number of lines */
												__(
													'Last %d lines',
													'fixpass'
												),
												n
											) }
										</option>
									) ) }
								</select>
							</div>
							{ log.lines.length ? (
								<CodeBlock
									text={ log.lines.join( '\n' ) }
									maxHeight={ 560 }
								/>
							) : (
								<Empty
									compact
									title={ __( 'No lines match.', 'fixpass' ) }
								/>
							) }
						</div>
					) }
				</Card>
			) }

			{ tab === 'errors' && (
				<Card
					title={ __( 'Errors caught', 'fixpass' ) }
					sub={ __(
						'PHP errors and JavaScript errors in the admin, caught by Fixpass, with the plugin or theme they came from.',
						'fixpass'
					) }
					bodyClass={ data.errors.length ? null : undefined }
				>
					{ ! data.errors.length ? (
						<Empty
							compact
							title={ __( 'No errors caught.', 'fixpass' ) }
						/>
					) : (
						<div className="hdh-table-wrap">
							<table className="hdh-table">
								<thead>
									<tr>
										<th scope="col">
											{ __( 'Error', 'fixpass' ) }
										</th>
										<th scope="col">
											{ __( 'From', 'fixpass' ) }
										</th>
										<th scope="col">
											{ __( 'When', 'fixpass' ) }
										</th>
									</tr>
								</thead>
								<tbody>
									{ data.errors.map( ( e, i ) => (
										<tr key={ i }>
											<td>
												<div>{ e.message }</div>
												<div
													className="hdh-muted"
													style={ { fontSize: 12 } }
												>
													{ e.where }
													{ e.page
														? ` · ${ e.page }`
														: '' }
												</div>
											</td>
											<td>{ e.component || '—' }</td>
											<td title={ when( e.time ) }>
												{ ago( e.time ) }
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					) }
				</Card>
			) }

			{ tab === 'cron' && (
				<Card
					title={ __( 'Scheduled tasks', 'fixpass' ) }
					sub={
						data.cron.disabled
							? __(
									'WP-Cron is turned off (DISABLE_WP_CRON): tasks only run if your server runs them.',
									'fixpass'
							  )
							: __(
									'Tasks WordPress runs in the background. “Late” ones point at a cron problem.',
									'fixpass'
							  )
					}
					bodyClass={ null }
				>
					<div className="hdh-table-wrap">
						<table className="hdh-table">
							<thead>
								<tr>
									<th scope="col">
										{ __( 'Task', 'fixpass' ) }
									</th>
									<th scope="col">
										{ __( 'Repeats', 'fixpass' ) }
									</th>
									<th scope="col">
										{ __( 'Next run', 'fixpass' ) }
									</th>
								</tr>
							</thead>
							<tbody>
								{ data.cron.tasks.map( ( t, i ) => (
									<tr key={ i }>
										<td>
											<code>{ t.hook }</code>
										</td>
										<td>
											{ t.schedule ||
												__( 'once', 'fixpass' ) }
										</td>
										<td title={ when( t.next ) }>
											{ t.late ? (
												<strong
													style={ {
														color: 'var(--hdh-critical-ink)',
													} }
												>
													{ __( 'Late', 'fixpass' ) }{ ' ' }
													· { ago( t.next ) }
												</strong>
											) : (
												ago( t.next )
											) }
										</td>
									</tr>
								) ) }
							</tbody>
						</table>
					</div>
				</Card>
			) }

			{ tab === 'constants' && (
				<Card title={ __( 'Debugging settings', 'fixpass' ) }>
					<KeyValues
						rows={ data.constants.map( ( c ) => [
							c.name,
							<code key={ c.name }>{ c.value }</code>,
						] ) }
					/>
				</Card>
			) }
		</>
	);
}
