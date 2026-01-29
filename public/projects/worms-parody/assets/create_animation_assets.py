"""
Create Animation Assets:
A) RFK jaw separation
B) Cartoon worm character sheet
C) Baby mouth worm composites
"""

from PIL import Image, ImageDraw, ImageFilter
import os
import random
import math

ASSETS_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(ASSETS_DIR, "processed")
OUTPUT_DIR = os.path.join(ASSETS_DIR, "animation-ready")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =============================================================================
# A) RFK JAW SEPARATION
# =============================================================================

def separate_rfk_jaw():
    """
    Separate RFK's jaw from his head for lip-sync animation.
    The jaw will be a separate layer that can rotate/move.
    """
    print("\n" + "="*60)
    print("A) SEPARATING RFK JAW")
    print("="*60)

    img_path = os.path.join(PROCESSED_DIR, "rfk-head-clean.png")
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size

    # The jaw line is roughly at 70% down the face
    # We'll create a curved cut following the jawline
    jaw_start_y = int(height * 0.68)  # Where jaw separation begins

    # Create masks for head (above jaw) and jaw (below)
    head_mask = Image.new("L", (width, height), 255)
    jaw_mask = Image.new("L", (width, height), 0)

    head_draw = ImageDraw.Draw(head_mask)
    jaw_draw = ImageDraw.Draw(jaw_mask)

    # Create a curved jawline cut
    # The curve goes from ear to ear, dipping at the chin
    points = []
    for x in range(width):
        # Parabolic curve - higher at edges, lower in middle (chin)
        normalized_x = (x - width/2) / (width/2)  # -1 to 1
        curve_offset = int(30 * (1 - normalized_x**2))  # Dip in middle
        y = jaw_start_y + curve_offset
        points.append((x, y))

    # Draw the separation
    # Head: everything above the curve
    head_points = points + [(width, 0), (0, 0)]
    head_draw.polygon(head_points, fill=255)

    # Jaw: everything below the curve
    jaw_points = points + [(width, height), (0, height)]
    jaw_draw.polygon(jaw_points, fill=255)

    # Apply feathering to the cut edge for smoother blending
    head_mask = head_mask.filter(ImageFilter.GaussianBlur(2))
    jaw_mask = jaw_mask.filter(ImageFilter.GaussianBlur(2))

    # Create head image (jaw area transparent)
    head_img = img.copy()
    head_alpha = head_img.split()[3]
    head_alpha = Image.composite(head_alpha, Image.new("L", (width, height), 0), head_mask)
    head_img.putalpha(head_alpha)

    # Create jaw image (head area transparent)
    jaw_img = img.copy()
    jaw_alpha = jaw_img.split()[3]
    jaw_alpha = Image.composite(jaw_alpha, Image.new("L", (width, height), 0), jaw_mask)
    jaw_img.putalpha(jaw_alpha)

    # Crop jaw to its bounding box
    jaw_bbox = jaw_img.getbbox()
    if jaw_bbox:
        jaw_img = jaw_img.crop(jaw_bbox)

    # Save
    head_path = os.path.join(OUTPUT_DIR, "rfk-head-nojaw.png")
    jaw_path = os.path.join(OUTPUT_DIR, "rfk-jaw.png")

    head_img.save(head_path, "PNG")
    jaw_img.save(jaw_path, "PNG")

    print(f"  Saved: rfk-head-nojaw.png ({head_img.size[0]}x{head_img.size[1]})")
    print(f"  Saved: rfk-jaw.png ({jaw_img.size[0]}x{jaw_img.size[1]})")

    # Also save jaw position info
    jaw_info = f"""# RFK Jaw Position Info

Original head size: {width}x{height}
Jaw bounding box: {jaw_bbox}
Jaw anchor point (for rotation): approximately center-top of jaw image

## Animation Notes:
- The jaw pivots from roughly where it meets the ears
- Rotate the jaw 5-15 degrees for open mouth
- Jaw anchor X: {width // 2}
- Jaw anchor Y: {jaw_start_y}
"""
    with open(os.path.join(OUTPUT_DIR, "rfk-jaw-info.txt"), "w") as f:
        f.write(jaw_info)

    return head_img, jaw_img

