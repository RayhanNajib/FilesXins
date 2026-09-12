"""Render .blend scenes with a solved camera: pick the view direction that shows
the most of the object, then push the camera back only as far as the frame needs.

The naive "point at the bounding box" approach leaves thin or wide objects
stranded in a corner of a near-empty frame, so instead we search candidate
directions and solve the minimum distance that still fits every vertex:

    for a direction d and centre c, a vertex p projects with depth
        depth = dist - (p - c)·d
    and required distance grows with |x|/half_fov_x, |y|/half_fov_y.
    dist = max over p of  (p-c)·d + max(|x|/hx, |y|/hy)
    coverage = area the projection fills, so the best d maximises it.

Usage: blender -b -P render_auto.py -- <out_dir> <blend> [<blend> ...]
"""
import itertools
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

MARGIN = 0.88          # keep 12% of the frame as breathing room
MIN_COVERAGE = 0.04    # below this the object is a speck: try harder


def visible_objects(scene):
    out = []
    for ob in scene.objects:
        if ob.type == "MESH" and not ob.hide_render and ob.visible_get():
            try:
                if len(ob.data.vertices):
                    out.append(ob)
            except Exception:
                pass
    return out


def sample_points(objs, target=900):
    """World-space points spread over the meshes (bbox corners as a floor)."""
    pts = []
    for ob in objs:
        mw = ob.matrix_world
        verts = ob.data.vertices
        step = max(1, len(verts) // max(1, target // max(1, len(objs))))
        for i in range(0, len(verts), step):
            pts.append(mw @ verts[i].co)
        for corner in ob.bound_box:               # guarantee the true extents
            pts.append(mw @ Vector(corner))
    return pts


def frame_half_angles(scene, cam):
    """Half-tangents of the frame in x and y, honouring sensor_fit."""
    cd = cam.data
    sensor, lens = cd.sensor_width or 36.0, cd.lens or 50.0
    rx, ry = scene.render.resolution_x, scene.render.resolution_y
    fit = cd.sensor_fit
    if fit == "VERTICAL" or (fit == "AUTO" and ry > rx):
        hy = (sensor / 2.0) / lens
        hx = hy * (rx / ry)
    else:
        hx = (sensor / 2.0) / lens
        hy = hx * (ry / rx)
    return hx, hy


def candidate_dirs():
    dirs = [Vector(d).normalized() for d in itertools.product((-1, 0, 1), repeat=3)
            if any(d)]
    # a few asymmetric 3/4 views read better than axis-aligned ones
    for d in ((1, 0.55, 0.4), (-0.9, -0.6, 0.45), (0.7, -1, 0.5), (-0.6, 0.9, 0.35)):
        dirs.append(Vector(d).normalized())
    return dirs


def solve_view(scene, objs):
    pts = sample_points(objs)
    if not pts:
        return None
    centre = sum(pts, Vector((0, 0, 0))) / len(pts)
    cam = scene.camera
    hx, hy = frame_half_angles(scene, cam)

    best = None
    for d in candidate_dirs():
        up = Vector((0, 0, 1))
        if abs(d.dot(up)) > 0.97:
            up = Vector((0, 1, 0))
        z_axis = d                                   # camera's local +Z: backwards
        x_axis = up.cross(z_axis).normalized()
        if x_axis.length < 1e-6:
            continue
        y_axis = z_axis.cross(x_axis).normalized()

        dist = 0.0
        for p in pts:
            rel = p - centre
            a = rel.dot(d)
            xc, yc = rel.dot(x_axis), rel.dot(y_axis)
            need = max(a + 0.05,
                       a + abs(xc) / (MARGIN * hx),
                       a + abs(yc) / (MARGIN * hy))
            dist = max(dist, need)
        if dist <= 0 or not math.isfinite(dist):
            continue

        # how much of the frame the projection fills (NDC area, 1.0 = full)
        umin = vmin = 1e9
        umax = vmax = -1e9
        ok = True
        for p in pts:
            rel = p - centre
            depth = dist - rel.dot(d)
            if depth <= 1e-6:
                ok = False
                break
            u = rel.dot(x_axis) / (hx * depth)
            v = rel.dot(y_axis) / (hy * depth)
            umin, umax = min(umin, u), max(umax, u)
            vmin, vmax = min(vmin, v), max(vmax, v)
        if not ok:
            continue
        coverage = ((umax - umin) / 2.0) * ((vmax - vmin) / 2.0)
        # looking slightly down usually beats looking up at a model
        score = coverage * (1.0 + 0.18 * max(0.0, d.z))
        if best is None or score > best[0]:
            best = (score, coverage, d, dist, centre, x_axis, y_axis, z_axis)

    if best is None:
        return None

    score, coverage, d, dist, centre, x_axis, y_axis, z_axis = best
    rot = Matrix((x_axis, y_axis, z_axis)).transposed().to_4x4()
    cam.matrix_world = Matrix.Translation(centre + d * dist) @ rot
    cam.data.clip_start = max(0.01, dist * 0.005)
    cam.data.clip_end = max(cam.data.clip_end, dist * 12.0)
    return coverage


def studio(scene):
    """Neutral three-point-ish lighting on a flat grey world (matches the
    tiles already on the site, so the gallery stays visually consistent)."""
    world = scene.world or bpy.data.worlds.new("W")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.055, 0.055, 0.06, 1.0)
        bg.inputs[1].default_value = 1.0
    if not any(ob.type == "LIGHT" for ob in scene.objects):
        for loc, energy in (((4, -5, 6), 900), ((-6, -3, 4), 350), ((0, 6, 2), 250)):
            lamp = bpy.data.lights.new("key", "AREA")
            lamp.energy = energy
            lamp.size = 6
            ob = bpy.data.objects.new("key", lamp)
            ob.location = loc
            scene.collection.objects.link(ob)


def render_one(blend, out_png, res=(1600, 1000)):
    bpy.ops.wm.open_mainfile(filepath=blend)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    # transparent film: the backdrop is composited in the palette colour later,
    # so every tile sits on the same surface as the rest of the site
    scene.render.film_transparent = True
    try:
        scene.display.shading.light = "STUDIO"
        scene.display.shading.color_type = "MATERIAL"
        scene.display.shading.show_shadows = True
        scene.display.shading.show_cavity = True
        scene.display.shading.studio_light = "Default"
    except Exception:
        pass

    objs = visible_objects(scene)
    if not objs:
        print(f"EMPTY {blend}")
        return None
    if scene.camera is None:
        cd = bpy.data.cameras.new("cam")
        cd.lens = 50.0
        scene.camera = bpy.data.objects.new("cam", cd)
        scene.collection.objects.link(scene.camera)
    studio(scene)

    coverage = solve_view(scene, objs)
    scene.render.filepath = out_png
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED {blend} -> {out_png}  coverage={coverage:.3f}"
          if coverage is not None else f"RENDERED {blend} -> {out_png}  coverage=?")
    return coverage


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    out_dir, blends = args[0], args[1:]
    os.makedirs(out_dir, exist_ok=True)
    for blend in blends:
        name = os.path.splitext(os.path.basename(blend))[0]
        png = os.path.join(out_dir, name.replace(" ", "_") + ".png")
        try:
            render_one(blend, png)
        except Exception as exc:                        # noqa: BLE001
            print(f"FAILED {blend}: {exc}")


if __name__ == "__main__":
    main()
