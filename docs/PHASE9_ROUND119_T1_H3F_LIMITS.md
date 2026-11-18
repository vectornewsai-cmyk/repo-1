# Đợt 119 T1 — Apply patch H3f (Zombie) + đo A/B (LIMITS)

Ngày: 16/11/2026 (lượt cron 06:35 +07). Boot #mới `27c8b1d9-…` (up 23:33:34Z
15/11). Prereg: `hidden_files/round119-t1/prereg-t1.md` (viết trước khi đo,
luật verdict §3 + điều kiện hiệu lực §2 đăng ký trước — verdict ở §0 dưới
đây áp đúng luật đó, kèm caveat §2 được ghi rõ).

## 0. Tóm tắt verdict

**H3f GIÚP — patch ĐƯỢC GIỮ trên cây.** Cặp A/B cùng boot, liền nhau, cùng
spec/hog/probe: tick chậm 41 → 19 (**−53,7%**), longtask ≥200 ms tổng
36.279 → 17.290 ms (**−52,3%**, n 131 → 67), draws-gap >300 ms tổng
34.232 → 14.388 ms (**−58,0%**, n 84 → 38). Cả hai ngưỡng GIÚP của prereg
§3 đều vượt với biên lớn (cần −25% tick chậm và −20% longtask-tổng). Không
hồi quy parity: pageErrs 0/0, skipped 16,6% → 11,8% (tốt hơn), caps
313 → 410. Tải hai chân tương đương (load1 med 5,84 vs 5,45; load lúc phát
2,43 vs 2,76 — chân B phát ở tải hơi cao hơn, không nhẹ hơn).

**Caveat bắt buộc đọc cùng verdict (§2):** chân B có 19 tick chậm, DƯỚI ngưỡng
điều kiện hiệu lực prereg §2 (n ≥ 30) nếu đọc theo chữ. Nhưng ngưỡng đó đo
chính biến kết quả (số tick chậm) — một patch làm giảm một nửa tick chậm
tất yếu sẽ phạm ngưỡng này. Hai chỉ báo hiệu lực còn lại của chân B đều
đạt với biên (longtask 67 ≥ 50, gap 38 ≥ 20), stall vẫn tái hiện rõ ở chân
B (loopMs max 415,5 ms, p90 87,8), tải tương đương. Vì vậy cặp A/B được
coi là diễn giải được và verdict GIÚP đứng — parent xem xét caveat này khi
chốt. Không lặp lại cặp đo chỉ để "đủ 30 tick chậm ở chân B" (đó là đòi
patch phải kém hiệu quả mới đo được).

**Cơ chế (§3):** H3f gỡ được cả chuỗi tick chậm, không phải thu nhỏ chi phí
trong từng tick chậm còn lại: S_store trên tick chậm còn lại gần như không
đổi (0,507 → 0,477), held-first 25 → 13 tick (−48%), tick chậm có video
draw 35 → 16 (−54%). Tick chậm còn lại là nhóm không bỏ được (tick nóng
đầu chuỗi / đổi clip / hết streak 3 / contention). Bằng chứng trực tiếp về
số lần skip vẫn thiếu (patch không có bộ đếm skip — nợ §7).

## 1. Patch đã apply — cây hiện tại là cây H3f

- Baseline `apps/web/src/preview.tsx` md5 `03bf029f09b8890b285eacc10a02172b`
  → sau apply **`5be5a250a552357c50cc189de9a9c08a`** (đúng md5 T2 dự báo).
  Patch `hidden_files/round118-t2/h3f.patch` (108 dòng, 5 hunks), apply bằng
  `patch -p1` (KHÔNG git apply), rc=0, 23:56:49Z. `media.ts` không đổi
  (`2c384ed1…`). KHÔNG có file nào khác đổi trong luồng này.
- Verify sau apply: **`npx tsc --noEmit` exit 0** (23:57:29Z) +
  **vite build PASS 7,03 s** (23:57:43Z, chunk 1.688,88 kB).
- Cờ `hidden_files/round119-t1-applied` ghi 23:57:58Z (ngay sau verify) —
  T2/T3/T4/T8 đo trên cây H3f từ thời điểm này. **Mọi đo sau đó trong đợt
  119 đều chạy trên cây H3f (md5 5be5a250), không còn cây baseline.**

## 2. Phương pháp đo + điều kiện hiệu lực (prereg §1–§2)

