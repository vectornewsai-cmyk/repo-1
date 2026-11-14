# PHASE9_ROUND107_I5_BLUR_LIMITS.md — Blur B-band c0, đợt 107, luồng I5

**Ngày:** 13/11/2026. **Luồng:** I5 (Phase 9 đợt 107). **Chủ đề:** Blur B-band c0 —
bổ sung B-cap (nợ LIMITS gộp đợt 106: docs/PHASE9_ROUND106_H4_BLUR_LIMITS.md §7 mục 1).
**Bối cảnh:** xem docs/PHASE9_ROUND105_G7_BLUR_LIMITS.md (§2) và
docs/PHASE9_ROUND106_H4_BLUR_LIMITS.md (§1–§3); prereg
`hidden_files/round107-i5/prereg-i5.md` (viết TRƯỚC mọi lượt probe).

**Kết quả lớn nhất đợt này:**
- **B-band c0: VẪN MỞ — KHÔNG ĐẠT bar, gần như không nhúc nhích.** Gộp
  F6+G7+H4+I5: c0 7/83 (8,4%) vs c2 3/57 (5,3%), Fisher một phía
  **p=0,3584** (hai phía p=0,5282) — so với H4 (p=0,3545) gần như không
  đổi. Hiệu số +3,2pp, 95% CI Newcombe [−6,9pp, +11,9pp] — vẫn bao 0.
  Còn thiếu **c0 32 / c2 58 B-cap** tới ~115/nhóm. Power tại hiệu ứng gốc
  (17,1% vs 6,1%): normal-approx 62%, Fisher-exact (mô phỏng 20.000 lần)
  57%; tại hiệu ứng quan sát chỉ 17%.
- **Đợt này lấy mẫu RẤT KÉM — chỉ 19 B-cap mới từ 6 lượt** (kỳ vọng
  prereg ~30 c0 + ~18 c2 sau 4 lượt; thực tế 11 c0 + 3 c2 sau 6 lượt).
  Tổng chỉ 67 cap thô / 58 cap dùng, so với 387 cap thô của H4 (4 lượt).
  Nguyên nhân: máy bị các luồng đợt 107 khác chiếm dụng suốt đợt
  (psOther 15–16, sóng tải load 26–28 xen kẽ cửa yên) làm rAF/pump đói —
  xem §0. Đây là giới hạn của đợt, không phải của phương pháp: dữ liệu
  vẫn hợp lệ theo protocol (exit 0, F3 tắt, md5 ổn định) nhưng đóng góp
  cho pool quá nhỏ để kết luận thêm.
- **Cờ heterogeneity VẪN KHÔNG có ý nghĩa.** Gộp G7+H4+I5: c0-only 5/44
  vs c0 3-clip 2/39, Fisher hai phía p=0,4388 (H4: p=0,3662). I5 riêng:
  1/5 vs 1/6, p=1,0. Vẫn gộp pool theo prereg.
- **D floor gộp: 0/2429** (0/2371 + I5 0/58); Fisher vs pre-fix 28/1547:
  p=2,86e-12; 95% CI trên (rule of three) 0,124%.
- **Cụm A stripes: KHÔNG thuộc phạm vi luồng này** (luồng I8 làm) —
  không đo thêm, không kết luận thêm.

**Build:** mọi lượt probe chạy trên `ced42efd` (không đổi md5 lần nào,
không có lượt "lai"). F3 tap+relabel TẮT trong mọi lượt (baseline
C4/D4/E6/F6/G7/H4). **Không sửa production trong luồng này** (chỉ thêm
probe + analyzer + LIMITS này). Không push GitHub, không release/tag,
không TTS 39, không birefnet.

---

## §0. Bối cảnh chạy — 2 sự cố hạ tầng + máy đói suốt đợt

