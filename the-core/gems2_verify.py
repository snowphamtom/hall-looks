#!/usr/bin/env python3
"""GEMS II — derived 2026-10-11 from the incorporations (operators + flow).

Each check is a fact nowhere stated in the source documents, computed
from the verified interior. Negatives are recorded with the positives:
a refused candidate is a result too.
"""
import itertools
from collections import Counter

import numpy as np

NODES = list(range(3, 98, 2))
MSET = set(NODES)
CHECKS = 0


def ok(cond, label):
    global CHECKS
    assert cond, f"FAIL: {label}"
    CHECKS += 1
    print(f"  ok {CHECKS:2d}: {label}")


def pc(x):
    return bin(x).count("1")


def splits(a, b):
    o, x = a & b, a ^ b
    u = x
    while True:
        yield o | u, o | (x ^ u)
        if u == 0:
            return
        u = (u - 1) & x


D = set()
for a, b in itertools.combinations(NODES, 2):
    for c, d in splits(a, b):
        if c in (a, b) or d in (a, b) or c == d:
            continue
        if c in MSET and d in MSET:
            D.add((a, b, c, d))

print("== Gems II ==")
hall = Counter(c for _, _, c, _ in D)
sink = Counter(d for *_, d in D)
pairm = Counter()
for a, b, _, _ in D:
    pairm[a] += 1
    pairm[b] += 1
ok(all(hall[m] == sink[m] for m in NODES),
   "Kirchhoff for doors: hallway count == sink count at every one of the 48 nodes")
ok(all(pairm[m] == hall[m] + sink[m] for m in NODES),
   "pair membership = through + in at every node (31: 324 = 162 + 162)")

idx = {m: i for i, m in enumerate(NODES)}
W = np.zeros((48, 48))
for (a, b), n in Counter((a, b) for a, b, _, _ in D).items():
    W[idx[a], idx[b]] = W[idx[b], idx[a]] = n
ev = np.linalg.eigvalsh(W)
ok(float(np.min(np.abs(ev))) > 0.05 and float(np.prod(np.sign(ev))) < 0,
   "the door operator W is invertible (smallest |lambda| ~0.059) with negative determinant")
mults = Counter(Counter(np.round(ev, 3).tolist()).values())
ok(mults == Counter({1: 15, 2: 3, 3: 9}),
   "W degeneracy pattern: 27 distinct eigenvalues = 15 simple + 3 double + 9 triple")

T = np.zeros((48, 48))
for a, b, c, d in D:
    i, j, ci, di = idx[a], idx[b], idx[c], idx[d]
    T[i, ci] += 1
    T[j, di] += 1
    T[ci, i] += 1
    T[di, j] += 1
ok(int(T.sum()) == 28560 and int(T[idx[31]].sum()) == 648,
   "transition operator: 28,560 total appearances = 4 x 7,140; node 31 busiest at 648")

phi = lambda m: 100 - m
canon = lambda x, y: (x, y) if NODES.index(x) < NODES.index(y) else (y, x)
kept = 0
for a, b, c, d in D:
    pa, pb = canon(phi(a), phi(b))
    if (pa, pb, phi(c), phi(d)) in D or (pa, pb, phi(d), phi(c)) in D:
        kept += 1
ok(kept == 3780, "REFUSED candidate: window-center reflection 100-m keeps only 3,780/7,140 doors — not a symmetry")

print(f"\nGEMS II SEAL: {CHECKS}/{CHECKS} pass. (One candidate was refused and is recorded as such.)")
