# PHASE9_ROUND129_T4_WEBKIT_QUIET7_LIMITS — WebKit lượt yên theo dõi lần 7 (CHẠY LẠI LẦN 3): CÓ LƯỢT YÊN HỢP LỆ — LẦN 7 ĐÓNG — ngưỡng GIỮ

> Luồng T4, đợt 129, lượt cron 15:35 +07 17/11/2026 (bắt đầu ~08:40Z).
> Repo `~/workspace/repo-1` (cây làm việc, KHÔNG có `.git` local).
> KHÔNG push. KHÔNG release/tag. KHÔNG sửa file production nào.
> Không đụng TTS 39, birefnet, `.github/workflows`, 0 binary vào batch.
> **CHỈ CHẠY 1 ATTEMPT — attempt1 đã là lượt yên hợp lệ, dừng theo
> protocol S5 (1 lượt) và ngân sách "tối đa 3 attempt".**
>
> **Kết quả chính — LƯỢT YÊN THEO DÕI LẦN 7 ĐÃ ĐÓNG (sau 2 đợt liên
> tiếp không đóng được).**
> 1. **Attempt1 (20/20, exit 0): tickCost total median 54,0 ms —
>    LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ.** load1 max 1,48 (11 mẫu),
>    RAM min 1315 MB (0 mẫu <1024 MB), load5 cuối 0,93, không
>    reboot, apt/dpkg 0; ps-before/after sạch (không process luồng
>    khác trong cửa sổ đo).
> 2. **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** — lần 7 đóng với median
>    54,0 ms. 6 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 /
>    44,0 / 54,0 ms, trung bình 47,8 ms. Không siết thêm từ 1 lượt.
> 3. **(c2) +1f: tái hiện 2 lần** — seq 136 (presented 16, label
>    15) và seq 181 (presented 36, label 35), cùng chữ ký cũ (label
>    kém presented đúng 1f). Chuyển T5 chẩn đoán (T5 đợt 129 đối
>    chiếu histogram (pixFrame−label)).
> 4. **Event lag ≥+5f: 0 occurrence** — event cũ đợt 126 (seq
>    276–279, frame 27) KHÔNG tái hiện.
> 5. **F6' vẫn ĐÃ ĐÓNG** (100%/100%, n=74) — không đóng lại,
>    không mở lại.
> 6. Cờ mở leg T8 (`round129-t4-done`) đã touch 08:58:20Z ngay khi
>    attempt1 xong + phân tích xong (trước LIMITS/batch) — phối hợp
>    đúng hẹn, lịch lệch T4-yên TRƯỚC, T8-harness SAU.

## 0. Môi trường đo + prereg + cây đo

- **Prereg:** `hidden_files/round129-t4/prereg-t4.md` — viết TRƯỚC
  mọi phép đo (08:41Z), đăng ký: gate 0 + lớp A + lớp B gồm B5,
  ngưỡng ≤60 ms, B2 GIỮ NGUYÊN theo quyết parent đợt 128 §12.3(a),
  quy tắc quyết định, touch cờ `round129-t4-done` ngay khi attempt
  xong để T8 bắt đầu harness sau, Xvfb unlink socket sau kill,
  mẹo pkill `poll-t4[.]sh`, KHÔNG đo lại RAM idle, KHÔNG đo TTS 39,
  KHÔNG thử birefnet, dừng sau tối đa 3 attempt.
