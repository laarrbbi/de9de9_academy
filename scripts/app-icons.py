"""Draws the app icons and launch screens from resources/logo.png.

    python3 scripts/app-icons.py

Needs Pillow (pip install pillow). Overwrites the images Capacitor put in
android/ and ios/; run it again whenever the logo changes. The logo is the
store's full-size mark (laarrbbi/de9de9, docs/design/figma-refs/logo-raw-1.png),
cropped to its edges.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
LOGO = Image.open(ROOT / "resources" / "logo.png").convert("RGBA")
WHITE = (255, 255, 255, 255)
RES = ROOT / "android" / "app" / "src" / "main" / "res"
ASSETS = ROOT / "ios" / "App" / "App" / "Assets.xcassets"


def logo_on(canvas, share):
    """Pastes the logo centred on `canvas`, `share` of the canvas width wide."""
    width = round(canvas.width * share)
    height = round(width * LOGO.height / LOGO.width)
    logo = LOGO.resize((width, height), Image.LANCZOS)
    canvas.alpha_composite(logo, ((canvas.width - width) // 2, (canvas.height - height) // 2))
    return canvas


def masked(size, shape, share):
    """A white tile in `shape` ('square' or 'circle') with the logo on it."""
    scale = 4  # draw large, then shrink, for smooth edges
    big = size * scale
    mask = Image.new("L", (big, big), 0)
    draw = ImageDraw.Draw(mask)
    if shape == "circle":
        draw.ellipse((0, 0, big - 1, big - 1), fill=255)
    else:
        draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=big * 0.2, fill=255)
    tile = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    tile.paste(Image.new("RGBA", (big, big), WHITE), mask=mask)
    return logo_on(tile, share).resize((size, size), Image.LANCZOS)


# Android launcher icons. Legacy icons are a white tile; the adaptive icon is
# the logo alone on 108dp, kept inside the 66dp safe circle, on the white
# background colour already set in values/ic_launcher_background.xml.
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
for name, factor in DENSITIES.items():
    folder = RES / f"mipmap-{name}"
    masked(round(48 * factor), "square", 0.74).save(folder / "ic_launcher.png")
    masked(round(48 * factor), "circle", 0.62).save(folder / "ic_launcher_round.png")
    side = round(108 * factor)
    logo_on(Image.new("RGBA", (side, side), (0, 0, 0, 0)), 0.5).save(folder / "ic_launcher_foreground.png")

# Android launch screen: the logo on white, at every size Capacitor ships.
for splash in RES.glob("drawable*/splash.png"):
    size = Image.open(splash).size
    canvas = Image.new("RGBA", size, WHITE)
    share = 0.3 * min(size) / size[0]
    logo_on(canvas, share).convert("RGB").save(splash)

# iOS: one 1024px icon (no transparency allowed) and the launch image.
logo_on(Image.new("RGBA", (1024, 1024), WHITE), 0.7).convert("RGB").save(
    ASSETS / "AppIcon.appiconset" / "AppIcon-512@2x.png"
)
for splash in (ASSETS / "Splash.imageset").glob("*.png"):
    logo_on(Image.new("RGBA", (2732, 2732), WHITE), 0.22).convert("RGB").save(splash)

print("icons and launch screens written for android/ and ios/")
