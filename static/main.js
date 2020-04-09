let loginForm = document.querySelector('.form_login');
let chatIcon = document.querySelector('.chat_icon');
let chat = document.querySelector('.chat')
const user = {};

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    user.name = e.target.name.value;
    console.log(user);
    loginForm.classList.add('hidden');
    chatIcon.classList.remove('hidden');
})

chatIcon.addEventListener('click', () => {
    chat.classList.remove('hidden');
    chatIcon.classList.add('hidden');
})