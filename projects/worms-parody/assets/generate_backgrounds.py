"""
Generate background images for the Worms Parody animation
Since we can't easily download stock photos, we'll create stylized backgrounds
"""

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import random
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "backgrounds")
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH = 800
HEIGHT = 600


def add_noise(img, amount=20):
    """Add film grain noise"""
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b = pixels[x, y][:3]
            noise = random.randint(-amount, amount)
            r = max(0, min(255, r + noise))
            g = max(0, min(255, g + noise))
            b = max(0, min(255, b + noise))
            if img.mode == 'RGBA':
                pixels[x, y] = (r, g, b, 255)
            else:
                pixels[x, y] = (r, g, b)
    return img


def create_brain_background():
    """Pink/gray brain tissue background"""
    print("Creating brain background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Gradient base
    for y in range(HEIGHT):
        r = int(45 + (y / HEIGHT) * 20)
        g = int(27 + (y / HEIGHT) * 15)
        b = int(61 + (y / HEIGHT) * 10)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Add brain-like blobs
    for _ in range(30):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        size = random.randint(50, 150)
        alpha = random.randint(20, 60)
        color = (255, 107 + random.randint(-20, 20), 157 + random.randint(-20, 20))

        # Create blob
        blob = Image.new('RGBA', (size*2, size*2), (0, 0, 0, 0))
        blob_draw = ImageDraw.Draw(blob)
        blob_draw.ellipse([0, 0, size*2, size*2], fill=(*color, alpha))
        blob = blob.filter(ImageFilter.GaussianBlur(size // 3))

        img.paste(Image.blend(
            img.crop((max(0, x-size), max(0, y-size), min(WIDTH, x+size), min(HEIGHT, y+size))).convert('RGBA'),
            blob.crop((
                max(0, size-x), max(0, size-y),
                min(size*2, size*2-(x+size-WIDTH)) if x+size > WIDTH else size*2,
                min(size*2, size*2-(y+size-HEIGHT)) if y+size > HEIGHT else size*2
            )),
            0.3
        ).convert('RGB'), (max(0, x-size), max(0, y-size)))

    img = add_noise(img.convert('RGBA'), 10).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "brain-tissue.jpg"), quality=85)
    print("  Saved: brain-tissue.jpg")


def create_graveyard_background():
    """Spooky graveyard at night"""
    print("Creating graveyard background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Night sky gradient
    for y in range(HEIGHT):
        darkness = y / HEIGHT
        r = int(10 + darkness * 15)
        g = int(15 + darkness * 20)
        b = int(30 + darkness * 10)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Moon
    moon_x, moon_y = 650, 80
    draw.ellipse([moon_x-40, moon_y-40, moon_x+40, moon_y+40], fill=(240, 240, 220))
    # Moon glow
    for i in range(5):
        glow_size = 50 + i * 15
        glow_alpha = 30 - i * 5
        glow = Image.new('RGBA', (glow_size*2, glow_size*2), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.ellipse([0, 0, glow_size*2, glow_size*2], fill=(200, 200, 180, glow_alpha))
        glow = glow.filter(ImageFilter.GaussianBlur(10))

    # Ground
    ground_y = 450
    draw.rectangle([0, ground_y, WIDTH, HEIGHT], fill=(20, 25, 15))

    # Tombstones
    tombstone_positions = [(100, ground_y), (200, ground_y-10), (350, ground_y+5),
                           (500, ground_y-5), (620, ground_y), (720, ground_y+10)]

    for tx, ty in tombstone_positions:
        # Tombstone shape
        tw = random.randint(40, 70)
        th = random.randint(80, 130)
        color = (60 + random.randint(-10, 10), 65 + random.randint(-10, 10), 55 + random.randint(-10, 10))

        # Rounded top tombstone
        draw.rectangle([tx - tw//2, ty - th + 20, tx + tw//2, ty], fill=color)
        draw.ellipse([tx - tw//2, ty - th, tx + tw//2, ty - th + 40], fill=color)

        # Cross on some
        if random.random() > 0.5:
            draw.rectangle([tx - 3, ty - th + 30, tx + 3, ty - th + 70], fill=(40, 40, 35))
            draw.rectangle([tx - 15, ty - th + 40, tx + 15, ty - th + 48], fill=(40, 40, 35))

    # Fog at bottom
    for y in range(ground_y, HEIGHT):
        fog_alpha = int(40 * (y - ground_y) / (HEIGHT - ground_y))
        draw.line([(0, y), (WIDTH, y)], fill=(100, 100, 110, fog_alpha))

    # Dead trees
    def draw_tree(x, y):
        draw.line([(x, y), (x, y-150)], fill=(30, 25, 20), width=8)
        # Branches
        for _ in range(5):
            bx = x + random.randint(-60, 60)
            by = y - random.randint(50, 140)
            draw.line([(x, by + random.randint(-20, 20)), (bx, by)], fill=(30, 25, 20), width=3)

    draw_tree(50, ground_y)
    draw_tree(750, ground_y - 20)

    img = add_noise(img.convert('RGBA'), 15).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "graveyard.jpg"), quality=85)
    print("  Saved: graveyard.jpg")


def create_hospital_background():
    """Creepy hospital corridor"""
    print("Creating hospital corridor background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Greenish institutional color
    base_color = (180, 190, 170)

    # Fill base
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=(40, 50, 45))

    # Floor
    floor_y = 450
    draw.polygon([(0, floor_y), (WIDTH, floor_y), (WIDTH, HEIGHT), (0, HEIGHT)],
                 fill=(60, 65, 55))

    # Floor tiles (perspective)
    for i in range(10):
        y = floor_y + i * 20
        darkness = i * 5
        draw.line([(0, y), (WIDTH, y)], fill=(50 - darkness, 55 - darkness, 45 - darkness), width=2)

    # Walls (perspective corridor)
    vanishing_x = WIDTH // 2
    vanishing_y = HEIGHT // 3

    # Left wall
    draw.polygon([
        (0, 100), (vanishing_x - 100, vanishing_y),
        (vanishing_x - 100, floor_y - 50), (0, HEIGHT)
    ], fill=(70, 80, 70))

    # Right wall
    draw.polygon([
        (WIDTH, 100), (vanishing_x + 100, vanishing_y),
        (vanishing_x + 100, floor_y - 50), (WIDTH, HEIGHT)
    ], fill=(65, 75, 65))

    # Ceiling
    draw.polygon([
        (0, 0), (WIDTH, 0),
        (vanishing_x + 100, vanishing_y), (vanishing_x - 100, vanishing_y)
    ], fill=(50, 55, 50))

    # Door at end (dark)
    draw.rectangle([vanishing_x - 80, vanishing_y, vanishing_x + 80, floor_y - 50], fill=(20, 20, 25))

    # Flickering lights
    for i in range(3):
        lx = 100 + i * 250
        ly = 50
        light_on = random.random() > 0.3
        if light_on:
            # Light fixture
            draw.rectangle([lx - 30, ly, lx + 30, ly + 10], fill=(200, 200, 180))
            # Light cone
            for j in range(50):
                alpha = int(30 - j * 0.5)
                cone_y = ly + 10 + j * 3
                cone_width = 30 + j * 2

    # Dirty marks on walls
    for _ in range(20):
        mx = random.randint(0, WIDTH)
        my = random.randint(100, floor_y)
        msize = random.randint(10, 40)
        mark = Image.new('RGBA', (msize, msize), (0, 0, 0, 0))
        mark_draw = ImageDraw.Draw(mark)
        mark_draw.ellipse([0, 0, msize, msize], fill=(40, 45, 35, 50))
        mark = mark.filter(ImageFilter.GaussianBlur(5))

    img = add_noise(img.convert('RGBA'), 20).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "hospital-corridor.jpg"), quality=85)
    print("  Saved: hospital-corridor.jpg")


def create_underground_background():
    """Underground dirt/burial scene"""
    print("Creating underground background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Dark earth gradient
    for y in range(HEIGHT):
        darkness = 1 - (y / HEIGHT) * 0.3
        r = int(60 * darkness)
        g = int(45 * darkness)
        b = int(30 * darkness)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Dirt layers
    for y in range(0, HEIGHT, 30):
        layer_color = (
            50 + random.randint(-10, 10),
            40 + random.randint(-10, 10),
            25 + random.randint(-10, 10)
        )
        for x in range(0, WIDTH, 5):
            if random.random() > 0.3:
                draw.ellipse([x, y, x + random.randint(10, 30), y + random.randint(5, 15)],
                             fill=layer_color)

    # Roots
    for _ in range(8):
        root_x = random.randint(0, WIDTH)
        root_y = random.randint(-50, 100)
        points = [(root_x, root_y)]
        for _ in range(10):
            root_x += random.randint(-30, 30)
            root_y += random.randint(30, 60)
            points.append((root_x, root_y))
        draw.line(points, fill=(70, 50, 30), width=random.randint(3, 8))

    # Worms in the dirt
    for _ in range(5):
        wx = random.randint(100, WIDTH - 100)
        wy = random.randint(200, HEIGHT - 100)
        worm_color = (200, 150, 160)
        for i in range(8):
            segment_x = wx + math.sin(i * 0.5) * 20
            segment_y = wy + i * 10
            draw.ellipse([segment_x - 8, segment_y - 5, segment_x + 8, segment_y + 5],
                         fill=worm_color)

    # Bones
    for _ in range(3):
        bx = random.randint(50, WIDTH - 50)
        by = random.randint(300, HEIGHT - 50)
        # Simple bone shape
        draw.ellipse([bx, by, bx + 40, by + 15], fill=(220, 210, 190))
        draw.ellipse([bx - 10, by - 5, bx + 10, by + 20], fill=(220, 210, 190))
        draw.ellipse([bx + 30, by - 5, bx + 50, by + 20], fill=(220, 210, 190))

    img = add_noise(img.convert('RGBA'), 25).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "underground.jpg"), quality=85)
    print("  Saved: underground.jpg")


def create_nih_background():
    """Stylized NIH/government building"""
    print("Creating NIH building background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Sky
    for y in range(HEIGHT // 2):
        blue = int(150 + (y / (HEIGHT // 2)) * 50)
        draw.line([(0, y), (WIDTH, y)], fill=(100, 130, blue))

    # Ground
    draw.rectangle([0, HEIGHT // 2, WIDTH, HEIGHT], fill=(80, 100, 70))

    # Main building
    building_x = WIDTH // 2
    building_y = HEIGHT // 2
    building_w = 500
    building_h = 250

    # Building body
    draw.rectangle([
        building_x - building_w // 2, building_y - building_h,
        building_x + building_w // 2, building_y
    ], fill=(200, 195, 185))

    # Windows grid
    for row in range(5):
        for col in range(12):
            wx = building_x - building_w // 2 + 30 + col * 38
            wy = building_y - building_h + 30 + row * 45
            draw.rectangle([wx, wy, wx + 25, wy + 35], fill=(60, 80, 100))

    # Entrance
    draw.rectangle([building_x - 40, building_y - 80, building_x + 40, building_y], fill=(50, 50, 55))

    # NIH sign
    draw.rectangle([building_x - 60, building_y - building_h - 30, building_x + 60, building_y - building_h],
                   fill=(0, 80, 160))
    # Text would go here but we'll keep it simple

    # Columns
    for i in range(-2, 3):
        cx = building_x + i * 60
        draw.rectangle([cx - 10, building_y - 100, cx + 10, building_y], fill=(180, 175, 165))

    # Flag
    flag_x = building_x + building_w // 2 - 50
    draw.line([(flag_x, building_y - building_h - 50), (flag_x, building_y - building_h + 10)],
              fill=(100, 90, 80), width=3)
    draw.rectangle([flag_x, building_y - building_h - 50, flag_x + 40, building_y - building_h - 25],
                   fill=(200, 50, 50))

    img = add_noise(img.convert('RGBA'), 10).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "nih-building.jpg"), quality=85)
    print("  Saved: nih-building.jpg")


def create_stage_background():
    """Concert/performance stage with drums"""
    print("Creating stage background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Dark venue gradient
    for y in range(HEIGHT):
        r = int(20 + (y / HEIGHT) * 10)
        g = int(15 + (y / HEIGHT) * 10)
        b = int(25 + (y / HEIGHT) * 10)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Stage floor
    stage_y = 400
    draw.polygon([
        (0, stage_y), (WIDTH, stage_y),
        (WIDTH, HEIGHT), (0, HEIGHT)
    ], fill=(60, 50, 40))

    # Stage edge
    draw.rectangle([0, stage_y - 5, WIDTH, stage_y + 5], fill=(80, 60, 40))

    # Spotlights
    for i, lx in enumerate([150, 400, 650]):
        # Light beam
        for j in range(100):
            alpha = int(30 - j * 0.3)
            beam_y = 0 + j * 4
            beam_width = 20 + j
            color = [(255, 100, 100), (100, 100, 255), (255, 255, 100)][i]
            # Draw line with fading alpha effect
            if alpha > 0:
                draw.ellipse([lx - beam_width, beam_y, lx + beam_width, beam_y + 10],
                             fill=(*color[:3], alpha) if img.mode == 'RGBA' else color)

    # Drum kit silhouette (center-right)
    drum_x = 550
    drum_y = stage_y - 50

    # Bass drum
    draw.ellipse([drum_x - 60, drum_y - 50, drum_x + 60, drum_y + 50], fill=(40, 35, 30))
    draw.ellipse([drum_x - 50, drum_y - 40, drum_x + 50, drum_y + 40], fill=(80, 70, 60))

    # Snare
    draw.ellipse([drum_x - 100, drum_y - 20, drum_x - 40, drum_y + 20], fill=(70, 65, 55))

    # Hi-hat
    draw.ellipse([drum_x - 130, drum_y - 60, drum_x - 90, drum_y - 40], fill=(180, 170, 140))
    draw.line([(drum_x - 110, drum_y - 60), (drum_x - 110, drum_y + 30)], fill=(100, 90, 80), width=3)

    # Toms
    draw.ellipse([drum_x - 30, drum_y - 80, drum_x + 20, drum_y - 50], fill=(60, 55, 45))
    draw.ellipse([drum_x + 10, drum_y - 85, drum_x + 60, drum_y - 55], fill=(60, 55, 45))

    # Cymbals
    draw.ellipse([drum_x + 80, drum_y - 70, drum_x + 140, drum_y - 50], fill=(200, 180, 120))
    draw.line([(drum_x + 110, drum_y - 60), (drum_x + 110, drum_y + 20)], fill=(100, 90, 80), width=3)

    # Throne (drum seat)
    draw.ellipse([drum_x + 30, drum_y + 30, drum_x + 80, drum_y + 60], fill=(50, 45, 40))

    img = add_noise(img.convert('RGBA'), 15).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "stage-drums.jpg"), quality=85)
    print("  Saved: stage-drums.jpg")


def create_chaos_background():
    """Psychedelic chaos for the bridge"""
    print("Creating chaos background...")
    img = Image.new('RGB', (WIDTH, HEIGHT))
    draw = ImageDraw.Draw(img)

    # Wild colors
    for y in range(HEIGHT):
        hue = (y * 2) % 360
        r = int(128 + 127 * math.sin(hue * math.pi / 180))
        g = int(128 + 127 * math.sin((hue + 120) * math.pi / 180))
        b = int(128 + 127 * math.sin((hue + 240) * math.pi / 180))
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

    # Swirls
    for _ in range(20):
        cx = random.randint(0, WIDTH)
        cy = random.randint(0, HEIGHT)
        for r in range(10, 100, 10):
            color = (
                random.randint(100, 255),
                random.randint(50, 200),
                random.randint(100, 255)
            )
            draw.arc([cx - r, cy - r, cx + r, cy + r], 0, random.randint(90, 270),
                     fill=color, width=3)

    # Worm silhouettes everywhere
    for _ in range(15):
        wx = random.randint(0, WIDTH)
        wy = random.randint(0, HEIGHT)
        worm_color = (random.randint(200, 255), random.randint(100, 180), random.randint(150, 200))
        for i in range(6):
            segment_x = wx + math.sin(i * 0.8 + random.random()) * 30
            segment_y = wy + i * 15
            draw.ellipse([segment_x - 12, segment_y - 8, segment_x + 12, segment_y + 8],
                         fill=worm_color)

    img = add_noise(img.convert('RGBA'), 30).convert('RGB')
    img.save(os.path.join(OUTPUT_DIR, "chaos.jpg"), quality=85)
    print("  Saved: chaos.jpg")


if __name__ == "__main__":
    print("=" * 60)
    print("GENERATING BACKGROUND IMAGES")
    print("=" * 60)
    print()

    create_brain_background()
    create_graveyard_background()
    create_hospital_background()
    create_underground_background()
    create_nih_background()
    create_stage_background()
    create_chaos_background()

    print()
    print("=" * 60)
    print(f"DONE! Backgrounds saved to: {OUTPUT_DIR}")
    print("=" * 60)

    # List files
    print("\nGenerated files:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.jpg'):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f)) // 1024
            print(f"  {f}: {size} KB")
