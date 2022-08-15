import * as p from "puppeteer";
import { config } from "../../../config";
import { removeUserByUsername } from "../../db/user";
import { click, register, sleep, type, wait } from "../../utils/functions";



const clientUrl = "https://localhost:8101";
const ctrabaUrl = "https://localhost:8100"

execute();

async function execute() {
    await twoUsersEnterRestaurantAndScanSameTablesQRCodeAndStop(false);
    // await twoUsersEnterRestaurantAndOneOfThemOrderDishesAndThenOtherTriesToScanTheFirstUsersTablesQRCode();
}


/*
 *  creates 2 accounts
 *  redirects to map page
 *  choses first restaurant
 *  and both users scan the same table's url
*/

async function twoUsersEnterRestaurantAndScanSameTablesQRCodeAndStop(close: boolean) {
    try {

        const browser1 = await p.launch({ ignoreHTTPSErrors: true, headless: false, args: ['--incognito'] });
        const browser2 = await p.launch({ ignoreHTTPSErrors: true, headless: false, args: ['--incognito'] });

        const { browser1page1, browser2page1 } = await getReady(browser1, browser2);


        try {
            await browser1page1.goto(`${clientUrl}/tabs/map`);
            await browser2page1.goto(`${clientUrl}/tabs/map`);
        } catch (e) {
            console.error("COULD'T NAVIGATE TO tabs/map");
            throw e;
        }

        // click on the first restaurant in the list     tabs/map

        await browser1page1.waitForSelector(".app .list .one:last-of-type", { visible: true, timeout: config.browser.selectors.timeout });
        await browser2page1.waitForSelector(".app .list .one:last-of-type", { visible: true, timeout: config.browser.selectors.timeout });

        await browser1page1.click(".app .list .one:last-of-type");
        await browser2page1.click(".app .list .one:last-of-type");

        // browsers choose table 1

        await browser1page1.waitForSelector("ion-modal .list .button:first-of-type", { timeout: config.browser.selectors.timeout });
        await browser2page1.waitForSelector("ion-modal .list .button:first-of-type", { timeout: config.browser.selectors.timeout });

        await browser1page1.click("ion-modal .list .button:first-of-type");

        await sleep(1000);

        await browser2page1.click("ion-modal .list .button:first-of-type");

        await wait(browser2page1, "ion-modal#ask-to-change")

        await click(browser2page1, "ion-modal#ask-to-change button.orange-button");

        if(close) {
            await browser1.close();
            await browser2.close();
        }

        return;
    } catch (e) {
        console.error(e);
        throw new Error("twoUsersEnterRestaurantAndScanSameTablesQRCode()");
    }
}
async function twoUsersEnterRestaurantAndOneOfThemOrderDishesAndThenOtherTriesToScanTheFirstUsersTablesQRCode() {
    try {

        const browser1 = await p.launch({ ignoreHTTPSErrors: true, headless: false, args: ['--incognito'] });
        const browser2 = await p.launch({ ignoreHTTPSErrors: true, headless: false, args: ['--incognito'] });

        const { browser1page1, browser2page1 } = await getReady(browser1, browser2);

        await createDish(
            browser1page1,
            "Potato",
            12,
            12,
            "good description",
            "C:/Users/SuperUser/Documents/sort/photo/potato.jpg",
            "e",
            ["b","l","d"],
            ["v"],
        );

        // await browser1page1.click("");

        // await browser1page1.click("ion-modal .list .button:first-of-type");
        // await browser1page1.click();

        return;
        await sleep(1000);

        await browser2page1.click("ion-modal .list .button:first-of-type");

        await wait(browser2page1, "ion-modal#ask-to-change")

        await click(browser2page1, "ion-modal#ask-to-change button.orange-button");


    } catch (e) {
        console.error(e);
        throw new Error("twoUsersEnterRestaurantAndOneOfThemOrderDishesAndThenOtherTriesToScanTheFirstUsersTablesQRCode()");
    }
}

