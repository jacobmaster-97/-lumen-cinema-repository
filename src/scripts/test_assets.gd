extends SceneTree

func _initialize():
	var data = JSON.parse_string(FileAccess.get_file_as_string("res://assets/cinema/atlas.json"))
	assert(data.assets.size() == 9, "Expected all 9 props including staffed ticket counter")
	var ids = []
	for asset in data.assets:
		assert(not ids.has(asset.id))
		ids.append(asset.id)
		var texture = load("res://assets/cinema/props/" + asset.id + ".tres") as AtlasTexture
		assert(texture != null, "AtlasTexture must load")
		assert(texture.region.size.x > 0 and texture.region.size.y > 0)
		assert(texture.region.end.x <= texture.atlas.get_width())
		assert(texture.region.end.y <= texture.atlas.get_height())
		assert(texture.filter_clip, "Prevent texture bleeding from neighboring atlas regions")
		var source = texture.atlas.get_image()
		assert(source.has_mipmaps() == false)
		assert(source.detect_alpha() != Image.ALPHA_NONE, "Sprite source needs transparency")
		assert(asset.anchor == [asset.region[2] / 2.0, asset.region[3]])
		assert(asset.world_width > 0)
	assert(ids.has("ticket_counter") and ids.has("ticket_kiosk"), "Staffed and self-service sales are separate assets")
	print("PASS: 9 textures import, atlas bounds, alpha, filter clipping, anchors and separate ticket counter/kiosk")
	quit(0)
