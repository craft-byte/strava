import * as puppeteer from "puppeteer";
import { config } from "../config";
import { usersCleaning } from "../scripts/db/userCleaning";

export async function register() {
    const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: false });

    const page = await browser.newPage();

    await page.goto(`https://localhost:8100/registration`);

    await page.type("#email-input", "bazhantt@gmail.com");
    await page.type("#first-name-input", "Bazhan");
    await page.type("#last-name-input", "Nahnybida");
    await page.type("#password-input", "123123123");


    await page.click("#submit");


    try {
        await page.waitForNavigation({ timeout: 2000 });
        
    } catch (e) {
        const msg = await page.$(".email-message");

        if(msg) {
            const input = await page.$('#email-input');
            await input!.click({ clickCount: 3 })
            await input!.type("bazhanwkoleploxo@gmail.com");
        }

    }

    await page.click("#submit");

}