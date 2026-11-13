# PHASE9_ROUND102_D4_BLUR_LIMITS.md — Blur parity đợt 102, luồng D4

**Ngày:** 13/11/2026. **Luồng:** D4 (Phase 9 đợt 102). **Chủ đề:** săn cap D gap 6
(r7 vẫn mở) + thu hẹp cửa sổ mù wk (nợ LIMITS gộp đợt 101 §4 mục 6).

**Kết quả lớn nhất đợt này:**
- **0 cap D mới trên 566 cap** (chr 459 + wk 107), mọi điều kiện tải (yên / sysload 2–4 /
  stall 1600ms / tải nền 7–27). **r7 VẪN MỞ** — vẫn là ca D gap-6 duy nhất trong lịch sử.
- **Cơ chế r7 CÒN SỐNG nhưng đã bị pad-oldest trung hòa:** 11/566 cap (1,9%) có nhãn
  gap 6 nhưng rơi vào dải A (g 0,434–0,447, đúng dự đoán pad-triple gap-2 là 0,449) —
  nhãn gap 6 + nội dung gap 2, y hệt r7; pre-fix cặp này cho D 0,307, post-fix cho A.
- **D floor post-fix gộp: 0/1433** (C4 0/867 + D4 0/566; 95% CI trên 0,209%; Fisher p=9,5e-09
  so với pre-fix 28/1547).
- **Cửa sổ mù wk KHÔNG thu hẹp được:** ước lượng từ state100 (KHÔNG chạy blind probe,
  theo nhiệm vụ C4) được kiểm chứng trên lượt C4 (wk r25/r26 c1 = 1120/1341ms, đúng dải
  Y5 1018–1480ms). D4 mới: wk c1 n=5, median 1152ms (đúng median Y5 ~1110–1150) nhưng
  đuôi tải kéo tới 8124ms; wk c2 n=5, median 1950ms, chỉ 1/5 ≈ 0 — memo c2 ~0 chỉ đứng
  cho lượt yên, không đứng dưới tải. Giữ nguyên kết luận A5.

**Build:** r20 chạy trên post-fix thuần `07f56792`; sibling (luồng D3, rvfcClipWindow)
sửa preview.tsx 3 lần giữa các lượt: `07f56792 → ce00910f` (02:48:35Z, trong r21) →
`833ca8ef` (02:51:34Z, trong r22) → `ed260e62` (03:21:19Z, trong r31; file 428468 →
417702 byte). Code pad-oldest đã verify còn nguyên sau mỗi lần sửa (marker
`motionBlurPadGhostCount` + dòng `blendPool` + 2 test pad pass trên cây cuối).
**Không sửa production trong luồng này.**

---

## §0. Bối cảnh chạy

- **13 lượt chạy, 10 thành công** (5 chr + 5 wk), 3 thất bại (xem dưới). Driver A
  (`driver102d4.sh`, 8 lượt) + driver B (`driver102d4b.sh`, 5 lượt bổ sung).
- **Lỗi driver A (lỗi của D4):** `run()` chỉ dùng `$5` nên cờ có giá trị bị nuốt mất
  giá trị: r22 `--stall` không có giá trị (STALL_MS=NaN → không block), r23/r29/r30
  `--sysload` không có giá trị (SYSLOAD=NaN → không đốt hog). Trong JSON các lượt
  này `stallMs`/`sysload` = null — đọc là "không áp dụng", không phải 0. Đã sửa ở
  driver B (`shift 4` + `"$@"`) và kiểm chứng: r24 stall bắn thật 2 block 1600ms
  (clip 0 relPlay 1541 + clip 1 relPlay 6805); r23x/r31/r32 sysload bắn thật (2/2/4 hog).
- **Kill nhầm r23 (lỗi của D4):** `pkill -f probe102d4-frame-parity` tự khớp shell của
  chính lệnh exec (chuỗi pattern nằm trong dòng lệnh) → shell chết vì SIGTERM, đồng
  thời giết luôn probe r23 đang chạy (exit=2, không có JSON). Đã chạy lại thành r23x
  (sysload 2, exit 0). Bài học: không dùng `pkill -f` với pattern trùng tên script
  trong dòng lệnh của chính mình.
