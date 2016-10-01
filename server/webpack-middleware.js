let webpack = require('webpack');
let webpackConfig = require('../webpack.config.js');
webpackConfig.output.path = '/';
let compiler = webpack(webpackConfig);

function middlepack(app) {

    app.use(require('webpack-dev-middleware')(compiler, {
        stats: {colors: true}
    }))

}

module.exports = middlepack;