async function getReady(browser1: p.Browser, browser2: p.Browser) {
    try {
        await removeUserByUsername("accountForTwoUsers1");
        await removeUserByUsername("accountForTwoUsers2");


        const [browser1page1, browser2page1] = await Promise.all([
            register((await browser1.pages())[0] || browser1.newPage(), "accountForTwoUsers1", "123123123"),
            register((await browser2.pages())[0] || browser2.newPage(), "accountForTwoUsers2", "123123123"),
        ]);

        browser1page1.setViewport({ width: 1600, height: 800 });
        browser2page1.setViewport({ width: 1600, height: 800 });
        

        await createRestaurant(browser1page1, "THE NEW RESTAURANT");
        await createDish(browser1page1, "Potato", 12, 12, "Very good potato", "C:/Users/SuperUser/Documents/sort/photo/potato.jpg", "e", ["b", "l", "d"], ["v"]);

        return { browser1page1, browser2page1 };
    } catch (e) {
        console.error("at getReady()");
        throw e
    }
}



async function createDish(
    page: p.Page,
    name: string,
    price: number,
    time: number,
    description: string,
    image: string,
    general: string,
    categories: string[],
    strict: string[]
) {
    try {
        await page.goto(`${ctrabaUrl}/user/info`);
        await wait(page, ".list .app:first-of-type .button button");
        await click(page, ".list .app:first-of-type .button button");
        await page.waitForNavigation({ timeout: config.browser.timeout });
        await wait(page, "#add-dish");
        await click(page, "#add-dish");
        await page.waitForNavigation({ timeout: config.browser.timeout });
        await wait(page, "input#image-input");
        if(image) {
            const elementHandle = await page.$("input#image-input");
            await elementHandle!.uploadFile(image);
        }
        await click(page, "#done");
        await type(page, "#name input", name);
        await type(page, "#price input", price.toString());
        await type(page, "#time input", time.toString());
        await type(page, "#description textarea", description);

        if(general && general.length > 0) {
            await click(page, "#general");
            await click(page, `button.${general}`);
            await click(page, ".alert-button-group button:last-of-type");
        }
        if(categories && categories.length > 0) {
            await click(page, "#categories");
            for(let i of categories) {
                await click(page, `button.${i}`);
            }
            await wait(page, ".alert-button-group button:last-of-type");
            const btn = await page.$(".alert-button-group button:last-of-type");
            await btn!.click();
            // await click(page, ".alert-button-group button:last-of-type");
        }
        if(strict && strict.length > 0) {
            await click(page, "#strict");
            for(let i of strict) {
                await click(page, `button.${i}`);
            }
            await wait(page, ".alert-button-group button:last-of-type");
            // await page.click(".alert-button-group button:last-of-type");
            try {
                const btn = await page.$(".alert-button-group button:last-of-type");
                await btn!.click();
            } catch (e) {
                console.error("COULDN'T CLICK" + ".alert-button-group button:last-of-type");
                throw e;
            }
            // await click(page, ".alert-button-group button:last-of-type");
        }
        await click(page, "#add")
    } catch (e) {
        console.error("at createDish()");
        throw e;
    }
}


async function createRestaurant(page: p.Page, name: string) {
    try {


        try {
            await page.goto("https://localhost:8100/user/info");
        } catch (e) {
            console.error("couldn't navigate to user/info");
            throw e;
        }

        await wait(page, "#add-restaurant");

        try {
            await page.click("#add-restaurant");
            await page.waitForNavigation({ timeout: config.browser.timeout });
        } catch (e) {
            console.error("couldn't navigate to restaurant/name");
            throw e;
        }

        await wait(page, "#name");
        await wait(page, "#next");

        try {
            await type(page, "#name", name);
        } catch (e) {
            console.error("couldn't type name");
            throw e;
        }

        try {
            // await page.click("#next");
            await click(page, "#next",);
            await page.waitForNavigation({ timeout: config.browser.timeout });
        } catch (e) {
            console.error("couldn't navigate to theme");
            throw e;
        }

        try {
            await click(page, "button#skip");
            await page.waitForNavigation({ timeout: config.browser.timeout });
        } catch (e) {
            console.error("couldn't navigate to dashboard");
            throw e;
        }

        return page;

    } catch (e) {
        console.log("at createRestaurant()");
        throw e;
    }
};