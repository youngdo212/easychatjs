const path = require('path');

module.exports = {
  entry: './src/easychat.js',
  output: {
    filename: 'easychat.js',
    path: path.resolve(__dirname, 'public/sdk'),
    library: 'Easychat',
    libraryExport: 'default',
  },
};
