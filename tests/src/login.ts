import * as puppeteer from "puppeteer";
import { config } from "../config";
import { usersCleaning } from "../scripts/db/userCleaning";

async function loginTest(type: "prod" | "dev") {

    const values: { username: any; password: any; }[] = [
        { username: "b", password: "123", },
        { username: "bazhan", password: "123123" },
        { username: 123, password: "3333333333333" },
        { username: "1111111111111111111111", password: "Kaliman23123$327r8dsN<Mn4b139df8hLJKH#$2wesfdxnmasdf2349ywrefshdkzlxc" },
        { username: { hellO: true }, password: { object: true } }
    ];

    const promises: Promise<void>[] = [];
    for(let i of values) {
        promises.push((async () => {
            const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: type == "prod" }); 
            const page = await browser.newPage();

            await page.setViewport({ width: 768, height: 768 });
            await page.goto("https://localhost:8100/login");
        
            await page.type("#username", i.username.toString());
            await page.type("#password", i.password.toString());

            await page.waitForSelector("#login-button", { visible: true, timeout: 5000 });
            await page.click("#login-button");

            if(type == "dev") {
                setTimeout(() => {
                    browser.close();
                }, 30000);
            }
        })());
    }

    try {
        await Promise.all(promises);
    } catch (e) {
        throw e;
    }
}

async function registrationTest(url: string, strict: boolean) {
    await usersCleaning(config.dbName, strict);

    const values = [
        { username: "account", password: "123123123", pass: true },
        { username: "", password: "Kaliman228", pass: false, },
        { username: "1", password: "fdsajkfjas;d", pass: false, },
        { username: "ACCOUNTWILLBEREMOVED", pass: true, password: "!@:#j32rk4wefl;dvxzknvml43ewtyufds-98zphijfdjP#@*RUWEpfjsdiklnvac,xvdsa;rj3-9ewsd" },
        { username: "wrongpassword", pass: false, password: "1" },
        { username: "wrong account name", pass: false, password: "123123" },
        { username: "BOTH!@#ARE!$@#@#WRONG", pass: false, password: "666" },
        { username: "TOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONGTOOLONG", pass: false, password: "finepassword123" },
    ];

    for(let i of values) {
        registerTry(url, i.username, i.password, i.pass);
    }

    registerPasswordsAreNotTheSame(url);
    registerTypeAndRemoveUsername(url);
}


