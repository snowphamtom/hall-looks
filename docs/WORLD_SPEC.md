# HEAVY IS THE CROWN: One World integration spec

Status: plan only. Nothing here is built or pushed. Repo: `snowphamtom/hall-looks`, live at https://snowphamtom.github.io/hall-looks/ (fresh clone, 14 Oct 2026).
Ground rules for every phase: keep the existing looks, fonts and blossom sky; images stay uncropped (`object-fit: contain`, natural aspect ratio, never `cover`); **`inferno/` is never touched** (it is not linked from any page today, so the hub does not link it either; `sw.js` already bypasses it); no network calls, so everything stays in this browser's localStorage.

---
## 1. Inventory

### 1a. Shared scripts (repo root)
| File | What it is | Data model / exposes |
|---|---|---|
| `locker-store.js` | Shared locker for all "Hall" pages | `window.HallLocker` {KEY `foundation-locker-v2`, CROWN_KEY `foundation-locker-crowns-v1`, BOARD_KEY `foundation-locker-board-v1`, CAPACITY 24, PRESETS[4], entries(), crowns(), board(), add({label,state,thumb,source,look}), removeId, removeLook, clear, hasLook, presetState(look), presetIndex}. Entry = `{id,at,fig,label,residual,state,thumb,source,look}`; `state` = Forge state (helmet, chest, finish, weapon, wear, crack, glow, color, wLen, wWear, wGlow, mus, height, prompt, desc, plus base* twins). Filling 24 slots earns a board entry per crown. |
| `locker-field.js` | Locker overlay/field UI used by most Hall pages | reads HallLocker |
| `locker.js` | Locker page logic | writes `L.KEY`; `SEEN_KEY` timestamp |
| `create.js` | Create (character builder, canvas-drawn, no images) | `window.HallCreate` {draw(spec,opts), pick}. Spec = `{ancestry,origin,build,weapon,rank,finish}`. Share hash `#c=<ancestry>.<origin>.<build>.<weapon>.<rank>.<finish>~<name>` (ids validated against lists). Saves to locker with `source:"create"` (state = preset state when finish matches a preset). |
| `card.js` | Tilt/gyro holo card | `window.HallCard` (make(o), skel) |
| `colosseum.js` | Colosseum: pick fighter A/B from the 4 looks, shows pre-rendered `images/fight-<a>-<b>.webp` | no storage; preset looks only |
| `smith.js` | Smith: pick look + weapon (`images/weapon-*.webp`) | no storage |
| `look.js` | Shared page for the 4 look pages | — |
| `nav.js` | Phone menu, blossom sky canvas, sound toggle, SW registration | `window.HallSound`; key `hc-sound` |
| `interaction.js` | `window.heavyPulse` haptics | — |
| `holo-*.js`, `hologram*.js` | Home-page hologram figure (grid/spatial/frames/turn/sway/mirror) | static frame data |
| `sw.js` | Service worker; skips `inferno/` | cache list must gain `js/crown-world.js` |
| `styles.css`, `card.css`, `create.css`, `blossom-bg.css` | Shared looks | — |

### 1b. Hall pages (use the shared nav/locker stack)
| Path | What it is | Reads / writes |
|---|---|---|
| `/index.html` | Home "HEAVY IS THE CROWN", hologram, links to 5 looks | HallLocker, HallCard |
| `foundation/`, `black-chrome/`, `white-samurai/`, `skull-champion/`, `titan-gladiator/` | The five look pages | HallLocker (save look) |
| `create/` | Character Create | `#c=`; locker add |
| `forge/` (117 KB, self-contained) | Forge: two-figure armor builder | own copy of locker read/write (same keys); `#b=<base64url {v:1,a:active,f:[fig,fig]}>` |
| `locker/` | Locker page | HallLocker |
| `throne/` | Throne Room: roster, statues from locker entries (thumb, rank tier via `LOCKER_RANKS`/`rankForCharacter`), card overlay, lazy 3D hall (`throne3d.js` `export start(statues)`, three 0.160 vendored) | `window.ThroneCard`; links forge/, locker/ |
| `colosseum/` | Fight picker | colosseum.js |
| `smith/` | Weapon smith | smith.js |
| `gallery/` | 3D Gallery tiles → cathedral, elemental, genesis-forest, genesis-marvel, tessera-bridge, workbench | static |
| `help/` | Help | — |
| `lab/` | Lab index → elemental, fault-constellation, genesis-forest, genesis-marvel, supreme-quad, tessera-bridge | — |

