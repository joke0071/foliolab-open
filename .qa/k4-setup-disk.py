import os,json,pathlib,subprocess,shutil,time
root=pathlib.Path(os.environ["RUNNER_TEMP"])/"k4-disk-volume"
image=pathlib.Path(os.environ["RUNNER_TEMP"])/"k4-disk-volume.img"
out=pathlib.Path("eviction-evidence");out.mkdir(exist_ok=True)
r={"status":"TECHNICAL_PREREQUISITE_MISSING","capacity_bytes":268435456,"mount":str(root),"image":str(image),"steps":[],"host_before":{}}
def call(args):
 p=subprocess.run(args,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 r["steps"].append({"args":args,"returncode":p.returncode,"stdout":p.stdout,"stderr":p.stderr})
 if p.returncode:raise RuntimeError("Failed capability: "+" ".join(args)+": "+p.stderr)
 return p.stdout
try:
 st=os.statvfs(".");r["host_before"]={"total":st.f_blocks*st.f_frsize,"available":st.f_bavail*st.f_frsize}
 assert r["host_before"]["available"]>1024**3,"Host headroom below 1GiB; no image allocation"
 root.mkdir()
 call(["sudo","-n","true"])
 call(["fallocate","-l","268435456",str(image)])
 call(["mkfs.ext4","-F","-m","0",str(image)])
 call(["sudo","-n","mount","-o","loop,nosuid,nodev",str(image),str(root)])
 call(["sudo","-n","chown",str(os.getuid())+":"+str(os.getgid()),str(root)])
 for name in ["profile","pressure"]:(root/name).mkdir()
 r["findmnt"]=json.loads(call(["findmnt","-J","-T",str(root),"--output","TARGET,SOURCE,FSTYPE,MAJ:MIN"]))
 st=os.statvfs(root);r["filesystem"]={"total":st.f_blocks*st.f_frsize,"available":st.f_bavail*st.f_frsize,"dev":os.stat(root).st_dev,"host_dev":os.stat(".").st_dev}
 assert 200*1024**2<=r["filesystem"]["total"]<=268435456
 assert r["filesystem"]["dev"]!=r["filesystem"]["host_dev"]
 r["status"]="ISOLATION_AVAILABLE"
except Exception as e:r["error"]=str(e)
finally:
 r["completed"]=time.time();(out/"isolation.json").write_text(json.dumps(r,indent=2))
 with open(os.environ["GITHUB_ENV"],"a") as f:f.write("K4_FS_ROOT="+str(root)+"\nK4_ISOLATION_AVAILABLE="+str(r["status"]=="ISOLATION_AVAILABLE").lower()+"\n")
 print(json.dumps(r,indent=2))
