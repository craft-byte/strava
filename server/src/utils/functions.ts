import { ObjectId } from "bson";
import { randomBytes, scryptSync } from "crypto";
import { months } from "../assets/consts";
import * as nodemailer from "nodemailer";

const Email = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ctraba.business@gmail.com',
        pass: 'tgphcddicttmsstf'
    }
});




function makePassword(password: string) {
    if(password.length < 8) {
        return null;
    }

    const salt = randomBytes(128).toString("hex");

    const hash = scryptSync(password, salt, 128).toString("hex");

    return `${salt}:${hash}`;
}
function compare(entered: string, saved: string) {
    const [salt, password] = saved.split(":");

    const ws = scryptSync(entered, salt, 128).toString("hex");

    if(ws === password) {
        return true;
    } else {
        return false;
    }
}
function id(str?: string | ObjectId): ObjectId {
    if(str) {
        if(typeof str == "object") {
            return str;
        }
        if(str.length != 24) {
            return null!;
        }
        return new ObjectId(str);
    }
    return new ObjectId();
}

function getDate(d: Date | number) {
    if(!d) {
        return "Invalid date";
    }
    const date = new Date(d);
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getHours()}:${date.getMinutes().toString().length == 1 ? "0" + date.getMinutes() : date.getMinutes()}`;
}


async function sendEmail(email: string, title: string, html: string) {
    if(!verifyEmail(email)) {
        return 0;
    }

    const options: any = {
        from: "Ctraba",
        to: email,
        subject: title,
        html,
    };

    try {
        await Email.sendMail(options);

        return 1;
    } catch (error) {
        console.error(error);
        return 0;
    }
    
}

function verifyEmail(email: string) {
    const format = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return format.test(email);
}

export {
    makePassword,
    compare,
    id,
    getDate,
    sendEmail
}