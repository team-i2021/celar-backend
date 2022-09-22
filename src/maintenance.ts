import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { config } from 'dotenv';

config();

console.log('Celar Backend Service - Maintenance Mode')

const WebSocketPort = Number(process.env.WSPORT);
const HTTPPort = Number(process.env.HTTPPORT);

const app = express();
const wss = new WebSocketServer({ port: WebSocketPort });


wss.on('connection', function connection(ws: WebSocket) {
    ws.send(JSON.stringify({action: "ERR", content: "UnderTheMaintenance"}));
});

app.get('/', function (req, res) {
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(418).send(JSON.stringify({ title: "Celar Backend Service", repository: "celar-team/celar-backend", status: "Maintenance", teapod: "CoffeeNotAllowed" }));
});

console.log('Server starting...');
console.log('HTTP: %d\nWebSocket: %d', HTTPPort, WebSocketPort);
app.listen(HTTPPort);
