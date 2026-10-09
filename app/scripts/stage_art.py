#!/usr/bin/env python3
"""Artes do cenário com a cor "A" (roxo-magenta festivo) + posições das lâmpadas.

Sem IA e sem créditos: parte das artes aprovadas e mexe só no necessário, então tudo continua alinhado
pixel a pixel com a máquina (rolos, botões, saldo). A arte fica com as lâmpadas acesas; em repouso o jogo põe um
"abafador" (disco escuro suave) sobre cada lâmpada e, no giro, tira o abafador em onda e acende um brilho extra.
Apagar a luz pintada na própria arte (preenchendo o halo) borrava o tecido: por isso a arte não é mexida.

Entradas (originais, não são alteradas):
  assets/stage-hd-c.png  ·  assets/fx/top-layer3.png  ·  assets/bleed/stage-bleed-src.png (Meshy)
Saídas:
  assets/stage-hd-c.webp, assets/fx/top-layer3.webp     (cor A)
  assets/bleed/stage-bleed.webp                          (palco, cor A; jogo e Home)
  assets/fx/machine-front3.webp                          (placa do topo sem as 2 estrelas)
  app/scripts/bulbs.json                                 (lâmpadas em unidades do quadro 453×802)
Uso: python3 app/scripts/stage_art.py [--preview pasta]
"""
import json, math, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
P = lambda *a: os.path.join(ROOT, *a)

# ---------- cor A: roxos do cenário (268–335°) puxados para violeta-magenta e clareados nos tons escuros ----------
HUE_TO, LIFT, SAT_MUL = 305.0, 0.30, 1.05


def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.zeros(h.shape + (3,), np.float32)
    for k, (r, g, b) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        sel = i == k
        out[sel] = np.stack([r[sel], g[sel], b[sel]], -1)
    return out


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.where(m, d, 1), 0)
    gc = np.where(m, (mx - g) / np.where(m, d, 1), 0)
    bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2.0 + rc - bc, 4.0 + gc - rc))
    h = np.where(m, (h / 6.0) % 1.0, 0)
    s = np.where(mx > 1e-6, d / np.where(mx > 1e-6, mx, 1), 0)
    return h, s, mx


def grade_a(rgb, protect=None):
    h, s, v = rgb_to_hsv(rgb)
    hd = h * 360
    w = ((hd >= 268) & (hd <= 335) & (s > 0.35)).astype(np.float32) * np.clip((0.75 - v) / 0.35, 0, 1)
    # máscara suavizada (sem manchas nas bordas), mas a troca de tom só vale para pixels que já são roxos:
    # sem isso o dourado/laranja vizinho gira o matiz e vira verde
    w = np.asarray(Image.fromarray((w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))).astype(np.float32) / 255
    # só roxos puros (cortina ≈ 270–300°); mistura de brilho laranja com roxo (≥ 315°) fica de fora e não vira rosa
    w *= np.clip((hd - 255) / 10, 0, 1) * np.clip((322 - hd) / 12, 0, 1) * (s > 0.2)
    if protect is not None:  # halo de luz das lâmpadas fica com a cor original (senão vira mancha lilás)
        w *= 1 - protect
    h2 = (hd + (HUE_TO - hd) * 0.55 * w) / 360 % 1
    v2 = v + LIFT * (1 - v) * w * 0.9
    s2 = np.clip(s * (1 + (SAT_MUL - 1) * w), 0, 1)
    return hsv_to_rgb(h2, s2, v2)


