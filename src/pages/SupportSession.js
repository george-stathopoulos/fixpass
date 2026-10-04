/**
 * What support sees after logging in with the link: the spots the site owner sent, and the
 * session (how long it lasts, leave or end it).
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useApi, send } from '../ui/lib/hooks';
import {
	Card,
	PageHead,
	ErrorNotice,
	Loading,
	Pill,
	Button,
	useToast,
} from '../ui/components/ui';
import { KeyValues, confirmAction } from '../ui/components/kit';
import Icon from '../ui/components/Icon';
import { when } from '../ui/lib/time';
import { message } from '../components/common';

export default function SupportSession() {
	const { data, error, reload } = useApi( 'admin/session' );
	const [ ending, setEnding ] = useState( false );
	const toast = useToast();
	if ( error && ! data ) {
		return <ErrorNotice error={ error } onRetry={ reload } />;
	}
	if ( ! data ) {
		return <Loading />;
	}
	const spots = data.shared.spots;
	const leave = () => {
		setEnding( true );
		send( 'admin/session/leave', 'POST', {} )
			.then( ( r ) => window.location.assign( r.redirect ) )
			.catch( ( e ) => {
				toast( message( e ), 'alert' );
				setEnding( false );
			} );
	};
	const endAccess = async () => {
		const ok = await confirmAction(
			__(
				'End access now? Your support account is deleted and you are logged out. To come back, the site owner has to send a new link.',
				'fixpass'
			),
			{ confirmText: __( 'End access', 'fixpass' ) }
		);
		if ( ! ok ) {
			return;
		}
		setEnding( true );
		send( 'admin/session/end', 'POST', {} )
			.then( ( r ) => window.location.assign( r.redirect ) )
			.catch( ( e ) => {
				toast( message( e ), 'alert' );
				setEnding( false );
			} );
	};
	return (
		<>
			<PageHead
				title={ __( 'Support session', 'fixpass' ) }
				lede={ sprintf(
					/* translators: %s: site name */
					__(
						'You are logged in to %s as a full administrator. Site details, debugging tools and troubleshooting mode are in the tabs above; only you can see them.',
						'fixpass'
					),
					data.site
				) }
			/>
			<div className="hdh-split">
				<div className="hdh-split__main">
					<Card
						title={ __( 'Spots from the site owner', 'fixpass' ) }
						sub={
							data.shared.time
								? sprintf(
										/* translators: %s: date */
										__(
											'Sent with the link on %s',
											'fixpass'
										),
										when( data.shared.time )
								  )
								: undefined
						}
					>
						{ spots.length ? (
							<ul className="hdh-plain-list hdh-session-spots">
								{ spots.map( ( s, i ) => (
									<li key={ s.id }>
										<div
											className="hdh-row"
											style={ { gap: 8 } }
										>
											<span className="hdh-picked-spot__num">
												{ i + 1 }
											</span>
											<strong>
												{ s.label || s.title }
											</strong>
											<a
												className="hdh-btn is-sm"
												href={ s.highlight }
											>
												<Icon name="eye" size={ 14 } />
												{ __(
													'Open and highlight',
													'fixpass'
												) }
											</a>
										</div>
										<div
											className="hdh-muted"
											style={ {
												fontSize: 13,
												marginTop: 4,
											} }
										>
											{ s.title } · { s.viewport.w }×
											{ s.viewport.h } · { s.browser }
										</div>
										{ s.errors.map( ( e, n ) => (
											<code
												key={ `e${ n }` }
												className="hdh-error-detail"
												style={ {
													display: 'block',
													marginTop: 4,
												} }
											>
												{ e.message }
												{ e.source
													? ` (${ e.source }:${ e.line })`
													: '' }
											</code>
										) ) }
										{ s.requests.map( ( r, n ) => (
											<code
												key={ `r${ n }` }
												className="hdh-error-detail"
												style={ {
													display: 'block',
													marginTop: 4,
												} }
											>
												{ r.method } { r.url } →{ ' ' }
												{ r.status ||
													__(
														'no response',
														'fixpass'
													) }
											</code>
										) ) }
									</li>
								) ) }
							</ul>
						) : (
							<p className="hdh-muted" style={ { margin: 0 } }>
								{ __(
									'The site owner didn’t send any spots with this link.',
									'fixpass'
								) }
							</p>
						) }
					</Card>
				</div>
				<aside className="hdh-split__side">
					<Card title={ __( 'This session', 'fixpass' ) }>
						<div className="hdh-stack">
							<Pill tone="good" dot>
								{ sprintf(
									/* translators: %s: date and time */
									__( 'Until %s', 'fixpass' ),
									when( data.expires )
								) }
							</Pill>
							<KeyValues
								rows={ [
									[
										__( 'Signed in as', 'fixpass' ),
										data.user,
									],
									[
										__( 'Access level', 'fixpass' ),
										__( 'Full administrator', 'fixpass' ),
									],
								] }
							/>
							<div className="hdh-session-exit">
								<Button
									icon="login"
									disabled={ ending }
									onClick={ leave }
								>
									{ __( 'Leave session', 'fixpass' ) }
								</Button>
								<p className="hdh-muted">
									{ __(
										'Log out. Access stays on, but you need a new link from the site owner to come back.',
										'fixpass'
									) }
								</p>
								<Button
									variant="danger"
									icon="x"
									disabled={ ending }
									onClick={ endAccess }
								>
									{ __( 'End access', 'fixpass' ) }
								</Button>
								<p className="hdh-muted">
									{ __(
										'For when you’re done: deletes your support account now.',
										'fixpass'
									) }
								</p>
							</div>
						</div>
					</Card>
				</aside>
			</div>
		</>
	);
}
