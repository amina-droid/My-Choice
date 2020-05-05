import io from 'socket.io-client';
import SimpleScrollbar from 'simple-scrollbar';

import 'simple-scrollbar/simple-scrollbar.css';
import 'normalize.css';
import './main.sass';
import { rule } from 'postcss';
import { Fireworks } from './components/fireworks';

SimpleScrollbar.initAll();
const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:7000' : 'http://xn--72-9kcd8arods1i.xn--p1ai';
const socket = io.connect(apiUrl);

let loginForm = document.querySelector('.js-form_login');
let login = document.querySelector('.js-page_login');


let rooms = document.querySelector('.js-page_rooms');
let newRoom = document.querySelector('.js-room_create');

let game = document.querySelector('.js-page_game');
let gameHeader = document.querySelector('.js-game__header');
let gameClose = document.querySelector('.js-game__cancel');
let diceButton = document.querySelector('.js-dice__button');
let startGameButton = document.querySelector('.js-game__start');

let playerOpenButton = document.querySelector('.js-players__open-button');
let playerList = document.querySelector('.js-players__list');
let playerListClose = document.querySelector('.js-players__cancel');

let playersTable = document.querySelector('.js-players__tbody');

let dices = document.querySelectorAll('.js-dice');

let dreamPaths = document.querySelectorAll('.js-dream');

let svgGame = document.querySelector('.js-svg_game');

let saleDarkButton = document.querySelector('.js-sale-dark__button');
let saleList = document.querySelector('.js-sale__list');
let saleTitle = document.querySelector('.js-sale__title');
let saleBody = document.querySelector('.js-sale__body');
let saleListClose = document.querySelector('.js-sale__cancel')

let rulesButton = document.querySelector('.js-rules__open-button');
let rules = document.querySelector('.js-rules');
let rulesButtonClose = document.querySelector('.js-rules__cancel');

rulesButtonClose.addEventListener('click', () => {
    rules.classList.add(HIDDEN);
    rulesButton.classList.remove(HIDDEN);
})
rulesButton.addEventListener('click', () => {
    rules.classList.remove(HIDDEN);
    rulesButton.classList.add(HIDDEN);
})


const HIDDEN = '_hidden';

const user = {
    color: generateColor(),
    roomName: '',
    priority: 0,
    resources: {},
    moderator: false,
};

class ChatContainer {
    constructor() {
        this.btnOpen = document.querySelector('.js-chat__open-button');
        this.btnClose = document.querySelector('.js-chat__cancel');
        this.containerTabs = document.querySelector('.js-chat__tabs');
        this.notification = this.createNotification();
        this.btnOpen.prepend(this.notification);
        this.chats = {};
        this.tabs = {};
        this.container = document.querySelector('.js-chat');
        this.currentChat = this.createChat('Общий чат', 'chat:message');

        this.addBtnOpenListener();
        this.addBtnCloseListener();
    }
    addBtnCloseListener() {
        this.btnClose.addEventListener('click', () => {
            this.container.classList.add(HIDDEN);
            this.currentChat.textarea.blur();
            this.btnOpen.classList.remove(HIDDEN)
        })
    }
    addBtnOpenListener() {
        this.btnOpen.addEventListener('click', () => {
            this.container.classList.remove(HIDDEN);
            this.currentChat.textarea.focus();
            this.btnOpen.classList.add(HIDDEN);
            this.notification.classList.add(HIDDEN)
        })
    }

    unhide() {
        this.btnOpen.classList.remove(HIDDEN);
    }
    createChat(name, listen) {
        const callback = () => {
            if(this.container.classList.contains(HIDDEN)) {
                this.notification.classList.remove(HIDDEN);
            }
        }
        const chat = new Chat(listen, callback);
        this.chats = {
            ...this.chats, 
            [name]: chat,
        };
        const tab = document.createElement('button');
        tab.textContent = name;
        tab.classList.add('tabs__button');
        tab.type = 'button';
        tab.addEventListener('click', () => {
            this.setCurrentChat(name);
        })
        this.tabs = {
            ...this.tabs,
            [name]: tab,
        };
        this.containerTabs.append(tab);
        this.container.append(chat.body, chat.form);
        this.setCurrentChat(name);
        return chat;
    }

