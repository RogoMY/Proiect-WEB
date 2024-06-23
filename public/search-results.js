document.addEventListener('DOMContentLoaded', function() {
  var urlParams = new URLSearchParams(window.location.search);
  var query = urlParams.get('query');

  if (query) {
    performSearch(query);
  }

  var filterToggle = document.getElementById('filter-toggle');
  var filterSection = document.querySelector('.filter-section');
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');
  var searchButton = document.getElementById('search-button');
  var searchField = document.getElementById('search-field');
  var resetFiltersButton = document.getElementById('reset-filters');

  filterToggle.addEventListener('click', function() {
    filterSection.classList.toggle('open');
  });

  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('active');
  });

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

  let initialResults = [];
  let selectedFilters = {
    category: new Set(),
    platform: new Set(),
    scopes: new Set(),
    programming_languages: new Set()
  };

  function performSearch(query) {
    if (query.length > 0) {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      };

      fetch('/search', requestOptions)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            initialResults = data.results;
            console.log('Search results received:', initialResults);
            displayResults(initialResults);
          } else {
            console.error('Search error:', data.message);
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }

  function logSearchHistory(result, callback) {
    const { title, link, description, category, platform, scopes, programming_languages } = result;
    const tags = [
      ...category,
      ...platform,
      ...scopes,
      ...programming_languages
    ].join(', ');

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, link, description, tags })
    };

    console.log('Preparing to log search history:', { title, link, description, tags });

    fetch('/logHistory', requestOptions)
      .then(response => response.json())
      .then(data => {
        console.log('Log History - Response:', data);
        if (data.success) {
          console.log('Successfully logged search history:', { title, link, description, tags });
          callback();
        } else {
          console.error('Error logging search history:', data.message);
          callback();
        }
      })
      .catch(error => {
        console.error('Error:', error);
        callback();
      });
  }

  function displayResults(results) {
    var resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';

    const filters = extractFilters(results);
    displayFilters(filters);

    results.forEach(result => {
      var resultItem = document.createElement('div');
      resultItem.classList.add('search-result-item');

      var titleLink = document.createElement('a');
      titleLink.href = result.link;
      titleLink.classList.add('search-result-title');
      titleLink.textContent = result.title;
      resultItem.appendChild(titleLink);

      titleLink.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('Clicked link:', {
          title: result.title,
          link: result.link,
          description: result.description,
          category: result.category,
          platform: result.platform,
          scopes: result.scopes,
          programming_languages: result.programming_languages
        });
        logSearchHistory(result, () => {
          console.log('Redirecting to:', result.link);
          setTimeout(() => {
            window.location.href = result.link;
          }, 10); // 1-second delay
        });
      });

      var description = document.createElement('p');
      description.classList.add('search-result-description');
      description.textContent = result.description;
      resultItem.appendChild(description);

      var tags = document.createElement('p');
      tags.classList.add('search-result-tags');
      tags.textContent = 'Tags: ' + [
        result.category.join(', '),
        result.platform.join(', '),
        result.scopes.join(', '),
        result.programming_languages.join(', ')
      ].filter(tag => tag.trim().length > 0).join(', ');
      resultItem.appendChild(tags);

      // Add the star for favorites
      var starIcon = document.createElement('span');
      starIcon.classList.add('star-icon');
      starIcon.innerHTML = '&#9734;'; // Empty star
      if (result.isFavorite) {
        starIcon.classList.add('favorite'); // Add the favorite class if the item is already a favorite
      }
      console.log('Adding star icon to:', result.title); // Log message for verification
      starIcon.addEventListener('click', function() {
        toggleFavorite(result, starIcon);
      });
      resultItem.appendChild(starIcon);

      resultsList.appendChild(resultItem);
    });
  }

  function toggleFavorite(result, starIcon) {
    const isAdding = !starIcon.classList.contains('favorite');
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };

    fetch(`/toggleFavorite`, requestOptions)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          starIcon.classList.toggle('favorite');
        } else {
          console.error('Error updating favorite:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  function extractFilters(results) {
    const filters = {
      category: new Map(),
      platform: new Map(),
      scopes: new Map(),
      programming_languages: new Map()
    };

    results.forEach(result => {
      if (result.category) {
        result.category.forEach(cat => {
          filters.category.set(cat, (filters.category.get(cat) || 0) + 1);
        });
      }
      if (result.platform) {
        result.platform.forEach(plat => {
          filters.platform.set(plat, (filters.platform.get(plat) || 0) + 1);
        });
      }
      if (result.scopes) {
        result.scopes.forEach(scope => {
          filters.scopes.set(scope, (filters.scopes.get(scope) || 0) + 1);
        });
      }
      if (result.programming_languages) {
        result.programming_languages.forEach(lang => {
          filters.programming_languages.set(lang, (filters.programming_languages.get(lang) || 0) + 1);
        });
      }
    });

    return filters;
  }

  function displayFilters(filters) {
    var filtersContainer = document.getElementById('filters-container');
    if (!filtersContainer) {
      console.error('Filters container not found');
      return;
    }

    filtersContainer.innerHTML = '';

    Object.keys(filters).forEach(filterType => {
      var filterGroup = document.createElement('div');
      filterGroup.classList.add('filter-group');

      var filterTitle = document.createElement('h3');
      filterTitle.textContent = filterType.charAt(0).toUpperCase() + filterType.slice(1);
      filterTitle.classList.add('expandable');
      filterTitle.dataset.target = `${filterType}-filters`;
      filterGroup.appendChild(filterTitle);

      var filterList = document.createElement('ul');
      filterList.id = `${filterType}-filters`;
      filterList.classList.add('nested-filter-list');

      filters[filterType].forEach((count, filter) => {
        var listItem = document.createElement('li');
        var label = document.createElement('label');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = filter;
        checkbox.classList.add(filterType);

        if (selectedFilters[filterType].has(filter)) {
          checkbox.checked = true;
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`${filter} (${count})`));
        listItem.appendChild(label);
        filterList.appendChild(listItem);
      });

      filterGroup.appendChild(filterList);
      filtersContainer.appendChild(filterGroup);
    });

    var expandableElements = document.querySelectorAll('.expandable');
    expandableElements.forEach(function(expandable) {
      expandable.addEventListener('click', function() {
        var targetId = expandable.dataset.target;
        var targetList = document.getElementById(targetId);

        if (targetList.style.display === 'none' || targetList.style.display === '') {
          targetList.style.display = 'block';
          expandable.classList.add('collapsed');
        } else {
          targetList.style.display = 'none';
          expandable.classList.remove('collapsed');
        }
      });
    });

    var filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    filterCheckboxes.forEach(function(checkbox) {
      checkbox.addEventListener('change', function() {
        updateSelectedFilters();
        applyFilters();
        updateResetButtonVisibility();
      });
    });
  }

  function updateSelectedFilters() {
    selectedFilters = {
      category: new Set(),
      platform: new Set(),
      scopes: new Set(),
      programming_languages: new Set()
    };

    var filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    filterCheckboxes.forEach(function(checkbox) {
      if (checkbox.checked) {
        selectedFilters[checkbox.classList[0]].add(checkbox.value);
      }
    });
  }

  function applyFilters() {
    var filteredResults = initialResults.filter(result => {
      var match = true;

      if (selectedFilters.category.size > 0) {
        match = result.category.some(cat => selectedFilters.category.has(cat));
      }

      if (match && selectedFilters.scopes.size > 0) {
        match = result.scopes.some(scope => selectedFilters.scopes.has(scope));
      }

      if (match && selectedFilters.programming_languages.size > 0) {
        match = result.programming_languages.some(lang => selectedFilters.programming_languages.has(lang));
      }

      if (match && selectedFilters.platform.size > 0) {
        match = result.platform.some(plat => selectedFilters.platform.has(plat));
      }

      return match;
    });

    displayResults(filteredResults);
    updateFilterCounts(initialResults, filteredResults);
  }

  function updateFilterCounts(initialResults, filteredResults) {
    const filters = calculateFilterCounts(initialResults);
    displayFilters(filters);
  }

  function calculateFilterCounts(results) {
    const filters = {
      category: new Map(),
      platform: new Map(),
      scopes: new Map(),
      programming_languages: new Map()
    };

    const selectedFilterKeys = Object.keys(selectedFilters);

    selectedFilterKeys.forEach(filterKey => {
      const otherFilters = selectedFilterKeys.filter(key => key !== filterKey);
      const otherFilterResults = results.filter(result => {
        return otherFilters.every(key => {
          if (selectedFilters[key].size > 0) {
            return result[key].some(subFilter => selectedFilters[key].has(subFilter));
          }
          return true;
        });
      });

      otherFilterResults.forEach(result => {
        if (result[filterKey]) {
          result[filterKey].forEach(subFilter => {
            filters[filterKey].set(subFilter, (filters[filterKey].get(subFilter) || 0) + 1);
          });
        }
      });
    });

    return filters;
  }

  function resetFilters() {
    selectedFilters = {
      category: new Set(),
      platform: new Set(),
      scopes: new Set(),
      programming_languages: new Set()
    };

    var filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    filterCheckboxes.forEach(function(checkbox) {
      checkbox.checked = false;
    });

    displayResults(initialResults);
    updateFilterCounts(initialResults);

    updateResetButtonVisibility();
  }

  function updateResetButtonVisibility() {
    const hasSelectedFilters = Object.values(selectedFilters).some(filterSet => filterSet.size > 0);
    const resetFiltersButton = document.getElementById('reset-filters');

    if (hasSelectedFilters) {
      resetFiltersButton.style.display = 'block';
    } else {
      resetFiltersButton.style.display = 'none';
    }
  }

  resetFiltersButton.addEventListener('click', function() {
    resetFilters();
  });
});
