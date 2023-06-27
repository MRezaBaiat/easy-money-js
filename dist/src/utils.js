"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reversePair = void 0;
function reversePair(pair) {
    if (pair.split('/').length !== 2) {
        throw new Error(`pair '${pair}' is in incorrect format`);
    }
    const arr = pair.split('/');
    if (!arr[0] || !arr[1]) {
        throw new Error(`pair '${pair}' is in incorrect format`);
    }
    return `${arr[1]}/${arr[0]}`;
}
exports.reversePair = reversePair;
