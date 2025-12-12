const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('Testing file paths...\n');

// Test file existence
const filesToTest = [
    'public/index.html',
    'src/main.js',
    'src/style.css'
];

filesToTest.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    console.log(`${exists ? '✓' : '✗'} ${file}: ${exists ? 'exists' : 'missing'}`);
});

// Test server routes
console.log('\nTesting server routes...');

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    if (req.url === '/') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Root route working');
    } else if (req.url === '/src/main.js') {
        const filePath = path.join(__dirname, 'src', 'main.js');
        if (fs.existsSync(filePath)) {
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end('Main.js route working');
        } else {
            res.writeHead(404);
            res.end('Main.js not found');
        }
    } else if (req.url === '/src/style.css') {
        const filePath = path.join(__dirname, 'src', 'style.css');
        if (fs.existsSync(filePath)) {
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.end('Style.css route working');
        } else {
            res.writeHead(404);
            res.end('Style.css not found');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3001, () => {
    console.log('\nTest server running on http://localhost:3001');
    console.log('Try these URLs:');
    console.log('- http://localhost:3001/');
    console.log('- http://localhost:3001/src/main.js');
    console.log('- http://localhost:3001/src/style.css');
    
    // Simple test requests
    const testUrls = ['/', '/src/main.js', '/src/style.css'];
    
    testUrls.forEach(url => {
        http.get(`http://localhost:3001${url}`, (res) => {
            console.log(`✓ ${url}: ${res.statusCode} ${res.statusMessage}`);
        }).on('error', (err) => {
            console.log(`✗ ${url}: ${err.message}`);
        });
    });
});

setTimeout(() => {
    server.close();
    console.log('\nTest server closed.');
}, 2000);