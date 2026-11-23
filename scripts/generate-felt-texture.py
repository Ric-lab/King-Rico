"""Seamless felt grain, shared by all three colored tables. No external assets."""
from PIL import Image,ImageDraw
from pathlib import Path
import random,math
size=512;rng=random.Random(72519)
im=Image.new('L',(size,size));pixels=im.load()
for y in range(size):
 for x in range(size):
  weave=2*math.sin(x*math.tau/8+y*math.tau/32)+2*math.sin(y*math.tau/16)
  pixels[x,y]=max(208,min(255,round(239+weave+rng.gauss(0,5))))
d=ImageDraw.Draw(im)
for i in range(7500):
 x,y=rng.randrange(size),rng.randrange(size);a=rng.uniform(0,math.tau);length=rng.uniform(2,7);c=rng.randrange(215,256)
 for ox in (-size,0,size):
  for oy in (-size,0,size):d.line((x+ox,y+oy,x+ox+math.cos(a)*length,y+oy+math.sin(a)*length),fill=c,width=1)
# Match edge pixels so repeated tiles never introduce straight seams.
for i in range(size):im.putpixel((size-1,i),im.getpixel((0,i)));im.putpixel((i,size-1),im.getpixel((i,0)))
path=Path('assets/materials/felt-grain-v1.webp');path.parent.mkdir(exist_ok=True);im.save(path,quality=88,method=6)
print(path)
