import { User } from ".";
import { getRandom } from "./random"

export function register(users: {[uid: string]: User}, password: string): [string, User] {
    let uid = null;
    while (uid === null) {
        const uid_tmp = String(getRandom(100000, 999999));
        if (users[uid_tmp] === undefined && users[uid_tmp] !== null) {
            uid = uid_tmp;
            break;
        }
    }
    return [ uid, {uid: uid, icon: "/image/default.png", username: "", friend: [], friend_send: [], friend_recv: [], location: [], password: password} ]
}