- **wk r27 boot-timeout:** app không boot sau 120s dưới load 16,30 (9 luồng song song).
- **wk r27x EVAL_TIMEOUT:** playhead không tới 8,8 sau 90s + eval lấy kết quả treo
  60s — cùng họ với C4 wk r26 lần 1. Kẹt playhead wk dưới tải nặng vẫn xảy ra.
- **Tải nền rất cao suốt đợt** (9 luồng song song, D3 chạy probe 24 clip + sysload 2):
  load lúc phát 0,92–26,53; phát wk chỉ 0,16–0,77× realtime (state100 959–1158 mẫu
  cho 9s nội dung, so với r25 yên 81 mẫu). Hệ quả: wk chỉ thu được 13–40 cap/lượt
  (r25 yên: 96) — cap thưa nhưng đo thật, vẫn dùng được.
- **KHÔNG chạy blind probe** (theo nhiệm vụ C4). Cửa sổ mù chỉ ước lượng từ state100
  của các lượt frame-parity có instrumentation (§4–§5).
- Dữ liệu thô + script: `hidden_files/round102-d4/` (`analysis102d4.txt/.json`,
  `analyze102d4.py`, `probe102d4-frame-parity.mjs` (bản copy), `driver102d4*.sh/.log`,
  13 thư mục lượt).

---

## §1. Săn cap D gap 6 — r7 VẪN MỞ, nhưng cơ chế của nó đã bị trung hòa

### 1.1. Không có cap D mới: 0/566

| lượt | engine | điều kiện | cap dùng | D |
|---|---|---|---|---|
| chr-blur-r20 | chr | yên (load 9,97 lúc phát) | 97 | 0 |
| chr-blur-r21 | chr | tải nền (load 4,69) + sửa giữa lượt | 176 | 0 |
| chr-blur-r22 | chr | yên (cờ stall hỏng → thực chất yên) | 98 | 0 |
| chr-blur-r23x | chr | **sysload 2** (load 14,17) | 30 | 0 |
| chr-blur-r24 | chr | **stall 1600ms** clip 0+1 (load 16,91) | 58 | 0 |
| wk-blur-r28 | wk | tải nền (load 7,34) | 16 | 0 |
| wk-blur-r29 | wk | tải nền (load 26,53) | 28 | 0 |
| wk-blur-r30 | wk | tải nền (load 12,15) | 13 | 0 |
| wk-blur-r31 | wk | **sysload 2** + sửa giữa lượt | 36 | 0 |
| wk-blur-r32 | wk | **sysload 4** | 14 | 0 |
| **gộp D4** | | | **566** | **0** |

Cap ngoài dải: 0. D theo từng lượt đều 0 — kể cả tập con chạy trên md5 ổn định
trong lượt (r20 + r23x/r24 + r28/r29/r30/r32: 0/256) nên kết luận không phụ thuộc
vào các lượt lai do sibling sửa giữa chừng.

### 1.2. Cap gap-6: 20 ca, 0 D — r7 vẫn là ca duy nhất

20 cap nhãn gap 6 (mọi band): **A 11, B 6, C 3, D 0.**

- **Cụm A (11 ca, g 0,434–0,447):** r22 c0 fi63/69, c1 fi15/21, c2 fi11; r23x c1 fi89;
  r24 c0 fi87/61/76, c2 fi33/81. Cụm hẹp (rộng 0,013), tâm 0,442 — **khớp dự đoán
  pad-triple gap-2 (0,449)** trong 0,015, và KHÔNG khớp bất kỳ dự đoán nào cho nội
  dung gap 6 thật (pair 0,549 → B; pad-triple gap 6 → B). Kết luận: 11 ca này có
  **nhãn gap 6 nhưng nội dung gap 2** — đúng cơ chế r7 (nhãn sai, nội dung gap 2).
  Cấu trúc nhãn: 7/11 có `last==pres` + `skipped=1` (snapshot mới nhất bằng frame
  trình chiếu nên bị skip, ghost dùng là `prev` = pres−6 theo nhãn); 4/11 còn lại
  có ghost-nhãn = pres−6 (r23x fi89: last 86/pres 92; r24 fi87: 83/89; fi61: 55/61;
  fi76: 70/76) — nhãn ghost lệch đúng −4 so với nội dung gap 2 suy ra (pres−2),
  trùng hướng alias +4/−1 mà C4 đã ghi là không phân biệt được bằng strip 48-bit.
  **Nhãn sai là −4 hay presented −1 thì g không quyết được** — cần strip-confirm
  (nợ §6); nhưng bản thân cụm A hẹp quanh 0,449 đã đủ khẳng định nội dung là gap 2.
