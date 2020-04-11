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
          loaders: ['sass-loader']
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