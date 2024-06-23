BAZA DE DATE:
```
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tag VARCHAR(255) NOT NULL UNIQUE,
  parent INT,
  interface BOOLEAN,
  FOREIGN KEY (parent) REFERENCES categories(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS scopes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS prog_langs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS content_scopes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT,
  scope_id INT,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (scope_id) REFERENCES scopes(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS content_prog_langs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT,
  prog_lang_id INT,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (prog_lang_id) REFERENCES prog_langs(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS content_platforms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT,
  platform_id INT,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS content_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content_id INT,
  category_id INT,
  FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  keycode INT
);
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_keycode BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  link VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_keycode) REFERENCES users(keycode)
);

CREATE TABLE history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_keycode INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  link TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