    removeChat(name) {
        if (this.currentChat === this.chats[name]) {
            this.setCurrentChat('Общий чат');
        } 

        this.tabs[name].remove();
        delete this.tabs[name];
        this.chats[name].remove();
        delete this.chats[name];
    }

    setCurrentChat(name) {
        this.chats[name].active();
        const { [name]: currentChat, ...otherChats } = this.chats;
        Object.values(otherChats).forEach(chat => chat.disactive());
        this.currentChat = currentChat;

        this.tabs[name].setAttribute('disabled', 'true');
        const { [name]: currentTab, ...otherTabs } = this.tabs;
        Object.values(otherTabs).forEach(tab => tab.removeAttribute('disabled'));
    }

    createNotification() {
        const notification = document.createElement('div');
        notification.classList.add('chat__new-message', HIDDEN);
        return notification;
    }
}

class Chat {
    constructor(listen, callback) {
        this.body = document.createElement('div');
        this.body.classList.add('chat__body');

        this.list = document.createElement('ul');
        this.list.classList.add('chat__list', '_flex-column');

        this.body.append(this.list);

        this.form = document.createElement('form');
        this.form.classList.add('chat__form');
        this.form.name = 'chat';
        this.textarea = this.createTextarea();
        this.sendButton = this.createSendButton();
        this.form.append(this.textarea, this.sendButton);

        this.addSubmitListener(listen);
        this.addNewMessageListener(listen, callback);

        this.addTextareaListener();
        
        SimpleScrollbar.initEl(this.body)
    }

