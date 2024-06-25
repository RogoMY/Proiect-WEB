const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Cookies = require('cookies');
const http = require('http');
const url = require('url');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const multer = require('multer');

const saltRounds = 10;
const usbKeyPath = 'F:\\key.txt'; 
const predefinedRawKey = 'success';
const adminToken = '$2b$10$OBkQgGs1au3Ms8EW2KmDQ.tf9GuL5EV.IJ0Mw.vP7FU0.M9prYMte'; 
const upload = multer({ dest: 'uploads/' });

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'bd2024',
  database: 'web',
  port: 3306
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the MySQL server.');

  connection.query("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))", (err, results) => {
    if (err) {
      console.error('Error disabling ONLY_FULL_GROUP_BY:', err);
      return;
    }
    console.log('ONLY_FULL_GROUP_BY disabled');
    startServer();
  });
});

function startServer() {
  const server = http.createServer((req, res) => {
    const cookies = new Cookies(req, res);
    const userId = cookies.get('userId');
    const adminToken = cookies.get('adminToken');

    console.log('Cookies received:', { userId, adminToken });

    const parsedUrl = url.parse(req.url);
    let pathname = `./public${parsedUrl.pathname}`;
    console.log(`Received ${req.method} request for ${pathname}`);
    const restrictedPages = [
      './public/homepage.html',
      './public/favorites.html',
      './public/search-results.html',
      './public/history.html'
    ];

    if (!userId && restrictedPages.includes(pathname)) {
      res.writeHead(302, { 'Location': '/login.html' });
      res.end();
      return;
    }
    if (pathname === './public/fetchFavorites' && req.method === 'GET') {
      handleFetchFavorites(req, res);
    } else if (pathname === './public/toggleFavorite' && req.method === 'POST') {
      handleToggleFavorite(req, res);
    } else if ((pathname === './public/admin.html' || pathname === './public/manage-content.html') && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleFileRequest(pathname, res);
      });
    } else if (pathname === './public/check-auth' && req.method === 'GET') {
      handleCheckAuth(req, res);
    } else if (pathname === './public/getParentCategories' && req.method === 'GET') {
      handleGetParentCategories(req, res);
    } else if (pathname === './public/addCategory' && req.method === 'POST') {
      handleAddCategory(req, res);
    } else if (!userId && (pathname === './public/homepage.html' || pathname === './public/favorites.html' || pathname === './public/search-results.html')) {
      res.writeHead(302, { 'Location': '/login.html' });
      res.end();
      return;
    } else if (userId && (pathname === './public/login.html' || pathname === './public/register.html' || pathname === './public/')) {
      res.writeHead(302, { 'Location': '/homepage.html' });
      res.end();
      return;
    } else if (pathname === './public/register' && req.method === 'POST') {
      handleRegister(req, res);
    } else if (pathname === './public/login' && req.method === 'POST') {
      handleLogin(req, res);
    } else if (pathname === './public/logout' && req.method === 'POST') {
      handleLogout(req, res);
    } else if (pathname === './public/getUsers' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleGetUsers(req, res);
      });
    } else if (pathname === './public/changeEmail' && req.method === 'POST') {
      verifyToken(req, res, () => {
        handleChangeEmail(req, res);
      });
    } else if (pathname === './public/changePassword' && req.method === 'POST') {
      verifyToken(req, res, () => {
        handleChangePassword(req, res);
      });
    } else if (pathname === './public/searchUsers' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleSearchUsers(req, res);
      });
    } else if (pathname === './public/search' && req.method === 'POST') {
      handleSearch(req, res);
    } else if (pathname === './public/logHistory' && req.method === 'POST') {
      handleLogHistory(req,res,cookies);
    } else if (pathname === './public/getHistory' && req.method === 'GET') {
      handleGetHistory(req,res,cookies);    
    } else if (pathname === './public/addTag' && req.method === 'POST') {
      verifyToken(req, res, () => {
        handleAddTag(req, res);
      });
    } else if (pathname === './public/getCategories' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleGetCategories(req, res);
      });
    } else if (pathname === './public/getScopes' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleGetScopes(req, res);
      });
    } else if (pathname === './public/getPlatforms' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleGetPlatforms(req, res);
      });
    } else if (pathname === './public/getProgrammingLanguages' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleGetProgrammingLanguages(req, res);
      });
    } else if (pathname === './public/addContent' && req.method === 'POST') {
      verifyToken(req, res, () => {
        handleAddContent(req, res);
      });
    } else if (pathname === './public/updateCategory' && req.method === 'POST') {
      verifyToken(req, res, () => {
        updateCategory(req, res);
      });
    } else if (pathname === './public/deleteCategory' && req.method === 'DELETE') {
      verifyToken(req, res, () => {
        deleteCategory(req, res);
      });
    }

    else if (pathname === './public/getAllCategories' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleGetAllCategories(req, res);
      });
    }  else if (pathname === './public/updateTag' && req.method === 'POST') {
      verifyToken(req, res, () => {
        updateTag(req, res);
      });
    } else if (pathname === './public/deleteTag' && req.method === 'DELETE') {
      verifyToken(req, res, () => {
        deleteTag(req, res);
      });
    } else if (pathname === './public/getCategoriesWithInterfaceZero' && req.method === 'GET') {
      verifyToken(req, res, () => {
        getCategoriesWithInterfaceZero(req, res);
      });
    } else if (pathname === './public/getContentByCategory' && req.method === 'GET') {
      verifyToken(req, res, () => {
        getContentByCategory(req, res);
      });
    } else if (pathname === './public/updateContentField' && req.method === 'POST') {
      verifyToken(req, res, () => {
        updateContentField(req, res);
      });
    } else if (pathname === './public/updateContentTags' && req.method === 'POST') {
      verifyToken(req, res, () => {
        updateContentTags(req, res);
      });
    } else if (pathname === './public/deleteContent' && req.method === 'DELETE') {
      verifyToken(req, res, () => {
        deleteContent(req, res);
      });
    } else if (pathname === './public/exportData' && req.method === 'GET') {
      verifyToken(req, res, () => {
        handleExportData(req, res);
      });
    } else if (pathname === './public/importData' && req.method === 'POST') {
      verifyToken(req, res, () => {
        handleImportData(req, res);
      });
    }
    
    

    else {
      handleFileRequest(pathname, res);
    }
  });

  server.listen(5000, () => {
    console.log("Server listening on port 5000");
  });
}