# ---------- lâmpadas ----------
def find_bulbs(rgba, big_k, min_area, max_area, region=None):
    """Núcleos quase brancos (claros e pouco saturados), pequenos. Áreas grandes (casas dos rolos, placas) saem."""
    rgb, a = rgba[..., :3], rgba[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    core = (mx > 0.88) & (sat < 0.42) & (a > 0.5)
    if region is not None:
        core &= region
    m = Image.fromarray((core * 255).astype(np.uint8))
    large = m.filter(ImageFilter.MinFilter(big_k)).filter(ImageFilter.MaxFilter(big_k)).filter(ImageFilter.MaxFilter(9))
    small = core & ~(np.asarray(large) > 0)
    H, W = small.shape
    seen = np.zeros_like(small)
    bulbs = []
    for y0, x0 in zip(*np.nonzero(small)):
        if seen[y0, x0]:
            continue
        q, pts = deque([(y0, x0)]), []
        seen[y0, x0] = True
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and small[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    q.append((yy, xx))
        if min_area <= len(pts) <= max_area:
            ys, xs = np.array(pts).T
            bulbs.append((xs.mean(), ys.mean(), math.sqrt(len(pts) / math.pi)))
    return bulbs


def halo_mask(shape, bulbs, k):
    """Disco suave em volta de cada lâmpada (k × raio), 0–1."""
    H, W = shape[:2]
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    for x, y, r in bulbs:
        R = max(2.0, r * k)
        d.ellipse((x - R, y - R, x + R, y + R), fill=255)
    rmax = max([r for _, _, r in bulbs] or [2])
    return np.asarray(m.filter(ImageFilter.GaussianBlur(rmax * 1.2))).astype(np.float32) / 255


def gold_blobs(rgba, k, region, minpx=150):
    """Manchas douradas saturadas (estrelas, aros) dentro de region (unidades): [(cx, cy, w, h)] em unidades."""
    rgb, a = rgba[..., :3], rgba[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-4)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    gold = (mx > 0.72) & (sat > 0.45) & (r >= g) & (g > b * 1.25) & (r - g < 0.45) & (a > 0.5)
    H, W = gold.shape
    yy, xx = np.mgrid[0:H, 0:W]
    x0, y0, x1, y1 = [v * k for v in region]
    gold &= (xx >= x0) & (xx <= x1) & (yy >= y0) & (yy <= y1)
    seen = np.zeros_like(gold)
    out = []
    for sy, sx in zip(*np.nonzero(gold)):
        if seen[sy, sx]:
            continue
        q, pts = deque([(sy, sx)]), []
        seen[sy, sx] = True
        while q:
            y, x = q.popleft()
            pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                Y, X = y + dy, x + dx
                if 0 <= Y < H and 0 <= X < W and gold[Y, X] and not seen[Y, X]:
                    seen[Y, X] = True
                    q.append((Y, X))
        if len(pts) > minpx:
            ys, xs = np.array(pts).T
            out.append((xs.mean() / k, ys.mean() / k, (xs.max() - xs.min()) / k, (ys.max() - ys.min()) / k))
    return out


def fill_disks(rgba, centers, k, r_in, r_out):
    """Apaga o que há dentro de cada disco (raio r_in, unidades) preenchendo com a média do anel até r_out
    ponderada pela distância: serve para superfícies lisas (placa vermelha), não para tecido."""
    out = rgba.copy()
    H, W = rgba.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    for cx, cy in centers:
        X, Y = cx * k, cy * k
        d = np.hypot(xx - X, yy - Y)
        inner, ring = d <= r_in * k, (d > r_in * k) & (d <= r_out * k)
        rr = rgba[..., :3][ring]
        # só o vermelho do lóbulo entra na média (o aro dourado não)
        keep = (rr[:, 0] > rr[:, 1] * 1.6) & (rr.max(-1) < 0.8)
        rr = rr[keep] if keep.sum() > 20 else rr
        col = np.median(rr, 0)
        soft = np.clip((r_in * k + 2.5 - d) / 5, 0, 1)[..., None]  # borda suave
        out[..., :3] = out[..., :3] * (1 - soft) + col * soft
    return out


def load(path):
    return np.asarray(Image.open(P(path)).convert('RGBA')).astype(np.float32) / 255


def save(rgb, alpha, path, q=86):
    arr = np.clip(rgb, 0, 1)
    if alpha is not None:
        img = Image.fromarray((np.dstack([arr, alpha]) * 255).astype(np.uint8), 'RGBA')
    else:
        img = Image.fromarray((arr * 255).astype(np.uint8), 'RGB')
    img.save(P(path), 'WEBP', quality=q, method=6)
    return img


def main():
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    out = {}

    # 1) máquina (3 px por unidade): só as lâmpadas dos pilares
    a = load('assets/stage-hd-c.png'); H, W = a.shape[:2]; k = W / 453
    yy, xx = np.mgrid[0:H, 0:W]
    region = (((xx < 45 * k) | (xx > 408 * k)) & (yy > 190 * k) & (yy < 665 * k))
    b = find_bulbs(a, 41, 600, 1600, region)  # lâmpadas dos pilares têm raio ≈ 6 unidades; brilho de estrelas/ornamentos fica abaixo de 4,5
    save(grade_a(a[..., :3]), None, 'assets/stage-hd-c.webp')
    out['stage'] = [[round(x / k, 1), round(y / k, 1), round(r / k, 2)] for x, y, r in b]
    # estrelas douradas dos pilares (≈ 18×22 unidades): também acendem e apagam
    st = [blob for side in ((0, 300, 45, 520), (408, 300, 453, 520)) for blob in gold_blobs(a, k, side) if 14 < blob[2] < 26 and 18 < blob[3] < 28]
    out['star'] = [[round(x, 1), round(y, 1), round(max(w, h) / 2, 1)] for x, y, w, h in st]

    # placa do topo (mostra o valor ganho): as 2 estrelas saem
    a = load('assets/fx/machine-front3.png'); k = a.shape[1] / 453
    cs = [(x, y) for x, y, w, h in gold_blobs(a, k, (140, 35, 320, 70), 80) if 9 < w < 15 and 9 < h < 15]
    assert len(cs) == 2, cs
    f = fill_disks(a, cs, k, 8.5, 11.5)
    save(f[..., :3], f[..., 3], 'assets/fx/machine-front3.webp')

    # 2) cortina do topo (3 px por unidade, 453×235): varal de luzes
    a = load('assets/fx/top-layer3.png'); H, W = a.shape[:2]; k = W / 453
    b = find_bulbs(a, 21, 6, 900)
    save(grade_a(a[..., :3], halo_mask(a.shape, b, 6.5)), a[..., 3], 'assets/fx/top-layer3.webp')
    out['top'] = [[round(x / k, 1), round(y / k, 1), round(r / k, 2)] for x, y, r in b]

    # 3) palco com sangria (755×1132 unidades; quadro em 151,130): varais + luzes do piso.
    #    Lâmpadas atrás da máquina (escondidas pelo quadro) não entram.
    a = load('assets/bleed/stage-bleed-src.png'); H, W = a.shape[:2]; k = W / 755
    b = find_bulbs(a, 17, 4, 900)
    # o brilho pintado em volta de cada lâmpada vai até ~6× o raio: fica com a cor original
    save(grade_a(a[..., :3], halo_mask(a.shape, b, 7.0)), None, 'assets/bleed/stage-bleed.webp')
    fb = []
    for x, y, r in b:
        ux, uy = x / k - 151, y / k - 130
        behind = (5 <= ux <= 448 and 0 <= uy <= 668) or (47 <= ux <= 406 and 681 <= uy <= 765)
        if not behind:
            fb.append([round(ux, 1), round(uy, 1), round(r / k, 2)])
    out['bleed'] = fb

    json.dump(out, open(os.path.join(os.path.dirname(__file__), 'bulbs.json'), 'w'), separators=(',', ':'))
    print({k: len(v) for k, v in out.items()})

    if preview:
        os.makedirs(preview, exist_ok=True)
        for name, src, key, kk, off in [('stage', 'assets/stage-hd-c.png', 'stage', 3, (0, 0)),
                                        ('top', 'assets/fx/top-layer3.png', 'top', 3, (0, 0)),
                                        ('bleed', 'assets/bleed/stage-bleed-src.png', 'bleed', 1024 / 755, (151, 130))]:
            im = Image.open(P(src)).convert('RGB')
            d = ImageDraw.Draw(im)
            for x, y, r in out[key]:
                X, Y, R = (x + off[0]) * kk, (y + off[1]) * kk, max(3, r * kk * 2.2)
                d.ellipse((X - R, Y - R, X + R, Y + R), outline=(0, 255, 255), width=3)
            im.thumbnail((900, 900))
            im.save(os.path.join(preview, f'bulbs-{name}.png'))


if __name__ == '__main__':
    main()
