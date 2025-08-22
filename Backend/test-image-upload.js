// Test script to verify image upload directories are created properly
const fs = require('fs');
const path = require('path');

const categories = [
    'general', 'school-life', 'gossip', 'events', 'sports', 
    'academics', 'teachers', 'students', 'activities', 'news', 'bell-sleeping', 'other'
];

const uploadsDir = path.join(__dirname, 'uploads');

console.log('Testing image upload directory structure...');

// Create main uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created main uploads directory');
} else {
    console.log('✅ Main uploads directory exists');
}

// Create category subdirectories
categories.forEach(category => {
    const categoryPath = path.join(uploadsDir, category);
    if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
        console.log(`✅ Created category directory: ${category}`);
    } else {
        console.log(`✅ Category directory exists: ${category}`);
    }
});

console.log('\n📁 Directory structure ready for image uploads!');
console.log('Images will be organized by category in subdirectories.');
