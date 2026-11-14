# PHASE9_ROUND109_K2_2MIB_LIMITS.md — K2: ĐIỀU KIỆN CẦN của bogus + H2C8 + chặn set-lại ring (8 MiB)

> Luồng K2, Phase 9 đợt 109 (VCut Studio). Chạy: 2026-11-13 23:47Z –
> 2026-11-14 00:33Z (14/11 06:47–07:33 +07). Boot `22:53:56Z` (reboot
> #36) suốt lượt, KHÔNG reboot trong lúc đo. Repo local `~/workspace/repo-1`.
> **KHÔNG push, KHÔNG release/tag.** Chỉ stage, user tự push sau từ main chat.
> ĐO LƯỜNG thuần túy — KHÔNG sửa file production nào; `preview.tsx` md5
> `ced42efd785724c8c0d1b16fc32c7341` (đầu = cuối lượt, khớp đợt 107/108).
> Môi trường: VM 2vCPU/8GB, GStreamer hệ thống 1.24.2 (Ubuntu), Playwright
> webkit-2388, clip c2 `~/workspace/round96-x1/clips-faststart/c2.mp4`
> (2.139.973 B) + c8 cùng thư mục (8.182.985 B). **Cấm:** TTS 39, birefnet,
> `.github/workflows/*`. Prereg: `hidden_files/round109-k2/prereg-k2.md`
> (viết TRƯỚC khi chạy, ngân sách 16 run hợp lệ — đã dùng 15/16).

## Kết luận chính (TL;DR)

1. **Error-event (page-level) KHÔNG phải điều kiện cần của bogus — ĐÃ BÁC
   BỎ.** Nhóm E run2 (fresh-element): bogus 2 spliced pulls +2.097.152
   mà KHÔNG có error-event nào, ở lại blob, playOk=true. Theo tiêu chí
   prereg (≥1 run bogus khi X tắt → X không phải điều kiện cần), verdict
   này kết luận được ngay với n=1 phản-ví-dụ.
2. **Restart pipeline nội bộ KHÔNG phải nguyên nhân đứng trước splice —
   nó là HẬU QUẢ + bộ khuếch đại.** Restart (instance qtdemux1+) có mặt
   trong MỌI run bogus và vắng mặt trong MỌI run sạch (gộp J2+K2), nhưng
   thứ tự trong-log cho thấy splice TRƯỚC restart ở mọi run kiểm được
   (J2 blobF 2/2 + K2 A run3: splice đầu → ACLEAR → pull đầu qtdemux1;
   GST-clock: typefind caps → qtdemux lỗi "atom has bogus size" →
   webkitwebsrc reset). Restart không thể gây ra cái xảy ra trước nó.
   Instance thứ hai có thể splice lại (thêm pull sai), nên restart khuếch
   đại bogus chứ không khởi phát nó.
3. **File KHÔNG phải điều kiện cần, cũng KHÔNG đủ.** Bogus xảy ra với Blob
   thường trên đường prod (nhóm D/E 4/4, blob do pool tạo bằng
   `new Blob`, `media.ts:385,389`) — nên File không cần thiết. Blob-file
   + ring lớn thì sạch (nhóm C/G 0/4) — nên File không đủ. File nhiều
   khả năng chỉ là nhiễu thời gian (race preload ↔ swap), không phải
   nguyên nhân ngữ nghĩa.
4. **Tắt wrap bằng ring lớn thì đồng thời tắt cả splice lẫn error/restart
   (nhóm C, phép thử quyết định):** blob-file ring 4 MiB → 0 splice,
   0 error, 1 instance, playOk=true trong 2/2 run K2 (gộp J2: 3/3). Đây
   là can thiệp trực tiếp ủng hộ chuỗi nhân quả: wrap → splice →
   qtdemux lỗi → restart → (có thể) error-event + fallback http.
5. **H2C8 — offset splice trên c8 CỐ ĐỊNH +2.097.152 như c2 (đã chạy, có
   caveat):** c8 blob-file run3 có 2 spliced pulls req_off=0, delta đúng
   +2.097.152. Nhưng run này MỎNG (88 PULL < ngưỡng 100 của prereg,
   2 frames, finalCt 0,083 s, RAM khả dụng 865 MB) — offset đọc trực
   tiếp từ byte nên chắc chắn, nhưng tỉ lệ bogus trên c8 thì chưa đo
   được chắc (run2 sạch, run1 vô hiệu).
6. **Chặn set-lại ring GIỮ ĐƯỢC mức ở giá trị mới 8 MiB (nhiệm vụ 4):**
   J2Q2 readback 8388608 OK + J2Q2SET override 2097152→8388608 cả 2 run;
   DOT 4 file PLAYING/READY đều có queue2-0 ring-buffer-max-size=
   8388608; 0 splice cả 2 run. Gộp nhóm C: ring > file → 0 splice
   trong 5/5 run (J2 4 MiB ×1 + K2 4 MiB ×2 + 8 MiB ×2). Đây là hướng
   mitigation ở tầng probe/shim — CHƯA phải sửa production (cần đổi
   buffer-size của playbin/urisourcebin phía WebKit, không phải code repo).
7. **Mitigation "teardown sạch trước swap" BỊ BÁC:** reset-swap (đường
   prod, removeAttribute+load() trước khi gán blob) vẫn bogus 2/2, cùng
   chữ ký 6 spliced pulls + error + fallback http. Teardown không ngăn
   được splice.
8. **Dự đoán offset +4.194.304 trên c8 CHƯA kiểm chứng được (nhóm H):**
   c8 ring 4 MiB → 0 splice (162 PULL, 160 EXACT). Không phải bác bỏ cơ
   chế — giải thích phù hợp dữ liệu: splice chỉ xảy ra khi writer vượt
   reader hơn một vòng ring; lag reader trong các run c8 này chỉ ~2–3 MB
   (đủ vượt ring 2 MiB, không đủ vượt ring 4 MiB). Cần run tạo lag
   > 4 MiB mới kiểm chứng được dự đoán offset (nợ mở).

## 1. Prereg và tuân thủ

- Prereg viết trước mọi probe (`hidden_files/round109-k2/prereg-k2.md`):
  8 nhóm A–H, ngân sách cứng 16 run hợp lệ/mỏng; tiêu chí "điều kiện
  cần" đăng ký trước (≥1 bogus khi X tắt → bác bỏ X; 0/2 khi X tắt chỉ
  là "phù hợp", không phải chứng minh).
