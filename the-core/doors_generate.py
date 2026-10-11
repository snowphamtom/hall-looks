#!/usr/bin/env python3
"""
DOORS — full generation code for the 7,140-door merge map.

Source: the FILED 7x48 codec matrix (64/170,360) = odd masks 3..97.
A "door" is two nodes (a,b) merging via a collapsed hallway (c) into (d).

Three constraints, all necessary:
  1. Value identity:  a + b - c = d   (d must be a mask value, all four distinct)
  2. Weight identity: |a| + |b| - |c| = |d|   (popcounts of the 7-bit masks)
  3. XOR preservation: (a ^ b) == (c ^ d)     (the difference pattern survives the collapse)

These three generate EXACTLY 7,140 doors — verified cell-for-cell against the
reference workbook (doors_only_extensive.xlsx, All_7140).

Each door also carries:
  Sa..Sd        = set-bit positions of a,b,c,d
  overlap_a_b   = Sa & Sb
  clean         = (Sc == overlap)          # 360 doors: the collapsed set IS the overlap
  floor         = overlap == {0}           # 3,196 doors
  distance      = Hamming(a,b)             # bins 2..6: 488/1696/2548/1864/544
  indices       = column indices of a,b,c,d in the mask list
"""

MASKS = [m for m in range(3, 98) if m % 2 == 1]   # filed 7x48 columns
MSET = set(MASKS)
MIDX = {m: i for i, m in enumerate(MASKS)}

def bits(n):
    return {b for b in range(7) if (n >> b) & 1}

def ham(a, b):
    return bin(a ^ b).count("1")

def generate_doors():
    """Return the list of (a, b, c, d) door tuples. a < b (canonical pair order)."""
    doors = []
    for i in range(48):
        for j in range(i + 1, 48):
            a, b = MASKS[i], MASKS[j]
            xab = a ^ b
            wa, wb = len(bits(a)), len(bits(b))
            for k in range(48):
                if k == i or k == j:
                    continue
                c = MASKS[k]
                d = a + b - c
                if d not in MSET or d in (a, b, c):
                    continue
                if wa + wb - len(bits(c)) != len(bits(d)):
                    continue
                if xab != (c ^ d):
                    continue
                doors.append((a, b, c, d))
    return doors

def door_record(a, b, c, d):
    Sa, Sb, Sc, Sd = bits(a), bits(b), bits(c), bits(d)
    ov = Sa & Sb
    return {
        "merge": [a, b],
        "via_collapsed": c,
        "into": d,
        "operation": f"{a}+{b}-{c}={d}",
        "Sa": sorted(Sa), "Sb": sorted(Sb), "Sc": sorted(Sc), "Sd": sorted(Sd),
        "overlap_a_b": sorted(ov),
        "overlap_is_collapsed": Sc == ov,
        "distance_a_b": ham(a, b),
        "indices": {"a": MIDX[a], "b": MIDX[b], "c": MIDX[c], "d": MIDX[d]},
    }

def build_workbook(path):
    """Write the full doors workbook (All_7140 + per-distance sheets)."""
    import openpyxl
    doors = generate_doors()
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "All_7140"
    hdr = ["merge", "via_collapsed", "into", "operation", "Sa", "Sb", "Sc", "Sd",
           "overlap_a_b", "overlap_is_collapsed", "distance_a_b", "indices"]
    ws.append(hdr)
    bydist = {}
    for a, b, c, d in doors:
        r = door_record(a, b, c, d)
        ws.append([str(r["merge"]), r["via_collapsed"], r["into"], r["operation"],
                   str(r["Sa"]), str(r["Sb"]), str(r["Sc"]), str(r["Sd"]),
                   str(r["overlap_a_b"]), r["overlap_is_collapsed"],
                   r["distance_a_b"], str(r["indices"])])
        bydist.setdefault(r["distance_a_b"], []).append(r)
    for dist in sorted(bydist):
        s = wb.create_sheet(f"dist_{dist}")
        s.append(hdr)
        for r in bydist[dist]:
            s.append([str(r["merge"]), r["via_collapsed"], r["into"], r["operation"],
                      str(r["Sa"]), str(r["Sb"]), str(r["Sc"]), str(r["Sd"]),
                      str(r["overlap_a_b"]), r["overlap_is_collapsed"],
                      r["distance_a_b"], str(r["indices"])])
    wb.save(path)
    return len(doors)

if __name__ == "__main__":
    import sys
    n = build_workbook(sys.argv[1] if len(sys.argv) > 1 else "doors_generated.xlsx")
    print(f"doors written: {n}")
