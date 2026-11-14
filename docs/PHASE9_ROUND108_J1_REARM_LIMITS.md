# PHASE9_ROUND108_J1_REARM_LIMITS — Re-arm A/B TẮT E4 (2+2 lượt hợp lệ, KHÔNG KẾT LUẬN)

> Đợt 108, luồng J1. Chạy live 2026-11-13T20:41:01–21:13:01Z (lượt cron 03:35 +07).
> KHÔNG push. KHÔNG release/tag. Không sửa production code ngoài toggle tạm
> thời 1 dòng (đã khôi phục, md5 về đúng). Không đo TTS/birefnet, không đụng
> workflows/cloud/collab.

## 1. Kết quả — 2+2 lượt hợp lệ; CAP/lượt 2,00 vs 0,50 NHƯNG CAP/tick gần như phẳng (Fisher p=1,0) → KHÔNG KẾT LUẬN

### 1.1 Từng lượt hợp lệ (đủ 2+2 theo prereg)

| lượt | nhánh | gop | RAM đầu (kB) | load1 | CAP | ages (ms) | rate | wall (ms) | frzMax | frzTail | n_vt | tails | stopped |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| j1on | on | 250 | 1.978.800 | 0,98 | 0 | — | 0,189 | 23.861 | 5.114 | 306 | 81 | 2 | true |
| j2on | on | 30 | 1.713.224 | 4,85 | 4 | 5025, 5165, 5302, 5123 | 0,102 | 44.287 | 5.014 | 5.014 | 161 | 4 | false |
| j1off | off | 250 | 2.071.488 | 0,72 | 0 | — | 0,397 | 11.493 | 2.113 | 313 | 39 | 3 | true |
| j2off | off | 30 | 1.713.520 | 1,87 | 1 | 5337 | 0,463 | 11.376 | 2.499 | 420 | 35 | 1 | true |

Tất cả 4 lượt: exit 0, verdict PASS/PASS, mtime + md5 `preview.tsx` không
đổi trong lượt, RAM đầu lượt trong dải prereg [1.450.000, 2.100.000] kB,
md5-trước đúng md5 kỳ vọng của nhánh (on: `ced42efd…`; off: `8cb31223…`
— file đã toggle, xem §2).

### 1.2 Tổng hợp theo nhánh

| chỉ số | E4-bật (on) | E4-tắt (off) | baseline f1–f5 | I2 RAM cao |
|---|---|---|---|---|
| CAP/lượt | **2,00** (4/2) | **0,50** (1/2) | 2,80 (14/5) | 2,00 (4/2) |
| CAP/tick | 4/242 = **0,0165** | 1/74 = **0,0135** | 14/700 = 0,0200 | 4/217 = 0,0184 |
| freeze-max trung vị (ms) | 5.064 | 2.306 | — | — |
| freeze-trong-đuôi-mở trung vị (ms) | 2.660 | 366 | 4.900 | 4.849 |
| freeze-ph-adv trung vị (ms) | 153 | 366 | 375 | 150 |
| rate trung vị | 0,145 | 0,430 | 0,110 | 0,130 |
| RAM đầu lượt trung vị (MB) | 1.802 | 1.848 | 1.917 | 2.622 |
| tổng ticks | 242 | 74 | 700 | 217 |

### 1.3 Verdict — KHÔNG KẾT LUẬN (inconclusive), hướng bằng chứng nghiêng về minh oan

Đối chiếu tiêu chí đăng ký trước (PREREG-J1 §4, từ G4 §4.2):

- Nhánh (b) "E4-off ≤ 0,5 CAP/lượt → E4 có đóng góp": quan sát **đúng
  0,50 — giá trị biên, không phải "~0" thực sự** (1 CAP đã xảy ra, và đó
  là CAP có tuổi dài nhất trong toàn bộ chuỗi F5/I2/J1: **5.337 ms**,
  vượt mọi CAP trước đây 5.004–5.302 ms). Nếu E4 là nguyên nhân (duy
  nhất) của CAP thì nhánh off phải cho ~0 CAP — thực tế không phải vậy.
