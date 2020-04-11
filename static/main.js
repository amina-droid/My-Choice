const socket = io.connect('http://localhost:8080');

let loginForm = document.querySelector('.js-form_login');
let login = document.querySelector('.js-page_login');

let chatIcon = document.querySelector('.js-chat-open-button');
let chat = document.querySelector('.js-chat');
let chatForm = document.querySelector('.js-chat__form');
let chatList = document.querySelector('.js-chat__list');

let rooms = document.querySelector('.js-page_rooms');
let newRoom = document.querySelector('.js-card_mini');

let game = document.querySelector('.js-page_game');


const HIDDEN = '_hidden'
const user = {
    color: generateColor(),
};

socket.on('chat:message', (e) => {
    let chatMessage = document.createElement('li');
    chatList.append(chatMessage);
    chatMessage.style.backgroundColor = generateRGBA(e.color)
    if (user.name === e.name){
        chatMessage.classList.add('chat__message_my', 'chat__message');
        chatMessage.innerHTML = `<span class="chat__text">${e.message}</span>`;
    } else {
        chatMessage.innerHTML = `<span class="chat__author" style="color: ${e.color}">${e.name}:</span> <span class="chat__text">${e.message}</span>`;
        chatMessage.classList.add('chat__message_company', 'chat__message');
    }

})
let roomList = [];
socket.on('rooms', (data) => {
    roomList.forEach(elem => {
        elem.remove();
    })

    roomList = []

    data.rooms.forEach(room => {
        console.log(room.id)

        let roomCard = document.createElement('button');
        roomCard.type = 'button'
        roomCard.classList.add('card', 'card_mini', '_flex-center');

        roomCard.addEventListener('click', () => {
            socket.emit('room:choice', { roomName: room.roomName })
            rooms.classList.add(HIDDEN);
            game.classList.remove(HIDDEN);

        })

        let nameRoomCard = document.createElement('span');
        nameRoomCard.classList.add('card__roomname');
        nameRoomCard.textContent = `${room.roomName}`

        let countUser = document.createElement('span');
        countUser.classList.add('card__users-count');
        countUser.textContent = `Подключено: ${room.userCount}`

        roomCard.prepend(nameRoomCard, countUser)
        
        
        roomList.push(roomCard);

        console.log(room)
    });
    rooms.prepend(...roomList)

})

function generateColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16)
}
function generateRGBA(color){
    return `rgba(${toR(color)}, ${toG(color)}, ${toB(color)}, 0.3)` 
}
function toR(h) { return parseInt((cutHex(h)).substring(0,2),16) }
function toG(h) { return parseInt((cutHex(h)).substring(2,4),16) }
function toB(h) { return parseInt((cutHex(h)).substring(4,6),16) }
function cutHex(h) { return (h.charAt(0)=="#") ? h.substring(1,7) : h}


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    user.name = e.target.name.value;
    login.classList.add(HIDDEN);
    chatIcon.classList.remove(HIDDEN);
    rooms.classList.remove(HIDDEN);
    socket.emit('login', { username: user.name })

})

chatIcon.addEventListener('click', () => {
    chat.classList.remove(HIDDEN);
    chatIcon.classList.add(HIDDEN);
})

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.message.value;
    socket.emit('chat:message', { name: user.name, message, color: user.color });
    e.target.elements.message.value = '';
})

newRoom.addEventListener('click', () => {
    
    const modal = new Modal();
    const content = formRoom(modal);
    modal.open(content);

})

function formRoom(modal){
    let titleRoom = document.createElement('h3');
    titleRoom.textContent = 'Введите название комнаты'
    titleRoom.classList.add('card__title');

    let form = document.createElement('form');
    form.classList.add('form', '_flex-column');

    let inputRoom = document.createElement('input');
    inputRoom.type = 'text';
    inputRoom.name = 'roomName'
    inputRoom.classList.add('form__input')

    let buttonRoom = document.createElement('button');
    buttonRoom.type = 'submit';
    buttonRoom.textContent = 'Добавить'
    buttonRoom.classList.add('form__button', 'button');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomName = e.target.elements.roomName.value;
        socket.emit('room:create', { roomName })
        modal.close();
    })

    form.append(inputRoom, buttonRoom);
    return [titleRoom, form];
}

class Modal {

    constructor(){
        this.modal = document.createElement('div');
        this.modal.classList.add('modal');

        this.modalBackground = document.createElement('div');
        this.modalBackground.classList.add('modal-background');

        this.modalWindow = document.createElement('div');
        this.modalWindow.classList.add('modal-window', 'card');

        this.modal.append(this.modalBackground, this.modalWindow);

        this.modalBackground.addEventListener('click', this.close, {once: true})

    }
    
    open(content){
        this.modalWindow.append(...content);
        document.body.appendChild(this.modal);
    }

    close = () => {
        this.modal.remove();
    }
}