# =============================================================================
# B) CARTOON WORM CHARACTER SHEET
# =============================================================================

def draw_worm(draw, x, y, size, color, expression="neutral", angle=0):
    """Draw a simple cartoon worm at position"""
    # Worm is basically an S-curve tube with a face

    # Body color and highlight
    body_color = color
    highlight = tuple(min(255, c + 40) for c in color[:3]) + (255,)
    shadow = tuple(max(0, c - 30) for c in color[:3]) + (255,)

    # Draw segmented body as overlapping circles
    segments = 8
    segment_size = size // 3

    # S-curve path
    for i in range(segments):
        t = i / (segments - 1)
        # S-curve: offset alternates
        curve_x = x + math.sin(t * math.pi * 1.5) * (size * 0.3)
        curve_y = y + t * size

        # Draw segment
        seg_color = body_color if i % 2 == 0 else highlight
        draw.ellipse([
            curve_x - segment_size//2,
            curve_y - segment_size//2,
            curve_x + segment_size//2,
            curve_y + segment_size//2
        ], fill=seg_color, outline=shadow)

    # Head (first segment, larger)
    head_x = x + math.sin(0) * (size * 0.3)
    head_y = y
    head_size = segment_size * 1.3

    draw.ellipse([
        head_x - head_size//2,
        head_y - head_size//2,
        head_x + head_size//2,
        head_y + head_size//2
    ], fill=body_color, outline=shadow)

    # Eyes
    eye_size = head_size // 4
    eye_offset = head_size // 4

    # Left eye
    draw.ellipse([
        head_x - eye_offset - eye_size//2,
        head_y - eye_size//2,
        head_x - eye_offset + eye_size//2,
        head_y + eye_size//2
    ], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))

    # Right eye
    draw.ellipse([
        head_x + eye_offset - eye_size//2,
        head_y - eye_size//2,
        head_x + eye_offset + eye_size//2,
        head_y + eye_size//2
    ], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))

    # Pupils (adjust based on expression)
    pupil_size = eye_size // 2
    pupil_offset_y = 0

    if expression == "looking_up":
        pupil_offset_y = -2
    elif expression == "looking_down":
        pupil_offset_y = 2
    elif expression == "smug":
        pupil_offset_y = -1

    # Left pupil
    draw.ellipse([
        head_x - eye_offset - pupil_size//2,
        head_y + pupil_offset_y - pupil_size//2,
        head_x - eye_offset + pupil_size//2,
        head_y + pupil_offset_y + pupil_size//2
    ], fill=(0, 0, 0, 255))

    # Right pupil
    draw.ellipse([
        head_x + eye_offset - pupil_size//2,
        head_y + pupil_offset_y - pupil_size//2,
        head_x + eye_offset + pupil_size//2,
        head_y + pupil_offset_y + pupil_size//2
    ], fill=(0, 0, 0, 255))

    # Mouth based on expression
    mouth_y = head_y + head_size // 4

    if expression == "neutral":
        # Simple line
        draw.line([
            head_x - head_size//4, mouth_y,
            head_x + head_size//4, mouth_y
        ], fill=(0, 0, 0, 255), width=2)
    elif expression == "happy":
        # Smile arc
        draw.arc([
            head_x - head_size//4, mouth_y - head_size//8,
            head_x + head_size//4, mouth_y + head_size//8
        ], start=0, end=180, fill=(0, 0, 0, 255), width=2)
    elif expression == "open":
        # Open mouth (circle)
        draw.ellipse([
            head_x - head_size//6, mouth_y - head_size//8,
            head_x + head_size//6, mouth_y + head_size//6
        ], fill=(80, 0, 0, 255), outline=(0, 0, 0, 255))
    elif expression == "smug":
        # Smirk
        draw.arc([
            head_x - head_size//6, mouth_y - head_size//8,
            head_x + head_size//3, mouth_y + head_size//8
        ], start=0, end=180, fill=(0, 0, 0, 255), width=2)
    elif expression == "chomp":
        # Big open mouth with teeth hint
        draw.ellipse([
            head_x - head_size//4, mouth_y - head_size//6,
            head_x + head_size//4, mouth_y + head_size//4
        ], fill=(80, 0, 0, 255), outline=(0, 0, 0, 255))
        # Teeth
        draw.line([
            head_x - head_size//6, mouth_y - head_size//10,
            head_x + head_size//6, mouth_y - head_size//10
        ], fill=(255, 255, 255, 255), width=3)

