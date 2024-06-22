const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'parola',
  database: 'web',
  port: 3306
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL server.');
  createTables();
});

function createTables() {
  const createCategoriesSQL = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      tag VARCHAR(255) NOT NULL UNIQUE,
      parent INT,
      interface BOOLEAN,
      FOREIGN KEY (parent) REFERENCES categories(id) ON DELETE CASCADE
    );
  `;

  const createPlatformsSQL = `
    CREATE TABLE IF NOT EXISTS platforms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    );
  `;

  const createScopesSQL = `
    CREATE TABLE IF NOT EXISTS scopes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    );
  `;

  const createProgLangsSQL = `
    CREATE TABLE IF NOT EXISTS prog_langs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    );
  `;

  const createContentsSQL = `
    CREATE TABLE IF NOT EXISTS contents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      link VARCHAR(255) NOT NULL UNIQUE
    );
  `;

  const createContentScopesSQL = `
    CREATE TABLE IF NOT EXISTS content_scopes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT,
      scope_id INT,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      FOREIGN KEY (scope_id) REFERENCES scopes(id) ON DELETE CASCADE
    );
  `;

  const createContentProgLangsSQL = `
    CREATE TABLE IF NOT EXISTS content_prog_langs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT,
      prog_lang_id INT,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      FOREIGN KEY (prog_lang_id) REFERENCES prog_langs(id) ON DELETE CASCADE
    );
  `;

  const createContentPlatformsSQL = `
    CREATE TABLE IF NOT EXISTS content_platforms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT,
      platform_id INT,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
    );
  `;

  const createContentCategoriesSQL = `
    CREATE TABLE IF NOT EXISTS content_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT,
      category_id INT,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `;
  
  const createUsersSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      keycode INT
    );
  `;

  const tables = [
    { sql: createCategoriesSQL, message: 'Categories table created.' },
    { sql: createPlatformsSQL, message: 'Platforms table created.' },
    { sql: createScopesSQL, message: 'Scopes table created.' },
    { sql: createProgLangsSQL, message: 'Programming languages table created.' },
    { sql: createContentsSQL, message: 'Contents table created.' },
    { sql: createContentScopesSQL, message: 'Content scopes table created.' },
    { sql: createContentProgLangsSQL, message: 'Content programming languages table created.' },
    { sql: createContentPlatformsSQL, message: 'Content platforms table created.' },
    { sql: createContentCategoriesSQL, message: 'Content categories table created.' },
    { sql: createUsersSQL, message: 'Users table created.' }
  ];

  function createNextTable(index) {
    if (index < tables.length) {
      connection.query(tables[index].sql, (err, results) => {
        if (err) throw err;
        console.log(tables[index].message);
        createNextTable(index + 1);
      });
    } else {
      populateCategories();
    }
  }

  createNextTable(0);
}

function populateCategories() {
  const categories = [
    { name: 'Books', tag: '#books', parent: null, interface: false },
    { name: 'Online Books', tag: '#online-books', parent: null, interface: false },
    { name: 'Courses', tag: '#courses', parent: null, interface: false },
    { name: 'Tools', tag: '#tools', parent: null, interface: true },
    { name: 'Frameworks • Libraries • Ecosystems', tag: '#frameworks--libraries--ecosystems', parent: 4, interface: false },
    { name: 'Visual Programming Languages', tag: '#visual-programming-languages', parent: 4, interface: false },
    { name: 'Sound Programming Languages', tag: '#sound-programming-languages', parent: 4, interface: false },
    { name: 'Web Programming • Libraries', tag: '#web-programming--libraries', parent: 4, interface: false },
    { name: 'Projection Mapping • VJing', tag: '#projection-mapping--vjing', parent: 4, interface: false },
    { name: 'Online', tag: '#online', parent: 4, interface: false },
    { name: 'Hardware', tag: '#hardware', parent: 4, interface: false },
    { name: 'Other', tag: '#other', parent: 4, interface: false },
    { name: 'Learning Resources', tag: '#learning-resources', parent: null, interface: true },
    { name: 'Videos', tag: '#videos', parent: 13, interface: false },
    { name: 'Talks', tag: '#talks', parent: 13, interface: false },
    { name: 'Articles', tag: '#articles', parent: 13, interface: true },
    { name: 'Shaders • OpenGL • WebGL', tag: '#shaders--opengl--webgl', parent: 16, interface: false },
    { name: 'Canvas', tag: '#canvas', parent: 16, interface: false },
    { name: 'Hardware', tag: '#hardware-1', parent: 16, interface: false },
    { name: 'Other', tag: '#other-1', parent: 16, interface: false },
    { name: 'Interactive', tag: '#interactive', parent: 13, interface: false },
    { name: 'Quick References • Cheat-Sheets', tag: '#quick-references--cheatsheets', parent: 13, interface: false },
    { name: 'Communities', tag: '#communities', parent: null, interface: true },
    { name: 'Subreddits', tag: '#subreddits', parent: 22, interface: false },
    { name: 'Slack', tag: '#slack', parent: 22, interface: false },
    { name: 'Other', tag: '#other-2', parent: 22, interface: false },
    { name: 'Math', tag: '#math', parent: null, interface: false },
    { name: 'Machine learning • Computer Vision • Ai', tag: '#machine-learning--computer-vision--ai', parent: null, interface: false },
    { name: 'Inspiration', tag: '#inspiration', parent: null, interface: false },
    { name: 'Events', tag: '#events', parent: null, interface: false },
    { name: 'Museums • Galleries', tag: '#museums--galleries', parent: null, interface: false },
    { name: 'Schools • Workshops', tag: '#schools--workshops', parent: null, interface: false },
    { name: 'Blogs • Websites', tag: '#blogs--websites', parent: null, interface: false },
    { name: 'Related', tag: '#related', parent: null, interface: false }
  ];

  const insertCategorySQL = `INSERT INTO categories (name, tag, parent, interface) VALUES (?, ?, ?, ?)`;

  categories.forEach(category => {
    connection.query(insertCategorySQL, [category.name, category.tag, category.parent, category.interface], (err, results) => {
      if (err && err.code !== 'ER_DUP_ENTRY') {
        throw err;
      }
      console.log(`Category ${category.name} processed.`);
    });
  });

  populateStaticData();
}

