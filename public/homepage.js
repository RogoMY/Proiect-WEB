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
});
