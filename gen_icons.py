#!/usr/bin/env python3
"""Regenerate the app icons (rounded violet square + white heart) into icons/.

Usage:  python3 gen_icons.py   (requires Pillow)
"""
import math
import os

from PIL import Image, ImageDraw

SIZES = [512, 192, 180]
TOP = (139, 92, 246)     # violet-500
BOTTOM = (109, 40, 217)  # violet-700
SS = 4                   # supersample factor for smooth edges


def heart_points(cx, cy, half, n=240):
    """Parametric heart outline, x in [-16, 16], y in [-17, 12]."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * half / 16, cy - y * half / 16))
    return pts


def make_icon(size, path):
    s = size * SS

    # vertical gradient
    grad = Image.new("RGB", (1, 256))
    for y in range(256):
        t = y / 255
        grad.putpixel((0, y), tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)))
    grad = grad.resize((s, s))

    # rounded-square mask
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=255)

    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.paste(grad, (0, 0), mask)

    # white heart
    ImageDraw.Draw(img).polygon(heart_points(s / 2, s * 0.54, s * 0.26), fill=(255, 255, 255, 255))

    img = img.resize((size, size), Image.LANCZOS)
    img.save(path)
    print("wrote", path)


if __name__ == "__main__":
    os.makedirs("icons", exist_ok=True)
    for size in SIZES:
        make_icon(size, "icons/icon-%d.png" % size)
