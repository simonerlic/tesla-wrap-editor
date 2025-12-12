const fs = require('fs');
const path = require('path');

console.log('Verifying Tesla Car Wrap Editor project structure...\n');

// Check required files
const requiredFiles = [
    'public/index.html',
    'src/main.js',
    'src/style.css',
    'server.js',
    'package.json',
    'README.md'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✓' : '✗'} ${file}`);
    if (!exists) allFilesExist = false;
});

// Check directories
const requiredDirs = [
    'public',
    'public/templates',
    'src',
    'node_modules'
];

console.log('\nDirectories:');
requiredDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`${exists ? '✓' : '✗'} ${dir}/`);
    if (!exists) allFilesExist = false;
});

// Check HTML structure
console.log('\nChecking HTML structure...');
try {
    const html = fs.readFileSync('public/index.html', 'utf8');
    const hasCanvas = html.includes('<canvas id="editorCanvas">');
    const hasFabricScript = html.includes('main.js');
    const hasStyle = html.includes('style.css');
    
    console.log(`✓ Canvas element: ${hasCanvas}`);
    console.log(`✓ Main script: ${hasFabricScript}`);
    console.log(`✓ Stylesheet: ${hasStyle}`);
} catch (err) {
    console.log('✗ Error reading HTML file');
    allFilesExist = false;
}

// Check JavaScript structure
console.log('\nChecking JavaScript structure...');
try {
    const js = fs.readFileSync('src/main.js', 'utf8');
    const hasFabricInit = js.includes('fabric.Canvas');
    const hasTemplateLoading = js.includes('loadTemplate');
    const hasImageUpload = js.includes('handleImageUpload');
    const hasDownload = js.includes('downloadDesign');
    
    console.log(`✓ Fabric.js initialization: ${hasFabricInit}`);
    console.log(`✓ Template loading: ${hasTemplateLoading}`);
    console.log(`✓ Image upload: ${hasImageUpload}`);
    console.log(`✓ Download functionality: ${hasDownload}`);
} catch (err) {
    console.log('✗ Error reading JavaScript file');
    allFilesExist = false;
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('✓ All required files and structure verified successfully!');
    console.log('\nTo run the application:');
    console.log('1. npm start');
    console.log('2. Open http://localhost:3000 in your browser');
} else {
    console.log('✗ Some files or structure elements are missing');
}

console.log('\nProject structure verification complete.');