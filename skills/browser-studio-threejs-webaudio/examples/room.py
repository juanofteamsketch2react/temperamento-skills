# blender -b -P blender/room.py  → assets/room.glb (run from the site root)
import bpy, os, math

bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, emit=0.0, rough=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*rgb, 1)
        b.inputs["Emission Strength"].default_value = emit
    return m

def box(name, size, loc, material, bevel=0.01):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width, mod.segments = bevel, 3
    o.data.materials.append(material)
    return o

floor = mat("floor", (0.05, 0.02, 0.08), rough=0.2)
wall = mat("wall", (0.12, 0.04, 0.18))
desk = mat("desk", (0.02, 0.02, 0.03), rough=0.3)
neon = mat("neon_pink", (1.0, 0.18, 0.55), emit=6)
screen = mat("screen", (0, 0, 0), emit=1)

box("floor", (8, 8, 0.1), (0, 0, -0.05), floor, 0)
box("wall_back", (8, 0.1, 3), (0, 4, 1.5), wall, 0)
box("desk", (3, 0.9, 0.08), (0, 1.5, 0.9), desk)
box("neon_strip", (6, 0.04, 0.04), (0, 3.9, 2.6), neon, 0)

bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 3.94, 1.6), rotation=(math.pi / 2, 0, 0))
tv = bpy.context.object
tv.name, tv.scale = "screen_main", (2.4, 1.35, 1)
tv.data.materials.append(screen)

for i in range(8):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.05, location=(-0.7 + i * 0.2, 1.3, 0.97))
    k = bpy.context.object
    k.name = f"knob_{i}"
    k.data.materials.append(neon)

out = os.path.join(os.getcwd(), "assets", "room.glb")
os.makedirs(os.path.dirname(out), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
print("→", out)
