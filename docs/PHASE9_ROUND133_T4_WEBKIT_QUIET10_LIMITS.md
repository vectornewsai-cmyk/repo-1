# PHASE9_ROUND133_T4_WEBKIT_QUIET10_LIMITS — Lượt yên WebKit #10 ĐO XONG: attempt1 hợp lệ, median 39,5 ms, ngưỡng ≤60 ms GIỮ; log draw vẫn 0/5 — re-arm bị chặn bởi loop-gate app-side

> **Verdict: LƯỢT YÊN #10 ĐO XONG, HỢP LỆ (attempt1, 20/20 pass, lớp B 5/5). tickCost total median 39,5 ms — THẤP NHẤT trong 9 lượt yên hợp lệ; ngưỡng ≤60 ms GIỮ, biên còn 20,5 ms.**
> **Log draw post-flip: 0/5 (c2) covered — re-arm THẤT BẠI, nguyên nhân đã xác định ở code app-side (`preview.tsx` loop-gate chỉ ghi loop 1–2). KHÔNG attempt2: không lịch re-arm probe-side nào sửa được lỗi này (chứng cứ: vet +0 cả 7 lần re-arm).**
> **Cơ chế chờ RAM mới HOẠT ĐỘNG: poll dày 45 s bắt được cửa sổ 23 s sau khi cờ T5 xuất hiện (cờ 20:50:22Z → cửa mở 20:50:45Z, RAM 1168 MB).**

## Kết quả chính

