document.addEventListener('DOMContentLoaded', function() {
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');

  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('active');
  });

  var searchButton = document.getElementById('search-button');
  var searchField = document.getElementById('search-field');

  searchButton.addEventListener('click', function() {
    performSearch();
  });

  searchField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  function performSearch() {
    var query = searchField.value.trim();
    if (query.length > 0) {
      window.location.href = 'search-results.html?query=' + encodeURIComponent(query);
    }
  }

  document.querySelector('a[href="login.html"]').addEventListener('click', function(event) {
    event.preventDefault();
    fetch('/logout', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = 'login.html';
      } else {
        alert('Logout failed.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Logout failed.');
    });
  });
});
