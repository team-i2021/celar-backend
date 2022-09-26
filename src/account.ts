import { User } from ".";

export function duplicate(users: {[uid: string]: User}, uid: string) {
    return uid in users
}

export function register(users: {[uid: string]: User}, uid: string, password: string): [string, User] {
    return [ uid, {uid: uid, icon: "/image/default.png", username: uid, friend: [], friend_send: [], friend_recv: [], location: [], password: password} ]
}
