"""Extract generated sprite cells and register heads without warping or repainting."""
from pathlib import Path
from PIL import Image
import json
from collections import deque

def remove_cell_fragments(pose):
    # Only remove tiny disconnected remnants of neighboring sprite cells.
    # Keep the person and the detached bottle; do not redraw either.
    w, h = pose.size
    alpha = pose.getchannel('A')
    mask = bytearray(1 if a > 32 else 0 for a in alpha.getdata())
    for start in range(w*h):
        if not mask[start]:
            continue
        queue, points = deque([start]), []
        mask[start] = 0
        while queue:
            p = queue.popleft()
            points.append(p)
            x, y = p % w, p // w
            for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= nx < w and 0 <= ny < h and mask[ny*w+nx]:
                    mask[ny*w+nx] = 0
                    queue.append(ny*w+nx)
        if len(points) < 256:
            for p in points:
                x, y = p % w, p // w
                for nx in range(max(0,x-1), min(w,x+2)):
                    for ny in range(max(0,y-1), min(h,y+2)):
                        alpha.putpixel((nx,ny),0)
    pose.putalpha(alpha)
    return pose

root = Path(__file__).parent
for name in ['yuni', 'yoi', 'diego', 'lucia']:
    spec = json.loads((root / name / 'extraction.json').read_text())
    sheet = Image.open(root / name / 'source.png').convert('RGBA')
    rows, cols = spec['rows'], spec['columns']
    dest = root.parent.parent / 'assets' / 'opponent-drinks' / name
    dest.mkdir(parents=True, exist_ok=True)
    for i in range(9):
        r, c = divmod(i, 3)
        pose = remove_cell_fragments(sheet.crop((cols[c], rows[r], cols[c+1], rows[r+1])))
        alpha = pose.getchannel('A')
        x0, x1 = round(pose.width*.30), round(pose.width*.80)
        head = alpha.crop((x0, 0, x1, 100)).point(lambda a: 255 if a > 128 else 0)
        top = head.getbbox()[1]
        cap = head.crop((0, top, head.width, top+30)).getbbox()
        center = x0 + (cap[0]+cap[2])/2
        canvas = Image.new('RGBA', (600, 400))
        canvas.alpha_composite(pose, (round(300-center), 18-top))
        canvas.save(dest / f'pose-{i+1:02}.png')
