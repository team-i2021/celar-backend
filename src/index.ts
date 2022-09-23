// celar-team/celar-backend
import express from 'express';
import WebSocket, { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import fs, { promises as fsp } from 'fs';
import multer from "multer";
import path from "path";
import cors from "cors";

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

app.use(cors({ origin: true }));

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
    uid: number;
    icon: string;
    friend: number[]; // friend uids list
    friend_send: number[];
    friend_recv: number[];
    location: number[]; // [latitude, longitude, speed(m/s), time]
    password: string;
}

export interface SocketData {
    command: string; // コマンドを表したもの
    uid: number; // 自身のユーザーID
    password: string; // 自身のパスワード（hashed）
    user_id: number; // 対象のユーザーID
    location: number[]; // [latitude, longitude, speed(m/s), time]
    action: string; // FRIEND操作などで使われる
}

let users: User[] = []

const cData = (action: string, content: any): string => {
    return JSON.stringify({ action: action, content: content });
}

const searchUser = (uid: number): User | undefined => {
    const user: User | undefined = users.find(item => item.uid === uid)
    return user
}

const hasFriend = (source: number, target: number): boolean => {
    const user = users[source]
    if (user === undefined) { return false; }
    const result = user.friend.find(item => item === target);
    return (result !== undefined);
}

const auth = (data: SocketData) => {
    if (!("uid" in data) || !("password" in data)) {
        throw "BadRequest";
    }
    const uid = data.uid;
    const password = data.password;
    if (users[uid] === undefined)
    {
        throw "Forbidden";
    }
    else if (users[uid] !== undefined && users[uid].password === password) {
        return;
    }
    else {
        throw "Forbidden";
    }
}

const dataread = () => {
    if (fs.existsSync(FILE_NAME)) {
        users = JSON.parse(fs.readFileSync(FILE_NAME, "utf-8"))
    }
    else {
        datawrite();
    }
}

const datawrite = async () => {
    await fsp.writeFile(FILE_NAME, JSON.stringify(users));
}

