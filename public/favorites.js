document.addEventListener('DOMContentLoaded', function() {
    var favLinks = document.querySelectorAll('.favorites-item a');
    favLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            var query = link.textContent.trim();
            performSearch(query); 
        });
    });
});
 
function displaySearchResults(query) {
    var resultsList = document.getElementById('results-list');
    resultsList.innerHTML = ''; 
    for (var i = 0; i < 5; i++) {
        var resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');
        var titleLink = document.createElement('a');
        titleLink.href = 'search-results.html?query=' + encodeURIComponent(query);
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

function performSearch(query) {
    window.location.href = 'search-results.html?query=' + encodeURIComponent(query);
}