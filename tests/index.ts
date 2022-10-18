import { config } from "./config";
import { register } from "./src/login";

import * as p from "puppeteer";
import { click } from "./scripts/utils/functions";



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
  open();
})();



async function open() {
  register();
}