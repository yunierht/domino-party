"""Technical sprite-cell extraction and head registration; no painting or compositing edits."""
from pathlib import Path
from PIL import Image, ImageDraw
from collections import deque
import json, shutil, sys

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent
GENERATED = Path.home() / '.codex/generated_images/01a0f366-401d-7c82-8992-ffbaf4cfffd9'
sources = json.loads((ROOT / 'sources.json').read_text())
jobs = json.loads((ROOT / 'prompts.json').read_text())
only = next((arg.split('=',1)[1] for arg in sys.argv if arg.startswith('--only=')), None)

def remove_fragments(pose):
    # Drop only tiny disconnected remnants from neighboring sprite cells.
    w, h = pose.size
    alpha = pose.getchannel('A')
    mask = bytearray(a > 32 for a in alpha.getdata())
    for start in range(w*h):
        if not mask[start]: continue
        queue, points = deque([start]), []
        mask[start] = 0
        while queue:
            p = queue.popleft(); points.append(p)
            x, y = p % w, p // w
            for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= nx < w and 0 <= ny < h and mask[ny*w+nx]:
                    mask[ny*w+nx] = 0; queue.append(ny*w+nx)
        if len(points) < 1200:
            for p in points:
                x, y = p % w, p // w
                for nx in range(max(0,x-1), min(w,x+2)):
                    for ny in range(max(0,y-1), min(h,y+2)): alpha.putpixel((nx,ny),0)
    pose.putalpha(alpha)
    return pose

report = []
for job in jobs:
    key = job['key']
    if key not in sources: continue
    folder = ROOT / key; folder.mkdir(exist_ok=True)
    source = folder / 'source.png'
    if not source.exists(): shutil.copy2(GENERATED / sources[key], source)
    sheet = Image.open(source).convert('RGBA')
    spec_file = folder / 'extraction.json'
    if spec_file.exists(): spec = json.loads(spec_file.read_text())
    else:
        # Locate row gutters near the nominal thirds; avoid cutting heads at a shifted grid.
        alpha = sheet.getchannel('A')
        ink = [sum(a > 64 for a in alpha.crop((0,y,sheet.width,y+1)).getdata()) for y in range(sheet.height)]
        boundaries = [min(range(round(sheet.height*r/3)-28,round(sheet.height*r/3)+29), key=lambda y: ink[y]) for r in (1,2)]
        ink_columns = [sum(a > 64 for a in alpha.crop((x,0,x+1,sheet.height)).getdata()) for x in range(sheet.width)]
        columns = [min(range(round(sheet.width*c/3)-24,round(sheet.width*c/3)+25), key=lambda x: ink_columns[x]) for c in (1,2)]
        spec = {'rows':[0,*boundaries,sheet.height], 'columns':[0,*columns,sheet.width]}
        spec_file.write_text(json.dumps(spec,indent=2))
    dest = PROJECT / 'assets/opponent-drinks-v2' / job['actor'] / job['slug']; dest.mkdir(parents=True,exist_ok=True)
    report.append({'key':key,'frames':9,'rows':spec['rows'],'source':sources[key]})
    if only and key != only: continue
    if '--force' not in sys.argv and (folder / 'preview.gif').exists() and len(list(dest.glob('pose-*.png'))) == 9:
        continue
    frames = []
    for i in range(9):
        r,c = divmod(i,3); cols,rows=spec.get('columnsByRow',[spec['columns']]*3)[r],spec['rows']
        pose = remove_fragments(sheet.crop((cols[c],rows[r],cols[c+1],rows[r+1])))
        alpha = pose.getchannel('A')
        x0,x1 = round(pose.width*.30),round(pose.width*.80)
        head = alpha.crop((x0,0,x1,100)).point(lambda a:255 if a>128 else 0)
        top = head.getbbox()[1]
        cap = head.crop((0,top,head.width,min(top+30,head.height))).getbbox()
        center = x0+(cap[0]+cap[2])/2
        canvas = Image.new('RGBA',(700,400))
        canvas.alpha_composite(pose,(round(350-center),18-top))
        canvas.save(dest / f'pose-{i+1:02}.png',optimize=True)
        frames.append(canvas)
    contact = Image.new('RGB',(1050,630),'#153a2f')
    draw = ImageDraw.Draw(contact)
    for i,frame in enumerate(frames):
        frame=frame.resize((350,200),Image.Resampling.LANCZOS)
        contact.paste(frame,((i%3)*350,(i//3)*210),frame)
        draw.text(((i%3)*350+5,(i//3)*210+195),str(i+1),fill='white')
    contact.save(folder / 'contact.jpg',quality=90)
    sequence=[0,1,2,3,4,5,5,6,7,8,8,8]
    durations=[400,220,250,240,240,500,350,220,220,220,200,600]
    gif=[]
    for index in sequence:
        bg=Image.new('RGBA',(700,400),'#153a2f');bg.alpha_composite(frames[index]);gif.append(bg.convert('RGB'))
    gif[0].save(folder / 'preview.gif',save_all=True,append_images=gif[1:],duration=durations,loop=0)
(ROOT / 'extraction-report.json').write_text(json.dumps(report,indent=2))
print(f'Extracted {len(report)}/30 combinations')
