# Đợt 121 T8 — Mở rộng chân B A/B H3f: gộp n=255 tick chậm, verdict đợt 119 KHÔNG tái hiện (LIMITS)

Ngày: 16/11/2026 (lượt cron 15:35 +07; đo 08:42–09:05Z). Boot mở đợt #62
(`9788ce28`, btime 08:25:47Z); **máy reboot giữa B2 và B3** → boot #63
(`725453a2`, btime 08:53:05Z). Hạn cứng đóng đợt 10:45Z — luồng xong
09:09Z, trong hạn. Prereg: `hidden_files/round121-t8/prereg-t8.md`
(viết trước khi đo) + addendum §7 (trước B3) + addendum §8 (trước B4,
do reboot làm sai tiền đề của §7). KHÔNG push. KHÔNG sửa production.

## 0. Tóm tắt verdict — đọc trước

**"H3f GIÚP" KHÔNG còn đứng trên số gộp. Verdict đợt này: TRUNG TÍNH —
lợi ích chưa chứng minh được, không phải HẠI.**

- Chân B gộp chính (B119 + B1 + B2, theo prereg §3): tick chậm **122/1377
  = 8,9%** so với chân A đợt 119 **41/391 = 10,5%** → chỉ **−15,5%**,
  KHÔNG đạt bar −25% (95% CI tỉ số 0,59–1,20, chứa 1,0 = không có hiệu
  ứng). Longtask trung bình/run −20,6% (vừa đủ bar −20%, biên mỏng).
  Cần CẢ HAI bar mới giữ "GIÚP" → **không giữ được**.
- Kiểm nhạy (chỉ run B đợt 121, B1+B2, so với A): tick chậm +9,4%,
  longtask −4,8% — cùng chiều phủ định.
- Thêm B3+B4 (bằng chứng phụ theo addendum §7–§8): chân B gộp 5 run
  **386/2049 = 18,8%** vs A 10,5% → **+79,7%** (RR 1,80, CI 1,30–2,48).
  Nhưng số này trộn 3 boot + tải anh em leo cao trên boot #63 — CI giả
  định tỉ lệ đồng nhất, mà tỉ lệ thực chạy 4,0%→39,5%, nên CI này
  KHÔNG được đọc là "H3f gây hại". Không có bằng chứng hại nào quy được
  cho patch (§4).
- **Phát hiện chính của đợt này không phải về H3f, mà về phép đo:**
  cùng cây H3f 5be5a250, cùng protocol, cùng hog N=4, tick chậm mỗi run
  là **19, 74, 29, 133, 131** (trung bình 77,2, trung vị 74, SD 48,4,
  gấp ~7 lần). Nhiễu giữa các lượt NUỐT CHỬNG hiệu ứng. Kết luận
  "−53,7%" đợt 119 chỉ là một lần rút thăm từ phân phối rất rộng này
  (cặp A/B n=1 mỗi chân). Mọi so sánh đếm (count) xuyên-boot đều không
  đủ tin để kết luận về patch.
- **Khuyến nghị:** GIỮ patch trên cây (không revert — §4: không có bằng
  chứng hại, 2/5 run B thắng A cả hai bar, cơ chế ổn định, pageErrs 0
  mọi run), nhưng **hạ cấp claim từ "H3f GIÚP −54%" xuống "chưa chứng
  minh được lợi ích"**. Bước tiếp theo duy nhất có ý nghĩa: cặp A/B
  MỚI cùng boot, có warm-up, prereg trước (đề xuất §7) — không kết luận
  thêm từ số cũ.

## 1. Sửa sai trong prereg: gộp ĐẾM là sai, phải gộp TỈ LỆ

Prereg §3 viết "B gộp so với A: tick chậm giảm ≥25%" mà không nói rõ
đếm hay tỉ lệ. Gộp đếm thô (122 vs 41) so **3 run với 1 run** — sai
ngay từ thiết kế (đếm gộp chỉ tăng khi thêm run). Verdict ở §0 dùng
**tỉ lệ tick chậm (slow/total ticks) và trung bình/run** cho longtask/
gap — cách so sánh đúng duy nhất khi số run khác nhau. Số đếm thô vẫn
báo ở §2 để minh bạch, ghi rõ là **thiên lệch, không dùng để kết luận**.
Đây là lỗi của prereg đợt này (người viết prereg cũng là người đo),
ghi nhận công khai, không giấu.

