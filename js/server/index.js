const express = require("express");
const app = express();
const path = require(`path`);
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const formattedMessage = require(`../../public/utils/message`);
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require(`../../public/utils/users`);

const aiName = `Bot`;

app.get(`/join`, (req, res) => {
    res.sendFile(path.join(__dirname, `../../public/enter.html`));
});

app.get(`/index.html`, (req, res) => {
    res.sendFile(path.join(__dirname, `../../public/index.html`));
});

app.use(express.static(path.join(__dirname, "../../public/")));

io.on('connection', socket => {
    socket.on(`join-room`, ({username, code}) => {
        const user = userJoin(socket.id, username, code);
        //join
        socket.join(user.code);
        //welcome message
        socket.emit(`message`, formattedMessage(aiName, `Welcome to the game`));
        //say to all users in specific room
        socket.broadcast.to(user.code).emit(`message`, formattedMessage(aiName, `${user.username} joined the game`));
        //Send info for sidebar
        io.to(user.code).emit('roomUsers', {users: getRoomUsers(user.code)});
    });

    //Custom User messages
    socket.on('chat-message', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.code).emit('message', formattedMessage(user.username, msg));
    });

    //On Disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        //check if any user exists
        if (user) {
            io.to(user.code).emit('message', formattedMessage(aiName, `${user.username} has left the game`));
        }

        //Send info for sidebar
        io.to(user.code).emit('roomUsers', {users: getRoomUsers(user.code)});
    });

    //clear canvas event
    socket.on(`clear-event`, () => {
        socket.broadcast.emit(`clear-event`);
    });

    //draw canvas event
    socket.on('coordinates-sent', (metaData) => {
        socket.broadcast.emit(`draw coordinates`, metaData);
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server Online at PORT ${PORT}`);
});
