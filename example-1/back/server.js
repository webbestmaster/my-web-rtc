var FsServer = require('fs-server');

var HTTP_PORT = process.env.PORT || 3000;
var WSS_PORT = parseInt(HTTP_PORT) + 1;

var fsServerConfig = {
    root: './front/', // path to front-end part of site
    port: HTTP_PORT // optional, recommended this, or do not use this field
    // page404: 'custom-404-page/index.html' // optional, path to custom 404 page
};

var fsServer =
    new FsServer(fsServerConfig) // create server with config
    .run(); // create server with config and run

var httpServer = fsServer.get(fsServer.KEYS.HTTP_SERVER);

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({server: httpServer, port: WSS_PORT});

var wssClientMap = {};

function wssOnMessage(inputStr) {

    var input = JSON.parse(inputStr);

    switch (input.inst) {

        case 'init':
            wssClientMap[input.id] = this; // this is ws
            break;

        case 'send':
            if (wssClientMap[input.peerId]) {
                wssClientMap[input.peerId].send(JSON.stringify(input.message));
            }
            break;

        default:
            console.error(input.inst, '- unknow instruction.')

    }
}

function wssOnConnection(ws) {
    ws.on('message', wssOnMessage);
}

wss.on('connection', wssOnConnection);
