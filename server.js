const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from public directory
app.use(express.static('public'));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Tesla Car Wrap Editor running at http://localhost:${port}`);
});