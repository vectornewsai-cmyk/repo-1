# PHASE9_ROUND108_J4_BLUR_LIMITS.md — Blur B-band c0 trong cửa yên, đợt 108, luồng J4

**Ngày:** 13–14/11/2026. **Luồng:** J4 (Phase 9 đợt 108, nhóm YÊN). **Chủ đề:** Blur
B-band c0 — bổ sung B-cap TRONG CỬA YÊN (nợ LIMITS gộp đợt 107 §4 mục 6).
**Bối cảnh:** xem docs/PHASE9_ROUND107_I5_BLUR_LIMITS.md (§1–§3) và
docs/PHASE9_ROUND107_LIMITS.md §1 (I5) + §4 mục 6; prereg
`hidden_files/round108-j4/prereg-j4.md` (viết TRƯỚC mọi lượt probe).

**Kết quả lớn nhất đợt này:**
- **B-band c0: ĐẠT BAR — Fisher một phía gộp p=0,02655 < 0,05.** Gộp
  F6+G7+H4+I5+J4: c0 22/184 (12,0%) vs c2 5/108 (4,6%), Fisher một phía
  **p=0,02655** (hai phía p=0,03813) — so với I5 (p=0,3584) là bước nhảy
  quyết định. Hiệu số +7,3pp, 95% CI Newcombe [+0,4pp, +13,4pp] — lần đầu
  không còn bao 0. Power tại hiệu ứng gốc (17,1% vs 6,1%): normal-approx
  88%, Fisher-exact mô phỏng 86%; tại hiệu ứng quan sát 69%. **c0 đã vượt
  mục tiêu ~115/nhóm (184); c2 còn thiếu 7 B-cap (108/115).**
- **Đợt này lấy mẫu TỐT — 190 B-cap mới từ 8 lượt** (kỳ vọng prereg ~7–24 B
  c0/lượt c0-only; thực tế 6–23). Tổng 804 cap thô / 714 cap dùng, so với
  67 cap thô / 58 cap dùng của I5 (6 lượt). Nguyên nhân: đo trong cửa yên
  thật sau reboot #34 (load lúc phát 1,28–2,74, RAM khả dụng 1,1–2,9 GB,
  psOther 13–18, không sóng tải 26–28, không ENOSPC) — xác nhận giả thuyết
  của I5 rằng đói mẫu đợt 107 là do tải, không phải do phương pháp.
- **Cờ heterogeneity VẪN KHÔNG có ý nghĩa.** Gộp G7+H4+I5+J4: c0-only 14/111
  vs c0 3-clip 8/73, Fisher hai phía p=0,8192 (I5: p=0,4388). J4 riêng:
  9/67 vs 6/34, p=0,5678. Vẫn gộp pool theo prereg.
- **D floor gộp: 0/3143** (0/2429 + J4 0/714); Fisher vs pre-fix 28/1547:
  p=2,76e-14; 95% CI trên (rule of three) 0,095%.

**Build:** mọi lượt probe chạy trên `ced42efd` (không đổi md5 lần nào,
không có lượt "lai"). F3 tap+relabel TẮT trong mọi lượt (baseline
C4/D4/E6/F6/G7/H4/I5). **Không sửa production trong luồng này** (chỉ thêm
probe + analyzer + LIMITS này). Không push GitHub, không release/tag,
không TTS 39, không birefnet.

---

## §0. Bối cảnh chạy — cửa yên thật sau reboot #34, 0 sự cố

- **Phối hợp tải (đúng prereg §0):** J4 thuộc nhóm YÊN, đo ngay khi nhận
  việc. Reboot #34 = 2026-11-13 20:34:17Z (boot `cc460738…`); driver bắt
  đầu 20:41:22Z (uptime 425 s), lượt cuối xong 20:51:44Z — **không có
  reboot nào cắt ngang đợt** (boot không đổi từ đầu tới cuối, kiểm tra
  cuối 20:52Z). Cổng chờ yên trước mỗi lượt: load1 < 5 đều đạt ngay lần
  check đầu (2,21 / 1,79 / 1,24 / 2,82 / 2,52 / 2,05 / 1,73 / 1,68) —
  **0 lượt hoãn, 0 lượt chờ quá 120 s**. Probe còn có phase chờ yên nội
  bộ trước phát (tối đa ~90 s/lượt) nhưng load lúc phát vẫn 1,28–2,74.
