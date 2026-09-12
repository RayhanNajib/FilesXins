"""Render Blender scenes to PNG for the portfolio.

Usage: blender -b -P blender_render.py -- <out_dir> <scene_blend> [<scene_blend> ...]

Opens each .blend, frames every visible object with the existing camera (or a
camera we create), and renders a wide 1600x1000 still. Scenes that are too dark
get a neutral three-point light rig so the render is legible; nothing else about
the scene is modified, so what you see is the artist's own model, materials and
lighting wherever those already work.
"""
import bpy
import os
import sys
import math
from mathutils import Vector

W, H = 1600, 1000
SAMPLES = 24


def argv():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1:]
    return []


def scene_bounds():
    """World-space bounding box over every renderable object."""
    lo = Vector((1e18, 1e18, 1e18))
    hi = Vector((-1e18, -1e18, -1e18))
    found = False
    for ob in bpy.context.scene.objects:
        if ob.type not in {"MESH", "CURVE", "SURFACE", "FONT", "META"}:
            continue
        if not ob.visible_get():
            continue
        for corner in ob.bound_box:
            p = ob.matrix_world @ Vector(corner)
            for i in range(3):
                lo[i] = min(lo[i], p[i])
                hi[i] = max(hi[i], p[i])
            found = True
    return (lo, hi) if found else (None, None)


def make_camera(lo, hi):
    """A camera at a 3/4 angle that frames the whole scene."""
    center = (lo + hi) / 2.0
    size = max((hi - lo).x, (hi - lo).y, (hi - lo).z)
    if size <= 0:
        size = 1.0
    cam_data = bpy.data.cameras.new("PortfolioCam")
    cam = bpy.data.objects.new("PortfolioCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)

    direction = Vector((1.0, -1.15, 0.72)).normalized()
    cam.location = center + direction * size * 1.75
    look = center - cam.location
    cam.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()

    # wide-ish lens, then nudge back if the box still overflows
    cam_data.lens = 50.0
    bpy.context.scene.camera = cam
    return cam


def fit_camera(cam, lo, hi):
    """Pull the camera back until every bound point projects inside the frame."""
    scene = bpy.context.scene
    aspect = W / H
    half_v = math.atan((cam.data.sensor_width / (2.0 * cam.data.lens)))  # horizontal
    half_h = half_v / aspect if aspect >= 1 else half_v
    corners = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
    inv = cam.matrix_world.inverted()
    need = 1.0
    for c in corners:
        local = inv @ c
        if local.z >= -1e-6:
            continue
        dz = -local.z
        need = max(need, abs(local.x) / (dz * math.tan(half_v)), abs(local.y) / (dz * math.tan(half_h)))
    if need > 1.0:
        # scale the whole offset from the centre
        centre = (lo + hi) / 2.0
        cam.location = centre + (cam.location - centre) * need * 1.08


def scene_is_dark():
    """True when every light is missing/weak and the world contributes nothing."""
    total = 0.0
    for ob in bpy.context.scene.objects:
        if ob.type == "LIGHT":
            total += ob.data.energy
    world = bpy.context.scene.world
    world_light = 0.0
    if world and world.use_nodes:
        for n in world.node_tree.nodes:
            if n.type == "BACKGROUND":
                world_light = max(world_light, n.inputs[0].default_value[:3][0] * n.inputs[1].default_value)
    return total < 5.0 and world_light < 0.05


def add_light_rig(lo, hi):
    """Neutral three-point rig sized to the scene, only for unlit scenes."""
    centre = (lo + hi) / 2.0
    size = max((hi - lo).x, (hi - lo).y, (hi - lo).z) or 1.0
    for name, offset, energy in (
        ("Key", Vector((1.0, -1.0, 1.2)), 4.0),
        ("Fill", Vector((-1.2, -0.6, 0.4)), 1.6),
        ("Rim", Vector((-0.4, 1.3, 0.9)), 2.6),
    ):
        light = bpy.data.lights.new(name, type="AREA")
        light.energy = energy * size * size
        light.size = size * 0.8
        ob = bpy.data.objects.new(name, light)
        ob.location = centre + offset.normalized() * size * 2.0
        look = centre - ob.location
        ob.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.collection.objects.link(ob)


def flatten_world():
    """Give an unlit world a neutral mid grey so models are not silhouettes."""
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("PortfolioWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    for n in world.node_tree.nodes:
        if n.type == "BACKGROUND":
            n.inputs[0].default_value = (0.16, 0.19, 0.24, 1.0)
            n.inputs[1].default_value = 1.0


def render_one(blend, out_png):
    bpy.ops.wm.open_mainfile(filepath=blend)
    scene = bpy.context.scene

    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    try:
        scene.eevee.taa_render_samples = SAMPLES
    except Exception:
        pass
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    lo, hi = scene_bounds()
    if lo is None:
        raise RuntimeError("no renderable geometry in %s" % blend)

    if scene_is_dark():
        flatten_world()
        add_light_rig(lo, hi)

    cam = scene.camera
    if cam is None:
        cam = make_camera(lo, hi)
    fit_camera(cam, lo, hi)

    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print("RENDERED %s -> %s" % (blend, out_png))


def main():
    args = argv()
    if len(args) < 2:
        raise SystemExit("need <out_dir> <blend> [<blend> ...]")
    # The QA (is this shot flat? too dark?) lives in _build/render_all.py, which
    # can decode PNGs with PIL. Inside Blender, slicing a bpy_prop_array by step
    # is not supported, so the checks run outside and re-invoke us in retry mode.
    mode = os.environ.get("BLENDER_RENDER_MODE", "normal")
    out_dir = args[0]
    for blend in args[1:]:
        name = os.path.splitext(os.path.basename(blend))[0]
        out = os.path.join(out_dir, name.replace(" ", "_") + ".png")
        try:
            if mode == "normal":
                render_one(blend, out)
            else:
                render_light_retry(blend, out, outside_camera=(mode == "outside"))
        except Exception as exc:
            print("FAILED %s: %s" % (blend, exc))


main()