- Thực hiện: 15/16 run hợp lệ/mỏng (A r3–4, B r1–2, C r5–6, D r1–2,
  E r1–2, F r2–r3, G r7–8, H r4) + 3 run VÔ HIỆU không tính (A r1–2,
  F r1 — stall 0 frames dưới tải 31–44, xem §6). Tổng 18 case trong JSON.
- Chênh lệch với prereg (ghi rõ): "run hợp lệ" lấy theo thực hành J2
  (frames > 0 + GST > 0 byte + PULL ≥ 100) thay vì playOk=true theo chữ
  prereg — vì playOk=false ở các run blob-file chỉ là `play()` bị reject
  bởi error-event rồi fallback vẫn phát tới cuối (88–187 frames, 400+
  PULL), pipeline đã chạy đầy đủ. Ngoại lệ duy nhất: F run3 chỉ 88 PULL
  (< 100) nhưng chứa bằng chứng splice trực tiếp — tính là run "mỏng",
  verdict H2C8 kèm caveat, không giấu.
- Runner K2 = copy runner J2 (port 8937, Xvfb :196, OUT
  `benchmarks/results/webkit-blob-flaky-109k2-2mib.json`, round
  `phase9-round109-k2-2mib`); shim = copy `j2_queue2_probe.so` của J2
  (md5 `e46dc0e42a8a35da880bf49a2df6d9c8`, khớp J2 — KHÔNG viết shim mới).
  `GST_PLUGIN_PATH` export trong mọi lệnh probe. `round-in-progress.md`
  không tồn tại lúc chạy → không bị chốt chặn.

## 2. Bảng quyết định (mọi con số offset từ `k2_offsets.py`, đọc trực tiếp từ clip)

