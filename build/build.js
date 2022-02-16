const { readFileSync, writeFileSync } = require("fs");



(async function() { 
    const keyPath = process.cwd() + "/src/environments";

    const key = readFileSync(keyPath + "/localhost-cert.pem");
    const cert = readFileSync(keyPath + "/localhost-private.pem");
    
    writeFileSync(process.cwd() + "/www/localhost-cert.pem", cert);
    writeFileSync(process.cwd() + "/www/localhost-private.pem", key);

})();