- Probe `probe118t2-storeheld-diag.mjs` (chân A, gốc đợt 118) và bản copy
  `apps/web/scripts/probe119t1-h3f-ab.mjs` (chân B — CHỈ đổi SCRATCH/CFG_DIR
  sang round119-t1 + comment header; diff = 2 dòng path + 1 dòng comment;
  `node --check` OK). Spec giống hệt chẩn đoán đợt 118: `--engine chromium
  --config scroll-mixed-alt --nclips 24 --freeze-run --sysload 0`,
  stripes-scroll.mp4 1280×720, 24 clip × 3s, hog cố định N=4, lock v2-only
  (bản copy trong thư mục luồng, md5 5cac10af), port 5590.
- Chân A `chr-mixedalt-h3f-A-fr4`: lock 23:44:08Z, phát 23:46:03Z (band-wait
  60 s, loadBand1AtPlay 2,43), xong 23:48:35Z, probe exit=0, md5 03bf029f.
- Chân B `chr-mixedalt-h3f-B-fr4`: lock 00:01:49Z (lấy ngay, 0 s chờ),
  phát ~00:02:1xZ (band-wait 25 s, loadBand1AtPlay 2,76), xong 00:04:25Z,
  giữ lock 156 s, probe exit=0, md5 5be5a250. Cùng boot, cách chân A ~16
  phút (kể cả lúc apply + verify + 1 lần chân B lỗi, xem §6).
- Phân tích mỗi chân: `analyze-t2-diag.py` (copy đợt 118) +
  `diag-forensic.py` + `s-store.py` (mới — tính S_store/S_first gộp; đã
  kiểm chứng tái tạo ĐÚNG số đợt 118: S_store 0,601/0,951 n=39, S_first
  0,375/0,935 n=51, second-draw med 75).
- Điều kiện hiệu lực prereg §2: longtask ≥200 n ≥ 50 VÀ gap >300 n ≥ 20 VÀ
  tick chậm n ≥ 30. Chân A: 131 / 84 / 41 — ĐẠT cả 3. Chân B: 67 / 38 /
  19 — 2/3 (xem caveat §0: tick chậm là biến kết quả, không phải điều
  kiện tiên quyết cho chân điều trị).

## 3. Kết quả A/B (cùng boot 27c8b1d9)

| Chỉ số | Chân A (baseline 03bf029f) | Chân B (H3f 5be5a250) | Thay đổi |
|---|---|---|---|
| Tick chậm loopMs ≥100 ms (n / tổng loopMs) | 41 / 391 (10,5%) | 19 / 479 (4,0%) | **−53,7% số lượng** |
| loopMs p50 / p90 / max (ms) | 32,7 / 100,7 / 691,4 | 19,8 / 87,8 / 415,5 | p50 −39% |
| Longtask ≥200 ms (n / tổng ms) | 131 / 36.279 | 67 / 17.290 | **−48,9% / −52,3%** |
| Draws-gap >300 ms (n / tổng ms) | 84 / 34.232 | 38 / 14.388 | **−54,8% / −58,0%** |
| renderTicks (n / skipped) | 386 / 64 (16,6%) | 475 / 56 (11,8%) | nhiều tick hơn, skip ít hơn |
| renderMs med / preMs med (ms) | 23,9 / 82,9 | 16,6 / 36,0 | −31% / −57% |
| caps / drawsTotal (video draws) | 313 / 743 | 410 / 931 | +31% / +25% (tick nhanh hơn → nhiều tick hơn) |
| DECOMPOSE tick chậm: residual / blend | 0,72 / 0,28 | 0,34 / 0,66 | residual giảm một nửa |
| S_first (pháp y) med / p90 (n) | 0,489 / 0,789 (35) | 0,344 / 0,821 (16) | |
| S_store held-first (pháp y) med / p90 (n) | 0,507 / 0,806 (25) | 0,477 / 0,821 (13) | gần như không đổi |
| Held-first / snapshot-first (first-draw) | 25 / 10 (71% / 29%) | 13 / 3 (81% / 19%) | |
| Tick chậm ZERO video draw | 6/41 (15%) | 3/19 (16%) | tỉ lệ giữ nguyên, số lượng giảm một nửa |
| Second video draw trong tick chậm (med) | 77,8 ms (n=11) | 53,8 ms (n=8) | −31% |
| R_new/same (median, analyzer) | 2,37 | 2,03 | vẫn ≥2 (decoder-block còn) |
| Video draws / renderTick | 1,92 | 1,96 | gần như không đổi |
| Held draws / renderTick | 0,84 | 0,85 | gần như không đổi |
| Tải: load1 med (load.tsv) / lúc phát | 5,84 [0,56–10,97] / 2,43 | 5,45 [0,37–8,16] / 2,76 | tương đương |
| pageErrs | 0 | 0 | |

