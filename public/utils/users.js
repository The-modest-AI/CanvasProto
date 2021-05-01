const users = [];

// Join user to chat
function userJoin(id, username, code, points) {
  const user = { id, username, code, points };
  users.push(user);
  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

//set points
function setUserPoint(id) {
  getCurrentUser(id).points += 10;
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(code) {
  return users.filter((user) => user.code === code);
}

function isEmmit(code) {
  const user = users.filter((user) => user.code === code);
  return user.length === 2;
}

function getHost(code) {
  const index = users.findIndex((user) => user.code === code);
  if (index !== -1) {
    return users[index];
  }
}

function scorePoints(user) {
  setUserPoint(user.id);
}

function getScoreBoard(code) {
  let arrayOfUsers = getRoomUsers(code);
  let scoreBoardArray = [];
  arrayOfUsers.forEach((users) => {
    scoreBoardArray.push({ username: users.username, score: users.points });
  });
  arrayOfUsers.sort((a, b) => {
    return b.score - a.score;
  });
  return scoreBoardArray;
}

function deleteAble(code) {
  return getRoomUsers(code).length < 1;
}
module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getHost,
  isEmmit,
  scorePoints,
  getScoreBoard,
  getRoomUsers,
  deleteAble,
};