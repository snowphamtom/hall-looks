# THE CORE — Menu of Figures: the Math and the Proofs

_Every figure shown in the exhibit at [snowphamtom.github.io/hall-looks/the-core](https://snowphamtom.github.io/hall-looks/the-core/), with its derivation and its proof. Compiled Oct 11, 2026._

**How to read an entry.** *Derivation* is the math that produces the figure from the system's 48 integers — nothing is quoted from anywhere else. *Proof* names the check that recomputes it. *Status* is one of: **VERIFIED** (recomputed, exact), **ATTESTED** (claimed in source material, not recomputed), **REFUSED** (tested and rejected — kept on the menu because the refusal is part of the record), **FALSE AS PRINTED** (a claim the recomputation contradicts).

**The suites.** `core_engine.py` — the engine, 34/34 checks. `core_full.py` — the full battery, 37/37. `h14_verify.py` — 8/8. `never_pairs_verify.py` — 7/7. `gems2_verify.py` — 6/6. `starting_line_verify.py` — ALL PASS. `doors_generate.py` — regenerates the 7,140 from scratch. A Rust mirror of the engine agrees on every headline number.

**The system in one paragraph.** The nodes are 48 masks. For a pair (a, b), write x = a XOR b and o = a AND b. A *door* is a quadruple (a, b, c, d) where c and d redistribute the differing bits: c = o | u and d = o | (x XOR u) for some submask u of x, with both c and d inside the window. Pair distance is the Hamming distance popcount(a XOR b), running 1 to 6; doors live at distances 2-6. Everything below is arithmetic on that definition.

---

## The Stat Strip

### 48 masks
- **Derivation:** the node set of the system — the filed construction's 48 columns.
- **Proof:** `core_engine.py` derives the full system from these 48 integers; every suite loads exactly 48 nodes.
- **Status:** VERIFIED.

### 1,128 pairs
- **Derivation:** C(48, 2) = 48·47/2 = 1,128 unordered node pairs.
- **Proof:** pair census by distance — 124 + 282 + 352 + 253 + 100 + 17 = 1,128 (see Exhibit 01, Distance Census).
- **Status:** VERIFIED.

### 944 door pairs
- **Derivation:** of the 1,128 pairs, 944 carry at least one door; the remaining 184 are the never pairs.
- **Proof:** 1,128 − 184 = 944; the door-pair count is asserted before rendering in the spatial builders and recomputed by `core_engine.py`.
- **Status:** VERIFIED.

### 7,140 doors
- **Derivation:** sum over all pairs of the doors each pair carries, under the redistribution rule above.
- **Proof:** three independent counts agree — direct enumeration (`doors_generate.py`), the residual-map zero count, and the door census piles 360 + 3,584 + 3,196 = 7,140.
- **Status:** VERIFIED.

### 184 never pairs
- **Derivation:** 1,128 − 944 = 184; fully classified in Exhibit 01 (The Never Pairs, Explained).
- **Proof:** `never_pairs_verify.py` — 7/7.
- **Status:** VERIFIED.

### 0 XOR collisions
- **Derivation:** across all 1,128 pairs, no two pairs produce an aliasing syndrome — checked directly, and again through the H₁₄ route (Exhibit 01).
- **Proof:** `core_engine.py` 34/34; `h14_verify.py` 8/8 (minimum pair weight 2, zero unit/column/signed aliases).
- **Status:** VERIFIED.

---

## Exhibit 01 — The Measurements

### Door census — 360 Clean · 3,584 Wider · 3,196 Floor
- **Derivation:** each door is classified by its redistribution; the three piles partition the 7,140 with no remainder: 360 + 3,584 + 3,196 = 7,140.
- **Proof:** `core_engine.py` partition check — the check whose first failure exposed a misprinted table in the source manual; the corrected cells are what the exhibit prints.
- **Status:** VERIFIED. (The manual's original interior cells: FALSE AS PRINTED, corrected in the record.)

### Clean doors are forced — c = a & b, all 360
- **Derivation:** for every clean door, the redistribution collapses to c = a AND b; enumerated door by door, no exceptions.
- **Proof:** gem battery (`gems2_verify.py` lineage; engine census).
- **Status:** VERIFIED (Gem 08).

### Distance census — D2 488 · D3 1,696 · D4 2,548 · D5 1,864 · D6 544
- **Derivation:** doors grouped by their pair's Hamming distance popcount(a XOR b); pair counts per distance are 124 / 282 / 352 / 253 / 100 / 17, door-weighted to the figures shown. Sum: 488 + 1,696 + 2,548 + 1,864 + 544 = 7,140.
- **Proof:** `core_engine.py`; also printed identically on the independent sink-metrics plate (see Exhibit 03).
- **Status:** VERIFIED.

### Mean door distance — 4.0392
- **Derivation:** (2·488 + 3·1,696 + 4·2,548 + 5·1,864 + 6·544) / 7,140 = 28,840 / 7,140 = 4.0392.
- **Proof:** arithmetic on the verified census; matches the plates to the printed digit.
- **Status:** VERIFIED.

### No distance-1 doors — the gap
- **Derivation:** a distance-1 pair differs in exactly one bit; its only redistributions are self-splits (c in {a, b}), which are not doors. All 124 distance-1 pairs are never pairs.
- **Proof:** `never_pairs_verify.py` — 7/7 (see The Never Pairs, Explained).
- **Status:** VERIFIED.

### Operator W — λmax 299.358 · λmin −129.871 · Σλ² 191,808
- **Derivation:** W is the 48×48 pair-adjacency operator, entries = door counts between pairs of nodes. Σλ² = trace(W²) = the sum of squares of W's integer entries = 191,808, exactly.
- **Proof:** `core_engine.py` spectrum computation over the exact integer matrix. W and T were once confused in a draft script's §5; the corrected script keeps each under its own name and asserts 34 checks.
- **Status:** VERIFIED.

### W degeneracy — 27 distinct eigenvalues (15 simple, 3 double, 9 triple)
- **Derivation:** 15·1 + 3·2 + 9·3 = 48 eigenvalues counted with multiplicity; 15 + 3 + 9 = 27 distinct.
- **Proof:** `gems2_verify.py` — 6/6 (Gem 13). The mechanism of the degeneracy is not claimed.
- **Status:** VERIFIED (the count); mechanism UNCLAIMED.

### W invertible, barely — smallest |λ| ≈ 0.059, det < 0
- **Derivation:** the eigenvalue nearest zero has magnitude ≈ 0.059, so W⁻¹ exists but is ill-conditioned; the product of eigenvalues is negative.
- **Proof:** `gems2_verify.py` (Gem 12).
- **Status:** VERIFIED.

### Operator T — λmax 598.650 · λmin −86.262 · Σλ² 685,584
- **Derivation:** T is the transition operator over the same system — a different matrix from W, with its own spectrum. Σλ² = trace(T²) = 685,584, exactly.
- **Proof:** `core_engine.py`, T computed and asserted separately from W.
- **Status:** VERIFIED. (Note: λmax(T) 598.650 vs 2·λmax(W) 598.716 — near, NOT equal; the exhibit claims no such identity.)

### T appearances — 28,560 = 4 × 7,140
- **Derivation:** T's entries sum to 28,560; the factor 4 is the door quadruple's four positions.
- **Proof:** `gems2_verify.py` (Gem 14) — the equality is a count, and the second 14,280 it suggests elsewhere is refused as a rhyme (Gem 16).
- **Status:** VERIFIED as a count.

### The exact ratio — 685,584 : 191,808 = 529 : 148
- **Derivation:** both Σλ² are integers (door-count matrices). gcd(191,808, 685,584) = 1,296; 191,808 / 1,296 = 148 and 685,584 / 1,296 = 529. The ratio is exact, not rounded.
- **Proof:** the manifold builder asserts (191808, 685584) and the reduction (529, 148) on every build and refuses to build otherwise. In the manifold, the frame cage turns at 148/529 of the manifold's spin and the core solid counter-rotates at 529/148.
- **Status:** VERIFIED (as arithmetic of this system; it is not a measurement of the physical cosmos, and the exhibit does not present it as one).

### Flow census — 12,528 = 7,140 + 2,256 + 502 + 2,630
- **Derivation:** every redistribution candidate is classified: 7,140 become doors; 2,256 touch only themselves; 502 exit through the bottom of the window; 2,630 exit through the top. 7,140 + 2,256 + 502 + 2,630 = 12,528 — the census closes with nothing uncounted.
- **Proof:** `core_engine.py` flow census.
- **Status:** VERIFIED.

### Into 31 → 162 · Into 63 → 141 · Baseline 148.75
- **Derivation:** sink counts = doors arriving at each node. Baseline is the mean: 7,140 / 48 = 148.75. Node 31 runs +8.9% above it; node 63, −5.2% below. Distance profile into 31: mean 3.9012 (D2…D6 = 8.64 / 29.63 / 34.57 / 17.28 / 9.88%); into 63: mean 4.0426 (7.09 / 24.11 / 37.59 / 19.86 / 11.35%).
- **Proof:** recomputed from the door list; matches the independent sink-metrics plate to the printed digit, including 22 doors into 31 from pairs containing 15, and 15 into 63 from pairs containing 31.
- **Status:** VERIFIED.

### Kirchhoff for doors — hallway = sink at all 48 nodes
- **Derivation:** for every node n, hall(n) = sink(n), and pair-membership(n) = hall(n) + sink(n). Node 31: 324 = 162 + 162; its 648 total appearances are the system maximum. Mean appearances per node: 595.0.
- **Proof:** `gems2_verify.py` — 6/6 (Gem 11); asserted for all 48 nodes in the spatial builders.
- **Status:** VERIFIED.

### H₁₄ — every column weighs exactly 8 of 14
- **Derivation:** H₁₄ is the filed construction lifted to 14 rows: t(m) = (m & 1) | ((~m & 0b1111110) & 0x7F). Each of its columns has Hamming weight exactly 8.
- **Proof:** `h14_verify.py` — 8/8 (Gem 01).
- **Status:** VERIFIED.

### H₁₄ — minimum pair weight 2 · 0 aliases in 1,128
- **Derivation:** across all 1,128 column pairs, the minimum XOR weight is 2; no unit, column, or signed alias exists — a second, independent route to the 0-collision figure.
- **Proof:** `h14_verify.py` — 8/8.
- **Status:** VERIFIED. (Scope note: H₁₄'s decoder is pair-perfect; at signed triples it aliases — 14,280 aliases, exactly 2 × 7,140, each completing a door. The stronger v4 construction posts 0 at that gate; see the code-breaker record.)

### The never pairs, explained — 184 = 124 + 45 + 15
- **Derivation:** the door rule has two real constraints (the weight identity is redundant). For each never pair, every redistribution was enumerated: the 124 distance-1 pairs admit only self-splits; of the remaining 60, 45 fail only through the top of the window (≥ 99) and 15 only through the bottom (= 1). No other failure mode exists.
- **Proof:** `never_pairs_verify.py` — 7/7.
- **Status:** VERIFIED.

### The tollbooth — hall = sink = 134 at masks 3, 5, 9 (402 total)
- **Derivation:** the popcount-2 masks split by bit position: low-bit masks 3, 5, 9 carry 134 each (402 doors); high-bit masks 17, 33, 65 carry 155 each. Popcount classes are not hall-constant in general (pc3 spans 80/147/155; pc4 153/155; pc5 149/162; pc6 = 141).
- **Proof:** recomputed from the door list (Gem 17).
- **Status:** VERIFIED.

---

## Exhibit 02 — The Seventeen Gems

Each gem was derived from the operators, then verified by `gems2_verify.py` (6/6), `h14_verify.py` (8/8), or the engine. Proof sketches:

- **01 · H₁₄ constant weight 8** — direct column census of the construction above. VERIFIED.
- **02 · Complete difference set** — the 1,128 pair XORs take exactly 63 distinct values: every nonzero 7-bit vector with bit 0 = 0. VERIFIED.
- **03 · The 544 identity** — distance-6 doors = the 17 complementary pairs (a + b = 128) × 32 doors = 544, all Floor. VERIFIED.
- **04 · Door involution** — (a,b,c,d) ↔ (a,b,d,c) maps doors to doors with no fixed points; hence every pair's door count is even. VERIFIED.
- **05 · Sinks** — into 31 → 162; into 63 → 141; 27, 23, 15 tie at 155. VERIFIED.
- **06 · 1,785 quads** — reversibility folds doors into quadruples: 7,140 / 4 = 1,785. VERIFIED.
- **07 · Partner balance** — paired nodes carry identical door counts, 0 mismatches; the 944 door pairs form 280 partnership components. VERIFIED.
- **08 · Clean forced** — c = a & b for all 360 clean doors. VERIFIED.
- **09 · No mask exiled** — all 48 nodes serve as both sink and hallway. VERIFIED.
- **10 · The diagonal** — H₁₄'s difference set is {(x, x)}; its distance distribution (2:124, 4:282, 6:352, 8:253, 10:100, 12:17) is H₇'s doubled. VERIFIED.
- **11 · Kirchhoff** — see Exhibit 01. VERIFIED.
- **12 · W barely invertible** — see Exhibit 01. VERIFIED.
- **13 · W degeneracy 15 + 3 + 9** — see Exhibit 01. VERIFIED.
- **14 · T appearances 28,560** — see Exhibit 01. VERIFIED.
- **15 · Refused reflection** — reflection through the window's center (m → 100 − m) preserves only 3,780 of 7,140 doors (52.9%). NOT a symmetry. Status: REFUSED — recorded, not used.
- **16 · Refused rhyme** — 14,280 arises twice (triple-alias count; T-related count) by unrelated mechanisms. No identity claimed. Status: REFUSED.
- **17 · The tollbooth split** — see Exhibit 01. VERIFIED.

---

## Exhibit 03 — The Plates, Graded

- **54 of 56 checkable claims exact (96.4%)** — ten independently produced plates were graded claim by claim against recomputation (`PLATES_INGEST_2026-10-11.md`, plus pixel-level visual tests). VERIFIED as a grading of the plates.
- **"3,384 Wider"** — printed on the Fiedler plate; the verified Wider count is **3,584**, and the plate's own figures sum to 6,940 ≠ 7,140. Status: FALSE AS PRINTED.
- **"46 Odd Masks"** — same plate; the node count is **48**. Status: FALSE AS PRINTED.
- **Heatmap plate** — titled as W's adjacency; its pixels decode to the **T** family (correlation 0.709 in popcount-group order; W excluded in every ordering; diagonal decodes low, 0.122 vs 0.286 off-diagonal). Status: SWAPPED PORTRAIT — evidence about T, mislabeled.
- **Spectrum bars plate** — 48 bars decode to neither operator (vs W correlation 0.653, ratio 9.63 vs the true 2.305; vs T 0.827 against a true 6.94). Status: SCHEMATIC.
- **Attested tray** — three claims stand in the source material without a recomputation path: spectral λmin = 468/47; a Code₅₄‚₈ pipeline figure of 1.06e-14; λ2_norm = 0.642820 with K = 12I₀ − (48/47)r₀r₀ᵀ. Status: ATTESTED — named, unused by any verified figure on this menu.

---

## Exhibit 04 — The Receipts

- **Eight applications, first-named inventor Taylor Wolfe Heller (Monsters Ink LLC):** 63/988,462 (Feb 23, 2026) · 63/989,327 and 63/989,336 (Feb 24, 2026) · 64/041,875 (Apr 17, 2026) · 19/658,750 nonprovisional (Apr 27, 2026) · 64/150,688 (Sep 8, 2026) · 64/169,264 (Oct 4, 2026) · 64/170,360, the codec (Oct 6, 2026).
- **Proof:** filing receipts on record (Patent Center confirmations, fees paid: 3 × $65 in the confirmed record). Cadence: first filing Feb 23, 2026 → eight applications in 230 days.
- **Grants 0 · Office actions 0** — as of Oct 11, 2026. Printed because a ledger that hides its zeros is not a ledger.
- **Status:** VERIFIED as to filings and receipts. Patentability and strategy are counsel questions and are not addressed here.

---

## The Seal

- **Suites at exhibit:** core engine 34/34 · core full 37/37 · H₁₄ 8/8 · never pairs 7/7 · gems 6/6 · starting line ALL PASS — 92 checks plus the starting line, re-run at compilation of the complete record (`THE_CORE_COMPLETE.md`).
- **The manifold's own figures** (its on-screen deck and HUD) are generated from `core_compact.json`: nodes[48], pairs[944], never[184], spectrumW[48], midpoints 83; the system has 83 distinct pair-sums, spanning 16…184 — cross-checked against the engine before every build.

> Measure what is left over after an interaction; admit only what fits inside that leftover; otherwise refuse and record the refusal.

---

## Addendum — the living exhibits (added Oct 11, 2026)

### The Door (in-page checker)
- The exhibit page carries the filed predicate itself, ported line for line from `doors_generate.py` + `never_pairs_verify.py` into JavaScript: masks = the odd numbers 3..97; splits c = o | u, d = o | (x XOR u) for u a submask of x = a XOR b around o = a AND b; verdicts SELF / IS_1 / HIGH / EQ / OK exactly as in the Python.
- **Proof of the port:** before publication the JavaScript was run headlessly against the record — census identical on every figure: 7,140 doors, 944 door pairs, 184 never (124 self-only + 45 top-only + 15 bottom-only), piles 360 / 3,584 / 3,196, distance bins 488 / 1,696 / 2,548 / 1,864 / 544; (3,3,3,3) refused at the pair gate. The page re-runs this census in the visitor's browser on load and prints the result.
- Door classes in the checker: CLEAN when c = a AND b; FLOOR when a AND b = 1 (the two masks share only bit 0); WIDER otherwise — the generator's definitions.

### Exhibit 04 — The Refusals
- Its figures are Gems 15 and 16 and the H₁₄ triple limit, already on this menu; the room exists so the refusals hang together. The kept/refused bar (3,780 / 3,360) is drawn to scale: 3,780 / 7,140 = 52.9%.

### The Evidence (downloads)
- `core_compact.json` — the data the manifold and the map are drawn from (nodes[48], pairs[944], never[184], spectra, flow, midpoints 83).
- `doors_generate.py` — the generator: the three stated constraints, of which the weight identity is proven redundant by `never_pairs_verify.py`.
- The suites: `core_engine.py` (34/34), `h14_verify.py` (8/8), `never_pairs_verify.py` (7/7), `gems2_verify.py` (6/6). Run them; the seals are reproducible, not rhetorical.

### Exhibit 06 — The Map
- The 2D spatial measurement graph (`SPATIAL_MEASUREMENT_GRAPH_2026-10-11.html`): all 1,128 pair-lines drawn from the same `core_compact.json`; its builder asserts the totals, the two sink counts, the tollbooth, Kirchhoff at all 48, and both censuses before it renders. Its hub gearing (12:1) is a design choice of that page and is labeled as such there — it is not one of this system's figures.