function handleFileRequest(pathname, res) {
  if (pathname.endsWith('/')) {
    pathname += 'login.html'; 
  }

  fs.exists(pathname, exist => {
    if (!exist) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    fs.readFile(pathname, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        const ext = path.parse(pathname).ext;
        if (ext === '.html') {
          res.setHeader('Content-type', 'text/html');
        }
        res.end(data);
      }
    });
  });
}

function handleFetchFavorites(req, res) {
  const userKeycode = new Cookies(req, res).get('userId');

  if (!userKeycode) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'User not authenticated' }));
    return;
  }

  const fetchFavoritesQuery = 'SELECT title, link, description FROM favorites WHERE user_keycode = ?';
  connection.query(fetchFavoritesQuery, [userKeycode], (error, results) => {
    if (error) {
      console.error('Error fetching favorites:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, favorites: results }));
  });
}

function handleToggleFavorite(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { title, link, description } = JSON.parse(body);
    const userKeycode = new Cookies(req, res).get('userId');

    if (!userKeycode) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'User not authenticated' }));
      return;
    }

    const checkFavoriteQuery = 'SELECT COUNT(*) AS isFavorite FROM favorites WHERE user_keycode = ? AND link = ?';
    connection.query(checkFavoriteQuery, [userKeycode, link], (error, results) => {
      if (error) {
        console.error('Error checking favorite:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
        return;
      }

      const isFavorite = results[0].isFavorite > 0;
      const query = isFavorite ? 'DELETE FROM favorites WHERE user_keycode = ? AND link = ?' : 'INSERT INTO favorites (user_keycode, title, link, description) VALUES (?, ?, ?, ?)';
      const params = isFavorite ? [userKeycode, link] : [userKeycode, title, link, description];

      connection.query(query, params, (error, results) => {
        if (error) {
          console.error('Error toggling favorite:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });
    });
  });
}

function handleCheckAuth(req, res) {
  const cookies = new Cookies(req, res);
  const userId = cookies.get('userId');
  const adminToken = cookies.get('adminToken');

  if (userId || adminToken) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false }));
  }
}

function handleRegister(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    console.log('Received registration data:', body);
    const { username, email, password } = JSON.parse(body);

    getUserByUsername(username, (error, user) => {
      if (error) {
        sendErrorResponse(res, 'Error querying the database', error);
        console.error('Error querying the database:', error);
        return;
      }

      if (user) {
        sendErrorResponse(res, 'Username already exists');
        console.log('Username already exists:', username);
        return;
      }

      getHighestId((error, highestId) => {
        if (error) {
          console.error('Failed to get the highest id:', error);
          res.writeHead(500);
          res.end('Internal server error');
          return;
        }

        const newId = highestId + 1;
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
          if (err) {
            sendErrorResponse(res, 'Error hashing the password', err);
            console.error('Error hashing the password:', err);
            return;
          }

          createUser(username, hashedPassword, email, newId, (error, results) => {
            if (error) {
              sendErrorResponse(res, 'Error adding user to the database', error);
              console.error('Error adding user to the database:', error);
              return;
            }

            sendClientSuccessResponse(res, 'Register successful');
            console.log('User registered successfully:', username);
          });
        });
      });
    });
  });
}

function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    console.log('Received login data:', body);
    const { username, password } = JSON.parse(body);

    getUserByUsername(username, (error, user) => {
      if (error) {
        sendErrorResponse(res, 'Error retrieving user from the database', error);
        console.error('Error retrieving user from the database:', error);
        return;
      }

      if (!user) {
        sendErrorResponse(res, 'Invalid username or password');
        console.log('Invalid username or password:', username);
        return;
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          sendErrorResponse(res, 'Error comparing passwords', err);
          console.error('Error comparing passwords:', err);
          return;
        }

        if (result) {
          if (user.keycode === null) {
            //citim de pe usb si comparam cu cheia predefinita
            fs.readFile(usbKeyPath, 'utf8', (err, key) => {
              if (err) {
                sendErrorResponse(res, 'Error reading key from USB', err);
                console.error('Error reading key from USB:', err);
                return;
              }
              key = key.trim();
              console.log('Read key from USB:', key);
              if (key === predefinedRawKey) {
                const cookies = new Cookies(req, res);
                cookies.set('adminToken', adminToken, { httpOnly: true });
                console.log('Setting admin token:', adminToken);
                sendAdminSuccessResponse(res, 'Admin login successful', adminToken);
                console.log('Admin login successful:', username);
              } else {
                sendErrorResponse(res, 'Invalid admin key');
                console.log('Invalid admin key');
              }
            });
          } else {
            //logare normala utilziator
            const cookies = new Cookies(req, res);
            cookies.set('userId', user.keycode, { httpOnly: true });
            sendClientSuccessResponse(res, 'Login successful');
            console.log('Login successful:', username);
          }
        } else {
          sendErrorResponse(res, 'Invalid username or password');
          console.log('Invalid username or password:', username);
        }
      });
    });
  });
}

function handleLogout(req, res) {
  console.log('Logout request received');
  const cookies = new Cookies(req, res);
  cookies.set('userId', '', { expires: new Date(0), httpOnly: true });
  cookies.set('adminToken', '', { expires: new Date(0), httpOnly: true });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message: 'Logout successful' }));
}

function handleGetUsers(req, res) {
  const queryObject = url.parse(req.url, true).query;
  const page = parseInt(queryObject.page) || 1;
  const limit = parseInt(queryObject.limit) || 10;
  const offset = (page - 1) * limit;

  const query = 'SELECT username, email, password, keycode FROM users LIMIT ? OFFSET ?';
  connection.query(query, [limit, offset], (error, results) => {
    if (error) {
      sendErrorResponse(res, 'Error fetching users', error);
      return;
    }
    console.log('Fetched users:', results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, users: results }));
  });
}

function handleChangeEmail(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { username, newEmail } = JSON.parse(body);
    console.log(`Received changeEmail request for username: ${username}, newEmail: ${newEmail}`);
    updateUserEmail(username, newEmail, (error, results) => {
      if (error) {
        console.error('Error updating email:', error);
        sendErrorResponse(res, 'Error updating email', error);
        return;
      }
      console.log('Email updated successfully:', results);
      sendAdminSuccessResponse(res, 'Email updated successfully');
    });
  });
}

function handleChangePassword(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { username, newPassword } = JSON.parse(body);
    console.log(`Received changePassword request for username: ${username}, newPassword: ${newPassword}`);
    updateUserPassword(username, newPassword, (error, results) => {
      if (error) {
        console.error('Error updating password:', error);
        sendErrorResponse(res, 'Error updating password', error);
        return;
      }
      console.log('Password updated successfully:', results);
      sendAdminSuccessResponse(res, 'Password updated successfully');
    });
  });
}

