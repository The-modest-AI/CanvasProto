const express = require("express");
const app = express();
const path = require("path");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const formattedMessage = require("../../public/utils/message");
const {
  defineRoom,
  getRoom,
  getWord,
  setWord,
  getDisplayWord,
  searchAndClearRooms,
} = require("../../public/utils/room");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getHost,
  isEmmit,
  deleteAble,
  scorePoints,
  getScoreBoard,
  getRoomUsers,
} = require(`../../public/utils/users`);

const modName = `Bot`;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, `../../public/homepage.html`));
});

app.get(`/join`, (req, res) => {
  res.sendFile(path.join(__dirname, `../../public/enter.html`));
});

app.get(`/index.html`, (req, res) => {
  res.sendFile(path.join(__dirname, `../../public/index.html`));
});

app.use(express.static(path.join(__dirname, "../../public/")));

//send the start button to visible to the host only once
function sendHostToRoom(code) {
  if (!getRoom(code)) {
    if (isEmmit(code)) {
      const user = getHost(code);
      io.to(user.id).emit(`host-true`);
    }
  }
}

io.on("connection", (socket) => {
  socket.on(`join-room`, ({ username, code }) => {
    const user = userJoin(socket.id, username, code, 0);
    //join
    socket.join(user.code);

    //welcome message
    socket.emit(`message`, formattedMessage(modName, `Welcome to the game`));
    //say to all users in specific room
    socket.broadcast
      .to(user.code)
      .emit(
        `message`,
        formattedMessage(modName, `${user.username} joined the game`)
      );
    //Send info for sidebar
    io.to(user.code).emit("roomUsers", {
      users: getRoomUsers(user.code),
    });

    if (getRoom(user.code) !== undefined) {
      if (getRoom(user.code).hasStarted) {
        emitter(user.code, "round-number", {
          currentRound: getRoom(user.code).currentRound,
          rounds: getRoom(user.code).rounds,
        });
        emitter(user.code, "word", getDisplayWord(user.code));
        emitter(user.code, "active-player", getRoom(user.code).activeUser);
      }
    }

    sendHostToRoom(user.code);
  });

  function emitter(code, emitMessage, params) {
    if (!params) {
      io.to(code).emit(emitMessage);
    } else {
      io.to(code).emit(emitMessage, params);
    }
  }

  async function userChanger(user, intervalId) {
    let room = getRoom(user.code);
    if (room) {
      room.stop = true;
      await setWord(user.code);
      emitter(user.code, "clear-event");
      let array = getRoomUsers(user.code);
      room.stop = false;
      let sec = room.time;
      function timer(maxTime, timerId) {
        if (room.roundCompleted === true) {
          clearInterval(timerId);
          clearInterval(intervalId);
          searchAndClearRooms(user.code);
          return;
        } else {
          if (sec === 0) sec = maxTime;
          emitter(user.code, "time-event", sec);
          sec--;
          return sec;
        }
      }
      timer(room.time);
      let timerId = setInterval(() => {
        timer(room.time, timerId);
      }, 1000);

      if (!(room.currentRound > room.rounds)) {
        if (getRoomUsers(user.code).length > 1) {
          io.to(user.code).emit("round-number", {
            currentRound: room.currentRound,
            rounds: room.rounds,
          });

          io.to(user.code).emit(`word`, getDisplayWord(user.code));

          if (room.currentPlayer === array.length - 1) {
            room.activeUser = array[room.currentPlayer];
            room.currentPlayer = 0;
            room.currentRound++;
            room.usersAnswered = [];
          } else {
            room.activeUser = array[room.currentPlayer];
            room.currentPlayer++;
          }

          if (room.activeUser) {
            io.to(room.activeUser.id).emit("display-word", room.word);
            io.to(user.code).emit("active-player", room.activeUser);
            io.to(user.code).emit(
              `message`,
              formattedMessage(
                modName,
                `${room.activeUser.username} is drawing now!`
              )
            );
          }
        }
      } else {
        room.roundCompleted = true;
        emitter(user.code, `display-score`, getScoreBoard(room.code));
        room.stop = true;
        clearInterval(intervalId);
      }
    }
  }

  //On Disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    const array = getRoomUsers(user.code);
    //hasStarted if any user exists
    if (user) {
      io.to(user.code).emit(
        "message",
        formattedMessage(modName, `${user.username} has left the game`)
      );
      io.to(user.code).emit("roomUsers", {
        users: getRoomUsers(user.code),
      });
    }

    //Send scoreboard if one person
    if (getRoom(user.code)) {
      if (array.length === 1) {
        getRoom(user.code).roundCompleted = true;
        emitter(
          user.code,
          "display-score",
          getScoreBoard(getRoom(user.code).activeUser.code)
        );
        console.log(`one user`);
      }
      if (array.length === 0) {
        getRoom(user.code).roundCompleted = true;
        console.log(true);
      }
    }
    sendHostToRoom(user.code);
  });

  //When the game starts
  socket.on(`game-start`, async (obj) => {
    const user = getCurrentUser(socket.id);
    defineRoom(obj.time, user.code, obj.rounds);
    getRoom(user.code).hasStarted = true;
    emitter(
      user.code,
      "message",
      formattedMessage(modName, `${user.username} has started the game!`)
    );
    userChanger(user);
    let intervalId = setInterval(() => {
      userChanger(user, intervalId);
    }, getRoom(user.code).time * 1000);
  });

  //Custom User messages
  socket.on("chat-message", (msg) => {
    const user = getCurrentUser(socket.id);
    let code = user.code;
    if (getRoom(code)) {
      if (getRoom(code).hasStarted == true && !getRoom(code).stop) {
        if (msg !== getWord(user.code)) {
          io.to(user.code).emit(
            "message",
            formattedMessage(user.username, msg)
          );
        }
        if (msg === getWord(user.code)) {
          if (user.id !== getRoom(code).activeUser.id) {
            if (!getRoom(code).usersAnswered.includes(user)) {
              io.to(user.code).emit(
                `message`,
                formattedMessage(
                  modName,
                  `${user.username} has guessed the word!`
                )
              );
              scorePoints(user);
              getRoom(code).usersAnswered.push(user);
            } else {
              socket.emit(
                `message`,
                formattedMessage(modName, ` You have already guessed the word.`)
              );
            }
          } else {
            socket.emit(
              `message`,
              formattedMessage(
                modName,
                ` You can't guess the word while drawing!`
              )
            );
          }
        }
      }
    } else {
      io.to(user.code).emit("message", formattedMessage(user.username, msg));
    }
  });

  //clear canvas event

  socket.on(`clear-event`, () => {
    sendCanvasDelete(socket);
  });

  //draw canvas event
  socket.on("coordinates-sent", (metaData) => {
    const user = getCurrentUser(socket.id);
    if (getRoom(user.code) && getRoom(user.code).activeUser) {
      const activeUserID = getRoom(user.code).activeUser.id;
      const stop = getRoom(user.code).stop;
      if (user.id === activeUserID && !stop) {
        io.to(user.code).emit(`draw coordinates`, metaData);
      }
    }
  });
});

function sendCanvasDelete(socket) {
  const user = getCurrentUser(socket.id);
  if (getRoom(user.code)) {
    const activeUserID = getRoom(user.code).activeUser.id;
    const stop = getRoom(user.code).stop;
    if (user.id === activeUserID && !stop) {
      io.to(user.code).emit(`clear-event`);
    }
  }
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server Online at PORT ${PORT}`);
});