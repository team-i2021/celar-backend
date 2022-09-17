import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import fs, { promises as fsp } from 'fs';
import multer from "multer";
import path from "path";

import { register } from "./account";
import { generateUuid } from "./random";

config();

const FILE_NAME = "data.db"; // DBを使うまでの...

console.log('Celar Backend Service')

console.log("Application initialization starting...");

const WebSocketPort = Number(process.env.WSPORT);
const HTTPPort = Number(process.env.HTTPPORT);

const app = express();

const wss = new WebSocketServer({ port: WebSocketPort });

// const icon_storage = multer.diskStorage({
//     destination(req, file, callback) {
//         callback(null, path.resolve(__dirname, String(process.env.FRONTEND_PATH)));
//     },
//     filename(req, file, callback) {
//         callback(null, `${Date.now()}-${generateUuid()}-${file.originalname}`);
//     },
// });
//
// const upload = multer({
//     icon_storage,
//     fileFilter(req, file, callback) {
//         console.log(file.mimetype)
//         if (["image/png", "image/jpeg"].includes(file.mimetype)) {
//             callback(null, true);
//             return;
//         }
//         callback(new TypeError("Invalid File Type"));
//     },
// });

// const upload = multer({ storage: multer.diskStorage() })

console.log("Application initialization complete.");

export interface User {
    uuid: number;
    icon: string;
    friend: number[]; // friend uuids list
    location: number[]; // [latitude, longitude, speed(m/s), time]
    password: string;
}

export interface SocketData {
    command: string;
    uuid: number;
    user_id: number;
    location: number[];
    password: string;
    action: string;
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
    const user = users[source]
    if (user === undefined) { return false; }
    const result = user.friend.find(item => item === target);
    return (result !== undefined);
}

const dataread = () => {
    if (fs.existsSync(FILE_NAME))
    {
        users = JSON.parse(fs.readFileSync(FILE_NAME, "utf-8"))
    }
    else
    {
        datawrite();
    }
}

const datawrite = async () => {
    await fsp.writeFile(FILE_NAME, JSON.stringify(users));
}

wss.on('connection', function connection(ws: WebSocket) {
    ws.on('message', function incoming(message: WebSocket.RawData) {
        const message_content = message.toString()
        try
        {
            const mes: SocketData = JSON.parse(message_content)
            console.info(mes);
            if (mes.command == "GET")
            {
                const user = users[mes.user_id];
                if ((user === undefined) || (!hasFriend(mes.uuid, user?.uuid)))
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
                datawrite();
                ws.send(cData("OK", "POST"));
            }
            else if (mes.command == "REGISTER")
            {
                const regi_data = register(Object.keys(users), mes.password);
                Object.assign(users, regi_data[1]);
                datawrite();
                ws.send(cData("REGISTER", {uuid: regi_data[0], password: mes.password}));
            }
            else if (mes.command == "FRIEND")
            {
                if (mes.action == "ADD")
                {
                    users[mes.uuid].friend.push(Number(mes.user_id));
                    datawrite();
                    ws.send(cData("OK", "FRIEND_ADD"));
                }
                else if (mes.action == "DEL")
                {
                    const friend = users[mes.uuid].friend.filter(item => item !== mes.user_id);
                    users[mes.uuid].friend = friend;
                    datawrite();
                    ws.send(cData("OK", "DEL_FRIEND"));
                }
                else if (mes.action == "GET")
                {
                    ws.send(cData("FRIENDS", users[mes.uuid].friend));
                }
                else
                {
                    ws.send(cData("ERR", "Unknown command argument."));
                }
            }
            else if (mes.command == "FETCH")
            {
                let locations: {[uuid: string]: number[]} = {};
                for (const uuid of users[mes.uuid].friend)
                {
                    const user = users[uuid];
                    if (user === undefined) { continue; }
                    locations[String(uuid)] = user.location;
                }
                ws.send(cData("FETCH", locations));
            }
            else if (mes.command == "INIT")
            {
                const user = users[mes.uuid];
                const friend_data: {icon: string, uuid: number, location: number[]}[] = [{icon: user.icon, uuid: user.uuid, location: user.location}];
                for (const u of user.friend)
                {
                    friend_data.push({icon: users[u].icon, uuid: u, location: users[u].location});
                }
                ws.send(cData("INIT", {user: user, friends: friend_data}));
            }
            else if (mes.command == "CHECK")
            {
                console.info(users.filter(item => item !== null));
                ws.send(cData("OK", "CHECK"));
            }
            else
            {
                console.info(mes)
                ws.send(cData("RECEIVE_JSON", mes));
            }
        }
        catch (e)
        {
            ws.send(cData("RECEIVE_TXT", {content: message, event: e}));
            console.log(e);
        }
    });
    ws.send(cData("CONNECTION_ACCEPT", "CONNECTION"));
});

app.get('/', function (req, res) {
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200).send(JSON.stringify({http_port: HTTPPort, ws_port: WebSocketPort}));
});

app.get('/upload_icon', (req, res) => {
    res.sendFile(path.join(__dirname, "res/upload.html"));
});

app.post('/upload_icon', multer().single('file'), async (req, res) => {
    res.header("Content-Type", "application/json;charset=utf-8");
    const file = req.file;
    const uuid = req.body.uuid;
    if (file === undefined)
    {
        res.status(400).send(JSON.stringify({"Status":"Failed", "Exception": "File not found."}));
    }
    else
    {
        const filename = `/image/${Date.now()}-${generateUuid()}-${file?.originalname}`;
        await fsp.writeFile(path.resolve(String(process.env.FRONTEND_PATH), filename), file?.buffer);
        users[uuid].icon = filename;
        res.status(200).send(JSON.stringify({"Status":"Success","FileName": filename}));
    }
});

console.log("Reading database...");
dataread();
console.info(users.filter(item => item !== null));
console.log("Finished reading database.");

console.log('Server starting...');
console.log('HTTP: %d\nWebSocket: %d', HTTPPort, WebSocketPort);
app.listen(HTTPPort);
