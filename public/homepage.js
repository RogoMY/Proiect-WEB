document.addEventListener('DOMContentLoaded', function() {
  // Toggle pentru meniul mobil
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');
  
  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('active');
  });
  
  // Gestionarea cautarii
  var searchButton = document.getElementById('search-button');
  var searchField = document.getElementById('search-field');
  
  // Functia care se declanseaza la click pe butonul de cautare
  searchButton.addEventListener('click', function() {
    performSearch();
  });
  
  // Functia care se declanseaza la apasarea tastei Enter in campul de cautare
  searchField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Functie pentru a executa cautarea
  function performSearch() {
    var query = searchField.value.trim();
    if (query.length > 0) {
      window.location.href = 'search-results.html?query=' + encodeURIComponent(query);
    }
  }

  // Functie pentru logout
  document.querySelector('a[href="login.html"]').addEventListener('click', function(event) {
    event.preventDefault(); 
    console.log('Logout button clicked');
    fetch('/logout', {
      method: 'POST'
    })
    .then(response => {
      console.log('Logout response status:', response.status);
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Logout successful');
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
});