function handleLogHistory(req, res, cookies) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    console.log('Raw request body:', body);

    try {
      const userKeycode = cookies.get('userId');
      console.log('User Keycode from Cookie:', userKeycode);

      if (!userKeycode) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'User not authenticated' }));
        return;
      }

      const parsedBody = JSON.parse(body);
      console.log('Parsed request body:', parsedBody);

      const { title, link, description } = parsedBody;
      console.log('Extracted Data:', { title, link, description });

      if (!title || !link) {
        console.log('Missing title or link in request body');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad request' }));
        return;
      }

      const insertHistoryQuery = 'INSERT INTO history (user_keycode, title, link, description) VALUES (?, ?, ?, ?)';
      connection.query(insertHistoryQuery, [userKeycode, title, link, description], (error, results) => {
        if (error) {
          console.error('Error logging search history:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
          return;
        }

        console.log('Log History - Insert Results:', results);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Search history logged' }));
      });
    } catch (e) {
      console.error('Error processing request:', e);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Bad request' }));
    }
  });
}

function handleSearchUsers(req, res) {
  const queryObject = url.parse(req.url, true).query;
  const searchTerm = queryObject.q;
  
  if (!searchTerm) {
    sendErrorResponse(res, 'No search term provided');
    return;
  }

  const query = 'SELECT username, email, password, keycode FROM users WHERE username LIKE ?';
  connection.query(query, [`%${searchTerm}%`], (error, results) => {
    if (error) {
      sendErrorResponse(res, 'Error searching users', error);
      return;
    }
    console.log('Searched users:', results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, users: results }));
  });
}

function getPlural(word) {
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  } else if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  } else {
    return word + 's';
  }
}

function handleGetHistory(req, res, cookies) {
  const userKeycode = cookies.get('userId');
  console.log('User Keycode from Cookie:', userKeycode);

  if (!userKeycode) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'User not authenticated' }));
    return;
  }

  const fetchHistoryQuery = 'SELECT title, link, description FROM history WHERE user_keycode = ? ORDER BY timestamp ASC';
  connection.query(fetchHistoryQuery, [userKeycode], (error, results) => {
    if (error) {
      console.error('Error fetching search history:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
      return;
    }

    console.log('Fetched search history:', results);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, history: results }));
  });
}

