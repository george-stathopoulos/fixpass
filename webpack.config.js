/**
 * Bundle the JSX runtime instead of requiring WordPress's `react-jsx-runtime` script, which only
 * exists from WordPress 6.6. Fixpass supports 6.5, where the missing script would stop the whole
 * app from loading.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	...defaultConfig,
	plugins: defaultConfig.plugins.map( ( plugin ) =>
		plugin instanceof DependencyExtractionWebpackPlugin
			? new DependencyExtractionWebpackPlugin( {
					requestToExternal: ( request ) =>
						request === 'react/jsx-runtime' ||
						request === 'react/jsx-dev-runtime'
							? false
							: undefined,
			  } )
			: plugin
	),
};
