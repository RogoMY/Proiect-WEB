document.addEventListener('DOMContentLoaded', function() {
  
  fetchFavorites();

  var searchButton = document.getElementById('search-button');
  var searchField = document.getElementById('search-field');

  searchButton.addEventListener('click', function() {
    performSearch(searchField.value.trim());
  });

  searchField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch(searchField.value.trim());
    }
  });

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

  function performSearch(query) {
    if (query.length > 0) {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      };

      fetch('http://localhost:5000/search', requestOptions)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Search results received:', data.results);
            window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
          } else {
            console.error('Search error:', data.message);
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }

  function fetchFavorites() {
    fetch('/fetchFavorites', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Fetched favorites:', data.favorites);
        displayFavorites(data.favorites);
      } else {
        console.error('Error fetching favorites:', data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }

  function displayFavorites(favorites) {
    const favoritesSection = document.querySelector('.favorites-section');
    favoritesSection.innerHTML = '';

    if (favorites.length === 0) {
      favoritesSection.innerHTML = '<p>No favorites found.</p>';
      return;
    }

    favorites.forEach(item => {
      const favoriteItem = document.createElement('div');
      favoriteItem.classList.add('search-result-item');

      const starIcon = document.createElement('span');
      starIcon.classList.add('star-icon');
      starIcon.innerHTML = '★';
      starIcon.style.color = 'gold';
      starIcon.addEventListener('click', function() {
        toggleFavorite(item, starIcon, favoriteItem);
      });

      const titleLink = document.createElement('a');
      titleLink.href = item.link;
      titleLink.classList.add('search-result-title');
      titleLink.textContent = item.title;

      const description = document.createElement('p');
      description.classList.add('search-result-description');
      description.textContent = item.description;

      

      favoriteItem.appendChild(starIcon);
      favoriteItem.appendChild(titleLink);
      favoriteItem.appendChild(description);
      

      favoritesSection.appendChild(favoriteItem);
    });
  }

  function toggleFavorite(item, starIcon, favoriteItem) {
    const { title, link, description, tags } = item;

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, link, description, tags })
    };

    fetch('/toggleFavorite', requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log('Toggle Favorite - Response:', data);
        if (data.success) {
          if (starIcon.innerHTML === '★') {
            starIcon.innerHTML = '☆';
            starIcon.style.color = 'black';
            if (favoriteItem) {
              favoriteItem.remove();
            }
          } else {
            starIcon.innerHTML = '★';
            starIcon.style.color = 'gold';
          }
        } else {
          console.error('Error toggling favorite:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
});
