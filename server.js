const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const Cookies = require('cookies');
const http = require('http');
const url = require('url');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const saltRounds = 10;

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
});

function sendAdminSuccessResponse(res, message, data = true) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, message, data, userType: 'admin' }));
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

function getAvailableDrives(callback) {
  exec('wmic logicaldisk get name', (error, stdout) => {
    if (error) {
      console.error('Error getting drives:', error);
      callback(error, null);
      return;
    }

    let drives = stdout.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && line !== 'Name');

    callback(null, drives);
  });
}

function handleAdminLogin(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    const { username, password } = JSON.parse(body);

    getUserByUsername(username, (error, user) => {
      if (error) {
        sendErrorResponse(res, 'Error retrieving user from the database', error);
        return;
      }

      if (!user || user.keycode !== null) {
        sendErrorResponse(res, 'Invalid admin credentials');
        return;
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          sendErrorResponse(res, 'Invalid admin credentials');
          return;
        }

        getAvailableDrives((error, drives) => {
          if (error) {
            sendErrorResponse(res, 'Error checking drives');
            return;
          }

          let keyPath = path.join('E:\\', 'key.txt');
          if (fs.existsSync(keyPath)) {
            let key = fs.readFileSync(keyPath, 'utf8');
            if (key === 'success') {
              sendAdminSuccessResponse(res, 'Admin login successful');
              console.log('Admin login successful:', username);
              return;
            }
          }

          sendErrorResponse(res, 'Invalid admin key');
          console.log('Invalid admin key:', username);
        });
      });
    });
  });
}

const server = http.createServer((req, res) => {
  const cookies = new Cookies(req, res);
  const userId = cookies.get('userId');

  const parsedUrl = url.parse(req.url);
  let pathname = `./public${parsedUrl.pathname}`;

  if (pathname === './public/admin.html'|| pathname === './public/manage-content.html' && req.method === 'GET') {
    // Check for admin access
    getAvailableDrives((error, drives) => {
      if (error || !drives.includes('E:')) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      let keyPath = path.join('E:\\', 'key.txt');
      if (fs.existsSync(keyPath)) {
        let key = fs.readFileSync(keyPath, 'utf8');
        if (key === 'success') {
          // Allow access to admin.html
          handleFileRequest(pathname, res, userId);
          return;
        }
      }

      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
    });
  } else if (pathname === './public/check-auth' && req.method === 'GET') {
    handleCheckAuth(req, res);
  } else if (!userId && pathname === './public/homepage.html' || pathname ==='./public/favorites.html' || pathname === './public/search-results.html') {
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
    handleGetUsers(req, res);
  } else if (pathname === './public/changeEmail' && req.method === 'POST') {
    handleChangeEmail(req, res);
  } else if (pathname === './public/changePassword' && req.method === 'POST') {
    handleChangePassword(req, res);
  } else if (pathname === './public/searchUsers' && req.method === 'GET') {
    handleSearchUsers(req, res);
  } else {
    handleFileRequest(pathname, res, userId);
  }
});

function handleCheckAuth(req, res) {
  const cookies = new Cookies(req, res);
  const userId = cookies.get('userId');

  if (userId) {
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
             
              getAvailableDrives((drives) => {             
                //username admin#1 parola contadmin
                let keyPath = path.join('E:\\', 'key.txt');
                if (fs.existsSync(keyPath)) {
                  let key = fs.readFileSync(keyPath, 'utf8');
                  if (key === 'success') {                 
                    sendAdminSuccessResponse(res, 'Admin login successful');
                    console.log('Admin login successful:', username);
                    return;
                  }
                }
  
                // No valid key found, deny login
                sendErrorResponse(res, 'Invalid admin key');
                console.log('Invalid admin key:', username);
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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Logout successful' }));
  }
  
  function handleGetUsers(req, res) {
    getAllUsers((error, users) => {
      if (error) {
        sendErrorResponse(res, 'Error fetching users', error);
        return;
      }
      console.log('Fetched users:', users);  // Add this line
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, users }));
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

function handleFileRequest(pathname, res, userId) {
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

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});
