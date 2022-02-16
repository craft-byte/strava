import { ObjectId } from "bson";
import { randomBytes, scryptSync } from "crypto";

function makePassword(password: string) {
    const salt = randomBytes(32).toString("hex");

    const hash = scryptSync(password, salt, 64).toString("hex");

    return `${salt}:${hash}`;
}

function compare(currentPassword: string, oldPassword: string) {
    const [salt, password] = oldPassword.split(":");

    const ws = scryptSync(currentPassword, salt, 64).toString("hex");

    if(ws === password) {
        return true;
    } else {
        return false;
    }
}

function id(str: string) {
    if(str.length != 24) {
        return null;
    }
    return new ObjectId(str);
}

export {
    makePassword,
    compare,
    id
}