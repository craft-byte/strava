export const config = {
    headless: false,
    dbName: "ctrabaTest",
    strict: true,
    url: "https://localhost:8100",
    browser: {
        headless: true,
        timeout: 40000,
        selectors: {
            timeout: 40000,
        }
    }
}