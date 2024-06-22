document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('.login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.userType === 'admin') {
                    // Ensure the admin token is stored in the cookie
                    document.cookie = `adminToken=${data.token}; path=/`;
                    window.location.href = 'admin.html';
                } else {
                    // Ensure the user token is stored in the cookie
                    document.cookie = `userId=${data.data}; path=/`;
                    window.location.href = 'homepage.html';
                }
            } else {
                errorMessage.textContent = data.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
        });
    });
});