## 2. Kết quả đầy đủ — 5 run chân B (cùng cây H3f 5be5a250) vs chân A đợt 119

| Run | Boot | Tick chậm (n/tổng, tỉ lệ) | Longtask ≥200ms (n / tổng ms) | Gap >300ms (n / tổng ms) | loopMs p50/p90/max | load1 med | draws/s | preMs med / renderMs med | skipped |
|---|---|---|---|---|---|---|---|---|---|
| A119 (baseline 03bf029f) | 27c8b1d9 | 41/391, 10,5% | 131 / 36.279 | 84 / 34.232 | 32,7 / 100,7 / 691,4 | 5,84 | ~9 | 82,9 / 23,9 | 64/386 (16,6%) |
| B119 (H3f) | 27c8b1d9 | 19/479, 4,0% | 67 / 17.290 | 38 / 14.388 | 19,8 / 87,8 / 415,5 | 5,45 | 11,2 | 36,0 / 16,6 | 56/475 (11,8%) |
| B1 (H3f) | #62 | 74/410, 18,0% | 140 / 44.759 | 91 / 44.391 | 28,5 / 118,8 / 2004,2 | 0,50 | 7,9 | 82,8 / 24,0 | 77/397 (19,4%) |
| B2 (H3f) | #62 | 29/488, 5,9% | 92 / 24.336 | 51 / 20.054 | 19,1 / 93,5 / 779,1 | 2,79 | 11,1 | 75,6 / 16,4 | 49/471 (10,4%) |
| B3 (H3f) | #63 | 133/337, 39,5% | 177 / 54.712 | 111 / 50.105 | 87,0 / 186,2 / 896,2 | 6,99 | 6,4 | 81,9 / 88,0 | 71/335 (21,2%) |
| B4 (H3f) | #63 | 131/335, 39,1% | 181 / 57.612 | 126 / 53.260 | 91,4 / 179,0 / 1170,8 | 6,96 | 6,6 | 80,6 / 93,1 | 61/326 (18,7%) |

Tất cả run: probe exit=0, pageErrs=0, md5 preview.tsx 5be5a250 trước =
sau, cùng boot trong suốt run → **hợp lệ theo prereg §2** (kể cả B1/B3/
B4 — run xấu không phải run hỏng; loại chúng chỉ vì số xấu sẽ là
cherry-picking, prereg cấm).

### 2.1 So sánh gộp (tỉ lệ + trung bình/run — cách đúng)

| So sánh vs A119 | Tick chậm (tỉ lệ, thay đổi) | 95% CI tỉ số | Longtask tổng TB/run | Gap tổng TB/run |
|---|---|---|---|---|
| **B gộp-3 (B119+B1+B2) — CHÍNH** | 8,9% vs 10,5% → **−15,5%** (bar −25%: KHÔNG ĐẠT) | 0,59–1,20 | 28.795 vs 36.279 → **−20,6%** (bar −20%: vừa đạt) | 26.278 vs 34.232 → −23,2% |
| B gộp-5 (tất cả) | 18,8% vs 10,5% → **+79,7%** | 1,30–2,48 (*) | 39.742 → +9,5% | 36.440 → +6,4% |
| B-mới đợt 121 (B1+B2) | 11,5% vs 10,5% → +9,4% | 0,76–1,57 | 34.548 → −4,8% | 32.222 → −5,9% |
| B-mới đợt 121 (B1–B4) | 23,4% vs 10,5% → +122,9% | 1,61–3,08 (*) | 45.355 → +25,0% | 41.952 → +22,6% |
| Chỉ run ấm (B119+B2) — hậu-hoc | 5,0% vs 10,5% → **−52,7%** | 0,31–0,72 | 20.813 → −42,6% | 17.221 → −49,7% |
| Chỉ run lạnh-đầu-boot (B1+B3) — hậu-hoc | 27,7% vs 10,5% → +164,3% | 1,89–3,69 (*) | 49.736 → +37,1% | 47.248 → +38,0% |
| Chỉ boot #63 (B3+B4) | 39,3% vs 10,5% → +274,7% | 2,70–5,21 (*) | 56.162 → +54,8% | 51.682 → +51,0% |

(*) CI các hàng trộn nhiều boot/tải: giả định tỉ lệ đồng nhất là sai
(tỉ lệ thực 4,0%–39,5%), nên CI chỉ mang tính mô tả, không phải bằng
chứng nhân quả về patch. Hàng "chỉ run ấm" là đọc hậu-hoc (xem §5) —
lợi ích −52,7% chỉ đứng trong subset này, không đứng trên toàn bộ dữ liệu.

