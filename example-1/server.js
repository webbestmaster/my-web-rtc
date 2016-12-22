var server = require('http').createServer(),
    express = require('express'),
    app = express(),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server, port: 8000 });

app.use(express.static(__dirname + '/static')); // client code goes in static directory

var clientMap = {};

wss.on('connection', function (ws) {
    ws.on('message', function (inputStr) {
        var input = JSON.parse(inputStr);
        if(input.inst == 'init') {
            clientMap[input.id] = ws;
        } else if(input.inst == 'send') {
            clientMap[input.peerId].send(JSON.stringify(input.message));
        }
    });
});

server.on('request', app);
server.listen(8081, '192.168.9.57', function () { console.log('Listening on ' + server.address().port) });