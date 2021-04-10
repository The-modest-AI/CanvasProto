const socket = s;
const canvas = document.querySelector('#myCanvas');
const context = canvas.getContext('2d');
const contextButton = canvas.getContext('2d');
const clearButton = document.querySelector("#clearButton");
const messageForm = document.getElementById(`chat-form`);
const chatMessages = document.querySelector(`.chat-messages`);
const msg = document.getElementById(`msg`);
let rect = canvas.getBoundingClientRect();
const userList = document.getElementById('users');

const {username, code} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

socket.emit(`join-room`, {username, code});

socket.on('roomUsers', ({users}) => {
    function outputUsers(users) {
        userList.innerHTML = '';
        users.forEach((user) => {
            const li = document.createElement('li');
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
    console.log(message);
    socket.emit('chat-message', message);
    event.target.elements.msg.value = ``;
    event.target.elements.msg.focus();
});

let paint = false;

let coordinates = {
    x: 0,
    y: 0
};

const metaData = {
    From: {
        x: 0,
        y: 0
    },
    To: {
        x: 0,
        y: 0
    }
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
        context.lineCap = 'round';
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

function setCoordinates(event) {
    coordinates.x = (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    coordinates.y = (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
}

socket.on(`clear-event`, () => {
    contextButton.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on(`draw coordinates`, metaData => {
    let initialCoordinates = {
        x: metaData.From.x,
        y: metaData.From.y
    };
    let finalCoordinates = {
        x: metaData.To.x,
        y: metaData.To.y
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
    document.querySelector('.chat-messages').appendChild(div);
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
    context.lineCap = 'round';
    context.color = `black`;
    setCoords(initialCoordinates);
    context.moveTo(coordinates.x, coordinates.y);
    setCoords(finalCoordinates);
    context.lineTo(coordinates.x, coordinates.y);
    context.stroke();
};

window.addEventListener('load', () => { //when window loads add this
    canvas.addEventListener('mouseup', stopPaint); //when mouse up dont draw so set boolean false
    canvas.addEventListener('mousedown', startPaint); //when mouse down make sure to set bool to true and set coordinates
    canvas.addEventListener('mousemove', doPaint);  //when moving check if button down then draw
    document.addEventListener('mouseup', () => {
        paint = false;
    });
});

//Configuration for clear button=
clearButton.addEventListener('click', () => {
    socket.emit(`clear-event`);
    contextButton.clearRect(0, 0, canvas.width, canvas.height);
});