- Nhánh (a) "chênh < 1,0 CAP/lượt + freeze-tail chênh < 10% → minh oan":
  chênh CAP/lượt = **1,50** (không đạt); freeze-tail chênh −86% (không đạt).
- **Lý do không lấy (b) theo mặt chữ — giả định exposure bị phá vỡ:**
  cả 2 lượt off đều dừng sớm ở wall ~11,4–11,5 s (39 + 35 = **74 ticks**)
  so với nhánh on (81 + 161 = **242 ticks**). CAP/lượt đếm sự kiện trên
  lượt có độ dài khác nhau 3,3× nên chênh 1,50 CAP/lượt chủ yếu phản ánh
  exposure, không phải tỉ lệ CAP. Chỉ số bù theo prereg — **CAP/tick —
  gần như phẳng: 0,0165 vs 0,0135 (−18%), Fisher exact 2 phía p = 1,0**
  (bảng [[4, 238], [1, 73]], tự tính — xem §2.4). Với cùng exposure 242
  ticks, nhánh off kỳ vọng ~3,3 CAP (0,0135 × 242) so với on 4 CAP —
  không phân biệt được.
- Tín hiệu duy nhất ủng hộ E4: freeze-max thấp hơn ở nhánh off
  (2.113/2.499 ms vs 5.114/5.014 ms). Nhưng (i) n = 2 mỗi nhánh; (ii)
  **không có đường cơ chế**: E4 chỉ bỏ 1 lần `renderFrame` (canvas),
  không chạm decoder hay `currentTime` của element — không giải thích
  được vì sao freeze của element lại ngắn đi; (iii) kiểm duyệt chỉ giải
  thích một phần: freeze 5.114 ms của j1on bắt đầu ở t = 8.082 ms —
  trong tầm sống ~11,4 s của các lượt off — nên các lượt off "đáng lẽ"
  vẫn có thể bắt được một freeze sớm như vậy mà không bắt được (mẫu
  đơn lẻ, không kết luận được); (iv) freeze của j2on (5.014 ms) ở
  t = 25.568 ms thì đúng là ngoài tầm sống của lượt off.
- **Verdict: KHÔNG KẾT LUẬN.** Không đủ bằng chứng để tuyên "E4 có đóng
  góp" (vi phạm giả định exposure + CAP/tick phẳng + CAP vẫn xảy ra khi
  E4 tắt), cũng chưa đủ để tuyên "E4 được minh oan" dứt khoát (CAP/lượt
  giảm −75% + freeze-max thấp hơn, n nhỏ). Hướng bằng chứng tổng thể
  **nghiêng về minh oan** (E4 không phải nguyên nhân chính của CAP).
  E4 vẫn là nghi phạm chưa loại dứt khoát. Bước tiếp theo: lặp lại A/B
  với nhiều lượt hơn + đếm theo exposure cố định (xem §8). **Không sửa
  production code dựa trên đợt này.**

## 2. Phương pháp

### 2.1 Prereg + cây đo

- PREREG viết trước lượt đầu: `hidden_files/round108-j1/PREREG-J1.md`
  (dải RAM, ma trận 2+2, tiêu chí hợp lệ, tiêu chí quyết định 3 nhánh).
- Cây đo: `preview.tsx` md5 `ced42efd785724c8c0d1b16fc32c7341`
  (mtime 2026-11-13T14:43:56.519Z), `playheadHold90R2.ts` `00cce1ac…`,
  `driftConfirmSkip103E4.ts` `2748b6f3…`. Probe `probe104f5.mjs` không sửa
  (`node --check` OK — probe dùng từ trước, không kiểm lại ở đợt này;
  md5 probe `8f0ca01f…`). Boot reboot #34 `cc460738…`, `uptime -s`
  2026-11-13 20:34:17Z, không đổi cả đợt (watcher `wait-j1.sh` poll 45 s,
  0 reboot).
