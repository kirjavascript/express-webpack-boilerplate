let WebSocket = require('ws');
let webpack = require('webpack');
let webpackConfig = require('../webpack.config.js')({dev:true});

webpackConfig.output.path = '/';

let compiler = webpack(webpackConfig);

function middlepack(app, server) {

    // init socket info

    let wss = new WebSocket.Server({server});

    function reload() {
        // send reload signal to active clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('RELOAD');
            }
        });
    }

    // check templates for changes

    require('chokidar').watch('web/templates/**/*', {ignored: /[\/\\]\./})
        .on('change', reload);

    // load middleware

    app.use(require('webpack-dev-middleware')(compiler, {
        stats: {colors: true},
        reporter: reporter(reload)
    }));

    // inject live reload code

    let inject = `
        <script>
            (new WebSocket('ws://' + location.host))
                .addEventListener('message', (e) => {
                    if (e.data == 'RELOAD') {
                        location.reload();
                    }
                });
        </script>
    `;

    app.use((req, res, next) => {
        let send = res.send;
        res.send = function (string) {
            let body = string instanceof Buffer ? string.toString() : string;
            body = body.replace(/<\/head>/, a => inject + a);
            send.call(this, body);
        }
        next();
    })

}

// alternative to .waitUntilValid();

function reporter(reload) {

    return ({ state, stats, options}) => {
        if(state) {
            let displayStats = (!options.quiet && options.stats !== false);
            if(displayStats &&
                !(stats.hasErrors() || stats.hasWarnings()) &&
                options.noInfo)
                displayStats = false;
            if(displayStats) {
                options.log(stats.toString(options.stats));
            }
            if(!options.noInfo && !options.quiet) {
                options.log('webpack: bundle is now VALID.');
                reload();
            }
        } else {
            options.log('webpack: bundle is now INVALID.');
        }
    }

}

module.exports = middlepack;