wss.on('connection', function connection(ws: WebSocket) {
    ws.on('message', function incoming(message: WebSocket.RawData) {
        const message_content = message.toString()
        try {
            const mes: SocketData = JSON.parse(message_content);
            console.info(mes);

            if (mes.command == "GET") {
                auth(mes);
                const user = users[mes.user_id];
                if (user === undefined) {
                    ws.send(cData("ERR", "UserNotFound"));
                } else if (!hasFriend(mes.uid, user?.uid)) {
                    ws.send(cData("ERR", "NotAccessable"));
                } else {
                    ws.send(cData("GET", users[user.uid].location));
                }
            }

            else if (mes.command == "POST") {
                auth(mes)
                users[mes.uid].location = mes.location
                datawrite();
                ws.send(cData("OK", "POST"));
            }

            else if (mes.command == "REGISTER") {
                const regi_data = register(Object.keys(users), mes.password);
                Object.assign(users, regi_data[1]);
                datawrite();
                ws.send(cData("REGISTER", { uid: regi_data[0], password: mes.password }));
            }

            else if (mes.command == "FRIEND") {
                auth(mes)

                if (mes.action == "ADD") {
                    users[mes.uid].friend_send.push(Number(mes.user_id));
                    users[mes.user_id].friend_recv.push(Number(mes.uid));
                    datawrite();
                    ws.send(cData("OK", "FRIEND_ADD"));
                }

                else if (mes.action == "DEL") {
                    if (users[mes.user_id] === null || users[mes.user_id] === undefined) {
                        ws.send(cData("ERR", "UserNotFound"));
                    }
                    else {
                        users[mes.uid].friend = users[mes.uid].friend.filter(item => item !== mes.user_id);
                        users[mes.user_id].friend = users[mes.user_id].friend.filter(item => item !== mes.uid);
                        datawrite();
                        ws.send(cData("OK", "DEL_FRIEND"));
                    }
                }

                else if (mes.action == "GET") {
                    ws.send(cData("FRIENDS", users[mes.uid].friend));
                }

                else if (mes.action == "ALLOW") {
                    const user = users[mes.uid]
                    if (user.friend_recv.find(uid => uid === mes.user_id) !== undefined) {
                        users[mes.uid].friend_recv = user.friend_recv.filter(item => item !== mes.user_id)
                        users[mes.uid].friend.push(mes.user_id);
                        users[mes.user_id].friend_send = users[mes.user_id].friend_send.filter(item => item !== mes.uid)
                        users[mes.user_id].friend.push(mes.uid);
                        ws.send(cData("OK", "FRIEND_ALLOW"));
                    }
                    else
                    {
                        ws.send(cData("ERR", "RequestNotFound"));
                    }
                }

                else if (mes.action == "DENY") {
                    const user = users[mes.uid]
                    if (user.friend_recv.find(uid => uid === mes.user_id) !== undefined) {
                        users[mes.uid].friend_recv = user.friend_recv.filter(item => item !== mes.user_id)
                        users[mes.user_id].friend_send = users[mes.user_id].friend_send.filter(item => item !== mes.uid)
                        ws.send(cData("OK", "FRIEND_DENY"));
                    }
                    else
                    {
                        ws.send(cData("ERR", "RequestNotFound"));
                    }
                }

                else {
                    ws.send(cData("ERR", "UnknownArgument"));
                }
            }

            else if (mes.command == "FETCH") {
                auth(mes)
                let locations: { [uid: string]: number[] } = {};
                for (const uid of users[mes.uid].friend) {
                    const user = users[uid];
                    if (user === undefined) { continue; }
                    locations[String(uid)] = user.location;
                }
                ws.send(cData("FETCH", locations));
            }

            else if (mes.command == "INIT") {
                auth(mes)
                const user = users[mes.uid];
                const friend_data: { icon: string, uid: number, location: number[] }[] = [{ icon: user.icon, uid: user.uid, location: user.location }];
                for (const u of user.friend) {
                    friend_data.push({ icon: users[u].icon, uid: u, location: users[u].location });
                }
                const requests: {icon: string, uid: number}[] = [];
                for (const r of user.friend_recv) {
                    requests.push({ icon: users[r].icon, uid: r });
                }
                ws.send(cData("INIT", { user: user, friends: friend_data, requests: requests }));
            }

            else if (mes.command == "CHECK") {
                console.info(users.filter(item => item !== null));
                console.info(wss.clients);
                ws.send(cData("OK", "CHECK"));
            }

            else {
                console.info(mes)
                ws.send(cData("RECEIVE_JSON", mes));
            }
        }
        catch (e) {
            if (e === "BadRequst")
            {
                ws.send(cData("ERR", "BadRequest"));
            }
            else if (e === "Forbidden")
            {
                ws.send(cData("ERR", "Forbidden"));
            }
            else
            {
                ws.send(cData("RECEIVE_TXT", { content: message, event: e }));
                console.log(e);
            }
        }
    });
    ws.send(cData("CONNECTION_ACCEPT", "CONNECTION"));
});

app.get('/', function (req, res) {
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200).send(JSON.stringify({ title: "Celar Backend Service", repository: "celar-team/celar-backend", status: "Normal" }));
});

app.get('/upload_icon', (req, res) => {
    res.sendFile(path.join(__dirname, "res/upload_icon.html"));
});

const upload = multer()
app.post('/upload_icon', upload.single('iconfile'), (req, res) => {
    res.header("Content-Type", "application/json;charset=utf-8");
    if (req.file === undefined) {
        res.status(400).send(JSON.stringify({ status: "Failed", exception: "File not found" }));
        return;
    }
    else if (req.body.uid === undefined || users[req.body.uid] === null) {
        res.status(400).send(JSON.stringify({ status: "Failed", exception: "UUID not found" }));
        return
    }
    const filename = `/image/${Date.now()}-${generateUuid()}-${req.file.originalname}`;
    fsp.writeFile(path.join(String(process.env.FRONTEND_PATH), filename), req.file.buffer);
    /// console.log(users[req.body.uid].icon, path.join(String(process.env.FRONTEND_PATH), filename));
    /// console.log(users[req.body.uid].icon !== "/image/default.png", fs.existsSync(path.join(String(process.env.FRONTEND_PATH), users[req.body.uid].icon)));
    if (users[req.body.uid].icon !== "/image/default.png" && fs.existsSync(path.join(String(process.env.FRONTEND_PATH), users[req.body.uid].icon))) {
        fsp.unlink(path.join(String(process.env.FRONTEND_PATH), users[req.body.uid].icon));
    }
    users[req.body.uid].icon = filename;
    res.status(200).send(JSON.stringify({ "Status": "Success", "FileName": filename }));
});

console.log("Reading database...");
dataread();
console.info(users.filter(item => item !== null));
console.log("Finished reading database.");

console.log('Server starting...');
console.log('HTTP: %d\nWebSocket: %d', HTTPPort, WebSocketPort);
app.listen(HTTPPort);