- So sánh chính: j-on vs j-off trên CÙNG cây `ced42efd`, CÙNG dải RAM
  thấp. f1–f5 (2,80) chỉ là tham chiếu lịch sử (cây `ca378bbf`, khác
  comment-only).

### 2.2 Toggle E4 (1 dòng duy nhất, khôi phục ngay)

- Điểm gọi duy nhất của E4: `preview.tsx:5586`
  (`shouldSkipRenderWhileDriftConfirmPending` trong hàm trả cờ skip-render
  của tick). Toggle: chèn `false && ` trước điểm gọi — module E4 giữ
  nguyên, import giữ nguyên (không lỗi `noUnusedLocals`), việc ghi tập
  pending + đếm `driftConfirmSkipTicks103E4` giữ nguyên (bookkeeping).
- Toggle #1: 21:08:05Z, md5 `8cb3122352a7279078bd16d988d48b42`, diff đúng
  1 dòng (`toggle.diff`); toggle #2 (chạy lại j2off): 21:12:27Z, cùng md5
  `8cb31223…` (toggle xác định — cùng 1 dòng đổi cho cùng md5).
- Verify toggle TRƯỚC mỗi nhánh off: `grep -c "false && …"` = 1,
  `esbuild --loader:.tsx=tsx` parse OK, diff +/- đúng 2 dòng. Không chạy
  `tsc --noEmit` trên file đã toggle: `false &&` không thể gây lỗi kiểu,
  và tsc ~30–60 s sẽ kéo dài cửa sổ toggle; esbuild + vite của probe là
  kiểm chứng đủ cho thay đổi 1 dòng (ghi rõ lựa chọn này).
- Khôi phục: `cp` bản pristine (`preview.tsx.pristine.ced42efd`, copy
  20:45:59Z, md5 khớp) đè lại ngay sau nhánh off; xác minh md5 về đúng
  `ced42efd…` + diff rỗng. Khôi phục lần 1: 21:08:41Z (do sự cố §6.2);
  lần 2 (trap, cuối driver off): 21:09:36Z; lần 3 (off2): 21:13:01Z.
  **md5 cuối đợt = `ced42efd…`, diff rỗng — cây đã về nguyên trạng.**
- Giới hạn xác minh toggle đã biết (ghi sẵn trong prereg): probe104f5
  KHÔNG đọc `window.__vcut103e4DriftConfirmSkips` nên không có bằng chứng
  runtime trực tiếp trong probe-results.json rằng gate đã tắt trong trang
  chạy; bằng chứng là file trên đĩa đã toggle (grep + md5 + diff) +
  probe khởi động vite mới mỗi lượt (port tự chọn 5580–5589, đọc file từ
  đĩa lúc load trang) + esbuild parse OK. Không phóng đại hơn mức này.
- An toàn va chạm: chỉ toggle khi `ps` không còn driver `probe108*` nào
  (tiền kiểm trong sequence); cửa sổ toggle ~35 s mỗi lần (21:08:05–41,
  21:12:27–13:01). Watcher ghi `sibProcs=0` ở các check kẹp 2 cửa sổ
  (21:08:04, 21:11:50, 21:13:20) — không có bằng chứng sibling chạy trong
  cửa sổ toggle; kiểm chứng chéo vite-start-time của sibling thuộc về
  luồng verify J9.

### 2.3 Driver + analyzer

