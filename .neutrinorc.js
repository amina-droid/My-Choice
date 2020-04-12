const web = require('@neutrinojs/web');
const path = require('path');

module.exports = {
  use: [web({
      html: {
          lang: 'ru',
          title: 'Мой выбор | Онлайн игра',
          template: path.resolve(__dirname, './src/templates/index.pug')
      },
      style: {
          test: /\.(css|sass|scss)$/,
          loaders: [{
            loader: 'sass-loader',
            useId: 'sass',
          }]
      },
      babel: {
        plugins: ['@babel/plugin-proposal-class-properties']
      }
  }),

  (neutrino) => {
    const rule = neutrino.config.module.rule('pug');
    rule.test(neutrino.regexFromExtensions(['pug']));
    rule.use('pug').loader('pug-loader');
  },
],
};