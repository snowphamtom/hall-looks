#!/usr/bin/env python3
"""Why 184 pairs never form doors — the partition 944 + 124 + 60 explained.

Algebra: value + XOR force c + d = a + b and c & d = a & b, so every door
candidate is a redistribution of the differing bits x = a ^ b around the
shared part o = a & b:  c = o | u,  d = o | (x ^ u),  u any submask of x.
(The weight identity is implied by value + XOR; checked below.)

Checks:
  1. Weight identity holds automatically wherever value + XOR hold.
  2. The 124 distance-1 pairs: x has one bit, so only 2 splits exist and
     both are self-splits (c in {a, b}). No door is combinatorially possible.
  3. The other 60 never-pairs: splits exist, but every non-self split exits
     the mask window [3, 97] -- 45 pairs fail only through the top (c or d
     >= 99), 15 only through the bottom (c or d == 1). No other failure mode.
  4. The 944 door pairs each have at least one split landing inside.

Derived 2026-10-11. Closes the open residual in ABSORPTION_2026-10-11.md.
"""

import sys
sys.path.insert(0, ".")
from doors_generate import MASKS, bits, generate_doors  # noqa: E402

MSET = set(MASKS)


def ham(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def splits(a: int, b: int):
    """Yield (c, d) for every submask split of x = a^b around o = a&b."""
    o, x = a & b, a ^ b
    u = x
    while True:
        yield o | u, o | (x ^ u)
        if u == 0:
            return
        u = (u - 1) & x


def verdict(a: int, b: int, c: int, d: int) -> str:
    if c in (a, b) or d in (a, b):
        return "SELF"
    if c == 1 or d == 1:
        return "IS_1"
    if c not in MSET or d not in MSET:
        return "HIGH"
    if c == d:
        return "EQ"
    return "OK"


def main() -> None:
    checks = 0

    def ok(cond: bool, label: str) -> None:
        nonlocal checks
        assert cond, f"FAIL: {label}"
        checks += 1
        print(f"  ok: {label}")

    # 1. weight identity is redundant
    redundant = True
    for a in MASKS:
        for b in MASKS:
            if b <= a:
                continue
            for c in MASKS:
                if c in (a, b):
                    continue
                d = a + b - c
                if d in MSET and d not in (a, b, c) and (a ^ b) == (c ^ d):
                    if len(bits(a)) + len(bits(b)) - len(bits(c)) != len(bits(d)):
                        redundant = False
    ok(redundant, "weight identity implied by value + XOR (redundant constraint)")

    door_pairs = {(t[0], t[1]) for t in generate_doors()}
    all_pairs = [(MASKS[i], MASKS[j]) for i in range(48) for j in range(i + 1, 48)]
    never = [p for p in all_pairs if p not in door_pairs]
    ok(len(never) == 184, f"184 never-pairs (got {len(never)})")

    # 2. distance-1 pairs: only self-splits exist
    d1 = [p for p in never if ham(*p) == 1]
    ok(len(d1) == 124, "124 of the never-pairs are distance-1")
    ok(all(all(verdict(a, b, c, d) == "SELF" for c, d in splits(a, b)) for a, b in d1),
       "every split of a distance-1 pair is a self-split")

    # 3. the 60: every non-self split exits the window, by exactly one edge
    rest = [p for p in never if ham(*p) != 1]
    ok(len(rest) == 60, f"60 remaining never-pairs (got {len(rest)})")
    top = bottom = 0
    pure = True
    for a, b in rest:
        vs = {verdict(a, b, c, d) for c, d in splits(a, b)} - {"SELF"}
        if vs == {"HIGH"}:
            top += 1
        elif vs == {"IS_1"}:
            bottom += 1
        else:
            pure = False
    ok(pure and top == 45 and bottom == 15,
       f"60 = 45 killed only by the top edge (>=99) + 15 only by the bottom (=1); got {top}/{bottom}")

    # 4. every door pair has an inside split
    ok(all(any(verdict(a, b, c, d) == "OK" for c, d in splits(a, b)) for a, b in door_pairs),
       "all 944 door pairs have at least one split inside the window")

    print(f"\nNEVER-PAIR VERIFY: {checks}/{checks} PASS — residual closed.")


if __name__ == "__main__":
    main()
