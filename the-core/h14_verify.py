#!/usr/bin/env python3
"""H14 extension verification — the Master Technical Manual's construction.

Manual claim (Master Technical Manual & Proof Ledger, 2026-10-10, sec. 2):
appending the lower block t(m) = (m & 1) | ((~m & 0b1111110) & 0x7F) to the
filed H7x48 (columns = odd masks 3..97) drops pair alias exceptions to
0/1128. This script checks exactly that, unsigned and signed:

  1. 48 columns, distinct, top block row 0 all-ones.
  2. All 1128 unordered pairs: pair-XOR popcount >= 2 (never 1).
  3. No pair XOR equals a unit vector or a column (unsigned aliasing = 0).
  4. No ordered pair difference equals +/- a unit vector or +/- a column
     (signed aliasing = 0).
  5. Mechanism: bottom-block XOR difference equals top-block difference,
     so every pair popcount doubles vs H7 (H7 min was 1 -> H14 min is 2).
  6. Constant weight: every H14 column has weight exactly 8 (of 14),
     because pc(t(m)) = 8 - pc(m). Derived 2026-10-11; not stated in the manual.

Verified 2026-10-11. A second route to 0/1128, independent of the v4
Sidon construction in ~/workspace/your_files/quadfault/.
"""

MASKS = list(range(3, 98, 2))  # 48 odd masks 3..97


def lower(m: int) -> int:
    return (m & 1) | ((~m & 0b1111110) & 0x7F)


def bits7(v: int):
    return [(v >> k) & 1 for k in range(7)]


def main() -> None:
    checks = 0

    def ok(cond: bool, label: str) -> None:
        nonlocal checks
        assert cond, f"FAIL: {label}"
        checks += 1
        print(f"  ok: {label}")

    cols = [(m, lower(m)) for m in MASKS]
    ok(len(cols) == 48 and len(set(cols)) == 48, "48 distinct columns")
    ok(all(m & 1 == 1 for m, _ in cols), "row 0 (bit 0) all-ones in top block")

    colset = set(cols)
    min_pc = 99
    unit_alias = col_alias = 0
    mech = True
    for i in range(48):
        for j in range(i + 1, 48):
            xt = cols[i][0] ^ cols[j][0]
            xb = cols[i][1] ^ cols[j][1]
            if xt != xb:
                mech = False
            pc = bin(xt).count("1") + bin(xb).count("1")
            min_pc = min(min_pc, pc)
            if pc == 1:
                unit_alias += 1
            if (xt, xb) in colset:
                col_alias += 1
    ok(min_pc == 2, f"min pair-XOR popcount is 2 (got {min_pc})")
    ok(unit_alias == 0, "0/1128 unit aliases (unsigned)")
    ok(col_alias == 0, "0/1128 column aliases (unsigned)")
    ok(mech, "bottom XOR difference == top XOR difference for all pairs")

    weights = {sum(bits7(m)) + sum(bits7(t)) for m, t in cols}
    ok(weights == {8}, f"every column has weight exactly 8 (got {sorted(weights)})")

    vecs = [bits7(m) + bits7(t) for m, t in cols]
    targets = set()
    for k in range(14):
        u = tuple(1 if i == k else 0 for i in range(14))
        targets.add(u)
        targets.add(tuple(-x for x in u))
    for v in vecs:
        targets.add(tuple(v))
        targets.add(tuple(-x for x in v))
    signed_alias = 0
    for i in range(48):
        for j in range(48):
            if i == j:
                continue
            d = tuple(vecs[i][k] - vecs[j][k] for k in range(14))
            if d in targets:
                signed_alias += 1
    ok(signed_alias == 0, "0 signed pair-difference aliases")

    print(f"\nH14 VERIFY: {checks}/{checks} checks PASS — manual claim holds, 0/1128.")


if __name__ == "__main__":
    main()