- **Cụm B (6 ca, g 0,762–0,787):** nội dung gap 6 thật + pad-triple → B, đúng dự đoán.
- **Cụm C (3 ca, g 0,988–1,001):** r24 c0 fi35, c1 fi7 (ringSize=1), r31 c2 fi33 —
  frame gần như giống hệt nhau, không thấy blur (g≈1). Không dị thường.
- **r7: VẪN MỞ.** Là ca D gap-6 duy nhất trong lịch sử (1/1547 pre-fix + 0/1433
  post-fix). Nhưng nay đã rõ hơn C4: **cơ chế sinh r7 vẫn xảy ra đều (11/566 =
  1,9% cap), chỉ là pad-oldest đã đổi kết quả của nó từ D (0,307) thành A (0,449).**
  Việc đóng r7 cần strip-chứng-minh cho 1 ca trong cụm A (xem §6) — không còn là
  "không có dữ liệu", mà là "chưa strip".

### 1.3. D floor gộp post-fix: 0/1433

| | D | n | Fisher một phía (pre>post) |
|---|---|---|---|
| pre-fix (C4) | 28 | 1547 (1,81%) | — |
| post-fix C4 | 0 | 867 | p=3,6e-06 |
| post-fix D4 (mới) | 0 | 566 | — |
| **post-fix gộp** | **0** | **1433 (0,00%)** | **p=9,5e-09** |

0/1433 → 95% CI trên (rule of three) = **0,209%** (C4: 0,35%). Sàn D còn lại
(nếu có, từ cơ chế khác) <0,21%.

---

## §2. B-band + pool=1 (nối tiếp C4)

- **B-band D4:** chr n=113, mean 0,772, med 0,774, sd 0,008, dải 0,754–0,787,
  pair-like [0,70–0,76): 9/113 (8%); wk n=32, mean 0,771, med 0,774, sd 0,011,
  dải 0,747–0,787, pair-like 8/32 (25%). Khớp C4 post-fix (chr 0,773, wk 0,771) —
  B-band trung bình không đổi sau pad.
- **Pool=1 post-fix gộp (C4+D4):** n=31, bands C 18 / B 6 / **A 7** / **D 0**
  (C4 riêng: n=14, A 1). A tăng 1/14 → 7/31, đúng dự đoán pad: chỉ cặp nội dung
  gap-2 mới cho A sau pad; đa số ghost đói là gap lớn nên rơi vào B/C.

---

## §3. Cửa sổ mù wk — ước lượng từ state100 (KHÔNG chạy blind probe)

### 3.1. Phương pháp + kiểm chứng

Blind[c] = ringFirstAt[c] − phCrossEst[c], với phCrossEst nội suy tuyến tính trên
state100 (mẫu 100ms) tại biên ph=3,0 (c1) / 6,0 (c2). Sai số ~±100–200ms.
**Kiểm chứng trên lượt C4 post-fix (cùng bộ ước lượng):** wk r25 c1=1120ms,
r26 c1=1341ms — cả hai nằm trong dải Y5 (1018–1480ms); chr c1/c2 −29…+101ms
(≈0 trong sai số); wk r25/r26 c2 = 177/201ms (xem bias §3.3). **Phương pháp đủ
tin để phân biệt "trong dải yên" với "đuôi tải".**

### 3.2. Số đo D4 mới (wk)

