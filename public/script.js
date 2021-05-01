const socket = s;
const canvas = document.querySelector("#myCanvas");
const context = canvas.getContext("2d");
const contextButton = canvas.getContext("2d");
const clearButton = document.querySelector("#clearButton");
const messageForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const msg = document.getElementById("msg");
const overlayStartOptions = document.querySelector(".overlay-start-options");
const setWord = document.querySelector(".text-guess");
const resultDiv = document.querySelector(".overlay");
const list = document.querySelector(".list");
const roundNumber = document.querySelector(".round-number");
const userList = document.getElementById("users");
const wordBtn = document.querySelector("#show-word-button");
const theme = document.getElementById("dark-btn");
const time = document.querySelector(".timer");
const addButtonDiv = document.querySelector("#game-start-form");
let rect = canvas.getBoundingClientRect();

let lastActivePlayerUsername;

const { username, code } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

theme.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  if (document.body.classList.contains("dark-theme")) {
    theme.innerHTML = '<i id="light" class="fas fa-sun"></i>';
    document.querySelector("#light").style.color = "rgb(255,255,255, 0.87)";
  } else {
    theme.innerHTML = '<i class="fas fa-moon"></i>';
  }
});

socket.on("display-word", (text) => {
  document.querySelector(".overlay-word").style.visibility = "visible";
  wordBtn.innerText = "";
  wordBtn.innerText = text;
  setTimeout(() => {
    document.querySelector(".overlay-word").style.visibility = "hidden";
  }, 1000);
});

socket.on("time-event", (e) => {
  const text = e;
  time.innerHTML = "";
  time.innerHTML = `<i class="fas fa-clock"></i> ${text}`;
});

socket.emit(`join-room`, { username, code });

socket.on(`round-number`, (e) => {
  roundNumber.innerHTML = "";
  const paragraphElement = document.createElement("p");
  paragraphElement.innerText = `Round ${e.currentRound}/${e.rounds}`;
  roundNumber.append(paragraphElement);
});

function userExists(username) {
  return !!document.querySelector(`#user-${username}`);
}

socket.on("display-score", (user) => {
  user.forEach((e) => {
    const div = document.createElement(`li`);
    div.innerText = `${e.username} ${e.score}`;
    list.appendChild(div);
  });
  resultDiv.style.visibility = "visible";
});

socket.on("active-player", (user) => {
  let username = user.username;
  if (userExists(lastActivePlayerUsername)) {
    const element = document.querySelector(`#user-${lastActivePlayerUsername}`);
    element.innerHTML = "";
    element.innerText = `${lastActivePlayerUsername}`;
  }
  const target = document.querySelector(`#user-${username}`);
  target.innerHTML += `  <i class="fas fa-pencil-alt"></i>`;
  lastActivePlayerUsername = username;
});

socket.on("word", (word) => {
  const s = setWord;
  if (s.children.length) {
    s.removeChild(s.firstChild);
  }
  const paragraphElement = document.createElement("p");
  paragraphElement.setAttribute("id", "text-guess-p");
  paragraphElement.innerText = word;
  s.appendChild(paragraphElement);
});

socket.on("host-true", () => {
  const header = document.querySelector(".start-div");
  const button = document.createElement("button");
  button.innerHTML = `<i class="far fa-play-circle"></i> Start Game`;
  button.setAttribute("class", "start-game");
  header.appendChild(button);
  const start = document.querySelector(".start-game");
  start.addEventListener("click", (event) => {
    event.preventDefault();
    overlayStartOptions.style.visibility = "visible";
    const button = document.createElement("button");
    button.setAttribute("id", "start-game-options");
    button.innerHTML = `<i class="far fa-play-circle"></i> Start Game`;
    addButtonDiv.appendChild(button);
    const startGameWithOptions = document.querySelector("#start-game-options");
    startGameWithOptions.addEventListener("click", (event) => {
      event.preventDefault();
      let time = document.querySelector("#time-quantity").value;
      let rounds = document.querySelector("#rounds-quantity").value;
      socket.emit("game-start", { time, rounds });
      startGameWithOptions.remove;
      overlayStartOptions.style.visibility = "hidden";
      start.remove();
    });
  });
});

