document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('export-data-button');
    const importForm = document.getElementById('import-data-form');
  
    exportButton.addEventListener('click', function() {
      fetch('/exportData', { method: 'GET' })
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'refi.json';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error('Error exporting data:', error);
          alert('Error exporting data: ' + error.message);
        });
    });
  
    importForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const formData = new FormData(importForm);
  
      fetch('/importData', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Data imported successfully.');
        } else {
          alert('Error importing data: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error importing data:', error);
        alert('Error importing data: ' + error.message);
      });
    });
  });
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
