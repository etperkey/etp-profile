"""
Asset Processing Script for Worms Parody
Processes head cutouts and prepares them for animation
"""

from PIL import Image
import os

ASSETS_DIR = os.path.dirname(os.path.abspath(__file__))
HEADS_DIR = os.path.join(ASSETS_DIR, "heads")
OUTPUT_DIR = os.path.join(ASSETS_DIR, "processed")

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

def remove_white_background(img, threshold=240):
    """Remove white/near-white background and make transparent"""
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        # If pixel is white-ish, make transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def remove_color_background(img, target_color, tolerance=40):
    """Remove a specific color background"""
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for item in data:
        # Check if pixel is close to target color
        diff = sum(abs(item[i] - target_color[i]) for i in range(3))
        if diff < tolerance * 3:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def crop_to_content(img, padding=10):
    """Crop image to non-transparent content with padding"""
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    if bbox:
        # Add padding
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(img.width, bbox[2] + padding)
        bottom = min(img.height, bbox[3] + padding)
        return img.crop((left, top, right, bottom))
    return img

def process_rfk_head():
    """Process RFK Jr face - already mostly cut out"""
    print("Processing RFK head...")
    img_path = os.path.join(HEADS_DIR, "RFKJrface.jpg")
    if os.path.exists(img_path):
        img = Image.open(img_path)
        # Remove white background
        img = remove_white_background(img, threshold=245)
        # Crop to content
        img = crop_to_content(img, padding=5)
        # Save
        output_path = os.path.join(OUTPUT_DIR, "rfk-head-clean.png")
        img.save(output_path, "PNG")
        print(f"  Saved: {output_path} ({img.size[0]}x{img.size[1]})")
        return img
    else:
        print(f"  File not found: {img_path}")
        return None

def process_jay_head():
    """Process Jay Bhattacharya head - needs background removal"""
    print("Processing Jay head...")
    img_path = os.path.join(HEADS_DIR, "Jayhead.png")
    if os.path.exists(img_path):
        img = Image.open(img_path)
        # The background looks beige/tan - try to remove it
        # Approximate beige color: RGB(210, 195, 170)
        img = remove_color_background(img, (210, 195, 170), tolerance=35)
        # Also try to catch the reddish areas at edges
        img = remove_color_background(img, (140, 60, 60), tolerance=30)
        # Crop to content
        img = crop_to_content(img, padding=5)
        # Save
        output_path = os.path.join(OUTPUT_DIR, "jay-head-clean.png")
        img.save(output_path, "PNG")
        print(f"  Saved: {output_path} ({img.size[0]}x{img.size[1]})")
        return img
    else:
        print(f"  File not found: {img_path}")
        return None

def process_baby_mouths():
    """Process baby mouth images - crop to mouth area"""
    print("Processing baby mouths...")
    processed = []

    for i in range(1, 6):
        img_path = os.path.join(HEADS_DIR, f"babymouth{i}.png")
        if os.path.exists(img_path):
            img = Image.open(img_path)
            img = img.convert("RGBA")
            # These are already cropped pretty well, just ensure RGBA
            output_path = os.path.join(OUTPUT_DIR, f"babymouth{i}-clean.png")
            img.save(output_path, "PNG")
            print(f"  Saved: {output_path} ({img.size[0]}x{img.size[1]})")
            processed.append(img)
        else:
            print(f"  File not found: {img_path}")

    return processed

def process_rfk_mouth():
    """Process RFK mouth for lip sync"""
    print("Processing RFK mouth...")
    img_path = os.path.join(ASSETS_DIR, "RFKmouth.png")
    if os.path.exists(img_path):
        img = Image.open(img_path)
        img = img.convert("RGBA")
        output_path = os.path.join(OUTPUT_DIR, "rfk-mouth-clean.png")
        img.save(output_path, "PNG")
        print(f"  Saved: {output_path} ({img.size[0]}x{img.size[1]})")
        return img
    else:
        print(f"  File not found: {img_path}")
        return None

def create_asset_summary():
    """Create a summary of processed assets"""
    summary = """# Processed Assets Summary

## Heads (for animation)
"""
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith('.png'):
            img = Image.open(os.path.join(OUTPUT_DIR, f))
            summary += f"- **{f}**: {img.size[0]}x{img.size[1]} px\n"

    summary += """
## Recommended Usage

### RFK Jr
- `rfk-head-clean.png` - Main head for bouncing/reactions
- `rfk-mouth-clean.png` - Mouth overlay for lip sync

### Jay Bhattacharya
- `jay-head-clean.png` - Head for drumming character

### Baby Mouths (for Dune Worm)
- `babymouth1-clean.png` - Wide open, full teeth (BEST for screaming)
- `babymouth3-clean.png` - Good angle, teeth visible
- `babymouth5-clean.png` - Wide smile with gaps

### Animation Notes
- Separate the JAW from each head for lip sync animation
- Use mouth images as reference or overlay
"""

    with open(os.path.join(OUTPUT_DIR, "ASSET-SUMMARY.md"), "w") as f:
        f.write(summary)
    print(f"\nSummary saved to: {os.path.join(OUTPUT_DIR, 'ASSET-SUMMARY.md')}")

if __name__ == "__main__":
    print("=" * 50)
    print("WORMS PARODY - ASSET PROCESSING")
    print("=" * 50)
    print()

    process_rfk_head()
    process_jay_head()
    process_baby_mouths()
    process_rfk_mouth()

    print()
    create_asset_summary()

    print()
    print("=" * 50)
    print("DONE! Check the 'processed' folder for cleaned assets.")
    print("=" * 50)
