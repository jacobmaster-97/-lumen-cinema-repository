# Lumen Cinema v0.3 asset sources

All visible game-art sources in this folder were generated specifically for Lumen Cinema with ImageGen. Original PNG bytes are preserved; normal runtime cropping, nearest-neighbor sampling and in-memory actor chroma extraction are explicit in manifest.json, assets.mjs and render.mjs. No third-party example game art from the installed skill is used.

## Map / furniture source

The furniture, floor and auditorium material PNGs are the real modular sources produced during the approved cinema map design work. The runtime uses room rectangles, wall/door segments, eight elevated tiers, independent prop footprints and navigation metadata from manifest.json, rather than shipping the draft preview as a flat playable background.

- props-v3.png: 1254×1254 RGBA, 4×4 cells; burgundy seats and benches, kiosk, staffed ticket desk, concession counter, popcorn, soda, bins, plant, cleaner cart, cubicle, basin, lockers, shelf, poster display and sconce. The no-lounge runtime does not place the bench.
- floors-v3.png: 1254×1254, 2×2 flat orthographic material quadrants: ivory tile, burgundy carpet, petrol carpet, sage utility tile.
- walls-v3.png: 1254×1254, 2×2 flat orthographic material quadrants: navy acoustic weave, charcoal foundation, burgundy curtain and nonslip tread with amber edge.

Map prompt essentials: modern Hong Kong mall cinema; authentic 32-bit-era pixel clusters; consistent 2:1 isometric placement; wine, cream, navy, teal and brass palette; grounded isolated props; quiet flat top-down material atlases; no baked people, room scene or UI. Furniture bottom planes were subsequently measured and calibrated through explicit source-space landmarks, without editing the source PNG.

## Actor raw generation prompt

Create a PRODUCTION 4x4 PIXEL ART CHARACTER SPRITE SHEET for an isometric modern Hong Kong cinema management game. Solid uniform pure GREEN #00FF00 chroma-key background, no alpha, no labels or grids. Exactly 4 equal columns and 4 equal rows in a square image, all 16 full-body characters strictly centered inside their own cells, same ground-contact height, large blank safe gutters. Crisp 32-bit-era tycoon hand-authored pixel art, consistent logical approximately 28x44 pixel human bodies, enlarged nearest-neighbor with visible pixel clusters, no antialias blur, no gradients, no shadows, no scenery. Feet conform to 2:1 isometric floor. TOP TWO ROWS: same adult Hong Kong cinema PATRON, navy cropped jacket with muted warm cream shirt, blue-gray trousers, dark hair, medium warm skin, modern casual clothes. Bottom TWO ROWS: same cinema EMPLOYEE, burgundy waistcoat over cream long sleeve shirt, dark navy trousers, tiny brass name badge, dark hair, modern cinema uniform. EACH COLUMN is one fixed viewing direction: column1 facing DOWN LEFT/SOUTHWEST, column2 DOWN RIGHT/SOUTHEAST, column3 UP RIGHT/NORTHEAST, column4 UP LEFT/NORTHWEST. ROW1 patron walking contact pose A, ROW2 patron walking opposite contact pose B, ROW3 employee walking contact pose A, ROW4 employee walking opposite contact pose B. Row1 and row2 must depict exactly the same patron identity and clothing in each direction, only leg/arm stride changes; row3 and row4 same employee. Patron and employee equal body scale and realistic human proportions, readable silhouette, compact 3-shade pixel palette. NO bright green anywhere on clothes or skin, background green must be perfectly uniform. No cell may contain two bodies. This is an actual game animation atlas, not concept art. All feet remain grounded consistently, all figures have a safe margin around head and feet.

Import: actual source 1254×1254; 16 measured body regions and foot anchors in manifest. Green-key test: g > 155 and g > 1.5r + 25 and g > 1.5b + 25. Done once in memory, with alpha and edge inspection in the browser. Crops share a 245-pixel reference body height; draw at 48 native world pixels, keep feet at terrain elevation. Whole-body walking and seated upper-body display use the same source, with explicit clips.

## Poster prompt / content briefs

Production movie-poster texture atlases for an original modern Hong Kong pixel-art cinema game. Rich finished 32-bit-era pixel illustration, crisp clusters, burgundy/petrol/cream/brass palette, no copied characters or brand compositions. Equal portrait 2:3 cells with no gutters. Bottom 18% of each cell is a quiet dark navy band; no lettering, logos or watermarks. Runtime supplies Traditional Chinese titles.

Primary sheet: 4×4, overall 1024×1536. Row-major subjects: undercover office worker between city towers; interstellar courier by ringed planet; family takeaway dinner; original office toys on commute; last midnight minibus; romantic tram-stop clock; kung-fu food courier; neighborhood cinema and projector; apocalyptic office worker; a ticket held in a sunlit hand; young worker in Hong Kong street; friendly original beach monsters; night delivery motorcycle; couple and blue sea; moving truck by a planet; eerie apartment window with cat-shaped shadow.

Late-release sheet: 2×2, overall 1024×1536. Row-major subjects: last independent Hong Kong bookshop; original neighborhood child hero helping at a market with a bird companion; motorcycle courier on an amber sunset bridge and clock; adult couple in cinema ticket queue with burgundy ropes and brass light.

Each film ID m0–m19 has one explicit atlas crop. In-world projection uses a landscape crop of the matching illustration; movie cards retain full portrait art. No generated wording is needed to understand a film's title, release day, price or revenue share.

## QA and import record

Source dimensions, all 16 actor cells, all 20 film mappings and furniture crop bounds are checked by tests/cinema/world.test.mjs. Newline text is external to the illustrations. The production browser verification inspects actual alpha, movement, seating, projection, equipment changes, rendering cost and mobile controls. See production/verification/v0.3/browser.json.

## v0.4 integrated rooms

zones/tickets.png, snacks.png and toilets.png are unchanged copies of the approved ImageGen sources in design/art/integrated-zones-v2/. They replace scattered service props with complete square room artwork. The runtime uses source landmarks and in-memory clipping for back walls/counter foreground, without modifying PNG pixels. manifest.zoneSprites owns those import polygons; map-data.mjs and map-world.mjs own placement and collision, not the archived legacy_layout. Seats, acoustic walls, elevated floors, actors and poster sources above are reused in the formal 56×56 map. Verification: tests/cinema/construction.test.mjs and production/verification/v0.4/browser.json.