function handleSearch(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { query } = JSON.parse(body);
    const userKeycode = new Cookies(req, res).get('userId');

    if (!userKeycode) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'User not authenticated' }));
      return;
    }

    console.log('Received search query:', query);

    const redundantWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'so', 'if', 'then', 'about', 'how', 'to', 'make', 'for', 'with', 'in', 'on', 'at', 'by', 'from', 'up', 'down', 'of', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'being', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'as', 'such', 'can', 'could', 'should', 'would', 'will', 'shall', 'might', 'must', 'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose', 'why', 'where', 'when', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'look', 'same', 'so', 'than', 'too', 'very', 'use'
    ]);

    const words = query.split(/\s+/).map(word => word.toLowerCase()).filter(word => !redundantWords.has(word));

    if (words.length === 0) {
      sendErrorResponse(res, 'No relevant search terms found');
      return;
    }

    let allResults = {};
    let queryPromises = [];

    words.forEach(word => {
      const pluralWord = getPlural(word);
      console.log('Processing word:', word);
      console.log('Processing plural word:', pluralWord);

      const singularLikeExact = `% ${word} %`;
      const pluralLikeExact = `% ${pluralWord} %`;
      const singularLikePartial1 = `% ${word}%`;
      const pluralLikePartial1 = `% ${pluralWord}%`;
      const singularLikePartial2 = `%${word} %`;
      const pluralLikePartial2 = `%${pluralWord} %`;
      const singularLikeAnywhere = `%${word}%`;
      const pluralLikeAnywhere = `%${pluralWord}%`;

      const sqlQuery = `
        SELECT 
          c.id, c.title, c.link, c.description, 
          GROUP_CONCAT(DISTINCT cat.name ORDER BY cat.name) AS category, 
          GROUP_CONCAT(DISTINCT plat.name ORDER BY plat.name) AS platform, 
          GROUP_CONCAT(DISTINCT sco.name ORDER BY sco.name) AS scopes, 
          GROUP_CONCAT(DISTINCT lang.name ORDER BY lang.name) AS programming_languages,
          (IF(c.title LIKE ${connection.escape(singularLikeExact)}, 10, 0) + 
          IF(c.title LIKE ${connection.escape(pluralLikeExact)}, 10, 0) +
          IF(c.description LIKE ${connection.escape(singularLikeExact)}, 5, 0) +
          IF(c.description LIKE ${connection.escape(pluralLikeExact)}, 5, 0) +
          IF(cat.name LIKE ${connection.escape(singularLikeExact)}, 3, 0) +
          IF(cat.name LIKE ${connection.escape(pluralLikeExact)}, 3, 0) +
          IF(plat.name LIKE ${connection.escape(singularLikeExact)}, 3, 0) +
          IF(plat.name LIKE ${connection.escape(pluralLikeExact)}, 3, 0) +
          IF(sco.name LIKE ${connection.escape(singularLikeExact)}, 3, 0) +
          IF(sco.name LIKE ${connection.escape(pluralLikeExact)}, 3, 0) +
          IF(lang.name LIKE ${connection.escape(singularLikeExact)}, 3, 0) +
          IF(lang.name LIKE ${connection.escape(pluralLikeExact)}, 3, 0) +

          IF(c.title LIKE ${connection.escape(singularLikePartial1)}, 7, 0) +
          IF(c.title LIKE ${connection.escape(pluralLikePartial1)}, 7, 0) +
          IF(c.description LIKE ${connection.escape(singularLikePartial1)}, 4, 0) +
          IF(c.description LIKE ${connection.escape(pluralLikePartial1)}, 4, 0) +
          IF(cat.name LIKE ${connection.escape(singularLikePartial1)}, 2, 0) +
          IF(cat.name LIKE ${connection.escape(pluralLikePartial1)}, 2, 0) +
          IF(plat.name LIKE ${connection.escape(singularLikePartial1)}, 2, 0) +
          IF(plat.name LIKE ${connection.escape(pluralLikePartial1)}, 2, 0) +
          IF(sco.name LIKE ${connection.escape(singularLikePartial1)}, 2, 0) +
          IF(sco.name LIKE ${connection.escape(pluralLikePartial1)}, 2, 0) +
          IF(lang.name LIKE ${connection.escape(singularLikePartial1)}, 2, 0) +
          IF(lang.name LIKE ${connection.escape(pluralLikePartial1)}, 2, 0) +

          IF(c.title LIKE ${connection.escape(singularLikePartial2)}, 5, 0) +
          IF(c.title LIKE ${connection.escape(pluralLikePartial2)}, 5, 0) +
          IF(c.description LIKE ${connection.escape(singularLikePartial2)}, 3, 0) +
          IF(c.description LIKE ${connection.escape(pluralLikePartial2)}, 3, 0) +
          IF(cat.name LIKE ${connection.escape(singularLikePartial2)}, 1, 0) +
          IF(cat.name LIKE ${connection.escape(pluralLikePartial2)}, 1, 0) +
          IF(plat.name LIKE ${connection.escape(singularLikePartial2)}, 1, 0) +
          IF(plat.name LIKE ${connection.escape(pluralLikePartial2)}, 1, 0) +
          IF(sco.name LIKE ${connection.escape(singularLikePartial2)}, 1, 0) +
          IF(sco.name LIKE ${connection.escape(pluralLikePartial2)}, 1, 0) +
          IF(lang.name LIKE ${connection.escape(singularLikePartial2)}, 1, 0) +
          IF(lang.name LIKE ${connection.escape(pluralLikePartial2)}, 1, 0) +

          IF(c.title LIKE ${connection.escape(singularLikeAnywhere)}, 3, 0) +
          IF(c.title LIKE ${connection.escape(pluralLikeAnywhere)}, 3, 0) +
          IF(c.description LIKE ${connection.escape(singularLikeAnywhere)}, 2, 0) +
          IF(c.description LIKE ${connection.escape(pluralLikeAnywhere)}, 2, 0) +
          IF(cat.name LIKE ${connection.escape(singularLikeAnywhere)}, 1, 0) +
          IF(cat.name LIKE ${connection.escape(pluralLikeAnywhere)}, 1, 0) +
          IF(plat.name LIKE ${connection.escape(singularLikeAnywhere)}, 1, 0) +
          IF(plat.name LIKE ${connection.escape(pluralLikeAnywhere)}, 1, 0) +
          IF(sco.name LIKE ${connection.escape(singularLikeAnywhere)}, 1, 0) +
          IF(sco.name LIKE ${connection.escape(pluralLikeAnywhere)}, 1, 0) +
          IF(lang.name LIKE ${connection.escape(singularLikeAnywhere)}, 1, 0) +
          IF(lang.name LIKE ${connection.escape(pluralLikeAnywhere)}, 1, 0)) AS relevance_score
        FROM 
          contents c
        LEFT JOIN 
          content_categories cc ON c.id = cc.content_id
        LEFT JOIN 
          categories cat ON cc.category_id = cat.id
        LEFT JOIN 
          content_platforms cp ON c.id = cp.content_id
        LEFT JOIN 
          platforms plat ON cp.platform_id = plat.id
        LEFT JOIN 
          content_scopes cs ON c.id = cs.content_id
        LEFT JOIN 
          scopes sco ON cs.scope_id = sco.id
        LEFT JOIN 
          content_prog_langs cpl ON c.id = cpl.content_id
        LEFT JOIN 
          prog_langs lang ON cpl.prog_lang_id = lang.id
        WHERE 
          (c.title LIKE ${connection.escape(singularLikeExact)}
          OR c.description LIKE ${connection.escape(singularLikeExact)}
          OR cat.name LIKE ${connection.escape(singularLikeExact)}
          OR plat.name LIKE ${connection.escape(singularLikeExact)}
          OR sco.name LIKE ${connection.escape(singularLikeExact)}
          OR lang.name LIKE ${connection.escape(singularLikeExact)}) 
          OR (c.title LIKE ${connection.escape(pluralLikeExact)}
          OR c.description LIKE ${connection.escape(pluralLikeExact)}
          OR cat.name LIKE ${connection.escape(pluralLikeExact)}
          OR plat.name LIKE ${connection.escape(pluralLikeExact)}
          OR sco.name LIKE ${connection.escape(pluralLikeExact)}
          OR lang.name LIKE ${connection.escape(pluralLikeExact)}) 
          OR (c.title LIKE ${connection.escape(singularLikePartial1)}
          OR c.description LIKE ${connection.escape(singularLikePartial1)}
          OR cat.name LIKE ${connection.escape(singularLikePartial1)}
          OR plat.name LIKE ${connection.escape(singularLikePartial1)}
          OR sco.name LIKE ${connection.escape(singularLikePartial1)}
          OR lang.name LIKE ${connection.escape(singularLikePartial1)}) 
          OR (c.title LIKE ${connection.escape(pluralLikePartial1)}
          OR c.description LIKE ${connection.escape(pluralLikePartial1)}
          OR cat.name LIKE ${connection.escape(pluralLikePartial1)}
          OR plat.name LIKE ${connection.escape(pluralLikePartial1)}
          OR sco.name LIKE ${connection.escape(pluralLikePartial1)}
          OR lang.name LIKE ${connection.escape(pluralLikePartial1)}) 
          OR (c.title LIKE ${connection.escape(singularLikePartial2)}
          OR c.description LIKE ${connection.escape(singularLikePartial2)}
          OR cat.name LIKE ${connection.escape(singularLikePartial2)}
          OR plat.name LIKE ${connection.escape(singularLikePartial2)}
          OR sco.name LIKE ${connection.escape(singularLikePartial2)}
          OR lang.name LIKE ${connection.escape(singularLikePartial2)}) 
          OR (c.title LIKE ${connection.escape(pluralLikePartial2)}
          OR c.description LIKE ${connection.escape(pluralLikePartial2)}
          OR cat.name LIKE ${connection.escape(pluralLikePartial2)}
          OR plat.name LIKE ${connection.escape(pluralLikePartial2)}
          OR sco.name LIKE ${connection.escape(pluralLikePartial2)}
          OR lang.name LIKE ${connection.escape(pluralLikePartial2)}) 
          OR (c.title LIKE ${connection.escape(singularLikeAnywhere)}
          OR c.description LIKE ${connection.escape(singularLikeAnywhere)}
          OR cat.name LIKE ${connection.escape(singularLikeAnywhere)}
          OR plat.name LIKE ${connection.escape(singularLikeAnywhere)}
          OR sco.name LIKE ${connection.escape(singularLikeAnywhere)}
          OR lang.name LIKE ${connection.escape(singularLikeAnywhere)}) 
          OR (c.title LIKE ${connection.escape(pluralLikeAnywhere)}
          OR c.description LIKE ${connection.escape(pluralLikeAnywhere)}
          OR cat.name LIKE ${connection.escape(pluralLikeAnywhere)}
          OR plat.name LIKE ${connection.escape(pluralLikeAnywhere)}
          OR sco.name LIKE ${connection.escape(pluralLikeAnywhere)}
          OR lang.name LIKE ${connection.escape(pluralLikeAnywhere)})
        GROUP BY
          c.id, c.title, c.link, c.description
      `;

      console.log('Executing SQL query:', sqlQuery);

      queryPromises.push(new Promise((resolve, reject) => {
        connection.query(sqlQuery, (error, results) => {
          if (error) {
            reject(error);
          } else {
            console.log('Results for word:', word, results);
            results.forEach(result => {
              if (allResults[result.id]) {
                allResults[result.id].relevance_score += result.relevance_score;
              } else {
                allResults[result.id] = {
                  id: result.id,
                  title: result.title,
                  link: result.link,
                  description: result.description,
                  category: result.category ? result.category.split(',') : [],
                  platform: result.platform ? result.platform.split(',') : [],
                  scopes: result.scopes ? result.scopes.split(',') : [],
                  programming_languages: result.programming_languages ? result.programming_languages.split(',') : [],
                  relevance_score: result.relevance_score
                };
              }
            });
            resolve();
          }
        });
      }));
    });

    Promise.all(queryPromises)
      .then(() => {
        const filteredResults = Object.values(allResults).filter(result => {
          console.log(`ID: ${result.id}, Relevance Score: ${result.relevance_score}`);
          return result.relevance_score > 0; // ma gandeam sa fac pe baza nr_cuvinte*2 sau cv de genul pentru scorul minim, dar e o chestie de finete la unele rezultate poate fi mai bine la altele sa nu am nimic
        });

        const fetchFavoritesQuery = 'SELECT link FROM favorites WHERE user_keycode = ?';
        connection.query(fetchFavoritesQuery, [userKeycode], (error, favorites) => {
          if (error) {
            console.error('Error fetching favorites:', error);
            sendErrorResponse(res, 'Error fetching favorites', error);
            return;
          }

          const favoriteLinks = new Set(favorites.map(fav => fav.link));
          filteredResults.forEach(result => {
            result.isFavorite = favoriteLinks.has(result.link);
          });

          filteredResults.sort((a, b) => b.relevance_score - a.relevance_score);

          console.log('Final filtered results:', filteredResults);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, results: filteredResults }));
        });
      })
      .catch(error => {
        console.error('Error searching the database:', error);
        sendErrorResponse(res, 'Error searching the database', error);
      });
  });
}

