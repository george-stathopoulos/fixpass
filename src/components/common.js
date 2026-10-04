import { __ } from '@wordpress/i18n';

/**
 * Error message from an apiFetch rejection.
 *
 * @param {Object} e Error.
 * @return {string} Message.
 */
export function message( e ) {
	return ( e && e.message ) || __( 'Something went wrong.', 'fixpass' );
}

export const boot = window.hdhBoot || {};
