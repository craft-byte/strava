import { ObjectId } from "bson";
import { randomBytes, scryptSync } from "crypto";
import { stdout } from "process";
import { Email } from "..";
import { months } from "../assets/consts";
import { updateUser } from "./users";

const logger = {
    info: true,
    check: false,
    login: false
}

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
function id(str?: string | ObjectId) {
    if(str) {
        if(typeof str == "object") {
            return str;
        }
        if(str.length != 24) {
            return null;
        }
        return new ObjectId(str);
    }
    return new ObjectId();
}
function getDate(d: Date) {
    if(!d) {
        return "Invalid date";
    }
    const date = new Date(d);
    return `${date.getDate()} ${months[date.getMonth()]}`;
}
function log(status: string, ...ar: (string | ObjectId | number | boolean | undefined)[]) {
    if(status.toLowerCase() == "info" && !logger.info) {
        return;
    }
    if(status.toLocaleLowerCase() == "checking" && !logger.check) {
        return;
    }
    
    
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    let result = `[${hours.toString().length == 1 ? `0${hours}` : hours}:${minutes.toString().length == 1 ? `0${minutes}` : minutes}:${seconds.toString().length == 1 ? `0${seconds}` : seconds}]`;
    
    result = result + (" > " + status.toUpperCase());

    for(let i of ar) {
        if(i) {
            result = result + " " + i.toString().trim();
        }
    }
    
    result += "\n";
    stdout.write(result);
}

async function sendEmail(email: string, type: "verification", user: string) {
    if(!verifyEmail(email)) {
        return { error: "email" };
    }

    const options: any = {
        from: "Ctraba",
        to: email,
    };

    if(type == "verification") {
        const code = Math.floor(Math.random() * 1000000);
        options.subject = "Email Address Verification";
        options.html =
        `
            <h1>Hello from Ctraba!</h1>
            <p>To verify your email address enter this code.</p>
            <h2>${code}</h2>
        `
        const update = await updateUser(user, { $set: { emailVerificationCode: code.toString(), emailVerify: email } });

        if(update.modifiedCount > 0) {
            log("success", "settings email to an user");
        } else {
            log("failed", "setting email to an user");
        }
    }

    try {
        const result = await Email.sendMail(options);
        log('success', "accepted:", result.accepted.toString(), "response:", result.response, "message id:", result.messageId);
        return { error: "none" };
    } catch (err) {
        console.error(err);
        throw new Error("sending email");
    }
}

function verifyEmail(email: string) {
    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return format.test(email);
}

const get = {

}

export {
    makePassword,
    compare,
    id,
    log,
    getDate,
    sendEmail
}