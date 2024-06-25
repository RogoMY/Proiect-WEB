document.addEventListener('DOMContentLoaded', function() {
  var menuToggle = document.getElementById('menu-toggle');
  var menu = document.querySelector('.menu');

  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('active');
  });

  const manageCategoriesButton = document.getElementById('manage-categories-button');
  const manageContentButton = document.getElementById('manage-content-button');
  const editCategoriesButton = document.getElementById('edit-categories-button');
  const editTagsButton = document.getElementById('edit-tags-button');
  const editContentButton = document.getElementById('edit-content-button');
  const categoryForm = document.getElementById('category-form');
  const contentForm = document.getElementById('content-form');
  const editCategoriesForm = document.getElementById('edit-categories-form');
  const tagForm = document.getElementById('tag-form');
  const editTagsForm = document.getElementById('edit-tags-form');
  const editContentForm = document.getElementById('edit-content-form');

  let categories = []; //stocare categorii
  let tagToIdMap = {}; //mapare tag la id pentru cautare parinti
  let content = []; //stocare inregistrari

  function showAlert(message, type = 'success') {
    const alertContainer = document.createElement('div');
    alertContainer.classList.add('alert', type);
    alertContainer.textContent = message;
    document.body.appendChild(alertContainer);
    setTimeout(() => {
      alertContainer.remove();
    }, 3000);
  }

  manageCategoriesButton.addEventListener('click', function() {
    categoryForm.style.display = 'block';
    contentForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    tagForm.style.display = 'none';
    editTagsForm.style.display = 'none';
    editContentForm.style.display = 'none';
  });

  manageContentButton.addEventListener('click', function() {
    contentForm.style.display = 'block';
    categoryForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    tagForm.style.display = 'none';
    editTagsForm.style.display = 'none';
    editContentForm.style.display = 'none';
  });

  editCategoriesButton.addEventListener('click', function() {
    editCategoriesForm.style.display = 'block';
    contentForm.style.display = 'none';
    categoryForm.style.display = 'none';
    tagForm.style.display = 'none';
    editTagsForm.style.display = 'none';
    editContentForm.style.display = 'none';
    fetchCategoriesForEdit();
  });

  editTagsButton.addEventListener('click', function() {
    editTagsForm.style.display = 'block';
    contentForm.style.display = 'none';
    categoryForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    tagForm.style.display = 'none';
    editContentForm.style.display = 'none';
    fetchTagsForEdit('scopes');
  });

  editContentButton.addEventListener('click', function() {
    editContentForm.style.display = 'block';
    contentForm.style.display = 'none';
    categoryForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    tagForm.style.display = 'none';
    editTagsForm.style.display = 'none';
    fetchCategoriesWithInterfaceZero();
  });

  document.getElementById('manage-tags-button').addEventListener('click', function() {
    tagForm.style.display = 'block';
    contentForm.style.display = 'none';
    categoryForm.style.display = 'none';
    editCategoriesForm.style.display = 'none';
    editTagsForm.style.display = 'none';
    editContentForm.style.display = 'none';
  });

  document.getElementById('add-category-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const title = document.getElementById('category-title').value;
    const tag = document.getElementById('category-tag').value;
    const parentCategoryTag = document.getElementById('parent-category').value;
    const interfaceOption = document.getElementById('interface').value;

    if (!/^#[a-zA-Z0-9\-]+$/.test(tag)) {
      showAlert('Invalid tag format. Tag must start with # and contain only letters, numbers, and dashes.', 'error');
      return;
    }

    const parentCategory = tagToIdMap[parentCategoryTag] || '';

    const requestBody = JSON.stringify({ title, tag, parentCategory, interface: interfaceOption });

    fetch('/addCategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Category added successfully.');
          setTimeout(() => {
            location.reload();
          }, 1000); 
        } else {
          console.error('Failed to add category:', data.message);
          showAlert('Failed to add category: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error adding category:', error);
        showAlert('Error adding category: ' + error.message, 'error');
      });
  });

  fetch('/getParentCategories', { method: 'GET' })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const parentCategorySelect = document.getElementById('parent-category');
        data.categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.tag;
          option.textContent = category.name + ": " + category.tag;
          parentCategorySelect.appendChild(option);
          tagToIdMap[category.tag] = category.id;
        });
      } else {
        console.error('Failed to fetch parent categories:', data.message);
        showAlert('Failed to fetch parent categories: ' + data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error fetching parent categories:', error);
      showAlert('Error fetching parent categories: ' + error.message, 'error');
    });

  function fetchCategoriesForEdit() {
    fetch('/getAllCategories', { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          categories = data.categories;
          displayCategories(categories); 
        } else {
          console.error('Failed to fetch categories for edit:', data.message);
          showAlert('Failed to fetch categories for edit: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error fetching categories for edit:', error);
        showAlert('Error fetching categories for edit: ' + error.message, 'error');
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
        <input type="text" id="edit-category-parent-${category.id}" value="${category.parent_tag || ''}" data-id="${category.id}" class="edit-category-parent">
        <div class="interface-container">
          <label for="edit-category-interface-${category.id}" class="interface-label">Is Interface:</label>
          <span class="interface-span">${category.interface ? 'YES' : 'NO'}</span>
        </div>
        <button class="delete-category-btn" data-id="${category.id}">Delete</button>
      `;
      editCategoryList.appendChild(categoryItem);
    });

    document.querySelectorAll('.edit-category-name').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!this.value.trim()) {
            showAlert('Name cannot be null.', 'error');
            return;
          }
          const field = 'name';
          let value = this.value;
          updateCategoryField(this.dataset.id, field, value);
        }
      });
    });

    document.querySelectorAll('.edit-category-tag').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!this.value.trim() || !/^#[a-zA-Z0-9\-]+$/.test(this.value)) {
            showAlert('Invalid tag format. Tag must start with # and contain only letters, numbers, and dashes.', 'error');
            return;
          }
          const field = 'tag';
          let value = this.value;
          updateCategoryField(this.dataset.id, field, value);
        }
      });
    });

    document.querySelectorAll('.edit-category-parent').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!this.value.trim() || !/^#[a-zA-Z0-9\-]+$/.test(this.value)) {
            showAlert('Invalid tag format for parent. Tag must start with # and contain only letters, numbers, and dashes.', 'error');
            return;
          }
          const field = 'parent';
          let value = this.value;
          updateCategoryField(this.dataset.id, field, value);
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
          showAlert('Category updated successfully.');
        } else {
          console.error('Failed to update category:', data.message);
          showAlert('Failed to update category: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error updating category:', error);
        showAlert('Error updating category: ' + error.message, 'error');
      });
  }

  function deleteCategory(id) {
    fetch(`/deleteCategory?id=${id}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Category deleted successfully.');
          fetchCategoriesForEdit();
        } else {
          console.error('Failed to delete category:', data.message);
          showAlert('Failed to delete category: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting category:', error);
        showAlert('Error deleting category: ' + error.message, 'error');
      });
  }

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
          showAlert('Tag added successfully.');
          setTimeout(() => {
            location.reload();
          }, 1000); 
        } else {
          console.error('Failed to add tag:', data.message);
          showAlert('Failed to add tag: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error adding tag:', error);
        showAlert('Error adding tag: ' + error.message, 'error');
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
      showAlert('Failed to fetch categories: ' + categoriesData.message, 'error');
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
      showAlert('Failed to fetch scopes: ' + scopesData.message, 'error');
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
      showAlert('Failed to fetch platforms: ' + platformsData.message, 'error');
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
      showAlert('Failed to fetch programming languages: ' + programmingLanguagesData.message, 'error');
    }
  }).catch(error => {
    console.error('Error fetching data:', error);
    showAlert('Error fetching data: ' + error.message, 'error');
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
      showAlert('Invalid URL format.', 'error');
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
          showAlert('Content added successfully.');
          setTimeout(() => {
            location.reload();
          }, 3000);
        } else {
          console.error('Failed to add content:', data.message);
          showAlert('Failed to add content: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error adding content:', error);
        showAlert('Error adding content: ' + error.message, 'error');
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

  const searchInput = document.getElementById('category-search');
  searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const query = searchInput.value.toLowerCase();
      const filteredCategories = categories.filter(category => category.tag.toLowerCase().includes(query));
      displayCategories(filteredCategories);
    }
  });

  const searchContent = document.getElementById('content-search');
  searchContent.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const query = searchContent.value.toLowerCase();
      const filteredContent = content.filter(item => item.title.toLowerCase().includes(query));
      displayContent(filteredContent);
    }
  });

  const tagTypeSelect = document.getElementById('tag-type-select');
  tagTypeSelect.addEventListener('change', function() {
    fetchTagsForEdit(this.value);
  });

  const tagSearchInput = document.getElementById('tag-search');
  tagSearchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      const query = tagSearchInput.value.toLowerCase();
      const tagType = tagTypeSelect.value;
      fetchTagsForEdit(tagType, query);
    }
  });

  function fetchTagsForEdit(tagType, query = '') {
    let endpoint = '';
    switch(tagType) {
      case 'scopes':
        endpoint = '/getScopes';
        break;
      case 'platforms':
        endpoint = '/getPlatforms';
        break;
      case 'programming_languages':
        endpoint = '/getProgrammingLanguages';
        break;
      default:
        console.error('Invalid tag type');
        showAlert('Invalid tag type', 'error');
        return;
    }
  
    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const tags = data[tagType];
          const filteredTags = tags.filter(tag => tag.name.toLowerCase().includes(query));
          displayTags(filteredTags, tagType);
        } else {
          console.error(`Failed to fetch ${tagType}:`, data.message);
          showAlert(`Failed to fetch ${tagType}: ` + data.message, 'error');
        }
      })
      .catch(error => {
        console.error(`Error fetching ${tagType}:`, error);
        showAlert(`Error fetching ${tagType}: ` + error.message, 'error');
      });
  }
  
  function displayTags(tagsToDisplay, tagType) {
    const editTagList = document.getElementById('edit-tag-list');
    editTagList.innerHTML = '';
    tagsToDisplay.forEach(tag => {
      const tagItem = document.createElement('div');
      tagItem.classList.add('tag-item');
      tagItem.innerHTML = `
        <label for="edit-tag-name-${tag.id}">Name:</label>
        <input type="text" id="edit-tag-name-${tag.id}" value="${tag.name}" data-id="${tag.id}" class="edit-tag-name">
        <button class="delete-tag-btn" data-id="${tag.id}" data-type="${tagType}">Delete</button>
      `;
      editTagList.appendChild(tagItem);
    });
    
    document.querySelectorAll('.edit-tag-name').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!this.value.trim()) {
            showAlert('Name cannot be null.', 'error');
            return;
          }
          const id = this.dataset.id;
          const name = this.value;
          const type = tagType;
          updateTagField(id, name, type);
        }
      });
    });
  
    document.querySelectorAll('.delete-tag-btn').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.dataset.id;
        const type = this.dataset.type;
        deleteTag(id, type);
      });
    });
  }
  

  function updateTagField(id, name, type) {
    const requestBody = JSON.stringify({ id, name, type });

    fetch('/updateTag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Tag updated successfully.');
          fetchTagsForEdit(type);
        } else {
          console.error('Failed to update tag:', data.message);
          showAlert('Failed to update tag: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error updating tag:', error);
        showAlert('Error updating tag: ' + error.message, 'error');
      });
  }

  function deleteTag(id, type) {
    fetch(`/deleteTag?id=${id}&type=${type}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Tag deleted successfully.');
          fetchTagsForEdit(type);
        } else {
          console.error('Failed to delete tag:', data.message);
          showAlert('Failed to delete tag: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting tag:', error);
        showAlert('Error deleting tag: ' + error.message, 'error');
      });
  }

  function fetchCategoriesWithInterfaceZero() {
    fetch('/getCategoriesWithInterfaceZero', { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const categorySelect = document.getElementById('content-category-select');
          categorySelect.innerHTML = ''; 
          data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.name}: ${category.tag}`;
            categorySelect.appendChild(option);
          });
          if (data.categories.length > 0) {
            fetchContentByCategory(data.categories[0].id);
          }
          categorySelect.addEventListener('change', function() {
            fetchContentByCategory(this.value);
          });
        } else {
          console.error('Failed to fetch categories:', data.message);
          showAlert('Failed to fetch categories: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        showAlert('Error fetching categories: ' + error.message, 'error');
      });
  }

  function fetchContentByCategory(categoryId) {
    fetch(`/getContentByCategory?categoryId=${categoryId}`, { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          content = data.content; 
          displayContent(content); 
        } else {
          console.error('Failed to fetch content:', data.message);
          showAlert('Failed to fetch content: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error fetching content:', error);
        showAlert('Error fetching content: ' + error.message, 'error');
      });
  }
  
  function displayContent(contentToDisplay) {
    const editContentList = document.getElementById('edit-content-list');
    editContentList.innerHTML = '';
    contentToDisplay.forEach(item => {
      const contentItem = document.createElement('div');
      contentItem.classList.add('content-item');
      contentItem.innerHTML = `
        <label for="edit-content-title-${item.id}">Title:</label>
        <input type="text" id="edit-content-title-${item.id}" value="${item.title}" data-id="${item.id}" class="edit-content-title">
        <label for="edit-content-description-${item.id}">Description:</label>
        <textarea id="edit-content-description-${item.id}" data-id="${item.id}" class="edit-content-description">${item.description}</textarea>
        <label for="edit-content-link-${item.id}">Link:</label>
        <input type="url" id="edit-content-link-${item.id}" value="${item.link}" data-id="${item.id}" class="edit-content-link">
        <label for="edit-content-platforms-${item.id}">Platforms:</label>
        <input type="text" id="edit-content-platforms-${item.id}" value="${item.platforms ? item.platforms.split(',').join(', ') : ''}" data-id="${item.id}" class="edit-content-platforms">
        <label for="edit-content-scopes-${item.id}">Scopes:</label>
        <input type="text" id="edit-content-scopes-${item.id}" value="${item.scopes ? item.scopes.split(',').join(', ') : ''}" data-id="${item.id}" class="edit-content-scopes">
        <label for="edit-content-programming-languages-${item.id}">Programming Languages:</label>
        <input type="text" id="edit-content-programming-languages-${item.id}" value="${item.programming_languages ? item.programming_languages.split(',').join(', ') : ''}" data-id="${item.id}" class="edit-content-programming-languages">
        <button class="delete-content-btn" data-id="${item.id}">Delete</button>
      `;
      editContentList.appendChild(contentItem);
    });
  
    document.querySelectorAll('.edit-content-title').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!this.value.trim()) {
            showAlert('Title cannot be null.', 'error');
            return;
          }
          const field = 'title';
          let value = this.value;
          updateContentField(this.dataset.id, field, value);
        }
      });
    });
  
    document.querySelectorAll('.edit-content-description').forEach(textarea => {
      textarea.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!this.value.trim()) {
            showAlert('Description cannot be null.', 'error');
            return;
          }
          const field = 'description';
          let value = this.value;
          updateContentField(this.dataset.id, field, value);
        }
      });
    });
  
    document.querySelectorAll('.edit-content-link').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          if (!/^https?:\/\/[^\s$.?#].[^\s]*$/.test(this.value)) {
            showAlert('Invalid URL format.', 'error');
            return;
          }
          const field = 'link';
          let value = this.value;
          updateContentField(this.dataset.id, field, value);
        }
      });
    });
  
    document.querySelectorAll('.edit-content-platforms, .edit-content-scopes, .edit-content-programming-languages').forEach(input => {
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          const field = this.className.split('-').pop().replace('content-', '');
          let value = this.value ? this.value.split(',').map(item => item.trim()) : [];
          console.log(`Updating ${field} with value: ${JSON.stringify(value)}, Length: ${value.length}`);
          updateContentTags(this.dataset.id, field, value);
        }
      });
    });
  
    document.querySelectorAll('.delete-content-btn').forEach(button => {
      button.addEventListener('click', function() {
        deleteContent(this.dataset.id);
      });
    });
  }
  
  
  function updateContentField(id, field, value) {
    const requestBody = JSON.stringify({ id, field, value });

    fetch('/updateContentField', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Content updated successfully.');
        } else {
          console.error('Failed to update content:', data.message);
          showAlert('Failed to update content: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error updating content:', error);
        showAlert('Error updating content: ' + error.message, 'error');
      });
  }

  function updateContentTags(id, field, tags) {
    const requestBody = JSON.stringify({ id, field, tags });

    fetch('/updateContentTags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Content tags updated successfully.');
        } else {
          console.error('Failed to update content tags:', data.message);
          showAlert('Failed to update content tags: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error updating content tags:', error);
        showAlert('Error updating content tags: ' + error.message, 'error');
      });
  }

  function deleteContent(id) {
    fetch(`/deleteContent?id=${id}`, {
      method: 'DELETE'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Content deleted successfully.');
          fetchContentByCategory(document.getElementById('content-category-select').value);
        } else {
          console.error('Failed to delete content:', data.message);
          showAlert('Failed to delete content: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting content:', error);
        showAlert('Error deleting content: ' + error.message, 'error');
      });
  }
});