| Nhóm | Cấu hình | Run | Bogus (spliced pulls) | Error-event | Instances | Frames / finalCt | Verdict |
|---|---|---|---|---|---|---|---|
| A | blob-file c2, ring mặc định (baseline) | r3 | YES (6, +2.097.152) | 1 (t=1,4 s, src http) | 3 (qtdemux0/1/2) | 88 / 7,79 s | Tái hiện chữ ký J2 |
| A | blob-file c2, ring mặc định | r4 | NO (0, 396 EXACT) | 0 | 1 | 139 / 8 s | Run sạch, không restart |
| B | blob-direct c2, ring mặc định (control) | r1 | NO (0, 396 EXACT) | 0 | 1 | 168 / 8 s | — |
| B | blob-direct c2, ring mặc định | r2 | NO (0, 396 EXACT) | 0 | 1 | 183 / 8 s | — |
| C | blob-file c2, ring 4 MiB | r5 | NO (0, 396 EXACT) | 0 | 1 | 68 / 8 s | Tắt wrap → tắt cả splice + error + restart |
| C | blob-file c2, ring 4 MiB | r6 | NO (0, 396 EXACT) | 0 | 1 | 133 / 8 s | Như trên |
| D | reset-swap c2, ring mặc định | r1 | YES (6, +2.097.152) | 1 (t=1,41 s) | 3 | 126 / 8 s | Teardown không ngăn bogus |
| D | reset-swap c2, ring mặc định | r2 | YES (6, +2.097.152) | 1 (t=1,88 s) | 3 | 85 / 7,5 s | Như trên |
| E | fresh-element c2, ring mặc định | r1 | YES (6, +2.097.152) | 1 (t=0,6 s) | 3 | 187 / 8 s | Bogus + error + fallback |
| E | fresh-element c2, ring mặc định | r2 | YES (2, +2.097.152) | **0** | 2 | 60 / 7,58 s | **Bogus KHÔNG error — bác bỏ error là điều kiện cần** |
| F | H2C8: c8 blob-file, ring mặc định | r2 | NO (0, 156 EXACT) | 0 | 1* | 10 / 2,17 s | Run mỏng (decode c8 chậm) |
| F | H2C8: c8 blob-file, ring mặc định | r3 | YES (2, +2.097.152) | 0 | 1* | 2 / 0,08 s | Run mỏng (88 PULL) — offset chắc chắn, tỉ lệ chưa |
| G | blob-file c2, ring 8 MiB | r7 | NO (0, 378 EXACT) | 0 | 1 | 80 / 6,83 s | Giữ mức 8388608 (DOT + J2Q2SET) |
| G | blob-file c2, ring 8 MiB | r8 | NO (0, 396 EXACT) | 0 | 1 | 120 / 8 s | Như trên |
| H | c8 blob-file, ring 4 MiB | r4 | NO (0, 160 EXACT) | 0 | 1 | 12 / 2,04 s | 0 splice — dự đoán +4.194.304 chưa kiểm chứng được |

\* F r2/r3: số instance suy từ pull log (chỉ qtdemux0 + typefind trong
162/88 PULL); run mỏng nên "1 instance" là quan sát trong cửa sổ đo,
không phải khẳng định pipeline không restart sau đó.

- Tỉ lệ gộp với J2 (chỉ run hợp lệ/mỏng): blob-file c2 ring mặc định
  3/4 (J2 2/2 + K2 1/2); blob-direct c2 0/10 (J2 0/8 + K2 0/2);
  blob-file c2 ring 4 MiB 0/3 (J2 0/1 + K2 0/2); ring 8 MiB 0/2;
  reset-swap 2/2; fresh-element 2/2; c8 blob-file ring mặc định 1/2
  (run mỏng); c8 ring 4 MiB 0/1.
- Mẫu chữ ký splice lặp lại: gần như mọi run bogus đều có 6 spliced
  pulls (typefind ×3 + qtdemux ×3) ở req_off 0/3179/41666 (biến thể:
  E r1 req_off 32 thay cho 3179; E r2 chỉ 2 pulls ở req_off 0; F r3
  chỉ 2 pulls ở req_off 0). Offset luôn đúng +2.097.152 khi ring mặc
  định — không pull nào lệch.

## 3. Thứ tự trong-log: splice trước restart (bằng chứng cho H-alt)

- K2 A run3 (đồng hồ shim duy nhất): splice đầu ms=2105 → pull đầu
  qtdemux1 ms=2201. J2 blobF: run1 splice 693 → ACLEAR 695 → qtdemux1
  744; run2 splice 838 → ACLEAR 839 → qtdemux1 1190.
- GST-clock (J2 run1): typefind caps 0,099 s → caps lần 2 + qtdemux0
  lỗi "atom has bogus size 541230788" cùng 0,157 s → webkitwebsrc reset
  0,160 s. (541230788 = 0x204286c4 — đúng 4 byte đầu của nội dung splice
  ở req_off=0, khớp hex pull `204286c4…`.)
- E run2 (GST-clock): qtdemux0 lỗi "atom has bogus size 541230788"
  lúc 0,211 s, qtdemux1 sau đó sạch 198 EXACT, KHÔNG có error-event
  page-level — pipeline tự hồi phục nội bộ mà không trồi lỗi lên element.
