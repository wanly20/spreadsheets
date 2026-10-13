#!/usr/bin/env python3
"""Cut the mascot out of its background and export a WebP for the app.

    CUDA_VISIBLE_DEVICES= ~/Documents/video_generation/Wan2GP/.venv/bin/python \
        tools/process_mascot.py design/mascot/penguin_laptop_s1.png assets/mascot/mascot.webp

Runs rembg on the CPU (never the GPU), trims the transparent border, scales the
longest side to 512px and writes a WebP. The source PNG is never modified.
To change the mascot, run this on the new picture and keep the output name
(or change MASCOT in js/brand.js).
"""
import os
import sys

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")  # CPU only

from PIL import Image  # noqa: E402
import rembg  # noqa: E402


def fill_holes(img):
    """rembg can make white areas inside the figure (a face, a belly) see-through.
    Anything the background can't reach from the edge of the picture is part of
    the figure, so make it fully opaque; the outline keeps its soft edge."""
    from PIL import ImageChops, ImageDraw, ImageFilter
    a = img.getchannel("A")
    solid = a.point(lambda v: 255 if v > 24 else 0)
    outside = solid.copy()
    w, h = outside.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if outside.getpixel(seed) == 0:
            ImageDraw.floodfill(outside, seed, 128)
    inside = outside.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.MinFilter(5))
    img.putalpha(ImageChops.lighter(a, inside))
    return img


def main(src, dst, size=512, model="isnet-general-use"):
    img = Image.open(src).convert("RGB")
    session = rembg.new_session(model, providers=["CPUExecutionProvider"])
    # Only the mask comes from rembg; the colours stay the original's (rembg's own
    # cut-out darkens half-transparent pixels).
    mask = rembg.remove(img, session=session, only_mask=True).convert("L")
    cut = img.convert("RGBA")
    cut.putalpha(mask)
    cut = fill_holes(cut)
    box = cut.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if box:
        pad = 8
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(cut.width, box[2] + pad), min(cut.height, box[3] + pad))
        cut = cut.crop(box)
    cut.thumbnail((size, size), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
    cut.save(dst, "WEBP", quality=88, method=6)
    print(f"{src} -> {dst} {cut.size} {os.path.getsize(dst) // 1024} KB")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
