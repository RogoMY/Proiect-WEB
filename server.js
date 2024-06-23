const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Cookies = require('cookies');
const http = require('http');
const url = require('url');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const saltRounds = 10;
const usbKeyPath = 'E:\\key.txt'; // Path to your key file
const predefinedRawKey = 'success'; // Replace with your actual raw key
const adminToken = '$2b$10$OBkQgGs1au3Ms8EW2KmDQ.tf9GuL5EV.IJ0Mw.vP7FU0.M9prYMte'; // Predefined token for admin

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'parola',
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
    // Gestionare rute personalizate
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
    } else {
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

  const fetchFavoritesQuery = 'SELECT title, link, description, tags FROM favorites WHERE user_keycode = ?';
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
    const { title, link, description, tags } = JSON.parse(body);
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
      const query = isFavorite ? 'DELETE FROM favorites WHERE user_keycode = ? AND link = ?' : 'INSERT INTO favorites (user_keycode, title, link, description, tags) VALUES (?, ?, ?, ?, ?)';
      const params = isFavorite ? [userKeycode, link] : [userKeycode, title, link, description, tags];

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
            // Read the key from USB and compare with the predefined raw key
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
            // Normal user login
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

      const { title, link, description, tags } = parsedBody;
      console.log('Extracted Data:', { title, link, description, tags });

      if (!title || !link) {
        console.log('Missing title or link in request body');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad request' }));
        return;
      }

      const insertHistoryQuery = 'INSERT INTO history (user_keycode, title, link, description, tags) VALUES (?, ?, ?, ?, ?)';
      connection.query(insertHistoryQuery, [userKeycode, title, link, description, tags], (error, results) => {
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

  const fetchHistoryQuery = 'SELECT title, link, description, tags FROM history WHERE user_keycode = ? ORDER BY timestamp DESC';
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
      'a', 'an', 'the', 'and', 'or', 'but', 'so', 'if', 'then', 'about', 'how', 'to', 'make', 'for', 'with', 'in', 'on', 'at', 'by', 'from', 'up', 'down', 'of', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'being', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'as', 'such', 'can', 'could', 'should', 'would', 'will', 'shall', 'might', 'must', 'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose', 'why', 'where', 'when', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'use'
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

        // Verifică dacă elementele sunt deja favorite
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
