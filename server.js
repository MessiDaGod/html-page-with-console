const open = require("open");
var favicon = require('serve-favicon');
const path = require('path');
// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "localhost";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

const express = require("express");
const join = require("path");

const app = express();

var dir = "public";
var page = "index.html";


app.use(express.static(path.join(__dirname, dir)));
app.use(favicon(path.join(__dirname, 'public','images', 'favicon.ico')));
// sendFile will go here
app.get("/", function (req, res) {
    res.sendFile(path.join(dir, page));
});


// @ts-ignore
app.listen(port, host, function () {
    console.log("http://" + host + ":" + page);
    // @ts-ignore
    open("http://" + host + ":" + port + "/" + page, { app: "chrome" });
});