import * as p from "puppeteer";
import { config } from "../../config";


async function type(page: p.Page, element: string, text: string, check: boolean = true) {
    let input;
    try {
        input = await page.waitForSelector(element, { visible: true, timeout: config.browser.selectors.timeout });
    } catch (e) {
        console.error("FUNCTION TYPE COULDN'T FIND SELECTOR");
        throw e;
    }

    try {
        await page.focus(element);
        await page.keyboard.type(text, { delay: 30 });
    } catch (e) {
        console.error("FUNCTION TYPE COULDN'T TYPE");
        throw e;
    }

    if(check) {
        try {


            const value = await page.evaluate(x => x.value, input);
            

            if(value != text) {
                await page.evaluate(el => el.value = '', input);
                await type(page, element, text);
            }

        } catch (e) {
            throw e;
        }
    }

}



// function getTest(element: p.ElementHandle<Element>) {
//     return new Promise((resolve, reject) => {
//         element.evaluate(el => {
//             console.log(el.textContent);
//             resolve(el.textContent);
//         });
//     });
// }


async function wait(page: p.Page, element: string) {
    try {
        await page.waitForSelector(element, { visible: true, timeout: config.browser.selectors.timeout });
    } catch (e) {
        console.error("NO ELEMEN FOUND", element);
        throw e;
    }
} 

async function register(page: p.Page, username: string, password: string) {
    try {
        await page.setViewport({ width: 1900, height: 800 });

        try {
            await page.goto(`https://localhost:8100/register`, { timeout: config.browser.timeout });    
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
            await type(page, "#username", username);
            await type(page, "#password", password);
            await type(page, "#confirm-password", password);
        } catch (e) {
            console.error("COULDN'T TYPE");
            throw e;
        }

        try {
            await page.waitForSelector(".username-message:not(:empty)", { timeout: 2000  });

            console.log("HEELO??");

            throw 1;
        } catch (e) {
            if(e == 1) {
                throw new Error(`ACCOUNT WITH USERNAME ${username} IS ALREADY REGISTERED`);
            }
        }

        try {
            await page.click("#next", { delay: 500 });
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
            await page.waitForSelector("#name", { timeout: config.browser.selectors.timeout });
            await page.waitForSelector("#submit", { timeout: config.browser.selectors.timeout });
        } catch (e) {
            console.log("COULDN'T FIND SELECTORS PAGE: user/name/1");
            throw e;
        }

        try {
            await type(page, "#name", "BAZHAN NAGNYBIDA");
        } catch (e) {
            console.log("COULDN'T TYPE NAME PAGE: user/name/1");
            throw e;
        }

        try {
            await click(page, "#submit")
        } catch (e) {
            console.error("COULDN'T CLICK PAGE: user/name/1");
            throw e;
        }

        try {
            await page.waitForNavigation({ timeout: config.browser.timeout });
        } catch (e) {
            console.log("COULDN'T NAVIGATE AFTER 2");
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
            await type(page, "#email", "test@ctraba.com");
        } catch (e) {
            console.error("COULDN'T TYPE 2");
            throw e;
        }

        try {
            await click(page, "#send");
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
            await type(page, "#code span:first-of-type input", "111111", false);
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

        return page;

    } catch (e) {
        console.log("COULDN'T FAST REGISTER");
        throw e;
    }
}



async function click(page: p.Page, element: string) {
    try {
        await wait(page, element);
    } catch (e) {
        console.log('not found:', element);
        throw e;
    }
    try {
        await page.$eval(element, el => (el as any).click());
        // await page.focus(element);
        // await page.keyboard.type('\n');
    } catch (error) {
        console.error("couldn't click:", element);
        throw error;
    }
} 


function sleep(time: number) {
    return new Promise((rs, rj) => {
        setTimeout(async () => {
            rs(null);
        }, time);
    });  
}



export {
    type,
    register,
    wait,
    sleep,
    click,
}