- Kết luận từ thứ tự: splice là sự kiện đầu tiên trong chuỗi; qtdemux
  lỗi, restart, error-event page-level, fallback http đều xảy ra SAU.
  Error-event và restart là hậu quả/khuếch đại, không phải nguyên nhân.

## 4. Chặn set-lại ring ở mức mới 8 MiB (nhiệm vụ 4) — GIỮ ĐƯỢC

- J2Q2 readback lúc tạo: `set max-size-bytes=8388608 readback=8388608
  ring-buffer-max-size=8388608 rb-readback=8388608 OK` (cả 2 run G).
- J2Q2SET override sau tạo: `prop=ring-buffer-max-size orig=2097152
  new=8388608 OVERRIDE-env` (cả 2 run G; tương tự C: override về
  4194304 cả 2 run; H: override về 4194304, DOT xác nhận).
- DOT: 4 file PLAYING/READY trong cửa sổ G đều có queue2-0
  `ring-buffer-max-size=8388608`. (File NULL_READY chưa có queue2 —
  đúng vì pipeline chưa dựng; mục 2097152 còn lại trong file là property
  RIÊNG của `urisourcebin0`, không phải của queue2-0 — đã xác minh bằng
  tên node, như nhóm C.)
- Shim J2 (không sửa) giữ mức ở giá trị CHƯA TỪNG đo (8 MiB) — xác nhận
  cơ chế chặn `g_object_set` hoạt động tổng quát, không phải chỉ đúng
  với 1/4 MiB. Hướng mitigation "ring > file" đo được 0 splice 5/5 run
  gộp (J2 + K2), nhưng là kết quả tầng probe/shim — muốn thành sửa
  production phải đổi `buffer-size` của playbin/urisourcebin phía
  WebKit, không phải code repo; chưa làm, không claim.

## 5. Mitigation đã thử / đã loại (bổ sung J2 §5)

- **Reset-swap (teardown trước swap) — BỊ BÁC:** bogus 2/2 trên đường
  prod (nhóm D). Teardown không ngăn được splice.
- **Ring > file (qua shim) — HIỆU QUẢ Ở TẦNG PROBE:** 4 MiB 0/3 + 8 MiB
  0/2 (gộp J2+K2, toàn bộ blob-file). Chưa phải sửa production.
- **".mp4 cho blob URL" — đã bị loại ở J2** (đo + đọc code), không làm lại.
- **Fresh-element — CHƯA KẾT LUẬN:** nhóm E 2/2 run vẫn có spliced pull,
  nhưng pull log gộp mọi pipeline trong WebProcess, không gán được pull
  cho từng `<video>`; DOT cho thấy nhiều playbin/run (player-0/1/2, có
  file `_error.dot` của player-1 + `_PAUSED_PLAYING` của player-2 lúc
  00:06Z) — splice có thể thuộc pipeline của element cũ đã drop, không
  chắc thuộc element mới. E chỉ kết luận chắc về error-event (§2), không
  kết luận về fresh-element.

## 6. Caveat bắt buộc + vận hành

1. **n nhỏ:** mỗi cấu hình chỉ 2 run (H2C8: 2 run hợp lệ/mỏng). 0/2 chỉ
   là "phù hợp", không phải chứng minh — trừ các verdict bác-bỏ bằng
   phản-ví-dụ (E r2 bác error là điều kiện cần; C bác File là đủ).
2. **Đồng hồ khác nhau:** page-clock (error-event t) vs shim-clock
   (splice ms) vs GST-clock (qtdemux lỗi) có gốc khác nhau, KHÔNG so
   trực tiếp được. Mọi kết luận thứ tự chỉ dùng thứ tự TRONG cùng một log.
3. **Tải máy nhiễu mạnh:** 31 hog `python3 -c while True: pass` của
   luồng khác (bắt đầu 23:47Z và 00:06Z, theo đợt) đẩy load1 lên 31–44;
   3 run vô hiệu do stall (A r1–2: GST 58/51 KB, 2/32 PULL; F r1: GST
   47 KB, 0 frames). Các lượt hợp lệ đều chạy trong cửa yên (load1
   0,6–9,8) sau khi chờ; mọi lần chờ đều ghi trong `k2-progress.md`.
   Vite của luồng khác (port 5590, config `/tmp/round96-x5/…`) xuất hiện
   lúc 00:0xZ — runner K2 không dùng vite (http server + esbuild riêng,
   port 8937) nên không đua watcher; ENOSPC không xảy ra.