async function registerTry(url: string, username: string, password: string, shouldPass: boolean) {
    try {
        const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: config.browser.headless });
        const page = await browser.newPage();

        
        try {
            await page.goto(url + "/user-create", { timeout: config.browser.timeout });
        } catch (e) {
            console.log("COULDN'T NAVIGATE");
            throw e;
        }

        try {
            await page.waitForSelector("#username", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#password", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#confirm-password", { timeout: config.browser.selectors.timeout });
        } catch (e) {
            console.log("SELECTORS NOT FOUND --------");
            throw e;
        }

        try {
            await page.type("#username", username);
            await page.type("#password", password);
            await page.type("#confirm-password", password);
        } catch (e) {
            console.log("COULDN'T TYPE");
            throw e;
        }

        try {
            await page.click("#next", { clickCount: 5 });
        } catch (e) {
            console.log("COULDN'T CLICK");
            throw e;
        }

        try {
            await page.waitForNavigation({ timeout: config.browser.timeout });
        } catch (e) {
            if(!shouldPass) {
                console.log("TEST PASSED -- ", username, password, shouldPass);
                browser.close();
                return;
            }
            throw e;
        }

        try {
            await page.waitForSelector("#email", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#code", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#send", { timeout: config.browser.selectors.timeout });
        } catch (e) {
            console.error("COULDN'T FIND SELECTORS 2");
            throw e;
        }

        try {
            await page.type("#email", "test@ctraba.com");
        } catch (e) {
            console.error("COULDN'T TYPE 2");
            throw e;
        }

        try {
            await page.focus("#send")
            await page.keyboard.type('\n');
        } catch (e) {
            console.error("COULDN'T CLICK SEND");
            throw e;
        }

        try {
            await page.waitForSelector(".sent", { timeout: config.browser.selectors.timeout });
        } catch (e) {
            console.log("NOT SENT???");
            throw e;
        }

        try {
            await page.waitForSelector('#code span:first-of-type input:not([disabled])', { timeout: config.browser.selectors.timeout });
            await page.type("#code span:first-of-type input", "111111");
        } catch (e) {
            console.error("COULDN'T TYPE CODE");
            throw e;
        }


        try {
            await page.waitForNavigation({ timeout: config.browser.timeout });

            console.log("TEST PASSED -- ", username, password, shouldPass);
            browser.close();
        } catch (e) {
            if(!shouldPass) {
                console.log("TEST PASSED -- ", username, password, shouldPass);
                browser.close();
            } else {
                console.log("!!! SOMETHING WENT WRONG -- ", username, password, shouldPass);
            }
        }
    } catch (e) {
        console.log("!!! ERROR THROWN -- ", username, password, shouldPass);
        throw e;
    }
}
async function registerPasswordsAreNotTheSame(url: string) {
    try {
        const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: config.browser.headless });
        const page = await browser.newPage();

        try {
            await page.goto(url + "/user-create", { timeout: config.browser.timeout });
        } catch (e) {
            console.error("COULDN'T NAVIGATE");
            throw e;
        }

        try {
            await page.waitForSelector("#username", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#password", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#confirm-password", { timeout: config.browser.selectors.timeout });
        } catch (e) {
            console.error("COULDN'T FIND SELECTORS");
            throw e;
        }

        try {
            await page.type("#username", "NICEUSERNAME");
            await page.type("#password", "password123@#!@");
            await page.type("#confirm-password", "NOT THE SAME");
        } catch (e) {
            console.error("COULDN'T TYPE");
            throw e;
        }

        try {
            await page.click("#next", { clickCount: 10 });
        } catch (e) {
            console.log("COULDN'T CLICK");
            throw e;
        }

        try {
            await page.waitForNavigation({ timeout: config.browser.timeout });

            console.log("!!! TEST FAILED registerPasswordsAreNotTheSame");
        } catch (e) {
            console.log("TEST PASSED registerPasswordsAreNotTheSame");
            await browser.close();
        }


    } catch (e) {
        console.log("!!! ERROR THROWN registerPasswordsAreNotTheSame");
        throw e;
    }
}
async function registerTypeAndRemoveUsername(url: string) {
    try {
        const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: config.browser.headless });
        const page = await browser.newPage();


        try {
            await page.goto(url + "/user-create", { timeout: config.browser.timeout });      
        } catch (e) {
            console.log("COULDN'T GOTO");
            throw e;
        }

        try {
            await page.waitForSelector("#username", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#password", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#confirm-password", { timeout: config.browser.selectors.timeout });
        } catch (e) {
            console.log("COULDN'T FIND SELECTORS");
            throw e;
        }

        try {
            await page.type("#password", "NORMALPASSWORD!!!!");
            await page.type("#confirm-password", "NORMALPASSWORD!!!!");
            await page.type("#username", "NORMALUSERNAME");
        } catch (e) {
            console.log("COULDN'T TYPE");
            throw e;
        }

        try {
            const input = await page.$("#username");
            if(!input) {
                console.log("NO INPUT");
                throw new Error("NO INPUT FOUND");
            }
            await input!.click({ clickCount: 3 });
            await input!.type(' ');
        } catch (e) {
            console.log("COULDN'T REMOVE TEXT");
            throw e;
        }

        try {
            await page.waitForSelector("#next", { visible: true });
            await page.click("#next", { delay: 123 });
        } catch (e) {
            console.log("COULDN'T CLICK");
            throw e;
        }

        try {
            await page.waitForNavigation({ timeout: config.browser.timeout });

            throw new Error("SHOULDN'T HAVE NAVIGATED");
        } catch (e) {
            console.log("TEST PASSED registerTypeAndRemoveUsername");
            await browser.close();
        }

    } catch (e) {
        console.log("!!! ERROR THROWN registerTypeAndRemoveUsername");
        throw e;
    }
}



export {
    loginTest,
    registrationTest,
}