function sendAdminSuccessResponse(res, message, token) {
  console.log('Sending admin success response with token:', token);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message, token, userType: 'admin' }));
}

function sendClientSuccessResponse(res, message, data = true) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message, data, userType: 'client' }));
}

function sendErrorResponse(res, message, error = null) {
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, message, error }));
}

function getUserByUsername(username, callback) {
  connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results[0]);
    }
  });
}

function createUser(username, encryptedPassword, email, keycode, callback) {
  connection.query('INSERT INTO users (username, password, email, keycode) VALUES (?, ?, ?, ?)', [username, encryptedPassword, email, keycode], (error, results) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results);
    }
  });
}

function updateUserPassword(username, newPassword, callback) {
  bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
    if (err) {
      callback(err, null);
    } else {
      const query = 'UPDATE users SET password = ? WHERE username = ?';
      connection.query(query, [hashedPassword, username], (error, results) => {
        if (error) {
          callback(error, null);
        } else {
          callback(null, results);
        }
      });
    }
  });
}

function updateUserEmail(username, newEmail, callback) {
  const query = 'UPDATE users SET email = ? WHERE username = ?';
  connection.query(query, [newEmail, username], (error, results) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results);
    }
  });
}

function getAllUsers(callback) {
  const query = 'SELECT username, email, password, keycode FROM users';
  connection.query(query, (error, results) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, results);
    }
  });
}

function getHighestId(callback) {
  const query = 'SELECT MAX(keycode) AS maxKeycode FROM users';
  connection.query(query, (error, results) => {
    if (error) {
      callback(error);
      return;
    }
    const highestId = results[0].maxKeycode;
    callback(null, highestId);
  });
}

function verifyToken(req, res, next) {
  const cookies = new Cookies(req, res);
  const token = cookies.get('adminToken');
  console.log('Received token for verification:', token);

  if (!token) {
    sendErrorResponse(res, 'No token provided');
    return;
  }

  if (token === adminToken) {
    next();
  } else {
    sendErrorResponse(res, 'Invalid token');
  }
}

function handleGetParentCategories(req, res) {
  const query = 'SELECT id, name, tag FROM categories WHERE interface = 1';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching parent categories:', error);
      sendErrorResponse(res, 'Error fetching parent categories', error);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, categories: results }));
  });
}

function handleAddCategory(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { title, tag, parentCategory, interface } = JSON.parse(body);

    if (!title || !tag) {
      sendErrorResponse(res, 'Title and tag are required');
      return;
    }

    const query = 'INSERT INTO categories (name, tag, parent, interface) VALUES (?, ?, ?, ?)';
    const params = [title, tag, parentCategory || null, interface];

    connection.query(query, params, (error, results) => {
      if (error) {
        console.error('Error adding category:', error);
        sendErrorResponse(res, 'Error adding category', error);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Category added successfully' }));
    });
  });
}
function handleAddTag(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { type, name } = JSON.parse(body);

    if (!type || !name) {
      sendErrorResponse(res, 'Type and name are required');
      return;
    }

    let query = '';
    let params = [name];

    switch (type) {
      case 'platform':
        query = 'INSERT INTO platforms (name) VALUES (?)';
        break;
      case 'scope':
        query = 'INSERT INTO scopes (name) VALUES (?)';
        break;
      case 'programming language':
        query = 'INSERT INTO prog_langs (name) VALUES (?)';
        break;
      default:
        sendErrorResponse(res, 'Invalid type');
        return;
    }

    connection.query(query, params, (error, results) => {
      if (error) {
        console.error('Error adding tag:', error);
        sendErrorResponse(res, 'Error adding tag', error);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Tag added successfully' }));
    });
  });
}
function handleGetCategories(req, res) {
  const query = 'SELECT id, name FROM categories WHERE interface = 0';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching categories:', error);
      sendErrorResponse(res, 'Error fetching categories', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, categories: results }));
  });
}

