import { ObjectId } from "bson";
import { randomBytes, scryptSync } from "crypto";
import { stdout } from "process";

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

function id(str?: string) {
    if(str) {
        if(str.length != 24) {
            return null;
        }
        return new ObjectId(str);
    }
    return new ObjectId();
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getDate(d: Date) {
    const date = new Date(d);
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

function log(status: string, ...ar: any[]) {
    const date = new Date();
    let result = `[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}] -> ${status.toUpperCase()}        `;

    for(let i of ar) {
        result = result + " " + i;
    }
    
    result += "\n";
    stdout.write(result);
}

export {
    makePassword,
    compare,
    id,
    log,
    getDate
}