- **Không sự cố hạ tầng:** 8/8 lượt exit 0, không ENOSPC (chỉ 1 vite
  chạy tại một thời điểm, cổng 5590; max_user_watches vẫn 63747 nhưng
  không còn nhiều vite song song vì các luồng đợt 108 khác chưa mở vite
  lúc J4 đo), không lượt nào phải retry.
- **Cờ done:** `round108-j4-done` CHỈ tạo sau khi mọi lượt probe + phân
  tích + LIMITS này đã xong (đúng quy định mới từ bài học I1/C3b đợt
  107) — nhóm nặng J3/J7 chờ cờ này.
- **Tải lúc phát từng lượt:** r44c0 1,94; r45c0 1,28; r44 1,84; r45 2,74;
  r46c0 1,96; r46 1,84; r47c0 1,99; r47 1,36. RAM khả dụng lúc phát
  1.072–2.273 MB. psOther 13–18.

| lượt | engine | config | cap thô | cap dùng* | pumpN | blendTickN | B | load lúc phát |
|---|---|---|---|---|---|---|---|---|
| chr-blur-r44c0 | chr | scroll-blur, `--nclips 1` | 84 | 75 | 84 | 90 | 23 | 1,94 |
| chr-blur-r45c0 | chr | scroll-blur, `--nclips 1` | 86 | 77 | 86 | 100 | 22 | 1,28 |
| chr-blur-r44 | chr | scroll-blur | 181 | 163 | 178 | 192 | 46 | 1,84 |
| chr-blur-r45 | chr | scroll-blur | 165 | 146 | 169 | 174 | 41 | 2,74 |
| chr-blur-r46c0 | chr | scroll-blur, `--nclips 1` | 69 | 63 | 69 | 79 | 16 | 1,96 |
| chr-blur-r46 | chr | scroll-blur | 127 | 109 | 125 | 130 | 26 | 1,84 |
| chr-blur-r47c0 | chr | scroll-blur, `--nclips 1` | 40 | 34 | 41 | 43 | 6 | 1,99 |
| chr-blur-r47 | chr | scroll-blur | 52 | 47 | 53 | 44 | 10 | 1,36 |
| **J4 mới** | | | **804** | **714** | | | **190** | |

\* "cap dùng" = cap có baseline noblur cho (clip, frameIdx); cap còn lại
bị loại khỏi phân tích band (tổng 90) — cùng quy tắc G7, không phải lỗi
dữ liệu. Không lượt nào bị loại (8/8 exit 0, có results.json).

**Lưu ý đọc số:** hai lượt cuối (r47c0 40 cap, r47 52 cap) lấy mẫu ít hơn
rõ rệt so với 6 lượt đầu (69–181 cap) dù load lúc phát vẫn thấp
(1,99 / 1,36) — pumpN/blendTickN cũng thấp tương ứng (41–53). Nguyên
nhân chưa xác định (không phải tải đo được; có thể do các luồng đợt 108
khác bắt đầu khởi động nền cuối đợt, hoặc dao động tự nhiên của rAF).
Không ảnh hưởng kết luận gộp: cả hai lượt vẫn đóng góp 16 B-cap (8 c0,
6 c1, 2 c2) và 0 D.

---

## §1. B-band c0 — kiểm chứng gộp: ĐẠT BAR p<0,05

Phương pháp: ĐÚNG phương pháp G7 §B (baseline noblur W3/Z5 theo
(clip, frameIdx); g = std(cap px 96×54)/baseline; BANDS D [0,27–0,34],
A [0,40–0,50], B [0,70–0,82], C [0,95–1,05]; pair-like = B-cap có g
trong [0,70–0,76)). Script `analyze108j4.py` kế thừa `analyze107i5.py`
(chỉ đổi pool xuất phát, danh sách tag, gốc D floor/heterogeneity, seed
mô phỏng 20261114). Gộp với số đã công bố F6+G7+H4+I5 (prereg §1).

