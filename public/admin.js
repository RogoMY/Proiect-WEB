document.addEventListener('DOMContentLoaded', function() {
    var menuToggle = document.getElementById('menu-toggle');
    var menu = document.querySelector('.menu');
    
    menuToggle.addEventListener('click', function() {
      menu.classList.toggle('active');
    });
  
    let currentPage = 1;
    const limit = 10;
  
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
  
    function fetchUsers(query = '', page = 1) {
      const url = query ? `/searchUsers?q=${query}&page=${page}&limit=${limit}` : `/getUsers?page=${page}&limit=${limit}`;
      const token = getCookie('adminToken');
      console.log('Token retrieved from cookie:', token);
  
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('Fetched user data:', data);
        if (data.success) {
          const userList = document.querySelector('.user-list');
          if (page === 1) {
            userList.innerHTML = '';
          }
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
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ username, newEmail })
                  })
                  .then(response => response.json())
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
  
    const searchField = document.getElementById('search-field');
    const searchButton = document.getElementById('search-button');
  
    searchButton.addEventListener('click', function() {
      const query = searchField.value;
      currentPage = 1;
      fetchUsers(query, currentPage);
    });
  
    const loadMoreButton = document.getElementById('load-more-btn');
    loadMoreButton.addEventListener('click', function() {
      currentPage++;
      fetchUsers('', currentPage);
    });
  
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    }
  
    // Add logout event listener for admin page
    document.querySelector('a[href="login.html"]').addEventListener('click', function(event) {
      event.preventDefault(); 
      console.log('Logout button clicked');
      fetch('/logout', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Logout successful');
          // Clear cookies by setting them to expire in the past
          document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.href = 'login.html';
        } else {
          console.error('Logout failed:', data.message);
          alert('Logout failed.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Logout failed.');
      });
    });
  
    fetchUsers(); // Fetch initial users on page load
  });
  