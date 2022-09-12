import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { config } from 'dotenv';

import { register } from "./account";

config();

const VERSION = "v0.9.1";

console.log('Celar Backend Service');
console.log(`Version ${VERSION}`);

console.log("Application initialization starting...");

const WebSocketPort = Number(process.env.WSPORT);
const HTTPPort = Number(process.env.HTTPPORT);

const app = express();

const wss = new WebSocketServer({ port: WebSocketPort });

console.log("Application initialization complete.");

export interface User {
    uuid: number;
    friends: number[];
    location: number[];
    password: string;
}

let users: User[] = []

const cData = (action: string, content: any): string => {
    return JSON.stringify({ action: action, content: content });
}

const searchUser = (uuid: number): User | undefined => {
    const user: User | undefined = users.find(item => item.uuid === uuid)
    return user
}

const hasFriend = (source: number, target: number): boolean => {
    const user = searchUser(source);
    if (user === undefined) { return false; }
    const result = user.friends.find(item => item === target);
    return (result !== undefined);
}

wss.on('connection', function connection(ws: WebSocket) {
    ws.on('message', function incoming(message: WebSocket.RawData) {
        const message_content = message.toString()
        try
        {
            const mes = JSON.parse(message_content)
            if (mes.command == "GET")
            {
                const user = searchUser(mes.user_id);
                if ((user === undefined) || (!hasFriend(mes.uuid, user.uuid)))
                {
                    ws.send(cData("ERR", "User not found."));
                }
                else
                {
                    ws.send(cData("GET", users[user.uuid].location));
                }
            }
            else if (mes.command == "POST")
            {
                users[mes.uuid].location = mes.location
                ws.send(cData("OK", "POST"));
            }
            else if (mes.command == "REGISTER")
            {
                const regi_data = register(Object.keys(users), mes.password);
                Object.assign(users, regi_data[1]);
                ws.send(cData("REGISTER", regi_data[0]));
            }
            else if (mes.command == "FRIEND")
            {
                if (mes.action == "ADD")
                {
                    users[mes.uuid].friends.push(mes.user_id);
                    ws.send(cData("OK", "FRIEND_ADD"));
                }
                else if (mes.action == "DEL")
                {
                    const friends = users[mes.uuid].friends.filter(item => item !== mes.user_id);
                    users[mes.uuid].friends = friends;
                    ws.send(cData("OK", "FRIEND_DEL"));
                }
                else
                {
                    ws.send("ERR: Argument missing of not found.");
                }
            }
            else if (mes.command == "FETCH")
            {
		let locations: {[uuid: string]: number[]} = {};
                for (const uuid of users[mes.uuid].friends)
		{
            const user = searchUser(uuid);
            if (user === undefined) { continue; }
            locations[String(uuid)] = user?.location;
		}
                ws.send(cData("FETCH", locations));
            }
            else
            {
                console.info(mes)
                ws.send(cData("RECEIVE_JSON", mes));
            }
        }
        catch (e)
        {
            ws.send(cData("RECEIVE_TXT", message));
            console.log(e);
        }
    });
    ws.send(cData("CONNECTION_ACCEPT", "CONNECTION"));
});

app.get('/', function (req, res) {
    res.set("Content-Type", "text/html");
    res.status(200).send(`Celar Backend Service.<br>HTTP: ${HTTPPort}<br>WebSocket: ${WebSocketPort}`);
});

console.log('Server starting...');
console.log('HTTP: %d\nWebSocket: %d', HTTPPort, WebSocketPort);
app.listen(HTTPPort);
