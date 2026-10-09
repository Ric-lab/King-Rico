# Gera os ícones/splash do app a partir do King Rico mestre (sem IA, sem créditos).
# Uso: python3 scripts/icons.py  →  resources/*.png  →  npx capacitor-assets generate --android
import os
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'assets', 'king-rico', 'frames', 'master.png')
OUT = os.path.join(HERE, '..', 'resources')
PURPLE, DEEP, GOLD = (69, 21, 122), (30, 8, 56), (240, 180, 31)

def radial(size, inner, outer):
    w, h = size
    g = Image.new('RGB', size, outer)
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    d.ellipse((-w * .1, -h * .25, w * 1.1, h * .95), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(w * .18))
    return Image.composite(Image.new('RGB', size, inner), g, m)

king = Image.open(SRC).convert('RGBA')
king = king.crop(king.getchannel('A').getbbox())
# busto: da coroa até o peito (o corpo inteiro some num ícone pequeno)
bust = king.crop((0, 0, king.width, int(king.height * .62)))

def place(canvas, art, box_w, cy):
    s = box_w / art.width
    a = art.resize((round(art.width * s), round(art.height * s)), Image.LANCZOS)
    canvas.alpha_composite(a, ((canvas.width - a.width) // 2, round(cy - a.height / 2)))

os.makedirs(OUT, exist_ok=True)
# ícone legado (quadrado completo)
icon = radial((1024, 1024), PURPLE, DEEP).convert('RGBA')
place(icon, bust, 900, 560)
icon.save(os.path.join(OUT, 'icon-only.png'))
# adaptive icon: frente transparente dentro da zona segura (66%) + fundo
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
place(fg, bust, 640, 540)
fg.save(os.path.join(OUT, 'icon-foreground.png'))
radial((1024, 1024), PURPLE, DEEP).save(os.path.join(OUT, 'icon-background.png'))
# splash: King Rico inteiro no centro
for name in ('splash.png', 'splash-dark.png'):
    sp = radial((2732, 2732), PURPLE, DEEP).convert('RGBA')
    place(sp, king, 760, 1366)
    sp.convert('RGB').save(os.path.join(OUT, name))
print('ok', os.listdir(OUT))
