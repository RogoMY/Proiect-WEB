const mysql = require('mysql2');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const Cookies = require('cookies');
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

function sendSuccessResponse(res, message, data = true) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message, data }));
}

function sendErrorResponse(res, message, error = null) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message, error }));
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
    const parsedUrl = url.parse(req.url);
    let pathname = `./public${parsedUrl.pathname}`;

    if (pathname === './public/register' && req.method === 'POST') {
        handleRegister(req, res);
    } else if (pathname === './public/login' && req.method === 'POST') {
        handleLogin(req, res);
    } else {
        handleFileRequest(pathname, res);
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

                        sendSuccessResponse(res, 'User registered successfully');
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
                    const cookies = new Cookies(req, res);
                    cookies.set('userId', user.keycode, { httpOnly: true });
                    sendSuccessResponse(res, 'Login successful', true);
                    console.log('Login successful:', username);
                } else {
                    sendErrorResponse(res, 'Invalid username or password');
                    console.log('Invalid username or password:', username);
                }
            });
        });
    });
}

function handleFileRequest(pathname, res) {
    fs.exists(pathname, exist => {
        if (!exist) {
            res.statusCode = 404;
            res.end(`File ${pathname} not found!`);
            return;
        }

        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/login.html';
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