- **Chốt chặn round-in-progress.md:** TỒN TẠI lúc T4 bắt đầu nhưng
  là marker MỞ ĐỢT 129 do parent tạo (08:36:35Z, ghi rõ "(a) lượt
  yên WebKit #7 chạy lại lần 3... T4-yên TRƯỚC, T8-harness SAU"),
  KHÔNG phải đợt main-chat — T4 tiến hành bình thường (ghi rõ
  trong prereg).
- **Boot trong đợt: #75 (không reboot trong lúc T4 chạy).**
  Boot #75 (`uptime -s` 2026-11-17 07:13:31Z, boot_id
  `475406f6-8cd8-4a97-a5b3-e798f24d1a26`, số #75 theo task).
  Gap #74→#75 = 2h18m27s = **8307 s** (#74 btime 04:55:04Z →
  #75 07:13:31Z). Reboot xảy ra trong khung (06:20:05Z, 07:13:31Z]
  — lần thứ 4 liên tiếp reboot giữa đợt đóng và lượt mở (theo
  marker đợt 129; T4 chỉ ghi boot id + btime, không đụng
  bookkeeping mù).
- **Replay boot #75: KHỎE.** dpkg_lines=1509 (hình dạng khỏe như
  boot #73/#74 — T5 đợt 129 theo dõi số dòng replay).
  Postboot-check check-only riêng PASS từ pre-flight gate 0
  08:43Z và PASS lại sau lượt (08:58Z).
- **Cây đo:** baseline `03bf029f` / media.ts `2c384ed1` — KHÔNG ĐỔI
  suốt đợt (kiểm lúc bắt đầu 08:41Z = mọi poll gate0/gate A =
  kiểm cuối 08:58Z). Lock v2 md5 `cd0c05c1` — bản ĐÚNG. Fixture
  `stripes-nonperiodic.mp4` md5
  `2e00e91c94e6f78a9e53193a543e37bd` — KHỚP bản M5.
  GT frames `frames-nonperiodic/` (90 PNG) tại
  `hidden_files/round111-m5/frames-nonperiodic`. Binary local-only,
  KHÔNG stage.
- **WebKit:** 27.2 (webkit-2388), Playwright-core 1.65.0.
- **Dry-run analyzer TRƯỚC khi đo: PASS 100%.**
  `analyze-t4-{tickcost,wallbands}.py` trên JSON S5 attempt3 tái tạo
  đúng median 49,5 / p90 75,0; trên JSON T4 attempt1/2/3 đợt 128 tái
  tạo đúng median 75,0 / 63,0 / 55,0 (partial). Quirk ghi lại:
  `analyze-t4-{labellag,skiplatest,lag5}.py` KHÔNG nhận `tag=path`
  (chỉ nhận đường dẫn trần) — lần đầu gọi sai `tag=` nên 3 file
  analyze ra trống (traceback FileNotFoundError); gọi lại đường
  dẫn trần thì chạy đúng. Cùng quirk đã ghi ở đợt 127/128.
- **RAM host dao động mạnh (xem §7.1):** lúc mở đợt 1013 MB rồi
  rơi 861 MB (08:38Z, DƯỚI ngưỡng gate A 1024 MB lúc bắt đầu);
  trong cửa sổ attempt: 1315–1731 MB; sau lượt: 2523 MB.
- **Vite lock v2-ONLY**, cổng T4 **5187**. T4 giữ lock 1 lần
  (attempt1 duy nhất), nhả sạch ngay sau probe.
- **Các luồng đợt 129 khác:** lúc T4 bắt đầu (08:40Z) đã có
  round129-t2, round129-t5 (TRỐNG — T5 chưa viết cờ), round129-t6,
  round129-t8, round129-t9; round129-t1/t3 chưa tồn tại. Lúc
  attempt1 bắt đầu (08:51Z): t1.done, t6.done, t7.done, t9.done đã
  có; t2 (probe mù #48) và t3 (hb129) vẫn đang làm việc nhưng
  KHÔNG có process nặng nào trong ps lúc kiểm; T2 xong trong lúc
  T4 đo (round129-t2.done xuất hiện trước 08:58Z) — ps-before/
  after của attempt1 sạch nên không nhiễm tải (xem §3).

## 1. Gate 0 — ĐẠT ở poll #1 (08:43:19Z)

- **Poll #1 (08:43:19Z):** t5flag=PASS (T5 POSTBOOT_PASS cho #75,
  boot_id `475406f6…` KHỚP, btime 07:13:31Z KHỚP, pass_at
  08:43:05Z, poll=3 — T5 kiểm lại trực tiếp, không chỉ qua log
  gate0-wait) + t7flag=VANG-T7-DONE (round129-t7.done mtime
  08:43:13Z ≥ boot) + postboot-check check-only riêng PASS (exit 0
  — libs đủ, GST đủ isomp4+libav, apt đủ 11 package; log poll3 của
  T5 xác nhận replay 1509 dòng) + apt_procs=0 + dpkg_lines=1509
  + load1=2,84 + RAMavail=947 MB + preview_md5=03bf029f.
  **GATE 0 ĐẠT từ poll #1.** Không cần poll thêm.
- run-t4.sh gate 0 try 1 PASS ở attempt1 (postboot 0, aptx 0,
  dpkgx 0).

## 2. Gate A — mở ngay poll 1 ở attempt1

### 2.1 Attempt1 (08:51:24Z, poll 1, MỞ)

- load1=0,42 load5=1,00 lock=khong blockers=0 RAMavail=1417 MB
  tree=YES:md5=03bf029f. **CỬA YÊN MỞ poll 1.** Máy yên thật sau
  khi các luồng nặng xong hẳn (t1/t6/t7/t9 đã .done; t2/t3 không
  chạy process nặng lúc kiểm) — khác hẳn đợt 128 (gate A mở
  nhưng T2 chồng lên cửa sổ đo).

## 3. Attempt1 — 20/20 pass, exit 0, median 54,0 ms — LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ #7

- **Probe:** 20/20 pass, exit 0 (08:51:2x–08:54:56Z). tickCost n=540.
  Vite :5187 kill sạch sau probe (curl 000); lock v2 nhả sạch.
  Xvfb :193 (probe tự spawn) — process đã kill trong finally,
  socket X193 sót lại, T4 đã xóa tay (xem §7.3).
- **Số đo:** tickCost total median **54,0** / p90 81,0 / max 130 /
  min 31; hậu flip+2000ms median 53,0 (n=388). tBlend gap n=434
  median 99,0 / p90 137,8 / max 2302. BlendTick/pass=21,8;
  rAF/pass median 34 (min 28, max 36). webkit=27.2, pageErrs=[].
- **Phân rã wallMs:** 0–20k median 63,0 (n=59); 20–32k 50,0 (n=101);
  32–45k 50,0 (n=91); 45–62k 55,5 (n=126); 62–70k 54,0 (n=66);
  70–80k 51,0 (n=73). Dải đầu 0–20k cao hơn (63,0) rồi ổn định
  ~50–55 — ghi nhận như quan sát, không kết luận nguyên nhân
  (dải đầu trùng lúc vite/WebKit vừa lên).
- **Lớp B: 5/5 ĐẠT** — B1 DAT (load5 cuối 0,93 ≤ 2,5); **B2 DAT**
  (load1 max 1,48 — lượt yên nhất kể từ attempt3 đợt 128 với
  1,92; 11/11 mẫu ≤1,48); B3 DAT (không reboot); B4 DAT
  (apt/dpkg 0); **B5 DAT** (RAM min 1315 MB, 0 mẫu <500 MB;
  0/11 mẫu <1024 MB — không còn cảnh báo RAM như đợt 128).
  Sampler 20 s, 11 mẫu: load 0,42→1,48→0,54; RAM 1315–1731 MB.
  **ps-before/after: KHÔNG có process luồng khác nào** (chỉ vite
  của chính T4 trong ps-after; ps-before trống hoàn toàn ở các
  mẫu lọc python/probe/vite/MiniBrowser/webkit).
  T2 xong giữa lượt (round129-t2.done xuất hiện trước 08:58Z)
  nhưng không để lại process nào trong cửa sổ đo — không nhiễm.
- **(b) unique-match / F6':** labellag skp=1: nTick=74,
  nOccurrence=148, (c)=0, (c2)=0; skp=0: nTick=240, nOccurrence=480,
  (c)=2, (c2)=2 — **seq 136, presented 16, label 15, lag +1f** và
  **seq 181, presented 36, label 35, lag +1f**.
  Skiplatest: (1) 100,0% (74/74), (2) 100,0% (74/74) —
  **F6' vẫn ĐÃ ĐÓNG** (không đóng lại, không mở lại).
- **Lag ≥+5f: 0 occurrence** (cả 2 skp; max 4f). Event cũ đợt 126
  (seq 276–279, frame 27) KHÔNG tái hiện.
- **Kết luận attempt1: LƯỢT YÊN HỢP LỆ — lần 7 ĐÓNG.**
  Median 54,0 ≤ 60 + lớp B 5/5 ĐẠT + 20/20 pass hoàn chỉnh.

## 4. Vì sao chỉ chạy 1 attempt (không chạy attempt2/3)

- Task đợt 129: "tối đa 3 attempt" — trần, không phải định mức.
  Prereg S5: protocol lượt yên là 1 lượt duy nhất; các lượt yên
  hợp lệ trước (S5, T4-118, T3-121, T9-125, T9-126a2) đều chỉ
  1 lượt. Attempt1 đã thỏa mọi điều kiện verdict (hoàn chỉnh +
  lớp B 5/5 + median ≤60) nên verdict đã chốt — attempt thêm
  không đổi được verdict, chỉ tốn cửa sổ yên của T8-harness sau.
  T4 dừng ở 1 attempt theo đúng prereg đã đăng ký trước.

## 5. Phân tích verdict ngưỡng — GIỮ ≤60 ms, lần 7 ĐÓNG

- **Lượt yên hợp lệ lần 7: median 54,0 ms ≤ 60 ms → GIỮ ngưỡng
  ≤60 ms.** Nợ lượt yên theo dõi lần 7 ĐÓNG sau 2 đợt liên tiếp
  không đóng được (đợt 127: 0 probe; đợt 128: 3 probe, 0 lượt
  hợp lệ).
- **6 lượt yên xác nhận:** S5 49,5 / T4-118 40,0 / T3-121 52,0 /
  T9-125 47,5 / T9-126 44,0 / **T4-129 54,0**; trung bình 47,8 ms.
  Median lần này cao nhất trong 6 lượt (54,0 so với trung bình
  47,8) nhưng vẫn dưới ngưỡng với biên 6,0 ms — ghi nhận, không
  siết thêm từ 1 lượt (cần thêm lượt yên độc lập mới xem xét).
- **Không mở lại nợ ngưỡng, không nâng ngưỡng** — median ≤60.

## 6. Kiểm chứng hồi quy + hạ tầng

### 6.1 RAM host sụt giữa lượt (không ghim phẳng)

- RAMavail trong đợt: lúc mở 1013 MB → rơi 861 MB (08:38:57Z,
  DƯỚI gate A 1024 MB lúc bắt đầu — gate A chưa mở lúc đó, chờ
  là đúng); gate 0: 947 MB; attempt1 mở cửa 1417 MB, giữa lượt
  1315–1731 MB (0 mẫu <1024 MB); sau khi T4 dừng (08:58Z):
  2523 MB. RAM hồi nhanh sau khi probe dừng, cho thấy áp lực
  trong lượt một phần do chính WebKit/vite giữ, một phần host-level.
- Không có process đơn lẻ nào chiếm RAM lớn trong ps-before/after
  attempt1 (chỉ vite + WebKit của T4) — giống đợt 124/125/126/
  127/128. Ngưỡng RAM giữ nguyên (không hạ để "cho qua").

### 6.2 Hồi quy — cây không đổi, tsc 0

- `preview.tsx` md5 `03bf029f` không đổi: ghi lúc bắt đầu
  (08:41Z) = mọi poll gate0/gate A = kiểm cuối (08:58Z).
  `media.ts` md5 `2c384ed1` không đổi.
- **`tsc` apps/web: exit 0** (chạy 08:58Z, log `tsc-after.log`).
  `vite build`: KHÔNG chạy lại — cây baseline đã được T3 verify sau
  khi gỡ patch đợt 122 (tsc + vite build PASS); cây md5 không đổi
  nên verify này vẫn áp dụng.
- `ghostBlend.probe.test.ts`: KHÔNG chạy — không sửa code
  production, không có lượt đo nào cần hồi quy thêm.
- Postboot-check sau lượt: exit 0 (08:58Z) — replay boot #75 vẫn
  PASS sau khi đo xong.

### 6.3 Sự cố hạ tầng + vận hành trong lúc đo

1. **Xvfb :193 để lại socket sót sau attempt1.** Probe spawn
   Xvfb :193 và kill SIGKILL trong finally — process chết nhưng
   file socket `/tmp/.X11-unix/X193` còn lại (SIGKILL không dọn
   socket). T4 đã xóa tay sau attempt (08:57Z); cuối đợt
   `/tmp/.X11-unix/` trống, 0 Xvfb process. Khác vụ T3 đợt 127
   (:197 còn PROCESS chạy làm O8 exit=2) — đây chỉ là socket sót.
   Đề xuất vẫn đứng: probe nên unlink socket của mình sau kill
   (T4 đã làm tay đợt 128 + đợt này).
2. **Analyzer `tag=` quirk tái hiện:** `analyze-t4-{labellag,
   skiplatest,lag5}.py` chỉ nhận đường dẫn trần, gọi `tag=path`
   gây FileNotFoundError và 3 file analyze ra trống (đã ghi trong
   prereg đợt 128 §0 — lần này T4 mắc lại ở lần gọi đầu, gọi lại
   đường dẫn trần thì đúng). `analyze-t4-{tickcost,wallbands}.py`
   nhận `tag=path` bình thường. Nợ nhỏ: thống nhất interface
   analyzer (nhận cả 2 dạng) ở đợt sau — không sửa giữa đợt.
3. **`pkill poll-t4[.]sh` ĐÚNG:** dọn poller sau lượt không tự
   giết shell (bài học đợt 128 §7.3 mục 2 đã áp dụng đúng).
4. **Xếp lịch đúng hẹn đợt này:** attempt1 chạy vào cửa sổ yên
   thật (t1/t6/t7/t9 đã .done; t2/t3 không chạy process nặng lúc
   kiểm) — load1 max 1,48, thấp nhất trong các attempt gần đây
   (attempt3 đợt 128: 1,92). Chứng minh quyết parent đợt 128
   §12.3(a) đúng: B2 đạt được khi xếp lịch đúng, không cần nới bar.
5. **Phối hợp lịch T8 ĐÚNG HẸN:** T8 chờ cờ T4 (wait-t4-129t8.sh
   đã thấy trong ps lúc 08:43Z); T4 touch cờ `round129-t4-done`
   ngay 08:58:20Z khi attempt1 xong + phân tích xong (trước
   LIMITS/batch). T3 vẫn chưa .done lúc T4 đóng (đang làm hb129).
6. **check-classb nay in verdict tổng:** dòng `LOP-B-TONG: DAT
   5/5` đã in đúng ở attempt1 (nợ LIMITS đợt 127 §9.3 / đợt 128
   §7.3 mục 6 — ĐÃ ĐÓNG ở bản copy đợt này; cần mang vào bản gốc
   các đợt sau).

## 7. File đã đổi + batch đã stage (KHÔNG push)

- `docs/PHASE9_ROUND129_T4_WEBKIT_QUIET7_LIMITS.md` — file này.
- **KHÔNG đổi file production nào.** Probe KHÔNG đổi nên KHÔNG
  stage lại. Script `gate0-wait-t4-475406f6.sh` (adapt từ đợt 128:
  round129-t4/t5/t7, hậu tố 475406f6, boot #75),
  `run-t4.sh` / `t4-attempt-inner.sh` (find round129-* sau marker)
  / `check-classb-t4.sh` (in verdict tổng LOP-B-TONG + comment
  round129) / `poll-t4.sh` (adapt round129) — bản copy trong
  `hidden_files/round129-t4/`, ngoài repo — không stage.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round129-t4-quiet7.txt`
  (NUL-delimited, 1 file text trên; đã đọc lại xác nhận).
- Log + dữ liệu: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round129-t4/`
  (prereg-t4.md [viết trước khi đo],
  probe121t3-ghost-k7.webkit.mjs [KHÔNG SỬA, md5 `dccb8f4c…`],
  analyze-t4-{tickcost,wallbands,labellag,skiplatest,lag5}.py
  [copy đợt 128],
  analyze-t4-dryrun-all-{tickcost,wallbands}.txt [dry-run PASS đợt
  này: S5 49,5/75,0 + r128a1 75,0/96,0 + r128a2 63,0/92,0 +
  r128a3 partial 55,0/81,0],
  b.json [copy đợt 128, md5 `078938cf…`],
  vite.t4-temp.config.mjs [copy đợt 128, HMR tắt, watch.ignored
  0 watch],
  vcut-vite-lock-v2.frozen.sh [copy lock v2, md5 `cd0c05c1`],
  run-t4.sh [adapt đợt 129: round129-t4, hậu tố log 475406f6,
  ticket lock t4] + t4-attempt-inner.sh [adapt round129-* +
  hậu tố 475406f6 + sampler đã sửa đợt 125]
  + check-classb-t4.sh [lớp B gồm B5 + in verdict tổng]
  + gate0-wait-t4-475406f6.sh [gate 0 #75 ĐẠT poll #1]
  + gate0-wait-t4-475406f6.log + gate0-wait-t4-475406f6.nohup.log,
  poll-t4.sh + poll-t4.log [mẫu 5 phút + gate0/gateA: gate 0 đạt
  poll #1, gate A mở poll 1 attempt1] + poll-t4.nohup.log,
  postboot-t4-475406f6-gate0wait-1.log [gate 0 #75: exit 0]
  + postboot-t4-475406f6-attempt1-gate0.log [gate 0 run-t4.sh:
  PASS] + postboot-t4-475406f6-after.log [sau lượt: exit 0],
  run-t4-attempt1.nohup.log [attempt1],
  chain-t4.log [gate0/gateA attempt1 + lớp B + touch cờ],
  ps-before-t4-attempt1.txt + ps-after-t4-attempt1.txt,
  load-mid-t4-attempt1.log [sampler 20 s, 11 mẫu],
  vite-5187-t4-attempt1.log,
  run-webkit-t4-attempt1.log,
  preview-b-f3-flip-webkit-t4-attempt1.json [attempt1:
  20/20, 2.751.100 B — giữ trên đĩa, KHÔNG đưa vào paths],
  analyze-t4-attempt1-{tickcost,wallbands,labellag,
  skiplatest,lag5}.txt,
  classb-t4-attempt1.txt,
  tsc-after.log [tsc exit 0],
  tree-md5.txt [`03bf029f` — baseline]).
- Cờ xong: `hidden_files/round129-t4.done` (kèm verdict 1 dòng).
  Cờ mở leg T8/T3: `hidden_files/round129-t4-done` đã touch
  08:58:20Z ngay khi attempt1 xong (trước LIMITS/batch).

## 8. Nợ mở + đề xuất cho đợt sau

1. **Nợ lượt yên theo dõi lần 7: ĐÃ ĐÓNG ở đợt 129** (median 54,0
   ms, lớp B 5/5). Ngưỡng WebKit ≤60 ms GIỮ (6 lượt yên xác nhận:
   S5 49,5 / T4-118 40,0 / T3-121 52,0 / T9-125 47,5 / T9-126
   44,0 / T4-129 54,0; trung bình 47,8 ms). Lượt yên theo dõi
   TIẾP THEO là lần 8 — chạy lại theo lịch thường lệ ở đợt sau,
   không phải chạy lại lần 7 nữa.
2. **(c2) lệch nhãn +1f: tái hiện 2 lần đợt này** (attempt1 seq 136
   presented 16/label 15; seq 181 presented 36/label 35) — cùng
   chữ ký cũ. Chuyển T5 chẩn đoán/đối chiếu histogram
   (pixFrame−label) trên lượt yên #7 này (T5 đợt 129 đã được giao
   việc này). **Event lag ≥+5f: 0 occurrence đợt này** — event seq
   276–279 frame 27 giữ làm case theo dõi.
3. **Dải wallMs 0–20k median 63,0 (n=59)** — cao hơn các dải sau
   (~50–55). Quan sát, chưa kết luận: có thể do vite/WebKit vừa
   lên. Nếu các lượt sau cũng thấy dải đầu cao thì xem xét tách
   warm-up ra khỏi verdict (không đổi định nghĩa median toàn lượt
   khi chưa có đủ bằng chứng).
4. **Thống nhất interface analyzer:** `labellag/skiplatest/lag5`
   chỉ nhận đường dẫn trần trong khi `tickcost/wallbands` nhận
   `tag=path` — T4 mắc lại quirk này ở lần gọi đầu đợt này.
   Đợt sau sửa các analyzer nhận cả 2 dạng (nợ nhỏ, không sửa
   giữa đợt).
5. **Xvfb socket sót:** probe nên unlink socket của mình sau kill
   (SIGKILL để lại `/tmp/.X11-unix/X193`); driver các luồng sau
   dọn socket sau mỗi attempt như T4 đã làm tay đợt 128 + 129.
6. **Sửa script gốc gate0-wait + check-classb:** fix stale
   VANG-T7-DONE + dòng kết "30 poll" + verdict tổng LOP-B-TONG đã
   mang vào bản copy đợt này (nợ từ LIMITS đợt 127 §9.3 — ĐÃ LÀM
   ở bản copy; cần mang vào bản gốc các đợt sau).
7. **Nợ khác đứng yên theo LIMITS gộp đợt 128 §11 + quyết parent
   §12.3 (cập nhật đợt 129):** mù #48 (T2 đợt 129 — probe thường
   lệ, đã .done trước 08:58Z); (c2) chẩn đoán (T5 đợt 129);
   85m4 webkit chạy lại / hb129 (T3 đợt 129 — chưa .done lúc T4
   đóng); replay #75: 1509 dòng (hình dạng khỏe như #73/#74);
   R9 (a) VẪN CHỜ user; G1 khung (a) M2 VẪN HOÃN — chờ quyết G1
   của user; birefnet 0 lần (RAM khả dụng vẫn dưới guard 6 GB);
   TTS 39 CẤM kiểm lại; ci-security.yml vẫn 403 chờ user; release
   gate không đổi. Boot mới nhất: #75 07:13:31Z (gap #74→#75 =
   8307 s). T8 đang chạy harness sau cờ T4 (mở 08:58:20Z).