### 2.2 Điều kiện hiệu lực (prereg §2, áp cho chân B gộp)

Gộp-3: longtask n=299 ≥ 50 ✓, gap n=180 ≥ 20 ✓, tick chậm n=122 ≥ 30 ✓
— ĐẠT cả 3 (mục tiêu n≥30 của nhiệm vụ **vượt xa**: 122, rồi 386 với
B3+B4). Stall tái hiện rõ mọi run. Vấn đề không phải thiếu stall, mà là
stall quá nhiễu giữa các run.

## 3. Cơ chế H3f: thành phần tick chậm ỔN ĐỊNH qua mọi run (không đổi theo số lượng)

Pháp y offline (`diag-forensic.py` + `s-store.py`, creator-tag vẫn hỏng
như đợt 118–119 nên dùng pháp y — xem §6):

| Run | S_store held-first (med, n) | S_first (med, n) | Held-first / first-draw | Zero-draw tick chậm | Second-draw med |
|---|---|---|---|---|---|
| A119 | 0,507 (25) | 0,489 (35) | 25/35 | 6/41 (15%) | 77,8 ms (11) |
| B119 | 0,477 (13) | 0,344 (16) | 13/16 | 3/19 (16%) | 53,8 ms (8) |
| B1 | 0,434 (39) | 0,427 (56) | 39/56 | 18/74 (24%) | 77,5 ms (30) |
| B2 | 0,484 (13) | 0,474 (20) | 13/20 | 9/29 (31%) | 80,2 ms (13) |
| B3 | 0,468 (102) | 0,486 (124) | 102/124 | 9/133 (7%) | 82,2 ms (61) |
| B4 | 0,477 (84) | 0,496 (122) | 84/122 | 9/131 (7%) | 85,0 ms (66) |

Đọc: **S_store ~0,43–0,48 và S_first ~0,34–0,50 gần như không đổi qua
cả 6 run** — lần đọc video đầu tiên vào held canvas vẫn chiếm ~45%
tick chậm dù tổng số tick chậm dao động 19→133. Patch không làm thay đổi
thành phần tick chậm còn lại; thứ thay đổi giữa các run là SỐ LƯỢNG
tick chậm (do boot/tải), không phải cơ chế. R_new/same median 2,01–3,36
mọi run (decoder-block vẫn còn). preMs med ~75–83 mọi run TRỪ B119
(36,0) — con số preMs −57% đợt 119 nhiều khả năng cũng là một lần rút
thăm thuận lợi, không phải hiệu ứng ổn định của patch.

## 4. Vì sao KHÔNG revert — và vì sao cũng KHÔNG giữ claim "GIÚP"

**Không revert vì:**
- Không có bằng chứng hại nào quy được cho patch: pageErrs 0 cả 6 run;
  không hồi quy parity (marker play-done + results.json đầy đủ mọi run);
  skipped 10–21% (A 16,6% — nằm trong dải, không tệ đi hệ thống);
  S_store/S_first ổn định — patch không làm méo cơ chế tick.
- 2/5 run B thắng A cả hai bar (B119 −53,7%/−52,3%; B2 −29%/−33%
  theo đếm từng run); 0/5 run B thắng A theo hướng ngược lại một cách
  sạch — các run xấu (B1/B3/B4) đều có yếu tố môi trường đi kèm (xem §5),
  và B3/B4 chậm TOÀN DIỆN (loopMs p50 87–91 ms, renderMs med 88–93 ms
  so với 16,6 ở B119) — máy đói CPU toàn cục, không phải riêng đường
  video-draw mà patch chạm vào.
- Thiết kế patch chỉ bỏ lần đọc video thừa trên tick nóng (staleness ≤3
  tick) — rủi ro thấp theo thiết kế; không có tín hiệu nào trong dữ liệu
  cho thấy nó gây chậm.

**Không giữ claim "GIÚP" vì:** gộp-3 không đạt bar tick chậm; kiểm nhạy
B-mới trái chiều; và quan trọng nhất — phân phối run quá rộng (19→133)
khiến mọi ước lượng từ n=1 mỗi chân đều không đáng tin. Giữ claim cũ
sau dữ liệu này sẽ là nói quá.

## 5. Nhiễu đến từ đâu — tách theo boot/tải (giả thuyết, chưa chứng minh)

