﻿var chalk = require('chalk');
var log = require('picolog');
var fs = require('fs');
var path = require('path');
var appRoot = path.resolve(__dirname, '../');
var webpack = require('webpack');

var cfg = require('../config');

module.exports = {
	// The base directory (absolute path!) for resolving the entry option.
	// If output.pathinfo is set, the included pathinfo is shortened to this directory.
	context: appRoot,

	// The entry point for the bundle.
	// If you pass a string: The string is resolved to a module which is loaded upon startup.
	// If you pass an array: All modules are loaded upon startup. The last one is exported.
	entry: [
		// Reference impl. of React HMR using react-transform-hmr
		// https://github.com/gaearon/react-transform-boilerplate/blob/master/webpack.config.dev.js
		'eventsource-polyfill', // necessary for hot reloading with IE
		// Webpack hot reloading you can attach to your own server
		// https://github.com/glenjamin/webpack-hot-middleware
		'webpack-hot-middleware/client',
		// The client entry point must be last so it is exported
		cfg.client.entry,
	],

	resolve: {
		// IMPORTANT: Setting this option will override the default, meaning that webpack
		// will no longer try to resolve modules using the default extensions. If you want
		// modules that were required with their extension (e.g. require('./somefile.ext'))
		// to be properly resolved, you must include an empty string in your array.
		// Similarly, if you want modules that were required without extensions (e.g.
		// require('underscore')) to be resolved to files with “.js” extensions, you must
		// include ".js" in your array.
		// Default: ["", ".webpack.js", ".web.js", ".js"]
		// https://webpack.github.io/docs/configuration.html#resolve-extensions
		extensions: ['', '.js', '.jsx'],
	},

	externals: {
		'react': 'React',
		'react-dom': 'ReactDOM',
		'react-router': 'ReactRouter',
	},

	cache: true,
	debug: true,

	module: {
		loaders: [
			{
				test: /\.jsx/,
				exclude: /node_modules/,
				loader: 'babel',
				query: {
					plugins: [
						'transform-runtime',
						["react-transform", {
							"transforms": [{
								"transform": "react-transform-hmr",
								"imports": ["react"],
								// this is important for Webpack HMR:
								"locals": ["module"]
							}]
						}]
					],
				}
			},
			//{test: /\.jsx$/, loaders: ["babel?presets[]=es2015&presets[]=stage-0&presets[]=react"], exclude: /node_modules/}
		],
	},

	// Compilation target. Possible values:
	// "web" Compile for usage in a browser-like environment (default)
	// "webworker" Compile as WebWorker
	// "node" Compile for usage in a node.js-like environment (use require to load chunks)
	// "async-node" Compile for usage in a node.js-like environment (use fs and vm to load chunks async)
	// "node-webkit" Compile for usage in webkit, uses jsonp chunk loading but also supports builtin node.js modules plus require(“nw.gui”) (experimental)
	// "atom" Compile for usage in electron (formerly known as atom-shell), supports require for modules necessary to run Electron.
	target: 'web',

	// Options affecting the output.
	// If you use any hashing ([hash] or [chunkhash]) make sure to have a
	// consistent ordering of modules. Use the OccurenceOrderPlugin or recordsPath.
	output: {
		// The output directory as absolute path (required).
		// [hash] is replaced by the hash of the compilation.
		path: cfg.client.output.path,

		// The output.path from the view of the Javascript / HTML page.
		// To teach webpack to make requests (for chunk loading or HMR) to the
		// webpack-dev-server you need to provide a full URL in the output.publicPath
		// option. ( https://webpack.github.io/docs/webpack-dev-server.html )
		// publicPath: url + cfg.client.output.publicPath,
		// BUT, webpack-hot-middleware apparently does not need this
		publicPath: cfg.client.output.publicPath,


		// The filename of the entry chunk as relative path inside the output.path directory.
		// [name] is replaced by the name of the chunk.
		// [hash] is replaced by the hash of the compilation.
		// [chunkhash] is replaced by the hash of the chunk.
		// ! You must not specify an absolute path here! Use the output.path option.
		filename: 'bridalapp-ui.js',

		// The filename of the Hot Update Chunks. They are inside the output.path directory.
		// [id] is replaced by the id of the chunk.
		// [hash] is replaced by the hash of the compilation. (The last hash stored in the records)
		// Default: "[id].[hash].hot-update.js"
		// Stijn: It seems these files are never actually written to disk...
		hotUpdateChunkFilename: 'hmr/[hash]/hot-update-chunk-[id].js',

		// The filename of the Hot Update Main File. It is inside the output.path directory.
		// [hash] is replaced by the hash of the compilation. (The last hash stored in the records)
		// Default: "[hash].hot-update.json"
		// Stijn: It seems these files are never actually written to disk...
		hotUpdateMainFilename: 'hmr/[hash]/hot-update.json',
	},

	plugins: [
		// HotModuleReplacementPlugin()
		// Enables Hot Module Replacement. (This requires records data if not in dev-server mode, recordsPath)
		// Generates Hot Update Chunks of each chunk in the records. It also enables the API and makes __webpack_hash__
		// available in the bundle.
		// ! Only add HotModuleReplacementPlugin here when you don't use cmd line option --hot
		// because it will break if we add both! see https://github.com/webpack/webpack/issues/1830
		new webpack.HotModuleReplacementPlugin(),

		// NoErrorsPlugin()
		// When there are errors while compiling this plugin skips the emitting phase
		// (and recording phase), so there are no assets emitted that include errors.
		// The emitted flag in the stats is false for all assets. If you are using the
		// CLI, the webpack process will not exit with an error code by enabling this plugin.
		// If you want webpack to "fail" when using the CLI, please check out the bail option.
		new webpack.NoErrorsPlugin(),
	],

	devtool: 'cheap-module-eval-source-map',
};

log.debug(chalk.styles.grey.open + 'development.client.config=', module.exports, chalk.styles.grey.close);
