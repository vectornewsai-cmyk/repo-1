# PHASE9_ROUND108_J5_BLUR_CLUSTERA_LIMITS.md — Blur cụm A stripes, đợt 108, luồng J5

**Ngày:** 13–14/11/2026. **Luồng:** J5 (Phase 9 đợt 108). **Chủ đề:** Blur cụm A
— chạy lại probe stripes-code lúc MÁY YÊN (nợ LIMITS gộp đợt 107 §4 mục 7;
I8 §6 mục 1–2).
**Bối cảnh:** docs/PHASE9_ROUND107_I8_BLUR_CLUSTERA_LIMITS.md (toàn bộ),
docs/PHASE9_ROUND107_LIMITS.md §1 mục I8 + §4 mục 7,
hidden_files/round108-j5/prereg-j5.md (viết TRƯỚC mọi lượt probe) +
prereg-j5-addendum-r49.md (viết TRƯỚC khi phát r49).
**Build:** probe chạy trên `ced42efd` cả 6 lượt (md5 không đổi; không sửa
production trong luồng này). F3 tap+relabel TẮT trong mọi lượt. Không push
GitHub, không release/tag, không TTS 39, không birefnet.

**Kết quả lớn nhất đợt này:**
- **E6 VẪN MỞ theo luật prereg — nhưng 6/6 sự kiện đều là Nhãn-đúng.**
  Thu được **6 sự kiện band A'** (bar cần ≥8), **cả 6 đều có content gap
  6–7 với 3 content phân biệt (Nhãn-đúng), 0 sự kiện E6-ủng hộ, 0 ca
  Khác**. Theo luật prereg I8 §3 (cần ≥7/8 mới verdict), E6 chưa thể bác
  chính thức — còn thiếu 2 sự kiện. Nhưng hướng bằng chứng là rõ ràng:
  nếu 2 sự kiện tiếp theo cũng nhãn-đúng thì đạt 8/8 → bác E6.
- **H-alt-weights được ủng hộ MẠNH trên dữ liệu lớn (n=803):** median
  |g_live − g_pred| với trọng số đều là **0,064** (mean signed +0,055),
  với w=(0,20, 0,35, 0,45) chỉ còn **0,025** (mean signed +0,012) —
  khớp hơn ~2,6×. Chưa phải chứng minh dứt khoát (có 1 outlier lớn,
  xem §3).
- **Lệch g triple cập nhật: +0,051 với trọng số đều (n=505 triple liên
  tiếp), H-alt gần như đóng lệch (−0,009).** Số +0,029 của I8 không tái
  hiện nguyên vẹn trên stimulus mới (xem §4).
- **Hiệu chuẩn "presented trong ±1" theo tải — ĐẠT CẢ 2 MỨC:** yên-sâu
  (load <2, 901 tick): trung vị offset +0, **99,8% trong ±1**; yên-vừa
  (load 2,5, lượt r49 sysload, 143 tick): trung vị +0, **99,3% trong
  ±1**. Đối chiếu I8 tải nặng (load 27,9): trung vị −4, chỉ 11% trong
  ±1. Bar ±1 giữ tới load ~2,5; điểm gãy nằm đâu đó giữa 2,5 và 27,9.
- **F2 ĐẠT:** strip nhận diện 1044/1044 tick (100%), presented trong
  ±1: 1041/1044 (99,7%).

---

## §0. Bối cảnh chạy (máy yên thật — khác hẳn I8)