function handleGetScopes(req, res) {
  const query = 'SELECT id, name FROM scopes';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching scopes:', error);
      sendErrorResponse(res, 'Error fetching scopes', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, scopes: results }));
  });
}

function handleGetPlatforms(req, res) {
  const query = 'SELECT id, name FROM platforms';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching platforms:', error);
      sendErrorResponse(res, 'Error fetching platforms', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, platforms: results }));
  });
}

function handleGetProgrammingLanguages(req, res) {
  const query = 'SELECT id, name FROM prog_langs';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching programming languages:', error);
      sendErrorResponse(res, 'Error fetching programming languages', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, programming_languages: results }));
  });
}

function handleAddContent(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { title, description, link, category, scopes, platforms, programmingLanguages } = JSON.parse(body);

    if (!title || !description || !link || !category) {
      sendErrorResponse(res, 'Title, description, link, and category are required');
      return;
    }

    const contentQuery = 'INSERT INTO contents (title, description, link) VALUES (?, ?, ?)';
    const contentParams = [title, description, link];

    connection.query(contentQuery, contentParams, (error, results) => {
      if (error) {
        console.error('Error adding content:', error);
        sendErrorResponse(res, 'Error adding content', error);
        return;
      }

      const contentId = results.insertId;

      const categoryQuery = 'INSERT INTO content_categories (content_id, category_id) VALUES (?, ?)';
      connection.query(categoryQuery, [contentId, category], (error) => {
        if (error) {
          console.error('Error linking content to category:', error);
          sendErrorResponse(res, 'Error linking content to category', error);
          return;
        }
      });

      if (scopes.length > 0) {
        const scopeQuery = 'INSERT INTO content_scopes (content_id, scope_id) VALUES ?';
        const scopeParams = scopes.map(scopeId => [contentId, scopeId]);
        connection.query(scopeQuery, [scopeParams], (error) => {
          if (error) {
            console.error('Error linking content to scopes:', error);
            sendErrorResponse(res, 'Error linking content to scopes', error);
            return;
          }
        });
      }

      if (platforms.length > 0) {
        const platformQuery = 'INSERT INTO content_platforms (content_id, platform_id) VALUES ?';
        const platformParams = platforms.map(platformId => [contentId, platformId]);
        connection.query(platformQuery, [platformParams], (error) => {
          if (error) {
            console.error('Error linking content to platforms:', error);
            sendErrorResponse(res, 'Error linking content to platforms', error);
            return;
          }
        });
      }

      if (programmingLanguages.length > 0) {
        const programmingLanguageQuery = 'INSERT INTO content_prog_langs (content_id, prog_lang_id) VALUES ?';
        const programmingLanguageParams = programmingLanguages.map(langId => [contentId, langId]);
        connection.query(programmingLanguageQuery, [programmingLanguageParams], (error) => {
          if (error) {
            console.error('Error linking content to programming languages:', error);
            sendErrorResponse(res, 'Error linking content to programming languages', error);
            return;
          }
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Content added successfully' }));
    });
  });
}
  function handleGetAllCategories(req, res) {
    const query = `
      SELECT 
        c1.id, 
        c1.name, 
        c1.tag, 
        c1.parent AS parent_id, 
        c2.tag AS parent_tag, 
        c1.interface 
      FROM categories c1
      LEFT JOIN categories c2 ON c1.parent = c2.id
    `;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching categories:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Error fetching categories', error }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, categories: results }));
    });
  }
  
  function updateCategory(req, res) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
  
    req.on('end', () => {
      const { id, field, value } = JSON.parse(body);
  
      if (field === 'parent') {
        const parentTag = value;
  
        if (parentTag === null || parentTag === '') {
          const updateQuery = `UPDATE categories SET parent = NULL WHERE id = ?`;
          connection.query(updateQuery, [id], (error, results) => {
            if (error) {
              console.error('Error removing parent category:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Error removing parent category', error }));
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Parent category removed successfully' }));
          });
        } else {
          const parentQuery = 'SELECT id FROM categories WHERE tag = ? and interface=1';
          connection.query(parentQuery, [parentTag], (error, results) => {
            if (error) {
              console.error('Error fetching parent category:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Error fetching parent category', error }));
              return;
            }
            if (results.length > 0) {
              const parentId = results[0].id;
              const updateQuery = `UPDATE categories SET ${field} = ? WHERE id = ?`;
              connection.query(updateQuery, [parentId, id], (error, results) => {
                if (error) {
                  console.error('Error updating category:', error);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, message: 'Error updating category', error }));
                  return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Category updated successfully' }));
              });
            } else {
              console.error('Parent category not found for tag:', parentTag);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, message: 'Parent category not found' }));
            }
          });
        }
      } else {
        const query = `UPDATE categories SET ${field} = ? WHERE id = ?`;
        connection.query(query, [value, id], (error, results) => {
          if (error) {
            console.error('Error updating category:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Error updating category', error }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Category updated successfully' }));
        });
      }
    });
  }
  

function deleteCategory(req, res) {
  const queryObject = url.parse(req.url, true).query;
  const { id } = queryObject;

  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'ID is required' }));
    return;
  }

  const query = 'DELETE FROM categories WHERE id = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Error deleting category', error }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Category deleted successfully' }));
  });
}
function updateTag(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const { id, name, type } = JSON.parse(body);
    if (!name.trim() || !/^[a-zA-Z0-9\-]+$/.test(name)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid name format. Must contain only letters, numbers, and dashes.' }));
      return; 
    }

    let tableName;
    switch (type) {
      case 'scopes':
        tableName = 'scopes';
        break;
      case 'platforms':
        tableName = 'platforms';
        break;
      case 'programming_languages':
        tableName = 'prog_langs';
        break;
      default:
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid tag type' }));
        return;
    }

    const query = `UPDATE ${tableName} SET name = ? WHERE id = ?`;
    connection.query(query, [name, id], (error, results) => {
      if (error) {
        console.error('Error updating tag:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Error updating tag', error }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Tag updated successfully' }));
    });
  });
}

