# LIMITS — Phase 9 đợt 129 (gộp 9/9, T10 đóng trong phiên)

## 0. Tóm tắt (đọc trước)

- **9/9 luồng T1–T9 xong, cờ `.done` đủ trên đĩa lúc kiểm đầu 09:48Z** (không luồng nào thiếu cờ; không cần poll chờ). T10 đóng trong phiên, boot #76 sống suốt lúc đóng.
- **Lượt yên WebKit #7 ĐÃ ĐÓNG** (T4, attempt1 duy nhất 20/20, median 54,0 ms, lớp B 5/5 ĐẠT) — sau 2 đợt liên tiếp không đóng được. Ngưỡng ≤60 ms GIỮ. 6 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 ms.
- **Reboot GIỮA LUỘT lần đầu tiên** (#75→#76 lúc 09:02:12Z): T4 xong trước reboot 31 giây nên lượt yên giữ nguyên; T8 chạy lại harness trên #76 sau cờ POSTBOOT_PASS mới 09:32:15Z, 3/3 exit 0.
- **Mù #48 KHÔNG đóng hoàn toàn** (T2: A mở, B đóng, tối đa 2 ẩn); gap #74→#75 = 8.307 s VẪN SPAN; CERT n=41 / FULL n=56 giữ. **Mù #49 MỚI MỞ.**
- **(c2) +1f tái hiện 2 lần nữa** (T4 seq 136, 181; T5 đối chiếu: modal +1/+2 KHÔNG giữ nguyên dạng ngay cả trên lượt yên hợp lệ — giả thuyết seek-latency desync CHƯA chứng minh; đề xuất instrumentation chờ parent quyết).
- **T1 kiểm chứng độc lập đợt 128: mọi claim lớn PASS; 3 sai số nhỏ mới (F-129-1/2/3), không đổi verdict nào.** F-129-2 (script đếm double-count khi chạy lại verbatim) đã được T10 sửa trong script đếm đợt này.
- **T3 cải tiến probe lượt yên** (blendTick tăng dần + heartbeat [HB129], kiểm chứng thật bằng dry-run kill giữa chừng, blendTick n=106) — probe mới chỉ dùng từ đợt 130.
- **T7: 3 slot scheduler thiếu mới** (HB 1 + DR 2) + 2 dị thường muộn HB mức kỷ lục (+1.252 s, +889 s). **T9: headroom 3.079** (tiếp tục giảm, chưa tới ngưỡng báo < ~1.800, còn 1.279); RAM 908–1.339 MB; birefnet không chạy.
- **T10 verify: suite cây gộp 27/27 exit 0; O8 Chromium 21/21 + WebKit 21/21 exit 0** (WebKit FULL PASS lần thứ bảy liên tiếp); cây không đổi; không reboot trong lúc đóng; lock trống lúc đóng (0 ticket + 71 cooldown, 994 B).
- **Đếm cuối: đợt 129 = 10 batch / 13 entry / 13 file duy nhất (gồm closing); lũy kế 111–129 = 187 batch / 486 entry / 437 file duy nhất** (dedup toàn cục; đã tái kiểm 111–128 = 177/473/427 khớp số công bố đợt 128).
- KHÔNG push. Batch stage chờ user push từ main chat.

## 1. T1 — Kiểm chứng độc lập đợt 128: mọi claim lớn PASS + 3 sai số nhỏ mới (F-129-1/2/3)

- Phương pháp: tính lại từ JSON thô bằng code riêng (không dùng analyzer của T3 hay script của T8 — chỉ đối chiếu sau khi tính xong); đối chiếu mù #47 từ file gốc của T2; chạy lại script đếm đợt 128 verbatim + đúng trạng thái lúc T10 đếm. Không đo mới, không sửa production, không sửa file đợt 128.
- **DEF v0.4 PASS:** dải trộn ~31–53% truy được về dữ liệu leg T3 đợt 127 (TRỘN 3/6, dãy S-F-F-S-F-S; run 6 CHẬM 1,702 s @ 31,52% vs run 4 NHANH 1,195 s @ 31,67%; tickRate trung gian ~28–33 tái hiện lần 3: 32,44 @ ~36%); đính chính "TRỘN 3/3" → "TRỘN 3/6" là đúng (lỗi có thật ở v0.3.1 §11 dòng 445; file v0.3.1 nguyên vẹn md5 02fe8218…).
- **Mù #47 ĐÓNG HOÀN TOÀN PASS:** 123/345 mốc, lỗ max 95 s/632 s, đuôi 54 s/459 s, đều < sàn 1.147 s; C đóng bằng uptime trực tiếp. Gap #72→#73 = [3.238 s, 3.258 s], #73→#74 = [6.629 s, 6.649 s]; CERT n=41 / FULL n=56 — khớp từng số.
- **Đếm cuối 177/473/427 PASS** — tái kiểm đúng trạng thái lúc T10 đếm khớp chính xác (xem F-129-2 về bẫy chạy lại).
- **T3 85m4 PASS** (JSON ok=true, 06:06:44–06:08:58Z, consoleErrs=[], P3 extraCount=0); **T5 boot #74 PASS +47m52s PASS** (cờ POSTBOOT_PASS đúng boot_id/btime/pass_at); **T4 lượt yên #7 PASS** (a1 75,0 / a2 63,0 / a3 dở dang 55,0; 0 lượt hợp lệ; (c2) 3 lần khớp seq gốc).
- **F-129-1 (mới, trong DEF v0.4): mean Yên-127 10,27% vẫn còn trong DEF v0.4 §3** (dòng 88) — tính lại từ chính các số avg60 từng run (14,13; 11,61; 13,10; 11,39; 6,29; 4,09): tổng 60,61 / 6 = **10,10%** (pooled 10,13%; không cách tính nào cho 10,27%). Đây chính là lỗi F3 mà T8 đã báo đợt 128 — T1 đợt 128 đã tránh nó ở điểm đường cong ("71,6 @ ~10%") nhưng không sửa nó ở bảng §3 khi chép số. Ảnh hưởng KHÔNG ĐÁNG KỂ (vẫn ~10%, xa dưới ngưỡng Yên 30%; không đổi dải, ngưỡng hay kết luận nào). Đề xuất: DEF v0.5 (khi viết) ghi 10,10%; không sửa file v0.4 sau khi ban hành.
- **F-129-2 (mới, phương pháp đếm): `count-final.py` không lũy thừa sau khi file closing tồn tại.** Chạy verbatim script đợt 128 lúc này cho **178 batch / 475 entry** (sai +1 batch / +2 entry so với số đúng 177/473) vì glob `phase9-round128-*.txt` nay đã gồm `phase9-round128-closing.txt` (tạo 06:23:07Z, sau khi T10 đếm) mà script vẫn cộng closing thủ công thêm một lần. Chạy đúng trạng thái lúc T10 đếm (loại closing-128 khỏi glob, cộng thủ công một lần) cho đúng **177/473/427**. Số công bố của T10 đúng; script cần sửa cho T10 đợt sau — **T10 đợt 129 ĐÃ SỬA** (xem §10.2: glob loại `*-closing.txt` của đợt đang đếm, cộng closing tay 1 lần duy nhất).
- **F-129-3 (mới, ghi nhận): LIMITS gộp đợt 128 bị sửa sau khi đóng.** File hiện 58.942 B, mtime 06:24:30Z — lớn hơn 57.018 B mà chính §10.3 của nó ghi, và mtime sau cờ `round128-t10.done` (06:23Z). Nội dung T1 kiểm chứng là bản hiện tại (58.942 B); không phát hiện mâu thuẫn nội dung do lần sửa muộn này (mọi số §10 đối chiếu khớp §1–§9). Chỉ ghi nhận để lần sau khỏi nhầm kích thước/mtime khi đối chiếu.

## 2. T2 — EPERM: probe #48 ok=2 fail=0 + mù #48 KHÔNG ĐÓNG HOÀN TOÀN + gap #74→#75 VẪN SPAN + WFS lần 35 chênh 0

- Probe #48 (08:39:55Z, boot 475406f6): ok=2 fail=0, exit 0; log v2 tăng đúng 3 dòng (133 → 136); heartbeat nay n=48. Boot #75 (btime 07:13:31Z) tới TRONG dải cơ học [05:27:27Z, 07:39:18Z] — lần thứ năm liên tiếp trong dải. Clock VM chính xác so với UTC thật (F75 ≈ 0, ±~2 s).
- **Mù #48 (MỚI): 05:42:21Z → 08:39:55Z 17/11 (2h57'34") — KHÔNG ĐÓNG HOÀN TOÀN (A mở, B đóng).** Đoạn A MỞ (212 mốc, khoảng trống lớn nhất 2.941 s = chính đuôi A, 0 quan sát trong đuôi (06:54:24Z, 07:13:31Z] ở cả 4 phạm vi); đoạn B ĐÓNG (uptime trực tiếp + dấu boot tươi). 1 reboot đã chốt trong mù (#75 07:13:31Z) + tối đa 2 ẩn (đuôi A 2.941 s / sàn 1.147 s = 2,56 → floor 2).
- **Gap #74→#75 = 8.307 s (2h18'27") VẪN CHỈ LÀ SPAN** — đoạn A mù #48 mở. **CERT giữ n=41 / FULL giữ n=56** (tái hiện verbatim bằng blind47-gaps.py).
- **Replay #75 ĐỦ HÌNH DẠNG 1.509 DÒNG:** dpkg.log 1.509 dòng, 08:35:43–08:41:46Z, 217 installs, gói cuối gstreamer1.0-tools — giống #68/#70/#71/#73/#74, KHÁC #72 (350 dòng, ngoại lệ một lần đã đóng đợt 128). Replay khởi động MUỘN (+1h22'12" sau boot — máy yên 07:13–08:35Z sau khi đợt 128 đóng); T5 là chủ quản replay.
- **Không sóng EPERM thật:** 0 dòng "vẫn bật" / "CẢNH BÁO 10 phút" / "Operation not permitted" trong 49 file *.log có mtime trong mù #48; quét mở rộng 14 match thô / 11 dòng duy nhất — phân loại hết (dương tính giả đã biết). Sóng gần nhất vẫn ~11:55–12:11Z 11/11 (~140h45' trước probe #48). EPERM vẫn KHÔNG được tuyên bố là đã hết.
- **Quét writeFileSync lần 35: 863 dòng / 242 file** (phạm vi 3.047 file); R7b 888/259; copies 25/17 — đối chiếu chéo 863+25=888=R7b, **chênh 0 — lần thứ ba mươi lăm liên tiếp**. Async `.writeFile(`: vẫn đúng 2 vị trí helper đã biết — 0 stray.
- RAM max biết được trong mù #48: 2.687 MB (44% guard); birefnet KHÔNG chạy.
- **Prereg sai, ghi công khai, không sửa prereg sau khi thấy số:** (1) prereg dự báo đoạn A "có thể đóng" — thực tế A MỞ; (2) prereg ghi gap #74→#75 danh nghĩa 6.507 s — **số đúng là 8.307 s**, code tính lại. Lưu ý: 6.507 s là số T6 tính theo đuôi sau mốc cuối đợt 128 (xem §6) — hai số đo hai khoảng khác nhau, không cộng nhầm.
- **Mù #49 MỚI MỞ** (từ probe #48) — việc của đợt 130. Tuyệt đối không kiểm lại mù #47 (đã đóng hoàn toàn) / mù #46 đoạn A / #45 đoạn G1 / #44 đoạn D / #40 đoạn B / #43 (quyết parent các đợt trước).

## 3. T3 — Cải tiến probe lượt yên: blendTick tăng dần + heartbeat [HB129] (KHÔNG đổi bar, KHÔNG chạy lượt yên thật)

- Vấn đề (nợ LIMITS gộp đợt 128 §11 mục 4): attempt3 lượt yên #7 đợt 128 chết pass-timeout (rAF kẹt 120 s, pass 17) và partial JSON KHÔNG có blendTick → (b)/(c2)/lag≥5f KHÔNG CÓ DỮ LIỆU trên lượt dở dang. Nguyên nhân: `writePartial` ghi `blendTick: []` cứng, trong khi `tickCost` đã được fetch tăng dần từng pass. Ngoài ra lần kẹt 120 s im lặng hoàn toàn (không log nào trong lúc chờ pass).
- Sửa (file duy nhất trong repo): `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` (md5 cũ `dccb8f4c…` → mới `920a5122…`, 942 → 997 dòng, diff 67 dòng): (1) `writePartial` fetch `window.__vcutRvfcBlendTick` TĂNG DẦN sau mỗi pass (lọc theo seq > mốc đầu case, giữ bản tốt nhất khi lỗi/timeout, ghi thêm `blendTickStatus` / `blendTickNote`); (2) heartbeat `[HB129]` 5 s (port từ hb128) trong 2 lần chờ dài: race pass 120 s + mọi `pwEvalTimeout`. Heartbeat chạy trên event loop Node nên vẫn log khi page.evaluate treo.
- KHÔNG đổi: ngưỡng ≤60 ms, bar B2 và toàn bộ lớp A/B, logic đo trong trang, fetch cuối lượt, định dạng JSON hoàn chỉnh, `pump: []` trong partial (chỉ blendTick được thêm).
- **Kiểm chứng thật:** dry-run trên fixture, kill probe sau pass 2/4 và sau pass 6/8 → partial JSON có blendTick tới pass cuối (run 1: blendTick n=106 sau kill giữa chừng) + analyzer labellag/lag5 chạy được trên partial; test trích code thật: pwEval treo 12 s → 2 dòng [HB129] rồi reject đúng timeout; evaluate nhanh → 0 dòng. `node --check` OK. KHÔNG đụng production (preview.tsx/media.ts md5 không đổi) nên không chạy lại tsc/vite build.
- **Probe MỚI chỉ dùng từ đợt 130 — T4 đợt 129 vẫn dùng probe CŨ** (bản copy T4 md5 `dccb8f4c…`). Analyzer T4 đọc `blendTick`/`tickCost` trực tiếp, bỏ qua field thừa — không cần sửa analyzer cho field mới.

## 4. T4 — WebKit lượt yên #7 chạy lại LẦN 3: CÓ LƯỢT YÊN HỢP LỆ — LẦN 7 ĐÃ ĐÓNG

- **Attempt1 (20/20, exit 0): tickCost total median 54,0 ms — LỚP B 5/5 ĐẠT — LƯỢT YÊN HỢP LỆ.** load1 max 1,48 (11 mẫu), RAM min 1.315 MB (0 mẫu <1.024 MB), load5 cuối 0,93, không reboot, apt/dpkg 0; ps-before/after sạch (không process luồng khác trong cửa sổ đo).
- **CHỈ CHẠY 1 ATTEMPT** — attempt1 đã là lượt yên hợp lệ, dừng theo protocol S5 (1 lượt) và ngân sách "tối đa 3 attempt" (trần, không phải định mức).
- **Ngưỡng WebKit ≤60 ms: GIỮ NGUYÊN** — lần 7 đóng với median 54,0 ms. **6 lượt yên xác nhận: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 ms, trung bình 47,8 ms.** Không siết thêm từ 1 lượt.
- **(c2) +1f: tái hiện 2 lần** — seq 136 (presented 16, label 15) và seq 181 (presented 36, label 35), cùng chữ ký cũ (label kém presented đúng 1f). Chuyển T5 chẩn đoán (§5).
- **Event lag ≥+5f: 0 occurrence** — event cũ đợt 126 (seq 276–279, frame 27) KHÔNG tái hiện. **F6' vẫn ĐÃ ĐÓNG** (100%/100%, n=74).
- **Xếp lịch đúng hẹn đợt này:** attempt1 chạy vào cửa sổ yên thật (T1/T6/T7/T9 đã .done; T2/T3 không chạy process nặng lúc kiểm) — load1 max 1,48, thấp nhất trong các attempt gần đây (attempt3 đợt 128: 1,92). Chứng minh quyết parent đợt 128 §12.3(a) đúng: B2 đạt được khi xếp lịch đúng, không cần nới bar.
- **Phối hợp lịch T8 ĐÚNG HẸN:** T8 chờ cờ T4; T4 touch cờ `round129-t4-done` 08:58:20Z ngay khi attempt1 xong + phân tích xong (trước LIMITS/batch). Cờ `.done` 09:01:41Z — trước reboot 09:02:12Z 31 giây; reboot KHÔNG giết attempt nào của T4.
- **check-classb nay in verdict tổng:** dòng `LOP-B-TONG: DAT 5/5` đã in đúng ở attempt1 (nợ LIMITS đợt 127 §9.3 / đợt 128 §7.3 mục 6 — ĐÃ ĐÓNG ở bản copy đợt này; **cần mang vào bản gốc các đợt sau**).
- Prereg viết TRƯỚC mọi phép đo (08:41Z); gate 0 ĐẠT poll #1; gate A mở poll 1. Dry-run analyzer TRƯỚC khi đo PASS 100% (tái tạo đúng median S5 49,5 + r128 a1/a2/a3 75,0/63,0/55,0). Cây đo baseline 03bf029f / 2c384ed1 không đổi. Chốt chặn round-in-progress.md tồn tại lúc T4 bắt đầu nhưng là marker MỞ ĐỢT 129 do parent tạo — T4 tiến hành bình thường.
- Nợ lượt yên lần 7 (chạy lại lần 3) **ĐÃ ĐÓNG** sau 2 đợt liên tiếp không đóng được. Lượt yên lần 8 — chờ quyết parent (§12(b)).

## 5. T5 — Hạ tầng: boot #74 CHẾT; boot #75 replay muộn nhất nhưng PASS +1h29m34s; REBOOT GIỮA LUỘT sang #76; (c2) modal +1/+2 KHÔNG giữ dạng

- **Boot #74? CHẾT trong khung (06:20:05Z, 07:13:31Z]** (btime 04:55:04Z, boot_id `c279cf46-a38b-4d93-b6e9-fa251b078108`; tuổi 1h25m01s–2h18m27s; lần cuối còn sống: T10 đóng đợt 128 lúc 06:20:05Z). Reboot thứ 4 liên tiếp rơi vào khoảng giữa đợt đóng và lượt mở.
- **Boot #75? replay KHỞI ĐỘNG MUỘN NHẤT nhưng XONG HẲN, PASS +1h29m34s.** btime 07:13:31Z, boot_id `475406f6-8cd8-4a97-a5b3-e798f24d1a26`. Configure 08:35:43Z (boot **+1h22m12s — muộn nhất từng ghi**, vượt #54? +47m14s; chỉ 8 giây TRƯỚC lượt cron dispatch 08:35:51Z), unpack 08:36:07Z, installs 08:36:07–08:41:46Z (**dpkg 1.509 dòng, 217 installs**, gói cuối gstreamer1.0-tools). Lists 39 file / 34 noble, CHỈ 1 mirror azure (khác #74: 71 file / 68 noble / 2 mirror) — partial/trống, apt 11/11 PASS, GST 269 — chức năng đủ, chỉ ghi nhận khác biệt mirror. Postboot PASS 5/5, 0 FAIL; **cờ `POSTBOOT_PASS` cho #75? viết 08:43:05Z (đúng boot_id)** — T4 gate 0 ĐẠT poll #1 nhờ cờ này; cờ đợt 128 STALE.
- **Boot #75? CHẾT GIỮA LUỘT — reboot giữa lượt ĐẦU TIÊN T5 ghi nhận.** Chết trong khung (08:59:16Z, 09:02:12Z] (lần cuối còn sống: exec T5 lúc 08:59:16Z); tuổi 1h45m45s–1h48m41s. Phiên T5 bị gián đoạn bởi runtime restart đúng lúc VM reboot. Boot #76? mới (btime 09:02:12Z, boot_id `88f62ae6-a216-42a9-8a81-b36fd83ca019`) replay dạng (B) "chạm mà không cài": configure 09:03:05Z (boot +53s, 2 dòng dpkg.log) rồi im hẳn, 0 install, lists 5 file, GST 0 file, postboot FAIL mọi poll. §8.2(B) TRIGGER=YES lúc 09:13:06Z (dpkg im đúng 600s, đủ 5/5 điều kiện, kiểm chứng độc lập 09:14:42Z); T5 chạy `--repair` 1 lần có giám sát từ 09:15:07Z — **thành công**: apt-get update xong, re-check sau repair libs PASS đủ 5, GST 269; watcher b76 poll 27 (09:31:15Z) postboot 0 lần đầu sau repair (dpkg 759, installs 109, lists 75, GST 269). **Cờ POSTBOOT_PASS MỚI cho #76? viết 09:32:15Z** (poll=28) — T8 chạy lại harness sau cờ này. Cờ #75 (08:43:05Z) nay STALE.
- **Baseline 1.509 dòng / 217 installs giữ 3 boot liên tiếp** (#73, #74, #75) — xác nhận thêm nợ (i) đợt 127 đã đóng (quyết parent đợt 128 §12.3(g)): #72 (350 dòng) là ngoại lệ một lần. Khởi động muộn không dự báo chết dạng (A) (đã chứng minh ở #74).
- Luật §8.2 dạng (B) + luật (C): đánh giá ở MỖI poll, KHÔNG kích hoạt sai. Trên #75? (replay xong + postboot PASS): TRIGGER=NO ở cả 3 poll. Trên #76? trong lúc --repair chạy postboot FAIL nhưng TRIGGER=NO (apt installs của repair).
- **(c2) +1f — chẩn đoán (§8):** tái hiện thêm 2 lần ở lượt yên #7 lần 3 (T4 attempt1 — lượt yên HỢP LỆ: seq 136, 16/15; seq 181, 36/35) + 3 lần đợt 128 = 5 lần tổng cộng, đều đúng chữ ký cũ (+1f, hiếm, không đổi dấu). **Modal +1/+2 KHÔNG giữ nguyên dạng ngay cả trên lượt yên hợp lệ:** đợt 127 (hợp lệ, median 44,0): +1/+2 = 47,3% (mode); đợt 129 a1 (hợp lệ, median 54,0): +1/+2 = 33,9%, 0 = 37,7% (mode); pool đợt 128 (nhiễm tải, n=1144): 0 là mode. Phân phối nhạy với tốc độ tick/tải nền của từng lượt — không còn là nhiễu tải. Cần thêm 1–2 lượt hợp lệ nữa để xác định modal ổn định (dự kiến 0/+1/+2 ~35/15/20, +3 ~18%).
- **Kiểm tra mới: snap−label KHÔNG dự báo lag theo từng entry** (§8.2). Event 276–279 khoanh hẹp thêm: nhãn và lần vẽ ĐỒNG Ý về video time (§8.4). **Giả thuyết seek-latency desync CHƯA CHỨNG MINH** — cơ chế lấy mẫu chỉ giải thích được độ lớn (+1f ≈ median 38 ms ≈ 1,1 frame) chứ không phải hình dạng phân phối.
- **Đề xuất instrumentation (§8.6) — CHỜ PARENT QUYẾT, không tự làm:** (1) log mỗi lần `rawUnitSource` vẽ (`preview.tsx:685`, `rctx.drawImage(drawSrc, …)`): ghi `video.currentTime` lúc vẽ + `video.seeking` + `video.readyState` + frameIdx của tick (1–2 vòng loop quanh wrap là đủ — không log vĩnh viễn); (2) log mỗi lần drawSrc-the-canvas nhận frame mới từ video (chuỗi tạo drawSrc `preview.tsx:4117–4211`: canvas nào trong chuỗi đã vẽ frame nào, lúc currentTime nào) — mắt xích còn thiếu: drawSrc là canvas đã vẽ trước (srcKind="canvas" 100%), lần vẽ cuối của nó không có timestamp. Chỉ cần 1 lượt yên có instrumentation + histogram đối chiếu lại; không cần lượt đo E4 hay TTS nào.
- Headroom/RAM (T5 đo thêm): headroom 3.085→3.079; RAM thấp nhất lượt 576 MB (09:14:42Z pre-repair + 09:31:15Z sau repair). R9 (a) vẫn chờ user (nhắc lần 14 — lần này T5 ghi "không nhắc thêm" ở §10, xem §12(c)).
- Sửa `apps/web/scripts/vcut-webkit-postboot-check.sh` 2 lần (chỉ tham chiếu boot, không đổi logic).

## 6. T6 — Lock health: KHỎE; prune cooldown lần 4 — xóa 0 file; mù #37 không đổi

- Boot mới #75 lúc bắt đầu (btime 07:13:31Z, uptime ~1h25'). md5 khớp baseline đợt 120–128: lock v2 `cd0c05c1`, v1 frozen `fd21193c`, suite `1c0d7eaa`. Không script nào đổi từ đợt 120 tới nay.
- **Quét zombie: 0 zombie, 0 tiến trình vite/node/webkit thật, 0 cổng lắng nghe** (2 snapshot ps đầy đủ 08:39Z + 08:42Z; `ss -tlnp` chỉ dòng header).
- **Lock sau boot mới #75: TRỐNG, holder cuối đợt 128 đã nhả sạch trước reboot.** Log lock nhất quán: **763 dòng, 221/221 cặp ACQUIRED→RELEASED, 0 đang giữ, 0 mất dấu**; cửa sổ R120: 138=138=138 (khớp đợt 128). **Round 128 khép sạch trên lock** (24 TICKET = 24 ACQUIRED = 24 RELEASED, 0 TIMEOUT/STALE-LOCK).
- **Prune cooldown lần 4: xóa 0 file** (lần thứ 4 liên tiếp: đợt 126, 127, 128, 129 đều 0). Ứng viên mtime >7 ngày: 0 file; tổng **69 file / 966 B** lúc 08:41Z và 08:47Z (khớp ba cách đếm độc lập; 69 × 14 = 966). File cũ nhất `cooldown-r4-round115`, mtime 2026-11-14T18:38:25Z (~2,6 ngày tuổi lúc kiểm) — đủ 7 ngày vào khoảng **21/11 18:38Z**; T6 các đợt sau đếm tiếp.
- **Đính chính nhỏ (không đổi kết quả prune):** T6-128 §7 ghi "không file nào >48h" — theo đồng hồ tường file cũ nhất lúc đó đã ~59h tuổi; con số 0 đó thực chất là tầng `find -mtime +2` (≥72h), không phải >48h. Tương tự, `find -mtime +7` chỉ khớp file ≥192h (8 ngày), không phải >7 ngày đúng nghĩa — luật (a) theo chữ sẽ tới hạn sớm hơn phương pháp `find` tối đa 24h. T6 KHÔNG tự đổi phương pháp giữa chừng; chỉ ghi nhận để **parent quyết có chỉnh phương pháp đếm hay không**. Kết quả đợt này không đổi theo cách đếm nào (file cũ nhất mới 62h tuổi).
- **Mù #37: KHÔNG ĐỔI, không thử đóng lại** (đông cứng từ T6-119 §2.3; parent đã chấp nhận để mở — QUYẾT PARENT 7 đợt 119). Khoảng 11:39:50Z → 23:45:17Z 16/11 (12h05'27"), A+D đóng, B+C mở, tối đa 29 reboot ẩn. Không có quan sát mới trong cửa sổ B/C.
- **Đuôi sau mốc cuối đợt 128 → boot #75 (đếm mới):** mốc cuối đợt 128 T10 đóng 06:20:05Z → btime #75 07:13:31Z, dài **53'26" (3.206 s)**: đầu đuôi 4'25" có 2 quan sát muộn trên boot #74 (`round128-t10.done` 06:23:30Z; LIMITS gộp đợt 128 06:24:30Z — đều là ghi file sau khi đóng); đuôi im lặng 49'01" (06:24:30Z → 07:13:31Z) 0 quan sát. Boot #74 chết trong khoảng (06:24:30Z, 07:13:31Z].
- **Gap #74→#75 danh nghĩa 6.507 s (1h48'27") theo prereg T2 đợt 129: VẪN SPAN** (số T6). **LƯU Ý PHƯƠNG PHÁP — HAI SỐ GAP KHÁC NHAU, KHÔNG CỘNG NHẦM:** T6 tính 6.507 s = đuôi sau mốc cuối đợt 128 (06:20:05Z → 07:13:31Z, btime→btime danh nghĩa); T2 tính 8.307 s = gap boot-to-boot (#74 btime 04:55:04Z → #75 btime 07:13:31Z). Số đúng cho gap #74→#75 theo định nghĩa boot-to-boot là **8.307 s** (T2 §2.2, prereg T2 đã đính chính); số 6.507 s của T6 là độ dài đuôi sau mốc cuối đợt 128, dùng làm dữ liệu đầu vào cho T2, không phải gap boot-to-boot.
- Lưu ý đường dẫn: T6 đợt này đã xóa nhầm thư mục rỗng `repo-1/hidden_files/round129-t6/` tự tạo lúc đầu — chỉ chứa 1 file ps, không mất dữ liệu. Log lock thật và queue cooldown nằm ở `hidden_files/` (goal), không phải `repo-1/hidden_files/`.

## 7. T7 — Scheduler: 3 slot thiếu MỚI (HB 1 + DR 2) + 2 dị thường muộn HB mức kỷ lục

- Phạm vi: CHỈ đếm slot MỚI từ sau mốc 05:40:38Z 17/11 (lúc T7 đợt 128 kiểm lại lần cuối) tới lúc kiểm — không điều tra lại cơ chế drop.

| Slot thiếu mới | Giờ (+07 / Z) | Job |
|---|---|---|
| heartbeat 13:50:50+07 17/11 | 06:50:50Z | heartbeat |
| deterministic-doctor 14:00+07 17/11 | 07:00:00Z | deterministic-doctor |
| deterministic-doctor 15:00+07 17/11 | 08:00:00Z | deterministic-doctor |

- **Lần đầu sau 2 đợt, heartbeat thiếu trở lại** (đợt 127 và 128 đều chỉ DR thiếu). HB 13:50:50 kết luận thiếu sau ~1h48' quá giờ hẹn, kiểm lại 08:40Z vẫn thiếu. DR 14:00 thiếu sau ~1h40'; DR 15:00 thiếu sau ~40' (jitter lịch sử DR 0–2 s nên ngưỡng an toàn). DR 12:00+07 (thiếu mới đợt 128) vẫn thiếu khi kiểm lại — không đổi.
- **2 dị thường muộn mức kỷ lục trên heartbeat (chỉ ghi nhận, không suy đoán nguyên nhân):** HB 14:20:50+07 muộn **+1.252 s** (vượt kỷ lục cũ +1.251 s đợt 127 đúng 1 s — kỷ lục muộn mới, biên chỉ 1 s; ghi là "tái hiện ở mức kỷ lục + vượt 1 s", không tuyên bố bước nhảy mới); HB 15:20:50+07 muộn **+889 s** (vượt mức +887 s đã biết đúng 2 s). 3/6 slot HB trong cửa giữ mẫu chuẩn −316 s; 2 slot muộn lớn; 1 slot thiếu.
- Lũy kế (cùng phương pháp đợt 125–128): heartbeat **39/160 slot thiếu** (thiếu +1, mẫu số +6); deterministic-doctor **45/151 slot thiếu** (thiếu +2, mẫu số +3).
- **vcut-build-loop: 0 slot thiếu** trong cửa này (lượt 12:35:51+07 đợt 128 `succeeded`, kết thúc 06:25:09Z; lượt 15:35:51+07 đợt 129 đang `running` lúc kiểm).
- Slot HB 15:50:50+07 (08:50:50Z) và DR 16:00+07 (09:00Z) chưa tới hạn kiểm tra lúc làm việc → không đếm, không kết luận. Không bằng chứng mới về cơ chế drop.

## 8. T8 — Vite harness webkit 84l10/85m4/86n2: 3/3 exit 0 trên boot #76 (sau reboot giữa lượt)

- **Hai boot trong một đợt — #75 rồi #76 (reboot GIỮA LUỘT, lần đầu tiên).** Lượt mở trên boot #75 (btime 07:13:31Z); máy reboot giữa lượt → boot #76 (btime 09:02:12Z). Lần chạy harness đầu tiên trên #75 bị giết giữa chừng; toàn bộ kết quả chính thức là **lần chạy lại trên #76** (theo cập nhật giữa đợt của parent: chạy trên boot cũ đã chết không tính, chạy lại bộ harness trên #76 sau khi kiểm cờ POSTBOOT_PASS mới).
- Lần chạy trên #75 (KHÔNG tính vào kết quả chính): 84l10 exit 0 (71 s, 08:59:52–09:01:03Z); 85m4-hb128 DỞ DANG do reboot (P1/P2 PASS, P3 đồng bộ 1,8 s rồi sampling bình thường; heartbeat HB128 đều 5 s/lần tới 09:02:41Z, n=29/100; 4 s sau MiniBrowser chết đúng lúc máy reboot — **KHÔNG phải kẹt P3, KHÔNG phải fail sản phẩm**); 86n2 CHƯA CHẠY (driver bị SIGTERM trước khi tới lượt). Lưu ý đồng hồ: log harness cuối 09:02:45Z (đồng hồ boot #75) trong khi btime boot #76 là 09:02:12Z — chênh ~33 s; khả năng cao đồng hồ boot cũ chạy nhanh hơn ~33 s tại thời điểm reboot; con số 09:02:45Z chỉ dùng để định vị tương đối trong log, không dùng làm thời điểm reboot tuyệt đối.
- **Cờ POSTBOOT_PASS mới cho boot #76 — đã kiểm trước khi chạy lại:** `boot_id=88f62ae6… btime=2026-11-17T09:02:12Z pass_at=2026-11-17T09:32:15Z poll=28` — khớp boot hiện tại. Cờ cũ #75 (08:43:05Z) đã thành `POSTBOOT_PASS.b75-stale`, không dùng. T8 tự kiểm lại bằng đọc: đủ libevent-2.1/libEGL/libavif/libevdev; GST 269 file; replay #76: 109 dòng `status installed` trong dpkg.log, tất cả từ 09:00Z (109 gói WebKit/GST + deps, không phải toàn bộ 217 gói như replay #74). Waiter poll mỗi 60 s từ 09:08:46Z; cờ xuất hiện poll 25 lúc 09:32:46Z (sau 24 phút). Không chạy harness trước cờ.
- **Lần chạy lại trên boot #76 — 3/3 exit 0:**

| Harness | Lock giữ | Thời gian | Kết quả |
|---|---|---|---|
| 84l10 webkit | 97 s | 09:35:10–09:36:47Z | **exit 0** — W1-lần1/2/3 PASS, W2 PASS, E4 PASS |
| 85m4-hb128 webkit | 160 s | 09:37:02–09:39:42Z | **exit 0** — P1–P5 PASS; **P3 KHÔNG kẹt** (đồng bộ 2,8 s; phát thường 20 s, 0 restart); report JSON ok=true, consoleErrs=[] |
| 86n2 webkit | 274 s (gồm 60 s chờ acquire) | 09:40:42–09:45:16Z | **exit 0** — P1–P5 PASS; report JSON ok=true, consoleErrs=[] |

- **Heartbeat HB128 lần đầu tiên được thử lửa thật:** 2 dòng `waitForPlaySync` đã bắn trong lúc chờ đồng bộ thật >5 s (P4-lần1 6,5 s, P4-lần3 5,2 s) — chứng minh heartbeat ghi log đúng ngay cả khi `page.evaluate` chờ lâu. Đợt 128 có 0 dòng loại này vì mọi lần đồng bộ đều xong dưới 5 s. 19 dòng còn lại là `sampleFor` đều 5 s/lần — sampling tiến triển bình thường, không khoảng trống.
- **Đồng bộ chậm hơn hẳn đợt 128** (P4 85m4: 6,5/5,0/5,2 s so với 1,8/1,3/1,3 s trên boot #74; P4 86n2: 2,4/6,0/5,5 s so với 1,8/1,3/1,8 s trên boot #73) — trùng cửa sổ RAM khả dụng thấp (tối thiểu 511 MB trong lúc chạy). Chỉ ghi tương quan, KHÔNG kết luận RAM là nguyên nhân.
- **P5 seek kẹt dài nhất 3 mẫu (~0,6 s) ở cả 85m4 và 86n2** (đợt 128 là 0 mẫu) — vẫn PASS, chỉ ghi nhận; chưa đủ cơ sở gọi là hồi quy (n=1, RAM thấp). Theo dõi đợt sau.
- **Kẹt P3 đợt 127 tiếp tục KHÔNG tái hiện — lần chạy sạch thứ hai liên tiếp** (đợt 128 + đợt 129), nhưng nguyên nhân kẹt đợt 127 VẪN CHƯA CHỨNG MINH (một lần chạy sạch chỉ loại trừ "kẹt tất định").
- Fixture `/tmp` tạo lại 2 lần (2 boot), md5 khớp đủ 32 ký tự đợt 126. **Mirror 25/25 còn nguyên sau reboot** (kiểm 2 lần: boot #75 và #76); **kiểm kê toàn repo: 238 file ứng viên, 0 mới, 0 mất** so với đợt 128 (diff 0 dòng); **201/201 harness vite dev đã phủ mirror** (200 tự ghi + 1 thừa hưởng). **tsc-web exit 0 (32 s), vite build exit 0 (12,03 s)** — chạy 1 lần trên boot #76. Production không đổi (preview.tsx 03bf029f, media.ts 2c384ed1, vite.config.ts ee80d093). Xvfb :199 tự kill + unlink socket; 0 process sót; lock TRỐNG cuối đợt. Lock vite còn holder cũ sau reboot (thread=t8-round129, pid 17164, boot #75) — script lock tự nhận stale (boot đổi + pid chết + không vite/cổng) và đã dọn trước lần chạy #76; T8 không xóa tay.

## 9. T9 — Headroom inotify + RAM + guard birefnet: headroom 3.079, tiếp tục giảm, chưa tới ngưỡng báo

- **Headroom inotify hiện tại: 3.079** (đo lần 2, 08:40:47Z, boot #75) — **TIẾP TỤC GIẢM**: 3.212 (đợt 128) → **3.079 (−133, −4,1%)**. Đo lần 1 ngay trước đó: 3.086 — hai lần đo khớp nhau ±7, số đo tin cậy. Probe dừng ở errno 28 đúng cơ chế (không phải sự cố). Số watch đang giữ ngoài cell suy ra: 63.747 − 3.079 = **60.668 watch**.
- **CHƯA tới ngưỡng báo user (< ~1.800)**: còn cao hơn ngưỡng 1.279; vẫn gấp ~1,95 lần số watch vite thường cần (~1.578). **Vite thường chạy được. Chỉ theo dõi** (quyết parent đợt 126 §12(h), khẳng định lại đợt 127 §12(h), giữ nguyên đợt 128).
- Chuỗi dài hạn: **4.438 → 4.318 → 3.645 → 3.451 → 3.434 → 3.334 → 3.317 → 3.315 → 3.212 → 3.079** (−1.359, −30,6% từ đỉnh). Trong một boot headroom gần như đứng yên (đợt này: −7 trong ~104 giây); bước giảm xảy ra **giữa các boot/đợt**. Với tốc độ giảm gần đây (~130/đợt, mỗi đợt ~3 giờ) thì còn ~10 đợt nữa mới chạm ngưỡng *nếu* tốc độ giữ nguyên — chỉ là phép chia số học minh họa, KHÔNG phải dự báo (tốc độ giảm không đều: có đợt giảm 673, có đợt giảm 2–17 trong boot). Trần 63.747 vẫn đầy ở mức ~60,7k watch ngoài cell — cần can thiệp host để dọn watch ngoài cell / tăng trần, **ngoài tầm luồng này**.
- **RAM khả dụng đợt này: 908–1.339 MB** (T9 đo trực tiếp 08:38:58–08:40:47Z; brief lúc mở ~1.152 MB). Tất cả đều **< 6 GB guard** (6.144 MB). **Guard birefnet: KHÔNG ĐẠT — KHÔNG CHẠY birefnet.** Max quan sát được đợt này 1.339 MB chỉ bằng ~22% guard. **u2net vẫn là fallback chính thức.** Birefnet vẫn 0 lần chạy thành công trong gói.
- Không có vite đang chạy lúc đo, không có ENOSPC nào ngoài lần dừng có chủ đích của probe K8. Journal boot #75: 0 dòng "No space left"/ENOSPC. Replay trên #75 ĐANG CHẠY lúc T9 kiểm (dpkg.log 1.368 dòng lúc 08:40:47Z) — quan sát thô cho T5, T9 không kết luận.

## 10. T10 verify + đếm cuối (phương pháp đếm — chốt một con số)

### 10.1 Phase 1 (chạy NGAY trong phiên, boot #76 88f62ae6 vẫn sống suốt)

- **Cờ: 9/9 đủ trên đĩa lúc kiểm đầu 09:48Z** — T1 08:47:44Z, T2 08:51:53Z, T3 09:42:13Z, T4 09:01:41Z, T5 09:35:49Z, T6 08:50:38Z, T7 08:43:13Z, T8 09:47:28Z, T9 08:41:51Z. Không luồng nào thiếu cờ; không cần poll chờ (lần thứ ba liên tiếp 9/9 ngay lần đầu: đợt 127, 128, 129).
- **Boot #76** (`88f62ae6-a216-42a9-8a81-b36fd83ca019`, btime 09:02:12Z) sống suốt lúc đóng (09:48–09:59Z). **Không reboot trong lúc đóng.** Reboot #75→#76 xảy ra GIỮA LUỘT lúc 09:02:12Z — lần đầu tiên reboot rơi giữa lượt (4 lần trước đều giữa đợt đóng và lượt mở).
- **Suite cây gộp 27/27 exit 0** (09:49:38–09:56:28Z, RAMavail 943 MB lúc bắt đầu; log: hidden_files/round129-t10/round129-t10-suites.log). Script verify copy từ đợt 128 — **đã kiểm + sửa đường dẫn LOG trước khi chạy** (LOG trỏ đúng `round129-t10/round129-t10-suites.log` ngay từ đầu, bài học đợt 126/127/128).
- **O8 Chromium 21/21 pass exit 0 — LẦN ĐẦU, KHÔNG RERUN** (09:56:35–09:57:37Z, display :197 trống, lock v2 ticket t10-round129 giữ 138 s; log: hidden_files/round129-t10/t10-o8.log). Đã kiểm `ls /tmp/.X11-unix/` TRƯỚC khi chạy (luật đứng mới): lúc kiểm chỉ còn socket sót X193/X194/X195 (0 process), không chặn :197/:198.
- **O8 WebKit 21/21 pass exit 0** (09:57:37–09:58:53Z, log: hidden_files/round129-t10/t10-o8.log) — **WebKit FULL PASS lần thứ bảy liên tiếp** (đợt 123, 124, 125, 126, 127, 128, 129).
- md5 trước/sau khớp (preview.tsx 03bf029f, media.ts 2c384ed1). Cây KHÔNG đổi trong đợt.
- Lock vite lúc đóng: suite + O8 đều acquire/nhả sạch qua lock v2 (ticket t10-round129); kiểm cuối lúc đóng: lock TRỐNG (0 ticket + **71 cooldown, 994 B** — tăng từ 69 lúc T6 đếm 08:41Z: +cooldown-t8-round129 +cooldown-t10-round129; T4 tái dùng file cooldown-t4 đã có nên +0 net, cùng mẫu đợt 128). Log lock 796 dòng (763 lúc T6 + 33: T4/T8/T10).
- **Xvfb socket sót X193/X194/X195 (0 process, không process nào attach — kiểm bằng fuser) đã dọn tay lúc đóng 09:59Z; `/tmp/.X11-unix/` trống sau đó.** Lưu ý: lúc T10 kiểm đầu 09:48Z thư mục này TRỐNG — 3 socket xuất hiện trong lúc chạy suite (do test xvfb-lock / test-preview-engine.sh), không phải sót từ luồng khác. 0 Xvfb/MiniBrowser/vite process còn sót.
- Chốt chặn `round-in-progress.md` TỒN TẠI (marker mở đợt 129 do parent tạo 08:36Z) — đã xóa khi đóng sau khi mọi verify xong (xem §10.4).

### 10.2 Đếm cuối — PHƯƠNG PHÁP CHỐT (đợt 127 §10.2, giữ nguyên; đính chính F-129-2 đã áp dụng)

Phương pháp chốt từ đợt 125 §9.2, giữ nguyên: **entry NUL trong file paths theo đợt + dedup theo đường dẫn tương đối**; batch = số file paths; file duy nhất = số đường dẫn khác nhau sau dedup (gồm closing). Mọi con số khác trong đợt (đếm file trong thư mục, đếm thô toàn paths-loop) đều KHÔNG phải số chính thức. **Lũy kế tính bằng dedup toàn cục trực tiếp trên đĩa — KHÔNG cộng số học** (bài học đính chính đợt 127 §12.2(j)).

**Sửa F-129-2 trong script đếm đợt này:** `count-final.py` của T10 đợt 129 loại `*-closing.txt` của đợt đang đếm khỏi glob (chỉ cộng closing tay 1 lần duy nhất) — vì glob nay đã gồm file closing của đợt 128 (tạo sau khi T10 đợt 128 đếm), chạy verbatim script cũ sẽ đếm thừa +1 batch / +2 entry (178/475 thay vì 177/473). Script đếm: hidden_files/round129-t10/count-final.py.

- Đợt 129 (trước closing): 9 batch / 11 entry / 11 file duy nhất — T1 1, T2 1, T3 2, T4 1, T5 2, T6 1, T7 1, T8 1, T9 1.
- **Đợt 129 (gồm closing): 10 batch / 13 entry / 13 file duy nhất.**
- **Lũy kế đợt 111–128 tái kiểm bằng dedup toàn cục: 177 batch / 473 entry / 427 file duy nhất** — KHỚP CHÍNH XÁC số đã công bố đợt 128 (không phải 178/475 của bản chạy verbatim chưa sửa). Đây là lần tái kiểm độc lập thứ hai của số 177/473/427 (T1 đợt 129 cũng tái kiểm khớp, xem §1).
- **Lũy kế đợt 111–129 = 187 batch / 486 entry / 437 file duy nhất** (427 + 10 file mới-only của đợt 129; đối chiếu: 427 + 10 = 437 ✓). File đợt 129 trùng với 111–128 (3 file): `PHASE9_GAP_ANALYSIS.md` (mọi batch closing) + `apps/web/scripts/vcut-webkit-postboot-check.sh` (sửa ở các đợt 124–129) + `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` (sửa ở đợt 129 — lần đầu trùng kể từ khi T3 sửa nó).
- Verify: tất cả 11 đường dẫn đợt 129 đều tồn tại trên đĩa trong repo (chỉ thiếu LIMITS gộp lúc recount — file này viết ngay sau đó; đã kiểm lại sau khi viết, xem §10.3).

### 10.3 File oversize trong batch đợt này (>37.768 B, lúc push cần ENABLE_PRIVSEP=0)

| File | Kích thước | Batch |
|---|---|---|
| `docs/PHASE9_ROUND129_T2_EPERM_LIMITS.md` | 41.106 B | T2 eperm |
| `docs/PHASE9_ROUND129_T5_INFRA_LIMITS.md` | 50.129 B | T5 infra |
| `benchmarks/render/probe121t3-ghost-k7.webkit.mjs` | 61.239 B | T3 probe |
| `docs/PHASE9_ROUND129_LIMITS.md` (LIMITS gộp này) | 49.749 B | closing |
| `PHASE9_GAP_ANALYSIS.md` | 267.489 B trước §58 (tăng sau khi thêm §58) | closing |

Ghi chú: `apps/web/scripts/vcut-webkit-postboot-check.sh` 31.901 B — dưới trần, không oversize.

### 10.4 Đóng đợt

- Cờ `round129-t10.done` đã tạo khi đóng đợt (sau khi mọi verify xong + LIMITS gộp + GAP §58 + batch stage đã verify read-back).
- Chốt chặn `round-in-progress.md` (marker mở đợt 129) đã xóa khi đóng — chỉ xóa sau khi mọi verify xong.

## 11. Nợ mở chuyển đợt 130

1. **Lượt yên WebKit #8 — CHỜ QUYẾT PARENT** (xem §12(b)): lượt #7 đã đóng (attempt1 20/20, median 54,0 ms). Ngưỡng ≤60 ms GIỮ (6 lượt yên xác nhận, trung bình 47,8 ms). Nếu chạy tiếp: giữ lịch lệch T4-yên TRƯỚC, T8-harness SAU + xếp attempt vào cửa sổ các luồng phân tích nặng đã xong hẳn (quyết parent đợt 128 §12.3(a) đã chứng minh đúng).
2. **Mù #49 MỚI MỞ** (T2) — probe #49 + điều tra đoạn từ #75 theo lịch thường lệ.
3. **(c2) instrumentation log draw — CHỜ QUYẾT PARENT** (xem §12(a)): đề xuất T5 §8.6 (log `rawUnitSource` vẽ tại `preview.tsx:685` + chuỗi drawSrc `preview.tsx:4117–4211`). Cần thêm 1–2 lượt yên hợp lệ nữa để xác định modal ổn định (dự kiến 0/+1/+2 ~35/15/20, +3 ~18%).
4. **Probe mới T3 (blendTick tăng dần + heartbeat [HB129]) dùng từ đợt 130** — T4 đợt 129 vẫn dùng probe cũ; đợt 130 T4 dùng probe mới (md5 `920a5122…`, 997 dòng).
5. **R9 (a) vẫn chờ user (nhắc lần 15)** (§12(c)).
6. **G1 khung (a) M2 VẪN HOÃN — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời) (§12(d)).
7. **Headroom giảm dài hạn 4.438→3.079** — trần 63.747 cần can thiệp host (dọn watch ngoài cell / tăng trần), ngoài tầm luồng này; ngưỡng báo user headroom < ~1.800 (còn 1.279) (§12, quyết đợt 126 §12(h)).
8. **DEF v0.5 chỉ viết khi có dữ liệu mới** — vd leg sau đo được khoảng (53%, 65,75%), hoặc run chậm ở ~28–30% buộc xét lại ngưỡng Yên <30%. Khi viết: ghi mean Yên-127 = **10,10%** (F-129-1), không chép 10,27% của DEF v0.4 §3. Không sửa file v0.4 sau khi ban hành.
9. **count-final.py đã sửa glob (loại `*-closing.txt`)** — T10 đợt 130 dùng bản này (hidden_files/round129-t10/count-final.py), không chạy verbatim bản đợt 128 nữa.
10. **T6 đính chính find -mtime — CHỜ QUYẾT PARENT** (xem §12(e)): `-mtime +7` chỉ khớp file ≥192h (8 ngày), không phải >7 ngày đúng nghĩa; `-mtime +2` là ≥72h, không phải >48h. Luật prune (a) theo chữ sẽ tới hạn sớm hơn phương pháp `find` tối đa 24h — parent quyết có chỉnh phương pháp đếm hay không. Kết quả prune đợt này không đổi theo cách đếm nào.
11. **T4 check-classb LOP-B-TONG mang vào bản gốc** — verdict tổng `LOP-B-TONG: DAT 5/5` đã in đúng ở bản copy đợt 129; cần mang vào bản gốc các đợt sau (nợ từ đợt 127 §9.3 / đợt 128 §7.3).
12. **Prune cooldown:** file cũ nhất đủ 7 ngày vào khoảng 21/11 18:38Z — T6 các đợt sau đếm tiếp; số chính thức hiện 71 file/994 B (T10 đếm lúc đóng; T6 đếm 69 file/966 B lúc 08:41Z).
13. **Scheduler:** cơ chế drop chi tiết cần bằng chứng ngoài VM; không điều tra tiếp từ trong VM bằng cùng phương pháp. Dị thường HB muộn kỷ lục +1.252 s (14:20:50+07) và +889 s (15:20:50+07) chỉ ghi nhận — giao luồng hạ tầng nếu muốn đào.
14. **Kẹt P3 85m4 đợt 127 VẪN CHƯA CHỨNG MINH nguyên nhân** — 2 lần chạy sạch liên tiếp (đợt 128 + 129) chỉ loại trừ "kẹt tất định". HB128 đã thử lửa thật lần đầu (2 dòng waitForPlaySync) — nếu kẹt tái hiện ở đợt sau, heartbeat đã sẵn sàng ghi dòng đầu tiên sau điểm kẹt.
15. **P5 seek kẹt 3 mẫu (~0,6 s) ở cả 85m4 và 86n2** (đợt 128 là 0 mẫu) — vẫn PASS; theo dõi đợt sau, chưa đủ cơ sở gọi là hồi quy.
16. **Boot #76 đang sống + POSTBOOT_PASS mới 09:32:15Z** — các luồng đo đợt 130 dùng cờ này (cờ #75 STALE). Tuổi thọ boot gần đây: #71? 54m08s–1h24m28s (chết dạng A), #72? 54m08s, #73? 1h24m28s–1h50m39s, #74? 1h25m01s–2h18m27s, #75? 1h45m45s–1h48m41s (chết giữa lượt), #76? chưa biết (sống ≥57m tới lúc T10 đóng đợt).
17. Các nợ đứng khác giữ nguyên từ LIMITS gộp đợt 128 §11 + quyết parent §12.3: mù #22/#28–#31/#35/#37–#40 chờ user quyết (mù #39 J + mù #40 B + mù #43 + mù #44 D + mù #45 G1 + mù #46 A + mù #48 A đã CHẤP NHẬN ĐỂ MỞ — mù #48 đoạn A nay mở theo T2 đợt 129, mù #49 mới mở); birefnet (chỉ thử lại khi quan sát được available ≥ 6 GB, u2net là fallback chính thức); ci-security.yml vẫn 403 chờ user; TTS 39 cấm kiểm lại; release gate không đổi + KHÔNG push khi user chưa nhắn "push đi".

## 12. Bài học vận hành (đợt 129) + chờ quyết parent

### 12.1 Bài học vận hành

1. **Kiểm đĩa trước khi kết luận thiếu cờ — 9/9 đủ ngay lần đầu, lần thứ ba liên tiếp** (đợt 127, 128, 129). Không lặp lại bài học các đợt trước — nhưng vẫn kiểm đĩa trước, không tin handoff mù.
2. **Copy script verify giữa các đợt phải sửa cả đường dẫn LOG bên trong — ĐÃ LÀM ĐÚNG lần thứ ba liên tiếp.** T10 kiểm `grep LOG=` trong script copy trước khi chạy: LOG đã trỏ đúng `round129-t10/round129-t10-suites.log` ngay từ đầu, không ghi nhầm file đợt cũ.
3. **Reboot GIỮA LUỘT là mẫu mới — lần đầu tiên sau 4 lần reboot giữa đợt đóng và lượt mở.** Bài học: cờ `.done` của luồng đã xong TRƯỚC reboot vẫn giữ nguyên giá trị (T4 xong trước reboot 31 giây, lượt yên #7 không phải chạy lại); các luồng đang chạy phải chạy lại trên boot mới sau cờ POSTBOOT_PASS mới (T8 chạy lại 3/3 harness trên #76). Quy trình "chờ cờ POSTBOOT_PASS của boot mới theo luật STALE" đã chứng minh đúng cho cả 2 loại reboot.
4. **Đồng hồ boot cũ chạy nhanh hơn boot mới ~33 s tại thời điểm reboot** (log harness cuối 09:02:45Z trên đồng hồ #75 trong khi btime #76 là 09:02:12Z). Bài học: thời điểm reboot tuyệt đối lấy theo btime kernel của boot mới + khung chết của T5, không lấy timestamp trong log của boot cũ.
5. **Xvfb socket sót xuất hiện NGAY CẢ KHI thư mục trống lúc kiểm đầu** — 3 socket X193/X194/X195 xuất hiện trong lúc T10 chạy suite (do test xvfb-lock / test-preview-engine.sh), không phải sót từ luồng khác. Bài học: kiểm `ls /tmp/.X11-unix/` trước O8 là đúng, nhưng socket sót cũng có thể sinh ra trong chính phiên đóng — dọn tay lúc đóng vẫn cần, và socket sót khác process sót (không chặn display khác).
6. **Lượt yên #7 đóng nhờ xếp lịch đúng, không nhờ nới bar.** Attempt1 chạy vào cửa sổ yên thật (load1 max 1,48 — thấp nhất trong các attempt gần đây) và đóng ngay lần đầu. Quyết parent đợt 128 §12.3(a) (B2 GIỮ NGUYÊN + chạy attempt vào cửa sổ các luồng nặng đã xong hẳn) đã chứng minh đúng trong thực tế.
7. **Modal +1/+2 không giữ dạng ngay cả trên lượt yên hợp lệ** (47,3% → 33,9%; 0 thành mode 37,7%) — phân phối nhạy với tốc độ tick/tải nền của từng lượt. Bài học: đừng tuyên bố modal ổn định từ 1–2 lượt; cần thêm 1–2 lượt hợp lệ nữa trước khi kết luận hình dạng phân phối.
8. **Heartbeat HB128 đã thử lửa thật lần đầu** (2 dòng waitForPlaySync trong lúc chờ đồng bộ thật >5 s) — chứng minh heartbeat ghi log đúng ngay cả khi `page.evaluate` chờ lâu. Nếu kẹt P3 đợt 127 tái hiện, heartbeat đã sẵn sàng ghi dòng đầu tiên sau điểm kẹt.
9. **Đếm cuối bằng dedup toàn cục đã tái kiểm đúng số đã công bố 2 lần độc lập** (T1 đợt 129 tái kiểm + T10 đợt 129 tái kiểm 111–128 = 177/473/427, khớp số công bố đợt 128). Bẫy double-count khi chạy lại script verbatim sau khi file closing tồn tại (F-129-2) đã được sửa trong script đếm đợt này — T10 đợt 130 dùng bản đã sửa.
10. **WebKit O8 FULL PASS lần thứ bảy liên tiếp** — chuỗi xanh ổn định từ đợt 123 qua 124, 125, 126, 127, 128, 129. Không còn là may mắn 1 lần; hạ tầng WebKit sau replay PASS đã ổn định — kể cả khi reboot rơi giữa lượt.
11. **RAM khả dụng 943 MB lúc T10 chạy suite** — suite vẫn 27/27 exit 0. RAM thấp không làm suite fail, nhưng là biên mỏng; birefnet vẫn xa guard 6 GB. Ngược lại, đồng bộ P4 chậm (5–6,5 s) trùng cửa sổ RAM tối thiểu 511 MB trong lúc T8 chạy harness — chỉ là tương quan thời gian, chưa chứng minh nhân quả; cần theo dõi đợt sau.

### 12.2 Chờ quyết parent (đã quyết ở §12.3 dưới)

- **(a) (c2) instrumentation log draw: CÓ LÀM KHÔNG?** Đề xuất T5 §8.6: (1) log mỗi lần `rawUnitSource` vẽ (`preview.tsx:685`): ghi `video.currentTime` lúc vẽ + `video.seeking` + `video.readyState` + frameIdx của tick (1–2 vòng loop quanh wrap là đủ); (2) log mỗi lần drawSrc-the-canvas nhận frame mới (chuỗi tạo drawSrc `preview.tsx:4117–4211`). T5 KHÔNG tự sửa production giữa đợt. Cần parent duyệt trước khi làm.
- **(b) Lượt yên WebKit #8: CÓ CHẠY TIẾP KHÔNG?** Lượt #7 đã đóng (attempt1 20/20, median 54,0 ms). Ngưỡng ≤60 ms GIỮ (6 lượt yên xác nhận, trung bình 47,8 ms). Nếu chạy: giữ lịch lệch T4-yên TRƯỚC, T8-harness SAU + xếp attempt vào cửa sổ yên thật. T4 đợt 130 dùng probe MỚI (blendTick tăng dần + HB129).
- **(c) R9 (a): VẪN CHỜ user (nhắc lần 15).** Không thay đổi. (T5 đợt 129 §10 ghi "không nhắc thêm" — T10 vẫn ghi nhắc lần 15 ở đây để đếm nhắc không đứt chuỗi; nội dung R9 (a) không đổi.)
- **(d) G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). Không thay đổi.
- **(e) T6 đính chính find -mtime: CÓ CHỈNH PHƯƠNG PHÁP ĐẾM KHÔNG?** `-mtime +7` chỉ khớp file ≥192h (8 ngày), không phải >7 ngày đúng nghĩa; `-mtime +2` là ≥72h, không phải >48h. Luật prune (a) theo chữ sẽ tới hạn sớm hơn phương pháp `find` tối đa 24h. Kết quả prune đợt này không đổi theo cách đếm nào — chỉ là quyết phương pháp cho các đợt sau.
- **(f) Mù #49 MỚI MỞ: GIỮ LỊCH PROBE THƯỜNG LỆ ở đợt 130.** Probe #49 + điều tra đoạn từ #75.
- **(g) Đóng đợt 129 9/9: CHẤP NHẬN?** Suite 27/27 exit 0; O8 Chromium 21/21 (lần đầu, không rerun) + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ bảy liên tiếp); cây không đổi; không reboot trong lúc đóng (reboot #75→#76 xảy ra giữa lượt, trước khi T10 đóng); chốt chặn đã xóa khi đóng; cờ t10.done có.

### 12.3 QUYẾT PARENT (main chat, 17:0x +07 17/11/2026 — đóng đợt 129)

- **(a) (c2) instrumentation log draw: PHÊ DUYỆT, có giới hạn.** T5 đợt 130 làm 2 điểm log theo đề xuất §8.6 (rawUnitSource vẽ ở `preview.tsx:685`: ghi `video.currentTime` lúc vẽ + `video.seeking` + `video.readyState` + frameIdx của tick; drawSrc-the-canvas nhận frame mới, chuỗi `preview.tsx:4117–4211`), CHỈ 1–2 vòng loop quanh wrap, không log vĩnh viễn. Điều kiện: (1) chỉ là chẩn đoán, mặc định tắt hoặc chỉ bật trong lượt probe chẩn đoán — KHÔNG đổi hành vi render, không để log chạy thường xuyên trong production; (2) sau khi chẩn đoán xong, gỡ instrumentation hoặc giữ sau cờ debug (parent quyết lúc đó); (3) không cần lượt đo E4 hay TTS nào. Lý do: (c2) đã tái hiện 5 lần (3 đợt 128 + 2 đợt 129) mà modal +1/+2 không giữ dạng ngay cả trên lượt yên hợp lệ — giả thuyết seek-latency desync không thể chứng minh hay đóng nếu thiếu mắt xích (lần vẽ cuối của drawSrc không có timestamp); đây là bước tối thiểu có mục tiêu.
- **(b) Lượt yên WebKit #8: PHÊ DUYỆT CHẠY ở đợt 130.** Ngưỡng ≤60 ms GIỮ (6 lượt yên xác nhận, trung bình 47,8 ms). Giữ lịch lệch T4-yên TRƯỚC, T8-harness SAU + xếp attempt vào cửa sổ yên thật. T4 đợt 130 dùng probe MỚI (blendTick tăng dần + HB129). Lý do: bài học §12.1.7 — đừng tuyên bố modal ổn định từ 1–2 lượt; cần thêm 1–2 lượt hợp lệ nữa trước khi kết luận hình dạng phân phối; và chuỗi lượt yên là xác nhận liên tục của ngưỡng ≤60 ms.
- **(c) R9 (a): VẪN CHỜ user** (nhắc lần 15). Không thay đổi. (T5 đợt 129 §10 ghi "không nhắc thêm" — T10 vẫn ghi nhắc lần 15 để đếm nhắc không đứt chuỗi; nội dung R9 (a) không đổi, không hỏi lại user.)
- **(d) G1 khung (a) M2: VẪN HOÃN — chờ quyết G1 của user** (đã hỏi 13:44 16/11, chưa trả lời). Không thay đổi.
- **(e) T6 find -mtime: GIỮ NGUYÊN phương pháp find hiện tại; ghi rõ ngữ nghĩa.** `-mtime +7` (≥192h) và `-mtime +2` (≥72h) BẢO THỦ HƠN chữ của luật (>7 ngày = >168h, >48h) — xóa muộn hơn, không bao giờ xóa sớm hơn luật cho phép. Xóa muộn là an toàn (file cooldown chỉ là sổ sách). Kết quả prune đợt này không đổi theo cách đếm nào. Ghi rõ ngữ nghĩa vào luật prune để các đợt sau không "sửa" ngược: ngưỡng >7 ngày thực thi là ≥192h, ngưỡng >48h thực thi là ≥72h. Không đổi file nào bị xóa.
- **(f) Mù #49 MỚI MỞ: GIỮ LỊCH PROBE THƯỜNG LỆ ở đợt 130.** Probe #49 + điều tra đoạn từ #75. Gap #74→#75 (8.307 s) giữ SPAN.
- **(g) Đóng đợt 129 9/9: CHẤP NHẬN.** Suite 27/27 exit 0; O8 Chromium 21/21 (lần đầu, không rerun) + WebKit 21/21 exit 0 (WebKit FULL PASS lần thứ bảy liên tiếp); cây không đổi; không reboot trong lúc đóng (reboot #75→#76 xảy ra giữa lượt, trước khi T10 đóng); chốt chặn đã xóa khi đóng; cờ t10.done có. Đếm cuối dedup toàn cục 187/486/437 đã tái kiểm đúng (111–128 = 177/473/427 khớp số công bố đợt 128; file trùng đợt 129: GAP_ANALYSIS.md + vcut-webkit-postboot-check.sh + probe121t3-ghost-k7.webkit.mjs).
- **(h) Ghi nhận: §8.2(B) kích hoạt LẦN ĐẦU trong đúng kịch bản mục tiêu và repair PASS.** Boot #76 replay dạng (B) "chạm mà không cài", dpkg im đúng 600 s, đủ 5/5 điều kiện, T5 chạy `--repair` 1 lần có giám sát và thành công (libs PASS đủ 5, GST 269; cờ POSTBOOT_PASS mới 09:32:15Z). Luật 10 phút (làm rõ đợt 125) đã được kiểm chứng trong thực tế. Không đổi luật §8.2.

---

- **Batch stage (KHÔNG push):** `repo-1-push/paths-loop/phase9-round129-closing.txt` — 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §58), NUL-delimited, verify read-back, 0 binary. Hồ sơ: hidden_files/round129-t10/ (suite log, O8 log, driver, lock log, count-final.py, phase1 summary). Cờ `round129-t10.done` đã tạo khi đóng đợt.
- **Tổng batch đang chờ user push (lũy kế đợt 111–129): 187 batch / 486 entry / 437 file duy nhất** + 1 oversize 6,4 MB (số lũy kế tính bằng dedup toàn cục; đã tái kiểm 111–128 = 177/473/427 khớp số công bố đợt 128 — KHÔNG phải 178/475 của bản chạy verbatim chưa sửa F-129-2). KHÔNG push khi user chưa nhắn "push đi" từ main chat.
