# PHASE9 ROUND151 — T1 VERIFY ĐỢT 150 LIMITS

- **Đợt verify:** 151. **Lượt cron:** 09:35 +07 20/11/2026 (= 02:35:51Z 20/11/2026). **Phiên T1:** 02:37–~02:56Z 20/11/2026, trong hạn cờ ~05:00Z + hạn cứng 05:30Z.
- **Boot:** `2e430750` suốt phiên (reboot #41, btime 01:25:51Z) — boot lúc T10-150 đóng, KHÔNG có reboot mới trong phiên T1 (kiểm boot_id lúc mở + lúc đóng suite — khớp).
- **Verdict: PASS — nội dung đợt 150 đứng vững toàn bộ; không có đính chính lớn.** Đếm khớp từng số bằng script dedup mới; suite chạy lại 28/28 exit 0 trên boot mới 2e430750 (lần đầu suite đầy đủ chạy trên boot sau #41 — T10-150 đã không chạy lại suite, xem F-150-T10-2; lần verify này lấp đúng khoảng trống đó). O8 xác nhận độc lập bằng JSON/log gốc. Đính chính MAD geq-yuv444 của T0 đã vào EFFECTS_LIMITS.md. Mù #71? đóng hoàn toàn đứng theo hồ sơ + quyết parent (c).
- **KHÔNG PUSH trong phiên này. KHÔNG release/tag. KHÔNG code giả.**

## §1. Đếm cuối — KHỚP TỪNG SỐ (script mới, dedup toàn cục, không cộng tay)

- Script đếm viết mới `count-final-151.py` (hidden_files/round151-t1/ — quét mọi `phase9-round*.txt`, tách NUL, suy round từ tên file, KHÔNG cộng dồn — theo bài học đứng quyết (s) đợt 150: số đếm cuối CHỈ lấy từ output script). Kết quả (file `t1-count-final-150-recount.txt`):
  - **Đợt 150 (gồm closing): 10 batch / 18 entry / 18 file — KHỚP** (trước closing: 9 / 16 / 16 — KHỚP).
  - **Lũy kế 111–150: 388 / 774 / 658 — KHỚP** (số đã đính chính theo quyết parent (s); script của T10-150 chạy lại cũng cho 658 — nay script mới độc lập cho cùng 658).
  - **Lũy kế 111–149: 378 / 756 / 645 — KHỚP; 111–148: 368 / 737 / 628 — KHỚP; 111–147: 359 / 722 / 615 — KHỚP.** Tái kiểm 111–149 khớp — **lần thứ 32 liên tiếp** (T10-150 ghi lần thứ 31, nay +1).
  - **Chờ push 136–150: 140 batch / 196 entry / 161 file — KHỚP** (số đã đính chính theo quyết (s)).
  - **Overlap đợt 150 với 111–149: 5 file — KHỚP** (`PHASE9_GAP_ANALYSIS.md`, `apps/web/scripts/test-vite-lock-v2.sh`, `apps/web/scripts/vcut-webkit-postboot-check.sh`, `server/render/src/EFFECTS_LIMITS.md`, `server/render/src/test_v19_pixelate_probe.js` — cả 5 trùng có lý do).
  - **0 file staged của đợt 150 thiếu trên đĩa; 0 lỗi purity** (1.036 paths file đã quét, mọi file kết thúc NUL, không byte newline).
  - Round 149 tái kiểm: 10 / 19 / 19 — KHỚP; round 148: 9 / 15 / 15 — KHỚP.
- **Lưu ý đếm:** lúc script chạy (~02:39Z) đã có 2 paths file đợt 151 trên đĩa (`phase9-round151-t0-v19.txt`, `phase9-round151-t5-infra.txt` — xuất hiện sau, do T0-151/T5-151 stage trong lúc T1 làm việc). Chúng thuộc round 151, không ảnh hưởng số đợt 150. Số "1.036 file đã quét" là trạng thái lúc chạy script.

## §2. Suite chạy lại: 28/28 exit 0 trên boot mới 2e430750 (lấp F-150-T10-2)

- **Suite gộp 27 mục + `npm test` đầy đủ: 28/28 exit 0, 0 rerun** (02:39:29–02:51:43Z, 12m14s, boot `2e430750`, RAMavail lúc mở 561 MB). Script `round151-t1-verify.sh` (adapt từ T1-150, đã sửa nhãn echo F-150-T1-2 — nay ghi đúng "T1-151 verify start"). Log `round151-t1-suites.log` (448 dòng ✓).
- **`npm test` đầy đủ: 12 pass, 0 fail** — KHÁC số 11 pass của T1-150, CÓ LÝ DO (xem F-151-T1-3): T0-151 đã nối probe V19 vào `test_integration.sh` lúc 02:41Z theo quyết parent (j) đợt 150, TRƯỚC khi lượt `npm test` của T1 chạy (~02:48Z). Mục mới: `== 5. Probe V19 pixelate geq == ✅ PASS test_v19_pixelate_probe (34 assert geq)`. 11 mục cũ vẫn đủ: unit 7/7 (lut/effects/sticker/chroma/textfx/keyframes/mask self-test), integration — demo_lut/demo_effects/demo_sticker/demo_chroma/demo_transitions/demo_textfx PASS, `test_pixelate_render` 20 case PASS.
- **Hệ quả kiểm chứng thêm (ngoài brief):** probe V19 geq 34/34 assert PASS ngay trong suite tích hợp trên boot mới 2e430750 — xác nhận độc lập claim T0-150 bằng đường chạy tích hợp (không chỉ chạy độc lập như T0-150 đã làm).
- **Cây lúc kiểm (md5, không đổi trước/sau suite):** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141` — khớp hồ sơ T10-150 lúc đóng. Cây đã qua 6 boot với cùng md5 preview.tsx (đợt 149: 5 boot; nay + reboot #41).
- **Caveat:** suite chạy trong lúc các luồng đợt 151 khác làm việc song song (T0-151 sửa `test_integration.sh` giữa phiên — xem F-151-T1-3; T4-151 poller + T8-151 harness giữ lock vite theo phiên). Tải song song làm suite chậm hơn (12m14s vs 14m16s của T1-150 dưới tải đợt 150; cả hai đều chậm hơn 5m32s của T10-149 lúc máy yên) nhưng không đổi verdict. File duy nhất đổi giữa phiên mà suite chạm tới là `test_integration.sh` (test script, không phải code app) — md5 4 file lõi trên không đổi.

## §3. O8 — Xác nhận độc lập bằng JSON/log gốc (không chạy O8 riêng)

- File gốc `hidden_files/round150-t8/o8-webkit/o8w-clicktest-report.json`: **21 kết quả, 21 ok=true, 0 fail** (kiểm bằng python).
- File gốc `hidden_files/round150-t8/o8-chromium/o8-clicktest-report.json`: **21 kết quả, 21 ok=true, 0 fail**.
- Driver log `o8-150t8.log`: **10 dòng** "21/21 pass" (khớp T10 §10.3); dòng "O8 DONE 2026-11-20T01:05:17Z webkit1=0 webkit2=0 chromium=0".
- **Chuỗi WebKit FULL PASS 7 → 8 — ĐÃ XÁC NHẬN ĐỘC LẬP** (lần thứ hai liên tiếp có xác nhận độc lập: T10-150 + T1-151). Gate: O8 chạy SAU KHI POLLER T4 THOÁT (01:00:32Z), TRƯỚC khi cờ T4 viết (01:05:18Z), T4 0 attempt — **KHÔNG trích là "sau cờ T4", KHÔNG trích là "sau lượt yên hợp lệ"** (theo quyết parent (f) đợt 150 — nhãn đã chốt).
- Caveat giữ nguyên từ đợt 148/149/150: **chỉ 1 file JSON WebKit cho 2 attempt** (attempt2 ghi đè attempt1 — attempt1 chỉ có bằng chứng log text trong driver log).

## §4. T0 — Đính chính MAD geq-yuv444 ĐÃ VÀO EFFECTS_LIMITS.md; V19 đứng

- **Đính chính đã vào file thật:** `server/render/src/EFFECTS_LIMITS.md` § đợt 149/cập nhật đợt 150 ghi đầy đủ: "LIMITS đợt 149 §5 ghi geq-yuv444 MAD 0,37–0,43 — đo lại độc lập bằng chuỗi filter thật cho MAD 4,03–7,01 trên ramp; số 0,37–0,43 là của biến thể chroma full-res...; đường pipeline thật là yuv420p nên không ảnh hưởng sản phẩm; parity... yMAD 1,37–1,56 trên ramp" + hiệu năng geq "~4 Mpx/s đơn luồng — 640x360 ~16 fps, 1280x720 ~4,5 fps, 1920x1080 ~1,9 fps, 3840x2160 ~0,4 fps (chậm hơn scale cũ ~15–90 lần...)". Khớp đúng số aggregate §1. **Quyết parent (k) ("đính chính vào EFFECTS_LIMITS.md là đủ") ĐÃ ĐƯỢC THỰC HIỆN.**
- File probe `server/render/src/test_v19_pixelate_probe.js` tồn tại (22.057 B, mtime 00:01Z 20/11) + `server/render/bench_pixelate_geq.sh` (3.229 B, mtime 00:02Z). `effects.js` md5 `fedc0141` không đổi.
- **V19 34/34 assert PASS trong suite tích hợp đợt này** (xem §2) — kiểm chứng live trên boot 2e430750, không chỉ đối chiếu LIMITS.
- T1 không chạy lại probe/bench độc lập (suite tích hợp đã bao phủ probe; bench là đo hiệu năng 1 lần dưới tải, không có ý nghĩa chạy lại giữa phiên đợt 151).

## §5. T2 — Probe #69 + mù #71? đóng hoàn toàn: đứng theo hồ sơ + quyết parent (c)

- **Probe EPERM #69: log `eperm-probe-v2.log` đúng 199 dòng** (wc -l + tail kiểm trực tiếp); dòng cuối `2026-11-19T23:44:57Z probe#69 boot=e9295700 tmp+ws ok=2 fail=0` — khớp claim. 1 dòng `probe start`, 0 dòng `=== probe end` — khớp. 3 dòng mới sau probe #68 đúng mẫu (1 DEAD + 1 boot-changed + 1 probe).
- **Mù #71? đóng hoàn toàn → CERT 71 / FULL 86, chuỗi đóng hoàn toàn 6 → 7:** parent đã **XÁC NHẬN** ở quyết (c) đợt 150 — T1 chỉ đối chiếu hồ sơ, không đạo lại merged gap. Đối chiếu điểm: file `blind71-gaps.txt` ghi trực tiếp "F'-body max gap (excl tail): 1014s (2026-11-19T21:54:43 -> 2026-11-19T22:11:37)" — khớp claim max 1.014 s; các file scope (hidden_files 484 dòng, outside 144, repo-1 16, tmp 2) + gaps 1.171 dòng đều có mặt.
- **Gap #39 [4.996, 5.000] s, giữa 4.998 s:** đứng theo hồ sơ T2 + quyết parent (c). T1 không đạo lại.
- **INSIDE chuỗi 1 → 2 theo chuẩn đứng:** parent đã chốt ở quyết (d) đợt 150 — T1 ghi nhận, không mở lại.

## §6. T4 — #22 vẫn mở, 0 attempt: đếm lại từ log gốc khớp

- `poll-t4.log`: **103 dòng**, đếm lại trực tiếp: 2 dòng start (23:46:38Z test + 23:47:02Z thật) + 98 dòng poll ghi (1 test poll #1 23:46:38Z + 97 poll thật #1–#97, 23:47:02–00:59:47Z) + 1 dòng `TEST-POLL-OK` + 2 dòng `HET HAN` = 103. **97 poll thật, gate0=khong-dat trong 97/97 poll thật** (grep "gate0=khong-dat" = 99 dòng = 1 test + 1 TEST-POLL-OK + 97 thật — khớp). Dòng cuối: `HET HAN CHO 01:00Z — 0 attempt`.
- **Sai lệch nhỏ trong cách ghi của aggregate (F-151-T1-2):** aggregate §10.2 claim 4 mô tả "103 dòng: start + 98 dòng poll [1 test + 97 thật] + 2 dòng HET HAN" — phép cộng đó chỉ ra 101, thiếu 2 dòng (dòng start lặp lại lúc 23:47:02Z + dòng TEST-POLL-OK). Thực chất không đổi: 97 poll thật, 0 attempt. T4 LIMITS `PHASE9_ROUND150_T4_WEBKIT_QUIET22_LIMITS.md` 17.118 B — khớp §10.1.
- Cộng dồn (c2) vẫn 18 lượt hợp lệ — không có dữ kiện mới đợt này để đổi (0 attempt).

## §7. T5 — Cờ postboot + replay: đứng theo file gốc

- File cờ `hidden_files/round150-t5/POSTBOOT_PASS` tồn tại, nội dung khớp claim: boot e9295700, replay KHÔNG TỚI (watcher TIMEOUT 00:44:15Z, 120 poll; dpkg 2 dòng startup), --repair 00:50:59–01:04:59Z, postboot PASS poll1 01:05:33Z, dpkg 795/113/230, cache 110 .deb, lists 75. File cờ cũ `POSTBOOT_PASS-802f358f` vẫn giữ nguyên bên cạnh.
- File `dpkg-frozen-e9295700.txt` tồn tại (manifest boot e9295700).
- T1 không kiểm lại apt/dpkg internals (phạm vi T5; đã có 4 luồng ghi chéo cùng mốc giờ ở đợt 150).

## §8. T6 — Lock khỏe lúc đóng; log đã dài thêm sau đóng (dữ kiện đợt 151)

- **Bằng chứng prune lần 25:** file `prune-deleted.txt` ghi `removed 'vite.lock.queue/cooldown-s4-w2'` — khớp claim. Queue lock lúc kiểm: **102 file** — khớp số T10 lúc đóng (102), không đổi kể từ đó.
- **Log lock chính thức `vite-lock-v2.log`:** lúc kiểm 1.405 dòng (T6 đóng: 1.356; +49 dòng do T8-150 harness + các luồng đợt 151 acquire/release sau đó). ACQUIRED 409 / RELEASED 401 (T6 đóng: 395/388); TICKET 420 (đóng: 406). 3 dòng cuối lúc T10 đóng là t8-round150 TICKET/ACQUIRED 01:54:22Z + RELEASED 01:58:12Z — đã xác nhận còn nguyên trong log.
- **ACQUIRED − RELEASED = 8 (lúc đóng: 7) — F-151-T1-4:** ca thứ 8 là `t8-round150` acquire 01:24:37Z (port 5490, ticket `...71697`) cho 86n2 lần 1 — KHÔNG release vì reboot #41 (01:25:51Z) giết driver giữa chừng; đã phục hồi sạch bằng STALE-LOCK 01:31:10Z (log ghi rõ "owner pid 68531 chết + không vite trên cổng 5490 + curl 000 + boot đổi (tuổi 393s)"). Ca này xảy ra SAU khi T6 đóng (00:00:57Z) nên không nằm trong 7 ca T6 đã đếm. **Không có lock nào đang giữ lúc kiểm** (dòng cuối log là `t4 RELEASED hold_s=259` 02:49:40Z). Ghi nhận để T6-151 đối chiếu (T6-151 đã ghi cùng kết luận trong log ngày).
- Suite `test-vite-lock-v2.sh` md5: T1 không kiểm lại (đợt 151 T6-151 sẽ sửa theo quyết (b) — chuyển sang (A)).

## §9. T8 — 2 kẹt thật: xác nhận từ log driver gốc

- **Kẹt 1 (85m4, boot1):** `smoke/run-webkit-nohup.out` dòng 34: `--- webkit 85m4 exit=124 end 01:24:21Z live_diags=0 ---`; dòng 78: `!!! webkit 85m4 TIMEOUT 124 — goi diag-stall (buoc 4)` — khớp claim (01:09:20–01:24:21Z, exit 124).
- **Kẹt 2 (86n2, boot2):** `smoke/run-webkit-summary.txt` dòng 212: `=== ALL DONE Fri Nov 20 01:58:12 UTC 2026 ec webkit: 84l10=0 85m4=0 86n2=124 ; chromium: 84l10=0 85m4=0 86n2=0 ===` — khớp claim (86n2=124 WebKit, Chromium 3/3 PASS).
- **"Harness 6/6" KHÔNG được cộng từ hai lần chạy** — aggregate đã ghi rõ, T1 xác nhận lại từ 2 summary trên (lần 1: 85m4=124; lần 2: 86n2=124).
- T8 LIMITS 53.601 B — khớp §10.1. T1 không chạy lại harness/O8 (ngoài phạm vi verify; O8 đã xác nhận độc lập ở §3).

## §10. T9 — Sampler 97 mẫu, ghim 28, B2 28 spike: đếm lại từ log gốc khớp

- `ram-sampler.log`: **97 dòng** — khớp 97 mẫu. Đếm dòng chứa giá trị trần balloon 6.443.824 kB: **28 dòng** — khớp 28/97 mẫu ghim.
- `b2-spikes.log`: **28 dòng header SPIKE** (grep -c "SPIKE" = 28) — khớp 28 spike; tổng file 1.327 dòng (gồm header + snapshot — khác số 1.241 của T1-150 vì đó là log đợt 149, không phải đợt 150).
- Headroom 323 → 308, birefnet 0 thử lần 4: đứng theo hồ sơ (T1 không đo lại headroom — số đo cùng thời điểm không tái tạo được; T5 đối chiếu độc lập 318 lúc mở đã ghi ở đợt 150).
- T9 LIMITS 55.691 B — khớp §10.1.

## §11. Sai lệch phát hiện (F-151-T1-N — kể cả nhỏ)

- **F-151-T1-1 — GAP §79 vẫn ghi số đếm cũ 659/162 (chưa đính chính theo quyết (s)).** GAP §79, mục "T10 verify": "lũy kế 111–150 = 388/774/659; chờ push 136–150 = 140/196/162". Số đúng theo script (cả script T10-150 chạy lại lẫn script mới của T1-151): **658 / 161**. Quyết parent (s) nói "Đã sửa §10.1 + footer trong aggregate" — kiểm tra: aggregate §10.1 + footer ĐÃ sửa đúng (658/161). GAP §79 KHÔNG được sửa (GAP viết trước khi parent quyết (s)). GAP §79 là hồ sơ đã đóng của đợt 150 — T1 không tự sửa; ghi nhận để T10-151/GAP §80 đính chính (cùng mẫu đính chính GAP §78 đợt 149).
- **F-151-T1-2 — Aggregate mô tả sai phép cộng dòng `poll-t4.log`.** Aggregate §10.2 claim 4: "poll-t4.log 103 dòng: start + 98 dòng poll [1 test + 97 thật] + 2 dòng HET HAN" — cộng lại chỉ 101. Thực tế (đếm trực tiếp): 2 start + 98 poll + 1 TEST-POLL-OK + 2 HET HAN = 103. Thực chất không đổi (97 poll thật, gate0 0/97, 0 attempt). Lỗi mô tả dòng, không phải lỗi số liệu.
- **F-151-T1-3 — `npm test` nay 12 pass, không phải 11.** Nguyên nhân: T0-151 nối V19 vào `test_integration.sh` lúc 02:41Z (quyết (j) đợt 150) trong lúc suite T1 đang chạy; `test_integration.sh` mtime 02:41Z, dòng 94 ghi rõ "(đợt 151: nối vào suite theo quyết parent (j) đợt 150)". Suite T1 vì vậy chạy bản integration của đợt 151 (12 pass), không phải bản thuần đợt 150 (11 pass). Không phải lỗi hồ sơ đợt 150 — là caveat của lần verify này. Mặt tích cực: V19 PASS 34 assert ngay trong suite tích hợp trên boot mới.
- **F-151-T1-4 — Log lock delta 8 (lúc T6 đóng: 7).** Ca thứ 8 là acquire 01:24:37Z của `t8-round150` (86n2 lần 1) bị reboot #41 giết, đã phục hồi sạch bằng STALE-LOCK 01:31:10Z (xem §8 — xác nhận độc lập từ log gốc, khớp kết luận T6-151). Xảy ra sau khi T6 đóng nên không nằm trong 7 ca T6 đếm. Không lock nào đang giữ lúc kiểm.
- **F-151-T1-5 — Aggregate tăng kích thước sau đóng: 105.401 B → 116.389 B.** Do parent viết §12.3 (a)–(t) sau khi T10 đóng — cùng mẫu đợt 149 (aggregate 149 tăng do §12.3). Không phải lỗi.
- **F-151-T1-6 — Phạm vi kiểm có giới hạn (cùng mẫu F-150-T1-4).** T1 kiểm độc lập: đếm cuối (script mới), suite đầy đủ 28/28, O8 (JSON/log gốc), cây md5, log probe/poll/sampler/B2/lock/harness (đếm lại từ file gốc). Các claim T2 (merged gap/sessions/hole-recheck chi tiết), T7 (scheduler DB), T5 (apt/dpkg internals), T9 (attribution từng spike), T6 (120 lần kiểm soát churn), T0 (probe 34 assert / bench 36 cấu hình chi tiết) chỉ đối chiếu qua LIMITS + log còn lại + đối chiếu chéo giữa các luồng — không đạo lại từ đầu. /tmp trước reboot #41 đã mất (F-150-T10-5).
- **F-151-T1-7 — Label echo suite đã sửa.** Script verify của T1-151 ghi đúng "T1-151 verify start" (F-150-T1-2 của T1-150 đã sửa — bản cũ vẫn ghi "T10-149 verify start").

## §12. Tổng hợp + giao tiếp

- **Verdict: PASS.** Nội dung đợt 150 đứng vững toàn bộ trên boot mới 2e430750: đếm khớp lần thứ 32 liên tiếp; suite đầy đủ 28/28 (lấp khoảng trống F-150-T10-2); O8 21/21 ×2 + 21/21, chuỗi FULL PASS 7 → 8 xác nhận độc lập lần thứ hai; đính chính MAD đã vào EFFECTS_LIMITS.md; mù #71? đóng hoàn toàn đã được parent xác nhận (c). Không có đính chính lớn nào mới. Hai sai lệch ghi nhận (F-151-T1-1, F-151-T1-2) đều là lỗi ghi chép trong hồ sơ đã đóng, không đổi verdict — đề nghị T10-151 ghi vào GAP §80 (F-151-T1-1) và lưu ý (F-151-T1-2).
- **Verdict CHẤP NHẬN đợt 150 (quyết parent (a)) KHÔNG ĐỔI.**
- **Nợ chuyển đợt 151 (đã có chủ, T1 chỉ nhắc lại):** mù #72? + #73? giao T2-151; #22 đo lại T4-151; T7 flaky chuyển (A) giao T6-151 (quyết (b)); H3 điều tra sâu có giới hạn giao T8-151 (quyết (g)); T5 repair sớm (quyết (h)); V19 đã nối vào test_integration.sh — HOÀN THÀNH trong phiên T1 (T0-151, 02:41Z).
- **Cây lúc đóng verify:** preview.tsx `530e10a7`, media.ts `2c384ed1`, vite.config.ts `ee80d093`, effects.js `fedc0141` — không đổi suốt đợt 150 + verify 151. Boot `2e430750` ổn định, không reboot trong phiên T1. Lock vite TRỐNG lúc kiểm (dòng cuối log là RELEASED). 0 process suite nào của T1 còn sống lúc đóng (verify script đã thoát; `VERIFY DONE 02:51:43Z`).
- **File LIMITS này:** `docs/PHASE9_ROUND151_T1_VERIFY150_LIMITS.md` (dưới trần 37.768 B — xem cờ). Stage `phase9-round151-t1-verify150.txt` (1 entry NUL, od OK). Cờ `round151-t1.done` viết trước khi báo đóng.

**Tổng batch đợt 150 (tái kiểm): 10 batch / 18 entry / 18 file duy nhất.**
**Lũy kế 111–150: 388 batch / 774 entry / 658 file.**
**Tổng batch chờ user push (đợt 136–150): 140 batch / 196 entry / 161 file duy nhất** (+ 1 file oversize 6,4 MB `benchmarks/results/webkit-blob-flaky-96x3.json` chưa quyết số phận).
**KHÔNG PUSH trong phiên này.** (Chỉ stage, để đó chờ user push từ main chat.)
