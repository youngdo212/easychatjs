const path = require('path');

const config = {
  output: {
    filename: 'easychat.js',
    path: path.resolve(__dirname, 'public/sdk'),
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.entry = './src/dev.js';
  }

  if (argv.mode === 'production') {
    config.entry = './src/prod.js';
  }

  return config;
};
