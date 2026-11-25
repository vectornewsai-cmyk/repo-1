#!/usr/bin/env python3
"""T4-178 distinct-seq — HELPER DA VA (quyet parent (t) dot 162; F-162-T4-3).
Doc SO distinct-seq (distinct-seq-ledger.json) thay vi cong thang co so
nhu cac ban 154-162 (chi cong seq moi, khong tru seq cu — sai 3 dot
lien tiep: 160 in 64/67 dung 63/66; 161 in 64/67 dung 63/66; 162 in
71/74 dung 67/71 — xem LIMITS 166 F-166-T4-3).
Co so: P3' chi dem cac luot hop le thuoc ky stall (dot 139 tro di,
DEF v0.5 prereg cho 138+). So ghi union (c2)/DAT + occurrence cong don
den dot 162: distinct THAT 67/71, occ 72/80 (xay bang
build-distinct-seq-ledger.py tu file stall/c2coverage goc).
Dung: distinct-seq-178.py <stall-output.txt> [c2coverage.txt]
  [--ledger PATH] [--out-ledger PATH]
  stall-output: file analyze-t4-<TAG>-stall.txt (1 dong/seq, stall_truoc).
  c2coverage (tuy chon): file analyze-t4-<TAG>-c2coverage.txt — de dem
  occurrence (co seq lap trong luot); neu khong co, occurrence lay theo
  so dong stall (= distinct, co the thieu occ lap — ghi ro).
In ra: distinct/occurrence luot nay + cong don MOI (doc tu so).
Ghi so MOI de xuat vao <out-ledger> (mac dinh:
distinct-seq-ledger-177-proposed.json canh ledger) — KHONG sua ledger
goc tai cho; T4 kiem tra roi moi thang cap so cho dot sau.
"""
import re, sys, os, json, argparse

ap = argparse.ArgumentParser()
ap.add_argument('stall')
ap.add_argument('c2coverage', nargs='?')
ap.add_argument('--ledger', default=None)
ap.add_argument('--out-ledger', default=None)
ap.add_argument('--round', type=int, default=178)
ap.add_argument('--attempt', default='')
a = ap.parse_args()

W = os.path.dirname(os.path.abspath(__file__))
ledger_path = a.ledger or os.path.join(W, 'distinct-seq-ledger.json')
ledger = json.load(open(ledger_path))
seen_c2 = set(ledger['seen_c2'])
seen_dat = set(ledger['seen_dat'])

txt = open(a.stall, encoding='utf-8', errors='replace').read()
rows = re.findall(r'seq (\d+): .*?stall_truoc=(\d+)', txt)
seqs = {}
for s, st in rows:
    seqs[int(s)] = int(st)
dat = sorted(s for s, st in seqs.items() if st >= 2)
if a.c2coverage:
    ctxt = open(a.c2coverage, encoding='utf-8', errors='replace').read()
    occ_list = [int(s) for s in re.findall(r'\(c2\) seq (\d+):', ctxt)]
    occ_note = 'tu c2coverage'
else:
    occ_list = sorted(seqs.keys())
    occ_note = 'theo dong stall (= distinct; co the thieu occ lap)'
dat_occ = [s for s in occ_list if seqs.get(s, 0) >= 2]

new_c2 = sorted(set(seqs) - seen_c2)
new_dat = sorted(set(dat) - seen_dat)
cum_dat = len(seen_dat) + len(new_dat)
cum_tot = len(seen_c2) + len(new_c2)
cum_occ_dat = ledger['occ_dat'] + len(dat_occ)
cum_occ_tot = ledger['occ_total'] + len(occ_list)

print(f"distinct-seq P3' (doc so, co so dot {ledger['as_of_round']}: "
      f"{len(seen_dat)}/{len(seen_c2)} distinct, occ {ledger['occ_dat']}/{ledger['occ_total']}):")
print(f"  luot nay: {len(dat)}/{len(seqs)} DAT — seq DAT: {dat}; "
      f"seq KHONG DAT: {sorted(set(seqs) - set(dat))}")
print(f"  stall theo seq: {dict(sorted(seqs.items()))}")
print(f"  seq MOI (chua co trong so): DAT {new_dat}; tong {new_c2}")
print(f"  seq DA THAY (trong so, khong cong them): "
      f"DAT {sorted(set(dat) & seen_dat)}; tong {sorted(set(seqs) & seen_c2)}")
print(f"  cong don MOI distinct-seq: {cum_dat}/{cum_tot}")
print(f"  cong don MOI occurrence: {cum_occ_dat}/{cum_occ_tot} "
      f"(occ luot nay {len(dat_occ)}/{len(occ_list)} {occ_note})")

new_ledger = dict(ledger)
new_ledger['as_of_round'] = a.round
new_ledger['seen_c2'] = sorted(seen_c2 | set(seqs))
new_ledger['seen_dat'] = sorted(seen_dat | set(dat))
new_ledger['occ_dat'] = cum_occ_dat
new_ledger['occ_total'] = cum_occ_tot
new_ledger['non_dat_in_union'] = sorted(set(new_ledger['seen_c2']) - set(new_ledger['seen_dat']))
new_ledger['valid_rounds_p3'] = ledger['valid_rounds_p3'] + 1
pr = dict(ledger.get('per_round', {}))
pr[str(a.round)] = {'attempt': a.attempt, 'c2': sorted(seqs), 'dat': dat,
                    'occ': occ_list, 'occ_dat': len(dat_occ),
                    'new_c2': new_c2, 'new_dat': new_dat,
                    'cum_after': [cum_dat, cum_tot],
                    'cum_occ_after': [cum_occ_dat, cum_occ_tot]}
new_ledger['per_round'] = pr
out_path = a.out_ledger or os.path.join(
    os.path.dirname(ledger_path),
    f"distinct-seq-ledger-{a.round}-proposed.json")
json.dump(new_ledger, open(out_path, 'w'), indent=1)
print(f"  so MOI de xuat da ghi: {out_path} (ledger goc KHONG doi)")