4. **Run c8 mỏng:** decode c8 8 MB chậm trên VM này (10 frames/2,17 s ở
   r2; 2 frames/0,08 s ở r3; 12 frames/2,04 s ở H r4), RAM khả dụng lúc
   chạy 773–1589 MB. H2C8 và H đều bị giới hạn bởi độ mỏng này — tỉ lệ
   bogus trên c8 và dự đoán offset +4.194.304 đều chưa đo chắc.
5. **Cơ chế "writer vượt reader hơn một vòng ring" là GIẢ THUYẾT** giải
   thích dữ liệu (offset = đúng ring size; ring càng lớn càng khó splice;
   H r4 0 splice dù APUSH tổng ~20 MB), chưa đo trực tiếp lag
   push/take tại thời điểm splice. Đừng trích dẫn như kết luận đã chứng
   minh.
6. **Tách riêng `max-size-bytes` vs `ring-buffer-max-size` CHƯA LÀM**
   (nợ J2 §7 mục 2): shim K2 đặt cả hai cùng mức trong mọi run đổi ring.
   Verdict nhân quả vẫn đứng trên cơ chế vòng tròn + offset bám theo
   ring, như J2 đã ghi.
7. Không sửa production, không push. Runner K2 + script offset là code
   probe-only; bundle probe-only build từ source production không đổi
   (`preview.tsx` md5 giữ nguyên). Xvfb :196 đã tắt sau lượt cuối.

## 7. Nợ mở cho đợt sau

1. **Offset +4.194.304 trên c8:** cần run tạo lag reader > 4 MiB (tải
   nặng hơn trong lúc chạy c8, hoặc wall dài hơn để pipeline re-pull
   sau khi flood) — H r4 chưa tạo được điều kiện này.
2. **Tách riêng max-size-bytes vs ring-buffer-max-size** (nợ J2 §7.2):
   shim đã hỗ trợ từng property riêng (sửa env thành 2 biến), chỉ cần run.
3. **Fresh-element attribution:** cần gán pull cho từng playbin (đối
   chiếu địa chỉ element giữa GST log và DOT, hoặc tách pull log theo
   pipeline) mới kết luận được element mới có tránh được bogus không.
4. **Tỉ lệ bogus trên c8:** cần run c8 với wall dài hơn / RAM cao hơn để
   pipeline đi xa hơn 2 s đầu; hiện chỉ có 1 run mỏng bogus + 1 run mỏng sạch.
5. **Mitigation production:** ring > file cần đổi buffer-size phía
   WebKit/playbin — chưa có đường sửa trong repo; hoặc tránh đường splice
   bằng preload đầy đủ trước seek (G6 §8.5c, chưa đo).
6. Nợ đứng yên từ đợt 107/108 (xem LIMITS gộp đợt 108 §4): G1 + mù #22
   chờ user quyết, re-arm A/B tắt E4, zombie gate (b), blur B-band, cụm A,
   ghost C3b, harness E1, EPERM probe #28 + mù #27, ENOSPC, birefnet 0
   lần, TTS 39 CẤM kiểm lại, ci-security.yml 403, release gate.

## 8. Batch stage (KHÔNG push)

`phase9-round109-k2-2mib.txt` (4 entry, NUL-delimited, đã đọc lại):

- `benchmarks/render/webkit_blob_flaky_109k2_2mib.mjs` (runner K2: copy
  runner J2, port 8937, OUT 109k2, thêm mode K2FILE/K2H2Q/K2RESET/
  K2FRESH/K2C8FILE; header ghi rõ cách chạy)
- `benchmarks/render/k2_offsets_109.py` (đọc offset thực từng pull —
  copy `j2_offsets_108.py`, dùng cho cả c2/c8 qua arg clip)
- `benchmarks/results/webkit-blob-flaky-109k2-2mib.json` (18 case: 15 run
  hợp lệ/mỏng + 3 run vô hiệu stall; mọi case đều có
  `j2Queue2MaxSizeBytes` + `gstPluginPath`)
- `docs/PHASE9_ROUND109_K2_2MIB_LIMITS.md` (file này)

Không stage binary (`.so` ở lại `hidden_files/round109-k2/`, như tiền lệ
H2/I3/J2). Không stage log nhị phân. Dữ liệu thô đầy đủ ở
`hidden_files/round109-k2/` (prereg, gst/pull/dot, batch logs, progress,
shim `j2_queue2_probe.c` + `.so` copy từ J2). KHÔNG push.
