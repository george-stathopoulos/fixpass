import { createRoot } from '@wordpress/element';
import App from './App';
import './ui/style.scss';

function mount() {
	const root = document.getElementById( 'fxp-root' );
	if ( ! root ) {
		return;
	}
	root.classList.remove( 'hdh-root' );
	createRoot( root ).render( <App /> );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mount );
} else {
	mount();
}
