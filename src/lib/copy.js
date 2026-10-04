/**
 * Copying to the clipboard, formatted (for email) or as plain text.
 */

/**
 * Copy HTML (with a plain-text version) so it pastes formatted into an email.
 *
 * @param {string} html HTML.
 * @param {string} text Plain text.
 * @return {Promise} Done.
 */
export function copyRich( html, text ) {
	if (
		window.ClipboardItem &&
		navigator.clipboard &&
		navigator.clipboard.write
	) {
		return navigator.clipboard.write( [
			new window.ClipboardItem( {
				'text/html': new window.Blob( [ html ], { type: 'text/html' } ),
				'text/plain': new window.Blob( [ text ], {
					type: 'text/plain',
				} ),
			} ),
		] );
	}
	// Older browsers: copy a selection of the formatted content.
	return new Promise( ( resolve, reject ) => {
		const box = document.createElement( 'div' );
		box.contentEditable = 'true';
		box.style.cssText = 'position:fixed;left:-9999px;top:0';
		box.innerHTML = html;
		document.body.appendChild( box );
		const range = document.createRange();
		range.selectNodeContents( box );
		const sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange( range );
		const ok = document.execCommand( 'copy' );
		sel.removeAllRanges();
		box.remove();
		return ok ? resolve() : reject();
	} );
}

export function copyText( text ) {
	if ( navigator.clipboard && navigator.clipboard.writeText ) {
		return navigator.clipboard.writeText( text );
	}
	return new Promise( ( resolve, reject ) => {
		const area = document.createElement( 'textarea' );
		area.value = text;
		area.style.cssText = 'position:fixed;left:-9999px;top:0';
		document.body.appendChild( area );
		area.select();
		const ok = document.execCommand( 'copy' );
		area.remove();
		return ok ? resolve() : reject();
	} );
}
