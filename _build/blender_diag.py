"""Diagnose why a .blend renders flat/black: visibility, camera, missing assets."""
import bpy
import sys
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

for blend in args:
    print("\n===== %s" % blend)
    try:
        bpy.ops.wm.open_mainfile(filepath=blend)
    except Exception as exc:
        print("   OPEN FAILED:", exc)
        continue
    sc = bpy.context.scene
    objs = list(sc.objects)
    by_type = {}
    for o in objs:
        by_type.setdefault(o.type, []).append(o)
    print("   objects: %s" % {k: len(v) for k, v in by_type.items()})
    print("   collections: %s" % [c.name for c in bpy.data.collections][:12])
    # the view layer drives rendering; an excluded collection renders nothing
    vl = bpy.context.view_layer
    visible = [o for o in objs if o.visible_get()]
    print("   visible_get(): %d / %d" % (len(visible), len(objs)))
    print("   layer_collection children (exclude/hide flags):")
    def walk(lc, d=0):
        if d > 3:
            return
        print("     %s%s exclude=%s hide_viewport=%s" % ("  " * d, lc.name, lc.exclude, lc.hide_viewport))
        for ch in lc.children:
            walk(ch, d + 1)
    walk(vl.layer_collection)
    # mesh extents
    lo = Vector((1e18,) * 3)
    hi = Vector((-1e18,) * 3)
    n = 0
    for o in objs:
        if o.type != "MESH" or not o.visible_get():
            continue
        n += 1
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            for i in range(3):
                lo[i] = min(lo[i], p[i])
                hi[i] = max(hi[i], p[i])
    print("   visible meshes: %d  bbox_lo=%s bbox_hi=%s" % (n, tuple(round(x, 1) for x in lo), tuple(round(x, 1) for x in hi)))
    cam = sc.camera
    if cam:
        print("   camera: %s loc=%s lens=%.1f" % (cam.name, tuple(round(x, 2) for x in cam.matrix_world.translation), cam.data.lens))
    else:
        print("   camera: NONE")
    print("   engine=%s res=%dx%d frames=%d-%d" % (sc.render.engine, sc.render.resolution_x, sc.render.resolution_y, sc.frame_start, sc.frame_end))
    # libraries / missing links
    libs = [(l.filepath, l.name) for l in bpy.data.libraries]
    print("   linked libraries: %d %s" % (len(libs), libs[:3]))
    missing = 0
    for im in bpy.data.images:
        if im.source == "FILE" and not im.has_data and im.filepath:
            missing += 1
    print("   images without data: %d / %d" % (missing, len(bpy.data.images)))
