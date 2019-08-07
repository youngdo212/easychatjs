const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'messenger.js',
    path: path.resolve(__dirname, 'public/sdk'),
  },
  // optimization: {
	// 	minimize: false
	// },
}