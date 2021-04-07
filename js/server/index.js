const express = require("express");
const app = express();
const path = require(`path`);
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get(`/join`, (req, res) => {
    res.sendFile(path.join(__dirname, `../../public/enter.html`));
});

app.get(`/index.html`, (req, res) => {
    console.log(req.query.username);
    console.log(req.query.code);
    res.sendFile(path.join(__dirname, `../../public/index.html`));
});

app.use(express.static(path.join(__dirname, "../../public/")));

io.on('connection', (socket) => {
    console.log('A User connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
    socket.on(`clear-event`, () => {
        socket.broadcast.emit(`clear-event`);
        console.log(`clear`);
        socket.on('coordinates-sent', (metaData) => {
            socket.broadcast.emit(`draw coordinates`, metaData);
            console.log(JSON.stringify(metaData, null, 2).replace(/['"]+/g, ''));
        });
    });
});

http.listen(3000, () => {
    console.log("Connected the server... Ready for stuff...")
});
