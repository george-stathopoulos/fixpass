/**
 * The access history: what happened with support access on this site (given, extended, ended,
 * support logging in and out) and what support did. Can be downloaded and deleted, and says how
 * long it is kept.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import { useApi, send } from '../ui/lib/hooks';
import { when } from '../ui/lib/time';
import { Card, Button, useToast } from '../ui/components/ui';
import { Check, confirmAction } from '../ui/components/kit';
import { message } from '../components/common';

const PAGE = 15;
const KEEP = [ 30, 90, 365 ];

function csvCell( value ) {
	return `"${ String( value ?? '' ).replace( /"/g, '""' ) }"`;
}

function downloadCsv( events ) {
	const lines = [
		[ 'Time (UTC)', 'Who', 'What happened', 'IP address' ]
			.map( csvCell )
			.join( ',' ),
		...events.map( ( e ) =>
			[ e.time, e.actor, e.event, e.ip ].map( csvCell ).join( ',' )
		),
	];
	const url = URL.createObjectURL(
		new Blob( [ '﻿' + lines.join( '\r\n' ) ], {
			type: 'text/csv;charset=utf-8',
		} )
	);
	const a = document.createElement( 'a' );
	a.href = url;
	a.download = 'fixpass-access-history.csv';
	document.body.appendChild( a );
	a.click();
	a.remove();
	window.setTimeout( () => URL.revokeObjectURL( url ), 1000 );
}

/**
 * @param {Object}   props            Props.
 * @param {string}   props.refreshKey Changes when access changes, so the list reloads.
 * @param {number}   props.retention  Days the history is kept.
 * @param {Function} props.onChanged  Called after the history was deleted or the period changed.
 * @return {JSX.Element|null} The card, or nothing while there is no history.
 */
export default function Activity( { refreshKey, retention, onChanged } ) {
	const { data, reload } = useApi( 'admin/activity' );
	const toast = useToast();
	const [ pages, setPages ] = useState( false );
	const [ shown, setShown ] = useState( PAGE );
	const first = useRef( true );

	useEffect( () => {
		if ( first.current ) {
			first.current = false;
			return;
		}
		reload();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ refreshKey ] );

	if ( ! data || ! data.events.length ) {
		return null;
	}
	const all = data.events;
	const list = pages ? all : all.filter( ( e ) => ! e.minor );
	const hasPages = all.some( ( e ) => e.minor );

	const clear = async () => {
		const ok = await confirmAction(
			__(
				'Delete the access history? This removes the record of past access and what support did. It can’t be undone. Download it first if you want a copy. Access that is open right now keeps its history.',
				'fixpass'
			),
			{ confirmText: __( 'Delete history', 'fixpass' ) }
		);
		if ( ! ok ) {
			return;
		}
		send( 'admin/activity/clear', 'POST', {} )
			.then( () => {
				reload();
				onChanged();
				toast( __( 'Access history deleted.', 'fixpass' ) );
			} )
			.catch( ( e ) => toast( message( e ), 'alert' ) );
	};

	const keepFor = ( days ) =>
		send( 'admin/retention', 'POST', { days } )
			.then( onChanged )
			.catch( ( e ) => toast( message( e ), 'alert' ) );

	return (
		<Card
			title={ __( 'Access history', 'fixpass' ) }
			sub={ __(
				'Who did what: you, support, and Fixpass itself. Access given, extended and ended stand out; what support looked at and changed is listed in between.',
				'fixpass'
			) }
		>
			<div className="hdh-stack" style={ { gap: 14 } }>
				{ hasPages && (
					<Check
						checked={ pages }
						onChange={ setPages }
						label={ __(
							'Include every page support looked at',
							'fixpass'
						) }
					/>
				) }
				<ul className="fxp-history">
					{ list.slice( 0, shown ).map( ( e ) => (
						<li
							key={ e.id }
							className={ [
								e.key ? 'is-key' : '',
								e.tone ? `is-${ e.tone }` : '',
							]
								.filter( Boolean )
								.join( ' ' ) }
						>
							<time dateTime={ e.time }>{ when( e.time ) }</time>
							<span className={ `fxp-who is-${ e.who }` }>
								{ e.actor }
							</span>
							<span className="fxp-history__what">
								{ e.event }
								{ e.ip && (
									<span className="hdh-muted">
										{ ' ' }
										{ sprintf(
											/* translators: %s: IP address */
											__( '(IP %s)', 'fixpass' ),
											e.ip
										) }
									</span>
								) }
							</span>
						</li>
					) ) }
				</ul>
				{ list.length > shown && (
					<div>
						<button
							type="button"
							className="hdh-link-button"
							onClick={ () => setShown( shown + PAGE ) }
						>
							{ __( 'Show more', 'fixpass' ) }
						</button>
					</div>
				) }
				<div className="hdh-row">
					<Button icon="download" onClick={ () => downloadCsv( all ) }>
						{ __( 'Download (CSV)', 'fixpass' ) }
					</Button>
					<Button variant="danger" icon="trash" onClick={ clear }>
						{ __( 'Delete history', 'fixpass' ) }
					</Button>
				</div>
				<p className="hdh-muted fxp-history__keep">
					<label htmlFor="fxp-keep">
						{ __( 'Keep the history for', 'fixpass' ) }
					</label>{ ' ' }
					<select
						id="fxp-keep"
						className="hdh-input hdh-select"
						style={ { width: 'auto' } }
						value={ retention }
						onChange={ ( e ) =>
							keepFor( parseInt( e.target.value, 10 ) )
						}
					>
						{ KEEP.map( ( d ) => (
							<option key={ d } value={ d }>
								{ sprintf(
									/* translators: %d: number of days */
									__( '%d days', 'fixpass' ),
									d
								) }
							</option>
						) ) }
					</select>
					. { __( 'Older entries are deleted automatically.', 'fixpass' ) }{ ' ' }
					{ __(
						'If Fixpass deletes itself when access ends, the history is deleted with it.',
						'fixpass'
					) }
				</p>
			</div>
		</Card>
	);
}
