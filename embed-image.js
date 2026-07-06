#!/usr/bin/env node

/**
 * Image Embedding Helper for Hollister Factory View
 *
 * This script helps embed the factory image into the HTML application.
 *
 * Usage:
 *   node embed-image.js <image-path>
 *
 * Example:
 *   node embed-image.js ./factory.jpg
 */

const fs = require('fs');
const path = require('path');

function encodeImageAsBase64(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64String = imageBuffer.toString('base64');

        // Determine MIME type
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';

        const dataUrl = `data:${mimeType};base64,${base64String}`;

        // Read the HTML file
        const htmlPath = path.join(__dirname, 'index.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Update all facility details with the image
        const facilities = ['ballina', 'stuarts-draft', 'bawal', 'kaunas'];

        facilities.forEach(facility => {
            const regex = new RegExp(
                `('${facility}': {[\\s\\S]*?image: )null`,
                'g'
            );
            htmlContent = htmlContent.replace(
                regex,
                `$1'${dataUrl}'`
            );
        });

        // Write back to HTML file
        fs.writeFileSync(htmlPath, htmlContent);

        console.log('✅ Image embedded successfully!');
        console.log(`📝 Image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🎨 MIME type: ${mimeType}`);
        console.log('🚀 The application is ready to use!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const imagePath = process.argv[2];

if (!imagePath) {
    console.log('📸 Image Embedding Helper');
    console.log('');
    console.log('Usage: node embed-image.js <image-path>');
    console.log('');
    console.log('Example:');
    console.log('  node embed-image.js ./factory-photo.jpg');
    console.log('');
    console.log('Supported formats: JPEG, PNG, GIF, WebP');
    process.exit(0);
}

console.log(`📦 Processing image: ${imagePath}`);
encodeImageAsBase64(imagePath);
