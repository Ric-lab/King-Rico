"""Tileable nonwoven felt fibers. Procedural PBR detail, shared by three cloth colors."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import random, math
rng=random.Random(231126);size=768
noise=Image.new('L',(size,size));noise.putdata([rng.randrange(130,236) for _ in range(size*size)])
cloud=noise.filter(ImageFilter.GaussianBlur(14))
cloth=Image.blend(noise.filter(ImageFilter.GaussianBlur(.35)),cloud,.3)
d=ImageDraw.Draw(cloth)
for _ in range(42000):
 x,y=rng.randrange(size),rng.randrange(size);angle=rng.uniform(0,math.tau);length=rng.uniform(2,11);value=rng.randrange(142,235)
 dx,dy=math.cos(angle)*length,math.sin(angle)*length
 for ox in (-size,0,size):
  for oy in (-size,0,size):
   if -12<x+ox<size+12 and -12<y+oy<size+12:d.line((x+ox,y+oy,x+ox+dx,y+oy+dy),fill=value,width=1)
cloth=cloth.filter(ImageFilter.GaussianBlur(.25))
p=Path('assets/materials/felt-fibers-v2.webp');cloth.point(lambda v:min(255,round(155+v*.4))).save(p,quality=94,method=6);print(p)