- **Phối hợp tải (đúng prereg §0):** I5 thuộc nhóm NẶNG, chờ đủ 3 cờ
  `round107-i1-done`, `round107-i3-done`, `round107-i4-done` — cờ đủ lúc
  **18:00:58Z** (sau ~18 phút poll 60s), driver chạy ngay sau đó. KHÔNG
  chạy khi cờ thiếu. Boot suốt đợt 63a52041 (từ 14:50:59Z, reboot #33);
  **reboot #34 (dự báo ~16:51:58Z, dải tới 18:05Z) KHÔNG xảy ra trong
  đợt** — boot không đổi từ đầu tới cuối (kiểm tra cuối 18:36Z).
- **Sự cố 1 — ENOSPC đợt 1 (18:03–18:06Z):** 5/6 lượt đầu exit=2, không
  có `frame-parity-results.json`. Nguyên nhân: vite crash
  `ENOSPC: System limit for number of file watchers reached`
  (`max_user_watches=63747`) — nhiều vite dev server của các luồng khác
  chạy song song (round77-e1 cổng 5580, round96-x5 cổng 5590, …) đã ăn
  hết inotify watchers; cả 2 attempt vite của mỗi lượt đều chết, nên
  `page.goto` nhận `ERR_CONNECTION_REFUSED` ở 127.0.0.1:5591. Load lúc
  đó vọt 6,5 → 27,5. Đây là lỗi hạ tầng, không phải lỗi probe/code.
- **Sự cố 2 — lấy mẫu kém cả đợt (xem §1):** ngay cả lượt chạy lúc yên
  (load1 ~1–2) cũng chỉ được 13–19 cap, so với 98–224 cap/lượt của H4.
  `psOther=15–16` tiến trình khác, sóng tải (load 26–28) xen kẽ cửa yên,
  load15 duy trì ~7–11 suốt đợt — rAF/pump đói: pumpN chỉ 3–20/lượt
  (H4: 29–231), blendTickN 0–10 (H4: 29–316), rafCount r41c0 chỉ 53
  (~4 rAF/s). Probe có chờ yên trước phát (tối đa ~120s, vd r42c0 chờ
  18:21:20→18:23:21) rồi vẫn phát khi tải còn cao (r42c0 load lúc phát
  26,11; r43c0 27,15).
- **Lệch prereg (ghi nhận trung thực):** driver đợt 1 KHÔNG dừng sớm sau
  2 fail liên tiếp như prereg §2 (đã chạy hết 6 lượt, 5 fail) — vì vậy
  đợt retry phải chạy lại cả 5 lượt lỗi. Retry là cùng thiết kế/cùng
  tag, KHÔNG đổi thiết kế giữa chừng; lượt r41c0 (exit 0) KHÔNG chạy
  lại, giữ nguyên trong pool.
- **Tải lúc phát từng lượt:** r41c0 1,34; r41 1,19; r42c0 **26,11**;
  r42 1,97; r43c0 **27,15**; r43 2,28. Hai lượt c0-only r42c0/r43c0 phát
  trong sóng tải nặng — ghi rõ để đợt sau khỏi đọc mù.

| lượt | engine | config | cap thô | cap dùng* | pumpN | blendTickN | ghi chú |
|---|---|---|---|---|---|---|---|
| chr-blur-r41c0 | chr | scroll-blur, `--nclips 1` | 5 | 5 | 9 | 5 | đợt 1, exit 0; suy giảm nặng (H4 c0-only: 28–37 cap) |
| chr-blur-r41 | chr | scroll-blur | 13 | 11 | 11 | 4 | retry, exit 0; load lúc phát 1,19 |
| chr-blur-r42c0 | chr | scroll-blur, `--nclips 1` | 9 | 7 | 9 | 8 | retry, exit 0; phát trong sóng tải 26,11 |
| chr-blur-r42 | chr | scroll-blur | 19 | 17 | 20 | 10 | retry, exit 0; load lúc phát 1,97 |
| chr-blur-r43c0 | chr | scroll-blur, `--nclips 1` | 4 | 4 | 3 | **0** | retry, exit 0; **0 blend tick**, 0 B-cap; phát trong sóng tải 27,15 |
| chr-blur-r43 | chr | scroll-blur | 17 | 14 | 16 | 6 | retry, exit 0; load lúc phát 2,28 |
| **I5 mới** | | | **67** | **58** | | | |

\* "cap dùng" = cap có baseline noblur cho (clip, frameIdx); cap còn lại
bị loại khỏi phân tích band (r41: 2, r42c0: 2, r42: 2, r43: 3) — cùng quy
tắc G7, không phải lỗi dữ liệu. Đợt 1 (trước retry): r41/r42c0/r42/r43c0/
r43 exit=2 do ENOSPC, không có results.json, LOẠI hoàn toàn (không ước
lượng bù); chỉ tính lượt retry tương ứng.

---

## §1. B-band c0 — kiểm chứng gộp: KHÔNG ĐẠT bar, mẫu mới quá ít

Phương pháp: ĐÚNG phương pháp G7 §B (baseline noblur W3/Z5 theo
(clip, frameIdx); g = std(cap px 96×54)/baseline; BANDS D [0,27–0,34],
A [0,40–0,50], B [0,70–0,82], C [0,95–1,05]; pair-like = B-cap có g
trong [0,70–0,76)). Script `analyze107i5.py` kế thừa `analyze106h4.py`
(chỉ đổi pool xuất phát, danh sách tag, gốc D floor/heterogeneity).
Gộp với số đã công bố F6+G7+H4 (prereg §1).

| lượt | B n | c0 (n, pair-like) | c1 | c2 (n, pair-like) |
|---|---|---|---|---|
| F6+G7+H4 (cũ, đã công bố) | 188 | 72 (5) | 62 (6) | 54 (2) |
| chr-blur-r41c0 (1-clip) | 2 | 2 (1) | — | — |
| chr-blur-r41 (3-clip) | 3 | 1 (0) | 1 (0) | 1 (1) |
| chr-blur-r42c0 (1-clip) | 3 | 3 (0) | — | — |
| chr-blur-r42 (3-clip) | 3 | 2 (0) | 1 (0) | 0 (0) |
| chr-blur-r43c0 (1-clip) | 0 | 0 (0) | — | — |
| chr-blur-r43 (3-clip) | 8 | 3 (1) | 3 (1) | 2 (0) |
| **I5 mới** | **19** | **11 (2)** | **5 (1)** | **3 (1)** |
| **Gộp F6+G7+H4+I5** | **207** | **83 (7 = 8,4%)** | **67 (7)** | **57 (3 = 5,3%)** |

- **Fisher một phía (c0>c2) gộp: p=0,3584 — KHÔNG ĐẠT bar p<0,05**
  (hai phía tham khảo: p=0,5282). Gần như không đổi so với H4
  (p=0,3545): I5 thêm 11 B-cap c0 (2 pair-like) và 3 B-cap c2
  (1 pair-like) — tỉ lệ pair-like c0 nhích 6,9% → 8,4%, c2 nhích
  3,7% → 5,3%, hiệu số giữ nguyên +3,2pp. 95% CI Newcombe
  [−6,9pp, +11,9pp] bao cả 0 lẫn hiệu ứng gốc (+11pp).
- **Power:** tại hiệu ứng gốc post-hoc (17,1% vs 6,1%) với n=83/57:
  normal-approx **62%** (H4: 59%), Fisher-exact mô phỏng 20.000 lần
  (seed 20261113) **57%** (H4: 53%). Tại hiệu ứng quan sát (8,4% vs
  5,3%): normal-approx chỉ **17%**. Cỡ mẫu cần cho 80% power Fisher vẫn
  ~115/nhóm. **Còn thiếu: c0 32, c2 58 B-cap.**
- **Tốc độ lấy mẫu đợt này quá chậm để đóng B-band:** 6 lượt chỉ cho
  11 B c0 + 3 B c2 (trung bình ~1,8 B c0/lượt c0-only — so với 7,5 của
  H4 và 24 của G7). Với tốc độ này cần ~18 lượt c0-only nữa cho c0 và
  ~19 lượt 3-clip nữa cho c2 — **không khả thi trong một đợt**; cần
  đợt sau chạy lúc máy yên hơn (ít luồng song song) hoặc giảm tải nền
  trước khi đo. Không được "bù" bằng cách đổi thiết kế giữa chừng.
- **Lưu ý đọc số:** r41c0 chỉ 5 cap nhưng cho 2 B (1 pair-like) —
  tỉ lệ pair-like 1/2 của lượt này là nhiễu mẫu nhỏ, không phải tín
  hiệu; đừng đọc riêng. r43c0 có 0 blend tick nên 0 B-cap — lượt này
  đóng góp 0 cho pool B-band (chỉ 4 cap C) nhưng vẫn đếm vào D floor
  (0 D trong 4 cap).

---

## §2. Cờ heterogeneity c0-only vs c0 3-clip — vẫn không có ý nghĩa

| pool | c0-only (pair-like/n) | c0 3-clip (pair-like/n) | Fisher hai phía |
|---|---|---|---|
| G7+H4 (đã công bố) | 4/39 (10,3%) | 1/33 (3,0%) | p=0,3662 |
| I5 riêng | 1/5 (20,0%) | 1/6 (16,7%) | p=1,0 |
| **Gộp G7+H4+I5** | **5/44 (11,4%)** | **2/39 (5,1%)** | **p=0,4388** |

Lệch vẫn cùng hướng (c0-only giàu pair-like hơn) nhưng không có ý nghĩa
thống kê; I5 riêng gần như cân bằng (1/5 vs 1/6). **Kết luận: không có
dấu hiệu 2 thiết kế không hoán đổi được; vẫn gộp pool theo prereg.**
Theo dõi tiếp ở đợt sau — nhưng với mẫu I5 quá nhỏ, cờ này không thể
phân giải trong đợt này.

---

## §3. D floor — 0/2429, CI trên 0,124%

| nguồn | cap dùng | D |
|---|---|---|
| Post-fix trước I5 (C4+D4+E6+F6+G7+H4) | 2371 | 0 |
| I5 stripes (r41c0+r41+r42c0+r42+r43c0+r43) | 58 | 0 |
| **Gộp post-fix** | **2429** | **0** |

- Fisher một phía vs pre-fix 28/1547: **p=2,86e-12**. 95% CI trên
  (rule of three): **0,124%** (H4: 0,127%). D floor vững hơn sau mỗi
  đợt; không có D nào trong 58 cap I5 (kể cả lượt r43c0 không blend).

---

## §4. Kiểm chứng (cây cuối, md5 ced42efd, ~18:42Z)

- `tsc --noEmit` (apps/web): **0 lỗi** (exit 0).
- `vite build`: **pass, 32,94s** (chỉ cảnh báo chunk >500 kB có sẵn từ trước).
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- Pad-oldest còn nguyên (marker `motionBlurPadGhostCount` +
  `lastDrawnPaddedGhosts`); `motionBlurBlendPlan` không đổi.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §5. Nợ còn lại

1. **B-band c0: VẪN MỞ (luồng này).** p=0,3584, power 57–62% tại hiệu
   ứng gốc; còn thiếu 32 c0 + 58 c2 B-cap tới ~115/nhóm. Đợt sau cần
   máy yên hơn: I5 chứng minh chạy 8–10 luồng song song cùng lúc làm
   probe B-band đói mẫu (67 cap/6 lượt vs 387 cap/4 lượt của H4) —
   nên xếp lượt B-band vào cửa yên hoặc giảm số luồng chạy probe
   đồng thời. Cờ heterogeneity vẫn không có ý nghĩa (p=0,44) — đợt sau
   gộp bình thường, chỉ theo dõi.
2. **Hạ tầng: giới hạn inotify watchers (63747) là điểm nghẽn thật
   khi nhiều vite dev server chạy song song** — đợt 1 mất 5/6 lượt vì
   ENOSPC. Đợt sau: tránh chạy nhiều probe vite cùng lúc, hoặc tăng
   `fs.inotify.max_user_watches` ở cấp hệ thống (ngoài phạm vi luồng
   này — cần người có quyền quyết).
3. **Cụm A stripes: VẪN MỞ (luồng I8, không thuộc phạm vi I5).**
   Strip không nhận diện được stripes (H4 §4); giả thuyết E6 chưa
   chứng minh/bác; lệch g triple +0,03 chưa giải thích được.
4. Các nợ ngoài phạm vi I5 (giữ nguyên từ LIMITS gộp đợt 106 §7):
   G1 deinterlace (chờ user quyết metric G5/M2), 2 MiB, ghost F8,
   F5 Re-arm (chờ A/B RAM cao), EPERM probe #26 + khoảng mù #25,
   birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 107 I5)

- `apps/web/scripts/probe107i5-frame-parity.mjs` — probe copy
  probe106h4 (config `scroll-blur`, stimulus stripes-scroll.mp4,
  F3 tắt; `WITH_BLUR` đã đúng `scroll-blur || noise-blur`;
  SCRATCH round107-i5; `node --check` OK).
- `docs/PHASE9_ROUND107_I5_BLUR_LIMITS.md` — file này.
- `apps/web/public/stripes-scroll.mp4` — stimulus nhị phân, KHÔNG stage
  (theo luật binary).
- Dữ liệu thô + analyzer nằm ngoài repo, tại
  `hidden_files/round107-i5/` (không stage): prereg, driver + log
  (đợt 1 + retry), `analyze107i5.py` + `analysis107i5.json/.txt`.
- Không push GitHub, không release/tag (giữ release gate).
