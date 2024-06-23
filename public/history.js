document.addEventListener('DOMContentLoaded', function() {
    fetchHistory();
  
    function fetchHistory() {
      fetch('/getHistory', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Fetched history:', data.history);
          displayHistory(data.history);
        } else {
          console.error('Error fetching history:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
  
    function displayHistory(history) {
      const historySection = document.querySelector('.history-section');
      historySection.innerHTML = '';
  
      if (history.length === 0) {
        historySection.innerHTML = '<p>No search history found.</p>';
        return;
      }
  
      history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('search-result-item'); // Use the same class as search result item
  
        const titleLink = document.createElement('a');
        titleLink.href = item.link;
        titleLink.classList.add('search-result-title'); // Use the same class as search result title
        titleLink.textContent = item.title;
        historyItem.appendChild(titleLink);
  
        const description = document.createElement('p');
        description.classList.add('search-result-description'); // Use the same class as search result description
        description.textContent = item.description;
        historyItem.appendChild(description);
  
        const tags = document.createElement('p');
        tags.classList.add('search-result-tags'); // Use the same class as search result tags
        tags.textContent = 'Tags: ' + item.tags;
        historyItem.appendChild(tags);
  
        historySection.appendChild(historyItem);
      });
    }
  });
  