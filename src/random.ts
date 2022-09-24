export function getRandom(min: number, max: number) {
    const random = Math.ceil( Math.random() * (max + 1 - min) ) + min;
    return random - 1;
}
