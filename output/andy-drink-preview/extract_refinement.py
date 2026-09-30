from PIL import Image
from pathlib import Path
im=Image.open('output/andy-drink-preview/andy-refinement-source.png').convert('RGBA')
print(im.size)
w,h=im.size
rows=[0,round(h*.30),round(h*.585),round(h*.89)]
# Reject the malformed lower-left pose and unused lower-middle pose.
indices=[(0,0),(0,1),(0,2),(1,0),(1,1),(1,2),(2,2)]
for index,(r,c) in enumerate(indices):
 box=(round(c*w/3),rows[r],round((c+1)*w/3),rows[r+1]);frame=im.crop(box);fw,fh=frame.size
 a=frame.getchannel('A');region=a.crop((round(fw*.25),0,round(fw*.80),min(140,fh)))
 bbox=region.point(lambda a:255 if a>128 else 0).getbbox();top=bbox[1]
 hair=a.crop((round(fw*.25),top,round(fw*.80),top+36)).point(lambda a:255 if a>128 else 0).getbbox()
 head=round(fw*.25)+(hair[0]+hair[2])/2
 canvas=Image.new('RGBA',(560,360));canvas.alpha_composite(frame,(round(280-head),18-top));canvas.save(f'assets/andy-drink-v2/pose-{index+1:02}.png')
