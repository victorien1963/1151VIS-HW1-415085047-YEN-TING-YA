"""Downscale approved alpha assets, retaining alpha; CSS handles the display crop.

Requires Pillow and NumPy. Does not remove backgrounds or generate imagery.
Official originals and approved ImageGen outputs remain untouched.
"""
import argparse,json
from pathlib import Path
from PIL import Image
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('--assets',type=Path,default=Path(__file__).resolve().parents[1]/'prototype/assets/perfumes');args=parser.parse_args()
assets=args.assets
manifest=json.loads((assets/'manifest.json').read_text())
for r in manifest:
 pid=r['perfume_id'];cutout=assets/'cutouts'/f'{pid}.png'
 source=cutout if cutout.exists() else assets/r['original_file']
 im=Image.open(source).convert('RGBA');alpha=np.asarray(im.getchannel('A'))
 assert alpha.min()==0, f'{pid}: expected an approved transparent image'
 opaque=alpha>128
 # Ignore isolated alpha flecks when measuring visible bottle bounds, without editing pixels.
 ys=np.flatnonzero(opaque.sum(axis=1)>max(3,im.width*.005));xs=np.flatnonzero(opaque.sum(axis=0)>max(3,im.height*.005))
 x0,y0,x1,y1=int(xs[0]),int(ys[0]),int(xs[-1]+1),int(ys[-1]+1)
 # Jo Malone's original transparent files have a long soft cast shadow; these
 # hand-checked display bounds retain the bottle and match the approved trial.
 if pid.startswith('jo-malone-'):x0,y0,x1,y1=338,145,661,897
 scale=min(1,300/(y1-y0));new_size=(round(im.width*scale),round(im.height*scale))
 thumb=im.resize(new_size,Image.Resampling.LANCZOS)
 dest=assets/'display'/f'{pid}.webp';dest.parent.mkdir(exist_ok=True)
 thumb.save(dest,'WEBP',quality=86,method=6)
 r.update(file=str(dest.relative_to(assets)),width=thumb.width,height=thumb.height,
          display_bounds={'x':round(x0*scale,3),'y':round(y0*scale,3),'width':round((x1-x0)*scale,3),'height':round((y1-y0)*scale,3)},
          display_input=str(source.relative_to(assets)),ai_background_edit=cutout.exists())
 if cutout.exists():
  r['processing']='官方照片經 ImageGen AI 去背後，縮小為透明 WebP；已核對款式、品名與瓶蓋。AI 可能改動細小字樣或反光，商品外觀細節請以所附官方原圖為準。CSS 收去透明留白並統一瓶身顯示高度。'
 else:
  r['processing']='沿用官方圖片的透明背景，保留原圖另存；僅等比例縮小為透明 WebP，以 CSS 收去外側留白與投影，統一瓶身顯示高度，未經 AI 重繪。'
(assets/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Prepared',len(manifest),'images;',sum((assets/r['file']).stat().st_size for r in manifest),'bytes')
