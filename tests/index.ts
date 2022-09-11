import { config } from "./config";
import { loginTest, registrationTest } from "./src/login";

import * as p from "puppeteer";
import { click } from "./scripts/utils/functions";


process.setMaxListeners(20);

/*
  FULL TEST PATH






  

  1 registration
    register many accounts
    2 of em are correct one will be removed
    username=account password=123123123      is the one left at the end account
    trying to register account with different passwords
    trying to register account without username


  2 login
    login to ACCOUNTWILLBEREMOVED first and remove it
    login to   account   and continue



  that's it




  run fast:register  for registered account username=account password=123123123
*/






// (async () => {
//     console.log("TESTS STARTED"); 

//     await registrationTest(config.url, config.strict);
//     // await loginTest()
// })();



(async () => {
  for (let i = 0; i < 50; i++) {
    open()
  }
})();



async function open() {
  const browser = await p.launch({ headless: true, ignoreHTTPSErrors: true });

  const page = await browser.newPage();


  await page.goto("https://localhost:8100/login");

  await page.waitForSelector("#username", { timeout: 5000 });

  await page.type("#username", "account");
  await page.type("#password", "123123123");

  await page.click("#next")

  try {
    await page.waitForNavigation();
  } catch (error) {
    console.log("failure");
  }

  await page.waitForSelector(".link.people", { timeout: 5000 });

  await click(page, ".link.people");

  await page.waitForNavigation();

  await page.waitForSelector(".link.orders");

  await click(page, ".link.orders");

  await page.waitForNavigation();

  await page.waitForSelector(".list .order:last-of-type");

  await page.click(".list .order:last-of-type");


  setTimeout(() => {
    console.log("success");
    browser.close();
  }, 20000);
}