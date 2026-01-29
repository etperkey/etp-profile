"""
Asset Processing Script with AI Background Removal
"""

from rembg import remove
from PIL import Image
import os

ASSETS_DIR = os.path.dirname(os.path.abspath(__file__))
HEADS_DIR = os.path.join(ASSETS_DIR, "heads")
OUTPUT_DIR = os.path.join(ASSETS_DIR, "processed")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def remove_bg_ai(input_path, output_path):
    """Remove background using AI (rembg)"""
    print(f"  Processing: {os.path.basename(input_path)}")
    with open(input_path, 'rb') as f:
        input_data = f.read()
    output_data = remove(input_data)
    with open(output_path, 'wb') as f:
        f.write(output_data)
    img = Image.open(output_path)
    print(f"    -> {os.path.basename(output_path)} ({img.size[0]}x{img.size[1]})")
    return img

def main():
    print("=" * 60)
    print("WORMS PARODY - AI ASSET PROCESSING")
    print("=" * 60)
    print()

    # Process RFK head
    print("Processing RFK Jr head...")
    rfk_path = os.path.join(HEADS_DIR, "RFKJrface.jpg")
    if os.path.exists(rfk_path):
        remove_bg_ai(rfk_path, os.path.join(OUTPUT_DIR, "rfk-head-clean.png"))

    # Process Jay head
    print("\nProcessing Jay Bhattacharya head...")
    jay_path = os.path.join(HEADS_DIR, "Jayhead.png")
    if os.path.exists(jay_path):
        remove_bg_ai(jay_path, os.path.join(OUTPUT_DIR, "jay-head-clean.png"))

    # Process RFK mouth
    print("\nProcessing RFK mouth...")
    mouth_path = os.path.join(ASSETS_DIR, "RFKmouth.png")
    if os.path.exists(mouth_path):
        # Just convert to RGBA, keep as is (it's already a mouth closeup)
        img = Image.open(mouth_path).convert("RGBA")
        output_path = os.path.join(OUTPUT_DIR, "rfk-mouth.png")
        img.save(output_path, "PNG")
        print(f"  -> rfk-mouth.png ({img.size[0]}x{img.size[1]})")

    # Process baby mouths - crop just the mouth area
    print("\nProcessing baby mouths...")
    for i in range(1, 6):
        mouth_path = os.path.join(HEADS_DIR, f"babymouth{i}.png")
        if os.path.exists(mouth_path):
            img = Image.open(mouth_path).convert("RGBA")
            output_path = os.path.join(OUTPUT_DIR, f"babymouth{i}.png")
            img.save(output_path, "PNG")
            print(f"  -> babymouth{i}.png ({img.size[0]}x{img.size[1]})")

    # List final assets
    print("\n" + "=" * 60)
    print("PROCESSED ASSETS SUMMARY")
    print("=" * 60)
    print()

    total_size = 0
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.png'):
            path = os.path.join(OUTPUT_DIR, f)
            img = Image.open(path)
            size = os.path.getsize(path)
            total_size += size
            print(f"  {f:30} {img.size[0]:4}x{img.size[1]:<4}  ({size//1024:>4} KB)")

    print()
    print(f"  Total: {total_size//1024} KB")
    print()
    print("=" * 60)
    print("DONE! Assets ready in 'processed' folder")
    print("=" * 60)

if __name__ == "__main__":
    main()
