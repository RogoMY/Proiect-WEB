document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.querySelector('.register-form');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const email = document.getElementById('email').value;

        if (password !== confirmPassword) { 
            errorMessage.textContent = 'Passwords do not match!';
            return; 
        }
        alert('Registration successful! Please log in with your new account.');

        window.location.href = 'login.html';
    });
});
