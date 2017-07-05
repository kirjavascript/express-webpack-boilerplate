const WebSocket = require('ws');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config.js')({dev:true});

const { Screen, Box, BigText, FileManager, Text, Button, Listbar } = require('blessed');
const webpackBox = require('./webpack-box');
const consoleBox = require('./console-box');

// inject console earlier

module.exports = function(app, server) {

    webpackConfig.output.path = '/';

    const wss = new WebSocket.Server({server});

    const compiler = webpack(webpackConfig);

    // create screen

    const screen = Screen({
        fastCSR: true,
        dockBorders: true,
    });

    function rip() {
        screen.destroy();
        server.close(() => {
            process.exit(0);
        });
    }

    screen.key(['escape', 'q', 'C-c'], rip);

    // browser reload
    function reload() {
        // send reload signal to active clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('RELOAD');
            }
        });
    }

    // check templates for changes

    require('chokidar')
        .watch('web/templates/**/*', {ignored: /[\/\\]\./})
        .on('change', reload);

    // load webpack middleware

    app.use(require('webpack-dev-middleware')(compiler, {
        stats: {colors: true},
        reporter: webpackBox(screen, reload),
    }));

    // draw UI
    consoleBox(screen);

    new Text({
        left: 1,
        top: 0,
        content: `{bold}${process.env.npm_package_name}{/}`,
        parent: screen,
        tags: true,
    });

    new Text({
        right: 1,
        top: 0,
        content: `{bold}${process.env.npm_package_version}{/}`,
        parent: screen,
        tags: true,
    });

    screen.render();

}
