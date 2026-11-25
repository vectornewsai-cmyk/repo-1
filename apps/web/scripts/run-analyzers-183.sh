#!/bin/bash
# run-analyzers-183.sh — chay NGOAI cua so attempt (quyet (p) dot 179, F-179-T4-5).
#   Poller goi SAU KHI run-attempt-183.sh thoat (trap EXIT da ghi
#   attempt-done-$TAG = cua so attempt da dong), TRUOC eval_attempt.
#   Lam: check-classb (lop B) + 9 analyzer + kiem coverage (c2).
#   - 3 analyzer ghi-file (skiplatest/labellag/lag5) duoc truyen argv[2]
#     TUONG MINH tro toi $W/analyze-t4-$TAG-*.txt — KHONG de outpath mac dinh
#     (skiplatest mac dinh round109-k7/analyze-k7-skiplatest.txt: chinh file
#     ghi nhe 18:13:20Z trong cua so attempt dot 179; labellag/lag5 mac dinh
#     tuong doi theo CWD). 3 file nay KHONG redirect stdout nua (outpath file
#     CHINH LA ban ghi; stdout cua chung chay vao chain-t4.log qua poller tee).
#   - Cac analyzer chi-in-stdout giu redirect nhu cu.
# Dung: run-analyzers-183.sh <TAG> <RC-run-attempt>  (chi goi tu poll-wait-t4-183.sh)
# Thoat: 10 neu coverage 0/N (giong run-attempt cu); neu khong co JSON thi
#   tra RC-run-attempt; con lai tra RC-run-attempt (0 = probe 20/20).
set -u
TAG="${1:-attempt1}"
RC1="${2:-1}"
W=~/workspace/goals/capcut-clone-video-editor/hidden_files/round183-t4
BOOT_START=$(uptime -s 2>/dev/null || echo ?)
echo "== T4 analyzers $TAG (NGOAI cua so attempt, quyet-p-dot-179) start $(date -u +%FT%TZ) rc-run-attempt=$RC1"
# Lop B: chay o day (ngoai cua so), doc ps-after + sampler do inner ghi.
bash "$W/check-classb-t4.sh" "$TAG" "$BOOT_START" 2>&1
# F-147-T4-3 (dot 150): nhan analyzer theo attempt that.
ATTNUM=$(echo "$TAG" | sed -E 's/^attempt([0-9]+)-.*/\1/')
JSON="$W/preview-b-f3-flip-webkit-t4-$TAG.json"
if [ ! -f "$JSON" ]; then
  echo "KHONG CO JSON $JSON — probe khong ghi duoc file (exit=$RC1)"
  exit "$RC1"
fi
echo "== analyzer $TAG $(date -u +%FT%TZ) json=$(stat -c%s "$JSON")B"
python3 "$W/analyze-t4-c2drawlog.py" "$JSON" > "$W/analyze-t4-$TAG-c2drawlog.txt" 2>&1
python3 "$W/analyze-t4-labellag.py" "$JSON" "$W/analyze-t4-$TAG-labellag.txt" 2>&1
python3 "$W/analyze-t4-skiplatest.py" "$JSON" "$W/analyze-t4-$TAG-skiplatest.txt" 2>&1
python3 "$W/analyze-t4-lag5.py" "$JSON" "$W/analyze-t4-$TAG-lag5.txt" 2>&1
python3 "$W/analyze-t4-tickcost.py" "T4-183a${ATTNUM}=$JSON" > "$W/analyze-t4-$TAG-tickcost.txt" 2>&1
python3 "$W/analyze-t4-wallbands.py" "T4-183a${ATTNUM}=$JSON" > "$W/analyze-t4-$TAG-wallbands.txt" 2>&1
# Dot 138 (quyet parent dot 137 §12.3(c)): tickCost + load1/RAM theo tung pass.
python3 "$W/analyze-t4-perpass.py" "$JSON" "$W/run-webkit-t4-$TAG.log" "$W/load-mid-t4-$TAG.log" > "$W/analyze-t4-$TAG-perpass.txt" 2>&1
# (c2) seqs tu labellag muc skippedLatest=0, dong "(c2) dang ngo that, tat ca (...)".
# Trich seq = so dau cua moi tuple (seq, presented, label, lag).
SEQS=$(grep -o '(c2) dang ngo that, tat ca.*' "$W/analyze-t4-$TAG-labellag.txt" | grep -oE '\([0-9]+,' | tr -d '(,' | paste -sd, -)
echo "c2seqs=[$SEQS]"
if [ -n "$SEQS" ]; then
  python3 "$W/analyze-t4-c2coverage.py" "$JSON" "$SEQS" > "$W/analyze-t4-$TAG-c2coverage.txt" 2>&1
  # Dot 138 (DEF v0.5 prereg): kiem P3' stall-based tren cung seq (c2).
  python3 "$W/analyze-t4-stall.py" "$JSON" "$SEQS" > "$W/analyze-t4-$TAG-stall.txt" 2>&1
else
  echo "(c2)=0 — khong co seq de kiem coverage" > "$W/analyze-t4-$TAG-c2coverage.txt"
  python3 "$W/analyze-t4-stall.py" "$JSON" "" > "$W/analyze-t4-$TAG-stall.txt" 2>&1
fi
# Kiem cua so log NGAY (quyet parent dot 131).
COV=$(grep -oE 'TONG: \(c2\) trong cua so log: [0-9]+/[0-9]+' "$W/analyze-t4-$TAG-c2coverage.txt" | grep -oE '[0-9]+/[0-9]+$' | head -1)
echo "COVERAGE-CHECK $TAG $(date -u +%FT%TZ): $COV" | tee -a "$W/coverage-check-$TAG.txt"
cat "$W/analyze-t4-$TAG-c2coverage.txt" >> "$W/coverage-check-$TAG.txt"
if echo "$COV" | grep -q '^0/'; then
  echo "COVERAGE 0/N — log draw KHONG phu post-flip; KHONG tu sua probe; cho agent quyet dieu chinh re-arm (marker COVERAGE-0)"
  touch "$W/COVERAGE-0-$TAG"
  exit 10
fi
echo "== T4 analyzers $TAG done $(date -u +%FT%TZ) (tra rc-run-attempt=$RC1)"
exit "$RC1"
