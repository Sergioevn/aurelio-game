"""Genera le icone dell'app dalla testa di Aurelio in src/data/sprites.js.
Uso: python3 tools/make_icons.py"""
import json, re, pathlib
from PIL import Image, ImageDraw

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'src/data/sprites.js').read_text()

def block(name):
    m = re.search(r'export const ' + name + r' = (\{.*?\n\});', src, re.S)
    return json.loads(m.group(1))

pal, spr = block('PALETTE'), block('SPRITES')
rows = spr['aurelio'][:13]  # solo la testa
w = max(len(r) for r in rows) + 2
h = len(rows) + 2

def px(x, y):
    if 1 <= y <= len(rows) and 1 <= x <= len(rows[y - 1]):
        return rows[y - 1][x - 1]
    return '.'

def hexrgb(s):
    return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))

head = Image.new('RGBA', (w, h), (0, 0, 0, 0))
for y in range(h):
    for x in range(w):
        c = px(x, y)
        if c in pal:
            head.putpixel((x, y), hexrgb(pal[c]) + (255,))
        elif any(px(x + dx, y + dy) in pal for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            head.putpixel((x, y), hexrgb('#1a1423') + (255,))

def icon(size, pad):
    img = Image.new('RGBA', (size, size), hexrgb('#f4d03f') + (255,))
    d = ImageDraw.Draw(img)
    stripe = size // 6  # bandiera spagnola stilizzata sullo sfondo
    d.rectangle([0, size - stripe * 2, size, size], fill=hexrgb('#c0392b'))
    scale = int((size * (1 - pad * 2)) // max(w, h))
    big = head.resize((w * scale, h * scale), Image.NEAREST)
    img.alpha_composite(big, ((size - big.width) // 2, (size - big.height) // 2 + size // 20))
    return img

out = root / 'assets/icons'
out.mkdir(parents=True, exist_ok=True)
icon(192, 0.08).save(out / 'icon-192.png')
icon(512, 0.08).save(out / 'icon-512.png')
icon(512, 0.2).save(out / 'icon-maskable-512.png')
icon(180, 0.08).convert('RGB').save(out / 'apple-touch-icon.png')
print('icone generate in', out)
