from PIL import Image
from pathlib import Path
import json
base=Path('output/andy-drink-preview')
sheet=Image.open(base/'andy-drink-sheet-v2.png').convert('RGBA')
# Extract the generated rows at their actual separators, not the requested grid.
rows=[60,415,755,1086]
frames=[]
for row in range(3):
 for col in range(4):
  frame=sheet.crop((col*362,rows[row],(col+1)*362,rows[row+1]))
  alpha=frame.getchannel('A')
  bbox=alpha.point(lambda a:255 if a>64 else 0).getbbox()
  top=bbox[1]
  hair=alpha.crop((0,top,362,min(frame.height,top+38))).point(lambda a:255 if a>128 else 0).getbbox()
  head_x=(hair[0]+hair[2])/2
  registered=Image.new('RGBA',(440,390),(0,0,0,0))
  registered.alpha_composite(frame,(round(220-head_x),20-top))
  registered.save(base/f'frame-{len(frames)+1:02}.png')
  matte=Image.new('RGBA',registered.size,'#0B2923');matte.alpha_composite(registered)
  frames.append(matte.convert('RGB'))
durations=[650,180,180,180,180,220,420,500,240,250,220,1000]
frames[0].save(base/'andy-drinking-proof.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0)
(base/'timing.json').write_text(json.dumps({'frameDurationsMs':durations,'size':[440,390],'status':'preview-only; not integrated'},indent=2))
print('12 RGBA frames preserved; GIF preview on dark green matte created.')
