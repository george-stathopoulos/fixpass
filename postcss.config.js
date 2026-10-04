/**
 * PostCSS: WordPress's usual setup, plus PurgeCSS. The stylesheet comes from a UI kit shared with
 * a larger app, so the build keeps only the classes Fixpass's code actually uses.
 */
const isProduction = process.env.NODE_ENV === 'production';
const purgecss = require( '@fullhuman/postcss-purgecss' );

module.exports = {
	plugins: [
		...require( '@wordpress/postcss-plugins-preset' ),
		purgecss( {
			content: [ './src/**/*.js', './includes/**/*.php', './assets/*.js' ],
			// Classes built at runtime (is-${ variant }, is-${ tone }, …) and theme attributes.
			safelist: {
				standard: [ /^is-/, /^has-/, /^hdh-root$/, /^fxp-in-wpr$/ ],
				greedy: [ /data-theme/ ],
			},
			defaultExtractor: ( content ) => content.match( /[\w-/:%.]+(?<!:)/g ) || [],
		} ),
		...( isProduction
			? [
					require( 'cssnano' )( {
						preset: [ 'default', { discardComments: { removeAll: true } } ],
					} ),
			  ]
			: [] ),
	],
};
