import * as p from "puppeteer";
import { config } from "../../config";

async function registerTests() {
    const browser = await p.launch({ ignoreHTTPSErrors: true, headless: config.headless });

    const values = [
        { username: "account", password: "123123123", name: "Myname Isbazhan", pass: true },
        { username: "longusernamelongusernamelongusernamelongusernamelongusernamelongusernamelongusername", password: "123123123", name: "Myname Isbazhan", pass: false },
        { username: "otherusername", password: "longpasswordlongpasswordlongpasswordlongpasswordlongpasswordlongpasswordlongpasswordlongpassword", name: "Myname Isbazhan", pass: false },
        { username: "account", password: "sameusername", name: "Myname Isbazhan", pass: false },
        { username: "noramlusername", password: "123123123", name: "Myname Isbazhan", email: "wrongemail.com", pass: false, },
        { username: "wrong username", password: "123123123", name: "Myname Isbazhan", pass: false, },
        { username: "wrongemail", password: "123123123", name: "Myname Isbazhan", email: "wrongemail@com", pass: false },
    ];

    for (const i of values) {
        try {
            await registerAndLogout(browser, i);
        } catch (e) {
            if(i.pass) {
                console.error("passed:", false);
                throw e;
            } else {
                console.log("passed:", true, i.username, i.password, i.name, i.email || "");
            }
        }
    }
}

async function registerAndLogout(browser: p.Browser, { username, password, email, name, pass }: {
    username: string;
    password: string;
    name: string;
    pass: boolean;
    email?: string;
}) {
    
}