| lượt | sysload | c1 (ms) | c2 (ms) | tốc độ phát gần biên |
|---|---|---|---|---|
| wk-blur-r28 | 0 | 1145 | 6120 | 0,00×/0,26× |
| wk-blur-r29 | 0* | 1152 | 197 | 0,26×/0,52× |
| wk-blur-r30 | 0* | 8124 | 1950 | 0,69×/0,77× |
| wk-blur-r31 | 2 | 1652 | 35 | 0,65×/0,16× |
| wk-blur-r32 | 4 | 743 | 3664 | 0,72×/1,10× |
| **median** | | **1152** | **1950** | |
| chr (đối chứng, 5 lượt) | | 28–605 | −21–606 | 0,82–0,98× |

\* r29/r30 cờ sysload hỏng (driver A) — chỉ có tải nền; load lúc phát 26,53 / 12,15.

- **c1: median 1152ms (n=5) — tái tạo đúng median Y5 (~1110–1150).** 2/5 điểm
  (1145, 1152) nằm gọn trong dải Y5; 743 và 1652 nằm ngoài dải nhưng cùng bậc
  (đói pump nhẹ dưới tải); 8124 là ngoại lệ tải cực đoan (r30: ringFirstAt c1
  19811ms — cả khởi động pump c0 cũng trễ tới 5907ms).
- **c2: median 1950ms, chỉ 1/5 ≈ 0** (r31: 35ms; r29: 197ms ≈ 0 + bias §3.3).
  Memo c2 ~0 **không tái tạo được dưới tải** (6120 / 1950 / 3664ms).
- **Không có tương quan với tốc độ phát:** r31 c2 chậm nhất (0,16×) nhưng blind
  nhỏ nhất (35ms); r32 c2 nhanh nhất (1,10×) nhưng blind 3664ms. Đuôi c2 biến
  thiên 35–6120ms không giải thích được bằng tốc độ phát — có thể do thời điểm
  element c2 sẵn sàng (seek/decode) lệch nhau từng lượt, hoặc phCrossEst sai khi
  ph không đơn điệu quanh biên dưới tải. **Không suy thêm.**
- **chr:** blind 28–605ms cả hai clip — chr không có cửa sổ mù thực sự (pump bắt
  nhanh); stall 1600ms ở r24 chỉ đẩy blind chr lên 406/202ms.

### 3.3. Bias của bộ ước lượng ở c2 (+~180ms)

Trên lượt yên C4, bộ ước lượng cho wk c2 = 177/201ms trong khi blind probe Y5 đo
~0ms (13/14). Chênh ~+180ms hệ thống: phCross của blind probe ghi khi clip index
đổi trong sampler (rAF+10ms), còn phCrossEst nội suy từ ph — hai mốc không đồng
nhất, và ở c2 (element đã ấm) chênh này lộ ra thành toàn bộ số đo. **Quy tắc đọc:
trừ ~180ms khi so c2 với số blind probe; không áp dụng cho c1** (ở c1, khởi động
element ~1,1s át chênh này — kiểm chứng r25/r26 khớp dải Y5). Với bias này, r29
c2 (197ms) ≈ 0, r31 c2 (35ms) ≈ 0; các ca 1950/3664/6120ms vẫn là đuôi thật.

### 3.4. Kết luận: KHÔNG thu hẹp được — giữ A5

- Dải yên c1 **không thu hẹp** (vẫn 1018–1480ms; median ~1150 được củng cố thêm
  2 điểm trong dải) — vì các lượt D4 đều dưới tải, không phải lượt yên mà A5 yêu
  cầu ("cần thêm lượt blind yên để chốt đuôi").
- Đuôi tải **mở rộng**: c1 tới 8124ms (A5: tối đa 3792ms), c2 tới 6120ms (A5: tối đa
  671ms). Đuôi là do đói pump dưới tải, không phải watchdog (fbAt == ringFirstAt
  ở mọi ca wk — fallback che suốt cửa sổ, không có freeze-kill nào; freeze-kill
  `"no-callback-frozen"` 0 lần như mọi đợt trước).