| lượt | B n | c0 (n, pair-like) | c1 | c2 (n, pair-like) |
|---|---|---|---|---|
| F6+G7+H4+I5 (cũ, đã công bố) | 207 | 83 (7) | 67 (7) | 57 (3) |
| chr-blur-r44c0 (1-clip) | 23 | 23 (5) | — | — |
| chr-blur-r45c0 (1-clip) | 22 | 22 (3) | — | — |
| chr-blur-r44 (3-clip) | 46 | 8 (1) | 14 (1) | 24 (1) |
| chr-blur-r45 (3-clip) | 41 | 16 (4) | 11 (1) | 14 (1) |
| chr-blur-r46c0 (1-clip) | 16 | 16 (1) | — | — |
| chr-blur-r46 (3-clip) | 26 | 8 (1) | 7 (0) | 11 (0) |
| chr-blur-r47c0 (1-clip) | 6 | 6 (0) | — | — |
| chr-blur-r47 (3-clip) | 10 | 2 (0) | 6 (0) | 2 (0) |
| **J4 mới** | **190** | **101 (15)** | **38 (2)** | **51 (2)** |
| **Gộp F6+G7+H4+I5+J4** | **397** | **184 (22 = 12,0%)** | **105 (9)** | **108 (5 = 4,6%)** |

- **Fisher một phía (c0>c2) gộp: p=0,02655 — ĐẠT bar p<0,05**
  (hai phía tham khảo: p=0,03813). So với I5 (p=0,3584): J4 thêm 101 B-cap
  c0 (15 pair-like) và 51 B-cap c2 (2 pair-like) — tỉ lệ pair-like c0
  nhích 8,4% → 12,0%, c2 gần như đứng yên 5,3% → 4,6%, hiệu số tăng
  +3,2pp → +7,3pp. 95% CI Newcombe [+0,4pp, +13,4pp] — lần đầu loại 0
  khỏi khoảng tin cậy.
- **Power:** tại hiệu ứng gốc post-hoc (17,1% vs 6,1%) với n=184/108:
  normal-approx **88%** (I5: 62%), Fisher-exact mô phỏng 20.000 lần
  (seed 20261114) **86%** (I5: 57%). Tại hiệu ứng quan sát (12,0% vs
  4,6%): normal-approx **69%** (I5: 17%). Cỡ mẫu mục tiêu ~115/nhóm đã
  đạt ở c0 (184) và gần đạt ở c2 (108). **Còn thiếu: c0 0, c2 7 B-cap.**
- **Caveat trung thực (đọc kèm kết luận ĐẠT):** p một phía 0,0266 không
  cách xa ngưỡng 0,05, và biên dưới CI Newcombe chỉ +0,4pp — hiệu ứng
  là có thật theo bar prereg nhưng còn khiêm tốn, và c2 vẫn thiếu 7
  B-cap so với mục tiêu ~115/nhóm. Một lượt bổ sung nhỏ (1–2 lượt
  3-clip, ~10–20 B-cap c2) sẽ củng cố thêm; nhưng theo bar đã đăng ký
  trước, **B-band c0 được xác nhận ĐẠT tại đợt này** — không cần đợi
  lượt bổ sung để tuyên bố.
- **Tốc độ lấy mẫu:** 8 lượt cho 101 B c0 + 51 B c2 (trung bình ~16,8 B
  c0/lượt c0-only — so với 1,8 của I5 và 7,5 của H4). Cửa yên là yếu tố
  quyết định: cùng protocol, cùng máy, chỉ khác tải nền.

---

## §2. Cờ heterogeneity c0-only vs c0 3-clip — vẫn không có ý nghĩa

| pool | c0-only (pair-like/n) | c0 3-clip (pair-like/n) | Fisher hai phía |
|---|---|---|---|
| G7+H4+I5 (đã công bố) | 5/44 (11,4%) | 2/39 (5,1%) | p=0,4388 |
| J4 riêng | 9/67 (13,4%) | 6/34 (17,6%) | p=0,5678 |
| **Gộp G7+H4+I5+J4** | **14/111 (12,6%)** | **8/73 (11,0%)** | **p=0,8192** |

