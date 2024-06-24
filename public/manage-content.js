document.addEventListener('DOMContentLoaded', function() {
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');

  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('active');
  });

  const manageCategoriesButton = document.getElementById('manage-categories-button');
  const manageContentButton = document.getElementById('manage-content-button');
  const editCategoriesButton = document.getElementById('edit-categories-button');
  const categoryForm = document.getElementById('category-form');
  const contentForm = document.getElementById('content-form');
  const editCategoriesForm = document.getElementById('edit-categories-form');
  const tagForm = document.getElementById('tag-form');

  let categories = []; 

  manageCategoriesButton.addEventListener('click', function() {
    categoryForm.style.display = 'block';
    contentForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    tagForm.style.display = 'none';
  });

  manageContentButton.addEventListener('click', function() {
    contentForm.style.display = 'block';
    categoryForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    tagForm.style.display = 'none';
  });

  editCategoriesButton.addEventListener('click', function() {
    editCategoriesForm.style.display = 'block';
    contentForm.style.display = 'none';
    categoryForm.style.display = 'none';
    tagForm.style.display = 'none';
    fetchCategoriesForEdit();
  });

  document.getElementById('manage-tags-button').addEventListener('click', function() {
    tagForm.style.display = 'block';
    contentForm.style.display = 'none';
    categoryForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
  });

  document.getElementById('add-category-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const title = document.getElementById('category-title').value;
    const tag = document.getElementById('category-tag').value;
    const parentCategory = document.getElementById('parent-category').value;
    const interfaceOption = document.getElementById('interface').value;

    if (!/^#[a-zA-Z0-9\-]+$/.test(tag)) {
      alert('Invalid tag format. Tag must start with # and contain only letters, numbers, and dashes.');
      return;
    }

    const requestBody = JSON.stringify({ title, tag, parentCategory, interface: interfaceOption });

    fetch('/addCategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Category added successfully.');
          location.reload();
        } else {
          console.error('Failed to add category:', data.message);
        }
      })
      .catch(error => {
        console.error('Error adding category:', error);
      });
  });

  fetch('/getParentCategories', { method: 'GET' })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const parentCategorySelect = document.getElementById('parent-category');
        data.categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name + ": " + category.tag;
          parentCategorySelect.appendChild(option);
        });
      } else {
        console.error('Failed to fetch parent categories:', data.message);
      }
    })
    .catch(error => {
      console.error('Error fetching parent categories:', error);
    });

  function fetchCategoriesForEdit() {
    fetch('/getAllCategories', { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          categories = data.categories; // Store the fetched categories
          displayCategories(categories); // Display all categories initially
        } else {
          console.error('Failed to fetch categories for edit:', data.message);
        }
      })
      .catch(error => {
        console.error('Error fetching categories for edit:', error);
      });
  }

  function displayCategories(categoriesToDisplay) {
    const editCategoryList = document.getElementById('edit-category-list');
    editCategoryList.innerHTML = '';
    categoriesToDisplay.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.classList.add('category-item');
      categoryItem.innerHTML = `
        <label for="edit-category-name-${category.id}">Name:</label>
        <input type="text" id="edit-category-name-${category.id}" value="${category.name}" data-id="${category.id}" class="edit-category-name">
        <label for="edit-category-tag-${category.id}">Tag:</label>
        <input type="text" id="edit-category-tag-${category.id}" value="${category.tag}" data-id="${category.id}" class="edit-category-tag">
        <label for="edit-category-parent-${category.id}">Parent:</label>
        <input type="text" id="edit-category-parent-${category.id}" value="${category.parent || ''}" data-id="${category.id}" class="edit-category-parent">
        <div class="interface-container">
          <label for="edit-category-interface-${category.id}" class="interface-label">Is Interface:</label>
          <span class="interface-span">${category.interface ? 'YES' : 'NO'}</span>
        </div>
        <button class="delete-category-btn" data-id="${category.id}">Delete</button>
      `;
      editCategoryList.appendChild(categoryItem);
    });

    document.querySelectorAll('.edit-category-name, .edit-category-tag, .edit-category-parent').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          updateCategoryField(this.dataset.id, this.className.split('-')[2], this.value);
        }
      });
    });

    document.querySelectorAll('.delete-category-btn').forEach(button => {
      button.addEventListener('click', function() {
        deleteCategory(this.dataset.id);
      });
    });
  }

  function updateCategoryField(id, field, value) {
    const requestBody = JSON.stringify({ id, field, value });

    fetch('/updateCategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Category updated successfully.');
        } else {
          console.error('Failed to update category:', data.message);
        }
      })
      .catch(error => {
        console.error('Error updating category:', error);
      });
  }

  function deleteCategory(id) {
    fetch(`/deleteCategory?id=${id}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Category deleted successfully.');
          fetchCategoriesForEdit();
        } else {
          console.error('Failed to delete category:', data.message);
        }
      })
      .catch(error => {
        console.error('Error deleting category:', error);
      });
  }

  document.getElementById('category-search').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const searchTerm = event.target.value.toLowerCase();
      const filteredCategories = categories.filter(category =>
        category.tag.toLowerCase().includes(searchTerm)
      );
      displayCategories(filteredCategories);
    }
  });

  document.getElementById('add-tag-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const type = document.getElementById('tag-type').value;
    const name = document.getElementById('tag-name').value;

    fetch('/addTag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Tag added successfully.');
          location.reload();
        } else {
          console.error('Failed to add tag:', data.message);
        }
      })
      .catch(error => {
        console.error('Error adding tag:', error);
      });
  });

  Promise.all([
    fetch('/getCategories').then(response => response.json()),
    fetch('/getScopes').then(response => response.json()),
    fetch('/getPlatforms').then(response => response.json()),
    fetch('/getProgrammingLanguages').then(response => response.json())
  ]).then(([categoriesData, scopesData, platformsData, programmingLanguagesData]) => {
    if (categoriesData.success) {
      const categorySelect = document.getElementById('content-category');
      categoriesData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
      });
    } else {
      console.error('Failed to fetch categories:', categoriesData.message);
    }

    if (scopesData.success) {
      const scopesSelect = document.getElementById('content-scopes');
      scopesData.scopes.forEach(scope => {
        const option = document.createElement('option');
        option.value = scope.id;
        option.textContent = scope.name;
        scopesSelect.appendChild(option);
      });
    } else {
      console.error('Failed to fetch scopes:', scopesData.message);
    }

    if (platformsData.success) {
      const platformsSelect = document.getElementById('content-platforms');
      platformsData.platforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform.id;
        option.textContent = platform.name;
        platformsSelect.appendChild(option);
      });
    } else {
      console.error('Failed to fetch platforms:', platformsData.message);
    }

    if (programmingLanguagesData.success) {
      const programmingLanguagesSelect = document.getElementById('content-programming-languages');
      programmingLanguagesData.programming_languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language.id;
        option.textContent = language.name;
        programmingLanguagesSelect.appendChild(option);
      });
    } else {
      console.error('Failed to fetch programming languages:', programmingLanguagesData.message);
    }
  }).catch(error => {
    console.error('Error fetching data:', error);
  });

  document.getElementById('add-content-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const title = document.getElementById('content-title').value;
    const description = document.getElementById('content-description').value;
    const link = document.getElementById('content-link').value;
    const category = document.getElementById('content-category').value;
    const scopes = Array.from(document.getElementById('content-scopes').selectedOptions).map(option => option.value);
    const platforms = Array.from(document.getElementById('content-platforms').selectedOptions).map(option => option.value);
    const programmingLanguages = Array.from(document.getElementById('content-programming-languages').selectedOptions).map(option => option.value);

    if (!/^https?:\/\/[^\s$.?#].[^\s]*$/.test(link)) {
      alert('Invalid URL format.');
      return;
    }

    const requestBody = JSON.stringify({
      title,
      description,
      link,
      category,
      scopes,
      platforms,
      programmingLanguages
    });

    fetch('/addContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Content added successfully.');
          location.reload();
        } else {
          console.error('Failed to add content:', data.message);
        }
      })
      .catch(error => {
        console.error('Error adding content:', error);
      });
  });

  document.getElementById('logout-link').addEventListener('click', function(event) {
    event.preventDefault();
    fetch('/logout', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.cookie = 'adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = 'login.html';
      } else {
        alert('Logout failed.');
      }
    })
    .catch(error => {
      alert('Logout failed.');
    });
  });
});