- Driver `run-j1.sh` (adapt từ `run-f5-hiram107.sh` của I2): RAM gate
  ĐẢO NGƯỢC — chạy khi RAM trong dải THẤP [1.450.000, 2.100.000] kB
  (ngoài dải → chờ 60 s × tối đa 5 lần rồi chạy-gắn-cờ `BAND=ngoài`);
  `EXPECTED_MD5` bắt buộc (sai là từ chối chạy — chống chạy nhầm cây);
  export `GST_PLUGIN_PATH` (bài học I3 đợt 107); md5 trước/sau mỗi lượt;
  copy kết quả về `round108-j1/` sau mỗi lượt; backup JSON tốt trước khi
  xóa để chạy lại (vá sau lần ENOSPC đầu — xem §6.1). `BRANCH=off2`
  (chạy lại 1 lượt j2off) thêm sau sự cố §6.2.
- Sequence toggle `run-off-sequence.sh`: toggle → verify → driver off →
  khôi phục (trap). Sau sự cố §6.2 đã vá: lock `OFF-SEQUENCE.lock` +
  trap chỉ restore khi chính sequence đó đã toggle + log append.
- Analyzer `analyze-j1-cap-pattern.py` (adapt từ I2, giữ nguyên logic
  CAP): CAP iff age ≥ 4.800 ms VÀ `rearms` không tăng ở tick ngay sau
  span; ENV join đọc `run-j1.log` (regex `lượt (j\w+) … BRANCH=(\w+) …
  RAM_kB=… load1=…`), chuẩn hoá `off2 → off`.

### 2.4 Kiểm chứng độc lập (không qua analyzer)

- Analyzer kiểm chứng TRƯỚC live trên dữ liệu I2 (f8r/f9 đổi phase):
  CAP 1 [5087] / 3 [5023, 5201, 5255], RAM/load1/branch khớp 100%.
- Kiểm tay CAP j2off (chạy lại): span ended=4474, tick cuối t=9811,
  age=5337, rearms 0→0 (không tăng) → CAP ✓. Khớp analyzer.
- Fisher exact 2 phía cho CAP/tick (tự tính bằng Python, liệt kê đầy đủ
  bảng [[4, 238], [1, 73]] với biên cố định): **p = 1,0** — không có khác
  biệt đáng kể về tỉ lệ CAP/tick giữa 2 nhánh.
- Freeze timing (tự tính từ `velocityTicks` thô): j1on max-freeze 5.114 ms
  trong [8.082, 13.196]; j2on 5.014 ms trong [25.568, 30.582]; j1off
  2.113 ms trong [303, 2.416]; j2off 2.499 ms trong [994, 3.493].
  (Dùng cho §1.3 mục (iii).)
- Baseline f1–f5 tính lại từ `round104-f5/cap-pattern-rows.json` (I2 đã
  tính: 14 CAP/5 lượt = 2,80; CAP/tick 14/700 = 0,0200) — không lấy số
  từ trí nhớ.

## 3. Chi tiết từng lượt hợp lệ

### 3.1 j1on — HỢP LỆ (E4-bật, gop250, CAP 0)

- 21:02:12–21:02:57Z, RAM đầu 1.978.800 kB (trong dải), load1 0,98.
  md5/mtime không đổi, exit 0. 81 velocityTicks, 2 tails, **CAP 0**.
  Dừng sớm (stopped=true, wall 23.861 ms) — playhead đóng băng ≥2,5 s
  trong lúc seeking (như f8r). rate 0,189; frzMax 5.114 ms (trong
  [8.082, 13.196]); gap max/med 827/298,5 ms. Verdict probe PASS/PASS
  (seekDone 1907 ms, ph 0,5; canvas change 2315 ms, ph 0,5).
  RAM lúc tải-nền-bật 1.279 MB (xem §5).

### 3.2 j2on — HỢP LỆ (E4-bật, gop30, CAP 4)

- 21:02:59–21:04:07Z, RAM đầu 1.713.224 kB (trong dải), load1 đầu 4,85
  (cao — tải nền từ luồng khác; không gate load theo prereg). md5/mtime
  không đổi, exit 0. 161 ticks, 4 tails, **CAP 4 [5025, 5165, 5302, 5123]**.
  Chạy đủ 44.287 ms (stopped=false). rate 0,102; frzMax = frzTail =
  5.014 ms (trong [25.568, 30.582]); gap max/med 814/223,5 ms. Verdict
  PASS/PASS (seekDone 1387 ms, ph 0,5; canvas change 1713 ms, ph 0,5).
  RAM lúc tải-nền-bật 1.678 MB.

