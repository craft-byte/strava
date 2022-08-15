import * as p from "puppeteer";
import { config } from "../../../config";

const [ _a, _b, username, password ] = process.argv;

register(config.url, username, password);


async function register(url: string, username = "account", password = "123123123") {    
    try {
        const browser = await p.launch({ ignoreHTTPSErrors: true, headless: false });
        const page = await browser.newPage();
        await page.setViewport({ width: 1900, height: 800 });

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
            await page.type("#username", username);
            await page.type("#password", password);
            await page.type("#confirm-password", password);
        } catch (e) {
            console.error("COULDN'T TYPE");
            throw e;
        }

        try {
            await page.waitForSelector(".username-message:not(:empty)", { timeout: 10000  });

            console.log("HEELO??");

            throw 1;
        } catch (e) {
            if(e == 1) {
                throw new Error(`ACCOUNT WITH USERNAME ${username} IS ALREADY REGISTERED`);
            }
        }

        try {
            await page.click("#next", { delay: 1000 });
        } catch (e) {
            console.error("COULDN'T CLICK");
            throw e;
        }

        try {
            await page.waitForNavigation({ timeout: config.browser.timeout });

            console.log("!!! ACCOUNT CREATED");
        } catch (e) {
            console.error("COULDN'T NAVIGATE 2");
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
            // await page.click("button#send", { delay: 123 });
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

            console.log("!!! EMAIL CONFIRMED");
        } catch (e) {
            console.error("COULDN'T CONFIRM EMAIL");
            throw e;
        }


    } catch (e) {
        console.log("COULDN'T FAST REGISTER");
        throw e;
    }
}