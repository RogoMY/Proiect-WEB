const mysql = require('mysql2');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const Cookies = require('cookies');
const { exec } = require('child_process');
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
function getNextDriveLetter(drives) {
    const driveLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let letter of driveLetters) {
      if (!drives.includes(letter + ':')) {
        return letter + ':';
      }
    }
    return null;
  }
function sendErrorResponse(res, message, error = null) {
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, message, error }));
}
function getAvailableDrives(callback) {
    exec('wmic logicaldisk get name', (error, stdout) => {
      if (error) {
        console.error('Error getting drives:', error);
        return;
      }
  
      let drives = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '' && line !== 'Name');
  
      callback(drives);
    });
  }
  let previousDrives = [];

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

const server = http.createServer((req, res) => {
  const cookies = new Cookies(req, res);
  const userId = cookies.get('userId');

  const parsedUrl = url.parse(req.url);
  let pathname = `./public${parsedUrl.pathname}`;

 
  if (userId && (pathname === './public/login.html' || pathname === './public/register.html' || pathname === './public/')) {
    res.writeHead(302, { 'Location': '/homepage.html' });
    res.end();
    return;
  }

  if (pathname === './public/register' && req.method === 'POST') {
    handleRegister(req, res);
  } else if (pathname === './public/login' && req.method === 'POST') {
    handleLogin(req, res);
  } else if (pathname === './public/logout' && req.method === 'POST') {
    handleLogout(req, res);
  } else {
    handleFileRequest(pathname, res, userId);
  }
});

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
                // User is an admin, check for key.txt on the next available drive
                getAvailableDrives((drives) => {
                  // Get the next available drive letter
                  //username admin#1 parola contadmin
                  let keyPath = path.join('E:\\', 'key.txt');
                  if (fs.existsSync(keyPath)) {
                    let key = fs.readFileSync(keyPath, 'utf8');
                    if (key === 'success') {
                      // Key is valid, log in the admin
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
