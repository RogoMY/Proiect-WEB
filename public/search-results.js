document.addEventListener('DOMContentLoaded', function() {
  // Extragerea query-ului din URL
  var urlParams = new URLSearchParams(window.location.search);
  var query = urlParams.get('query');

  // Afisarea rezultatelor cautarii daca exista un query
  if (query) {
      displaySearchResults(query);
  }

  // Elementele necesare din DOM
  var filterToggle = document.getElementById('filter-toggle');
  var filterSection = document.querySelector('.filter-section');
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');
  var searchButton = document.getElementById('search-button');
  var searchField = document.getElementById('search-field');
  var filterCheckboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');

  // Hide/show sectiunea de filtre
  filterToggle.addEventListener('click', function() {
      filterSection.classList.toggle('open');
  });

  // Vizibilitatea meniului pe dispozitive mobile
  menuToggle.addEventListener('click', function() {
      menu.classList.toggle('active');
  });

  // Listeneri pentru declansarea cautarii
  searchButton.addEventListener('click', performSearch);
  searchField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          performSearch();
      }
  });

  // Listeneri pentru aplicarea filtrelor
  filterCheckboxes.forEach(function(checkbox) {
      checkbox.addEventListener('change', applyFilters);
  });

  // Gestioneaza comportamentul categoriilor expandabile
  document.querySelectorAll('.expandable').forEach(function(expandable) {
      expandable.addEventListener('click', function() {
          var targetId = expandable.dataset.target;
          var targetList = document.getElementById(targetId);
  
          // Toggle vizibilitate sub-categorii
          if (targetList.style.display === 'none' || targetList.style.display === '') {
              targetList.style.display = 'block';
              expandable.classList.add('collapsed'); //schimba sign to '-'
          } else {
              targetList.style.display = 'none';
              expandable.classList.remove('collapsed'); //schimba sign to '+'
          }
      });
  });
  
  
});

// Functia care gestioneaza cautarea
function performSearch() {
  var searchField = document.getElementById('search-field');
  var query = searchField.value.trim();
  if (query) {
      window.location.href = 'search-results.html?query=' + encodeURIComponent(query);
  }
}

// Functia care aplica filtrele selectate
function applyFilters() {
  var filterCheckboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');
  var selectedFilters = Array.from(filterCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
  console.log("Selected filters:", selectedFilters.join(", "));
}

// Functia care afiseaza rezultatele cautarii
function displaySearchResults(query) {
  var resultsList = document.getElementById('results-list');
  resultsList.innerHTML = ''; // Curata rezultatele anterioare
  for (var i = 0; i < 5; i++) {
      var resultItem = document.createElement('div');
      resultItem.classList.add('search-result-item');
      var titleLink = document.createElement('a');
      titleLink.href = 'https://github.com/terkelg/awesome-creative-coding?tab=readme-overview';
      titleLink.classList.add('search-result-title');
      titleLink.textContent = query;
      resultItem.appendChild(titleLink);
      var description = document.createElement('p');
      description.classList.add('search-result-description');
      description.textContent = 'This is the short description of this container.';
      resultItem.appendChild(description);
      var tag = document.createElement('p');
      tag.classList.add('search-result-tag');
      tag.textContent = 'TAG: demo';
      resultItem.appendChild(tag);
      resultsList.appendChild(resultItem);
  }
}