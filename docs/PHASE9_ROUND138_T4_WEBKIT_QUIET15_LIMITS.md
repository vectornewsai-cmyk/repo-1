# PHASE9_ROUND138_T4_WEBKIT_QUIET15_LIMITS.md

**Đợt:** 138. **Luồng:** T4 — lượt yên WebKit #15 (giám sát thụ động (c2)
theo DEF v0.5). **Ngày:** 18/11/2026. **Boot:** 914964c3 (#95? tạm),
btime 11:52:20Z. **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7`
(kiểm lúc khởi động lại poller 11:59:46Z VÀ lúc đóng 13:32:13Z — không đổi).
**Trạng thái:** 0 ATTEMPT — LƯỢT YÊN #15 KHÔNG ĐO ĐƯỢC.

## 0. Verdict tổng (đọc trước)

- **Lượt yên WebKit #15 KHÔNG ĐO ĐƯỢC: 0 attempt trong cửa sổ chờ
  11:59:46Z–13:30Z.** Gate A (RAM ≥1024 MB) không mở một lần nào trong
  khi gate 0 xanh đồng thời — xem §3. Poller hết hạn 13:30Z theo đúng
  brief (exit 5, 0 attempt).
- **P1–P7 + P3' theo DEF v0.5: KHÔNG KIỂM ĐƯỢC** — không có JSON attempt,
  không có tick post, không có (c2) nào để đếm. Không có verdict ĐÚNG/SAI
  nào ở lượt này, và **không có điều kiện nào trong ba điều kiện mở lại
  điều tra (§13 DEF v0.5) xảy ra** (không có dữ liệu để P1 gãy / lag âm /
  +2f ≥3).
- **Cộng dồn KHÔNG ĐỔI:** P1 28/28, P3-A1 24/28, P7 14/14 (quy ước từng
  seq); chuỗi median tickCost vẫn 12 lượt hợp lệ
  (49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 / 40,0 /
  58,0 / 59,0 ms) — **không thêm lượt #15 vào chuỗi**.
- **Ngưỡng tickCost ≤60 ms: KHÔNG BÀN LẠI** — không có lượt nào vượt
  (không có lượt nào cả); điều kiện "ba lượt liên tiếp ≥55 ms mà đã loại
  trừ tải" không đạt thêm dữ kiện.
- **DEF v0.5, fix 530e10a7, ngưỡng/prereg: KHÔNG ĐỔI** — không sửa gì.
- **Không có code nào được viết/sửa trong lượt này** (chỉ poll + log);
  preview.tsx không chạm tới. Không push, không release/tag.

## 1. Bối cảnh: T4 gốc kết thúc phiên trước reboot, T4b thay thế

- T4 gốc khởi động poller `poll-wait-t4-138.sh` (pid 31018) trên boot cũ
  17db9652 (#94?) lúc 11:43:09Z, báo poll #1–2 (gate 0 PASS theo cờ T5
  fallback `round137-t5/POSTBOOT_PASS` cùng boot cũ; gate A chưa mở do
  load cao), rồi **phiên của T4 gốc kết thúc lúc 11:44:17Z — TRƯỚC reboot**.
- **Reboot giữa lượt:** boot mới 914964c3 = #95? (tạm), btime 11:52:20Z
  (T2-138 xác nhận; cửa sổ reboot theo T2: (11:51:36Z, 11:52:20Z]).
  Poller cũ (pid 31018) chết theo reboot. **Khung chết của poller cũ hẹp
  hơn nhờ mốc cuối của chính nó: (11:52:12Z, 11:52:20Z] (~8 s)** — poll
  #13 cuối lúc 11:52:12Z vẫn thấy boot 17db9652; btime mới 11:52:20Z.
  Khung chuẩn cuối cùng vẫn chờ T2-139 chốt từ merged mù #58.
- Tin nhắn báo reboot gửi tới T4 gốc bị "agent not found" (phiên đã hết);
  parent spawn **T4b (tôi) thay thế**. T4b kiểm tra lúc 11:58:21Z:
  boot_id `914964c3-...`, btime 11:52:20Z, md5 preview.tsx `530e10a7`
  (KHỚP — tiếp tục; nếu khác đã dừng ngay theo brief), rồi **khởi động
  lại poller lúc 11:59:46Z trên boot mới** (cùng script
  `poll-wait-t4-138.sh`, không sửa logic; chỉ ghi marker T4b vào log).
- **Khoảng trống giám sát:** 11:52:20Z–11:59:46Z (~7,5 phút) không có
  poll T4 nào (poller cũ đã chết, poller mới chưa chạy). Dữ kiện
  trước/sau reboot **tách biệt hoàn toàn** (§2 vs §3) — không gộp số
  liệu qua reboot.
- **KHÔNG dùng lại cờ postboot của boot #94?**: poller mới chỉ chấp nhận
  `round138-t5/POSTBOOT_PASS` chứa boot_id 914964c3 (cờ cũ của 137-t5
  ghi "cu(mtime-cu)" và bị bỏ qua đúng luật). Cờ mới do watcher T5
  (t5-wait-replay-b92.sh) viết lúc 12:22:38Z — xem §3.

## 2. Poller cũ — boot 17db9652 (#94?), 11:43:09Z–11:52:12Z (13 poll)

| Chỉ tiêu | Giá trị |
|---|---|
| Poll | #1–13, mỗi 45 s; poll cuối 11:52:12Z |
| RAMavail | min 2.445 MB, max 6.062 MB, mean 3.851 MB; **≥1024 MB: 13/13** |
| load1 / load5 | 1,60–4,23 / 2,19–2,73 — **mọi poll đều ≥2 ở cả hai** |
| Gate 0 | PASS 13/13: t5flag PASS (fallback round137-t5 cùng boot), postboot_exit 0 (13/13), apt=0 (13/13), cây YES md5=530e10a7 |
| Lock / blockers | lock=khong 13/13; blockers=0 (snap-trước) 13/13 |
| Kết quả | **Gate A chưa mở do LOAD CAO** (đúng như T4 gốc đã báo ở poll #1–2). RAM đủ, nhưng load1/load5 không xuống dưới 2 lần nào. |
| Chết | Theo reboot trong khung (11:52:12Z, 11:52:20Z]; pid 31018 không còn sau reboot. |

- Ghi chú RAM boot cũ: poll #12 (11:51:27Z) RAMavail 6.062 MB — xem §8
  (cửa sổ guard birefnet suýt mở rồi mất theo reboot).
- dpkg_lines lúc đó 1.545 (replay #94? đã XONG: 221 installs — theo
  T5-137/T5-138).

## 3. Poller mới (T4b) — boot 914964c3 (#95?), 11:59:46Z–13:29:24Z (120 poll)

Poller pid 3390, chạy `poll-wait-t4-138.sh` không sửa. Hết hạn 13:30Z,
exit 5, **0 attempt**, "CUA YEN MO" 0 lần. Không có file JSON attempt
nào được tạo (kiểm 13:31:51Z: không tồn tại
`preview-b-f3-flip-webkit-t4-attempt1.json`); không có vite.lock sót;
không có tiến trình poller nào còn chạy sau 13:30Z.

### 3.1 Số liệu gộp 120 poll (boot mới)

| Chỉ tiêu | Giá trị |
|---|---|
| Poll | #1–120 (đánh số lại từ #1 — xem F-138-T4-5), 11:59:46Z–13:29:24Z |
| RAMavail | min 438 MB, max 1.155 MB, **mean 578 MB; ≥1024 MB: 2/120 poll** |
| load1 / load5 | 0,05–1,58 / 0,27–0,97 — **<2 ở cả 120/120 poll** |
| t5flag | PASS (round138-t5, boot 914964c3) từ poll #32 (12:23:07Z) tới #120: **89 poll** |
| postboot_exit | 0 từ poll #33 (12:23:52Z) tới #120: **88 poll** |
| apt | =0 ở 92/120 poll (xem 3.2) |
| Lock / cây | lock=khong 120/120; cây YES md5=530e10a7 120/120 |
| Blockers | =0 ở 112/120 poll; >0 ở 8 poll #22–29 (xem F-138-T4-2) |

### 3.2 Mốc gate 0 trên boot mới (theo thứ tự thời gian)

1. **11:59:46Z–12:14:05Z (poll #1–20): gate 0 ĐỎ.** apt-get pid 802
   (replay #95?) vẫn chạy; postboot_exit=1; t5flag stale
   (`cu(mtime-cu)`, cờ 137-t5 của boot cũ). dpkg_lines = 2 (log mới
   sau reboot).
2. **12:14:20Z: T5 kill apt-get 802** (luật (C) 5/5, REPAIR_TRIGGERED
   12:14:14Z — theo log watcher T5; lần đầu luật (C) kích hoạt).
   Poll #21 (12:14:50Z) apt=0 **thoáng qua một poll** (apt-get đã chết,
   apt của --repair chưa chạy).
3. **Poll #22–29 (12:15:35Z–12:20:52Z): apt=1 trở lại** (apt của tiến
   trình --repair T5) + blockers=1 (chính tiến trình --repair đó —
   xem F-138-T4-2). postboot vẫn FAIL.
4. **Poll #30 (12:21:37Z): apt=0 ổn định** từ đây tới hết (#30–120).
5. **12:22:38Z: watcher T5 viết `round138-t5/POSTBOOT_PASS`**
   (`boot_id=914964c3-... btime=2026-11-18T11:52:36Z pass_at=... poll=28`,
   mtime file 12:22:39Z; watcher kết thúc `done_pass_stable_2polls`).
   Poll #32 (12:23:07Z) t5flag PASS lần đầu.
6. **Poll #33 (12:23:52Z): postboot_exit=0 lần đầu.** dpkg_lines 795
   (replay #95? xong).
7. **Từ poll #33 tới #120 (12:23:52Z–13:29:24Z): 88/88 poll MỌI THỨ
   XANH TRỪ RAM** — load1<2 (0/88 ≥2), load5<2 (0/88 ≥2), blockers=0
   (0/88 >0), lock=khong (0/88 khác), t5 PASS (0/88 khác),
   postboot 0 (0/88 khác), apt=0 (0/88 khác), cây YES (0/88 khác),
   **RAM<1024: 88/88**. Chỉ thiếu RAM, thiếu trung bình ~450 MB.

### 3.3 Hai poll RAM ≥1024 — near-miss, không tạo thành cửa sổ

| Poll | Thời gian | RAM | Tình trạng gate 0 lúc đó |
|---|---|---|---|
| #20 | 12:14:05Z | 1.155 MB | t5flag stale, postboot_exit=1, apt=1 — ĐỎ |
| #21 | 12:14:50Z | 1.044 MB | t5flag stale, postboot_exit=1, apt=0 — ĐỎ |

Cả hai lần RAM vượt ngưỡng đều xảy ra **trước khi gate 0 xanh**
(trước cờ T5 12:22:38Z). **Không tồn tại một poll nào mà gate 0 VÀ
gate A cùng xanh** trong cả 120 poll boot mới (và 13 poll boot cũ thì
gate 0 xanh nhưng load đỏ). Không có cửa sổ yên nào để chạy attempt.

### 3.4 RAM theo khối 20 poll (boot mới) — phẳng, không hồi phục

| Poll | Khoảng thời gian | RAM mean | RAM min–max |
|---|---|---|---|
| #1–20 | 11:59:46Z–12:14:05Z | 644 MB | 438–1.155 MB |
| #21–40 | 12:14:50Z–12:29:09Z | 659 MB | 450–1.044 MB |
| #41–60 | 12:29:54Z–12:44:13Z | 560 MB | 446–918 MB |
| #61–80 | 12:44:58Z–12:59:17Z | 540 MB | 489–649 MB |
| #81–100 | 13:00:02Z–13:14:21Z | 538 MB | 477–767 MB |
| #101–120 | 13:15:06Z–13:29:24Z | 529 MB | 480–558 MB |

Sau khi apt xong (12:22Z), RAM không hồi phục mà còn giảm nhẹ theo
thời gian (659 → 529 MB). Xem §4.

## 4. Vì sao RAM không hồi phục — balloon kẹt (không hạ ngưỡng)

- Balloon (theo sampler T5 `ram-sampler-boot2.log`): 5.074.548 kB lúc
  boot mới (postboot) → 5.681.472 kB (11:58:49Z) → **6.443.824 kB
  (12:24:49Z) rồi kẹt ở đó** (mẫu cuối sampler 12:25:49Z cùng giá trị;
  MemTotal 8.124.900 kB).
- Tại 12:25:11Z (kiểm trực tiếp): MemAvailable 511.340 kB, MemFree
  154.788 kB, Cached 540.256 kB, Buffers ~0, SwapCached 109.788 kB.
  Cache chỉ còn ~540 MB nên **không còn cache để thu hồi** — RAMavail
  ~500 MB là mức thật, không phải do cache chưa giải phóng.
- **Ngưỡng gate A RAM ≥1024 MB GIỮ NGUYÊN, KHÔNG HẠ** (quyết parent
  đợt 132 §12.3(a): cơ chế chờ RAM mới, giữ ngưỡng, không hạ). Poller
  chờ đủ 120 poll tới hạn cứng thay vì nới ngưỡng để chạy attempt
  trong RAM thấp — chạy vite + probe WebKit 20 pass trong ~500 MB
  RAMavail là tự sát (OOM giữa chừng, JSON partial, lượt không hợp lệ).
- Ghi nhận cho T10/parent: nếu balloon kẹt ~6,4 GB nhiều lượt, lượt
  yên sẽ đói RAM lặp lại — đây là vấn đề host/load, không phải do T4,
  và không thuộc quyền T4 can thiệp (dmesg cũng đã bị chặn EPERM —
  xem LIMITS T8-138).

## 5. Thứ tự snapshot-trước-đếm-sau (quyết parent đợt 137 §12.3(i)) — ĐÃ LÀM

- **BẮT BUỘC theo brief: trong poller, CHỤP ps snapshot TRƯỚC rồi mới
  ĐẾM blockers TỪ snapshot đó** — đã thực hiện ở **mọi poll** (cả 13
  poll boot cũ của T4 gốc lẫn 120 poll boot mới của T4b): mỗi poll chỉ
  chạy `ps` **một lần duy nhất** vào `ps-snap-tmp.txt`, rồi đếm blockers
  bằng grep trên file đã chụp; file tạm chỉ được giữ lại khi blockers>0
  (thành `blockers-ps-N.txt` + `blockers-list-N.txt`, N=22..29), còn lại
  xóa ngay. Không còn race đếm-chụp <1 s như F-137-T4-1.
- **F-137-T4-1 đã khắc** ở lượt này (không tái hiện).
- Ghi rõ thứ tự trong từng dòng log: `blockers=N(snap-truoc)`.

## 6. Load/RAM theo TỪNG PASS (quyết parent đợt 137 §12.3(c)) — KHÔNG CÓ DỮ LIỆU

- **Không có pass nào để ghi load1/RAM kèm tickCost** — 0 attempt, 0
  pass, không có sampler `load-mid-t4-attempt1.log`, không có
  `analyze-t4-perpass.py` output. Script per-pass đã đọc sẵn nhưng
  không có JSON đầu vào nên không chạy.
- Thay vào đó, dữ kiện tải theo từng poll (45 s) có đầy đủ ở §2–§3:
  boot cũ load cao (load1 1,60–4,23) + RAM đủ; boot mới load thấp
  (load1 0,05–1,58) + RAM thiếu. Tương quan tải–median **không kiểm
  được ở lượt này** (không có median nào). Ghi rõ để T10 không tìm
  file per-pass của lượt #15.

## 7. P1–P7 + P3' theo DEF v0.5 — KHÔNG KIỂM ĐƯỢC (không có lượt yên)

| Tiêu chí | Kết quả lượt #15 | Ghi chú |
|---|---|---|
| Lượt hợp lệ (attempt 20/20 + lớp B 5/5 + median tickCost ≤60 ms) | KHÔNG CÓ | 0 attempt |
| P1 (c2) gắn run-end | KHÔNG KIỂM ĐƯỢC | Không có (c2) nào |
| P2 (lag ≥ +1f, 0 lag âm) | KHÔNG KIỂM ĐƯỢC | Không có (c2) nào |
| P3-A1 (đóng băng-tại-tick) | KHÔNG KIỂM ĐƯỢC | Không có (c2) nào |
| P3' stall-based (prereg từ #15) | KHÔNG KIỂM ĐƯỢC | **P3' vẫn chưa được kiểm lần nào** — vẫn chờ lượt hợp lệ đầu tiên |
| P4 (count (c2)) | KHÔNG KIỂM ĐƯỢC | Không có (c2) nào |
| P5 (snap 34–52 ms; raw 8–10 ms; label-floor 63–76%; run ≥3 tick 13–22) | KHÔNG KIỂM ĐƯỢC | Không có ghost occurrence nào |
| P6 (histogram) | KHÔNG KIỂM ĐƯỢC | Không có histogram |
| P7 (log draw phủ) | KHÔNG KIỂM ĐƯỢC | Không có log draw lượt này |
| F6' (skippedLatest) | KHÔNG KIỂM ĐƯỢC | Không có tick nào |

- Cộng dồn sau lượt này (không đổi): P1 28/28, P2 19/19 occurrence,
  P3-A1 24/28, P7 14/14 (quy ước từng seq). P3' cộng dồn: chưa có mẫu
  nào (0 lượt).
- Ba điều kiện mở lại điều tra (DEF v0.5 §13): (1) P1 gãy — không có
  dữ liệu; (2) lag âm — không có dữ liệu; (3) +2f ≥3/lượt — không có
  dữ liệu. **Không điều kiện nào xảy ra; điều tra (c2) vẫn ĐÓNG.**

## 8. Ghi nhận ngoài nhiệm vụ: cửa sổ guard birefnet suýt mở trên boot cũ

(Thuộc T9; ghi ở đây vì poller T4 là nhân chứng mốc RAM cuối trước
reboot — T9-138 vẫn đang chạy sampler dài trên boot mới.)

- Đỉnh RAM boot #94? trước reboot: **T2 đo 6.204.548 kB = 98,6% guard
  (6.144 MiB) lúc 11:51:36Z**; T5 đo 6.112.624 kB = 97,2% lúc 11:51:59Z;
  poller cũ T4 poll #12 đo 6.062 MB lúc 11:51:27Z (cùng xu hướng, sai
  khác do thời điểm đo). **Bổ sung sau khi T9 đóng (13:35Z): sampler
  dài T9 ghi đỉnh 6.232.924 kB = 99,07% guard lúc 11:51:51Z — thiếu
  58.532 kB (~57 MiB), là mẫu gần guard nhất từ trước tới nay, nhưng
  vẫn là chớp 1 mẫu duy nhất.**
- **Không có mẫu nào ≥ 6.144 MiB; không ai kịp thử birefnet** — reboot
  11:52:20Z cắt cửa sổ ngay sau đó (chỉ ~13–44 s sau các mốc đỉnh).
  Quyết parent đợt 137 §12.3(i): "GIAO RÕ T9-138 thử khi cửa sổ mở"
  vẫn đứng cho đợt sau — cửa sổ lần này mở rồi đóng trước khi ai kịp
  thử (T9 ở lại muộn hơn cũng không kịp vì reboot giết cả sampler).
- Trên boot mới, RAM không bao giờ tới gần guard (max 1.155 MB trong
  120 poll T4) — **không có cửa sổ birefnet nào trên boot #95? trong
  lượt này**.

## 9. Sai số F-138-T4-1..6

- **F-138-T4-1 — T4 gốc kết thúc phiên trước reboot; khoảng trống giám
  sát ~7,5 phút.** T4 gốc hết phiên 11:44:17Z; reboot 11:52:20Z giết
  poller pid 31018; T4b khởi động lại poller 11:59:46Z. Không có poll
  T4 nào trong (11:52:20Z, 11:59:46Z]. Tin báo reboot gửi tới T4 gốc bị
  "agent not found" (phiên đã hết) — parent phải spawn T4b thay thế.
  Ảnh hưởng: mất ~7,5 phút cửa sổ chờ đầu boot mới (RAM lúc đó ~1.009
  MB ở poll #1 — vẫn dưới ngưỡng; không có bằng chứng cửa sổ yên nào
  bị bỏ lỡ trong khoảng trống: RAM boot mới không vượt 1.155 MB ở bất
  kỳ poll nào sau đó, và gate 0 đỏ tới 12:23:52Z).
- **F-138-T4-2 — Blocker GIẢ: tiến trình postboot-check --repair của T5
  bị đếm là blocker ở 8 poll (#22–29, 12:15:35Z–12:20:52Z).** Tiến
  trình `bash .../vcut-webkit-postboot-check.sh --repair` (pid 9198,
  ppid 9187) khớp mẫu grep blockers `[w]ebkit` của poller. Đây là tiến
  trình sửa chữa của watcher T5 sau luật (C) (kill apt-get 802 lúc
  12:14:20Z, REPAIR_TRIGGERED 12:14:14Z) — KHÔNG phải vite/probe/
  MiniBrowser. Bằng chứng phân biệt: poller gọi postboot-check KHÔNG
  có cờ `--repair`; tiến trình quan sát được có `--repair` nên thuộc
  luồng repair của T5. **Không đổi kết quả:** 8 poll đó gate 0 chưa
  xanh (t5flag stale + postboot FAIL) nên cửa yên đã đóng sẵn; sau đó
  RAM chặn. **Đề xuất đợt sau:** loại trừ `vcut-webkit-postboot-check.sh`
  khỏi mẫu grep blockers (thêm `grep -v "postboot-check"`), hoặc đếm
  blockers trước khi chạy postboot check.
- **F-138-T4-3 — RAM gate: balloon kẹt, không hạ ngưỡng.** Balloon
  6.443.824 kB kẹt từ 12:24:49Z; RAMavail phẳng ~500 MB suốt 88 poll
  sau khi gate 0 xanh; ngưỡng GIỮ NGUYÊN theo quyết parent (không hạ
  để chạy attempt thiếu RAM). Ghi nhận cho T10/parent: nếu balloon kẹt
  lặp lại nhiều lượt thì lượt yên sẽ đói RAM có hệ thống — thuộc quyết
  host, không thuộc T4.
- **F-138-T4-4 — Cửa sổ birefnet guard suýt mở rồi mất theo reboot**
  (ghi nhận, không phải sai số T4): xem §8. Không mẫu nào ≥ guard;
  T9 không kịp thử.
- **F-138-T4-5 — Đánh số poll khởi động lại từ #1 trên boot mới.**
  Cùng số hiệu tồn tại ở cả hai boot (vd poll #13 có ở cả boot cũ
  11:52:12Z và boot mới 12:06:33Z). Đã giảm nhẹ bằng cách ghi `boot=`
  + `btime=` ở mọi dòng log + marker T4b trước khi restart; **T10 đọc
  log phải lọc theo boot**, không được gộp số poll qua reboot.
- **F-138-T4-6 — dpkg_lines không so sánh được xuyên reboot.**
  1.545 dòng (boot cũ, replay xong) → 2 dòng (boot mới lúc đầu) → 795
  dòng (sau replay #95?). Số dòng là trạng thái log của từng boot,
  không phải cùng một thước đo liên tục. Chỉ dùng trong cùng boot.

## 10. Files + stage

- **LIMITS này:** `docs/PHASE9_ROUND138_T4_WEBKIT_QUIET15_LIMITS.md`
  (file duy nhất T4b tạo mới trong repo).
- **Log/evidence (đã có sẵn trong hidden_files, không stage — file làm
  việc nội bộ):**
  `hidden_files/round138-t4/poll-t4.log` (13 poll boot cũ + 120 poll
  boot mới + 8 dòng blockers + marker T4b + dòng HET HAN 13:30Z),
  `chain-t4.log`, `poll-t4.nohup.log`,
  `postboot-t4-138-gate0wait-*.log` (check gate 0 mỗi 4 poll),
  `blockers-ps-22..29.txt` + `blockers-list-22..29.txt` (snapshot ps
  đã chụp TRƯỚC khi đếm — xem §5),
  script `poll-wait-t4-138.sh` (tái sử dụng, không sửa),
  analyzer `analyze-t4-stall.py` / `analyze-t4-perpass.py` (đã đọc,
  không chạy — không có JSON đầu vào).
- **KHÔNG có:** JSON attempt, vite log, `load-mid-t4-attempt1.log`,
  output analyzer — vì 0 attempt.
- **Stage:** `~/workspace/repo-1-push/paths-loop/phase9-round138-t4-quiet15.txt`
  (NUL-delimited, 1 entry — chỉ LIMITS này; đã verify bằng `od`).
- **Cờ:** `hidden_files/round138-t4.done` (tạo sau khi viết LIMITS này).
- **Log vòng lặp:** 1 dòng tóm tắt đã ghi vào
  `workspace/goals/capcut-clone-video-editor/hidden_files/build-loop-log.md`
  (mục đợt 138).

## 11. Chờ quyết / nợ đợt 139

1. **Lượt yên #15 chưa đo — thử lại đợt 139.** P3' stall-based (prereg
   DEF v0.5) vẫn chưa được kiểm lần nào; mọi cộng dồn P1–P7 giữ nguyên
   tới khi có lượt hợp lệ tiếp theo.
2. **Sửa mẫu blockers** (F-138-T4-2): loại trừ postboot-check khỏi grep
   blockers trước đợt 139 — việc nhỏ, làm ở đầu đợt sau, không cần
   quyết parent (chỉ tránh đếm nhầm tiến trình hệ thống).
3. **Birefnet:** T9 thử ngay khi sampler quan sát được ≥ 6.144 MiB
   (quyết parent đợt 137 §12.3(i) vẫn đứng); đợt 138 không có cửa sổ
   nào trên boot mới.
4. **RAM/balloon kẹt:** nếu đợt 139 vẫn ~500 MB thì parent/T10 cần
   xem có can thiệp host được không (T4 không tự ý hạ ngưỡng gate A).
5. **Không có gì khác chờ parent ở lượt này** — 0 attempt là kết quả
   đúng luật (chờ đủ hạn, không nới ngưỡng, không chạy thiếu RAM).
