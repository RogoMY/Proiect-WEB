document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); //previne trimiterea formularului

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'admin') {//redirectionare catre homepage
            window.location.href = 'C:/Users/Luca/Documents/test.html';
        } else {//mesaj esuare logare
            errorMessage.textContent = 'Wrong username or password!';
        }
    });
});
