const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

app.get("*", (_req, res) => {
    res.sendFile(__dirname, "/www/index.html");
});

app.listen(PORT, () => {
    console.log("http://localhost:", PORT);
});