### 3.3 j1off — HỢP LỆ (E4-tắt, gop250, CAP 0)

- 21:08:06–21:08:37Z, RAM đầu 2.071.488 kB (trong dải), load1 0,72.
  md5-trước/sau = `8cb31223…` (file đã toggle), mtime không đổi, exit 0.
  39 ticks, 3 tails, **CAP 0**. Dừng rất sớm (stopped=true, wall
  11.493 ms). rate 0,397; frzMax 2.113 ms (trong [303, 2.416]);
  gap max/med 575/310,0 ms. Verdict PASS/PASS. RAM lúc tải-nền-bật
  1.203 MB. (Lượt này xong TRƯỚC sự cố restore 21:08:41Z nên không bị
  nhiễm — xem §6.2.)

### 3.4 j2off — HỢP LỆ (E4-tắt, gop30, CAP 1 — CHẠY LẠI sau khi lượt đầu bị loại)

- Lượt đầu (21:08:39Z) BỊ LOẠI: file bị restore giữa lượt (xem §6.2) —
  mtime-đổi=CÓ, md5-đổi=CÓ; CAP 2 [5106, 5118] của nó KHÔNG dùng
  (JSON nhiễm lưu tên `.INVALID-mtime-doi-210841`).
- Lượt chạy lại: 21:12:27–21:12:59Z, RAM đầu 1.713.520 kB (trong dải),
  load1 1,87. md5-trước/sau = `8cb31223…`, mtime không đổi, exit 0.
  35 ticks, 1 tail, **CAP 1 [5337]** (ended=4474, t=9811, drift 0,07,
  ct 5,8333, ph 5,7667 — CAP muộn trong lượt, tuổi dài nhất chuỗi).
  Dừng sớm (stopped=true, wall 11.376 ms). rate 0,463; frzMax 2.499 ms
  (trong [994, 3.493]); gap max/med 687/375,5 ms. Verdict PASS/PASS.
  RAM lúc tải-nền-bật 1.305 MB.

## 4. So sánh với baseline f1–f5 và I2

| lượt | gop | nhánh | RAM đầu (MB) | load1 | n_vt | CAP | ages (ms) | rate | frzTail |
|---|---|---|---|---|---|---|---|---|---|
| f1 | 30 | on (ca378bbf) | 2012 | 8,40 | 78 | 2 | 5004, 5271 | 0,241 | 4802 |
| f2 | 30 | on | 1882 | 9,98 | 139 | 3 | 5113, 5220, 5183 | 0,108 | 4918 |
| f3 | 30 | on | 2015 | 3,45 | 116 | 2 | 5169, 5073 | 0,110 | 4900 |
| f4 | 250 | on | 1464 | 1,16 | 194 | 4 | 5214, 5103, 5093, 5096 | 0,105 | 5012 |
| f5 | 250 | on | 1917 | 0,62 | 173 | 3 | 5018, 5170, 5113 | 0,127 | 4900 |
| f8r | 250 | on, RAM cao | 2873 | 3,11 | 99 | 1 | 5087 | 0,156 | 4730 |
| f9 | 30 | on, RAM cao | 2371 | 6,33 | 118 | 3 | 5023, 5201, 5255 | 0,103 | 4968 |
| **j1on** | 250 | **on** | **1932** | 0,98 | 81 | **0** | — | 0,189 | **306** |
| **j2on** | 30 | **on** | **1673** | 4,85 | 161 | **4** | 5025–5302 | 0,102 | **5014** |
| **j1off** | 250 | **off** | **2022** | 0,72 | 39 | **0** | — | 0,397 | **313** |
| **j2off** | 30 | **off** | **1673** | 1,87 | 35 | **1** | 5337 | 0,463 | **420** |

