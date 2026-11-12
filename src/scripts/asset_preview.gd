extends Node2D

const ASSETS = preload("res://assets/cinema/atlas.json")
var manifest: Dictionary
var textures: Dictionary = {}
var font: SystemFont

func _ready():
	manifest = JSON.parse_string(FileAccess.get_file_as_string("res://assets/cinema/atlas.json"))
	for item in manifest.assets:
		textures[item.id] = load("res://assets/cinema/props/" + item.id + ".tres")
	font = SystemFont.new()
	font.font_names = PackedStringArray(["Noto Sans CJK HK", "Noto Sans CJK TC", "sans-serif"])
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	queue_redraw()

func pos(x: float, y: float) -> Vector2:
	return Vector2(710 + (x-y)*32, 170 + (x+y)*16)

func tile(x, y, col):
	var p = pos(x,y)
	draw_colored_polygon(PackedVector2Array([p,p+Vector2(32,16),p+Vector2(0,32),p+Vector2(-32,16)]), col)
	draw_polyline(PackedVector2Array([p,p+Vector2(32,16),p+Vector2(0,32),p+Vector2(-32,16),p]), Color("b5a69a"), 0.5)

func prop(id, x, y, factor=1.0):
	for item in manifest.assets:
		if item.id == id:
			var tex: Texture2D = textures[id]
			var w = item.world_width * factor
			var h = tex.get_height() * w / tex.get_width()
			var anchor = pos(x,y)
			draw_texture_rect(tex, Rect2(anchor-Vector2(w/2,h),Vector2(w,h)),false)

func _draw():
	if manifest.is_empty(): return
	draw_rect(Rect2(0,0,1440,900),Color("f4efe6"))
	draw_string(font,Vector2(48,60),"光影大亨 · 第一批設施貼圖",HORIZONTAL_ALIGNMENT_LEFT,-1,28,Color("66223a"))
	draw_string(font,Vector2(48,91),"同一批 PNG 與 AtlasTexture 資源直接放置測試 · 64 × 32 等角格",HORIZONTAL_ALIGNMENT_LEFT,-1,17,Color("756d69"))
	for y in range(12):
		for x in range(17):
			tile(x,y,Color("3b3040") if y<5 else Color("d5c7b3"))
	for y in range(1,5):
		for x in [2,3,4,5,9,10,11,12]: prop("seat",x,y)
	prop("plant",1,6)
	prop("concession_counter",5,6)
	prop("ticket_counter",11,6)
	prop("ticket_kiosk",13,7)
	prop("ticket_kiosk",14,7)
	prop("recycling_bins",1,9)
	prop("soda_dispenser",4,9)
	prop("popcorn_machine",5,9)
	prop("cleaning_cart",9,9)
	prop("plant",15,10)
	draw_string(font,Vector2(48,795),"資源：座椅／自助售票機／售票櫃枱／小食櫃枱／爆谷機／汽水機／垃圾桶／清潔車／盆栽",HORIZONTAL_ALIGNMENT_LEFT,-1,18,Color("66223a"))
	draw_string(font,Vector2(48,826),"靜態貼圖測試場景；尚未加入人物動畫與經營玩法。",HORIZONTAL_ALIGNMENT_LEFT,-1,16,Color("756d69"))
