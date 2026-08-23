import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TargetedCleanup")

raw_text = """Item	1d20 d&d fizban's treasure misfit: blind mystery box		Dungeons and Dragons	17,72	Und.	5	88,6
Item	40mm d6 d&d jumbo inclusion: gelatinous cube		Dungeons and Dragons	24,99	Und.	1	24,99
Item	7-die set full art: stardust		ACCESORIOS	26,42	Und.	1	26,42
Item	adventure time card wars: peppermint butler vs. magic man, collector's pack		Adventure Time Card Wars	20,03	Und.	1	20,03
Item	adventure time card wars: prismo vs. the lich, collector's pack		Adventure Time Card Wars	20,03	Und.	1	20,03
Item	agua gasificada		Consumibles	1,41	Und.	1	1,41
Item	agua minalba		Consumibles	0,86	Und.	52	44,72
Item	aros de papa tom 20gr		Consumibles	0,35	Und.	16	5,6
Item	betogalletas		Consumibles	2,2	Und.	4	8,8
Item	binder: 12-pocket domaru cryptids collection		ACCESORIOS	35,7	Und.	8	285,6
Item	binder: 4-pocket domaru cryptids collection		ACCESORIOS	22,82	Und.	3	68,46
Item	binder: 9-pocket domaru cryptids collection		ACCESORIOS	30,88	Und.	2	61,76
Item	BUUBBALOO SPARKIES		Consumibles	0,47	Und.	11	5,17
Item	cheese tris 54gr		Consumibles	0,78	Und.	6	4,68
Item	chicharron picante 62gr		Consumibles	2,15	Und.	6	12,9
Item	chicle buzzi hotwheels		Consumibles	0,03	Und.	15	0,45
Item	chocolate cricri		Consumibles	1,3	Und.	1	1,3
Item	chocolate milka		Consumibles	2,47	Und.	7	17,29
Item	chocolate savoy		Consumibles	1,3	Und.	6	7,8
Item	cocosette		Consumibles	0,861052632	Und.	19	16,36
Item	d&d icons of the realms: ghost light - booster brick (10 boosters)		Dungeons and Dragons	24,59	Und.	7	172,13
Item	d&d nolzur's marvelous miniatures: unpainted minis- wave 28- assassin & berserker		Dungeons and Dragons	4,99	Und.	5	24,95
Item	d&d nolzur's marvelous miniatures: unpainted minis- wave 28- barlgura		Dungeons and Dragons	6,93	Und.	2	13,86
Item	d&d nolzur's marvelous miniatures: unpainted minis- wave 28- bugbear stalker & goblin hexer		Dungeons and Dragons	4,99	Und.	5	24,95
Item	d&d nolzur's marvelous miniatures: unpainted minis- wave 28- classic vampire & classic zombie		Dungeons and Dragons	4,99	Und.	2	9,98
Item	d&d nolzur's marvelous miniatures: unpainted minis- wave 28- ice mephit & dust mephit		Dungeons and Dragons	4,99	Und.	5	24,95
Item	d&d nolzur's marvelous miniatures: unpainted minis- wave 28- werebear		Dungeons and Dragons	6,93	Und.	2	13,86
Item	digimon tcg: booster  dual revolutiuon (bt-25)		Digimon	5,3	Und.	17	90,1
Item	digimon tcg: booster display dual revolutiuon (bt-25)		Digimon	81,24	Caja.	1	81,24
Item	Digimon tcg: extra booster - digital world shambala - (ex-12)		Digimon	82,74	Caja.	12	992,88
Item	digimon tcg: limited card pack- another knight- [ lm-07] booster		DIGIMON	3,95	Und.	6	23,7
Item	digimon tcg: limited card pack- another knight- [ lm-07] CAJA		DIGIMON	23,71	Und.	5	118,55
Item	digimon tcg: tamer's evolution box -rise of digimon- (pb-21)		Digimon	163,66	Und.	2	327,32
Item	Dnd - hojas de personaje delux libreta completa		Dungeons and Dragons	10,01	Und.	2	20,02
Item	dnd 5th edition character sheets 2017 - english 24ct. libreta completa		Dungeons and Dragons	9,3	Und.	1	9,3
Item	dnd guia del dungeon master - libro		Dungeons and Dragons	43,99	Und.	1	43,99
Item	Dnd miniatura - baldur's gate 3 		Dungeons and Dragons	29,73	Und.	1	29,73
Item	Dnd miniatura - black dracolich		Dungeons and Dragons	110,61	Und.	1	110,61
Item	dnd miniatura - bulezau y quasit		Dungeons and Dragons	4,31	Und.	2	8,62
Item	Dnd miniatura - roc		Dungeons and Dragons	38,97	Und.	1	38,97
Item	dnd miniatura - rutterkin y maw demon		Dungeons and Dragons	4,31	Und.	2	8,62
Item	Dnd miniatura - satyr & dryad		Dungeons and Dragons	4,31	Und.	1	4,31
Item	Dnd miniatura - swarm of rot grubs & rot grub victim		Dungeons and Dragons	4,31	Und.	2	8,62
Item	dorito dinamita Limon		Consumibles	2,87	Und.	2	5,74
Item	dorito flamingo hot		Consumibles	2,87	Und.	3	8,61
Item	doritos mega queso 150gr		Consumibles	2,85	Und.	6	17,1
Item	dragon shield sleeves: board game sleeves- grand standard (100 ct.)		ACCESORIOS	6,3	Und.	1	6,3
Item	dragon shield sleeves: extra large (100 ct.)		ACCESORIOS	6,19	Und.	1	6,19
Item	dragon shield sleeves: perfect fit standard- clear/clear (100 ct.)		ACCESORIOS	5,67	Und.	6	34,02
Item	dragon shield sleeves: square (100 ct.)		ACCESORIOS	5,64	Und.	1	5,64
Item	dragon shield sleeves: standard dual- matte		ACCESORIOS	10,96	Und.	18	197,28
Item	dragon shield sleeves: standard dual- matte black & gold (100 ct.)		ACCESORIOS	10,96	Und.	5	54,8
Item	dragon shield sleeves: standard dual- matte 'mtg guildpact series- azorious senate' art (100 ct.)		ACCESORIOS	18,03	Und.	1	18,03
Item	dragon shield sleeves: standard dual- matte 'mtg guildpact series- cult of rakdos' art (100 ct.)		ACCESORIOS	18,03	Und.	2	36,06
Item	dragon shield sleeves: standard dual- matte 'mtg guildpact series- grull clans' art		ACCESORIOS	18,03	Und.	2	36,06
Item	Dragon shield sleeves: standard dual- matte 'mtg guildpact series- house dimir' art (100 ct.)		ACCESORIOS	18,03	Und.	2	36,06
Item	dragon shield sleeves: standard dual- matte 'mtg guildpact series- izzet league' art (100 ct.)		ACCESORIOS	18,03	Und.	2	36,06
Item	Dragon shield sleeves: standard dual- matte 'mtg guildpact series- selesnya conclave' art (100 ct.)		ACCESORIOS	18,03	Und.	2	36,06
Item	dragon shield sleeves: standard dual- matte 'mtg guildpact series- simic combine' art (100 ct.)		ACCESORIOS	18,03	Und.	2	36,06
Item	dragon shield sleeves: standard dual- matte power & copper (100ct.)		ACCESORIOS	10,96	Und.	9	98,64
Item	dragon shield sleeves: standard dual- matte soul & petrol (100 ct.)		ACCESORIOS	10,96	Und.	5	54,8
Item	dragon shield sleeves: standard- matte		ACCESORIOS	10,2	Und.	16	163,2
Item	dragon shield sleeves: standard- outer sleeves - clear (100 ct.)		ACCESORIOS	11,025	Und.	16	176,4
Item	flaquito chocolate		Consumibles	0,532941176	Und.	17	9,06
Item	flesh & blood omens of the third age pre-release kit		Flesh & Blood	31,26	Und.	1	31,26
Item	flesh and blood tcg: history pack 1 blitz decks		Flesh & Blood	6,19	Und.	9	55,71
Item	flesh and blood tcg: mastery pack warrior booster		Flesh & Blood	5,54	Und.	11	60,94
Item	flesh and blood tcg: mastery pack warrior display (12 packs)		Flesh & Blood	44,54	Und.	13	579,02
Item	flesh and blood tcg: olympia armory deck		Flesh & Blood	26,34	Und.	5	131,7
Item	flesh and blood tcg: omens of the third age booster		Flesh & Blood	5,29	Und.	21	111,09
Item	Fleshs and Blood / Omens of the third age booster display Caja		flesh & Blood	79,16	Caja.	5	395,8
Item	gatorade general		Consumibles	1,77	Und.	68	120,36
Item	gomitas trululu		Consumibles	0,72	Und.	9	6,48
Item	Gundam card game: deck build box- 01freedom ascension [sc01]		Gundam	30,49	Und.	2	60,98
Item	gundam card game: freedom ascension booster pack [gd05]		Gundam	5,16	Und.	16	82,56
Item	Gundam card game: freedom ascension booster pack display [gd05]		Gundam	77,73	Caja.	2	155,46
Item	gundam card game: g generation eternal- eternal nexus extra booster (eb01)		GUNDAM	5,12	Und.	29	148,48
Item	Gundam card game: g generation eternal- eternal nexus extra booster pack display [eb01]		GUNDAM	77,24	Caja.	1	77,24
Item	Gundam card game:G generation eternal generation pulse [st10]		GUNDAM	13,07	Und.	5	65,35
Item	heroquest: wizards of morcar quest pack		Dungeons and Dragons	46,6	Und.	1	46,6
Item	iselitas 28gr		Consumibles	0,63	Und.	4	2,52
Item	lipton (limon y durazno)		Consumibles	1,65	Und.	56	92,4
Item	malta retornable		Consumibles	0,48	Und.	83	39,84
Item	Marvel super heroes commander deck, collector edition (avengers assemble)		Magic	116,61	Und.	1	116,61
Item	Marvel super heroes commander deck, collector edition (fantastic four)		Magic	116,61	Und.	1	116,61
Item	Marvel super heroes commander deck, collector edition (wakanda forever)		Magic	116,61	Und.	1	116,61
Item	Marvel super heroes gift bundle		Magic	73,41	Und.	6	440,46
Item	mentos		Consumibles	0,49	Und.	11	5,39
Item	MTG español marvel super heroes beginner box		Magic	32,35	Und.	2	64,7
Item	MTG marvel super heroes bundle		Magic	57,09	Und.	1	57,09
Item	MTG marvel super heroes collector's booster display		Magic	322,96	Caja.	1	322,96
Item	MTG marvel super heroes commander deck (avengers assemble)		Magic	53,96	Und.	1	53,96
Item	MTG marvel super heroes commander deck (doom prevails)		Magic	53,96	Und.	1	53,96
Item	MTG marvel super heroes commander deck (fantastic four)		Magic	53,96	Und.	4	215,84
Item	MTG marvel super heroes commander deck (wakanda forever)		Magic	53,96	Und.	3	161,88
Item	MTG marvel super heroes jumpstart booster display		Magic	115,41	Caja.	1	115,41
Item	mtg marvel super heroes play booster		Magic	6,49	Und.	2	12,98
Item	MTG marvel super heroes scene box (heroes united)		Magic	31,69	Und.	3	95,07
Item	MTG marvel super heroes scene box (villains unleashed)		Magic	31,69	Und.	3	95,07
Item	MTG the hobbit draft night box		Magic	94,64705882	Und.	17	1609
Item	mtg the hobbit play booster		Magic	6,35	Und.	16	101,6
Item	MTG the hobbit play booster display		Magic	133,31	Und.	2	266,62
Item	mtg: .999 silver plated metal card		Magic	20	Und.	2	40
Item	mtg: lorwyn eclipsed collector's booster display caja		Magic	216,13	Caja.	2	432,26
Item	mtg: lorwyn eclipsed commander deck Dance of Elements		Magic	33,32	Und.	1	33,32
Item	mtg: lorwyn eclipsed play booster		Magic	3,84	Und.	26	99,84
Item	mtg: lorwyn eclipsed play booster display caja		Magic	115,26	Caja.	1	115,26
Item	mtg: lorwyn eclipsed preconstructed angels		Magic	15,39	Und.	1	15,39
Item	mtg: lorwyn eclipsed preconstructed pirats		Magic	15,39	Und.	4	61,56
Item	mtg: secrets of strixhaven commander deck - quandrix unlimited		Magic	38,45	Und.	1	38,45
Item	mtg: secrets of strixhaven play booster		Magic	4,67	Und.	13	60,71
Item	mtg: secrets of strixhaven play booster display (caja)		Magic	114,48	Caja.	2	228,96
Item	mtg: spanish lorwyn eclipsed prerelease pack (SPANISH)		Magic	26,56	Und.	3	79,68
Item	mtg: spanish the hobbit prerelease pack		Magic	30,92	Und.	5	154,6
Item	mtg: spanish universes beyond- teenage mutant ninja turtles prerelease pack (SPANISH)		Magic	29,18	Und.	9	262,62
Item	MTG: the hobbit bundle		Magic	55,58444444	Und.	27	1500,78
Item	mtg: the hobbit collector's booster		magic	317,47	Und.	1	317,47
Item	mtg: universes beyond- avatar the last airbender beginner box		Magic	40,71	Und.	3	122,13
Item	mtg: universes beyond- avatar the last airbender play booster		Magic	4,48	Und.	10	44,8
Item	mtg: universes beyond- avatar the last airbender play booster display caja		Magic	134,37	Caja.	1	134,37
Item	mtg: universes beyond- teenage mutant ninja turtles draft night box		Magic	95,14	Und.	3	285,42
Item	mtg: universes beyond-teenage mutant ninja turtles play booster		Magic	4,53	Und.	20	90,6
Item	mtg: universes beyond-teenage mutant ninja turtles play booster (caja)		Magic	135,84	Caja.	2	271,68
Item	one piece tcg: booster (op-13)		ONE PIECE	4,84	Und.	7	33,88
Item	one piece tcg: booster (op-16)		ONE PIECE	6,5	Und.	12	78
Item	one piece tcg: starter deck [st-31]		One Piece	11,54	Und.	3	34,62
Item	one piece tcg: starter deck [st-32]		One Piece	11,54	Und.	6	69,24
Item	one piece tcg: starter deck [st-33]		One Piece	11,54	Und.	9	103,86
Item	one piece tcg: starter deck [st-34]		One Piece	11,54	Und.	8	92,32
Item	one piece tcg: starter deck [st-35]		One Piece	11,54	Und.	6	69,24
Item	one piece tcg: starter deck [st-36]		One Piece	11,54	Und.	6	69,24
Item	opaque polyhedral dice sets		ACCESORIOS	6,96	Und.	4	27,84
Item	panque jeancake		Consumibles	1,11	Und.	1	1,11
Item	pepito 80gr		Consumibles	1,21	Und.	2	2,42
Item	perler beads abalorios medium		Pokemon	15	Und.	6	90
Item	perler beads abalorios small		Pokemon	10	Und.	3	30
Item	perler beads abalorios xl		Pokemon	20	Und.	4	80
Item	platanitos iselitas limón		Consumibles	2,12	Und.	5	10,6
Item	platanitos iselitas natural		Consumibles	2,12	Und.	2	4,24
Item	playmat: extended- doom		ACCESORIOS	23,64	Und.	2	47,28
Item	playmat: final fantasy- #sqkawaii sounds		ACCESORIOS	27,27	Und.	1	27,27
Item	playmat: the hobbit- concept art 02- thranduil's kingdom		ACCESORIOS	35,68	Und.	1	35,68
Item	pokemon tcg: team rocket's mewtwo ex league battle deck case		Pokemon	27,75	Und.	1	27,75
Item	pringles grandes		Consumibles	3,3	Und.	8	26,4
Item	raquety  picante		Consumibles	0,51	Und.	12	6,12
Item	refresco retornable		Consumibles	0,46	Und.	125	57,5
Item	riftbound tcg: proving grounds		Riftbound	53,3075	Und.	8	426,46
Item	riftbound tcg: set 1 - origins - booster		Riftbound	5,23	Und.	11	57,53
Item	riftbound tcg: set 1 - origins - booster display		Riftbound	79,53	Und.	1	79,53
Item	riftbound tcg: set 3 - champion deck vi		Riftbound	15,93	Und.	3	47,79
Item	riftbound tcg: set 3 - unleashed - booster		Riftbound	5,36	Und.	4	21,44
Item	riftbound tcg: set 3 - unleashed - booster display		Riftbound	82,48	Caja.	2	164,96
Item	riftbound tcg: set 4- vendetta- booster		Riftbound	5,44	Und.	26	141,44
Item	riftbound tcg: set 4- vendetta- booster display (24 packs)		Riftbound	84,59	Caja.	10	845,9
Item	riftbound tcg: set 4- vendetta- vault bundle		Riftbound	31,2	Und.	1	31,2
Item	salserito madurito 80gr		Consumibles	1,24	Und.	5	6,2
Item	samba de chocolate		Consumibles	0,9076	Und.	25	22,69
Item	samba de fresa		Consumibles	0,906956522	Und.	23	20,86
Item	Silver age chapter 3 deck boltyn		Flesh & Blood	14,7	Und.	1	14,7
Item	Silver age chapter 3 deck liath goldmane		Flesh & Blood	14,7	Und.	2	29,4
Item	snickers 52gr		Consumibles	1,97	Und.	4	7,88
Item	stranger things treasure packs pdq		ACCESORIOS	8,58	Und.	5	42,9
Item	susy		Consumibles	0,784736842	Und.	19	14,91
Item	table mat: pokemon- mega charizard x and mega charizard y 6ft tablema		ACCESORIOS	53,2	Und.	2	106,4
Item	tom 80GR		Consumibles	0,91	Und.	17	15,47
Item	tom palitos de maiz		Consumibles	0,81	Und.	1	0,81
Item	topload sleeve: toploader combo-pokemon- pikachu		ACCESORIOS	9,77	Und.	10	97,7
Item	toronto		Consumibles	0,56	Und.	3	1,68
Item	triple play 70gr		Consumibles	1,81	Und.	1	1,81
Item	weiss schwarz: hatsune miku colorful stage! more more jump! trial deck		Weiss Schwarz:	17,02	Und.	1	17,02
Item	weiss schwarz: hatsune miku colorful stage! vivid bad squad trial deck		Weiss Schwarz:	17,02	Und.	1	17,02
Item	weiss schwarz: hatsune miku colorful stage! wonderlands×showtime trial deck		Weiss Schwarz:	17,02	Und.	1	17,02
Item	weiss schwarz: umamusume pretty derby booster		Weiss Schwarz:	5,68	Und.	4	22,72
Item	wixoss legendary diva booster		Wixoss	2,32	Und.	17	39,44
Item	wixoss legendary diva booster display caja		Wixoss	46,3	Und.	1	46,3
Item	yuca iselitas crema de cebolla		Consumibles	1,85	Und.	4	7,4
Item	yuca iselitas limon		Consumibles	1,85	Und.	5	9,25
Item	yu-gi-oh! tcg "duelist’s advance" booster		Yu-Gi-Oh	2,82	Und.	10	28,2
Item	yukery botella		Consumibles	1,11	Und.	12	13,32
Item	7-die set d&d dragon scale: metal- gold		ACCESORIOS	33,19	Und.		
Item	7-die set mini metal: mystery misfit assortment		ACCESORIOS	14,76	Und.		
Item	adventure time card wars: darklands cooperative expansion		Adventure Time Card Wars	20,03	Und.		
Item	adventure time card wars: flame princess vs. fern, collector's pack		Adventure Time Card Wars	20,03	Und.		
Item	adventure time card wars: lands of legend booster collection		Adventure Time Card Wars	18,66	Und.		
Item	album marvel panini		PANINI	6	Und.		
Item	album tapa blanda mundial 2026 PANINI		PANINI	5,74	Und.		
Item	album tapa dura dorado mundial 2026 panini		PANINI	24,6	Und.		
Item	album tapa dura norma mundial 2026 panini		PANINI	20,5	Und.		
Item	baldur's gate 3 treasure pack dice set pdq (25 sets)		ACCESORIOS	7,73	Und.		
Item	betogalletas especiales		Consumibles	2,7	Und.		
Item	bolsa geekorium		Consumibles	0,2	Und.		
Item	bolsa pirulin max		Consumibles	2,27	Und.		
Item	bombombun variada		Consumibles	0,1	Und.		
Item	caja de sobres barajitas mundial 2026 PANINI		PANINI	187,62	Caja.		
Item	canelita		Consumibles	0,75	Und.		
Item	caramelos chao nuevos		Consumibles	0,12	Und.		
Item	cheesetris familiar		Consumibles	2	Und.		
Item	chupeta pin pop surtida		Consumibles	0,15	Und.		
Item	cotufas acarameladas		Consumibles	0,23	Und.		
Item	d&d dungeon master's screen wilderness kit		Dungeons and Dragons	21,91	Und.		
Item	d&d icons of the realms: tree blight		Dungeons and Dragons	30,22	Und.		
Item	dados etb perfect order		ACCESORIOS	1	Und.		
Item	deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- gondor		ACCESORIOS	25,63	Und.		
Item	deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- rivendell		ACCESORIOS	25,63	Und.		
Item	deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- rohan		ACCESORIOS	25,63	Und.		
Item	deck case: sidewinder 100+ xenoskin lord of the rings- places of middle earth- the shire		ACCESORIOS	25,63	Und.		
Item	deck protectors: apex- doom (105ct)		ACCESORIOS	14,2	Und.		
Item	deluxe gaming trove- gallery series haunted hollow		ACCESORIOS	43,21	Und.		
Item	detodito familiar		Consumibles	2,8	Und.		
Item	dice case: d&d premium dice scroll- artifacts across eternities- drizzt & the forgotten realms map		ACCESORIOS	25,31	Und.		
Item	digimon tcg: - starter deck digimon beatbreak (st23)		DIGIMON	14,89	Und.		
Item	digimon tcg: - starter deck digimon data squad (st24)		DIGIMON	14,89	Und.		
Item	digimon tcg: advance booster digimon generation [ad-01] caja		DIGIMON	52,84	Caja.		
Item	digimon tcg: booster [ad-01]		Digimon	6,24	Und.		
Item	digimon tcg: extra booster - digital world shambala - (ex-12) booster		Digimon	5,36	Und.		
Item	dnd el caldero de tasha para todo - libro		Dungeons and Dragons	43,16	Und.		
Item	dnd Forgotten realm - heroes of faerun - libro		Dungeons and Dragons	43,69	Und.		
Item	dnd Guia de Xanathar para todo - libro		Dungeons and Dragons	36,05	Und.		
Item	dnd manual de monstruos - libro		Dungeons and Dragons	43,99	Und.		
Item	Dnd miniatura - drow mage & yochlol		Dungeons and Dragons	4,31	Und.		
Item	dorito familiar		Consumibles	3,25	Und.		
Item	dragon shield card storage: fortress- horizontal- 4-card drawers- black (620+ per drawer)		ACCESORIOS	41	Und.		
Item	dragon shield sleeves: oversize (100 ct.)		ACCESORIOS	7,04	Und.		
Item	dragon shield sleeves: standard dual- matte 'mtg guildpact series- boros legion' art (100 ct.)		ACCESORIOS	18,03	Und.		
Item	Dragon shield sleeves: standard dual- matte 'mtg guildpact series- golgari swarm' art (100 ct.)		ACCESORIOS	18,03	Und.		
Item	Dragon shield sleeves: standard dual- matte 'mtg guildpact series- orzhov syndicate' art (100 ct.)		ACCESORIOS	18,03	Und.		
Item	edge of eternities commander deck		Magic	33,52	Und.		
Item	elite trainer box ascended heroes		Pokemon	65,66	Und.		
Item	flaquito nevado		Consumibles	0,71	Und.		
Item	flesh & blood tcg: silver age chapter 2 deck display		Flesh & Blood	13,05	Und.		
Item	flesh and blood tcg: compendium of rathe booster display		Flesh & Blood	3,69	Und.		
Item	flesh and blood tcg: compendium of rathe booster display caja		Flesh & Blood	88,62	Caja.		
Item	flesh and blood tcg: hala armory deck [limitations apply]		Flesh & Blood	36,55	Und.		
Item	flesh and blood tcg: ira armory deck		Flesh & Blood	26,13	Und.		
Item	flesh and blood tcg: rhinar armory deck		Flesh & Blood	24,36	Und.		
Item	fruta desidratada		Consumibles	0,9	Und.		
Item	golpe con todo familar 140gr		Consumibles	2,92	Und.		
Item	gomitas play 55gr		Consumibles	0,61	Und.		
Item	gundam : set 2 booster [gd02]		GUNDAM	5,18	Und.		
Item	gundam card game: phantom aria booster pack [gd04]		GUNDAM	5,17	Und.		
Item	gundam card game: phantom aria booster pack display [gd04]		GUNDAM	77,99	Caja.		
Item	Gundam tcg: premium accessory set mobile suit gundam iron (pb02)		GUNDAM	73,57	Caja.		
Item	gundam: set 2 booster pack display [gd02]		GUNDAM	78,21	Und.		
Item	jugo justy		Consumibles	0,4	Und.		
Item	lokino de barra surtido		Consumibles	0,08	Und.		
Item	m&m chocolate con leche		Consumibles	1,97	Und.		
Item	m&m maní		Consumibles	1,97	Und.		
Item	marshmallows guandy 100gr		Consumibles	1,61	Und.		
Item	Marvel super heroes commander deck, collector edition (doom prevails)		Magic	116,61	Und.		
Item	mega emboar ex box		Pokemon	16,55	Und.		
Item	mega meganium ex box		Pokemon	16,55	Und.		
Item	minipiruetas		Consumibles	1,72	Und.		
Item	MTG marvel super heroes beginner box		Magic	32,35	Und.		
Item	MTG marvel super heroes draft night box		Magic	93,24	Caja.		
Item	MTG marvel super heroes play booster display		Magic	136,69	Caja.		
Item	mtg: lorwyn eclipsed collector's booster sobre		Magic	18,01	Und.		
Item	mtg: secret lair drop- the last of us part i: chasing hope- regular		Magic	33,75	Und.		
Item	mtg: secret lair drop- the last of us part ii: path of retribution- regular		Magic	33,78	Und.		
Item	mtg: secret lair drop- uncharted: saga of thieves- regular		Magic	33,78	Und.		
Item	mtg: secrets of strixhaven bundle		Magic	49,18	Und.		
Item	mtg: secrets of strixhaven codex bundle		Magic	63,85	Und.		
Item	mtg: secrets of strixhaven collector's booster		Magic	19,95	Und.		
Item	mtg: secrets of strixhaven collector's booster display		Magic	214,49	Caja.		
Item	mtg: secrets of strixhaven commander deck - Lorehold Spirit		Magic	33,1	Und.		
Item	mtg: secrets of strixhaven commander deck - prismari artistry		Magic	33,1	Und.		
Item	mtg: secrets of strixhaven draft night box		Magic	73,88	Caja.		
Item	mtg: spanish secrets of strixhaven prerelease pack		Magic	26,1	Und.		
Item	mtg: spanish universes beyond- avatar the last airbender beginner box		Magic	40	Und.		
Item	mtg: spanish universes beyond- marvel super heroes prerelease pack		Magic	30	Und.		
Item	mtg: the hobbit collector's booster		magic	28,48	Und.		
Item	mtg: the hobbit scene box crack de plates		magic	28,11	Und.		
Item	mtg: the hobbit scene box treasures of smaug		magic	28,11	Und.		
Item	mtg: universes beyond marvel super heroes jumpstart booster		Magic	6,77	Und.		
Item	mtg: universes beyond teenage mutant ninja turtles pizza bundle		MAGIC	72,16	Und.		
Item	mtg: universes beyond- avatar the last airbender bundle		Magic	50,76	Und.		
Item	mtg: universes beyond- avatar the last airbender collector's booster		Magic	24,93	Und.		
Item	mtg: universes beyond- marvel spider-man gift bundle		Magic	68,18	Und.		
Item	mtg: universes beyond- teenage mutant ninja turtles bundle		Magic	61,31	Und.		
Item	mtg: universes beyond- teenage mutant ninja turtles commander deck display		Magic	44,06	Und.		
Item	mtg: universes beyondmarvel super heroes collector's booster		Magic	28,75	Und.		
Item	mtg: universes beyondteenage mutant ninja turtles collector's booster display		Magic	27,41	Und.		
Item	mtg: universes beyondteenage mutant ninja turtles collector's booster display caja		Magic	328,92	Caja.		
Item	one piece tcg:  double pack set 11 (dp-11)		ONE PIECE	10,83	Und.		
Item	one piece tcg: adventure on kami's island booster display (op-15) CAJA		ONE PIECE	77,96	Und.		
Item	one piece tcg: booster display (op-13)		PREVENTA	68,25	Und.		
Item	one piece tcg: booster display (op-16) caja		ONE PIECE	70,72	Und.		
Item	one piece tcg: double pack set (dp-10)		ONE PIECE	10,52	Und.		
Item	one piece tcg: japanese 3rd anniversary set		ONE PIECE	142,35	Caja.		
Item	one piece tcg: official sleeves tcg+ stores limited edition vol. 6 lilith display		ACCESORIOS	7,86	Und.		
Item	one piece tcg: starter deck [st-30]		ONE PIECE	16,07	Und.		
Item	palitos		Consumibles	1	Und.		
Item	palitos xl		Consumibles	1,86	Und.		
Item	palworld ocg: dawn of palpagos booster		Palworld	5,13	Und.		
Item	palworld ocg: dawn of palpagos booster display (12 packs)		Palworld	39,6	Und.		
Item	palworld ocg: dawn of palpagos trial deck- green & purple		Palworld	19,85	Und.		
Item	palworld ocg: dawn of palpagos trial deck- red & blue		Palworld	19,85	Und.		
Item	panini tcg adrenalyn play booster		PANINI	3,6	Und.		
Item	panini tcg adrenalyn play booster caja		PANINI	86,4	Caja.		
Item	piruetas display		Consumibles	0,36	Und.		
Item	pirulin 16gr		Consumibles	0,5	Und.		
Item	playmat: pokemon- stitched abra evolutions		ACCESORIOS	20,29	Und.		
Item	playmat: sophoskin the hobbit- map- wilderland		ACCESORIOS	35,68	Und.		
Item	pokemon tcg: first partners set 1		POKEMON	30	Und.		
Item	pokemon tcg: mega evolution 02.5 ascended heroes- first partners deluxe pin collection 		POKEMON	19,36	Und.		
Item	pokemon tcg: mega evolution 03 perfect order- elite trainer box		Pokemon	71	Und.		
Item	pokemon tcg: mega evolution 03 perfect order- elite trainer box spanish		Pokemon	41,35	Und.		
Item	pokemon tcg: play booster perfect order	POKEMON	Pokemon	3,72	Und.		
Item	pokémon tcg: spanish mega evolution 2.5 - "ascended heroes" collection - (erika/larry)		Pokemon	6,7	Und.		
Item	pokemon tcg: spanish team rocket's mewtwo ex league battle deck case		Pokemon	27,75	Und.		
Item	pokemon tcg: trainer's toolkit 2025		Pokemon	30,6	Und.		
Item	polvorones		Consumibles	0,81	Und.		
Item	poster collection gardevoir		Pokemon	65,66	Und.		
Item	raquety mediano queso		Consumibles	0,9	Und.		
Item	Refresco minibomba		Consumibles	0,76	Und.		
Item	reshiram ex box		Pokemon	40	Und.		
Item	reven binders		ACCESORIOS	25	Und.		
Item	riftbound tcg: set 2- spiritforged - booster		Riftbound	5,36	Und.		
Item	riftbound tcg: set 2- spiritforged - booster display		Riftbound	82,52	Caja.		
Item	riftbound tcg: set 3 - champion deck vex		Riftbound	15,93	Und.		
Item	riftbound tcg: set 3 - the unleashed vault		Riftbound	30,18	Und.		
Item	riftbound tcg: set 3- unleashed- pre-rift event kit		Riftbound	22,99	Caja.		
Item	riftbound tcg: set 4- vendetta - pre-rift event kit		Riftbound	22,99	Und.		
Item	riftbound tcg: set 4- vendetta- showdown decks display- zed vs shen		Riftbound	27	Und.		
Item	rockstar		Consumibles	1,11	Und.		
Item	ruffles familiar queso		Consumibles	3,9	Und.		
Item	salserito normal 80gr		Consumibles	1,11	Und.		
Item	sha chicle acido		Consumibles	0,07	Und.		
Item	Silver age chapter 3 deck blaze firemind		Flesh & Blood	14,7	Und.		
Item	Silver age chapter 3 deck briar		Flesh & Blood	14,7	Und.		
Item	Silver age chapter 3 deck gravy bones		Flesh & Blood	14,7	Und.		
Item	sleeves japones kuriboh		ACCESORIOS	11	Und.		
Item	sleeves perfect order		ACCESORIOS	2	Und.		
Item	sobre barajita mundial 2026 panini		PANINI	1,8	Und.		
Item	toblerone		Consumibles	1,51	Und.		
Item	tom 140 GR		Consumibles	1,66	Und.		
Item	tom aros de papa		Consumibles	0,9	Und.		
Item	tom picante 80gr		Consumibles	1	Und.		
Item	ultimate guard 9-pocket pages 100ct unidad		ACCESORIOS	0,41	Und.		
Item	ultimate guard rte boulder 100+ the lord of the rings: "places of middle-earth" - mines of moria		ACCESORIOS	18,92	Und.		
Item	ultimate guard sidewinder 100+ xenoskin the lord of the rings™ "places of middle-earth"		ACCESORIOS	24,59	Und.		
Item	universes beyond- marvel spider-man bundle		Magic	53,76	Und.		
Item	weiss schwarz: hatsune miku colorful stage! leo/need trial deck		Weiss Schwarz:	17,02	Und.		
Item	weiss schwarz: umamusume pretty derby booster display		Weiss Schwarz:	46,26	Und.		
Item	yu-gi-oh! tcg "justice hunters" booster display		Yu-Gi-Oh	2,69	Und.		
Item	yu-gi-oh! tcg "rarity collection 5" booster		Yu-Gi-Oh	5,53	Und.		
Item	yu-gi-oh! tcg "rarity collection 5" booster display		Yu-Gi-Oh	86,61	Caja.		
Item	yuca iselitas natural		Consumibles	2	Und.		
Item	zyggy armory deck		Flesh & Blood	25,65	Und.		"""

