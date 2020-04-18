import io from 'socket.io-client';
import SimpleScrollbar from 'simple-scrollbar';

import 'simple-scrollbar/simple-scrollbar.css';
import 'normalize.css';
import './main.sass';

SimpleScrollbar.initAll();
const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:7000' : 'http://xn--72-9kcd8arods1i.xn--p1ai';
const socket = io.connect(apiUrl);

let loginForm = document.querySelector('.js-form_login');
let login = document.querySelector('.js-page_login');

let chatIcon = document.querySelector('.js-chat__open-button');
let chat = document.querySelector('.js-chat');
let chatForm = document.querySelector('.js-chat__form');
let chatList = document.querySelector('.js-chat__list');
let chatClose = document.querySelector('.js-chat__cancel');

let rooms = document.querySelector('.js-page_rooms');
let newRoom = document.querySelector('.js-card_mini');

let game = document.querySelector('.js-page_game');
let gameClose = document.querySelector('.js-game__cancel');
let diceButton = document.querySelector('.js-dice__button');
let diceContain = document.querySelector('.js-game__contain_dice');

let dices = document.querySelectorAll('.js-dice')

const HIDDEN = '_hidden'

const user = {
    color: generateColor(),
    roomName: '',
};


diceButton.addEventListener('click', () => {

    let random = Math.floor(Math.random() * (6 - 1 + 1)) + 1;

    dices.forEach(dice => {
        dice.classList.add(HIDDEN)
        
        if (String(random) === dice.dataset.dice ) {
            dice.classList.remove(HIDDEN)
        }
    })
    
})

socket.on('game:players', (e) => {
    console.log(e)
})

socket.on('chat:message', (e) => {
    let chatMessage = document.createElement('li');
    chatList.append(chatMessage);
    if (user.name === e.name){
        chatMessage.classList.add('chat__message_my', 'chat__message');
        chatMessage.innerHTML = `<span class="chat__text">${e.message}</span>`;
    } else {
        chatMessage.innerHTML = `<span class="chat__author" style="color: ${e.color}">${e.name}</span> <span class="chat__text">${e.message}</span>`;
        chatMessage.classList.add('chat__message_company', 'chat__message', '_flex-column');
    }
    SimpleScrollbar.initAll();
})

chatClose.addEventListener('click', () => {
    chat.classList.add(HIDDEN)
    chatIcon.classList.remove(HIDDEN)
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
            openRoom(room.roomName, 'room:choice');

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

function openRoom(roomName, roomEvent){
    socket.emit(roomEvent, { roomName })
    rooms.classList.add(HIDDEN);
    game.classList.remove(HIDDEN);
    user.roomName = roomName;
}

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

gameClose.addEventListener('click', () => {
    const modal = new Modal();
    const content = closeGame(modal);
    modal.open(content);
})

function closeGame(modal){
    let title = document.createElement('h3');
    title.textContent = 'Выйти из комнаты?'
    title.classList.add('card__title');

    let buttonY = document.createElement('button');
    buttonY.type = 'button';
    buttonY.textContent = 'Да'
    buttonY.classList.add('form__button', 'button', '_two-button');

    buttonY.addEventListener('click', () => {
        socket.emit('room:leave', { roomName: user.roomName })
        user.roomName = '';
        game.classList.add(HIDDEN);
        rooms.classList.remove(HIDDEN);
        modal.close();
    })

    let buttonN = document.createElement('button');
    buttonN.type = 'button';
    buttonN.textContent = 'Отмена'
    buttonN.classList.add('form__button', 'button', '_two-button');

    buttonN.addEventListener('click', () => {
        modal.close();
    })
    return [title, buttonY, buttonN];

}

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
    buttonRoom.textContent = 'Создать'
    buttonRoom.classList.add('form__button', 'button');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomName = e.target.elements.roomName.value;
        modal.close();
        openRoom(roomName, 'room:create');
    })

    form.append(inputRoom, buttonRoom);
    return [titleRoom, form];
}

class Modal {

    constructor(){
        this.modal = document.createElement('div');
        this.modal.classList.add('modal', '_flex-center');

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