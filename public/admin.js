document.addEventListener('DOMContentLoaded', function() {
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');
  
  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('active');
  });

  function fetchUsers(query = '') {
    const url = query ? `/searchUsers?q=${query}` : '/getUsers';
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Fetched user data:', data);
        if (data.success) {
          const userList = document.querySelector('.user-list');
          userList.innerHTML = '';
          data.users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.classList.add('user-item');
            userItem.innerHTML = `
              <div class="user-details">
                <p>Username: ${user.username}</p>
                <p>Email: <input type="text" value="${user.email}" data-username="${user.username}" class="email-input"></p>
                <p>Keycode: ${user.keycode}</p>
                <p>Password: <input type="password" value="${user.password}" data-username="${user.username}" class="password-input"></p>
              </div>
              <button class="update-email-btn">Update Email</button>
              <button class="update-password-btn">Update Password</button>
            `;
            userList.appendChild(userItem);
          });

          document.querySelectorAll('.update-email-btn').forEach(button => {
            button.addEventListener('click', function() {
              const userItem = this.closest('.user-item');
              const emailInput = userItem.querySelector('.email-input');
              if (emailInput) {
                const username = emailInput.getAttribute('data-username');
                const newEmail = emailInput.value;
                if (validateEmail(newEmail)) {
                  console.log(`Sending changeEmail request for username: ${username}, newEmail: ${newEmail}`);
                  fetch('/changeEmail', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, newEmail })
                  })
                  .then(response => {
                    console.log('Received response:', response);
                    return response.json();
                  })
                  .then(data => {
                    console.log('changeEmail response data:', data);
                    if (data.success) {
                      alert('Email updated successfully');
                    } else {
                      alert('Failed to update email');
                    }
                  })
                  .catch(error => {
                    console.error('Error updating email:', error);
                  });
                } else {
                  alert('Invalid email format');
                }
              } else {
                console.error('Email input not found');
              }
            });
          });

          document.querySelectorAll('.update-password-btn').forEach(button => {
            button.addEventListener('click', function() {
              const userItem = this.closest('.user-item');
              const passwordInput = userItem.querySelector('.password-input');
              if (passwordInput) {
                const username = passwordInput.getAttribute('data-username');
                const newPassword = passwordInput.value;
                console.log(`Sending changePassword request for username: ${username}, newPassword: ${newPassword}`);
                fetch('/changePassword', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ username, newPassword })
                })
                .then(response => response.json())
                .then(data => {
                  console.log('changePassword response data:', data);
                  if (data.success) {
                    alert('Password updated successfully');
                  } else {
                    alert('Failed to update password');
                  }
                })
                .catch(error => {
                  console.error('Error updating password:', error);
                });
              } else {
                console.error('Password input not found');
              }
            });
          });
        } else {
          alert('Failed to fetch users');
        }
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }

  fetchUsers(); 

  const searchField = document.getElementById('search-field');
  const searchButton = document.getElementById('search-button');

  searchButton.addEventListener('click', function() {
    const query = searchField.value;
    fetchUsers(query);
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }
});