1. **Attempt1 (20/20, exit 0): tickCost total median 39,5 ms — LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ #10.** Gate A mở ngay poll #3 (chỉ 3 poll × 45 s); RAM min giữa lượt 636 MB (0 mẫu <500 MB); load1 max 1,48; load5 cuối 0,85; không reboot trong cửa sổ đo; apt/dpkg 0; vite :5187 đã kill sạch sau đo.
2. **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** — lần 10 đóng với median **39,5 ms**, biên còn 20,5 ms (rộng nhất từ trước tới nay). 9 lượt yên hợp lệ: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / **39,5** ms, trung bình 46,9 ms. Median 39,5 là THẤP NHẤT trong 9 lượt (thấp hơn 40,0 của lượt #2/#7).
3. **Gate 0 ĐẠT:** cờ T5 đợt 133 `round133-t5/POSTBOOT_PASS` (pass_at 20:50:22Z, poll=2, boot_id + btime khớp boot đang chạy) + check-only postboot PASS + apt/dpkg 0 + cây md5 khớp.
4. **Cơ chế chờ RAM mới (quyết parent đợt 132 §12.3(a)) LÀM VIỆC:** poll RAM 45 s/lần; cửa sổ mở 23 s sau khi cờ T5 xuất hiện và được chớp ngay. Lưu ý (§3.3): cửa sổ lần này KHÔNG phải cửa sổ vàng sau boot (boot đã 76 phút tuổi) mà là đợt hồi RAM giữa lượt — cơ chế poll dày + vào probe ngay vẫn là yếu tố quyết định.
5. **Log draw: CÓ DỮ LIỆU NHƯNG CHỈ PRE-FLIP (0/5 covered) — re-arm thất bại, nguyên nhân xác định ở code (xem §6):** c2DrawLog n=137 (drawSrc 70 / rawUnit 67; loop 1: 66 / loop 2: 71), wallMs 9854→16068 (span 6214 ms), flip 26187 ms, log max − flip = −10119 ms, 1 epoch. 7 lần re-arm (sau pass 4/7/9/11/13/15/17) vet **+0 entry cả 7 lần**; n đóng băng ở 137 từ pass 2. (c2) n=5 (seq 166/218/293/323/394, đều lag 1f = 33 ms) — không event nào nằm trong cửa sổ log; blendTick hậu-flip trong ±500 ms của log: 0/376 (0,0%).
6. **Histogram #10 (phương pháp T3/T5, n=752 ghost, nomatch 0):** bin 0: 34,4%, +1/+2: 52,3% (cao nhất từ trước), +3: 3,1% (thấp nhất từ trước), ≥3: 3,3%, <0: 10,0%; snapMs−labelMs median 35 ms (p90 54); rawMs−labelMs median 8 ms. So với #9 (bin 0: 33,8%, +1/+2: 43,1%, +3: 13,0%, snap median 44 ms): +1/+2 tăng, +3 giảm mạnh — chuỗi đơn điệu vẫn không xếp đúng (xem §5.2, chuyển T3/T5 pha 2).
7. **F6' (skipLatest pixel-verified) TÁI XÁC NHẬN ĐÓNG:** nTick skp=1 = 62 (≥30); (1) nhãn 100,0% (62/62), (2) pixel-verified 100,0% (62/62). lag5: 0 occurrence (b) lag≥+5f.
8. **Không reboot trong cửa sổ đo.** Boot 07da9c50 (btime 19:34:15Z) sống suốt lượt; T4 bắt đầu lúc boot đã 65 phút tuổi. Không reboot giữa lượt lần đầu sau 6 lượt liên tiếp có reboot.
9. **KHÔNG attempt2 — quyết định có căn cứ (xem §6.4):** lỗi phủ log nằm ở app-side (`preview.tsx` loop-gate), không lịch re-arm probe-side nào sửa được; attempt2 chỉ lặp lại phép đo ngưỡng (đã rõ ràng: 39,5 ms) và lặp lại 0/N coverage. Sửa instrumentation là việc của T3/parent đợt 134 (xem §10).

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** brief T4 đợt 133 (quyết parent đợt 132 §12.3(a) + brief đợt này): gate 0 = cờ T5 đợt 133 trong `round133-t5/` (chỉ chấp nhận cờ khớp boot_id/btime boot đang chạy) + check-only postboot PASS + apt/dpkg 0 + cây md5 khớp; gate A giữ ngưỡng RAM ≥1024 MB, KHÔNG HẠ; poll RAM dày 30–60 s/lần (thực hiện 45 s); chớp cửa sổ ngay khi RAM ≥1024 + gate 0 đạt; không có cửa sổ tới 23:00Z thì đóng 0 attempt; kiểm cửa sổ log ngay sau attempt đầu; KHÔNG đo lại RAM idle, KHÔNG đo TTS 39, KHÔNG thử birefnet.
- **Probe tái dùng nguyên bản đợt 132:** `hidden_files/round133-t4/probe121t3-ghost-k7.webkit.mjs`, md5 `70c7bb9a43a74acd91efbe8f2e35e4e6` (khớp bản đợt 132), `node --check` OK. Analyzer coverage + labellag + histogram-with10 đã dry-run PASS trên dữ liệu đợt 131 trước khi đo (tái tạo đúng median 56,0 / (c2)=9 / coverage 0/9 — xem LIMITS đợt 132 §1).
- **Cây đo không đổi suốt lượt:** `preview.tsx 805409f0`, `media.ts 2c384ed1`, `vite.config.ts ee80d093` (kiểm trước, giữa, sau — xem §9). KHÔNG sửa `preview.tsx` trong lượt này (xem §6.4).
- **Boot trong đợt:** 07da9c50-5836-4481-a4a4-7e22c6260325, btime 2026-11-17 19:34:15Z (cùng boot lúc mở đợt 133 — chưa reboot). T4 bắt đầu 20:39Z (boot 65 phút tuổi); poller chạy 20:49:15Z.
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu — là marker MỞ ĐỢT 133 do parent tạo (20:35Z), KHÔNG phải đợt main-chat — T4 tiến hành bình thường (tiền lệ đợt 130/131/132).

## 1. Gate 0 — ĐẠT 20:50:22Z (cờ T5 đợt 133)

| Điều kiện | Kết quả |
|---|---|
| (0a) T5 flag `round133-t5/POSTBOOT_PASS` khớp boot | **PASS** — `POSTBOOT_PASS boot_id=07da9c50-... btime=2026-11-17T19:34:15Z pass_at=2026-11-17T20:50:22Z poll=2` (file 122 B, mtime 20:50:23Z). T5 viết cờ bằng watcher b84 (poll 2). |
| (0b) check-only postboot riêng PASS | **PASS** — `vcut-webkit-postboot-check.sh` exit 0 (0,24 s), kết luận "ĐỦ ĐIỀU KIỆN chạy WebKit", replay 1545 dòng / 221 installs, gstreamer1.0-gl đã cài bởi replay. |
| (0c) apt-get/dpkg = 0 (pgrep -x) | **0/0** trong mọi poll. |
| (0d) cây md5 == tree-md5.txt | **YES** — preview.tsx 805409f0. |

- Trước khi cờ xuất hiện (poll #1–#2), t5flag=`chua-co`; poller vẫn chạy check-only + ghi log đầy đủ, không vào probe.
- Không dùng cờ T7 làm dự phòng đợt này (brief đợt 133 chỉ định cờ T5 trong `round133-t5/`); T7 cũng không viết cờ nào — không có mâu thuẫn cờ.

## 2. Gate A — MỞ ở poll #3 (20:50:45Z), chỉ 3 poll × 45 s

Bảng poll gate A (đủ từ `poll-t4.log`, 6 dòng):

| Poll | Thời gian | RAM | load1/load5 | lock | blockers | cây | t5flag | postboot |
|---|---|---|---|---|---|---|---|---|
| #1 | 20:49:15Z | 1549 MB | 1,15 / 0,74 | không | 0 | YES | chua-co | 0 |
| #2 | 20:50:00Z | 1398 MB | 0,83 / 0,70 | không | 0 | YES | chua-co | 0 |
| #3 | 20:50:45Z | **1168 MB** | 1,01 / 0,75 | không | 0 | YES | **PASS** | 0 → **CỬA MỞ** |

- Mọi tiêu chí gate A đều đạt ở poll #3: load1 <2, load5 <2, RAM 1168 ≥1024, lock trống, blockers 0, cây YES, gate 0 PASS. Poller chạy attempt1 ngay trong cùng giây (không chờ thêm poll nào — đúng cơ chế "chớp cửa sổ").
- Tổng thời gian chờ từ lúc mở đợt (20:35Z) tới cửa mở (20:50:45Z): 15 phút 45 s — ngắn nhất kể từ đợt 130 (34 phút) và đợt 131 (mở ngay poll 1 nhưng trên boot mới 14 phút tuổi).

### 2.1 Diễn biến RAM — cửa sổ mở như thế nào

| Thời điểm | RAM khả dụng | Ghi chú |
|---|---|---|
| 20:40Z (T4 bắt đầu) | 479 MB | Kẹt như đợt 132 (420–552 MB) |
| 20:49:15Z (poll #1) | **1549 MB** | Nhảy +1070 MB trong 9 phút |
| 20:50:00Z (poll #2) | 1398 MB | Đang tụt ~150 MB/45 s |
| 20:50:45Z (poll #3, cửa mở) | 1168 MB | Vẫn ≥1024 — chớp kịp |
| 20:51:03Z (vite/WebKit khởi động) | 890 MB | Dưới 1024 — nhưng cửa đã mở, attempt đã bắt đầu |
| 20:51:08–20:52:08Z (sampler giữa lượt) | 871 → 835 → 703 → **636 MB (min)** | Đáy giữa lượt, vẫn trên 500 (B5 DAT) |
| 20:52:28–20:53:48Z | 1019 → 1091 → 1168 → 1238 → 1188 MB | Hồi phục trong lúc đo |
| 20:56:54Z (sau khi kill vite) | 2059 MB | Vite/WebKit thoát, RAM bật lại |
| 21:01:34Z (kiểm cuối) | 1664 MB | Ổn định trên 1024 |

- **Nguyên nhân đợt nhảy RAM 479→1549 MB chưa xác định — không phải do T4** (không thao tác nào của T4 giải phóng RAM; poller chỉ đọc). Tương quan thời gian duy nhất ghi được: cờ `round133-t9.done` 20:45:14Z và `round133-t7.done` 20:45:47Z (hai luồng kết thúc trong khoảng RAM nhảy lên) — chỉ là tương quan, KHÔNG chứng minh nhân quả. T1 kết thúc muộn hơn (done 20:55:02Z, sau khi cửa mở) nên không phải nguyên nhân.
- **Bài học cơ chế chờ RAM:** cửa sổ lần này KHÔNG phải "cửa sổ vàng ~10 phút sau boot" (boot đã 76 phút tuổi lúc cửa mở) mà là đợt hồi RAM giữa lượt do các luồng khác kết thúc. Quyết parent §12.3(a) mô tả cửa sổ vàng sau POSTBOOT_PASS — thực tế đợt này cho thấy cửa sổ còn có thể mở do RAM hồi giữa lượt. Poll dày 45 s + vào probe ngay là yếu tố quyết định bắt được cửa sổ (từ lúc cờ xuất hiện 20:50:22Z tới khi RAM tụt dưới 1024 chỉ ~40 s sau poll #3; nếu poll thưa 2 phút như đợt 132 thì đã lỡ).
- Nếu không có đợt hồi RAM này, lượt #10 lại 0 attempt như đợt 132 — RAM kẹt ~500 MB suốt 65 phút đầu của boot này (20:40Z vẫn 479 MB).

## 3. Attempt1 — 20/20 pass, exit 0

- **Chạy:** 20:50:48Z (sampler) → probe 20:50:50Z → inner-end 20:54:07Z (probe_exit=0). Vite :5187 (config tạm, 0 watch) khởi động qua lock v2 `run-attempt t4 5187 1500 30 normal`, giữ lock đúng lúc chạy probe, nhả ngay sau đó.
- **JSON:** `hidden_files/round133-t4/preview-b-f3-flip-webkit-t4-attempt1.json` — 3.274.496 B, sha256 `e3ca1ac5dd79be72014a88268fe5abec1703f585b25a64473ad434c245423133`. Ghi tăng dần từng pass (partial JSON 1/20 → 20/20, không mất pass nào).
- **Engine:** webkit 27.2, pageErrs=[], flip afterPass=5 wallMs=26187.
- **tickCost total:** n=650 **median 39,5 ms**, p90 65,0, max 107, min 28; hậu flip+2000ms n=471 median 39,0, p90 64,0.
- **tBlend gap:** n=520 median 78,0, p90 106,1, max 1714. BlendTick/pass 26,1; rAF/pass median 40 (min 26, max 43).
- **Wallbands (tickCost theo wallMs):** 0–20k median 38,0; 20–32k 42,5; 32–45k 39,0; 45–62k 40,0; 62–70k 38,5; 70–80k 40,0 — phẳng, không trôi theo thời gian.
- **Labellag (pixel-truth, L7):**
  - skippedLatest=1: nTick 62, nOccurrence 124, (c) 0, **(c2) 0**.
  - skippedLatest=0: nTick 314, nOccurrence 628, (a) median 1f p90 2f max 4f min −9f; (c) n=5 median 1f; **(c2) n=5 median 1f (33 ms) p90 1f max 1f min 1f** — seq (166, 22, 21, 1), (218, 24, 23, 1), (293, 13, 12, 1), (323, 22, 21, 1), (394, 16, 15, 1). nomatch 0/628.
  - So với đợt 131: (c2)=9, median 1f, p90 1f, max 3f. Đợt 133: (c2)=5, toàn bộ lag đúng 1f — phân tán hẹp hơn, không event nào ≥2f.
- **lag5:** 0 occurrence (b) lag≥+5f.
- **skiplatest F6':** nTick skp=1 = 62 (cần ≥30); (1) nhãn: 62/62 tick KHÔNG chứa ghost==presented (100,0%); (2) pixel-verified: 0 ứng viên vi phạm, 62/62 tick không vi phạm thật (100,0%); (4) label-clean distinct n=41 (mislabeled 36 / clean 5). **KẾT LUẬN: F6' ĐÓNG — tái xác nhận trên lượt #10** (đã đóng đợt 131).
- **Histogram #10** (`t4-histogram-with10.py`, RUNS đã đổi sang JSON đợt 133): nTicks post flip+2000ms 376, nGhost 752, nomatch 0; hist (pixFrame−label): {−9: 2, −3: 4, −1: 69, 0: 259, +1: 203, +2: 190, +3: 23, +4: 2}; bin 0: 34,4%, +1: 27,0%, +2: 25,3%, **+1/+2: 52,3%**, +3: 3,1%, +4: 0,3%, ≥3: 3,3%, <0: 10,0%; **snapMs−labelMs median 35 ms** (mean 38,8, min 26, max 81, p90 54); rawMs−labelMs median 8 ms (mean 11,0, p90 21); label−floor(labelCt*30): {1: 575, 0: 177}; curPix run đứng cùng ≥3 tick: 12 run — dài nhất (316, 323, 8 tick), (416, 422, 7), (160, 165, 6), (288, 293, 6).

### 3.1 Ngưỡng ≤60 ms — GIỮ (lần thứ 9)

| Lượt yên hợp lệ | tickCost total median (ms) |
|---|---|
| #1 (S5 đợt 116 a3) | 49,5 |
| #2 (T4 đợt 118 a8) | 40,0 |
| #3 (T3 đợt 121 a1) | 52,0 |
| #4 | 47,5 |
| #5 | 44,0 |
| #6 | — (không có số hợp lệ) |
| #7 (T9 đợt 126 a2) | 54,0 |
| #8 | 40,0 |
| #9 (T4 đợt 131 a1) | 56,0 |
| **#10 (T4 đợt 133 a1)** | **39,5** |

Ghi chú về cách đếm: thứ tự + mốc neo theo LIMITS đợt 131 ("56,0 là CAO NHẤT trong 8 lượt (vượt 54,0 của lượt #7)" và "8 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0, trung bình 47,9 ms") — tức trong các lượt #1–#9 có 8 lượt hợp lệ (lượt #6 không có số), lượt #9 đóng với median 56,0. Đợt 132 không đo được nên không có số. Nay thêm #10 = 39,5 ms → **9 lượt hợp lệ, trung bình 46,9 ms**. Kết luận không đổi: **39,5 ≤ 60, ngưỡng GIỮ, biên 20,5 ms — rộng nhất trong lịch sử lượt yên** (biên hẹp nhất trước đây là 4,0 ms ở đợt 131).

## 4. Lớp B — DAT 5/5 (từ `classb-t4-attempt1.txt`)

| Mục | Kết quả |
|---|---|
| B1 (load5 cuối ≤2,5) | **DAT** — load5 cuối 0,85 |
| B2 (load1 giữa lượt ≤4 + không process phân tích nặng luồng khác) | **DAT** — load1 max 1,48 (sampler 20 s, n=10); ps-before/after chỉ có vite :5187 của chính T4 (npm/sh/node vite) — không process phân tích của luồng round133 khác |
| B3 (không reboot trong lúc đo) | **DAT** — boot lúc bắt đầu = boot hiện tại = 2026-11-17 19:34:15 |
| B4 (không replay apt/dpkg trong cửa sổ) | **DAT** — apt/dpkg 0 lúc đánh giá; postboot check-only vẫn PASS sau lượt (xem §9) |
| B5 (RAM giữa lượt không <500 MB) | **DAT** — RAM min 636 MB, 0 mẫu <500 MB. **Ghi nhận (không vi phạm): 5/10 mẫu RAM <1024 MB** (871, 835, 703, 636 + 890 lúc khởi động — xem §2.1) |

**LOP-B-TONG: DAT 5/5 → attempt1 là lượt yên HỢP LỆ.**

## 5. Histogram #10 so với #9 — giả thuyết thứ tự theo tick (chuyển T3/T5 pha 2)

- Đợt 131 (#9): bin 0: 33,8%, +1/+2: 43,1%, +3: 13,0%, snap median 44 ms; tuyên bố đơn điệu bị phá vỡ (7/8).
- Đợt 133 (#10): bin 0: 34,4% (≈ #9), **+1/+2: 52,3% (tăng 9,2 điểm)**, **+3: 3,1% (giảm 9,9 điểm)**, snap median 35 ms (giảm 9 ms).
- Đọc nhanh: +1/+2 tăng trong khi +3 giảm mạnh — chuỗi không tiếp nối đơn điệu theo hướng nào cả; cùng với (c2) toàn lag 1f, dữ liệu #10 không ủng hộ cũng không bác bỏ dứt khoát giả thuyết thứ tự theo tick — **chuyển T3 bước 2 + T5 pha 2 đối chiếu đầy đủ** (T5 có script `t5-c2-drawlog-analysis.py` sẵn; T3 có prereg ghost-freeze/skew đứng từ 17:46Z đợt 132).
- curPix run đứng cùng ≥3 tick: 12 run ở #10 (dài nhất 8 tick, seq 316–323 — trùng seq (c2) 323) — T5 pha 2 xem có phải stale-ghost P4 không.

## 6. Log draw post-flip: 0/5 — re-arm THẤT BẠI, nguyên nhân xác định ở code app-side

### 6.1 Số liệu

- c2DrawLog n=137 (drawSrc 70 / rawUnit 67; loopNo 1: 66 / 2: 71; stage plain-native 70 / rawUnit 67; srcKind 'canvas 1280x720' 137/137; readyState 4 137/137; seeking False 137/137); frameIdx 0–68 (distinct 36); ct 0–2,267 s; wallMs 9854→16068, span 6214 ms; 1 wrap; 1 epoch.
- flip wallMs=26187 → **log max − flip = −10119 ms** (log dừng TRƯỚC flip hơn 10 s); log min − flip = −16333 ms.
- (c2) seq 166 (tBlend 31128), 218 (37899), 293 (47380), 323 (51263), 394 (60292) — entry log gần nhất 16068, delta −15060…−44224 ms → **KHÔNG PHỦ cả 5**.
- **TỔNG: (c2) trong cửa sổ log: 0/5. blendTick hậu-flip (tBlend≥flip+2000) trong ±500 ms của log: 0/376 (0,0%).**
- Re-arm: 7 lần (sau pass 4/7/9/11/13/15/17), mỗi lần vet epoch cũ **+0 entry**; n đóng băng ở 137 từ pass 2 (pass 1: n=65 → pass 2: n=137 → pass 3–20: n=137 không đổi).

### 6.2 Nguyên nhân — đọc code `preview.tsx` (chỉ đọc, KHÔNG sửa)

Hàm `c2DrawLogPush` (`apps/web/src/preview.tsx`, dòng 681–712):

```js
const C2_DRAW_LOG_MAX_ENTRIES = 10000;                    // dòng 680
function c2DrawLogPush(entry) {
  if (w.__vcutC2DrawLog !== true) { c2DrawLogWasEnabled = false; return; }
  if (!c2DrawLogWasEnabled) {
    c2DrawLogWasEnabled = true;
    c2DrawLogLoopNo = 0; c2DrawLogLastFrameIdx = -1;
    c2DrawLogEntries.length = 0;                          // dòng 700: re-enable XÓA mảng
  }
  if (c2DrawLogLastFrameIdx >= 0 && entry.frameIdx < c2DrawLogLastFrameIdx)
    c2DrawLogLoopNo += 1;
  c2DrawLogLastFrameIdx = entry.frameIdx;
  if (c2DrawLogLoopNo < 1 || c2DrawLogLoopNo > 2) return; // dòng 705: CHỈ ghi loop 1–2
  if (c2DrawLogEntries.length >= C2_DRAW_LOG_MAX_ENTRIES) return;
  c2DrawLogEntries.push({ ...entry, wallMs: performance.now(), loopNo: c2DrawLogLoopNo });
}
```

Ba điểm kết luận:

1. **Loop-gate (dòng 705) là nguyên nhân gốc.** Logger theo thiết kế chỉ ghi khi `loopNo` ∈ {1, 2} — video lặp liên tục, nhưng mọi draw từ loop 3 trở đi đều bị `return` bỏ. Các event (c2) ở tBlend 31–79 s (tức loop thứ ~10–26 của video 3 s) **không bao giờ** có thể nằm trong cửa sổ log này. Đây cũng là lý do đợt 131 chỉ thấy đúng "2 vòng loop sau wrap đầu tiên" (loop 1: 53 / loop 2: 50).
2. **Re-enable xóa mảng (dòng 700) làm re-arm probe-side vô hiệu về mặt tích lũy trang.** Mỗi lần probe toggle cờ false→true, `c2DrawLogLoopNo` reset về 0 và mảng bị xóa — chỉ có vet-trước-toggle của probe (fetch mảng rồi cộng dồn vào `c2Accum`) mới giữ được 137 entry cũ. Sau re-arm, loop đầu tiên (loopNo 0) không ghi gì cho tới wrap đầu tiên; và thực tế sau pass 2 video không wrap thêm lần nào nữa trong lúc đo (không entry mới nào xuất hiện dù đã toggle 7 lần) — draw callback ngừng bắn sau wallMs 16068 (ct 2,267 s, giữa loop 2).
3. **Cap 10000 (dòng 680) KHÔNG phải nguyên nhân** — n=137 << 10000.

Nói gọn: re-arm của probe (đợt 132) giả định "toggle cờ sẽ cho log ghi lại 2 pass tiếp theo" — giả định này **bị bác bỏ bởi dữ liệu + code**: toggle không làm logger ghi lại, vì logger bị khóa bởi loop-gate và video không wrap thêm. Muốn phủ post-flip thì phải sửa instrumentation app-side (nới loop-gate / thêm cờ runtime chọn số loop tối đa — đúng hướng LIMITS đợt 132 §7 đã nêu).

### 6.3 T5 pha 2 đối chiếu log draw với seq (c2): KHÔNG CÓ DỮ LIỆU MỚI để đối chiếu

- Như đợt 132: 0/5 (c2) covered nên không có cặp (log entry, event c2) nào để T5 pha 2 đối chiếu. Giả thuyết ghost-freeze + skew snap/label vẫn là giả thuyết mạnh nhất (9/9 (c2) ở biên run đợt 131, p ~ 3×10⁻⁷ — nay thêm 5/5 (c2) lag 1f ở #10) nhưng chưa có bằng chứng log-draw trực tiếp. DEF v0.5 vẫn KHÔNG viết.

### 6.4 Tại sao KHÔNG attempt2 (quyết định của T4, ghi rõ căn cứ)

Quyết parent đợt 131: "nếu log vẫn chỉ phủ pre-flip thì điều chỉnh lịch re-arm và chạy attempt tiếp theo trong cùng lượt yên". T4 đã kiểm cửa sổ log NGAY sau attempt đầu (theo đúng quyết định này) và kết luận **không chạy attempt2**, vì:

- (a) Bằng chứng cho thấy lỗi không nằm ở lịch re-arm: 7 lần toggle ở 7 mốc pass khác nhau đều vet +0 — đổi mốc toggle (vd thêm pass 6/8/10…) không thể làm logger ghi lại khi loop-gate chặn mọi loop >2.
- (b) Sửa duy nhất có khả năng hiệu quả là sửa `preview.tsx` (nới loop-gate) — thay đổi code production giữa lượt đo, cần quyết parent + T3 (chủ prereg ghost-freeze/skew); LIMITS đợt 132 cũng chỉ ghi "mới xem xét", không phải lệnh làm. T4 không tự sửa production code.
- (c) Attempt2 không có sửa đổi sẽ chỉ lặp lại 0/N coverage và lặp lại phép đo ngưỡng (39,5 ms đã rõ ràng, biên 20,5 ms) — không thêm thông tin nào cho verdict.
- Đề xuất chuyển đợt 134: T3 sửa instrumentation (ghi rõ md5 preview.tsx trước/sau + revert sau khi đo, theo mẫu LIMITS đợt 132 §7), rồi đo lại lượt yên #11 với logger đã nới.

## 7. Lỗi runner/poller phát hiện trong lượt (đã ghi, đã sửa script để dùng lại)

1. **Runner `run-attempt-133.sh` — mẫu grep COV sai (không ảnh hưởng dữ liệu):** mẫu `'[0-9]+/[0-9]+ \(c2\) covered'` không khớp dòng thực tế của coverage script (`TONG: (c2) trong cua so log: 0/5`) nên biến COV rỗng, dòng đầu `coverage-check-attempt1.txt` trống, marker `COVERAGE-0` không được tạo, runner exit 0 theo probe RC. **Coverage đã xác minh thủ công từ file** (`analyze-t4-attempt1-c2coverage.txt`: 0/5, xem §6.1) — verdict không đổi. Đã sửa mẫu grep trong script thành `TONG: \(c2\) trong cua so log: [0-9]+/[0-9]+` để dùng lại đợt sau.
2. **Poller `poll-wait-t4-133.sh` — timestamp stale ở dòng kết (chỉ cosmetic):** dòng "attempt1 chay xong, run-attempt exit=0" ghi `20:50:45Z` (giờ lúc poll mở cửa) thay vì giờ thực ~20:54:34Z, do tái dùng biến `$NOW_ISO` tính trước khi chạy attempt. Thời gian thực lấy từ `chain-t4.log` (inner-end 20:54:07Z, analyzer 20:54:34Z). Đã sửa script tính lại thời gian tại điểm ghi.
3. **Runner gọi `analyze-t4-tickcost.py` / `analyze-t4-wallbands.py` sai tham số (đã chạy lại đúng):** hai script này nhận `tag=path`, runner gọi với đường dẫn trần nên crash (`ValueError: not enough values to unpack`). Đã chạy lại đúng (`"T4-133a1=<json>"`) và ghi đè file txt — số tickCost/wallbands trong LIMITS này là từ lần chạy lại đúng (exit 0). Đã sửa lệnh gọi trong script.

## 8. Trạng thái sau đo (kiểm cuối 21:01Z)

- Vite :5187 đã chết (`curl :5187` = 000, 2 lần kiểm); `vite.lock` không tồn tại; không process vite/webkit/probe/MiniBrowser nào sót (`ps` sạch).
- Cây không đổi: preview.tsx 805409f0, media.ts 2c384ed1, vite.config.ts ee80d093 (khớp trước lượt).
- Postboot check-only vẫn PASS sau lượt (exit 0, "ĐỦ ĐIỀU KIỆN chạy WebKit", boot 19:34:15).
- RAM 1664 MB lúc kiểm cuối; boot 07da9c50 vẫn sống (uptime ~1h27m lúc 21:01Z).
- Không file production nào bị sửa; chỉ thêm file làm việc trong `hidden_files/round133-t4/` + LIMITS này trong `repo-1/docs/`.

## 9. Nợ mở chuyển đợt 134

1. **Sửa instrumentation log draw (`preview.tsx`, cần quyết parent + T3):** nới loop-gate dòng 705 (hoặc thêm cờ runtime chọn số loop tối đa) + xem lại reset mảng khi re-enable (dòng 700); ghi rõ md5 trước/sau + revert sau khi đo. Không có sửa này thì mọi lượt yên sau vẫn 0/N coverage cho (c2) hậu-flip.
2. **T5 pha 2 đối chiếu (c2):** chờ logger đã nới mới có dữ liệu; script `t5-c2-drawlog-analysis.py` đã sẵn (round132-t5b/).
3. **T3 bước 2 (prereg ghost-freeze/skew 17:46Z đợt 132 đứng nguyên):** dùng dữ liệu #10 ((c2)=5 lag 1f; histogram +1/+2 52,3% / +3 3,1%; curPix run 12) để kiểm chứng.
4. **Cửa sổ RAM:** ghi nhận cơ chế chờ RAM hoạt động cả với đợt hồi RAM giữa lượt (không chỉ cửa sổ vàng sau boot) — brief đợt sau nên ghi rõ cả hai nguồn cửa sổ. Nguyên nhân đợt hồi RAM lần này chưa xác định (tương quan T7/T9 done 20:45Z, chưa chứng minh).
5. **Runner/poller:** 3 lỗi §7 đã sửa trong script — đợt sau dùng lại bản đã sửa, kiểm `bash -n` + dry-run coverage trên JSON đợt 133 trước khi đo.
6. **G1 vẫn hoãn; R9 (a) vẫn chờ user; ci-security.yml vẫn 403; TTS 39 cấm kiểm lại; birefnet không thử (RAM <6 GB).**

## 10. Stage (KHÔNG push) + cờ

- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round133-t4-quiet10.txt` — 1 entry (`docs/PHASE9_ROUND133_T4_WEBKIT_QUIET10_LIMITS.md`), verify bằng read-back. KHÔNG push.
- **Cờ:** `hidden_files/round133-t4.done` — dòng đầu: "đo xong, 1 attempt, median 39,5 ms, ngưỡng GIỮ, log draw 0/5".
- **File làm việc (không stage, chỉ để trong `hidden_files/round133-t4/`):** probe (md5 70c7bb9a…), `b.json`, `vite.t4-temp.config.mjs`, `tree-md5.txt`, `poll-wait-t4-133.sh` + `poll-t4.log` (6 dòng), `run-attempt-133.sh`, `t4-attempt-inner.sh`, `check-classb-t4.sh`, `preview-b-f3-flip-webkit-t4-attempt1.json` (3.274.496 B, sha256 e3ca1ac5…), `load-mid-t4-attempt1.log`, `run-webkit-t4-attempt1.log`, `chain-t4.log`, `classb-t4-attempt1.txt`, `analyze-t4-attempt1-{c2drawlog,labellag,skiplatest,lag5,tickcost,wallbands,c2coverage}.txt`, `coverage-check-attempt1.txt`, `t4-histogram-with10.py` + `t4-histogram-with10.txt`, `ps-before/after-t4-attempt1.txt`, `marker-t4-attempt1`.