### 1c. Standalone exhibits (self-contained, mostly no shared scripts)
| Path | What it is | State / hooks |
|---|---|---|
| `cathedral/` (294 KB) | Cathedral Engine, Notre Dame sandbox | keys `cathBook` (book of doors), `cathBrief`, `cathSaves`, `cathGuideMuted`, `cathIntroHeard`; reads `location.hash`; uses nav.js |
| `core/` (114 KB) | Spatial Manifold, 7,140-door system | consts NODES, CORES, SOLIDS, TOUR; nav.js |
| `the-core/` (+ `manifold.html`, `map.html`) | Exhibit of the 7,140-door system; `core_compact.json`, python verifiers, MATH_AND_PROOFS.md | static JSON |
| `workbench/` | 3D chassis workbench (6 chassis, sculpt, cape, grid, measure atlas) | `window.WB`; key `hitc-workbench-designs-v1` |
| `elemental/` | "The Human Body — Elemental Recipe" + `elements_to_molecules_map.jpg` | static, links lab/ |
| `periodic-table/part1-4.txt` | React artifact (split HTML) | static |
| `tessera-bridge/` | Tessera Kernel Bridge: 12 transparent layers in one 3D volume (three.js) | `names` array, solo/breathe |
| `supreme-quad/` (202 KB), `fault-constellation/` (186 KB) | Lab demos | `hashchange` routing |
| `genesis-forest/`, `genesis-marvel/` | GENESIS 7140 demos | static |
| `seraphim/` | Curation Engine | static, no nav |
| `holographic/`, `media/`, `images/`, `test/` | assets / tests | — |
| Top-level demos: `ar_lasers.html`, `ar_lasers_kid.html`, `ball_room.html`, `bird_swarms.html`, `finger_haptics.html`, `finger_holo.html` (`location.hash`), `retina.html`, `holo-test.html` | Camera/hand/optics demos | no storage, no nav |
| `inferno/` | **Excluded**. Not linked anywhere. Do not modify, do not link. | — |

### 1d. External data (Google Drive, read via connector)
- **Periodic Table Vault** sheet (`1BBul7nV…`): 118 rows, columns Atomic #, Symbol, Name, Mass, Period, Group, Block, Electron Config, Fibonacci?, Golden Ratio Note, Category (Transition 38, Noble 7, Alkali 7, Halogen 6, Alkaline 6, …) plus a few "Vault" note rows.
- **Anatomy Book of Lost Knowledge** doc (`1TYal9zn…`): Preface + 12 chapters: 1 Skeleton, 2 Fascia, 3 Water, 4 Muscular, 5 Three Brains, 6 Cardiovascular/118 elements, 7 Nervous, 8 Respiratory, 9 Digestive, 10 Endocrine, 11 Biofield, 12 Complete Tuning.
  Note: much of the book is alternative/speculative material (water memory, chakras, biofield). Present it as the book's lore, in its own voice, not as medical fact. The "elemental makeup" numbers should use standard body-composition figures (O ≈ 65%, C 18.5, H 9.5, N 3.2, Ca 1.5, P 1.0, K, S, Na, Cl, Mg, trace) so the science view stays true.

---
## 2. Shared module: `/js/crown-world.js`

Plain IIFE (no build step, matches existing style), loaded with `<script src="../js/crown-world.js" defer>` *after* `locker-store.js` where present. Safe to load on a page that uses none of it. Exposes `window.CrownWorld`.

### 2a. The Character (one canonical shape)
```js
Character = {
  v: 1, id: "ch-…", name: "…",
  origin: "create" | "forge" | "preset",
  create: {ancestry,origin,build,weapon,rank,finish} | null,   // Create ids
  forge:  {…Forge state…} | null,                            // same as locker entry.state
  look:   "black-chrome" | … | null,                         // nearest preset look
  thumb:  "data:image/…" | "",                               // as stored in locker, uncropped
  rank: 1..24
}
```
Adapters, no data migration: a locker entry *is* a character (`fromLockerEntry(e)`); `#c=` and `#b=` hashes parse into one.