Lệch giữa hai thiết kế gần như biến mất sau khi gộp J4 (12,6% vs 11,0%,
p=0,82 — xa ngưỡng 0,05). J4 riêng thậm chí đảo hướng (3-clip giàu
pair-like hơn, 17,6% vs 13,4%, p=0,57). **Kết luận: hai thiết kế hoán
đổi được; vẫn gộp pool theo prereg. Cờ heterogeneity ĐÓNG — không cần
theo dõi thêm ở đợt sau** (chênh lệch đã về gần 0 với n=184).

---

## §3. D floor — 0/3143, CI trên 0,095%

| nguồn | cap dùng | D |
|---|---|---|
| Post-fix trước J4 (C4+D4+E6+F6+G7+H4+I5) | 2429 | 0 |
| J4 stripes (r44c0+r45c0+r44+r45+r46c0+r46+r47c0+r47) | 714 | 0 |
| **Gộp post-fix** | **3143** | **0** |

- Fisher một phía vs pre-fix 28/1547: **p=2,76e-14**. 95% CI trên
  (rule of three): **0,095%** (I5: 0,124%). D floor vững hơn sau mỗi
  đợt; không có D nào trong 714 cap J4.

---

## §4. Kiểm chứng (cây cuối, md5 ced42efd, ~20:53Z)

- `tsc --noEmit` (apps/web): **0 lỗi** (exit 0).
- `vite build`: **pass, 10,07 s** (chỉ cảnh báo chunk >500 kB có sẵn từ trước).
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass**.
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- Pad-oldest còn nguyên; `motionBlurBlendPlan` không đổi.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §5. Nợ còn lại

1. **B-band c0: ĐẠT BAR tại đợt này (luồng này).** Fisher một phía gộp
   p=0,02655, hai phía p=0,03813, CI Newcombe loại 0. Nợ nhỏ còn lại:
   c2 thiếu 7 B-cap tới ~115/nhóm; một lượt bổ sung 1–2 lượt 3-clip
   lúc yên sẽ củng cố thêm (không bắt buộc để tuyên bố ĐẠT). Cờ
   heterogeneity ĐÓNG (p=0,82).
2. **Caveat lấy mẫu cuối đợt:** r47c0/r47 chỉ 40/52 cap thô (so với
   69–181 lượt trước) dù load lúc phát thấp — nguyên nhân chưa xác
   định; đợt sau ghi thêm psOther + load15 lúc phát để tách yếu tố.
3. **Hạ tầng:** ENOSPC không tái hiện đợt này (1 vite tại một thời
   điểm) — nhưng max_user_watches vẫn 63747; đợt sau vẫn tránh nhiều
   vite song song.
4. Các nợ ngoài phạm vi J4 (giữ nguyên từ LIMITS gộp đợt 107 §4):
   G1 deinterlace (chờ user quyết), mù #22/#24 (chờ user quyết),
   Re-arm A/B tắt E4, 2 MiB (thí nghiệm phân biệt queue2), Zombie gate
   (b) (lượt thứ 6 chưa quan sát được), cụm A stripes (E6), Ghost
   C3b chạy lại lúc yên, Harness E1 (cần ≥7 lần tải nặng), EPERM probe
   #27 + mù #26, birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39
   (CẤM kiểm lại), `ci-security.yml` 403 (chờ user), release gate giữ
   nguyên.

---

## File đổi/thêm (đợt 108 J4)

- `apps/web/scripts/probe108j4-frame-parity.mjs` — probe copy
  probe107i5 (config `scroll-blur`, stimulus stripes-scroll.mp4,
  F3 tắt; SCRATCH round108-j4; `node --check` OK).
- `docs/PHASE9_ROUND108_J4_BLUR_LIMITS.md` — file này.
- `apps/web/public/stripes-scroll.mp4` — stimulus nhị phân, KHÔNG stage
  (theo luật binary).
- Dữ liệu thô + analyzer nằm ngoài repo, tại
  `hidden_files/round108-j4/` (không stage): prereg, driver + log,
  `analyze108j4.py` + `analysis108j4.json/.txt`, 8 thư mục lượt
  `chr-blur-r44c0…r47` (mỗi lượt `frame-parity-results.json` +
  `frame-parity-log.txt` + `vite-attempt*.log`).
- Không push GitHub, không release/tag (giữ release gate).
