const { giveNewWordWithUnderscores } = require("../utils/word");

let rooms = [];

const defineRoom = (time, code, rounds) => {
  let t = parseInt(time);
  let r = parseInt(rounds);

  if (isNaN(t) || isNaN(r)) {
    t = 30;
    r = 3;
  }

  if (!isNaN(t) || !isNaN(r)) {
    if (t > 180 || t < 1) t = 30;
    if (r > 10 || r < 1) r = 3;
  }

  const room = {
    time: t,
    word: undefined,
    code,
    activeUser: undefined,
    hasStarted: false,
    rounds: r,
    displayText: undefined,
    currentRound: 1,
    currentPlayer: 0,
    stop: false,
    roundCompleted: false,
    startButtonActivated: false,
    usersAnswered: [],
  };
  rooms.push(room);
};

function getRoom(code) {
  let room;
  rooms.forEach((e) => {
    if (e.code === code) room = e;
    else room = undefined;
  });
  return room;
}

function getWord(code) {
  let room;
  rooms.forEach((e) => {
    if (e.code === code) {
      room = e;
    }
  });
  return room.word;
}

async function setWord(code) {
  let room;
  rooms.forEach((e) => {
    if (e.code === code) {
      room = e;
    }
  });
  let text = await giveNewWordWithUnderscores();
  room.word = text.word;
  room.displayText = text.displayText;
  return room.displayText;
}

function getDisplayWord(code) {
  let room;
  rooms.forEach((e) => {
    if (e.code === code) {
      room = e;
    }
  });
  return room.displayText;
}

function searchAndClearRooms(code) {
  const index = rooms.findIndex((room) => room.code === code);
  if (index != -1) {
    rooms.splice(index, 1);
  }
}

module.exports = {
  defineRoom,
  getRoom,
  setWord,
  getWord,
  getDisplayWord,
  searchAndClearRooms,
};