socket.on("roomUsers", ({ users }) => {
  function outputUsers(users) {
    userList.innerHTML = "";
    users.forEach((user) => {
      const li = document.createElement("li");
      li.setAttribute("id", `user-${user.username}`);
      li.innerText = user.username;
      userList.appendChild(li);
    });
  }

  outputUsers(users);
});

//chat-form listener to set innerText to '' every time
messageForm.addEventListener(`submit`, (event) => {
  event.preventDefault();
  let message = event.target.elements.msg.value;
  message = message.trim();
  socket.emit("chat-message", message);
  event.target.elements.msg.value = ``;
  event.target.elements.msg.focus();
});

let paint = false;

let coordinates = {
  x: 0,
  y: 0,
};

const metaData = {
  From: {
    x: 0,
    y: 0,
  },
  To: {
    x: 0,
    y: 0,
  },
};

const setMetaDataFrom = (coordinates) => {
  metaData.From.x = coordinates.x;
  metaData.From.y = coordinates.y;
};

const setMetaDataTo = (coordinates) => {
  metaData.To.x = coordinates.x;
  metaData.To.y = coordinates.y;
};

function send(metaData) {
  socket.emit(`coordinates-sent`, metaData);
}

function stopPaint() {
  paint = false;
}

function doPaint(event) {
  if (paint) {
    context.beginPath();
    context.lineWidth = 3;
    context.lineCap = "round";
    context.color = `black`;
    setMetaDataFrom(coordinates);
    context.moveTo(coordinates.x, coordinates.y);
    setCoordinates(event);
    context.lineTo(coordinates.x, coordinates.y);
    setMetaDataTo(coordinates);
    send(metaData);
    context.stroke();
  }
}

function generatePaintCoords(event) {
  if (paint) {
    setMetaDataFrom(coordinates);
    setCoordinates(event);
    setMetaDataTo(coordinates);
    send(metaData);
  }
}

function setCoordinates(event) {
  coordinates.x =
    ((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width;
  coordinates.y =
    ((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height;
}

socket.on(`clear-event`, () => {
  contextButton.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on(`draw coordinates`, (metaData) => {
  let initialCoordinates = {
    x: metaData.From.x,
    y: metaData.From.y,
  };
  let finalCoordinates = {
    x: metaData.To.x,
    y: metaData.To.y,
  };
  instaPaint(initialCoordinates, finalCoordinates);
});

socket.on(`message`, (message) => {
  displayInChat(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

//add message div in the chat-box
function displayInChat(message) {
  const div = document.createElement(`div`);
  div.classList.add(`message`);
  div.innerHTML = `<p class="meta">${message.username}</p><p class="text">${message.text}</p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

function startPaint(event) {
  paint = true;
  setCoordinates(event);
}

function setCoords(coords) {
  coordinates = coords;
}

const instaPaint = (initialCoordinates, finalCoordinates) => {
  context.beginPath();
  context.lineWidth = 3;
  context.lineCap = "round";
  context.color = `black`;
  setCoords(initialCoordinates);
  context.moveTo(coordinates.x, coordinates.y);
  setCoords(finalCoordinates);
  context.lineTo(coordinates.x, coordinates.y);
  context.stroke();
};

window.addEventListener("load", () => {
  //when window loads add this
  canvas.addEventListener("mouseup", stopPaint); //when mouse up don't draw so set boolean false
  canvas.addEventListener("mousedown", startPaint); //when mouse down make sure to set bool to true and set coordinates
  canvas.addEventListener("mousemove", generatePaintCoords); //when moving check if button down then draw
  document.addEventListener("mouseup", () => {
    paint = false;
  });
});

//Configuration for clear button=
clearButton.addEventListener("click", () => {
  socket.emit(`clear-event`);
});