def create_worm_character_sheet():
    """Create a character sheet with worm in various expressions/poses"""
    print("\n" + "="*60)
    print("B) CREATING WORM CHARACTER SHEET")
    print("="*60)

    # Pink worm color
    worm_pink = (255, 180, 190, 255)

    # Create character sheet
    sheet_width = 800
    sheet_height = 600
    sheet = Image.new("RGBA", (sheet_width, sheet_height), (240, 240, 240, 255))
    draw = ImageDraw.Draw(sheet)

    # Title
    draw.text((20, 10), "WORM CHARACTER SHEET", fill=(0, 0, 0, 255))

    # Draw worms with different expressions
    expressions = ["neutral", "happy", "open", "smug", "chomp", "looking_up"]
    labels = ["Neutral", "Happy", "Singing", "Smug", "Chomp!", "Looking Up"]

    worm_size = 120
    start_x = 80
    start_y = 80
    spacing = 130

    for i, (expr, label) in enumerate(zip(expressions, labels)):
        col = i % 3
        row = i // 3
        x = start_x + col * (spacing + 80)
        y = start_y + row * (worm_size + 100)

        draw_worm(draw, x, y, worm_size, worm_pink, expression=expr)
        draw.text((x - 30, y + worm_size + 20), label, fill=(0, 0, 0, 255))

    # Save sheet
    sheet_path = os.path.join(OUTPUT_DIR, "worm-character-sheet.png")
    sheet.save(sheet_path, "PNG")
    print(f"  Saved: worm-character-sheet.png ({sheet_width}x{sheet_height})")

    # Also create individual worm images
    for expr in expressions:
        worm_img = Image.new("RGBA", (150, 200), (0, 0, 0, 0))
        worm_draw = ImageDraw.Draw(worm_img)
        draw_worm(worm_draw, 75, 40, 140, worm_pink, expression=expr)

        worm_path = os.path.join(OUTPUT_DIR, f"worm-{expr}.png")
        worm_img.save(worm_path, "PNG")
        print(f"  Saved: worm-{expr}.png")

    return sheet

# =============================================================================
# C) BABY MOUTH WORM COMPOSITES (DUNE WORMS)
# =============================================================================

def create_dune_worm_body(width, height, segments=12):
    """Create a large segmented worm body"""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Worm colors - fleshy pink/gray
    colors = [
        (200, 150, 160, 255),  # Base pink
        (180, 140, 150, 255),  # Darker segment
        (220, 170, 180, 255),  # Lighter segment
    ]

    segment_height = height // segments

    for i in range(segments):
        y = i * segment_height
        color = colors[i % len(colors)]

        # Each segment is an ellipse
        # Wider in middle, narrower at ends
        progress = i / (segments - 1)
        # Width peaks in middle
        width_factor = 1 - abs(progress - 0.3) * 0.5
        seg_width = int(width * 0.8 * width_factor)

        x_offset = (width - seg_width) // 2

        draw.ellipse([
            x_offset, y,
            x_offset + seg_width, y + segment_height + 10
        ], fill=color, outline=(100, 80, 90, 255))

    return img