    addSubmitListener(listen) {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = e.target.elements.message.value;
            socket.emit(listen, { name: user.name, message, color: user.color });
            e.target.elements.message.value = '';
            this.textarea.focus();
        })
    } 
    addNewMessageListener(listen, callback) {
        socket.on(listen, (e) => {
            let message = document.createElement('li');
            this.list.append(message);
        
            if (user.name === e.name) {
                message.classList.add('chat__message_my', 'chat__message');
                message.innerHTML = `<span class="chat__text">${e.message}</span>`;
            } else {
                message.innerHTML = `<span class="chat__author" style="color: ${e.color}">${e.name}</span> <span class="chat__text">${e.message}</span>`;
                message.classList.add('chat__message_company', 'chat__message', '_flex-column');
            }
            callback();
            SimpleScrollbar.initAll();
            const scrollContainer = this.body.querySelector('.ss-content');
            scrollContainer.scrollTop = 9999;
        })
    }
    createTextarea() {
        const textarea = document.createElement('textarea');
        textarea.classList.add('chat__textarea');
        textarea.name = 'message';
        return textarea;
    }
    addTextareaListener() {
        this.textarea.addEventListener('keydown', (e) => {

            if (!e.shiftKey && e.keyCode == 13) {
                e.preventDefault();
                const event = new Event('submit', {
                    'bubbles': true,
                    'cancelable': true
                });
        
                this.form.dispatchEvent(event);
        
            }
            return true;
        })
    }
    createSendButton() {
        const sendButton = document.createElement('button');
        sendButton.classList.add('chat__button');
        sendButton.type = 'submit';
        sendButton.innerHTML = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 469.038 469.038" style="enable-background:new 0 0 469.038 469.038;" xml:space="preserve">
<g>
<path d="M465.023,4.079c-3.9-3.9-9.9-5-14.9-2.8l-442,193.7c-4.7,2.1-7.8,6.6-8.1,11.7s2.4,9.9,6.8,12.4l154.1,87.4l91.5,155.7
c2.4,4.1,6.9,6.7,11.6,6.7c0.3,0,0.5,0,0.8,0c5.1-0.3,9.5-3.4,11.6-8.1l191.5-441.8C470.123,13.879,469.023,7.979,465.023,4.079z
M394.723,54.979l-226.2,224.7l-124.9-70.8L394.723,54.979z M262.223,425.579l-74.5-126.9l227.5-226L262.223,425.579z"/>
</g>
</svg>`;
        return sendButton;
    }
    remove() {
        this.body.remove();
        this.form.remove();
    }

    disactive() {
        this.body.classList.add(HIDDEN);
        this.form.classList.add(HIDDEN);
    }

    active() {
        this.body.classList.remove(HIDDEN);
        this.form.classList.remove(HIDDEN);
    }
}
const chatContainer = new ChatContainer();
class Modal {

    constructor(bgClose = true) {
        this.modal = document.createElement('div');
        this.modal.classList.add('modal', '_flex-center');

        this.modalBackground = document.createElement('div');
        this.modalBackground.classList.add('modal-background');

        this.modalWindow = document.createElement('div');
        this.modalWindow.classList.add('modal-window', 'card');

        this.modal.append(this.modalBackground, this.modalWindow);

        if (bgClose) {
            this.modalBackground.addEventListener('click', this.close, { once: true })
        }


    }

    open(content) {
        this.modalWindow.append(...content);
        document.body.appendChild(this.modal);
    }

    close = () => {
        this.modal.remove();
    }
}

playerListClose.addEventListener('click', () => {
    playerList.classList.add(HIDDEN);
    playerOpenButton.classList.remove(HIDDEN);
})

playerOpenButton.addEventListener('click', () => {
    playerList.classList.remove(HIDDEN);
    playerOpenButton.classList.add(HIDDEN);
})

function diceMove() {

    let random = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
    socket.emit('game:move', random);

    dices.forEach(dice => {
        dice.classList.add(HIDDEN)

        if (String(random) === dice.dataset.dice) {
            dice.classList.remove(HIDDEN)
        }
    })
    diceButton.setAttribute('disabled', 'true')

    closeSaleList();
}
const LEFT_OUTER = [
    0, 1, 2, 3, 4, 5, 6, 7, 8
]

const TOP_OUTER = [
    9, 10, 11, 12, 13, 14
]

const RIGHT_OUTER = [
    15, 16, 17, 18, 19, 20, 21, 22, 23
]

const BOTTOM_OUTER = [
    24, 25, 26, 27, 28, 29
]

const LEFT_DREAM = [
    2, 6, 8
]

const TOP_DREAM = [
    12
]

const RIGHT_DREAM = [
    16, 20
]

const BOTTOM_DREAM = [
    24, 28
]

function getDreamPosition(user, dreamCell) {
    if (LEFT_DREAM.includes(dreamCell)) {
        return {
            x: 110 - user.priority * 15,
            y: 660 - dreamCell * 78,
        }
    }
    if (TOP_DREAM.includes(dreamCell)) {
        return {
            x: 110 - user.priority * 15 + (dreamCell - 8) * 131,
            y: 36,
        }
    }
    if (RIGHT_DREAM.includes(dreamCell)) {
        return {
            x: 1027 - user.priority * 15,
            y: 36 + (dreamCell - 15) * 78,
        }
    }
    if (BOTTOM_DREAM.includes(dreamCell)) {
        return {
            x: 1027 - user.priority * 15 - (dreamCell - 23) * 131,
            y: 660,
        }
    }
}

function getPosition(user) {
    const odd = user.priority % 2;

    if (user.position.type === 'inner') {

        return odd
            ? {
                x: (410 - (user.priority - 1) / 2 * 13),
                y: (460 + (user.priority - 1) / 2 * 18),
                transform: `rotate(${user.position.cell * 18}, 525, 352)`
            }
            : {
                x: (395 - user.priority / 2 * 18),
                y: (445 + user.priority / 2 * 13),
                transform: `rotate(${user.position.cell * 18}, 525, 352)`
            }
    }

    if (user.position.type === 'outer') {
        if (LEFT_OUTER.includes(user.position.cell)) {
            return odd
                ? {
                    x: (100 - (user.priority - 1) * 15),
                    y: 675 - (user.position.cell * 78),
                    transform: ''
                }
                : {
                    x: (100 - (user.priority) * 15),
                    y: 630 - (user.position.cell * 78),
                    transform: ''
                }
        }
        if (TOP_OUTER.includes(user.position.cell)) {
            return odd
                ? {
                    x: 237 - ((user.priority - 1) * 15) + ((user.position.cell - 9) * 131),
                    y: 55,
                    transform: ''
                }
                : {
                    x: 237 - (user.priority * 15) + ((user.position.cell - 9) * 131),
                    y: 10,
                    transform: ''
                }
        }
        if (RIGHT_OUTER.includes(user.position.cell)) {
            return odd
                ? {
                    x: (1017 - (user.priority - 1) * 15),
                    y: 55 + ((user.position.cell - 15) * 78),
                    transform: ''
                }
                : {
                    x: (1017 - (user.priority) * 15),
                    y: 10 + ((user.position.cell - 15) * 78),
                    transform: ''
                }
        }
        if (BOTTOM_OUTER.includes(user.position.cell)) {
            return odd
                ? {
                    x: 886 - (user.priority - 1) * 15 - ((user.position.cell - 24) * 131),
                    y: 675,
                    transform: ''
                }
                : {
                    x: 886 - user.priority * 15 - ((user.position.cell - 24) * 131),
                    y: 630,
                    transform: ''
                }
        }
    }

    if (user.position.type === 'start') {
        return odd
            ? {
                x: (290 - (user.priority - 1) * 15),
                y: 565,
                transform: ''
            }
            : {
                x: (290 - user.priority * 15),
                y: 540,
                transform: ''
            }
    }
}




socket.on('game:players', (users) => {
    console.log('kjdskfv', users)
    playersTable.innerHTML = '';
    const removedChips = Object.keys(chips).filter(key => {
        return !users.some(obj => {
            return obj.priority === key;
        })
    })
    if (removedChips.length) {
        removedChips.forEach(chip => {
            removeChip(chip);
        })
    }
    const removedChipsDream = Object.keys(chipsDream).filter(key => {
        return !users.some(obj => {
            return obj.priority === key;
        })
    })
    if (removedChipsDream.length) {
        removedChipsDream.forEach(chip => {
            removeChipDream(chip);
        })
    }
    users
        .sort((a, b) => {

            if (a.gameover && b.gameover) {

                if (a.priority > b.priority) return 1;
                else return -1;

            }
            if (a.gameover && !b.gameover) return 1
            if (!a.gameover && b.gameover) return -1;
            else return 0;
        })
        .forEach(obj => {
            if (user.name === obj.username && obj.admin && !isGameStarted) {
                createButtonStartGame();

            }
            if (obj.resources) {
                let player = document.createElement('tr');
                player.setAttribute('align', 'center');
                player.innerHTML = `
                <td class="td">${(obj.priority + 1) || '-'}</td>
                <td class="td">${obj.username}</td>
                <td class="td">${getRecourseString(obj.resources.white)}</td>
                <td class="td">${getRecourseString(obj.resources.dark)}</td>
                <td class="td">${getRecourseString(obj.resources.money)}</td>
                <td class="td">${getRecourseString(obj.resources.lives)}</td>`

                playersTable.append(player);
                if (user.name === obj.username) {
                    user.resources = obj.resources;

                    console.log(obj.resources)
                    if (obj.resources.dark || obj.resources.money) {
                        saleDarkButton.removeAttribute('disabled');
                    } else {
                        saleDarkButton.setAttribute('disabled', 'true')
                    }

                }

                if (obj.currentMove) {
                    player.classList.add('player__current');
                }
                if (obj.gameover) {
                    player.classList.add('player__gameover')
                }
            }

            if (user.name === obj.username && obj.currentMove) {
                diceButton.classList.remove(HIDDEN);
                diceButton.removeAttribute('disabled');
                diceButton.addEventListener('click', diceMove, { once: true })
            }

            if (isGameStarted) {
                const chip = getChip(obj.priority);

                const chipPos = getPosition(obj);

                Object.keys(chipPos).forEach(key => {
                    chip.setAttribute(key, chipPos[key]);
                })
            }
            if (isGameStarted && obj.dream) {
                const chipDream = getChipDream(obj.priority);

                const chipDreamPos = getDreamPosition(obj, obj.dream);

                Object.keys(chipDreamPos).forEach(key => {
                    chipDream.setAttribute(key, chipDreamPos[key]);
                })
                saleDarkButton.classList.remove(HIDDEN);


            }
            if (obj.card) {
                new CardModal(obj.username, obj.card, obj.resources);

            }
            if (obj.winner) {
                if (!isWinner) {
                    isWinner = true;
                    const modal = new Modal();
                    const content = winner(modal, obj.username);
                    const canvas = document.createElement('canvas');
                    modal.modalBackground.append(canvas);
                    const fireworks = new Fireworks(canvas);
                    fireworks.run();
                    modal.open(content);
                }
            }
        })
    console.log(users)
});

saleDarkButton.addEventListener('click', saleDark)

socket.on('game:error', () => {
    const modal = new Modal();
    const content = gameError(modal);
    modal.open(content);
})

function gameError(modal) {
    const description = document.createElement('span');
    description.classList.add('card__span');
    description.textContent = 'К сожалению что-то пошло не так';

    const buttonOk = document.createElement('button');
    buttonOk.type = 'button';
    buttonOk.textContent = 'Ok'
    buttonOk.classList.add('form__button', 'button');

    buttonOk.addEventListener('click', () => {
        modal.close();
        leaveRoom();
    })
    return [description, buttonOk]
}

function saleDark() {
    saleTitle.innerHTML = '';
    saleBody.innerHTML = '';
    saleDarkButton.classList.add(HIDDEN);
    saleList.classList.remove(HIDDEN);
    const { resources } = user;

    let saleButtons = [];

    let description = document.createElement('span');
    description.classList.add('card__span');

    if (resources.money >= 50) {
        let saleDarkForMoney = document.createElement('button');
        saleDarkForMoney.classList.add('button');
        saleDarkForMoney.type = 'button';
        saleDarkForMoney.textContent = '1 СК (Ч) за 50₽';
        saleButtons.push(saleDarkForMoney);
        saleDarkForMoney.addEventListener('click', () => {
            socket.emit('game:share', { exchange: 'dark', for: 'money' });
            closeSaleList()
        }, { once: true })


    }
    if (resources.white >= 5) {
        let saleDarkForWhite = document.createElement('button');
        saleDarkForWhite.classList.add('button');
        saleDarkForWhite.type = 'button';
        saleDarkForWhite.textContent = '1 СК (Ч) за 5 СК (Б)';
        saleButtons.push(saleDarkForWhite);
        saleDarkForWhite.addEventListener('click', () => {
            socket.emit('game:share', { exchange: 'dark', for: 'white' });
            closeSaleList()
        }, { once: true })


    }
    if (resources.lives > 5) {
        let saleDarkForLives = document.createElement('button');
        saleDarkForLives.classList.add('button');
        saleDarkForLives.type = 'button';
        saleDarkForLives.textContent = '1 СК (Ч) за 5Ж';
        saleButtons.push(saleDarkForLives);
        saleDarkForLives.addEventListener('click', () => {
            socket.emit('game:share', { exchange: 'dark', for: 'lives' });
            closeSaleList()
        }, { once: true })

    }
    if (resources.money >= 10) {
        let saleМоneyForLives = document.createElement('button');
        saleМоneyForLives.classList.add('button');
        saleМоneyForLives.type = 'button';
        saleМоneyForLives.textContent = '10₽ на 1Ж';
        saleButtons.push(saleМоneyForLives);
        saleМоneyForLives.addEventListener('click', () => {
            socket.emit('game:share', { exchange: 'lives', for: 'money' });
            closeSaleList()
        }, { once: true })

    }
    if (!saleButtons.length) {
        description.textContent = 'У Вас недостаточно ресурсов';
    } else {
        description.textContent = 'Вы можете обменять:'
    }
    saleTitle.append(description);
    saleBody.append(...saleButtons);
}

saleListClose.addEventListener('click', closeSaleList)

function closeSaleList() {
    saleList.classList.add(HIDDEN);
    saleDarkButton.classList.remove(HIDDEN);
}

let isWinner = false;
function winner(modal, username) {
    modal.modalWindow.classList.add('_flex-column', 'choice__modal');
    let description = document.createElement('span');
    description.classList.add('card__span');

    let choice = document.createElement('button');
    choice.type = 'button';
    choice.textContent = `OK`;
    choice.classList.add('button')

    choice.addEventListener('click', () => {
        modal.close();
        leaveRoom();
    })
    if (username === user.name) {
        description.textContent = 'Поздравляю! Вы выиграли!';
    } else {
        description.textContent = `${username} выиграл`;
    }
    return [description, choice];
}

function getRecourseString(res) {
    return (res || res === 0) ? res : '-'
}

const FIELD_DICTIONARY = {
    1: 'Ситуация',
    2: 'Случай',
    3: 'Предложение',
    4: 'Реакция',
    5: 'Возможность',
    6: 'Тест',
    7: 'Активность',
    8: 'Проблема',
}

const CHOICES_TYPE = [1, 3, 4, 6]

class CardModal extends Modal {
    constructor(userName, card, resources) {
        const isCurrentUser = (userName === user.name);
        if (isCurrentUser) {
            super(false);
        } else {
            super(true);
        }
        this.isCurrentUser = isCurrentUser;
        this.modalWindow.classList.add('_flex-column', 'choice__modal');


        this.open([
            ...this.createTitleAndDescription(userName, card),
            ...this.createChoices(card, resources),
        ]);
    }

    createTitleAndDescription(userName, card) {
        const title = document.createElement('h3');
        title.classList.add('card__title');

        const description = document.createElement('span');
        description.textContent = `${card.description}`;
        description.classList.add('card__span');

        if (this.isCurrentUser) {
            title.textContent = `${FIELD_DICTIONARY[card.type]}`;
        } else {
            title.textContent = `${FIELD_DICTIONARY[card.type]} для ${userName}`;
        }
        return [title, description]
    }

    createChoices(card, resources) {
        if (CHOICES_TYPE.includes(card.type)) {
            return this.createOptionsChoices(card);
        }

        if (card.type === 2) {
            return this.createIncidentChoice(card);
        }

        if (card.type === 5) {
            return this.createOpportunityChoice(card, resources);
        }
    }
    createOptionsChoices(card) {
        return card.choices.map((elem) => {
            const choice = document.createElement('button');
            choice.type = 'button';
            choice.textContent = `${elem.text}`;
            choice.classList.add('button');

            if (this.isCurrentUser) {
                choice.addEventListener('click', () => {
                    socket.emit('game:choice', {
                        type: card.type,
                        id: card.id,
                        choiceId: elem.id
                    });
                    this.close();
                })
            } else {
                choice.setAttribute('disabled', 'true')
                socket.on('game:user-choice', (id) => {
                    const choiceId = Number(id);
                    if (choiceId === elem.id) {
                        choice.classList.add('button_active');
                        setTimeout(() => this.close(), 1500);
                    }
                })
            }

            return choice;
        })
    }
    createIncidentChoice(card) {
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.textContent = `OK`;
        choice.classList.add('button');
        if (this.isCurrentUser) {
            choice.addEventListener('click', () => {

                socket.emit('game:choice', {
                    type: card.type,
                    id: card.id,
                });

                this.close();

            })
        } else {
            choice.setAttribute('disabled', 'true');
            setTimeout(() => this.close(), 1500);
        }
        return [choice]
    }
    createOpportunityChoice(card, resources) {
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.textContent = `OK`;
        choice.classList.add('button');
        if (this.isCurrentUser) {
            choice.addEventListener('click', () => {
                this.close();
                new OpportunityModal(card, resources);
            })
        } else {
            choice.setAttribute('disabled', 'true');
            setTimeout(() => this.close(), 3000);
        }
        return [choice]
    }
}

class OpportunityModal extends Modal {
    constructor(card, resources) {
        super(false);
        this.modalWindow.classList.add('_flex-column', 'choice__modal');
        this.title = document.createElement('h3');
        this.title.classList.add('card__title');
        this.title.textContent = `${FIELD_DICTIONARY[card.type]}`;

        this.description = document.createElement('span');
        this.description.classList.add('card__span');

        this.choice = document.createElement('button');
        this.choice.type = 'button';
        this.choice.textContent = `OK`;
        this.choice.classList.add('button');
        this.choice.addEventListener('click', () => {
            this.close();
        })


        this.outerAvailable(resources, card)
        this.open([this.title, this.description, this.choice])
    }

    outerAvailable({ white, lives, money }, card) {
        if ((lives >= 10 && white >= 10) || (lives >= 15 && money >= 100)) {
            this.successfull(card);
        } else if (this.checkOuterMove({ white, lives, money })) {
            this.rollDice({ white, lives, money });
        } else {
            this.fail(card);
        }
    }

    successfull(card) {
        this.description.textContent = 'Поздравляю! Вы переходите на внешний круг.';

        socket.emit('game:choice', {
            type: card.type,
            outer: true,
        })
    }

    rollDice({ white, lives, money }) {
        this.description.textContent = 'К сожалению, Вам не хватает ресурсов, бросьте кубик, чтобы испытать свои силы.';

        diceButton.removeAttribute('disabled')
        diceButton.addEventListener('click', () => diceResourses({ white, lives, money }), { once: true });
    }

    fail(card) {
        this.description.textContent = 'В следующий раз повезет больше';

        socket.emit('game:choice', {
            type: card.type,
            outer: false,
        })
    }

    checkOuterMove({ white, lives, money }) {
        return (((lives + 6) >= 10 && white >= 10)
            || (lives >= 10 && (white + 6) >= 10)
            || ((lives + 6) >= 15 && money >= 100))
    }
}

function blabla(resourceType, diceResult) {
    socket.emit('game:choice', {
        type: 5,
        outer: true,
        resources: { [resourceType]: diceResult }
    })
}

function youLacky(modal) {
    modal.modalWindow.classList.add('_flex-column', 'choice__modal');
    let description = document.createElement('span');
    description.textContent = 'Поздравляю! Вы смогли увеличить количество ресурсов и теперь можете перейти на внешний круг.';
    description.classList.add('card__span');

    let choice = document.createElement('button');
    choice.type = 'button';
    choice.textContent = `OK`;
    choice.classList.add('button')

    choice.addEventListener('click', () => {
        modal.close();
    })

    return [description, choice];
}

function notThisTime(modal) {
    modal.modalWindow.classList.add('_flex-column', 'choice__modal');
    let description = document.createElement('span');
    description.textContent = 'В следующий раз повезет больше';
    description.classList.add('card__span');

    let choice = document.createElement('button');
    choice.type = 'button';
    choice.textContent = `OK`;
    choice.classList.add('button');

    choice.addEventListener('click', () => {
        socket.emit('game:choice', {
            type: 5,
            outer: false,
        })
        modal.close();
    })

    return [description, choice];
}

function diceResourses({ white, lives, money }) {

    let random = Math.floor(Math.random() * (6 - 1 + 1)) + 1;

    dices.forEach(dice => {
        dice.classList.add(HIDDEN)

        if (String(random) === dice.dataset.dice) {
            dice.classList.remove(HIDDEN)
        }
    })
    diceButton.setAttribute('disabled', 'true')
    if ((lives + random) >= 10 && white >= 10) {
        blabla('lives', random);

        const modal = new Modal();
        const content = youLacky(modal);
        modal.open(content);

        return
    }
    if (lives >= 10 && (white + random) >= 10) {
        blabla('white', random);

        const modal = new Modal();
        const content = youLacky(modal);
        modal.open(content);

        return
    }
    if ((lives + random) >= 15 && money >= 100) {
        blabla('lives', random);

        const modal = new Modal();
        const content = youLacky(modal);
        modal.open(content);

        return
    }
    const modal = new Modal();
    const content = notThisTime(modal);
    modal.open(content);
}

socket.on('game:started', () => {
    isGameStarted = true;
    if (!user.moderator) {
        const modal = new Modal();
        const content = choiceDreamModal(modal);
        modal.open(content);
    
        dreamPaths.forEach(path => {
            path.classList.add('dream__path_active');
            path.addEventListener('click', choiceDream)
        })
    }
})

function choiceDream(e) {
    socket.emit('game:dream', e.target.dataset.dream)
    dreamPaths.forEach(path => {
        path.removeEventListener('click', choiceDream);
        path.classList.remove('dream__path_active');
    })
}

function choiceDreamModal(modal) {
    let title = document.createElement('h3');
    title.textContent = 'Выберите мечту'
    title.classList.add('card__title');

    return [title];
}

let isGameStarted = false;
function createButtonStartGame() {
    if (!startGameButton.classList.contains(HIDDEN)) return;

    startGameButton.classList.remove(HIDDEN);
    startGameButton.addEventListener('click', () => {
        socket.emit('game:start');
        startGameButton.classList.add(HIDDEN)
    }, { once: true })


}



let roomList = [];
socket.on('rooms', (data) => {
    roomList.forEach(elem => {
        elem.remove();
    })

    roomList = []

    data.rooms.forEach(room => {

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
    });
    rooms.prepend(...roomList)

})

function openRoom(roomName, roomEvent) {
    socket.emit(roomEvent, { roomName })
    rooms.classList.add(HIDDEN);
    game.classList.remove(HIDDEN);
    user.roomName = roomName;
    chatContainer.createChat('Комната', 'chat:room-message');
}

function generateColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16)
}
function generateRGBA(color) {
    return `rgba(${toR(color)}, ${toG(color)}, ${toB(color)}, 0.3)`
}
function toR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
function toG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
function toB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }
function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    login.classList.add(HIDDEN);
    chatContainer.unhide();
    rooms.classList.remove(HIDDEN);
    socket.emit('login', { username: e.target.name.value })

})

socket.on('login', obj => {
    user.name = obj.username;
    console.log(obj);
    if (obj.moderator) {
        newRoom.classList.remove(HIDDEN);
        user.moderator = true;
    }
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

function closeGame(modal) {
    let title = document.createElement('h3');
    title.textContent = 'Выйти из комнаты?'
    title.classList.add('card__title');

    let buttonY = document.createElement('button');
    buttonY.type = 'button';
    buttonY.textContent = 'Да'
    buttonY.classList.add('form__button', 'button', '_two-button');

    buttonY.addEventListener('click', () => {
        modal.close();
        leaveRoom();
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

function leaveRoom() {
    socket.emit('room:leave', { roomName: user.roomName })
    user.roomName = '';
    game.classList.add(HIDDEN);
    isGameStarted = false;
    rooms.classList.remove(HIDDEN);

    playersTable.innerHTML = '';

    diceButton.classList.add(HIDDEN);
    dices.forEach(dice => {
        dice.classList.add(HIDDEN)
    })
    Object.keys(chips).forEach(chip => {
        removeChip(chip);
    })
    Object.keys(chipsDream).forEach(chip => {
        removeChipDream(chip);
    })
    isWinner = false;
    chatContainer.removeChat('Комната');
}

function formRoom(modal) {
    let titleRoom = document.createElement('h3');
    titleRoom.textContent = 'Введите название комнаты';
    titleRoom.classList.add('card__title');

    let form = document.createElement('form');
    form.classList.add('form', '_flex-column');

    let inputRoom = document.createElement('input');
    inputRoom.type = 'text';
    inputRoom.name = 'roomName';
    inputRoom.classList.add('form__input');

    let buttonRoom = document.createElement('button');
    buttonRoom.type = 'submit';
    buttonRoom.textContent = 'Создать';
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

const chipsDream = {};

function getChipDream(priority) {
    if (chipsDream[priority]) {
        return chipsDream[priority];
    }

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#star_${priority}`);
    use.setAttribute('x', '0');
    use.setAttribute('y', '0');
    svgGame.append(use);
    chipsDream[priority] = use;

    return chipsDream[priority];
}

const chips = {};
function getChip(priority) {
    if (chips[priority]) {
        return chips[priority];
    }

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#chip_${priority}`);
    use.setAttribute('x', '0');
    use.setAttribute('y', '0');
    svgGame.append(use);
    chips[priority] = use;

    return chips[priority];
}

function removeChip(i) {
    chips[i].remove();
    delete chips[i];
}

function removeChipDream(i) {
    chipsDream[i].remove();
    delete chipsDream[i];
}


