import io, urllib.request, zipfile
from pathlib import Path
url='https://github.com/godotengine/godot-builds/releases/download/4.6.3-stable/Godot_v4.6.3-stable_export_templates.tpz'
with urllib.request.urlopen(urllib.request.Request(url,method='HEAD'),timeout=40) as response:
    asset_url=response.url
    size=int(response.headers['Content-Length'])
class Remote(io.RawIOBase):
    pos=0
    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.pos
    def seek(self, offset, whence=0):
        self.pos=offset if whence==0 else self.pos+offset if whence==1 else size+offset
        return self.pos
    def read(self, count=-1):
        count = size-self.pos if count<0 else min(count,size-self.pos)
        if count<=0: return b''
        req=urllib.request.Request(asset_url,headers={'Range':f'bytes={self.pos}-{self.pos+count-1}','Accept-Encoding':'identity'})
        with urllib.request.urlopen(req,timeout=60) as r:
            if r.status!=206: raise RuntimeError(f'Range unavailable: {r.status}')
            data=r.read(count)
        self.pos+=len(data)
        return data
out=Path('/workspace/codex-game-studio/.cache/godot-templates')
out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(Remote()) as z:
    targets=[n for n in z.namelist() if 'web_nothreads_release.zip' in n]
    print('Web export templates:',targets,flush=True)
    for name in targets:
        data=z.read(name)
        (out/Path(name).name).write_bytes(data)
        print('Saved',Path(name).name,len(data),'bytes',flush=True)
