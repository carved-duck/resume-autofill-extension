#!/usr/bin/env python3
"""
Simple script to create placeholder icons for the Chrome extension
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple icon with the given size"""
    # Create a new image with a gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Create a gradient background
    for i in range(size):
        for j in range(size):
            r = int(102 + (126 - 102) * i / size)  # 667eea to 764ba2 gradient
            g = int(126 + (75 - 126) * i / size)
            b = int(234 + (162 - 234) * i / size)
            img.putpixel((i, j), (r, g, b, 255))

    # Draw a simple document icon
    margin = size // 8
    doc_width = size - 2 * margin
    doc_height = size - 2 * margin

    # Document body
    draw.rounded_rectangle(
        [margin, margin + margin//2, margin + doc_width, margin + doc_height],
        radius=size//12,
        fill=(255, 255, 255, 255),
        outline=(200, 200, 200, 255),
        width=1
    )

    # Draw lines representing text
    line_height = size // 16
    for i in range(3):
        y = margin + margin//2 + margin//2 + i * line_height
        draw.rectangle(
            [margin + margin//3, y, margin + doc_width - margin//3, y + line_height//2],
            fill=(150, 150, 150, 255)
        )

    # Save the image
    os.makedirs('icons', exist_ok=True)
    img.save(f'icons/{filename}', 'PNG')
    print(f"Created {filename} ({size}x{size})")

if __name__ == '__main__':
    try:
        # Create icons of different sizes
        create_icon(16, 'icon16.png')
        create_icon(48, 'icon48.png')
        create_icon(128, 'icon128.png')
        print("✅ All icons created successfully!")
    except ImportError:
        print("❌ Pillow not installed. Creating simple placeholder files...")

        # Create placeholder files
        os.makedirs('icons', exist_ok=True)
        for size, filename in [(16, 'icon16.png'), (48, 'icon48.png'), (128, 'icon128.png')]:
            with open(f'icons/{filename}', 'w') as f:
                f.write(f"# Placeholder for {size}x{size} PNG icon\n")
                f.write("# Replace this with an actual PNG file\n")
            print(f"Created placeholder {filename}")

        print("\n📝 To create proper icons:")
        print("1. Install Pillow: pip3 install Pillow")
        print("2. Run: python3 create_icons.py")
        print("3. Or manually create PNG files in the icons/ folder")
