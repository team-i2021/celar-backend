import { User } from ".";
import { getRandom } from "./random"

export function register(users: string[], password: string): [number, {[uid: number]:  User}] {
    let uid = null;
    while (uid === null) {
        const uid_tmp = getRandom(1000, 9999);
        if (users[uid_tmp] === undefined && users[uid_tmp] !== null) {
            uid = uid_tmp;
            break;
        }
    }
    return [ uid, {[uid]: {uid: uid, icon: "/image/default.png", friend: [], friend_send: [], friend_recv: [], location: [], password: password}} ]
}
