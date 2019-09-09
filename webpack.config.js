const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: 'messenger.js',
    path: path.resolve(__dirname, 'public/sdk'),
  },
  watch: true,
};