allowed_names = set()
for line in raw_text.splitlines():
    parts = line.split('\t')
    if len(parts) >= 2:
        name = parts[1].strip().lower()
        if name:
            allowed_names.add(name)

odoo = OdooClient()
db = get_supabase()

cats = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.category', 'search_read', [[]], {'fields': ['id', 'name']})
single_cat_ids = [c['id'] for c in cats if 'Singles' in c['name']]

domain = [
    ('categ_id', 'not in', single_cat_ids)
]

all_sealed = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'search_read', [domain], {'fields': ['id', 'name']})

to_delete = []
for p in all_sealed:
    if p['name'].strip().lower() not in allowed_names:
        to_delete.append(p['id'])

logger.info(f"Found {len(all_sealed)} sealed products in Odoo. {len(to_delete)} are not in the allowed list and will be deleted.")

if to_delete:
    for chunk in [to_delete[i:i + 100] for i in range(0, len(to_delete), 100)]:
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'product.product', 'write', [chunk, {'active': False}])
        logger.info(f"Archived chunk of {len(chunk)} products from Odoo.")
        
    for chunk in [to_delete[i:i + 100] for i in range(0, len(to_delete), 100)]:
        db.table('accessories').update({'is_active': False}).in_('odoo_id', chunk).execute()
        logger.info(f"Archived chunk from Supabase.")
        
logger.info("Cleanup complete.")