- **Giữ nguyên kết luận A5** ("blind = độ trễ khởi động element, watchdog đóng góp
  0ms; đuôi memo c2 cần thêm lượt yên"). Việc thu hẹp thật vẫn cần lượt blind yên
  — bị cấm trong nhiệm vụ này, để lại cho đợt sau nếu parent đổi lệnh.

---

## §4. Dị thường + bài học harness

1. **Driver A nuốt giá trị cờ** (§0) — 4/8 lượt chạy sai điều kiện dự định (nhưng
   vẫn là dữ liệu đo thật, đã phân loại lại theo điều kiện thực tế + sysload/stall
   ghi trong JSON; driver B đã sửa + kiểm chứng cờ bắn thật).
2. **pkill tự khớp** (§0) — giết r23; chạy lại thành r23x. Không dùng `pkill -f`
   với pattern trùng tên file trong dòng lệnh của chính mình.
3. **Sibling sửa preview.tsx 3 lần giữa lượt** (D3 rvfcClipWindow): r21, r22, r31
   là lượt lai; pad-oldest verify còn nguyên sau mỗi lần (marker + blendPool +
   test pass trên cây cuối ed260e62). Kết luận D không phụ thuộc lượt lai
   (tập con md5-ổn-định: 0/256 D).
4. **wk dưới tải nặng:** boot-timeout 120s (r27, load 16,3); playhead kẹt 90s +
   eval treo 60s (r27x) — cùng họ C4 r26 lần 1. Harness mất dữ liệu khi eval cuối
   treo (kết quả chỉ còn trong bộ nhớ trang, không lấy ra được).
5. **Cap thưa dưới tải:** wk 13–40 cap/lượt (yên: 96); chr sysload 30–33 cap/lượt
   (yên: 97–176). Tick/blend thưa vì main thread đói — cap ít nhưng đo thật.

---

## §5. Kiểm chứng (cây cuối, md5 ed260e62)

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass 10,76s**.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`:
  **27/27 pass** (gồm 2 test pad-oldest C4).
- `scripts/test-preview-engine.sh`: **354 assertions pass**.
- Không sửa production; không push GitHub; không release/tag; không TTS 39; không birefnet.

---

## §6. Nợ còn lại

1. **r7 VẪN MỞ** — cần strip-confirm 1 ca trong cụm A gap-6 (§1.2) để chốt nội
   dung gap 2 (ghostPix span-8, theo quy tắc C4 §4). Cơ chế đã rõ, chỉ còn thiếu
   bằng chứng strip trực tiếp.
2. **Cửa sổ mù:** đuôi yên vẫn chưa chốt — cần lượt blind yên (A5) — bị cấm trong
   nhiệm vụ này; đuôi tải đã đo tới 8124/6120ms nhưng c2 biến thiên không tương
   quan tốc độ phát (chưa giải thích được).
3. **B-band cấu trúc trong:** pair-like còn lại sau pad (chr 9/113, wk 8/32) chưa
   giải thích hết (nợ C4 §6 mục 4, giữ nguyên).
4. Các nợ ngoài phạm vi D4 (giữ nguyên từ LIMITS gộp đợt 101 §4): G1 deinterlace
   (chờ user quyết metric G5/M2), 2 MiB (C1), ghost jitter (F5 bị bác), re-arm
   drift-gate (tuổi đuôi +45%), zombie seek-across, EPERM probe #21 + khoảng mù
   #20, birefnet (CẤM thử lại khi RAM chưa đổi), TTS 39 (CẤM kiểm lại),
   `ci-security.yml` 403 (chờ user), release gate giữ nguyên.

---

## File đổi/thêm (đợt 102 D4)

- `apps/web/scripts/probe102d4-frame-parity.mjs` — probe mới (copy probe101c4 +
  cờ `--sysload` port từ probe101c5 + SCRATCH round102-d4; `node --check` OK).
- `docs/PHASE9_ROUND102_D4_BLUR_LIMITS.md` — file này.
- Không push GitHub, không release/tag (giữ release gate).