function deleteTag(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  if (!id || !type) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Missing id or type parameter' }));
    return;
  }

  let tableName;
  switch (type) {
    case 'scopes':
      tableName = 'scopes';
      break;
    case 'platforms':
      tableName = 'platforms';
      break;
    case 'programming_languages':
      tableName = 'prog_langs';
      break;
    default:
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid tag type' }));
      return;
  }

  const query = `DELETE FROM ${tableName} WHERE id = ?`;
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error deleting tag:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Error deleting tag', error }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Tag deleted successfully' }));
  });
}
function getCategoriesWithInterfaceZero(req, res) {
  const query = 'SELECT id, name, tag FROM categories WHERE interface = 0';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching categories with interface=0:', error);
      sendErrorResponse(res, 'Error fetching categories with interface=0', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, categories: results }));
  });
}

function getContentByCategory(req, res) {
  const urlParts = new URL(req.url, `http://${req.headers.host}`);
  const categoryId = urlParts.searchParams.get('categoryId');
  if (!categoryId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Missing categoryId parameter' }));
    return;
  }
  const query = `
    SELECT contents.id, contents.title, contents.description, contents.link,
      GROUP_CONCAT(DISTINCT platforms.name) AS platforms,
      GROUP_CONCAT(DISTINCT scopes.name) AS scopes,
      GROUP_CONCAT(DISTINCT prog_langs.name) AS programming_languages
    FROM contents
    LEFT JOIN content_platforms ON contents.id = content_platforms.content_id
    LEFT JOIN platforms ON content_platforms.platform_id = platforms.id
    LEFT JOIN content_scopes ON contents.id = content_scopes.content_id
    LEFT JOIN scopes ON content_scopes.scope_id = scopes.id
    LEFT JOIN content_prog_langs ON contents.id = content_prog_langs.content_id
    LEFT JOIN prog_langs ON content_prog_langs.prog_lang_id = prog_langs.id
    LEFT JOIN content_categories ON contents.id = content_categories.content_id
    WHERE content_categories.category_id = ?
    GROUP BY contents.id
  `;
  connection.query(query, [categoryId], (error, results) => {
    if (error) {
      console.error('Error fetching content:', error);
      sendErrorResponse(res, 'Error fetching content', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, content: results }));
  });
}


function updateContentField(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { id, field, value } = JSON.parse(body);
    const query = `UPDATE contents SET ${field} = ? WHERE id = ?`;
    connection.query(query, [value, id], (error, results) => {
      if (error) {
        console.error('Error updating content field:', error);
        sendErrorResponse(res, 'Error updating content field', error);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Content updated successfully' }));
    });
  });
}

function updateContentTags(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { id, field, tags } = JSON.parse(body);
    
    console.log(`Received updateContentTags request with field: ${field}`);
    console.log(`Tags received: ${JSON.stringify(tags)}, Length: ${tags.length}`);

    let tableName = '';
    let foreignKey = '';
    let joinTable = '';
    switch (field) {
      case 'platforms':
        tableName = 'platforms';
        foreignKey = 'platform_id';
        joinTable = 'content_platforms';
        break;
      case 'scopes':
        tableName = 'scopes';
        foreignKey = 'scope_id';
        joinTable = 'content_scopes';
        break;
      case 'languages':
        tableName = 'prog_langs';
        foreignKey = 'prog_lang_id';
        joinTable = 'content_prog_langs';
        break;
      default:
        console.error(`Invalid tag type: ${field}`);
        sendErrorResponse(res, 'Invalid tag type');
        return;
    }

    if (!tags || (tags.length === 0)) {
      console.log(`Tags array is empty or contains an empty string. Deleting all ${field} entries for content ID: ${id}`);
      const deleteQuery = `DELETE FROM ${joinTable} WHERE content_id = ?`;
      connection.query(deleteQuery, [id], (deleteError, deleteResults) => {
        if (deleteError) {
          console.error(`Error deleting ${field}:`, deleteError);
          sendErrorResponse(res, `Error deleting ${field}`, deleteError);
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `${field} updated successfully` }));
      });
    } else {
      const checkQuery = `SELECT id FROM ${tableName} WHERE name IN (?)`;
      connection.query(checkQuery, [tags], (checkError, checkResults) => {
        if (checkError) {
          console.error(`Error checking ${field}:`, checkError);
          sendErrorResponse(res, `Error checking ${field}`, checkError);
          return;
        }
        if (checkResults.length !== tags.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: `Invalid ${field} provided` }));
          return;
        }
        const deleteQuery = `DELETE FROM ${joinTable} WHERE content_id = ?`;
        connection.query(deleteQuery, [id], (deleteError, deleteResults) => {
          if (deleteError) {
            console.error(`Error deleting ${field}:`, deleteError);
            sendErrorResponse(res, `Error deleting ${field}`, deleteError);
            return;
          }
          const insertQuery = `INSERT INTO ${joinTable} (content_id, ${foreignKey}) VALUES ?`;
          const values = checkResults.map(row => [id, row.id]);
          connection.query(insertQuery, [values], (insertError, insertResults) => {
            if (insertError) {
              console.error(`Error inserting ${field}:`, insertError);
              sendErrorResponse(res, `Error inserting ${field}`, insertError);
              return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: `${field} updated successfully` }));
          });
        });
      });
    }
  });
}



function deleteContent(req, res) {
  const urlParts = new URL(req.url, `http://${req.headers.host}`);
  const id = urlParts.searchParams.get('id');
  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Missing id parameter' }));
    return;
  }
  const query = 'DELETE FROM contents WHERE id = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error deleting content:', error);
      sendErrorResponse(res, 'Error deleting content', error);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Content deleted successfully' }));
  });
}

function handleExportData(req, res) {
  const queries = [
    { table: 'categories', query: 'SELECT * FROM categories' },
    { table: 'platforms', query: 'SELECT * FROM platforms' },
    { table: 'scopes', query: 'SELECT * FROM scopes' },
    { table: 'prog_langs', query: 'SELECT * FROM prog_langs' },
    { table: 'contents', query: 'SELECT * FROM contents' },
    { table: 'content_scopes', query: 'SELECT * FROM content_scopes' },
    { table: 'content_prog_langs', query: 'SELECT * FROM content_prog_langs' },
    { table: 'content_platforms', query: 'SELECT * FROM content_platforms' },
    { table: 'content_categories', query: 'SELECT * FROM content_categories' },
    { table: 'users', query: 'SELECT * FROM users' },
    { table: 'favorites', query: 'SELECT * FROM favorites' },
    { table: 'history', query: 'SELECT * FROM history' },
  ];

  let data = '';

  const fetchTableData = (index) => {
    if (index >= queries.length) {
      res.writeHead(200, {
        'Content-Disposition': 'attachment; filename=refi.json',
        'Content-Type': 'application/json'
      });
      res.end(data);
      return;
    }

    const { table, query } = queries[index];
    connection.query(query, (error, results) => {
      if (error) {
        console.error(`Error fetching data from ${table}:`, error);
        sendErrorResponse(res, `Error fetching data from ${table}`, error);
        return;
      }

      data += `#${table}\n`;
      results.forEach(row => {
        data += JSON.stringify(row) + '\n';
      });

      fetchTableData(index + 1);
    });
  };

  fetchTableData(0);
}