- **Boot cc460738** (reboot #34, 2026-11-13 20:34:17Z theo `uptime -s`)
  ổn định suốt lượt; **KHÔNG có reboot** trong lượt (gap #33→#34 đã
  chốt; #35 chưa xảy ra tới cuối lượt 21:14Z).
- **Cổng yên J5 (prereg §1): 0 lượt hoãn.** Chỉ 1 lần phải chờ: r47
  lúc gọi load1=6,01, chờ 20 s xuống 4,37 rồi phát (ghi trong driver
  log). Mọi lượt khác phát ngay (load1 0,58–3,52). Không lượt nào hết
  120 s mà load vẫn ≥5.
- **RAM khả dụng lúc phát:** 1015–2790 MB (r47 thấp nhất 1214 MB lúc
  phát — lượt này thưa nhất: 94 cap/91 tick; r49: 1015 MB).
- **Nhóm YÊN đo trước:** J5 phát lượt đầu 20:42Z, ngay khi nhận việc.
  Các luồng đợt 108 khác vẫn chạy xen kẽ (vite sibling J6 pid 17288,
  vite port 5580 pid 21182) — gây ra 3 attempt ENOSPC, xem §5.

| lượt | engine | config | nclips | cap | tick | load lúc phát | load cuối | exit |
|---|---|---|---|---|---|---|---|---|
| chr-code-noblur-r45 | chr | stripes-code-noblur | 1 | 80 | 0* | 3,05 | — | 0 |
| chr-code-blur-r45 | chr | stripes-code-blur | 3 | 240 | 299 | 1,86 | 1,68 | 0 |
| chr-code-blur-r46 | chr | stripes-code-blur | 3 | 204 | 230 | 1,43 | 1,52 | 0 |
| chr-code-blur-r47 | chr | stripes-code-blur | 3 | 94 | 91 | 1,96 | 1,89 | 0 |
| chr-code-blur-r48 | chr | stripes-code-blur | 3 | 252 | 281 | 1,67 | 1,41 | 0 |
| chr-code-blur-r49 | chr | stripes-code-blur (+sysload 1) | 3 | 147 | 143 | 1,95 | 2,50 | 0 |

\* noblur không có đường blend nên không có blendTick (đúng thiết kế).
Tổng blur: **937 cap / 1044 tick / 804 sự kiện phân biệt**. So với I8
(35 cap / 19 tick): dữ liệu nhiều hơn ~27× về cap, ~55× về tick — máy
yên đã giải quyết đúng vấn đề I8 gặp.

---

## §1. Bar (a) — verdict E6: VẪN MỞ (thiếu 2 sự kiện), hướng Nhãn-đúng 6/6

- Sự kiện blend phân biệt có đủ content (rVFC, dedup như G7/H4): **804**
  (r45: 233, r46: 184, r47: 44, r48: 252, r49: 91).
- Label gap hiệu chỉnh 6 (mọi band): **9 sự kiện phân biệt**. Trong band
  A' [0,36, 0,48]: **6 sự kiện** (bar ≥8 → **KHÔNG ĐẠT**).
- Phân loại band A': **Nhãn-đúng 6, E6-ủng hộ 0, Khác 0.**

| # | lượt/clip | pres (nhãn→content) | ghosts (nhãn→content) | label gap | content gap | g_live | loại |
|---|---|---|---|---|---|---|---|
| E1 | r45 c0 pres28 | 28→28 | (21→21), (22→22) | 6 | 6 | 0,473 | Nhãn-đúng |
| E2 | r45 c0 pres71 | 71→71 | (64→64), (65→65) | 6 | 6 | 0,462 | Nhãn-đúng |
| E3 | r49 c0 pres11 | 11→11 | (3→3), (5→5) | 6 | 6 | 0,462 | Nhãn-đúng |
| E4 | r49 c0 pres41 | 41→41 | (33→33), (35→35) | 6 | 6 | 0,472 | Nhãn-đúng |
| E5 | r49 c2 pres33 | 33→34 | (26→26), (27→27) | 6 | 7 | 0,463 | Nhãn-đúng |
| E6 | r49 c2 pres84 | 84→84 | (77→77), (78→78) | 6 | 6 | 0,460 | Nhãn-đúng |

- **Verdict theo luật prereg (đăng ký trước): E6 VẪN MỞ.** Luật yêu cầu
  ≥7/8 sự kiện cùng loại mới verdict; chỉ có 6 sự kiện nên không ép
  verdict. Nhưng ghi rõ hướng bằng chứng: **6/6 Nhãn-đúng, 0/6
  E6-ủng hộ** — nếu 2 sự kiện tiếp theo cũng nhãn-đúng thì đạt 8/8 và
  E6 bị bác theo đúng luật. Không có sự kiện nào ủng hộ E6 trong cả
  804 sự kiện phân biệt (không chỉ trong band A').
- **Vì sao gap-6 hiếm dù máy yên:** phân bố label_gap_corr gộp 1044
  tick: gap 1 chiếm 761 (73%), gap 2: 148, gap 3: 55, gap 4: 16,
  gap 5: 20, **gap 6: chỉ 13 tick**, gap ≥7: 31 tick. Máy yên → pump
  capture dày → ghost mới nhất chỉ kém presented ~1 frame. Gap-6 chỉ
  xuất hiện khi pump bỏ nhịp. Đây là nghịch lý của thiết kế: càng yên
  càng ít sự kiện quyết định. **Lượt r49 (sysload nhẹ) cho 4/6 sự kiện
  band A'** — tải vừa phải làm thưa capture và tăng tỉ lệ gap-6 mà
  nhãn vẫn đúng (offset trung vị +0, xem §4). Đợt sau muốn đủ bar thì
  chạy lượt sysload nhẹ là cách hiệu quả nhất, không phải chạy thêm
  lượt yên-sâu.
- 3 sự kiện gap-6 ngoài band A' (9 − 6 = 3): không liệt kê riêng ở
  đây (xem analyze108j5.json `n_gap6_all`=9); chúng không đổi verdict
  vì luật chỉ tính trong band A'.

## §2. F2 — strip live: ĐẠT

Gộp 5 lượt blur (rVFC): tick 1044; presented strip nhận diện 1044/1044
(100%, bar ≥80%); trong ±1: 1041/1044 (99,7% của số nhận diện, bar
≥80%); ghost nhận diện đủ cả 2: 1044/1044. **F2: ĐẠT.** (Chi tiết theo
lượt xem §4 — F2 nay đọc theo mức tải.)

## §3. Bar (b) — kiểm tra chéo cơ chế blend: H-alt khớp hơn ~2,6×

Với 803 sự kiện có ≥2 content phân biệt (strip-xác nhận):

| | median \|g_live − g_pred\| | mean signed |
|---|---|---|
| trọng số đều [1,1,1]/3 | **0,064** | **+0,055** |
| H-alt w=(0,20, 0,35, 0,45) | **0,025** | **+0,012** |

- Trọng số đều lệch một chiều +0,055 (g_live luôn cao hơn dự đoán đều)
  — cùng hướng với lệch triple +0,029/+0,051 (§4). H-alt gần như triệt
  tiêu lệch có hệ thống (+0,012) và giảm median |Δ| từ 0,064 → 0,025.
- **Kết luận: H-alt-weights được ủng hộ mạnh, nhưng CHƯA chứng minh dứt
  khoát.** Lý do: (1) w được chọn post-hoc trên dữ liệu cũ (I8 §4.3),
  việc nó khớp trên dữ liệu mới là bằng chứng độc lập có giá trị nhưng
  chưa phải kiểm chứng mù; (2) có 1 outlier lớn: r49 c2 pres33
  (content [26, 27, 34], content gap 7): g_live 0,463 vs g_pred(alt)
  **0,250** (|Δ|=0,213) trong khi g_pred(đều) 0,395 (|Δ|=0,068) —
  H-alt sai nặng ở ca gap-7 này (trọng số 0,45 đặt lên current xa
  ghost nhất làm std sụt mạnh). 5/6 sự kiện band A' còn lại H-alt khớp
  tốt hơn đều (vd E1: 0,475 vs 0,390, live 0,473; E2: 0,468 vs 0,389,
  live 0,462).
- Hệ quả: nếu blend thật dùng H-alt thì code `motionBlurBlendPlan`
  (chứng minh bằng quy nạp cho trung bình đều) hoặc đường pump capture
  phải có gì đó làm lệch trọng số hiệu dụng — vẫn mâu thuẫn với code,
  ghi là nợ mở, không suy đoán thêm. Cần quét lại w trên chính dữ liệu
  J5 (n=803) xem w tối ưu có trùng (0,20, 0,35, 0,45) không — chưa làm
  trong luồng này (giữ cho đợt sau, tránh post-hoc chồng post-hoc).

## §4. Bar (c) + Bar (d)

### Bar (c) — lệch g triple: +0,051 (đều) / −0,009 (H-alt)

- Sự kiện 3 content liên tiếp (c, c+1, c+2), n=**505**: g_live mean
  **0,569** (med 0,476 — phân bố bimodal: mode thấp ~0,46–0,48 và mode
  cao ~0,75, giống bimodal stripes thuần I8 §4.1) vs g_pred đều mean
  0,518 → lệch **+0,051**; vs g_pred H-alt mean 0,578 → lệch **−0,009**.
- So với I8 (+0,029 trên triple thuần n=43, stimulus/refs khác): lệch
  với trọng số đều LỚN HƠN trên stimulus mới (+0,051 vs +0,029), nhưng
  H-alt gần như đóng lệch cả hai lần (−0,009 ở đây; I8 dự đoán 0,621 vs
  đo 0,625, lệch −0,004). Nhất quán với §3: trọng số hiệu dụng lệch về
  current mới (0,45) là ứng viên giải thích chung cho cả hai lệch.
  So sánh có điều kiện vì stimulus/refs khác (stripes-code ở đây).

### Bar (d) — hiệu chuẩn "presented trong ±1" theo tải: ĐẠT CẢ 2 MỨC

| mức tải | lượt | n tick | pres off trung vị (dải) | trong ±1 | ghost off trung vị |
|---|---|---|---|---|---|
| yên-sâu (load <2) | r45 | 299 | +0 (−1..+1) | 299/299 (100%) | +0 |
| yên-sâu (load <2) | r46 | 230 | +0 (−2..+1) | 229/230 (99,6%) | +0 |
| yên-sâu (load <2) | r47 | 91 | +0 (−2..+1) | 90/91 (98,9%) | +0 |
| yên-sâu (load <2) | r48 | 281 | +0 (0..+1) | 281/281 (100%) | +0 |
| **yên-sâu gộp** | | **901** | **+0** | **899/901 (99,8%)** | **+0** |
| yên-vừa (load 2,5) | r49 (sysload 1) | 143 | +0 (−1..+2) | 142/143 (99,3%) | +0 |
| tải nặng (I8, load 27,9) | r43/r44 | 19 | **−4** (−15..−1) | 2/19 (**11%**) | +3 |

- **Hiệu chuẩn chốt:** bar "presented trong ±1" (hiệu chuẩn trên lượt
  yên G7) **giữ tới load ~2,5** (99,3–99,8% trong ±1, trung vị +0 cả
  presented lẫn ghost). Điểm gãy nằm đâu đó giữa load 2,5 và 27,9 —
  chưa đo được điểm gãy chính xác (cần thêm mức tải trung gian, vd
  load ~8–15, ngoài phạm vi luồng này).
- Lưu ý phương pháp: mức tải r49 xác định bằng max(loadAtPlay=1,95,
  load cuối lượt=2,50) vì hog sysload bật SAU khi ghi loadAtPlay
  (xem phụ lục prereg). Load cuối lượt lấy từ `envAfter.uptime`
  ("load average: 2.50, ...") — analyzer đã vá parser (bản đầu đọc
  nhầm token giờ "21:11:13" → None, đã sửa và chạy lại).
- Lượt noblur r45 phát lúc load 3,05 (yên-vừa) nhưng không có
  blendTick nên không đóng góp Bar (d).

---

## §5. Sự cố hạ tầng trong lượt (ENOSPC + mtime preview.tsx)

- **ENOSPC — 3 attempt fail, retry đều cứu được:**
  - r47 attempt-1 + r48 attempt-1 (21:00Z): vite crash `ENOSPC: System
    limit for number of file watchers reached` ngay sau "ready" (vite
    chết → `ERR_CONNECTION_REFUSED`), exit 2.
  - r49 attempt-1 (21:08Z): cùng lỗi, exit 2 (lưu ý: dòng echo exit=0
    trong driver log lúc đó là SAI do pipeline tee — đã đính chính
    trong log 21:10Z; file `frame-parity-error.txt` là bằng chứng
    đúng).
  - Retry sau khi chờ (3–6 phút) đều exit 0. Tổng: 6 lượt probe thành
    công sau 3 attempt fail.
- **Nghịch lý ENOSPC chưa giải thích đầy đủ:** đếm trực tiếp tổng số
  inotify watch trên hệ thống lúc lỗi chỉ **~1600–1627** (xa dưới
  max_user_watches=63747); thử nghiệm thêm 2000 watch bằng tay vẫn OK
  ngay sau lỗi. Các lần lỗi đều trùng lúc vite của luồng anh em đang
  chạy/khởi động (J6 vite pid 17288 `vite.config.j6-temp.ts`; vite
  port 5580 pid 21182 `vite.r2.config.mjs`). Giả thuyết: race lúc 2
  vite cùng add watch hàng loạt (mỗi vite watch cả cây apps/web +
  node_modules) — chưa chứng minh. Ghi là nợ hạ tầng, không phải lỗi
  probe hay sản phẩm.
- **preview.tsx mtime đổi nhưng md5 không đổi:** giữa r48 (xong
  21:07:11Z) và r49 (bắt đầu 21:08:43Z), mtime của preview.tsx nhảy
  tới 21:08:41Z trong khi md5 vẫn `ced42efd…` (nội dung không đổi) —
  có tiến trình nào đó đã ghi lại file với đúng nội dung cũ (không rõ
  là luồng nào; không phải J5). Mọi lượt probe đều ghi
  `mtimeChanged=false` (so md5). Không ảnh hưởng đo lường; ghi để
  đợt sau để ý.
- **Không có file .git trong ~/workspace/repo-1** (kiểm tra trực tiếp
  21:10Z — `ls .git` không tồn tại; `git status` báo "not a git
  repository"): thư mục repo local chỉ là cây file, push đi qua GitHub
  API. Không ảnh hưởng luồng đo (không dùng git).
- **0 lượt hoãn vì cổng yên** (xem §0). Không có reboot trong lượt.

## §6. Kiểm chứng (cây cuối, md5 ced42efd)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass (7,62 s)**.
- `node --experimental-strip-types src/lib/previewEngine.test.ts`:
  **27/27 pass**.
- `apps/web/scripts/test-preview-engine.sh`: **354 assertions pass**.
- Không sửa production; không push GitHub; không release/tag; không TTS 39;
  không birefnet.

---

## §7. Nợ còn lại

1. **E6: VẪN MỞ (thiếu 2 sự kiện band A').** 6/6 Nhãn-đúng, 0 E6-ủng hộ.
   Đợt sau: chạy thêm lượt **sysload nhẹ** (như r49 — cho 4/6 sự kiện)
   thay vì lượt yên-sâu; nếu 2 sự kiện tiếp theo cũng nhãn-đúng thì đủ
   8/8 → bác E6 theo luật. Không chạy thêm lượt yên-sâu thuần (tỉ lệ
   gap-6 chỉ ~1,3% tick).
2. **H-alt-weights: ủng hộ mạnh (n=803) nhưng chưa chứng minh.** Cần:
   quét lại w tối ưu trên chính dữ liệu J5 xem có trùng
   (0,20, 0,35, 0,45) không; giải thích outlier gap-7 (r49 c2 pres33,
   H-alt sai 0,213); đối chiếu với code `motionBlurBlendPlan` (trung
   bình đều theo quy nạp) — mâu thuẫn vẫn mở.
3. **Lệch g triple: +0,051 (đều) trên stimulus mới vs +0,029 (I8).**
   H-alt đóng lệch cả hai (−0,009 / −0,004) — cùng một ứng viên giải
   thích, cần kiểm độc lập (mục 2).
4. **Điểm gãy label-lag:** bar ±1 giữ tới load 2,5, gãy trước 27,9.
   Cần mức tải trung gian (load ~8–15) để tìm điểm gãy — chưa đo.
5. **ENOSPC race lúc vite song song:** tổng watch đếm được chỉ ~1600
   mà vẫn ENOSPC — chưa giải thích; đợt sau tránh cho 2 vite khởi động
   cùng lúc (đã có quy định chờ).
6. Các nợ ngoài phạm vi J5 (giữ nguyên từ LIMITS gộp đợt 107 §4): G1
   deinterlace (chờ user quyết metric G5/M2), mù #22 (chờ user quyết),
   Re-arm A/B tắt E4, 2 MiB (thí nghiệm phân biệt queue2), Zombie gate
   (b) (lượt thứ 6 chưa quan sát được), Blur B-band (p=0,3584), Ghost
   C3b chạy lại lúc yên, Harness E1 (6/7), EPERM probe #27 + mù #26,
   birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 108 J5)

- `apps/web/scripts/probe108j5-frame-parity.mjs` — probe copy probe107i8
  (chỉ đổi SCRATCH sang round108-j5; không đổi logic/config).
- `docs/PHASE9_ROUND108_J5_BLUR_CLUSTERA_LIMITS.md` — file này.
- Dữ liệu thô + analyzer nằm ngoài repo, tại `hidden_files/round108-j5/`
  (không stage): prereg-j5.md, prereg-j5-addendum-r49.md, driver108j5.sh
  + .log, analyze108j5.py + .txt/.json, 6 thư mục lượt probe
  (chr-code-noblur-r45, chr-code-blur-r45/r46/r47/r48/r49, mỗi thư mục
  có frame-parity-results.json + .log + vite-attempt*.log; r49 có thêm
  frame-parity-error.txt của attempt-1 fail).
- Không push GitHub, không release/tag (giữ release gate).
- `apps/web/public/stripes-code.mp4` dùng lại từ I8, KHÔNG stage (binary).