- Nhánh on J1 (2,00 CAP/lượt) tái hiện đúng hướng baseline (2,80) và I2
  (2,00): CAP vẫn xuất hiện đều ở dải RAM thấp trên cây `ced42efd`.
- frzTail trung vị J1-on (2.660 ms) thấp hẳn baseline (4.900 ms) — nhưng
  đó là trung vị của [306, 5014]: j1on dừng sớm nên freeze dài (5.114 ms)
  rơi ngoài đuôi mở. **frzTail trung vị với n = 2 và lượt dừng sớm là
  chỉ số không ổn định** — phải đọc theo từng lượt (§3) + frzMax, không
  đọc trung vị đơn thuần. (I2 ổn định vì cả 2 lượt đều có frzTail
  ~4,7–5,0 s.)
- Tuổi CAP: j2off 5.337 ms là tuổi CAP dài nhất trong toàn bộ 11 lượt
  f1–f5/f8r/f9/j1on/j2on/j1off/j2off (dải cũ 5.004–5.302 ms) — CAP vẫn xảy
  ra khi E4 tắt, với tuổi còn dài hơn.

## 5. Decay RAM trong lúc đo (mẫu I2 §5, lặp lại ở J1)

| lượt | RAM đầu lượt (MB) | RAM lúc tải-nền-bật (MB) | chênh |
|---|---|---|---|
| j1on | 1932 | 1279 | −653 |
| j2on | 1673 | 1678 | +5 |
| j1off | 2022 | 1203 | −819 |
| j2off | 1673 | 1305 | −368 |

- RAM lúc tải-nền-bật: on trung vị 1.478 MB, off trung vị 1.254 MB;
  baseline f1–f5 trung vị 1.189 MB; I2 1.182 MB. Tất cả cùng dải
  ~1,0–1,7 GB — stack khởi động ăn ~0,4–0,8 GB ở cả 2 nhánh (ít hơn I2
  vì lượt J1 chạy lúc máy yên hơn). **Decay ảnh hưởng cả 2 nhánh như nhau
  nên A/B E4 vẫn sạch** (đúng dự kiến prereg §5); so sánh RAM đầu lượt
  (1.802 vs 1.848 MB trung vị) cũng rất sát nhau.

## 6. Sự cố trong đợt (ghi đầy đủ, không giấu)

### 6.1 Lần 1 nhánh on thất bại do ENOSPC (20:46–20:48Z)

- j1on + j2on lần 1 đều exit=2, không có probe-results.json. Nguyên nhân:
  vite crash `ENOSPC: System limit for number of file watchers reached`
  (`max_user_watches=63747`; bằng chứng trong `enospc-fail-on-1/`:
  4 file vite-attempt log đều chứa ENOSPC). j2on attempt 1+2 chết ENOSPC,
  attempt 3 lên được rồi chết sau đó (`page.goto: Connection refused`).
  Đây là nghẽn hạ tầng đã biết (I5 đợt 107: 5/6 lượt chết y hệt), không
  phải lỗi cây đo (md5 `ced42efd` không đổi cả 2 lượt).
- Xử lý theo brief (chờ rồi retry, không hammer): waiter `wait-quiet-j1.sh`
  (poll 5 s) chờ cửa vite=0 + RAM trong dải; cửa mở 21:02:12Z
  (vite=0, RAM 1.980.804 kB, load1 0,98) → nhánh on lần 2 chạy đủ 2/2
  lượt hợp lệ. Suýt bắt hụt 1 cửa lúc 20:53:54Z (vite=0 nhưng RAM
  2.230.900 — chỉ trên dải 2.100.000; J5 khởi động vite lại 20:54:04Z).
- Trong lúc chờ, driver được vá: backup JSON tốt trước khi xóa để chạy
  lại (retry thất bại không xóa mất dữ liệu tốt).

