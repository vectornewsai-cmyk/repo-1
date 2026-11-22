# PHASE9_ROUND154_T4_WEBKIT_QUIET23_LIMITS.md

**Đợt:** 154. **Luồng:** T4 — đo lượt yên WebKit #23 trên boot mới
+ GHI CƠ CHẾ "catch-up lag sau đóng băng" VÀO DEF/GAP (quyết parent
(d)(i) đợt 153) + ĐẾM THÊM CỘT distinct-seq TỪ ĐỢT 154.
**Ngày:** 20/11/2026.
**Boot đo:** 2c0a7985 (#48, btime 11:26:05Z) rồi 12fc68a3 (ứng viên
#49, btime 13:05:12Z — reboot giữa phiên giết poller, xem §5).
**Trạng thái:
#23 KHÔNG CÓ LƯỢT HỢP LỆ — 0 attempt trong 147 poll thật trên 2 boot
(poller hết hạn cắt 13:30Z, exit 5). Cửa yên KHÔNG BAO GIỜ MỞ:
boot #48 RAM sập dưới 1024 MB từ poll #26 (11:57:06Z) và không bao
giờ hồi (73/117 poll <500 MB, chuỗi dài nhất 27 poll); boot mới
load5 KHÔNG BAO GIỜ <2 (min 2,01) trong 30 poll. Chuỗi lượt yên
hợp lệ DỪNG Ở #21 (đợt 153) — KHÔNG CÓ lượt hợp lệ mới #22.
P3' cộng dồn KHÔNG ĐỔI: 39/41 occurrence = 39/40 distinct-seq
(không có dữ liệu (c2) mới đợt này). Cơ chế "catch-up lag sau đóng
băng" ĐÃ GHI vào DEF_v0.5 §6.4 + GAP §82 (xem §6); helper
distinct-seq ĐÃ KIỂM CHỨNG trên dữ liệu 151 (8/9) và 153 (7/7).
POSTBOOT_PASS cho boot #48 CÓ (T5-154, 11:58:26Z — cờ T5 đầu tiên
cho boot mới kể từ #43); boot mới KHÔNG CÓ cờ T5 (T5 đã đóng) —
gate0 dựa vào T4-check-only PASS (quyết (j) đợt 143).**

## 0. Verdict tổng

- **#23 KHÔNG CÓ LƯỢT HỢP LỆ (0 attempt).** Poller chạy
  11:38:16–13:30:00Z, **147 poll thật, 0 lần CỬA MỞ, 0 attempt**
  (ngân sách 3 attempt/đợt KHÔNG DÙNG — 0/3). Poller thoát exit 5
  đúng hạn cắt 13:30Z: `HET HAN CHO 13:30Z — GATE DO LUC HET HAN
  (poll cuoi #30): gateA-RAM(515MB<1024) load5(2.41)`.
- **Boot #48 (2c0a7985, #48 theo T0-154 — ứng viên, chờ T2-154
  xác nhận): 117 poll, 11:38:16–13:05:32Z.** RAM ≥1024 chỉ 25/117
  (toàn bộ trong poll #1–#25); **<500 MB: 73/117 (62%)**; chuỗi
  RAM<500 dài nhất **27 poll (12:01:37–12:21:10Z)**; RAM min 401 /
  max 2991 MB. 8 poll có load+RAM cùng đạt (#18–#25, 11:51:05–
  11:56:21Z) đều bị chặn bởi **apt=1 + gate0=khong-dat** (T5 đang
  repair apt-get; cờ T5 chưa tới). Từ poll #26 RAM không bao giờ
  ≥1024 nữa. Gate0=T5 từ poll #28 (11:58:36Z, cờ T5-154) + T4-
  check-only PASS từ poll #29 (11:59:21Z).
- **Boot mới 12fc68a3 (ứng viên #49, btime 13:05:12Z): 30 poll,
  13:07:39–13:29:30Z** (poller khởi động lại sau reboot, xem §5).
  Replay hoàn tất nhanh (dpkg 471 → 1545); gate0=T4-check-only
  PASS từ poll #5; **load5 KHÔNG BAO GIỜ <2 (min 2,01, 0/30)**;
  RAM ≥1024 chỉ 7/30 (poll #1–#7, lúc load còn 2,01–3,35).
  Không có poll nào thỏa cả ba (load1<2 + load5<2 + RAM≥1024).
- **Chuỗi lượt yên hợp lệ: DỪNG Ở #21.** Không có lượt hợp lệ
  mới #22 đợt này. Cộng dồn 21 lượt giữ nguyên: P1 69/69, P2
  60/60, P3-A1 61/69, **P3' 39/41 occurrence = 39/40
  distinct-seq**, P7 55/55. T8-154 waiter t4=0 suốt (GATE-NOT-YET
  poll 64 lúc 12:41:23Z) — O8 đợt này không qua gate chuẩn từ
  phía T4 (T8 tự quyết thủ tục (i) như đợt 153 nếu áp dụng).
- **Cây:** `apps/web/src/preview.tsx` md5 `530e10a7` (lúc mở
  poller, lúc test poll, lúc đóng — không đổi).
- **Cờ:** `hidden_files/round154-t4.done` viết ~13:3xZ (trong hạn
  cờ ~14:00Z, trước hạn cứng 14:30Z), CÓ NỘI DUNG (quyết (p)).

## 1. Poller — 147 poll thật, 0 lần cửa mở, trên 2 boot

- **Test (POLL_TEST=1) 11:38:09Z:** 1 poll, exit 7, ghi RIÊNG
  vào `poll-test-154.log` (F-150-T4-5 ĐÓNG — `poll-t4.log`
  KHÔNG còn dòng test nào). load1=2,71, load5=1,08, RAM=1118 MB,
  postboot_exit=1, gate0=khong-dat, t5flag=chua-co, apt=0,
  dpkg_lines=2.
- **Boot #48 — poll #1–#27 (11:38:16–11:57:51Z):** gate0=
  khong-dat. Replay chưa tới (dpkg 2 dòng tới poll #27);
  postboot check-only FAIL (libs/GST/apt thiếu — rootfs rebuild);
  t5flag=chua-co. Blockers=4 ở poll #9–#14 (job O8 của T0-154:
  clicktest-87o8-mask-track-webkit.mjs + vite :5564 +
  MiniBrowser + WebKitNetworkProcess — xem blockers-list-14.txt),
  0 ở các poll còn lại. RAM 2991 → 859 MB (giảm đơn điệu trong
  lúc chờ — cùng mẫu đợt 151/152/153). load1 0,08–6,83 (cao lúc
  các luồng khác khởi động).
- **Boot #48 — poll #18–#25 (11:51:05–11:56:21Z): 8 poll load +
  RAM CÙNG ĐẠT NHƯNG CỬA KHÔNG MỞ** — load1 0,29–1,26, load5
  0,99–1,92, RAM 1064–2034 MB, blockers=0 — nhưng **apt=1 suốt
  (apt-get của T5 repair) + gate0=khong-dat** (cờ T5 chưa viết,
  T4 check-only vẫn FAIL vì replay chưa đủ). Đây là 8 poll duy
  nhất trong cả phiên mà load1<2 + load5<2 + RAM≥1024 đồng thời
  (8/147). Cửa bị chặn bởi đúng hai điều kiện còn lại.
- **Boot #48 — poll #26 (11:57:06Z): RAM 959 MB — LẦN ĐẦU
  <1024, KHÔNG BAO GIỜ HỒI.** Poll #28 (11:58:36Z): **t5flag=
  PASS lần đầu** (POSTBOOT_PASS T5-154, 11:58:26Z) — gate0=T5 —
  nhưng RAM lúc đó chỉ 738 MB. Poll #29 (11:59:21Z): T4-check-
  only PASS lần đầu (postboot_exit=0). Từ đây gate0 đạt đủ
  (T5 + T4-check-only), load1/load5 phần lớn <2 (104/117 và
  102/117), blockers=0 — **chỉ còn RAM chặn cửa**: poll #30–#117
  RAM 401–647 MB, 0 poll ≥1024. Chuỗi RAM<500 dài nhất 27 poll
  (12:01:37–12:21:10Z). dpkg 2 → 795 (T5 repair).
- **Boot #48 — poll #117 (13:05:32Z): poll cuối trên boot cũ**
  (RAM 416 MB). **Reboot (ứng viên #49) giết poller** sau poll
  này (xem §5). Khung chết của boot #48: (13:05:32Z, 13:06:03Z]
  theo lần đọc boot_id của T4 (btime boot mới 13:05:12Z nằm
  TRƯỚC poll #117 — overlap migration ~20 s+, cùng họ #45).
- **Boot mới — poll #1–#30 (13:07:39–13:29:30Z, poller khởi
  động lại):** RAM mở 1695 MB (poll #1) rồi rơi 1695 → 510 MB
  trong 22 phút (balloon bơm lại); **load5 min 2,01 — KHÔNG
  BAO GIỜ <2 (0/30)**; load1<2 chỉ 2/30 (poll #29–#30, 1,96 /
  1,49 — lúc đó load5 vẫn 2,64 / 2,41, RAM 510 / 515 MB).
  gate0: khong-dat 4 poll (#1–#4, check-only FAIL lúc replay
  chưa đủ), **T4-check-only PASS 26 poll** (từ poll #5);
  t5flag=cu(mtime-cu) suốt (cờ T5-154 là của boot cũ). dpkg
  471 → 1545 (replay hoàn tất ~boot+10m, nhanh hơn #48 nhiều).
  Poll #30 (13:29:30Z): deadline check → HET HAN, exit 5.
- **Phân rã 147 poll thật:** RAM≥1024: 32/147; RAM 500–1023:
  41/147; RAM<500: 74/147. load1<2: 106/147; load5<2: 102/147.
  Chỉ 8 poll mà load + RAM cùng đạt — và cả 8 đều gate0/apt
  chặn. gate0: khong-dat 31 poll, T5 90 poll, T4-check-only 26
  poll. blockers>0: 6 poll (toàn bộ là job O8 của T0-154, xem
  §1 trên).
- **RAM sập đợt 150 TÁI DIỄN MẠNH HƠN:** đợt 150: 34/97 poll
  <500 MB; đợt này: **74/147 poll <500 MB (50%)**, gồm chuỗi
  27 poll liên tiếp <500 MB trên boot #48 + toàn bộ 88 poll
  cuối trên boot #48 (từ #30) <650 MB. Khác đợt 150: lần này
  KHÔNG có poll nào ≥1024 sau 11:56:21Z — tức **97 phút liên
  tiếp (11:57–13:30Z, qua cả reboot) RAM <1024**, dài hơn mọi
  đợt trước. Đối chiếu độc lập bằng sampler T9-154 (xem §5):
  mem min 405.564 kB, bal=6443824 (ghim trần) — balloon GHIM
  TRẦN là nguyên nhân trong tầm nhìn của T9, không phải process
  nào trong cell (ps lúc 11:59Z: process lớn nhất hatch daemon
  273 MB; tổng used 7230/7934 MB, buff/cache chỉ 982 MB).

## 2. Không có attempt nào — ngân sách 0/3, không có JSON/analyzer

- Không attempt nào chạy nên không có JSON probe, không có
  classb, không có (c2)/P3' mới. **Cộng dồn P3' GIỮ NGUYÊN:
  39/41 occurrence = 39/40 distinct-seq** (cơ sở từ LIMITS 153
  §9). Cột distinct-seq đã sẵn sàng (helper
  `distinct-seq-154.py`, kiểm chứng §6) — đợt này không có số
  mới để cộng.
- Chuỗi median tickCost 21 lượt giữ nguyên (39,0–60,0 ms, mean
  ~49,0 ms, 0 lượt vượt 60). Không có lượt #22 để nối chuỗi.

## 3. Replay/postboot trên 2 boot — cờ T5 CÓ cho #48, KHÔNG cho #49

- **Boot #48 2c0a7985 (btime 11:26:05Z): replay VẮNG lúc mở
  (dpkg.log 2 dòng — rootfs rebuild), T5-154 repair-sớm
  (quyết (h) đợt 150): trigger 11:45:59Z (boot+19m54s, frozen
  618 s), --repair exit 0; POSTBOOT_PASS viết 11:58:26Z
  (boot+32m21s; 11/11 gói + 5/5 lib + GST 269 + dpkg 795;
  cache 110 .deb, lists 66) — T4 poll #28 nhận cờ, gate0=T5
  từ đó. Đây là **cờ POSTBOOT_PASS đầu tiên cho một boot mới
  kể từ #43** (đợt 153: KHÔNG có cờ T5 nào). T4-check-only
  PASS độc lập từ poll #29 (11:59:21Z) — khớp cờ T5.
- **Boot mới 12fc68a3 (btime 13:05:12Z): replay TỚI NHANH TỰ
  NHIÊN** — dpkg 53 dòng lúc boot+1m, 358 dòng lúc boot+2m08s,
  **1545 dòng lúc ~boot+10m** (khớp đúng 1545 dòng chuẩn);
  T4-check-only PASS từ poll #5 (13:10:40Z, xem
  postboot-t4-154-gate0wait-13.log: GST đủ isomp4 + libav, apt
  đủ 11 package). **KHÔNG CÓ cờ T5 cho boot mới** (T5-154 đã
  đóng cờ 12:00Z, watcher-154 chết theo reboot; xem F-154-T4-3)
  — gate0 dựa hoàn toàn vào T4-check-only (quyết (j) đợt 143),
  26/30 poll PASS.
- Đối chiếu đợt 153: replay #45 tới muộn boot+63'–76', không cờ
  T5; đợt này #48 repair-sớm cứu (boot+32m) + có cờ T5; boot
  mới replay tự nhiên nhanh (boot+10m) nhưng không cờ T5.

## 4. Bằng chứng + files

- **LIMITS này:**
  `docs/PHASE9_ROUND154_T4_WEBKIT_QUIET23_LIMITS.md`.
- **DEF/GAP (ghi cơ chế theo quyết parent (d)(i) đợt 153):**
  `docs/DEF_v0.5.md` (§6.4 mới — cơ chế "catch-up lag sau đóng
  băng", §16 ghi chú bổ sung 20/11/2026, §17 tài liệu tham
  chiếu) + `PHASE9_GAP_ANALYSIS.md` (§82 bullet mới — quyết
  (d)(i) + ghi nhận cơ chế). Xem §6.
- **Script snapshot để stage (theo mẫu đợt 149–153, trong repo
  `apps/web/scripts/` — md5 khớp bản làm việc ở
  `hidden_files/round154-t4/`):** `poll-wait-t4-154.sh`,
  `run-attempt-154.sh`. Thay đổi so với 153: deadline poller
  13:30Z (hạn cờ ~14:00Z, cứng 14:30Z); cờ T5 ưu tiên
  round154-t5/, dự phòng round153-t5/; nhãn analyzer T4-154a;
  inner kiểm file round153-* (thay vì round152-*).
  **KHÔNG stage lại probe** (`probe121t3-ghost-k7.webkit.mjs`
  — byte-identical với bản đã vá đợt 148–153, 0 attempt chạy)
  và **KHÔNG ghi đè `t4-attempt-inner.sh` /
  `check-classb-t4.sh`** (bản làm việc ở
  `hidden_files/round154-t4/`, chỉ đổi số vòng/đường dẫn/W-path
  so với 153 — theo đúng mẫu 149–153).
- **Script làm việc (hidden_files, không stage):**
  `poll-wait-t4-154.sh`, `run-attempt-154.sh`,
  `t4-attempt-inner.sh`, `check-classb-t4.sh`, 10 analyzer
  `analyze-t4-*.py`, `vite.t4-temp.config.mjs`, `b.json`,
  `probe121t3-ghost-k7.webkit.mjs`, `tree-md5.txt` (530e10a7),
  `appendix-154.py` (phụ lục §A — argv-based, dùng khi có
  attempt; đợt này KHÔNG CÓ attempt nên chưa chạy),
  `distinct-seq-154.py` (helper cột distinct-seq, đã kiểm
  chứng §6).
- **Log/evidence (hidden_files/round154-t4/, không stage):**
  `poll-t4.log` (start + 147 poll thật + 2 lần start (restart
  sau reboot) + HET HAN exit 5; 0 dòng test), `poll-test-154.log`
  (test exit 7, riêng), `poll-t4.nohup.log` +
  `poll-t4.nohup2.log`, `chain-t4.log`,
  `postboot-t4-154-gate0wait-*.log` (check-only mỗi 4 poll),
  `blockers-ps-*.txt` / `blockers-list-*.txt` (poll #9–#14,
  job O8 T0-154).
- **KHÔNG có:** sửa code repo nào ngoài LIMITS này + DEF +
  GAP + 2 script snapshot (§4); không process T4 nào còn sống
  lúc đóng (poller đã thoát exit 5 lúc 13:30Z).
- **Stage:**
  `~/workspace/repo-1-push/paths-loop/phase9-round154-t4-quiet23.txt`
  (NUL-delimited, 5 entry — LIMITS + DEF + GAP + 2 script
  snapshot; đã verify bằng `od`).
- **Cờ:** `hidden_files/round154-t4.done` (~13:3xZ — trong hạn
  cờ ~14:00Z, CÓ NỘI DUNG).

## 5. Sai số F-154-T4-1..4 (+ nợ cũ)

- **F-154-T4-1 — RAM SẬP KÉO DÀI, CỬA KHÔNG MỞ TRONG 147 POLL
  (nguyên nhân chính của 0 attempt).** RAM <1024 liên tiếp
  ~97 phút (11:57–13:30Z, qua cả reboot); <500 MB: 74/147
  poll (50%), chuỗi dài nhất 27 poll. Balloon GHIM TRẦN
  (T9-154 sampler: bal=6443824, mem min 405.564 kB) — host-side,
  không process nào trong cell gây ra (ps 11:59Z: hatch daemon
  273 MB lớn nhất). Ngưỡng gate A RAM ≥1024 GIỮ NGUYÊN theo
  quyết parent đợt 132 §12.3(a) — T4 KHÔNG hạ ngưỡng để chạy
  cho có. Hệ quả dây chuyền: T8-154 waiter t4=0 (poll 64,
  12:41:23Z GATE-NOT-YET) — O8 không qua gate chuẩn từ phía T4.
  Giao T9/T10 + parent: RAM sập có phải điều kiện mở lại bàn
  ngưỡng gate A không (hiện tại: không — quyết đứng giữ).
- **F-154-T4-2 — REBOOT (ỨNG VIÊN #49) GIẾT POLLER GIỮA PHIÊN.**
  Boot mới 12fc68a3, btime 13:05:12Z; poller cũ (pid 3941) chết
  sau poll #117 (13:05:32Z, boot cũ); T4 phát hiện lúc
  13:06:03Z (runtime restart + boot_id đổi) và **khởi động lại
  poller 13:07:39Z** (pid 3543, deadline 13:30Z giữ nguyên,
  ngân sách attempt còn 0/3). **Overlap migration:** poll #117
  trên boot cũ lúc 13:05:32Z — 20 s SAU btime boot mới
  13:05:12Z (cùng họ #45, nhưng chỉ ~20 s thay vì 45m41s).
  Khung chết boot #48: (13:05:32Z, 13:06:03Z]. Số hiệu #49 là
  ỨNG VIÊN (T0-154 xác nhận #48; T2-154 đã đóng trước reboot
  nên số #49 chờ T10-154/T2 đợt sau xác nhận theo đếm chặt).
  Poller mới chạy 30 poll tới hạn cắt, 0 cửa mở (load5 không
  bao giờ <2 — bão sau reboot).
- **F-154-T4-3 — KHÔNG CÓ CỜ T5 CHO BOOT MỚI (T5 ĐÃ ĐÓNG).**
  T5-154.done viết 12:00Z ("Khong reboot #49 trong phien" —
  đúng tại thời điểm T5 viết, sai sau reboot 13:05:12Z);
  watcher-154 (pid 17168, khởi động tay 11:40:28Z) chết theo
  reboot; không ai viết POSTBOOT_PASS cho 12fc68a3. Gate0 đợt
  này trên boot mới dựa hoàn toàn vào T4-check-only PASS
  (26/30 poll) — đúng quyết (j) nhưng là đường dự phòng.
  Đây chính là cửa sổ "reboot → không ai xem" mà kết luận (b)
  của T5-153 cảnh báo; phương án (1) systemd unit đã được T5-154
  kiểm chứng là CHẾT trong cell (xem T5-154.done: systemctl
  --user không chạy được, không D-Bus/logind/linger, cell không
  có cron — phương án (2) cũng không dùng được ngay). Ghi để
  parent quyết tiếp ở §12.3 aggregate 154 (quyết (e) đợt 153
  chọn (1)+(3) — (1) nay đã có kết quả kiểm chứng: CHẾT).
- **F-154-T4-4 — 8 POLL "GẦN MỞ" BỊ CHẶN BỞI apt + gate0
  (11:51–11:56Z).** Poll #18–#25: load+RAM cùng đạt, blockers=0
  — nhưng apt=1 (apt-get của T5 repair) + gate0=khong-dat (cờ
  T5 chưa tới, check-only FAIL). Nếu T5 repair xong sớm hơn
  ~5 phút (hoặc cờ T5 tới trước khi RAM sập ở poll #26),
  cửa đã mở. Ghi nhận timing: cờ T5 tới 11:58:26Z — chỉ 2 phút
  sau khi RAM rơi dưới 1024 (11:57:06Z). Không phải lỗi của
  bên nào — là chồng lấn thời gian giữa repair và sập RAM.
- **F-151-T5-3 — VẪN CHƯA kiểm chứng live đường elif/else.**
  Cờ T5-154 cho boot #48 xuất hiện dạng PASS (đủ boot_id) nên
  nhánh "cờ chính tồn tại nhưng non-PASS" vẫn chưa được chạm;
  trên boot mới chỉ gặp cờ cũ "cu(mtime-cu)". Sửa từ đợt 152
  vẫn đứng; chờ lượt sau có cờ chính non-PASS. Không đánh ĐÓNG
  vội.
- **F-148-T4-1 — KHÔNG ÁP DỤNG đợt này (0 attempt).** p1p3p7
  không có JSON để chạy. Nợ đứng vẫn còn ở mức cơ chế (script
  chưa tự gọi p1p3p7); mỗi đợt có attempt T4 phải chạy tay và
  ghi rõ.
- **F-150-T4-5 — ĐÓNG.** Test poll ghi riêng
  `poll-test-154.log` (exit 7); `poll-t4.log` đúng 147 dòng
  poll thật (+ các dòng start/CUA MO/HET HAN và 6 dòng ghi
  blockers-snapshot), thống kê §1 không cần tách tay nữa.
- **F-152-T4-5 / F-153-T4-2 — KHÔNG TÁI DIỄN (0 attempt).**
  Không có cửa đo nên không có nhiễm mask_anim.py hay RE-ARM
  draw log để ghi nhận.

## 6. GHI CƠ CHẾ VÀO DEF/GAP + CỘT distinct-seq (quyết parent (d)(i) đợt 153 — HOÀN THÀNH)

- **DEF `docs/DEF_v0.5.md`:** thêm **§6.4 "Ghi chú sau xem xét
  đợt 153 — cơ chế thứ hai 'catch-up lag sau đóng băng'"** —
  xem xét P3' đã đóng (chọn (i)); 2 tick không đạt = 1 event
  duy nhất seq 365 ×2 occurrence đợt 151; cơ chế: sau đóng băng
  dài + loop wrap, nhãn tụt 3–6 frame trong lúc bắt kịp và gây
  (c2) mà không cần đóng băng ngay trước đó (bằng chứng then
  chốt: strip frame-36 md5 `2842a43a` byte-identical 6 tick);
  P3' nghiêm ngặt bị bác ở dạng phổ quát (39/41 occurrence =
  39/40 distinct-seq tới hết đợt 153); định nghĩa P3' KHÔNG
  đổi; verdict ghost-freeze đứng nguyên; **từ đợt 154 báo thêm
  cột distinct-seq cạnh occurrence cho P3'**; nếu mẫu 365-style
  tái diễn: ghi rõ là ca catch-up lag, không tự mở lại điều tra
  trừ khi một trong ba điều kiện §13 xảy ra. Thêm ghi chú vào
  §16 (lịch sử phiên bản — không đổi số phiên bản) + §17 (tài
  liệu tham chiếu: LIMITS 153 §9 + aggregate 153 §12.3(d)(i)).
- **GAP `PHASE9_GAP_ANALYSIS.md`:** thêm bullet vào §82 — quyết
  (d)(i) + ghi nhận cơ chế + P3' 39/41 = 39/40 + đếm distinct-seq
  từ đợt 154.
- **Helper `distinct-seq-154.py` — ĐÃ KIỂM CHỨNG trên dữ liệu
  cũ (không gõ tay):** round 153 attempt2 → 7/7 distinct (khớp
  LIMITS 153); round 151 attempt2 → **8/9 distinct** (seq 365
  KHÔNG ĐẠT, stall=1; occurrence 8/10) — khớp đúng số LIMITS
  153 §9 (P(X≥8|n=9,p=0,230)=5,61e-05). Helper tính từ stall
  analyzer output (dedup theo seq, stall chia sẻ trong cùng
  tick). Đợt này 0 attempt nên helper chưa có input mới — cộng
  dồn distinct-seq giữ **39/40**.
- **P3' cộng dồn sau đợt 154 (KHÔNG ĐỔI): P1 69/69, P2 60/60,
  P3-A1 61/69, P3' 39/41 occurrence = 39/40 distinct-seq, P7
  55/55** (21 lượt hợp lệ).

## 7. Chờ quyết parent / nợ đợt 155

- **(a) #23 KHÔNG CÓ lượt hợp lệ — chuỗi lượt yên hợp lệ dừng
  ở #21.** Đợt 155 đo tiếp với cùng cổng tickCost ≤60 ms +
  probe đã vá (không đổi ngưỡng — không có lượt nào để bàn
  ngưỡng đợt này). Câu hỏi cho parent/T10: chuỗi #19/#20/#21
  có tính là "đứt" không, hay chỉ là "gián đoạn do môi trường"
  (0 attempt — không phải lượt đo thất bại)? T4 ghi dữ kiện:
  0 attempt, không phải 0/x pass.
- **(b) RAM sập 97 phút liên tiếp <1024 (F-154-T4-1):** có nên
  bàn lại ngưỡng gate A RAM cho lượt sau không (hiện tại quyết
  đứng giữ ≥1024)? T4 không đề xuất hạ — chỉ ghi để parent
  quyết. Nếu RAM sập tái diễn đợt 155 thì T4 vẫn sẽ 0 attempt.
- **(c) Reboot ứng viên #49 (F-154-T4-2):** T10-154/T2 đợt sau
  xác nhận số hiệu + khung chết + mù (nếu có). T4 chỉ ghi:
  boot 12fc68a3, btime 13:05:12Z, overlap ~20 s sau btime.
- **(d) Phương án (1) systemd unit CHẾT trong cell (F-154-T4-3,
  theo T5-154.done):** quyết (e) đợt 153 chọn (1)+(3) — (1)
  nay có kết quả kiểm chứng phủ định; (3) quy tắc đứng T0 kiểm
  tra watcher lúc mở vẫn đứng (T0-154 đã làm: phát hiện watcher
  chết lúc mở, T5 khởi động lại tay). Parent quyết tiếp: chấp
  nhận chỉ còn (3), hay thử hướng khác cho respawn.
- **(e) F-148-T4-1 (cơ chế):** p1p3p7 vẫn chạy tay — không có
  attempt đợt này nên không phát sinh thêm. Parent phán khi có
  attempt trở lại.
- **(f) Các nợ đứng khác giữ nguyên từ đợt 153 §8:** G1 chờ
  user, R9 (16), ci-security.yml 403, file oversize 6,4 MB,
  TTS 39 cấm kiểm lại; mù #76?/#77?/#78?/#79? giao T2; birefnet
  0 thử; u2net là fallback chính thức; **T7-154 siết T45_thực +
  T2-154 thử mốc merged (quyết (c) đợt 153)** — T4 không liên
  quan trực tiếp.

## A. Phụ lục số liệu (script trích từ log gốc — đợt này KHÔNG CÓ attempt nên không có phụ lục attempt; thay bằng thống kê poll)

```
== PHU LUC A — thong ke poll trich tu poll-t4.log (script, khong go tay) ==
-- tong poll that: 147 (boot 2c0a7985: 117; boot 12fc68a3: 30)
-- boot 2c0a7985 (11:38:16-13:05:32Z): RAM min=401 max=2991 >=1024: 25/117 500-1023: 19/117 <500: 73/117
   load1<2: 104/117 load5<2: 102/117 blockers>0: 6 poll; dpkg 2->795
   gate0: khong-dat 27, T5 90
-- boot 12fc68a3 (13:07:39-13:29:30Z): RAM min=495 max=1695 >=1024: 7/30 500-1023: 22/30 <500: 1/30
   load1<2: 2/30 load5<2: 0/30 blockers>0: 0 poll; dpkg 471->1545
   gate0: khong-dat 4, T4-check-only 26
-- poll load1<2 + load5<2 + RAM>=1024 dong thoi: 8/147 (toan bo la poll #18-#25 boot #48, deu apt=1 + gate0=khong-dat)
-- 8 poll gan mo (#18-#25, 11:51:05-11:56:21Z): RAM 1064-2034, L1 0,29-1,26, L5 0,99-1,92, blk=0, apt=1, gate0=khong-dat
-- boot48 RAM<1024 lan dau: poll #26 11:57:06Z (959 MB); chuoi RAM<500 dai nhat: 27 poll (12:01:37-12:21:10Z)
-- boot48 gate0=T5 lan dau: poll #28 11:58:36Z; T4-check-only PASS lan dau: poll #29 11:59:21Z
-- boot49 RAM>=1024: chi poll #1-#7 (1695->1130 MB, luc do load5 2,01-3,35); load5 min 2,01
-- cong don P3' (KHONG DOI, 21 luot): P1 69/69 P2 60/60 P3-A1 61/69 P3' 39/41 occ = 39/40 distinct-seq P7 55/55
-- chuoi median 21 luot (giu nguyen): n=21 mean=49,0 min=39,0 max=60,0 vuot-60: 0
```
