const mysql = require('mysql2');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


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

function getUserByUsername(username, callback) {
    connection.query('SELECT * FROM users WHERE username = ?', [username], function(error, results, fields) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
}

function createUser(username, encryptedPassword, email, keycode, callback) {
    connection.query('INSERT INTO users (username, password, email, keycode) VALUES (?, ?, ?, ?)', [username, encryptedPassword, email, keycode], function(error, results, fields) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, results);
        }
    });
}

function encryptPassword(password, keycode) {
    const key = crypto.createHash('sha256').update(keycode.toString()).digest();
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = `./public${parsedUrl.pathname}`;

    if (pathname === './public/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('Received registration data:', body); 
            const { username, email, password } = JSON.parse(body);

            getUserByUsername(username, (error, results) => {
                if (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Error querying the database' }));
                    console.error('Error querying the database:', error); 
                    return;
                }

                if (results && results.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Username already exists' }));
                    console.log('Username already exists:', username); 
                    return;
                }

                const keycode = crypto.randomInt(100000, 999999);

                const encryptedPassword = encryptPassword(password, keycode);

                createUser(username, encryptedPassword, email, keycode, (error, results) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Error adding user to the database' }));
                        console.error('Error adding user to the database:', error); 
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'User registered successfully' }));
                    console.log('User registered successfully:', username); 
                });
            });
        });
    } else {
        fs.exists(pathname, function(exist) {
            if (!exist) {
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
                return;
            }
            if (fs.statSync(pathname).isDirectory()) {
                pathname += '/login.html';
            }
            fs.readFile(pathname, function(err, data) {
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
});

server.listen(5000, function() {
    console.log("Server listening on port 5000");
});
