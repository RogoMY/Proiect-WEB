document.addEventListener('DOMContentLoaded', function() {
    // Toggle for the mobile menu
    var menuToggle = document.getElementById('menu-toggle');
    var menu = document.querySelector('.menu');
    
    menuToggle.addEventListener('click', function() {
      menu.classList.toggle('active');
    });
  
    const manageCategoriesButton = document.getElementById('manage-categories-button');
    const manageContentButton = document.getElementById('manage-content-button');
    const categoryForm = document.getElementById('category-form');
    const contentForm = document.getElementById('content-form');
  
    manageCategoriesButton.addEventListener('click', function() {
      categoryForm.style.display = 'block';
      contentForm.style.display = 'none';
    });
  
    manageContentButton.addEventListener('click', function() {
      contentForm.style.display = 'block';
      categoryForm.style.display = 'none';
    });
  
    // Existing category management logic
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', function() {
        const categoryName = this.getAttribute('data-category');
        displayCategoryDetails(categoryName);
      });
    });
  
    document.querySelectorAll('.category-item span').forEach(item => {
      item.addEventListener('click', function() {
        const categoryName = this.parentNode.getAttribute('data-category');
        displayCategoryDetails(categoryName);
      });
    });
  
    document.querySelectorAll('.delete-category-btn').forEach(button => {
      button.addEventListener('click', function() {
        const categoryName = this.parentNode.getAttribute('data-category');
        alert('Delete logic for ' + categoryName);
      });
    });
  
    function displayCategoryDetails(categoryName) {
      const details = {
        'Category1': [
          { title: 'Item 1', description: 'Description 1', link: 'http://Miguel.com/1' },
          { title: 'Item 2', description: 'Description 2', link: 'http://Miguel.com/2' }
        ],
        'Category2': [
          { title: 'Item 3', description: 'Description 3', link: 'http://Coz.com/3' },
          { title: 'Item 4', description: 'Description 4', link: 'http://Coz.com/4' }
        ]
      };
  
      const contentDiv = document.getElementById('category-content');
      contentDiv.innerHTML = `<h3>${categoryName}</h3>`;
      details[categoryName].forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('category-item-details');
        itemDiv.innerHTML = `
          <p><b>Title:</b> ${item.title}</p>
          <p><b>Description:</b> ${item.description}</p>
          <p><b>Link:</b> <a href="${item.link}" target="_blank">${item.link}</a></p>
          <button class="edit-btn" style="background: transparent;">Edit</button>
          <button class="delete-btn">Delete</button>
        `;
        contentDiv.appendChild(itemDiv);
      });
    }
  });
  