### 6.2 Sự cố 2 sequence off chạy đồng thời — j2off lần 1 NHIỄM (lỗi của J1)

- Diễn biến: waiter-off cũ (PID 20637) trigger ~21:08:0x → chuỗi off #1
  toggle 21:08:05Z (md5 `8cb31223…`), j1off 21:08:06Z HỢP LỆ, j2off
  21:08:39Z đang chạy. J1 kill waiter cũ trong lúc nó đã spawn chuỗi off
  — `kill` chỉ giết vỏ waiter, chuỗi con (`run-off-sequence.sh`) vẫn chạy
  tiếp (orphan). Waiter-off mới (PID 21014) trigger 21:08:41Z → chuỗi off
  #2 thấy md5 đã toggle → abort + trap restore pristine 21:08:41Z —
  NGAY GIỮA lượt j2off → j2off mtime-đổi=CÓ + md5-đổi=CÓ → **LOẠI**
  (CAP 2 [5106, 5118] của nó KHÔNG dùng; JSON nhiễm lưu tên
  `.INVALID-mtime-doi-210841`).
- Ảnh hưởng giới hạn: j1off vẫn HỢP LỆ (xong 21:08:37Z, trước restore
  21:08:41Z; mtimeBefore==mtimeAfter). Cây đã về pristine md5 `ced42efd…`
  (restore 21:08:41Z + 21:09:36Z, diff rỗng). Không sibling nào bị ảnh
  hưởng (21:08:41Z sibDrv=0, vite=0; cửa sổ toggle #1 21:08:05–41 không có
  bằng chứng sibling chạy — xem §2.2).
- Nguyên nhân gốc: (a) kill waiter không giết được chuỗi con; (b) sequence
  v1 truncate log (log chuỗi #1 bị chuỗi #2 ghi đè — chỉ còn lại trong
  `run-j1.log` + `toggle.diff`/`toggle-md5.txt`); (c) trap restore vô điều
  kiện — sequence #2 restore cây của sequence #1 giữa lượt.
- Đã vá trước khi chạy lại: lock `OFF-SEQUENCE.lock` + trap chỉ restore
  khi chính sequence đó đã toggle + log append (không truncate) + waiter
  kiểm tra lock/process trước khi trigger + driver thêm `BRANCH=off2`.
  Chạy lại j2off (21:12:27Z) sạch hoàn toàn (§3.4). Bài học: không bao giờ
  `kill` waiter mà chưa kiểm `pgrep` chuỗi con; dùng file STOP thay cho
  kill khi có thể.

## 7. Giới hạn — những gì KHÔNG làm được

1. **n = 2 mỗi nhánh** — mẫu nhỏ; CAP/lượt 2,00 vs 0,50 và frzMax
   5,1/5,0 vs 2,1/2,5 đều có thể dao động lấy mẫu. Fisher CAP/tick
   p = 1,0 củng cố "không kết luận" chứ không củng cố "minh oan".
2. **Kiểm duyệt dừng sớm không cân bằng:** cả 2 lượt off dừng ở ~11,4 s
   (74 ticks) vs on 23,9/44,3 s (242 ticks). CAP/lượt và frzTail trung vị
   đều nhiễm kiểm duyệt này; CAP/tick là chỉ số bù nhưng n vẫn nhỏ.
3. Toggle xác minh ở mức file trên đĩa + esbuild (xem §2.2) — không có
   bằng chứng runtime trực tiếp rằng gate đã tắt trong trang chạy.
4. So sánh chéo cây: J1-on trên cây `ced42efd`, baseline f1–f5 trên cây
   `ca378bbf` (khác comment-only) — nhưng so sánh CHÍNH j-on vs j-off
   là cùng cây nên không ảnh hưởng verdict.
5. j2on load1 đầu lượt 4,85 (cao); j1off/j2off wall ngắn (~11 s). Cả 2
   đều ghi rõ ở §3.