- **Boot #63 tệ toàn diện:** B3 133 + B4 131, p50 loopMs 87–91 ms
  (trung vị tick gần chạm ngưỡng chậm), draws/s 6,4–6,6, renderMs med
  88–93 ms. Tải anh em leo trong lúc phát (load1 2,9→8,3 ở B3; 0,6→8,6
  ở B4; load lúc thoát B3 6,80). Máy đói CPU toàn cục trên boot #63
  trong khung 08:57–09:05Z — trùng lúc các luồng anh em chạy nặng.
- **Boot #62 trung gian:** B1 74 (lạnh, TRƯỢT DẢI ở load1 0,13 sau 120 s
  chờ dải — tải đo được rất thấp nhưng draws/s chỉ 7,9, preMs 82,8),
  B2 29 (ấm, phát trong dải, draws/s 11,1). B1 là run vite đầu tiên trên
  boot #62 (RAMavail lúc lock chỉ 1138 MB, vite/page-cache lạnh).
- **Giả thuyết "run đầu trên boot mới xấu" BỊ BÁC một nửa:** B1 lạnh
  74 → B2 ấm 29 (ủng hộ), nhưng B3 lạnh 133 → B4 ấm 131 (bác — ấm vẫn
  tệ như lạnh trên boot #63). Yếu tố quyết định có vẻ là **boot + tải
  anh em**, không phải lạnh/ấm. Cơ chế lạnh-đầu-boot (vite transform
  cache, page cache video) vẫn có thể góp phần ở B1 nhưng không giải
  thích được B4.
- **load1 là trục hỏng** (quyết parent đợt 120 T2: load1 không đo tải
  thật; trục sau này là PSI cpu.some + threadsR). Số load1 med ở đây
  (0,50 / 2,79 / 6,99) chỉ báo kèm, không dùng để hiệu chỉnh. B1 là ví
  dụ rõ: load1 med 0,50 (thấp nhất) mà vẫn 74 tick chậm — load1 không
  giải thích được B1.
- **Reboot #62→#63 (btime 08:53:05Z)** xảy ra giữa B2 (xong 08:52:18Z)
  và B3 (lock 08:56:39Z). Không rõ luồng nào reboot (có thể hạ tầng
  boot #62 của T7) — ghi nhận để parent kiểm, không phải việc của
  luồng này. B3/B4 chạy hoàn toàn trên boot #63 (boot trước = sau).

## 6. Phương pháp (y hệt đợt 119, trừ điểm ghi ở §1)

- Probe: bản copy `apps/web/scripts/probe121t8-h3fext-ab.mjs` từ
  `probe119t1-h3f-ab.mjs` — diff đúng 3 dòng (header comment, SCRATCH,
  CFG_DIR round119-t1 → round121-t8); `node --check` OK. Không đổi
  logic đo. Spec: `--engine chromium --config scroll-mixed-alt --nclips
  24 --freeze-run --sysload 0`, stripes-scroll.mp4 1280×720, 24 clip ×
  3 s, hog cố định N=4, lock v2-only port 5590.
- Driver `hidden_files/round121-t8/run-t8.sh` (copy run-t1.sh đợt 119,
  chỉ đổi HF/thread t8-round121/probe/acquire-timeout 3600→1800 s).
  Lock copy đóng băng md5 `cd0c05c1…` (= production hiện tại; đã đổi so
  với bản 5cac10af đợt 119 — chỉ ghi nhận). Chạy detached (nohup).
  Giữ lock mỗi run 142–307 s, không quá 400 s. Lock trống khi xong.
- Analyzer `analyze-t2-diag.py` + pháp y `diag-forensic.py` + `s-store.py`
  (copy đợt 119, không sửa). Creator-tag vẫn hỏng (mọi canvas
  creator="evaluate") — S_store/S_first lấy bằng pháp y như đợt 118–119.
- Cây: preview.tsx md5 `5be5a250…` + media.ts `2c384ed1…` trước/sau MỌI
  run — **không đổi, không sửa production**. Lock script md5 sau mỗi run
  = cd0c05c1 (không đổi).
- B1: lock 08:42:40Z, phát sau TRƯỢT DẢI 120 s (load1 lúc phát 0,13),
  xong 08:47:44Z. B2: lock 08:49:56Z, phát trong dải, xong 08:52:17Z.
  B3: lock 08:56:39Z (REBOOT-DETECT boot đổi), phát trong dải
  (load1 7,47), xong 08:59:06Z. B4: lock 09:02:32Z, xong 09:04:57Z.
  Không run nào retry (probe exit=0 ngay lần đầu cả 4 run).

## 7. Nợ mở / đề xuất cho đợt sau

1. **Cặp A/B mới cùng boot, prereg trước — bước duy nhất có ý nghĩa:**
   trên boot hiện tại (#63, nếu còn) hoặc boot mới sau reboot: warm-up
   1 run (không tính) rồi chạy A tươi (revert H3f tạm trên bản copy
   HOẶC giữ nguyên cây H3f và chạy A bằng cách tắt cờ — cần thiết kế
   sạch) + B ấm, liền nhau, cùng tải anh em. Chỉ cặp này mới trả lời
   được "H3f có giúp không" sau dữ liệu đợt này. Không kết luận thêm
   từ số cũ.
2. **Giao thức A/B cần vá:** (a) warm-up bắt buộc trước mọi chân đo
   (run đầu trên boot mới đã 2 lần cho số xấu); (b) mỗi chân ≥2 run,
   so sánh bằng TỈ LỆ/trung bình-run, không bao giờ so đếm thô khi số
   run khác nhau; (c) ghi PSI cpu.some + threadsR thay cho load1 (trục
   load1 đã bị bác đợt 120 T2); (d) ghi tải anh em (luồng nào đang dial/
   giữ hog) vào log mỗi run — đợt này tải anh em leo 3→8 giữa B3/B4 mà
   không rõ nguồn.
3. **Bộ đếm skip H3f** (`window.__h3fStats`) — nợ từ đợt 119 §7 mục 1,
   vẫn chưa làm: cần số đếm trực tiếp số tick đã skip để tách hiệu ứng
   patch khỏi nhiễu boot/tải (dữ liệu đợt này cho thấy suy từ đếm tick
   chậm là không đủ).
4. `creatorFromStack` trong probe vẫn hỏng (nợ T2 đợt 118 §8 mục 2).
   Driver retry không bật lại hogs (nợ cũ). ci-security.yml vẫn 403 chờ
   user. TTS 39 cấm kiểm lại. Birefnet chỉ thử lại khi RAM đổi (u2net
   là fallback chính thức).
5. Reboot #62→#63 lúc 08:53:05Z giữa đợt — parent kiểm luồng nào reboot
   và liệu checkpoint đợt 121 (ghi boot #62) có cần cập nhật.

## 8. Những gì KHÔNG làm trong luồng này

- KHÔNG push, KHÔNG release/tag. KHÔNG sửa preview.tsx/media.ts hay bất
  kỳ production nào (md5 trước = sau mọi run). KHÔNG chạy chân A tươi
  (đề xuất ở §7 mục 1, không tự chạy ngoài nhiệm vụ — prereg §3).
- KHÔNG loại run xấu khỏi số gộp (B1/B3/B4 hợp lệ theo §2 — loại chúng
  sẽ là cherry-picking). KHÔNG chạy B5 (dừng đúng luật addendum §8 sau
  B4). KHÔNG kiểm lại TTS 39. KHÔNG thử birefnet.

## 9. File liên quan

- Prereg (+2 addendum): `hidden_files/round121-t8/prereg-t8.md`
- Probe B mới: `apps/web/scripts/probe121t8-h3fext-ab.mjs` (75.292 B —
  oversize, cần `ENABLE_PRIVSEP=0` khi push; cùng mẫu đợt 119)
- Driver/analyzer/pháp y/S-store/lock copy: `hidden_files/round121-t8/
  run-t8.sh`, `analyze-t2-diag.py`, `diag-forensic.py`, `s-store.py`,
  `vcut-vite-lock-v2.sh` (md5 cd0c05c1)
- Dữ liệu thô (KHÔNG stage, ~92 MB): `hidden_files/round121-t8/
  chr-mixedalt-h3fext-B{1,2,3,4}-fr4/` (results.json + drains +
  analysis/forensic/sstore/load.tsv) + `driver-t1.log`
  (tên file log giữ nguyên từ bản copy run-t1.sh)
- LIMITS: `docs/PHASE9_ROUND121_T8_H3FEXT_LIMITS.md` (file này)
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round121-t8-h3fext.txt`
  (NUL-delimited; chỉ LIMITS + probe copy — preview.tsx KHÔNG đổi nên
  KHÔNG stage lại)
- Cờ: `hidden_files/round121-t8.done`