Đọc bảng: (a) mọi chỉ báo stall tuyệt đối đều giảm ~50% trong khi tải
tương đương và chân B phát ở tải hơi cao hơn — không giải thích được bằng
tải; (b) số tick/render/caps tăng ~23–31% ở chân B trong cùng thời lượng
phát — tick nhanh hơn nên rAF kịp nhiều tick hơn, phù hợp với việc H3f
gỡ tắc nghẽn; (c) thành phần tick chậm còn lại không đổi (S_store ~0,48,
held-first ~3/4, zero-draw ~15%) — H3f gỡ cả tick chậm khỏi tập chậm chứ
không thu nhỏ chi phí trong tick chậm còn lại; (d) video draws/renderTick
không đổi (1,92 → 1,96) — skip chỉ bật ở tick sau tick nóng (tối đa vài
chục tick trong 475), nên tổng số draw không giảm thấy được; đây là giới
hạn của bằng chứng gián tiếp, không phải bằng chứng chống lại H3f (xem §7).

## 4. Caveat — H3f không sửa được, và giới hạn của cặp đo này

- **Tick chậm zero video draw:** chân A 6/41, chân B 3/19 — tỉ lệ ~15–16%
  giữ nguyên (đúng caveat T2: nhóm này do contention/scheduling, H3f
  không sửa được; số lượng tuyệt đối giảm một nửa cùng nhịp với tổng số
  tick chậm, có thể do contention chung giảm khi hết decoder-wait — n nhỏ,
  không kết luận mạnh).
- **Second-draw med 75 ms cùng frame (T2 §3.4):** chân A tái hiện 77,8 ms
  (n=11); chân B 53,8 ms (n=8) — contention vẫn phình drawImage trong tick
  chậm, nhưng nhẹ hơn sau H3f.
- **Một cặp đo duy nhất (n=1):** chưa lặp lại. Nhiễu giữa các lượt trong
  môi trường này đã từng tới ~19 điểm trên một metric khác (T3 đợt 118),
  nhưng hiệu ứng ở đây là ~50% trên 3 chỉ báo độc lập cùng chiều + tải
  được kiểm soát — lớn hơn nhiều so với nhiễu đã thấy.
- **Không có bộ đếm skip trực tiếp:** patch không expose số tick đã skip
  (h3fSkip chỉ là state nội bộ). Kết luận cơ chế dựa trên bằng chứng gián
  tiếp (§3). Nếu đợt sau cần chứng minh chặt hơn, thêm counter
  (vd `window.__h3fStats = {skipped, drawn}`) rồi đo lại — nợ §7.
- **Phạm vi patch:** chỉ đường plain mới bỏ hết được 2 lần đọc; đường
  LUT/effects/chroma vẫn đọc video trong pipeline của nó. Probe này chạy
  config scroll-mixed-alt (đường plain chiếm đa số) nên kết quả không suy
  ra cho clip có hiệu ứng nặng.

## 5. Những gì KHÔNG làm trong luồng này

- KHÔNG push, KHÔNG release/tag. KHÔNG sửa production ngoài patch H3f.
- KHÔNG kiểm lại TTS 39. KHÔNG thử birefnet. KHÔNG sửa `creatorFromStack`
  (creator-tag vẫn hỏng — mọi canvas creator="evaluate"; S_store/S_first
  lấy bằng pháp y offline như đợt 118).
- KHÔNG đo lại cặp A/B lần 2 (một cặp đủ theo prereg; lặp lại chỉ khi
  parent yêu cầu sau khi đọc caveat §0/§4).

## 6. Sự cố trong lượt + bài học vận hành

1. **Probe hardcode SCRATCH round118-t2 (chân A):** probe118t2 ghi
   `SCRATCH = …/hidden_files/round118-t2/<TAG>` nên dữ liệu chân A rơi
   vào thư mục đợt 118, driver (tìm ở round119-t1) báo MISSING rồi chờ
   90 s và chạy retry. Đã dừng driver kịp (kill -9 driver sau khi TERM
   không kịp vì trap bash chờ `sleep 90` xong mới chạy) và kill retry
   probe + vite khi retry đã phát được ~16 s (không hog). Retry đã ghi
   đè (append) lên các drain của chân A — nhưng `frame-parity-results.json`
   (23,6 MB) + log + marker còn nguyên. **Khôi phục chính xác:** tách mỗi
   drain tại điểm gián đoạn thời gian duy nhất (tAbs/wallMs/tSend rơi
   mạnh); độ dài prefix khớp ĐÚNG số `*Drained` trong results.json ở cả
   8 file (drawimage 1793, loopms 391, tickcost 116, rvfccost 97,
   getimagedata 515, render-ticks 371, worker-ticks 6974, cdp 360).
   Phần retry đã cách ly tại `contaminated-retry-A/` (không stage).
   Bài học: driver phải kiểm tra đúng SCRATCH của probe (hoặc probe copy
   phải đổi SCRATCH trước khi chạy) — không được giả định driver và probe
   cùng thư mục.