### 2b. API
```js
CrownWorld.character.active()            // the chosen one (key crown-world-active-v1 = locker id), falls back to newest locker entry, then a preset
CrownWorld.character.setActive(id)
CrownWorld.character.all()               // HallLocker.entries() → Character[]
CrownWorld.character.fromHash(hash)      // "#c=…" | "#b=…" → Character|null (reuses Create/Forge parsing rules; only known ids/keys)
CrownWorld.character.toHash(ch)          // prefers #c= for create, #b= for forge
CrownWorld.character.nearestLook(ch)     // maps finish/helmet/weapon → one of the 4 preset looks (for pre-rendered art: Colosseum fights, statues)
CrownWorld.character.draw(canvas, ch, opts) // HallCreate.draw when spec exists, else preset image drawn with contain-fit

CrownWorld.ledger.add(type, data)        // {t: Date.now(), type, page, data}; types: visit, build, save, fight, forge, smith, door, layer, element
CrownWorld.ledger.list({type, since, limit})
CrownWorld.ledger.stats()                // counts per type/page, rooms visited, streak days
CrownWorld.ledger.clear()
CrownWorld.ledger.on(fn)                 // fires on local add and cross-tab "storage" events

CrownWorld.body.makeup(ch)               // [{sym,name,pct,category,period,group}] 
CrownWorld.body.layers(ch)               // 12 crown layers (§2d) with values 0..1
CrownWorld.rooms                          // registry (§2e)
CrownWorld.visit()                        // auto: ledger.add("visit", {room}) once per page load, deduped 10 min
```
Storage: ledger key `crown-ledger-v1`, ring buffer of 500 events, compact JSON; all writes in try/catch (same "nothing was saved" pattern as locker-store). Elements/anatomy data live in a static `/js/crown-data.js` (generated once from the two Drive files by a script; committed; no runtime Drive access).

### 2c. Elemental makeup ("science as anatomy")
Base: standard human composition by mass (top 11 + trace) joined to the Vault sheet for symbol/name/category/period/group. Character modifiers, small and readable:
- `finish` chrome/black → Fe, Cr trace visual accent on the armor ring (armor, not body; shown as a separate "armor" ring)
- `mus` → muscle share (shifts N, K) ; `height` → Ca/P (bone) ; `glow` → highlight Noble ring; `weapon` → armor metal (katana Fe/C, hammer Fe/W, axe Fe, warhammer Fe/Ti)
View: ring chart around the figure, each ring tile styled like the periodic table, clickable to the full table (`periodic-table/`) and `elemental/`.

### 2d. 12 kernel layers ↔ crown layers ↔ anatomy chapters
| # | Tessera layer | Crown layer | Anatomy chapter | Character input |
|---|---|---|---|---|
| 1 | NODE GRAPH | Skeleton (frame) | 1 Skeleton | height, build |
| 2 | H14 MATRIX | Fascia (web) | 2 Fascia | wear |
| 3 | FIEDLER BAND | Water | 3 Water | finish |
| 4 | KURAMOTO FLOW | Muscle | 4 Muscular | mus |
| 5 | CIRCOS CHORDS | Three brains | 5 Three Brains | rank |
| 6 | ARTIN BRAID | Blood / elements | 6 Cardiovascular | makeup() |
| 7 | EIGENSPACE | Nerves | 7 Nervous | glow |
| 8 | LOSS SURFACE | Breath | 8 Respiratory | crack (inverse) |
| 9 | ELEMENTAL RINGS | Gut alchemy | 9 Digestive | ancestry/origin |
| 10 | FIBONACCI SPIRAL | Seven glands | 10 Endocrine | ledger days (Fibonacci-flagged elements in sheet) |
| 11 | PARITY BINARY | Biofield / armor shell | 11 Biofield | helmet + chest |
| 12 | 17 BEACONS | The crown (seal) | 12 Complete Tuning | ledger.stats() total |
"Inner body" view = the 12 layers stacked as transparent plates through the figure (same visual as tessera-bridge), solo/breathe controls reused. tessera-bridge itself gets a read-only label line "Crown layer: …" per button when a character is active.