function handleImportData(req, res) {
  upload.single('import-file')(req, res, function (err) {
    if (err) {
      console.error('Error uploading file:', err);
      return sendErrorResponse(res, 'Error uploading file.');
    }

    const filePath = req.file.path;
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        return sendErrorResponse(res, 'Error reading file.');
      }

      try {
        const jsonData = JSON.parse(data);
        processImportData(jsonData, res);
      } catch (err) {
        console.error('Error parsing JSON:', err);
        return sendErrorResponse(res, 'Error parsing JSON.');
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
    });
  });
}


function processImportData(data, res) {
  const categoriesSet = new Set(data.map(item => item.category));
  const scopesSet = new Set(data.flatMap(item => item.scopes));
  const programmingLanguagesSet = new Set(data.flatMap(item => item.programming_languages));
  const platformsSet = new Set(data.flatMap(item => item.platforms));

  validateSets({ categoriesSet, scopesSet, programmingLanguagesSet, platformsSet }, (err) => {
    if (err) {
      return sendErrorResponse(res, err);
    }

    let hasErrorOccurred = false;

    data.forEach(item => {
      const { title, description, href, category, scopes, programming_languages, platforms } = item;

      if (!title || !description || !href) {
        console.error('Invalid content data:', item);
        hasErrorOccurred = true;
        return;
      }

      connection.query('INSERT INTO contents (title, description, link) VALUES (?, ?, ?)', [title, description, href], (err, results) => {
        if (err) {
          console.error('Error inserting content:', err);
          hasErrorOccurred = true;
          return;
        }
        const contentId = results.insertId;
        insertContentTags(contentId, 'scopes', scopes);
        insertContentTags(contentId, 'programming_languages', programming_languages);
        insertContentTags(contentId, 'platforms', platforms);
        insertContentCategory(contentId, category);
      });
    });

    if (hasErrorOccurred) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Data imported with some errors.' }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Data imported successfully.' }));
    }
  });
}



function validateSets(sets, callback) {
  const { categoriesSet, scopesSet, programmingLanguagesSet, platformsSet } = sets;

  const queries = [
    { type: 'category', query: 'SELECT tag FROM categories WHERE tag IN (?)', values: [Array.from(categoriesSet)] },
    { type: 'scope', query: 'SELECT name FROM scopes WHERE name IN (?)', values: [Array.from(scopesSet)] },
    { type: 'programming_language', query: 'SELECT name FROM prog_langs WHERE name IN (?)', values: [Array.from(programmingLanguagesSet)] },
    { type: 'platform', query: 'SELECT name FROM platforms WHERE name IN (?)', values: [Array.from(platformsSet)] },
  ];

  executeValidationQueries(queries, (err, results) => {
    if (err) {
      return callback(err);
    }

    const missingCategories = Array.from(categoriesSet).filter(tag => !results.category.includes(tag));
    const missingScopes = Array.from(scopesSet).filter(name => !results.scope.includes(name));
    const missingProgrammingLanguages = Array.from(programmingLanguagesSet).filter(name => !results.programming_language.includes(name));
    const missingPlatforms = Array.from(platformsSet).filter(name => !results.platform.includes(name));

    if (missingCategories.length || missingScopes.length || missingProgrammingLanguages.length || missingPlatforms.length) {
      let errorMessage = 'Validation failed:';
      if (missingCategories.length) errorMessage += ` Missing categories: ${missingCategories.join(', ')}`;
      if (missingScopes.length) errorMessage += ` Missing scopes: ${missingScopes.join(', ')}`;
      if (missingProgrammingLanguages.length) errorMessage += ` Missing programming languages: ${missingProgrammingLanguages.join(', ')}`;
      if (missingPlatforms.length) errorMessage += ` Missing platforms: ${missingPlatforms.join(', ')}`;
      return callback(errorMessage);
    }

    callback(null);
  });
}


function executeValidationQueries(queries, callback) {
  let results = {};
  let completedQueries = 0;

  queries.forEach(query => {
    connection.query(query.query, query.values, (err, rows) => {
      if (err) {
        return callback(`Error validating ${query.type}s: ${err.message}`);
      }

      results[query.type] = rows.map(row => row[query.type === 'category' ? 'tag' : 'name']);
      completedQueries++;

      if (completedQueries === queries.length) {
        callback(null, results);
      }
    });
  });
}

function insertContentTags(contentId, type, tags) {
  if (!tags.length) return;

  let table, column;
  switch (type) {
    case 'scopes':
      table = 'content_scopes';
      column = 'scope_id';
      break;
    case 'programming_languages':
      table = 'content_prog_langs';
      column = 'prog_lang_id';
      break;
    case 'platforms':
      table = 'content_platforms';
      column = 'platform_id';
      break;
    default:
      return;
  }

  const queries = tags.map(tag => {
    return new Promise((resolve, reject) => {
      connection.query(`SELECT id FROM ${type === 'scopes' ? 'scopes' : type === 'programming_languages' ? 'prog_langs' : 'platforms'} WHERE name = ?`, [tag], (err, results) => {
        if (err) return reject(err);
        if (!results.length) return resolve();
        const tagId = results[0].id;
        connection.query(`INSERT INTO ${table} (content_id, ${column}) VALUES (?, ?)`, [contentId, tagId], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  });

  Promise.all(queries).catch(err => {
    console.error(`Error inserting ${type}:`, err);
  });
}

function insertContentCategory(contentId, category) {
  connection.query('SELECT id FROM categories WHERE tag = ?', [category], (err, results) => {
    if (err) {
      console.error('Error fetching category id:', err);
      return;
    }
    if (results.length > 0) {
      const categoryId = results[0].id;
      connection.query('INSERT INTO content_categories (content_id, category_id) VALUES (?, ?)', [contentId, categoryId], (err) => {
        if (err) {
          console.error('Error inserting content category:', err);
        }
      });
    }
  });
}
function sendErrorResponse(res, message, err) {
  if (res.headersSent) {
    console.error('Headers already sent:', message, err);
    return;
  }

  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, message }));
}