function populateStaticData() {
  const keywords = [
    "game", "graphics", "animation", "arduino", "web", "canvas", "3d", "2d", "algebra", "audio",
    "visual", "mac", "win", "math", "coding", "generative", "generation", "shader", "physics",
    "particle", "vector", "projects", "shepherding", "design", "code", "explain", "processing",
    "geometry", "ray", "artist", "music", "interactive", "framework", "linux", "cross-platform"
  ];

  const programmingLanguages = [
    "javascript", "python", "c++", "ruby", "php", "c#", "swift", "kotlin", "rust", "typescript",
    "html", "css", "js", "pearl", "haskell"
  ];

  const platforms = ["Win", "Mac", "iOS", "Cross-platform", "Linux", "iPhone", "iPad", "Cross-platform/Web", "Multi-platform", "macOS"];

  keywords.forEach(scope => {
    connection.query('INSERT IGNORE INTO scopes (name) VALUES (?)', [scope], (err, results) => {
      if (err) throw err;
    });
  });

  programmingLanguages.forEach(lang => {
    connection.query('INSERT IGNORE INTO prog_langs (name) VALUES (?)', [lang], (err, results) => {
      if (err) throw err;
    });
  });

  platforms.forEach(platform => {
    connection.query('INSERT IGNORE INTO platforms (name) VALUES (?)', [platform], (err, results) => {
      if (err) throw err;
    });
  });

  populateDynamicData();
}

function populateDynamicData() {
  const filePath = path.join(__dirname, 'contents.json');
  const contentList = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  contentList.forEach(item => {
    const { title, description, href, scopes, programming_languages, platforms, category } = item;

    connection.query('INSERT IGNORE INTO contents (title, description, link) VALUES (?, ?, ?)', [title, description, href], (err, results) => {
      if (err) throw err;
      const contentId = results.insertId;

      scopes.forEach(scope => {
        connection.query('SELECT id FROM scopes WHERE name = ?', [scope], (err, results) => {
          if (err) throw err;
          if (results.length > 0) {
            const scopeId = results[0].id;
            connection.query('INSERT IGNORE INTO content_scopes (content_id, scope_id) VALUES (?, ?)', [contentId, scopeId], (err, results) => {
              if (err) throw err;
            });
          }
        });
      });

      programming_languages.forEach(lang => {
        connection.query('SELECT id FROM prog_langs WHERE name = ?', [lang], (err, results) => {
          if (err) throw err;
          if (results.length > 0) {
            const langId = results[0].id;
            connection.query('INSERT IGNORE INTO content_prog_langs (content_id, prog_lang_id) VALUES (?, ?)', [contentId, langId], (err, results) => {
              if (err) throw err;
            });
          }
        });
      });

      platforms.forEach(platform => {
        connection.query('SELECT id FROM platforms WHERE name = ?', [platform], (err, results) => {
          if (err) throw err;
          if (results.length > 0) {
            const platformId = results[0].id;
            connection.query('INSERT IGNORE INTO content_platforms (content_id, platform_id) VALUES (?, ?)', [contentId, platformId], (err, results) => {
              if (err) throw err;
            });
          }
        });
      });

      connection.query('SELECT id FROM categories WHERE tag = ?', [category], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
          const categoryId = results[0].id;
          connection.query('INSERT IGNORE INTO content_categories (content_id, category_id) VALUES (?, ?)', [contentId, categoryId], (err, results) => {
            if (err) throw err;
          });
        }
      });
    });
  });

  console.log('Dynamic data populated successfully.');
}
