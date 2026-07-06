#!/usr/bin/env python3

"""
Image Embedding Helper for Hollister Factory View

This script converts an image to Base64 and embeds it into the HTML application.

Usage:
    python3 embed-image.py <image-path>

Example:
    python3 embed-image.py ./factory-photo.jpg
"""

import sys
import os
import base64
import re
from pathlib import Path

def get_mime_type(file_path):
    """Determine MIME type from file extension"""
    ext = Path(file_path).suffix.lower()
    mime_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    return mime_types.get(ext, 'image/jpeg')

def encode_image_to_base64(image_path):
    """Convert image to Base64 data URL"""
    try:
        with open(image_path, 'rb') as img_file:
            image_data = img_file.read()
            base64_string = base64.b64encode(image_data).decode('utf-8')
            mime_type = get_mime_type(image_path)
            data_url = f'data:{mime_type};base64,{base64_string}'
            return data_url, image_path, len(image_data), mime_type
    except FileNotFoundError:
        print(f"❌ Error: File not found - {image_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)

def update_html_with_image(html_path, data_url):
    """Update HTML file with embedded image"""
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Replace image: null with the actual data URL for all facilities
        facilities = ['ballina', 'stuarts-draft', 'bawal', 'kaunas']

        for facility in facilities:
            # Pattern to find: 'facility-code': { ... image: null ... }
            pattern = rf"('{facility}':\s*{{\s*[^}}]*?image:\s*)'null'([^}}]*}})"
            replacement = rf"\1'{data_url}'\2"
            html_content = re.sub(pattern, replacement, html_content, flags=re.DOTALL)

        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return True

    except Exception as e:
        print(f"❌ Error updating HTML: {e}")
        sys.exit(1)

def main():
    """Main execution"""
    if len(sys.argv) < 2:
        print("📸 Hollister Factory Image Embedding Tool")
        print("")
        print("Usage: python3 embed-image.py <image-path>")
        print("")
        print("Supported formats: JPEG, PNG, GIF, WebP")
        print("")
        print("Examples:")
        print("  python3 embed-image.py ./factory-photo.jpg")
        print("  python3 embed-image.py ~/Pictures/hollister-facility.png")
        sys.exit(0)

    image_path = sys.argv[1]

    print(f"📦 Processing image: {image_path}")

    # Encode image
    data_url, full_path, file_size, mime_type = encode_image_to_base64(image_path)

    # Find HTML file
    script_dir = Path(__file__).parent
    html_path = script_dir / 'index.html'

    if not html_path.exists():
        print(f"❌ Error: index.html not found in {script_dir}")
        sys.exit(1)

    print(f"📝 Updating {html_path}...")

    # Update HTML
    update_html_with_image(str(html_path), data_url)

    # Print success info
    size_mb = file_size / (1024 * 1024)
    size_kb = file_size / 1024

    print("")
    print("✅ SUCCESS! Image embedded successfully!")
    print(f"📊 Image Details:")
    print(f"   - File size: {size_mb:.2f} MB ({size_kb:.1f} KB)")
    print(f"   - MIME type: {mime_type}")
    print(f"   - Facilities updated: 4 (Ballina, Stuarts Draft, Bawal, Kaunas)")
    print("")
    print("🚀 Ready to use! Open index.html in your browser:")
    print(f"   - Open: {html_path}")
    print("")
    print("💡 Tips:")
    print("   - Click on any facility marker on the globe")
    print("   - Watch the animations overlay on your factory image")
    print("   - Explore all 4 global manufacturing sites")

if __name__ == '__main__':
    main()