def composite_baby_mouth_worm():
    """Composite baby mouths onto worm bodies for Dune worm effect"""
    print("\n" + "="*60)
    print("C) CREATING BABY MOUTH WORM COMPOSITES")
    print("="*60)

    # Load baby mouths
    baby_mouths = []
    for i in [1, 2, 3, 5]:  # Skip 4, it's not a baby
        mouth_path = os.path.join(PROCESSED_DIR, f"babymouth{i}.png")
        if os.path.exists(mouth_path):
            baby_mouths.append((i, Image.open(mouth_path).convert("RGBA")))

    if not baby_mouths:
        print("  No baby mouth images found!")
        return

    # Create several Dune worm variants
    for idx, (mouth_num, mouth_img) in enumerate(baby_mouths):
        # Create worm body
        worm_width = 400
        worm_height = 600
        worm_body = create_dune_worm_body(worm_width, worm_height)

        # Scale mouth to fit worm width
        mouth_scale = (worm_width * 0.9) / mouth_img.width
        new_mouth_width = int(mouth_img.width * mouth_scale)
        new_mouth_height = int(mouth_img.height * mouth_scale)
        mouth_resized = mouth_img.resize((new_mouth_width, new_mouth_height), Image.Resampling.LANCZOS)

        # Position mouth at top of worm (it's emerging upward)
        mouth_x = (worm_width - new_mouth_width) // 2
        mouth_y = 10  # Near top

        # Composite
        result = worm_body.copy()
        result.paste(mouth_resized, (mouth_x, mouth_y), mouth_resized)

        # Add some "emergence" effect - darker at bottom
        overlay = Image.new("RGBA", (worm_width, worm_height), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        for y in range(worm_height // 2, worm_height):
            alpha = int(180 * (y - worm_height//2) / (worm_height//2))
            overlay_draw.line([(0, y), (worm_width, y)], fill=(0, 0, 0, alpha))

        result = Image.alpha_composite(result, overlay)

        # Save
        output_path = os.path.join(OUTPUT_DIR, f"dune-worm-babymouth{mouth_num}.png")
        result.save(output_path, "PNG")
        print(f"  Saved: dune-worm-babymouth{mouth_num}.png ({worm_width}x{worm_height})")

    # Create a GIANT one with babymouth1 (the screaming one)
    print("\n  Creating GIANT Dune worm (for the bridge scene)...")
    giant_width = 800
    giant_height = 1000
    giant_body = create_dune_worm_body(giant_width, giant_height, segments=16)

    # Use babymouth1 (the best screaming one)
    mouth_img = Image.open(os.path.join(PROCESSED_DIR, "babymouth1.png")).convert("RGBA")
    mouth_scale = (giant_width * 0.85) / mouth_img.width
    giant_mouth = mouth_img.resize(
        (int(mouth_img.width * mouth_scale), int(mouth_img.height * mouth_scale)),
        Image.Resampling.LANCZOS
    )

    # Position
    mouth_x = (giant_width - giant_mouth.width) // 2
    mouth_y = 20

    giant_result = giant_body.copy()
    giant_result.paste(giant_mouth, (mouth_x, mouth_y), giant_mouth)

    # Darker emergence overlay
    overlay = Image.new("RGBA", (giant_width, giant_height), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    for y in range(giant_height // 2, giant_height):
        alpha = int(200 * (y - giant_height//2) / (giant_height//2))
        overlay_draw.line([(0, y), (giant_width, y)], fill=(0, 0, 0, alpha))

    giant_result = Image.alpha_composite(giant_result, overlay)

    output_path = os.path.join(OUTPUT_DIR, "DUNE-WORM-GIANT.png")
    giant_result.save(output_path, "PNG")
    print(f"  Saved: DUNE-WORM-GIANT.png ({giant_width}x{giant_height}) - THE BIG ONE!")

# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    print("="*60)
    print("WORMS PARODY - ANIMATION ASSET CREATION")
    print("="*60)

    # A) RFK Jaw
    separate_rfk_jaw()

    # B) Worm character sheet
    create_worm_character_sheet()

    # C) Baby mouth worms
    composite_baby_mouth_worm()

    print("\n" + "="*60)
    print("ALL DONE!")
    print(f"Assets saved to: {OUTPUT_DIR}")
    print("="*60)

    # List all created files
    print("\nCreated files:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        path = os.path.join(OUTPUT_DIR, f)
        if os.path.isfile(path):
            size = os.path.getsize(path) // 1024
            print(f"  {f:40} ({size:>4} KB)")
