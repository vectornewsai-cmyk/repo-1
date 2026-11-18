# PHASE9_ROUND115_R1_E4HIGHLOAD_LIMITS.md

## Kết luận trước

**E4: KHÔNG ĐÓNG — bị chặn bởi 1 stall sau steady-close (r1f3 att2),
theo đúng luật prereg-r1 §5/§7. Bằng chứng CAP thì đã đầy đủ.**

- **CAP (mục tiêu số liệu của đợt — ĐẠT, vượt mục tiêu): 0 CAP / 184
  play-tick tải cao hợp lệ** (r1f2 106 + r1f4 78), theo cả 3 luật
  (N1/M1/cũ). **Gộp tải cao thuần Q1+R1: 0/344 play-tick, Fisher 2
  phía vs K1-on (6/284) p=0,0083 < 0,05** — vượt mục tiêu đợt này
  (~210 tick, p≈0,04). Caveat đợt 114 ("bằng chứng tải cao trực tiếp
  0/160, p=0,0919, chưa đủ lực") **về mặt số liệu đã hết hiệu lực**:
  phần tải cao một mình nay đã đủ lực, không cần trộn tải thấp
  (N1+P1). Gộp toàn bộ N1+P1+Q1+R1: 0/1008, p=0,000108 (báo kèm).
- **Nhưng verdict vẫn KHÔNG ĐÓNG:** lượt ngoài dải r1f3 att2
  (load 0,92 — tải THẤP) có 1 steady-close đã xác minh (2497 ms,
  drift 1,1) và drift re-seek ngay sau đó **kẹt ≥5771 ms liên tục,
  vẫn đang seeking lúc lượt kết thúc, ct đóng băng 2,4667, probe
  dừng sớm vì playhead đóng băng** — stall đầu tiên sau steady-close
  trong toàn bộ chuỗi N1/P1/Q1/R1. Prereg-r1 §5: "Bất kỳ stall nào →
  verdict KHÔNG ĐÓNG dù 0 CAP"; §7: "KHÔNG ĐÓNG nếu ≥1 stall > 2 s
  sau steady-close". R1 tuân theo luật đã đăng ký trước, không tự
  loại stall này vì lượt đó ngoài dải tải (luật stall-watch trong
  prereg không giới hạn ở lượt hợp lệ; và stall ở tải thấp càng
  không đổ được cho đói tải).
- **Lựa chọn để parent quyết:** nếu parent xét stall ngoài dải là
  ngoài phạm vi verdict E4 (vì stall-watch phục vụ lượt hợp lệ tải
  cao), thì E4 có thể tuyên **ĐÓNG ĐẦY ĐỦ (tải cao thuần Q1+R1,
  0/344, p=0,0083)** — R1 không tự quyết thay parent, chỉ ghi rõ
  cả hai cách đọc và số liệu đầy đủ để parent quyết.
- r1f1 không có lượt nào có dữ liệu (cả 2 attempt đều lỗi harness
  pause-seek 30 s timeout, như Q1). Slot gop250 chỉ có r1f3 att2
  đại diện (ngoài dải); gop30 có r1f2+r1f4 (cả 2 hợp lệ ngay attempt 1).
- Dị thường dial: load1 đáp ứng chậm nay tới **150–275 s** (tệ hơn
  Q1: 60–150 s); retry dial tối đa 120 s là KHÔNG ĐỦ (r1f3 att2
  dial hết 120 s ở load1 0,75 rồi chạy luôn — play-mean chỉ 0,92).
  Luật dial mới "hogs chạy ≥90 s trước khi tuyên bố ĐẠT" đã hoạt
  động đúng (18 lần từ chối 2-mẫu-trong-dải vì hogs chưa đủ 90 s,
  tránh bẫy tải dư — xem §3.3).

## 1. Prereg và phương pháp

- Prereg: `hidden_files/round115-r1/prereg-r1.md` (viết TRƯỚC mọi
  phép đo 17:44Z; bảng Fisher §8 sửa 2 số SAI trước khi đo — 200
  tick 0,0615→0,0447, 220 tick 0,0329→0,0379, tính lại bằng
  `math.comb`; 210 tick 0,0410 và 250 tick 0,0323 giữ nguyên, khớp
  bảng Q1 §8). Luật CAP, tick, luật đếm **y hệt N1/P1/Q1**.
  Mẫu số chính = **play-ticks**; 10 s quan sát sau cuối tự nhiên
  không tính vào mẫu số. Fisher chính = **nhị thức chính xác qua
  `math.comb`** (kiểm chéo bằng hàm `fisher_two_sided` của analyzer
  — khớp đúng 4–6 chữ số mọi so sánh; xem §4). Poisson chỉ báo kèm
  dạng nhị thức chính xác (1−6/284)^n, KHÔNG dùng xấp xỉ exp(−λ)
  làm số chính (đính chính Q9 đợt 114).
- Cây đo: **không đổi production trong lúc đo**. `preview.tsx` md5
  `03bf029f09b8890b285eacc10a02172b` (cây đã fix N1), kiểm tra
  trước/sau mỗi lượt, **không đổi**. `playheadHold90R2.ts`
  `1b68849a3f69dc13622e2a62e0ef37d1`, test
  `2f5c147cf4f557edc933720432b97cd2` (khớp Q1).
- **Phối hợp cây R2 (prereg-r1 §0):** R1 CHỜ cờ
  `hidden_files/round115-r2-tree` trước lượt đo đầu tiên. R2 giữa
  đợt đã sửa preview.tsx thành md5 `a419ae05…` (cap snapshot
  motion-blur, diff sơ bộ 18:12Z: chỉ 3 khối snapshot-cap, KHÔNG
  có ký hiệu skip-gate E4 nào — combineSkipRender /
  skipRenderSeeking / steadyClose / steadyAdvances), rồi **revert
  về đúng 03bf029f**; cờ xuất hiện 18:31Z: `md5=03bf029f…` +
  `NO-CHANGE`, diff vs baseline của R2 EMPTY (xác minh). Cây đo R1
  = 03bf029f, giống hệt Q1/N1/P1 → gộp Q1+R1 được phép theo
  prereg-r1 §0/§7(g) (thực tế không đổi một byte nào so với Q1).
- **Reboot #47 giữa lúc chờ cờ:** `uptime -s` = 2026-11-14
  17:45:50Z, boot_id `5578af38-911d-4f3b-93b0-383a1664f225`. Gap
  #46→#47 = 2h01'01" (15:44:49Z → 17:45:50Z), trong dải chứng nhận
  [19'07", 3h14'08"], không phá sàn. Số #47 TẠM THỜI (mù #33 mở).
  tsc + test của R1 chạy xong TRƯỚC reboot trên cùng cây md5
  03bf029f; đã chạy LẠI sau cờ R2 trên cây cuối trước lượt đo đầu
  tiên (xem §7).
- Probe: `apps/web/scripts/probe115r1.mjs` (47.541 B) — bản sao của
  `probe114q1.mjs`, diff chỉ đổi 3 đường path (scratch/CFG_DIR/
  BRIDGE_WORK_DIR) + 1 nhãn log + header comment; không đổi logic
  nào. probe114q1.mjs KHÔNG sửa.
- A/B: r1f1 gop250 / r1f2 gop30 / r1f3 gop250 / r1f4 gop30, loadN=4
  (4 `yes` của probe) + hog nice-19 ngoài (N=12 khởi đầu, dial ±4,
  tối đa 24). Dải hợp lệ: play-mean load1 ∈ [8,30] VÀ RAM đầu lượt
  ∈ [600.000, 3.500.000] kB VÀ browser-alive (Q1 §10.5+§10.7:
  (i) nSamples ≥ 20 VÀ VERDICT PASS/PASS; (ii) seekDoneRelMs
  không phải None; (iii) naturalEnd=true HOẶC playTicks ≥ 40;
  (iv) maxGap_all < 3000 ms; (v) ct-stall tối đa < 5000 ms).
  Mỗi slot retry tối đa 1 lần khi ngoài dải (theo covariate, không
  theo CAP); lỗi harness chạy lại; lượt dừng sớm (nSamples<20) là
  vô hiệu.
- **Dial tải (cải tiến từ bài học Q1 §3.3 — đăng ký trước):** cần
  **2 mẫu liên tiếp trong [8,30] VÀ hogs đã chạy ≥90 s** mới tuyên
  bố DIAL-ĐẠT (chống lừa bởi tải dư suy giảm và đáp ứng chậm của
  load1). Tối đa 300 s (lượt đầu) / 120 s (retry); hết thời gian
  chưa vào dải thì VẪN CHẠY ở mức đo được, ghi rõ (như Q1). Sampler
  driver **2 s** (dày hơn Q1 5 s) → play-mean n=15–16 ở lượt hợp
  lệ (Q1 chỉ n=4–8).
- Vite nối tiếp + lock: acquire riêng từng lượt bằng bản copy đóng
  băng `vcut-vite-lock-frozen.sh` (md5 fd21193c, khớp bản Q1 dùng),
  timeout 900 s, nhả lock giữa các lượt, dial-wait ngoài vùng lock,
  nhả ≥15 s trước khi giữ lại. Không lượt nào DEFER vì lock.
  (Lưu ý: log driver ghi nhãn "Q1 FIXED" ở dòng bắt đầu — nhãn cũ
  từ script Q1 chưa đổi tên, chỉ là nhãn log, không ảnh hưởng đo.)
- Nguồn tải: hog `nice -n 19` tái dùng (đã chứng minh ĐẠT ở Q1);
  SCHED_IDLE và I/O O_DIRECT KHÔNG thử lại (Q1 đã chứng minh KHÔNG
  DÙNG ĐƯỢC; task R1 dặn không thử lại).
- **Lệch nhỏ so với prereg §2.2 (ghi trung thực):** `run-r1.sh`
  (sao từ thiết kế 2+2 của Q1) chạy cả 4 slot liên tiếp, trong khi
  prereg §2.2 nói chỉ thêm r1f3/r1f4 nếu sau 2 slot tổng tick hợp
  lệ < 50. Thực tế r1f2 một mình đã cho 106 tick (≥50) nên theo
  chữ §2.2 thì r1f3/r1f4 là không cần. Cả 4 slot đều đã đăng ký
  trước trong bảng ma trận prereg §4, và việc gộp/loại mỗi lượt
  quyết theo covariate (tải/RAM/alive) đo được — KHÔNG theo kết
  quả CAP — nên không có chọn lọc theo kết quả. Lượt hợp lệ thêm
  (r1f4, 78 tick) chỉ làm mạnh thêm kết quả; lượt ngoài dải (r1f3
  att2) được báo riêng đầy đủ, kể cả stall. Không giấu dữ liệu nào.

## 2. Bảng lượt chạy A/B (4 slot, WebKit, cây 03bf029f, boot #47)

| Lượt | gop | Attempt | load1 dial → play-mean (n) | RAM đầu lượt (kB) / stratum | Browser-alive | Kết quả |
|---|---|---|---|---|---|---|
| r1f1 | 250 | 1 | dial KHÔNG ĐẠT 300 s (5,25) → 17,97 (n=36)* | 1.027.944 / L | ? (không có JSON) | **Lỗi harness** exit 2, không có probe-results.json (pause-seek 30 s timeout, §3.2) — chạy lại |
| r1f1 | 250 | 2 | dial ĐẠT 17,18 (92 s, N=12) → 15,30 (n=71)* | 1.361.592 / L | ? (không có JSON) | **Lỗi harness** exit 2 (pause-seek 30 s timeout, §3.2) — hết retry |
| r1f2 | 30 | 1 | dial ĐẠT 10,88 (274 s, N=24) → **23,52 (n=16)** | 1.084.168 / L | ALIVE | exit 0, PASS/PASS, **TRONG DẢI** ✓ |
| r1f3 | 250 | 1 | dial ĐẠT 14,72 (91 s, N=12) → 9,96 (n=32)* | 1.058.052 / L | ? (không có JSON) | **Lỗi harness** exit 2 (pause-seek 30 s timeout, §3.2) — chạy lại |
| r1f3 | 250 | 2 | dial KHÔNG ĐẠT 120 s (0,75) → **0,92 (n=7)** | 1.103.956 / L | ALIVE | exit 0, PASS/PASS, **NGOÀI DẢI (tải thấp)** — có dữ liệu, báo riêng (§6) |
| r1f4 | 30 | 1 | dial ĐẠT 15,04 (91 s, N=24) → **25,36 (n=15)** | 1.155.176 / L | ALIVE | exit 0, PASS/PASS, **TRONG DẢI** ✓ |

\* play-mean ở 3 lượt lỗi harness là **mean toàn bộ file sampler**
(không có cửa sổ phát vì probe chết ở pause-seek nên không có
marker "bắt đầu phát sau seek" — hàm play_mean_load1 không lọc
cửa sổ khi ps=None). Đó KHÔNG phải play-mean thật; ghi rõ để khỏi
nhầm (Q1 cũng có hiện tượng này nhưng LIMITS Q1 không ghi rõ —
đính chính tại đây, xem §3.3).
- 2 lượt hợp lệ tải cao: r1f2 + r1f4 (play-mean 23,52 / 25,36 — cả
  2 trong [8,30]; RAM L/L trong dải; ALIVE; md5/mtime không đổi;
  VERDICT PASS/PASS). Đây là 2 play-mean tải cao nhất trong cả
  chuỗi Q1+R1 (Q1 cao nhất 19,17).
- Tổng lượt A/B: 6 attempt (4 slot), 2 hợp lệ, 1 ngoài dải có dữ
  liệu, 3 lỗi harness (đều retry đúng luật; không lượt nào DEFER
  vì lock; không lượt nào browser DEAD).
- tsc + test trước A/B: `tsc --noEmit` exit 0, playheadHold90R2.test.ts
  **93 passed** (chạy lại trên cây cuối sau cờ R2, 18:31Z).
  Sau A/B: md5 preview.tsx vẫn 03bf029f…; 0 hog còn lại; vite
  :5580 down (curl 000); lock trống.

### 3.1 r1f2 — lượt hợp lệ (gop30): 106 play-tick, dừng sớm nhưng đủ dữ liệu

- Probe dừng sớm: "bắt đầu phát sau seek" 18:46:23 → "dừng sớm
  đóng băng-seeking" 18:46:55 (~32 s phát; naturalEnd=False).
  Play-mean 23,52 (n=16, sampler 2 s) trong dải; nSamples=97 ≥ 20;
  VERDICT PASS/PASS; seekDone 623 ms; maxGap_all 1595 ms;
  ct-stall ~2100 ms → ALIVE cả 5 tiêu chí. Tiêu chí (iii) đạt
  nhờ playTicks=106 ≥ 40 (naturalEnd=False vẫn hợp lệ theo luật
  Q1 §10.7 — tiền lệ p1f1 att2 tương tự).
- Phát chậm dưới tải cao (load1 ~23,5): ph chỉ tới ~5,3–5,6 sau
  ~32 s tường nên mới có 106 velocity tick (Q1 gop30 chỉ 54/42
  tick) — cùng cách đếm, khác mật độ tick vì phát chậm hơn.

### 3.2 Ba lỗi harness: pause-seek 30 s timeout, toàn bộ ở gop250

- r1f1 att1 (24 hog, dial không đạt): "pause-seek tới t=5:
  confirmed=false tElement=1110ms tCanvas=nullms" → PROBE LỖI
  exit 2. (att2: tElement tương tự, canvas null — xem run-r1.log.)
- r1f3 att1 (12 hog, dial ĐẠT 14,72): seek tới t=5 không được
  canvas xác nhận trong 30 s (tCanvas null) → PROBE LỖI exit 2.
- Cả 3: seek tới t=5 không được canvas xác nhận trong 30 s — giới
  hạn của probe dưới tải cao (canvas xác nhận chậm), không phải CAP
  và không phải lỗi production; đều retry đúng luật prereg §4.
  **Mẫu gop250 nay đã rõ (gộp Q1+R1): 5/8 attempt lỗi harness
  pause-seek** (Q1: q1f1a1, q1f3a1; R1: r1f1a1, r1f1a2, r1f3a1);
  **gop30: 0/4 lỗi** (q1f2, q1f4, r1f2, r1f4 đều hợp lệ ngay
  attempt 1). Seek-timeout là hiện tượng của gop250 dưới tải cao
  (xem §8 nợ mở).

### 3.3 Dị thường dial: load1 đáp ứng chậm nay tới 150–275 s; retry 120 s không đủ

- r1f1 att1 dial: load1 đọc 0,12–2,09 trong 240 s đầu dù 24 hog
  nice-19 đang chạy (state R, ~5% CPU mỗi hog); tới ~300 s mới
  lên 5,25 → KHÔNG ĐẠT sau 300 s. (Q1: 60–150 s.)
- r1f2 dial: 274 s mới ĐẠT (10,88, N=24). r1f3 att1 dial: ĐẠT ở
  91 s (14,72, N=12 — trên tải dư). r1f4 dial: ĐẠT ở 91 s (15,04,
  N=24).
- **Luật ≥90 s đã cứu nhiều lượt khỏi bẫy tải dư:** dial ghi 18
  lần "2 mẫu trong dải nhưng hogs mới chạy Xs (<90s) — CHỜ THÊM"
  (r1f1 att2: 10→81 s; r1f3 att1: 11→81 s; r1f4: 71→81 s) — nếu
  không có luật này, dial đã tuyên bố ĐẠT trên tải dư đang suy
  giảm (đúng bài học Q1 §3.3). Luật này giữ lại cho đợt sau.
- **r1f3 att2 — retry dial quá ngắn:** dial retry tối đa 120 s;
  load1 đọc 3,36→2,04 trong 60 s đầu rồi 0,75 lúc hết 120 s
  (24 hog) → KHÔNG ĐẠT, chạy theo luật "vẫn chạy ở mức đo được".
  Khác Q1 (q1f3 att2: load1 bước lên TRONG LÚC probe chạy nên
  play-mean vẫn 14,21), lần này load1 KHÔNG bước lên trong lúc
  probe chạy (play-mean 0,92, n=7) — vì hogs mới khởi sau khi
  hogs cũ của att1 bị giết, và 120 s + ~60 s probe là chưa đủ
  cho loadavg leo lên. **Bài học: cửa sổ retry 120 s không đủ
  trong điều kiện đáp ứng 150–275 s; đợt sau hoặc giữ hogs chạy
  xuyên suốt các attempt (không giết rồi khởi lại), hoặc nâng
  retry dial lên 300 s như lượt đầu.**
- Cơ chế gây chậm vẫn chưa xác minh (giả thuyết cgroup CPU quota
  như Q1 §3.3 — hog nice-19 state R nhưng chỉ ~5% CPU mỗi hog,
  loadavg không đếm đủ). Ghi là giả thuyết chưa xác minh, không
  ảnh hưởng verdict (dial + play-mean đo trực tiếp mới là số
  phân dải).

## 4. CAP và Fisher

- CAP (luật N1 = M1 = cũ): **0 trên mọi lượt có dữ liệu, mọi luật.**
  2 lượt hợp lệ: 0/184 play-tick (r1f2 106 + r1f4 78). Lượt ngoài
  dải r1f3 att2: 0/48. Tất cả R1 có dữ liệu: 0/232.
- Fisher 2 phía (play-ticks; tính bằng hàm analyzer VÀ kiểm lại độc
  lập bằng `math.comb` — khớp đúng 4–6 chữ số mọi so sánh):

| So sánh | p | Kết luận |
|---|---|---|
| R1 chính 2 lượt (0/184) vs K1-on (6/284) | **0,0859** | KHÔNG đạt <0,05 (đúng dự báo: R1 một mình không đủ lực — R1 là phần bổ sung) |
| R1 chính 0/184 vs L1-fix (1/179) | 0,4931 | Không có ý nghĩa |
| R1 chính 0/184 vs M1-fix (1/157) | 0,4604 | Không có ý nghĩa |
| R1 chính 0/184 vs N1 (0/180) | 1,0000 | Tham chiếu (cùng cây, tải thấp) |
| **Gộp tải cao thuần Q1+R1 (0/344) vs K1-on** | **0,0083** | **ĐẠT <0,05 — không cần trộn tải thấp** |
| Gộp N1+P1+Q1+R1 (0/1008) vs K1-on | 0,000108 | ĐẠT (báo kèm — đường gộp cũ, nay không cần) |
| Phụ: tất cả R1 có dữ liệu (0/232) vs K1-on | 0,0351 | Đạt về số, nhưng gồm lượt ngoài dải (r1f3 att2) — chỉ báo kèm, KHÔNG dùng để quyết định |
- Nhị thức chính xác hỗ trợ (báo kèm, không quyết định):
  P(0 CAP | 184 tick, rate K1-on 6/284) = 0,0197;
  P(0 | 344 tick) = 0,0006. (Poisson xấp xỉ exp(−λ) KHÔNG dùng
  làm số chính — xem prereg-r1 §3.)
- Đối chiếu quy tắc quyết định prereg §7: (a) 0 CAP trong các lượt
  hợp lệ tải cao ✓ (0/184); (b) kiểm cơ chế đạt ✓ (§5: 0 đuôi
  age ≥4000 ms trong lượt hợp lệ); (c) mọi steady/ended-close
  được loại đều có bằng chứng ✓ (§5); (d) ≥1 steady-close đã xác
  minh trong lượt hợp lệ tải cao của R1 ✓ (r1f4, 3179 ms — R1 tự
  thỏa (d), không cần mượn Q1); (e) stall-watch rộng **KHÔNG sạch**
  ✗ (§6: 1 stall ở r1f3 att2); (f) Fisher R1-lẻ p=0,0859 KHÔNG
  đạt; (g) cây R1 = 03bf029f, NO-CHANGE ✓ (gộp được).
  → Đi đường gộp cũng KHÔNG đạt vì (e) chặn cả hai đường gộp
  (§7 yêu cầu (a)–(e) trước khi xét Fisher gộp). **Verdict =
  KHÔNG ĐÓNG** (xem Kết luận trước + §6 để biết cách đọc thay thế
  mà parent có thể chọn).

## 5. Cơ chế: steady-close, ended-close (tải cao)

- **Steady-close đã xác minh (1, trên tải cao, lượt hợp lệ):**
  - r1f4: đuôi ended=6198, tuổi ở tick cuối 2776 ms, đóng ở tuổi
    **3179 ms** (tick 30; steadyAdvances_last=3, drift_last=0,73
    > 0,35). Đây là steady-close đóng MUỘN NHẤT trong chuỗi tải
    cao (Q1: 1892/1797 ms) — vẫn cách xa trần 4800 ms, và là
    bằng chứng trực tiếp rằng fix bắt được đuôi đáp-xa ngay cả
    khi drift lớn (0,73).
  - r1f2: 0 steady-close (đuôi đóng bằng ended-close, xem dưới).
- **Ended-close đã xác minh (1, trên tải cao, lượt hợp lệ):**
  r1f2: đuôi ended=27494, tuổi ở tick cuối 307 ms, đóng ở tuổi
  **819 ms** (tick 80; ct=6, dur=6, ended=true).
- **Phụ (r1f3 att2, ngoài dải):** steady-close đã xác minh
  (2497 ms; ended=6075, tuổi tick cuối 1499 ms, drift_last=1,1
  — drift LỚN NHẤT trong mọi steady-close đã xác minh của chuỗi:
  Q1 0,63/0,67; r1f4 0,73).
- **Không có đuôi nào age ≥ 4000 ms trong cả 2 lượt hợp lệ**
  (MECH: 0 đuôi) — như Q1 (0 đuôi). Vì vậy (b) prereg §7 đạt
  theo dạng mạnh, và paused<20% trong đuôi age≥4000 ms đạt theo
  dạng rỗng (không có đuôi nào để đo).
- Đuôi cuối clip: r1f2 (ended=19326, tuổi 1378 ms, rearm cứu:
  rearms 4→5 ở tick 53); r1f4 (ended=16487, tuổi 387 ms, rearm
  cứu: rearms 2→3 ở tick 54). Tất cả đều KHÔNG CAP.

## 6. Stall-watch cửa sổ rộng và quirk frame cuối

### 6.1 Stall-watch trên tập hợp lệ: SẠCH

- r1f4: drift re-seek đầu tiên sau steady-close ở tick 31,
  seeking **1584 ms** (<2000 ms, không stall).
- r1f2: 0 steady-close nên không có stall-watch.
- **Trên tập hợp lệ, stall-watch sạch.**

### 6.2 STALL ở r1f3 att2 (ngoài dải tải thấp) — phát hiện chặn verdict

- **Chuỗi sự kiện (từ probe-results.json, 3 tín hiệu độc lập khớp
  nhau):** steady-close đã xác minh ở tick 20 (t=8572 ms,
  closure_age 2497 ms, drift_last=1,1) → resyncsV 1→2 ở tick 21
  (t=9086 ms; drift re-seek, restartV không tăng) → element
  `seeking=True` liên tục, ct đóng băng ở **2,4667** (velocity
  tick 21–29+ ct/ph đều = 2,4667) → sampler ghi chuỗi seeking
  liên tục **relMs 8330 → 14101 = 5771 ms, vẫn đang seeking ở mẫu
  cuối cùng** (lượt kết thúc khi còn seeking) → probe dừng sớm
  18:52:41 ("playhead đóng băng ≥2,5s trong lúc seeking (đúng hành
  vi giữ sau sửa)").
- **Số đo stall:** analyzer đo **2915 ms, truncated=True** — đó là
  CẬN DƯỚI do cửa sổ đo của analyzer chỉ [seek−200, seek+3000]
  ms; số thật từ sampler thô là **≥5771 ms** (chuỗi seeking chạm
  tới mẫu cuối của lượt). Cả hai đều > 2000 ms → STALL theo luật
  prereg §5, không còn nghi ngờ về ngưỡng.
- **Bối cảnh khác biệt:** lượt này tải THẤP (play-mean load1
  0,92 — ngoài dải vì quá thấp, không phải quá cao); gop250;
  drift 1,1 (lớn nhất chuỗi); playhead không bao giờ qua ph ~2,5
  (0 tick trong cửa sổ ph≥5,0). Các re-seek sau steady-close
  trước đây đều hoàn thành nhanh: Q1 1594/396 ms, r1f4 1584 ms —
  đây là lần ĐẦU TIÊN một re-seek sau steady-close kẹt trong toàn
  bộ chuỗi N1/P1/Q1/R1.
- **Lưu ý về checker browser-alive (v):** alive-check của r1f3
  att2 vẫn PASS cả 5 tiêu chí, kể cả (v) ct-stall ~2300 ms
  < 5000 ms — vì (v) đo ct đóng băng lúc playing=true từ sampler
  JSON, còn stall-watch đo seeking liên tục sau re-seek; hai
  metric đo hai thứ khác nhau (trong lúc kẹt, playing không còn
  true). Không mâu thuẫn — nhưng cho thấy (v) không bắt được
  kiểu kẹt seeking này; stall-watch mới là công cụ đúng.
- **Giả thuyết (CHƯA xác minh — nợ đợt 116):** (a) độ lớn drift —
  hiệu chỉnh 1,1 s cần decode dài, nhất là gop250 (keyframe cách
  ~8,3 s; seek tới 2,47 s phải decode từ keyframe 0); (b) decoder
  stall không liên quan steady-close (re-seek vẫn phải bắn khi
  drift tới 1,1 dù đuôi có đóng hay không — nhưng re-seek này
  bắn NGAY SAU steady-close, đúng mẫu stall-watch theo dõi);
  (c) trục trặc probe/vite (không có bằng chứng). Cần lượt tái
  hiện có kiểm soát (gop250 vs gop30, drift lớn) mới kết luận.
- **Vì sao chặn verdict:** prereg-r1 §5/§7 viết không giới hạn
  phạm vi lượt hợp lệ ("Bất kỳ stall nào → verdict KHÔNG ĐÓNG
  dù 0 CAP"). Stall này ở cùng cây, cùng probe, sau steady-close
  đã xác minh — và ở tải thấp nên không đổ được cho đói tải.
  R1 không tự "ngoại lệ hóa" nó.

### 6.3 Quirk frame cuối

- **r1f2: (i) ended bắn trong lúc phát** — quirk KHÔNG tồn tại
  trong đường này (tick 67, t=24217, ct=6, dur=6, ph=5,3).
  Đây là quan sát (i) ĐẦU TIÊN trong chuỗi tải cao (Q1 cả 3 lượt
  đều (iii)); ủng hộ rằng ended CÓ bắn trong lúc phát ít nhất
  đôi khi, dù cửa sổ quan sát mỏng.
- r1f4: (iii) không đủ cửa sổ (24 tick playing=true trong cửa sổ
  ph≥5,0; playing=false trước khi đủ 2 tick loại (ii)).
- r1f3 att2: (iii) không đủ cửa sổ (0 tick playing=true trong
  cửa sổ ph≥5,0 — playhead kẹt ở ph ~2,5 vì stall §6.2).
- Không quan sát được ended-không-bao-giờ-đúng ở lượt nào; quirk
  no-ended vẫn chưa có câu trả lời dứt khoát (cần clip dài hơn
  hoặc cửa sổ rộng hơn, prereg riêng).

## 7. Kiểm chứng

- `tsc --noEmit` (apps/web): **exit 0** (trước A/B trên cây cuối,
  sau cờ R2, 18:31Z; và trước đó cũng exit 0 trên cùng cây trước
  reboot #47).
- `playheadHold90R2.test.ts`: **93 passed** (trước A/B trên cây
  cuối, 18:31Z).
- md5 cây đo trước/sau mỗi lượt đều không đổi (xem §2); không thay
  đổi production nào trong R1 — chỉ đo + thêm probe/LIMITS.
- Analyzer: `analyze-r1-*.py` (code Fisher y hệt N1/P1/Q1) — đã
  kiểm chứng khớp 100% trên dữ liệu Q1 2+2 trước A/B (160
  play-tick, 0 CAP, 2 steady-close 1892/1797 ms + 1 ended-close
  1601 ms — khớp LIMITS Q1 §3).
  Fisher gộp tính lại độc lập bằng `math.comb` (khớp analyzer:
  R1-lẻ p=0,0859; Q1+R1 p=0,0083; gộp N1+P1+Q1+R1 p=0,000108;
  tất-cả-R1 p=0,0351).
- Checker browser-alive: ALIVE cả 2 lượt hợp lệ + r1f3 att2
  (xem §2/§6.2 về khác biệt (v) vs stall-watch).
- Sau A/B: 0 hog còn lại (pgrep yes = 0, 18:57Z); lock vite trống;
  vite :5580 down (curl 000); md5 preview.tsx 03bf029f… không đổi.
- File `analyze-r1-cap-pattern.py` khi chạy module-level cũng cho
  bảng gộp R1: runs=3, play_ticks=232, all_ticks=300, CAP 0 cả 3
  luật, Fisher tất-cả-R1 p=0,0351 — khớp số tay.

## 8. Hạn chế và nợ mở

1. **STALL r1f3 att2 (nợ lớn nhất, chặn verdict E4):** drift
   re-seek sau steady-close kẹt ≥5771 ms (drift 1,1, gop250,
   tải thấp 0,92). Đợt 116: tái hiện có kiểm soát (gop250 vs
   gop30; drift lớn cưỡng bức); đo seeking bằng sampler 100 ms
   tới khi seek xong (không cắt ở 3000 ms); kiểm tra xem seek
   có bao giờ xong không và sau bao lâu. Cho tới khi chẩn đoán
   xong, E4 giữ **KHÔNG ĐÓNG** theo prereg (trừ khi parent quyết
   stall ngoài dải là ngoài phạm vi — xem Kết luận trước).
2. **Dial tải:** đáp ứng load1 chậm tới 150–275 s (tệ hơn Q1);
   retry dial 120 s KHÔNG ĐỦ. Đợt sau: giữ hogs chạy xuyên suốt
   các attempt (đừng giết rồi khởi lại — giết làm loadavg rơi và
   phải leo lại từ đầu), hoặc nâng retry dial lên 300 s. Luật
   ≥90 s hog-age GIỮ LẠI (đã chứng minh có ích, §3.3).
3. **Seek-timeout dưới tải cao (gop250):** 5/8 attempt gop250
   lỗi harness pause-seek 30 s (Q1+R1 gộp) vs 0/4 ở gop30. Probe
   nên có retry seek hoặc timeout dài hơn dưới tải cao — nợ dụng
   cụ (đã ghi từ Q1, nay bằng chứng mạnh hơn).
4. **Play-mean cho lượt lỗi harness bị ghi sai nhãn:** hàm
   play_mean_load1 trả mean toàn-file khi không có cửa sổ phát
   (ps=None). Sửa để trả NA + ghi rõ "không có cửa sổ phát" thay
   vì một con số trông như play-mean (Q1 cũng mắc — đính chính
   chung tại đây).
5. **Quirk no-ended chưa có câu trả lời dứt khoát:** r1f2 cho
   (i) đầu tiên ở tải cao; r1f4/r1f3 (iii). Cần clip dài hơn hoặc
   cửa sổ quan sát rộng hơn (prereg riêng, như P1 §5 đã ghi).
6. **Script chạy cả 4 slot dù prereg §2.2 có điều kiện** (xem
   §1): không ảnh hưởng tính đúng đắn (slot đăng ký trước, gộp/
   loại theo covariate), nhưng đợt sau nên để driver kiểm tra
   tick hợp lệ tích lũy giữa các cặp slot rồi mới quyết có chạy
   tiếp không — hoặc sửa prereg cho khớp thiết kế script 2+2.
7. **Chưa lên:** đợt 111–114 (38 batch / 79 entry / 69 file duy
   nhất) + 1 file oversize 6,4 MB
   `benchmarks/results/webkit-blob-flaky-96x3.json`;
   ci-security.yml vẫn 403 chờ user; G1 + mù #22/#28/#29/#30/#31/
   #32/#33 chờ user quyết; TTS 39 CẤM kiểm lại; birefnet 0 lần
   thành công (RAM <6 GB).

## 9. File trong batch

- `docs/PHASE9_ROUND115_R1_E4HIGHLOAD_LIMITS.md` (file này).
- `apps/web/scripts/probe115r1.mjs` — **47.541 B > 37.768 B, cần
  `ENABLE_PRIVSEP=0` khi push**.
- Dữ liệu thô + script + prereg + analyzer: `hidden_files/round115-r1/`
  (không push; prereg 1 đính chính bảng Fisher, run-r1.sh,
  run-r1.log 298 dòng, check-r1-browser-alive.py, analyzer, 3 thư
  mục probe có dữ liệu + 1 thư mục r1f1 lỗi harness, hog-load-*.txt,
  analyze-r1-*.txt, tsc-test.log, tsc-test-final.log).
