import { getRandom } from "./random"

export function register(users: string[], password: string) {
    let uuid = null;
    while (uuid == null) {
        const uuid_tmp = getRandom(1000, 9999);
        if (!(uuid_tmp in users)) {
            uuid = uuid_tmp;
            break;
        }
    }
    return [ uuid, {[uuid]: {uuid: uuid, icon: "/image/marker.png", friend: [], location: [], password: password}} ]
}