### 2e. Room registry (hub doorways)
`{id, href, title, group, thumb}` for: forge, locker, colosseum, gallery, smith, create, cathedral, core, the-core, workbench, genesis-forest, genesis-marvel, elemental, tessera-bridge, supreme-quad, fault-constellation, lab, periodic-table, seraphim, help, the 5 looks, and top-level demos (ar_lasers, ar_lasers_kid, ball_room, bird_swarms, finger_haptics, finger_holo, retina). Thumbs reuse existing images/og images, shown with contain. `inferno` is not in the registry.

---
## 3. Per-page changes
| Page | Change | Risk |
|---|---|---|
| All Hall pages (via `nav.js`) | `nav.js` lazily injects `js/crown-world.js` → auto `visit` event; add a small crown chip in nav (ledger count, link to throne) | low |
| `create/` | after `L.add` and on share: `ledger.add("build",{via:"create",id})`; store `create` spec on the locker entry (new optional field `spec`; HallLocker.add passes it through) so the character is reconstructable | low |
| `locker-store.js` | `add()` keeps an optional `spec` field; emits `ledger.add("save")`. No key/shape change | low |
| `forge/` | on save/share: `ledger.add("forge")`; "Use as my character" button → setActive | low |
| `locker/` | "Make active" per entry; shows active badge | low |
| `throne/` | statues already come from locker; add: active character on the throne dais; crown overlay showing ledger (recent events, totals, rooms visited as gems); doorways ring in `throne3d.js` (walk-up portals, click/Enter navigates, 2D list fallback for no-WebGL/reduced motion) | medium |
| `colosseum/` | fighter A defaults to active character's `nearestLook` with their name/thumb shown; Create builds drawn on canvas beside the pre-rendered fight art (art untouched); `ledger.add("fight",{a,b})` | low/medium |
| `smith/` | `ledger.add("smith",{weapon})`; offer "apply to active character" (writes weapon to Forge state) | low |
| `gallery/` | first tile = "Your character" card (HallCard + character.draw); `door` events | low |
| `workbench/` | import active character's Forge proportions (height, mus) into chassis; save event | medium |
| `elemental/`, `periodic-table/` | read-only banner: "Your character's makeup" ring from `body.makeup`; highlight their elements | medium (large files; add a tiny separate script block, no rewrites) |
| `tessera-bridge/` | crown-layer labels + figure silhouette in the stack | medium |
| `cathedral/`, `core/`, `the-core/`, `supreme-quad/`, `fault-constellation/`, `genesis-*`, `seraphim/`, top-level demos | one `<script>` tag + "back to Throne" door link; optional figure only in 3D scenes as a billboard sprite of the character's canvas drawing; `cathBook` door openings mirrored as `door` events (read-only of cathedral's own keys) | low for tag, medium for figure |
| `sw.js` | add new JS files to cache list; inferno rule unchanged | low |

---
## 4. Phased build order (low risk first)
1. **Phase 0 — Module + ledger, no UI.** Add `js/crown-world.js` (ledger, character adapters, rooms), unit page `test/crown-world.html`. Load via nav.js. Only effect: visit events. Revert = delete one file.
2. **Phase 1 — Writers.** Build/save/forge/fight/smith events in create, locker-store, forge, colosseum, smith. Optional `spec` on locker entries (backward compatible).
3. **Phase 2 — The crown remembers.** Throne crown overlay + nav chip reading the ledger. Locker "Make active".
4. **Phase 3 — Hub doorways.** Throne 2D doorway list from registry, then 3D portals in throne3d.js; "back to Throne" links on every room (one line each).
5. **Phase 4 — One character everywhere (2D).** Throne dais statue, Colosseum fighter, Gallery card.
6. **Phase 5 — Science as anatomy.** Generate `js/crown-data.js` from the Drive sheet/doc; Elemental makeup view + 12-layer inner body view (new page `throne/body/` or panel in throne), tessera-bridge labels.
7. **Phase 6 — Figure inside 3D pieces.** Billboard sprite in cathedral/core/genesis/workbench scenes, behind a feature flag (`?figure=1`) until checked on phone.
Each phase: check on phone + desktop, reduced motion, storage disabled (private mode) — every page must still work with no ledger.

## 5. Open questions for Taylor
- Active character: newest build automatically, or only when chosen?
- Should the ledger show on the crown as gems (one per room visited) or as a text log, or both?
- Fine to label the anatomy book's material as "the book's teaching" in the inner-body view?