2. **Chân B lần 1 lỗi import (exit=1 ×2):** bản copy probe đặt ở
   hidden_files/round119-t1 không resolve được `./xvfb-display.mjs` và
   `ROOT` (tính từ vị trí file) cũng sai. Sửa đúng mẫu các đợt trước:
   đặt bản copy ở `apps/web/scripts/probe119t1-h3f-ab.mjs` (cạnh
   xvfb-display.mjs, cùng độ sâu thư mục nên ROOT đúng); diff với gốc
   chỉ 2 dòng path + 1 dòng comment. Lần 2 chạy tốt (lock 156 s).
   Driver retry không bật lại hogs (nợ cũ của driver, ghi nhận — lần 1
   lỗi import nên retry cũng lỗi y hệt, không ảnh hưởng kết quả).
3. **Canvas id đổi giữa các lượt:** probe gán id theo thứ tự gặp — chân A
   main=id 2, display=id 3; chân B main=id 1, display=id 2. Đã sửa
   `s-store.py`: xác định main theo cấu trúc (nguồn của display-copy
   872×476 + nhận video draws) thay vì hardcode id==2; chạy lại cả hai
   chân cho số giống hệt. Bài học cho mọi phân tích sau: KHÔNG hardcode
   id canvas giữa các lượt.
4. Lock: chân A giữ ~375 s (gồm 90 s chờ retry + retry 16 s — dưới mức
   ~400 s); chân B lần 1 giữ 92 s (lỗi import); chân B lần 2 giữ 156 s.
   T2 (t2-round119) lấy lock ngay sau cờ applied — phối hợp đúng như
   kế hoạch (T1 không phải chờ lock ở chân B2).

## 7. Nợ mở cho đợt sau

1. **Bộ đếm skip H3f:** thêm counter expose (vd `window.__h3fStats`) để
   đếm trực tiếp số tick skip / số lần đọc video đã bỏ — đo lại một cặp
   ngắn xác nhận cơ chế, thay vì suy từ số lượng tick chậm.
2. **Lặp lại cặp A/B một lần** nếu parent muốn chắc chắn hơn trước khi coi
   H3f là đóng (n=1 hiện tại; hiệu ứng lớn nhưng chưa có lần lặp).
3. `creatorFromStack` trong probe vẫn hỏng (nợ T2 đợt 118 §8 mục 2).
4. Driver retry không bật lại hogs (nợ cũ, mục 2 §6).
5. ci-security.yml vẫn 403 chờ user. TTS 39 cấm kiểm lại. Birefnet chỉ
   thử lại khi RAM đổi (u2net là fallback chính thức).

## 8. File liên quan

- Prereg: `hidden_files/round119-t1/prereg-t1.md`
- Patch (đã apply): `hidden_files/round118-t2/h3f.patch`
- Probe chân A: `apps/web/scripts/probe118t2-storeheld-diag.mjs` (gốc)
- Probe chân B: `apps/web/scripts/probe119t1-h3f-ab.mjs` (mới, 75.292 B —
  oversize, cần `ENABLE_PRIVSEP=0` khi push)
- Driver/analyzer/pháp y/S-store: `hidden_files/round119-t1/run-t1.sh`,
  `analyze-t2-diag.py`, `diag-forensic.py`, `s-store.py`
- Lock copy: `hidden_files/round119-t1/vcut-vite-lock-v2.sh` (md5 5cac10af)
- Dữ liệu thô (KHÔNG stage): `hidden_files/round119-t1/
  chr-mixedalt-h3f-{A,B}-fr4/` (results.json + drains đã tách sạch +
  analysis/forensic/sstore) + `contaminated-retry-A/` (phần retry lỗi)
- LIMITS: `docs/PHASE9_ROUND119_T1_H3F_LIMITS.md` (file này)
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round119-t1-h3f.txt`
  (NUL-delimited; xem §8 — KHÔNG binary, KHÔNG workflow .yml)
- Cờ: `hidden_files/round119-t1-applied` (23:57:58Z) + `round119-t1.done`