6. Không làm 3+3 mở rộng (hủy sau sự cố §6 — hết ngân sách thời gian sau
   ENOSPC + double-sequence); không sửa production; không đụng
   TTS/birefnet/workflows/cloud.
7. Reboot #35 chưa xảy ra lúc kết thúc đợt (21:13:01Z) — boot #34 ổn định
   38 phút. Số thứ tự reboot sau #34 để mở.

## 8. Nợ mở / kế hoạch đợt sau

1. **Lặp lại A/B tắt E4 với nhiều lượt hơn (mục tiêu 4+4)** — bước tiếp
   theo bắt buộc trước khi kết luận E4. Thay đổi phương pháp: lấy
   **CAP/tick làm chỉ số chính** (hoặc chỉ tính CAP trong cửa sổ exposure
   cố định, vd 40 ticks đầu / 15 s đầu của mỗi lượt) để triệt kiểm duyệt
   dừng sớm; ghi wall/n_vt bắt buộc kèm mọi CAP/lượt. Nếu 4+4 vẫn cho
   CAP/tick phẳng + CAP xảy ra khi E4 tắt → E4 được minh oan; nếu
   CAP/tick off về ~0 → E4 có đóng góp.
2. E4 vẫn là nghi phạm chưa loại dứt khoát — **không sửa production code
   liên quan E4** cho đến khi A/B lặp lại cho kết quả rõ.
3. Giả thuyết cửa sổ ~5 s (freeze-tail bất biến, CAP ages cụm 5.004–
   5.337 ms): vẫn mở — kiểm tra tail age ở các mức tải khác nhau chỉ khi
   A/B lặp lại cũng không giải thích được CAP.
4. ENOSPC (`max_user_watches=63747`) vẫn là nghẽn hạ tầng cho mọi probe
   vite song song — cân nhắc tăng ở cấp hệ thống (ngoài phạm vi luồng đo).
5. G1 vẫn mở, chờ user quyết metric (nợ đợt 105/107) — không thuộc J1.
6. ci-security.yml vẫn 403 chờ user; TTS 39 CẤM kiểm lại; birefnet 0 lần
   thành công (RAM < ngưỡng 6 GB).

## 9. File / stage

- LIMITS này: `docs/PHASE9_ROUND108_J1_REARM_LIMITS.md`
- Prereg: `hidden_files/round108-j1/PREREG-J1.md` (viết trước lượt đầu,
  không sửa sau khi chạy).
- Dữ liệu đợt này: `hidden_files/round108-j1/` (watcher log `wait-j1.out`,
  quiet-wait logs, run log `run-j1.log`, probe log/JSON bản copy 4 lượt
  hợp lệ, `cap-pattern-rows.json`, driver `run-j1.sh`, sequence
  `run-off-sequence.sh`, waiters, analyzer `analyze-j1-cap-pattern.py`,
  `toggle.diff` + `toggle-md5.txt` (md5 `8cb31223…`),
  `preview.tsx.pristine.ced42efd`, `enospc-fail-on-1/`, bản JSON nhiễm
  j2off `.INVALID-mtime-doi-210841`, `round108-j1-status.md`) — ngoài
  repo, không stage qua paths-loop; bản copy probe JSON khớp md5 với gốc
  tại `hidden_files/round104-f5/probe-webkit-load4-gop250-j1on|j1off/` và
  `probe-webkit-load4-gop30-j2on|j2off/` (bản j2off hiện tại là lượt chạy
  lại 21:12:27Z; bản nhiễm giữ trong `.bak` + `.INVALID`).
- Batch stage (KHÔNG push): `repo-1-push/paths-loop/phase9-round108-j1-rearm.txt`
  — LIMITS-only (theo mẫu H1/I2: driver/watcher/data nằm ngoài repo nên
  không đưa vào paths-loop), NUL-delimited, đã verify read-back.
