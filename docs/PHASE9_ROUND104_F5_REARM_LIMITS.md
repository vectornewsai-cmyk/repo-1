# Phase 9 đợt 104 — luồng F5: Re-arm — điều tra nợ mới tỉ lệ đóng-trần phẳng load4 tăng post-fix

- **Ngày:** 2026-11-13 (phân tích dữ liệu E5 08:39–09:00Z; đo live trên máy yên: CHỜ CỬA SỔ SAU REBOOT #29 — xem §7).
- **Nợ điều tra:** LIMITS gộp đợt 103 §4 mục 5 — "tỉ lệ đóng-trần phẳng load4 tăng post-fix (20 ca / 9 lượt, tuổi đuôi trung vị 2102 → 5013 ms; nguyên nhân chưa xác định)".
- **Kết luận ngắn (phân tích dữ liệu cũ — xem §1–§6):**
  1. **Tái hiện độc lập đúng 20/20 ca:** script mới `analyze-f5-cap-pattern.py` (cùng phương pháp quỹ đạo D6/E5) đếm lại được đúng 9 CAP ở k + 11 CAP ở r, tuổi 5001–5313 ms, khớp từng ca với kiểm tay của E5. Không có ca nào là đóng ADV2. Phương pháp đo đã tái dùng đúng.
  2. **Phát hiện mới — đóng băng TRONG LÚC ĐUÔI MỞ mới là chỉ số phân biệt:** trung vị freeze tối đa trong lúc đuôi mở: pre-fix j **1179 ms** vs post-fix k **4847 ms** vs r **4901 ms**. Pre-fix element đóng băng ~1,2 s rồi playhead đuổi kịp (đuôi đóng trước trần); post-fix element + playhead đóng băng CÙNG NHAU ~4,9 s (freeze trong khi ph đang chạy chỉ 258–388 ms, so với 836 ms pre-fix) — toàn bộ pipeline stall, đuôi chỉ còn đường chạm trần 5000 ms. Đây là bằng chứng đo được cho cơ chế "decoder đói", không phải gate tính sai.
  3. **RAM là biến môi trường phân tách mạnh nhất:** pre-fix j RAM khả dụng lúc bắt đầu 2173–2843 MB (trung vị 2620) — 0 CAP/6 lượt; post-fix k/r 1471–2344 MB (trung vị ~2000) — 20 CAP/10 lượt. 6/6 lượt RAM < 2173 MB đều có ≥1 CAP (15 CAP); RAM ≥ 2173 MB: 7/10 lượt 0 CAP, ngoại lệ k3/k5/r2 (RAM 2169–2344, 1–2 CAP/lượt) — RAM một mình chưa tách sạch.
  4. **Load lúc bắt đầu KHÔNG phân tách:** j loadavg 0,51–14,55 (0 CAP trên toàn dải) vs k/r 0,56–10,64 (CAP trên toàn dải); loadavg lúc kết thúc cũng chồng lấn hoàn toàn (j 0,55–14,77 vs k/r 0,46–11,39). "Máy yên" phải định nghĩa bằng RAM + không probe song song, không phải loadavg lúc bắt đầu.
  5. **E5 fix KHÔNG THỂ là nguyên nhân trên phẳng (chứng minh cấu trúc, §3.1 E5):** flat === spec (cùng object) khi không có adjustment/nested → drift gate tính sau fix bằng đúng trước fix. Công việc mới duy nhất mỗi tick là 1 lần ghi ref (object allocation) — không có đường cơ chế nào tới đóng băng decoder 2–5 s. Không cần A/B cho E5 trên phẳng.
  6. **E4 fix VẪN LÀ NGHI PHẠM CHƯA LOẠI ĐƯỢC (confound hoàn hảo):** E4 land 06:28:22Z; cả 6 lượt load4 k đều chạy SAU đó (06:29–06:33), cả 6 lượt load4 j đều chạy TRƯỚC đó (05:58–06:04). Loại trừ của E5 §6 với E4 chỉ bằng đọc code, không bằng A/B. Tuy nhiên 2 đuôi CAP ở load2 (k7 5027 ms, k11 5107 ms) chạy TRƯỚC E4 land — CAP đã xuất hiện trên cây chỉ-có-E5 — nên E4 không phải điều kiện cần cho CAP. Chỉ A/B có kiểm soát mới kết luận được E4 có đóng góp hay không.
  7. **Confound thứ ba — E3 CDP trùng cửa sổ k-load4:** E3 chạy CDP run-a2 06:29 + run-b2 06:32, trùng đúng 5/6 lượt load4 k (k4/k5/k2/k3/k8). Không tách được khỏi RAM/E4 bằng dữ liệu cũ.
  8. **Đo live trên máy yên (RAM ≥ 2,5 GB, không probe song song) là bước quyết định — CHƯA CHẠY:** lúc phân tích (08:39–09:00Z) F1 (G1) đang chạy probe Chromium nặng + các luồng đợt 104 khác khởi động; load 15–18, RAM dao động 462–2644 MB. Chạy lúc đó sẽ vừa nhiễu kết quả của mình, vừa phá cửa sổ yên của F1. Driver `run-f5.sh` + probe `probe104f5.mjs` đã chuẩn bị sẵn; chạy ngay khi cửa sổ yên mở (dự kiến sau reboot #29 ~09:03Z). Nếu CAP/lượt về ~0 → kết luận nhiễu môi trường (RAM/swap + probe song song). Nếu vẫn cao → A/B tắt E4 (xem §6).

## §1. Tái hiện độc lập 20 ca (phương pháp + số liệu)

Script mới `hidden_files/round104-f5/analyze-f5-cap-pattern.py` (dựa trên `analyze-k1-k12-drift-traj.py` của E5, thêm cột freeze/rate/RAM/load): nhóm velocityTicks liên tiếp có cùng `tail.endedAtMs`; tuổi = tick cuối có đuôi − endedAtMs; CAP khi tuổi ≥ 4800 ms và không phải tiếp quản bởi watch mới arm (rearms tăng ở tick sau). Chạy trên toàn bộ probe-results.json load4 đợt 103:

| Nhóm | Lượt | CAP (tuổi ≥ 4800) | CAP/lượt | Tuổi CAP | Khớp E5 |
|---|---|---|---|---|---|
| pre-fix j | 6 | **0** | 0,00 | — | 0 f4-like, khớp |
| post-fix k | 6 | **9** | 1,50 | 5015–5313 ms | đúng 9 f4-like, từng tuổi khớp kiểm tay E5 §4.2 |
| confirm r | 4 | **11** | 2,75 | 5001–5106 ms | đúng 11 f4-like, từng tuổi khớp |

Chi tiết 20 ca (tuổi, drift lúc đóng, ct/ph): xem `hidden_files/round104-f5/cap-pattern-rows.json` (đã lưu) + bảng dưới. Tất cả adv=0 trừ k4 (adv=1 nhưng tuổi 5179 ms — vẫn là trần); drift lúc đóng +0,37…+1,05 (19/20) và −0,47 (k4 — element chạy SAU playhead, drift âm, vẫn đóng trần).

Phát hiện phụ khi chạy lại toàn bộ load4 (kể cả nested): 2 đuôi CAP ở lượt nested p2 (5036 ms, drift −0,03) và p6 (5101 ms, drift +0,33) — cả hai drift ≤ 0,35 lúc đóng nên KHÔNG phải f4-like (không có resync sau); E5 báo nested f4-like = 0 là đúng. CAP "lành" này chứng tỏ trần 5000 ms chạm được cả khi drift đã về nhỏ — trần là hành vi chung của đuôi dài, không riêng gì chuỗi f4-like.

## §2. Mẫu hình trong 20 ca: đóng băng dài + chạy chậm + RAM thấp — không gắn với clip/GOP cụ thể

- **GOP không phân tách:** gop30: 13 ca (k2 1, k3 2, k8 3, r2 1, r3 3, r8 3); gop250: 7 ca (k4 1, k5 2, r5 4). Cả hai GOP đều có CAP; gop30 nhiều hơn nhưng cũng có nhiều lượt gop30 hơn trong r (3/4 lượt r là gop30). Không kết luận GOP là yếu tố.
- **Thời điểm trong lượt:** mọi ca đều ở relMs t = 8591–40313 (nửa sau lượt) — đuôi CAP chỉ xuất hiện khi lượt đã chạy lâu và phát chậm; không ca nào ở 8 s đầu. Phù hợp cơ chế "càng chạy lâu dưới tải, decoder càng đói".
- **Tốc độ phát (rate = ph span / wall span trên velocityTicks):** trung vị j 0,286× vs k 0,213× vs r 0,144×. Lượt chậm nhất có nhiều CAP nhất: r5 0,105× → 4 CAP; k8 0,106× → 3; k5 0,104× → 2; r8 0,148× → 3; r3 0,139× → 3. Nhưng j5 0,145× → 0 CAP (RAM 2822 MB, load lúc bắt đầu 1,54) phá vỡ luật "chậm ⇒ CAP" đơn thuần — rate chậm là điều kiện thuận lợi, không phải điều kiện đủ.
- **RAM lúc bắt đầu (xem §1 mục 3):** phân tách mạnh nhất trong các biến đã đo. Ngoại lệ k3 (2253 MB, 2 CAP), k5 (2344 MB, 2 CAP), r2 (2169 MB, 1 CAP) cho thấy RAM lúc bắt đầu không phải toàn bộ câu chuyện — RAM TRONG lượt (không được log từng lượt) + swap mới là biến thật. Hạn chế ghi rõ: probe chỉ log RAM lúc bắt đầu, không log swap; driver F5 đã bổ sung `free -m` (gồm swap) đầu/cuối driver.
- **Load lúc bắt đầu/kết thúc:** không phân tách (xem kết luận 4). Lưu ý: loadavg lúc bắt đầu đo TRƯỚC khi probe bật 4× `yes`, nên nó đo tải nền của các luồng khác, không đo tải trong lượt. Con số này đã bị E5 trích làm "máy yên" cho r (load 0,56 trước r5) trong khi 3/4 lượt r còn lại bắt đầu ở load 7,24–7,96 — đính chính: r KHÔNG phải đo trên máy yên.

## §3. Cơ chế: đóng băng toàn pipeline (rAF + decoder) — bằng chứng freeze trong lúc đuôi mở

Chỉ số mới (đo trên velocityTicks, cùng dữ liệu E5):

| Nhóm | Freeze tối đa trong lúc đuôi mở (trung vị) | Freeze tối đa khi ph đang chạy (trung vị) | Max freeze toàn lượt (trung vị, để đối chiếu) |
|---|---|---|---|
| pre-fix j | **1179 ms** | **836 ms** | 4862 ms |
| post-fix k | **4847 ms** | **258 ms** | 4847 ms |
| confirm r | **4901 ms** | **388 ms** | 4901 ms |

Đọc: pre-fix, element đóng băng tối đa ~1,2 s trong lúc đuôi mở, và trong lúc đó playhead VẪN TIẾN (836 ms) nên drift thu hẹp và đuôi đóng trước trần. Post-fix, element đóng băng ~4,9 s trong lúc đuôi mở (gần bằng đúng trần 5000 ms — đuôi sống tới trần VÌ element đóng băng suốt tuổi đuôi), và playhead KHÔNG tiến trong lúc đó (chỉ 258–388 ms) — rAF + decoder stall cùng nhau. Đây là mẫu hình của **renderer process bị stall toàn bộ** (RAM thấp + swap — swap đã dùng ~400 MB trong đợt, SwapCached 170 MB lúc đo 08:39Z), không phải của "decoder chậm hơn một chút". Lưu ý: max freeze toàn lượt ~4,9 s ở CẢ BA nhóm (kể cả j) — chỉ số đó lẫn cả dwell trước khi phát (element đứng ở ct=5 sau pause-seek) nên KHÔNG dùng được; chỉ freeze-trong-đuôi-mở mới phân biệt được, và nó phân biệt rất rõ (1179 vs ~4900 ms).

Hệ quả cho A/B: nếu F5 trên máy yên + RAM cao mà freeze-trong-đuôi-mở về ~1,2 s và CAP về 0 thì cơ chế RAM/swap được xác nhận là đủ để giải thích toàn bộ chênh lệch — không cần đụng code. Nếu freeze vẫn ~4,9 s trên máy yên thì mới xét tới code (E4).

## §4. Đã loại trừ / còn mở (cập nhật E5 §6)

**Đã loại trừ (bằng chứng mới hoặc cũ):**
- **E5 fix trên phẳng:** loại bằng chứng minh cấu trúc E5 §3.1 (flat === spec) — F5 kiểm độc lập bằng đọc code: `buildPreviewSpecDetailed` (`nestedPreview.ts:3170`) trả `{ spec }` nguyên object khi `!hasNestedOrAdjustment(input)`; `hasNestedOrAdjustment` (`:2468`) chỉ true khi có adjustmentLayers/track-adjustment/clip-nested/clip-adjustment — effect không kích hoạt. Project phẳng của probe (0 adjustment, 0 nested) đi đường early-return này, nên `specForTail103E5 === st.spec` và drift gate tính sau fix bằng đúng trước fix. Công việc mới duy nhất mỗi tick là 1 lần ghi ref (object allocation) trên đường render, không chạm decoder — không có đường cơ chế nào tới đóng băng decoder 2–5 s. Không cần A/B cho E5 trên phẳng.
- **Lỗi harness mới:** verdict PASS ở mọi lượt hợp lệ j/k/r; các lượt lỗi pause-seek là họ cũ.
- **Loadavg lúc bắt đầu là nguyên nhân:** không phân tách (xem §2).

**Còn mở (chưa tách được bằng dữ liệu cũ):**
- **RAM/swap trong lượt** (nghi phạm số 1 — phân tách mạnh nhất + cơ chế stall toàn pipeline khớp): chỉ đo live máy yên + RAM cao mới tách được.
- **E4 fix** (nghi phạm số 2 — confound hoàn hảo với k-load4/r, loại trừ cũ chỉ bằng đọc code): chỉ A/B tắt E4 mới tách được.
- **E3 CDP trùng cửa sổ** (nghi phạm số 3 — trùng 5/6 lượt load4 k): không tách được hồi tố; đo live máy yên tự động loại (không có E3 chạy cùng lúc nữa).
- **Thay đổi preview.tsx 06:38:03 (md5 → c2251e39):** r chạy trên cây này, k-load4 chạy trên 4e954101; nội dung thay đổi vẫn chưa xác định được luồng nào (E9 chỉ xác minh cây cuối xanh). Nếu F5 (chạy trên c2251e39) vẫn cao CAP thì thay đổi này cũng vào diện nghi phạm — nhưng nó là 1 lần sửa duy nhất, không phải pattern.

## §5. Thiết kế đo live (đã chạy — xem §7–§8; tiêu chí quyết định ở cuối mục)

- **Ma trận:** 6 lượt phẳng load4 trên cây hiện tại (preview.tsx md5 `c2251e39`, playheadHold90R2 `00cce1ac` — không đổi từ cuối đợt 103): f1/f2/f3 = gop30, f4/f5/f6 = gop250 — đúng 6 ô load4 của j/k/r.
- **Probe:** `apps/web/scripts/probe104f5.mjs` (bản sao probe103e5.mjs, chỉ đổi scratch → `hidden_files/round104-f5/`, CFG → `/tmp/round104-f5`; `node --check` OK; diff 22 dòng toàn là đổi tên/scratch). Analyzer tái dùng: `analyze103e5-tail-expiry.mjs` + `hidden_files/round104-f5/analyze-f5-cap-pattern.py` (đã chạy thử trên dữ liệu cũ, khớp E5).
- **Driver:** `hidden_files/round104-f5/run-f5.sh` — log boot + md5 đầu/cuối, pre-flight (RAM/load/process probe khác), RAM_kB + load1 đầu mỗi lượt, mtime check + verdict mỗi lượt, `free -m` (gồm swap) đầu/cuối.
- **Điều kiện chạy:** máy yên (không luồng đợt 104 nào khác chạy probe nặng song song — kiểm bằng pre-flight `ps`), RAM khả dụng mục tiêu ≥ 2,5 GB (ghi rõ số thật; nếu không đạt thì ghi rõ và vẫn đo — RAM thực tế là biến giải thích chính).
- **Tiêu chí quyết định (đăng ký trước):** CAP/lượt f ≈ 0 (như j 0/6) + freeze-trong-đuôi-mở trung vị về ~1,2 s → kết luận nhiễu môi trường, nợ ĐÓNG, không đụng code. CAP/lượt f vẫn ≥ ~1,5 (như k) + freeze vẫn ~4,9 s → môi trường không giải thích hết → A/B tắt E4 (xem §6).

## §6. Kế hoạch A/B nếu đo yên vẫn cao (đo yên ĐÃ CAO — xem §8; A/B ưu tiên là RAM cao §10, E4 toggle hoãn lại — xem §10)

- **Biến duy nhất:** E4 fix (`apps/web/src/lib/driftConfirmSkip103E4.ts` + điểm gọi trong `preview.tsx`). Tắt bằng cách tạm thời vô hiệu hoá điểm gọi (giữ file module nguyên), chạy lại đúng ma trận 6 lượt load4, rồi KHÔI PHỤC NGAY và kiểm md5 preview.tsx về đúng `c2251e39` trước khi viết LIMITS. Không revert E5 (đã chứng minh no-op trên phẳng — A/B nó không đo được gì).
- **Rủi ro va chạm:** sibling đang sửa preview.tsx thì mtime-đổi sẽ loại lượt theo quy định; toggle chỉ làm trong cửa sổ yên và khôi phục ngay sau ma trận (ước ~12 phút). Ghi rõ md5 trước/sau toggle trong log.
- **Nếu A/B E4-off vẫn cao CAP:** khi đó cả E4 lẫn E5 đều không phải nguyên nhân; nghi phạm còn lại là thay đổi 06:38:03 hoặc yếu tố môi trường chưa đo (vd swap/IO) — ghi làm nợ mở, KHÔNG đoán thêm fix.
- **Nếu A/B chứng minh được nguyên nhân + fix có đo được:** chỉ khi đó mới sửa production (kèm unit test + tsc/vite build/test liên quan) theo luật cứng của nhiệm vụ.

## §7. Trạng thái đo live + sự cố môi trường trong lượt này

- **Lần chạy driver đầu (08:57:46Z) thất bại toàn bộ 6 lượt — lỗi môi trường thoáng qua ngay sau reboot #29:** WebKit `MiniBrowser: libevent-2.1.so.7: cannot open shared object file` ở cả 6 lượt (exit=2, không có probe-results.json). Chẩn đoán: file có đủ ở cả debroot + `/usr/lib`; `ldd` với đúng `LD_LIBRARY_PATH` của probe cho **0 lib thiếu**; chạy trực tiếp MiniBrowser (09:00:22Z) và chạy thử Playwright tối thiểu (09:01:17Z, launch OK version 27.2, page OK) đều thành công. Kết luận: lỗi chỉ xuất hiện trong cửa sổ boot+1–2 phút (môi trường chưa sẵn sàng hoàn toàn sau reboot), không phải lỗi probe hay sản phẩm. Không tính 6 lượt lỗi này vào số lượt hợp lệ.
- **Lần chạy driver hai (09:01:36–09:11:32Z) thành công 5/6 lượt** (xem §8). f6 lỗi harness: "mẫu không tự load sau 240s" (WebKit đã launch 09:07:24Z, trang load nhưng store không đạt 3 clip/2 media trong 240 s) — lúc đó load chỉ 0,24 (máy yên) nhưng swap đã lên 386 MB; nhiều khả năng vite/esbuild đói RAM/swap. Không tính f6 vào số lượt hợp lệ (theo tiền lệ E5/D6: chỉ đếm lượt hợp lệ).
- **Cây lúc đo live: preview.tsx md5 `ca378bbf`** (KHÔNG còn là `c2251e39` của cuối đợt 103): F3 land `104f3` relabel (54 marker, +11 KB) lúc 08:44:33Z, trước reboot #29. Vùng đuôi/gate/flatten không đổi: `playheadHold90R2.ts` vẫn `00cce1ac`, marker 103E5 ×9 + 101C3 ×13 + 103E4 ×23 còn nguyên, mtime preview.tsx không đổi trong suốt 6 lượt f (08:44:33Z → kết thúc; mọi lượt mtime-đổi=không). F3 không giải thích được CAP cao ở k/r (chúng chạy trước F3); f (2,80 CAP/lượt) ≈ r (2,75) nên cũng không thấy F3 khuếch đại gì. Ghi rõ để không ai trích f như đo trên cây đợt 103 thuần. (Đính chính: md5 `c2251e39` F5 kiểm lúc 08:42:58Z — trước khi F3 land 08:44:33Z; ghi "kiểm 08:56Z" ở bản nháp là sai giờ.)
- **RAM ≥ 2,5 GB KHÔNG đạt được trong lúc đo** (xem §8): RAM khả dụng lúc bắt đầu các lượt f chỉ 1464–2015 MB (dù có lúc 09:01:17Z đo được 2943 MB — 19 s sau, lúc f1 bắt đầu, đã tụt còn 2012 MB do sibling (F1 Chrome run2) khởi động cùng lúc). `drop_caches` bị chặn (read-only). Đây là hạn chế lớn nhất của đợt đo này — xem §10.
- **Không có file round-in-progress.md** (đã kiểm 08:47Z) — không có đợt main-chat đang chạy.
- **Reboot #29 lúc ~08:56Z** (boot `8c1c5131` → `cff65e89`, sớm hơn dự kiến ~09:03Z); watcher nền của F5 bị SIGTERM khi reboot giết (08:57:03Z); F5 kiểm lại trạng thái sau reboot rồi chạy driver lần 2 ngay trong cửa sổ yên đầu boot.

## §8. Kết quả đo live trên máy yên — MÁY YÊN KHÔNG LÀM GIẢM CAP (kết quả chính của đợt này)

Driver `run-f5.sh` lần 2: 09:01:36–09:11:32Z, boot `cff65e89`, preview.tsx `ca378bbf`, 5/6 lượt hợp lệ (f6 lỗi harness, xem §7). Tất cả lượt verdict PASS, mtime-đổi=không.

| Lượt | GOP | RAM bắt đầu (MB) | load1 bắt đầu | rate (× realtime) | Tails | CAP (tuổi) | f4-like |
|---|---|---|---|---|---|---|---|
| f1 | 30 | 2012 | 8,40 | 0,241 | 2 | 2 (5004, 5271 ms) | 1 |
| f2 | 30 | 1882 | 9,98 | 0,108 | 4 | 3 (5113, 5220, 5183 ms) | 3 |
| f3 | 30 | 2015 | 3,45 | 0,110 | 3 | 2 (5169, 5073 ms) | 2 |
| f4 | 250 | 1464 | 1,16 | 0,105 | 5 | 4 (5214, 5103, 5093, 5096 ms) | 4 |
| f5 | 250 | 1917 | 0,62 | 0,127 | 5 | 3 (5018, 5170, 5113 ms) | 3 |
| **Gộp f** | | **trung vị 1917** | | **trung vị 0,110** | **19** | **14 / 5 lượt = 2,80/lượt** | **13** |

So sánh với các nhóm cũ (cùng phương pháp, cùng ma trận load4):

| Nhóm | CAP/lượt | rate trung vị | freeze-trong-đuôi-mở trung vị | RAM bắt đầu trung vị | load1 bắt đầu |
|---|---|---|---|---|---|
| pre-fix j | **0,00** (0/6) | 0,286 | 1179 ms | 2620 MB | 0,51–14,55 |
| post-fix k | 1,50 (9/6) | 0,213 | 4847 ms | 2033 MB | 2,57–10,64 |
| confirm r | 2,75 (11/4) | 0,144 | 4901 ms | 1940 MB | 0,56–7,96 |
| **F5 yên f** | **2,80 (14/5)** | **0,110** | **4900 ms** | **1917 MB** | **0,24–9,98** |

**Kết luận 1 — giả thuyết "tải song song" BỊ BÁC:** các lượt yên nhất (f4 load 1,16 → 4 CAP; f5 load 0,62 → 3 CAP; f6 load 0,24 → mẫu không load nổi trong 240 s) cho kết quả TỆ NHẤT, không tốt nhất. Load CPU lúc bắt đầu không còn tương quan gì với CAP khi đã tách ra: j8 load 14,55 → 0 CAP, f5 load 0,62 → 3 CAP. Tiêu chí đăng ký trước ở §5 (CAP/lượt về ~0) KHÔNG đạt — nợ KHÔNG đóng theo hướng này.
**Kết luận 2 — RAM vẫn là nghi phạm số 1, nhưng CHƯA ĐƯỢC KIỂM ở mức cao:** mọi lượt f đều chạy ở RAM bắt đầu 1464–2015 MB (dưới dải j 2173–2843 MB và dưới mục tiêu 2,5 GB). Quy luật "RAM < 2173 MB ⇒ luôn có CAP" nay mở rộng thành **29 CAP / 11 lượt** (k2, k4, k8, r3, r5, r8, f1–f5 — 11/11 lượt có ≥1 CAP), so với **5 CAP / 10 lượt** ở RAM ≥ 2173 MB (k3, k5, r2 là 3 ngoại lệ). Freeze-trong-đuôi-mở ở f vẫn 4900 ms (element + playhead đóng băng cùng nhau ~5 s) — đúng mẫu hình stall toàn pipeline do RAM/swap, không phải do tải CPU. Nhưng vì f không đạt RAM cao nên đây vẫn là tương quan, chưa phải chứng minh nhân quả — xem A/B §10.
**Kết luận 3 — 1 ca CAP "lành" trong f (f1, tuổi 5271 ms, drift 0,27, adv=1, không resync sau):** cùng mẫu p2/p6 — đuôi chạm trần khi drift đã về ≤ 0,35 nên không có resync; không phải f4-like. Tổng f: 14 CAP, 13 f4-like.
**Kết luận 4 — gate C3 vẫn làm đúng luật trên cây mới:** tailDriftGate 22 lần / 5 lượt (f chặn đáp xa bình thường), 0 lần đóng ADV2 khi drift vượt (tất cả 14 ca đều là đóng trần, tuổi 5004–5271 ms, adv=0 trừ ca lành adv=1). Không có hồi quy gate nào để báo.

## §9. Hồi quy (cây cuối, sau mọi kiểm chứng — F5 chưa sửa production)

- Chưa sửa production. Chỉ thêm 1 file probe mới (bản sao, không đổi logic): `apps/web/scripts/probe104f5.mjs` (`node --check` OK).
- tsc/vite build/test liên quan: chưa chạy (không có sửa production để hồi quy; nếu A/B §10 dẫn tới sửa production thì chạy đủ bộ khi đó).
- Verdict probe PASS 5/5 lượt hợp lệ; `playheadHold90R2.ts` md5 `00cce1ac` không đổi; preview.tsx md5 `ca378bbf` (F3 land trước đợt đo, xem §7).

## §10. A/B RAM cao (ĐANG CHỜ — watcher đã đặt, tối đa ~40 phút)

Vì §8 bác tải CPU nhưng chưa kiểm được RAM cao, bước tiếp theo (đúng hướng dẫn LIMITS §4 mục 5 — "nếu vẫn cao thì A/B có kiểm soát") là **A/B RAM**: chạy lại 2 lượt load4 (f6r gop250 — chạy lại lượt f6 lỗi — + f7 gop30) đúng lúc RAM khả dụng ≥ 2400 MB (trong dải j) và máy tương đối yên (load1 < 4, không sibling probe/browser nào đang chạy). Watcher `hidden_files/round104-f5/wait-hiram.sh` đang poll mỗi 45 s, tối đa ~37 phút:
- Nếu CAP/lượt ở RAM cao về ~0 (+ freeze-trong-đuôi-mở về ~1,2 s) → **RAM/swap là nguyên nhân (đủ để giải thích)** — nợ ĐÓNG, không đụng code; E4 không cần A/B.
- Nếu CAP/lượt ở RAM cao vẫn ~2,8 → **RAM bị loại** → chuyển sang A/B tắt E4 (§6) trong lượt sau (hoặc parent quyết — toggle production giữa lúc sibling đang sửa preview.tsx có rủi ro va chạm, không tự làm trong lượt này khi chưa có bằng chứng E4).
- Nếu không bắt được cửa sổ RAM cao trong ~37 phút → ghi rõ, nợ VẪN MỞ với RAM là nghi phạm số 1 chưa được kiểm ở mức cao; đề xuất đợt sau bắt cửa sổ RAM cao (thường xuất hiện ngay sau reboot, trước khi sibling kịp bật browser nặng).
- (Cập nhật sau khi watcher xong — xem §10b.)

## §10b. Kết quả A/B RAM cao — KHÔNG BẮT ĐƯỢC CỬA SỔ (watcher xong 09:52:26Z; điền bởi G4 đợt 105 sau khi kiểm đĩa)

Watcher `hidden_files/round104-f5/wait-hiram.sh` chạy **09:14:54–09:52:26Z** (37'32", đúng 50 check × 45 s), boot `cff65e89` (reboot #29), kết thúc bằng dòng `NO HIRAM WINDOW in ~37 min 2026-11-13T09:52:26Z`. Driver hiram `run-f5-hiram.sh` **KHÔNG chạy lần nào** — không có `run-f5-hiram.log` trên đĩa, 0 lượt f6r/f7, không có số CAP mới.

**RAM cao nhất ghi được: check 5 (09:17:55Z) — 2.356.708 kB = 2.301,7 MB — thiếu 43.292 kB (~42,3 MB) so với ngưỡng 2.400.000 kB.** Đếm lại độc lập từ đĩa (grep toàn bộ 50 dòng `avail=`): **0/50 check đạt ngưỡng** (top 5: 2.356.708 / 2.023.404 / 1.938.968 / 1.843.436 / 1.688.884 kB). Lưu ý: tại check 5, load1 = **4,25** — dù RAM có vượt ngưỡng thì gate load (load1 < 4,0) cũng chặn trigger; cửa sổ bị chặn kép.

**Diễn biến RAM trong 50 check (xem `wait-hiram.out`):**
- Check 1–4 (09:14:54–09:17:10Z): avail 892–959 MB, sibProcs 13–15 (sibling đang chạy probe/browser).
- Check 5 (09:17:55Z): nhảy vọt +1.429.752 kB (~+1,4 GB) lên 2.356.708 kB đúng lúc sibProcs về 0 — một process sibling thoát và giải phóng RAM. Đây là đỉnh duy nhất của cả phiên.
- Check 6–50: decay đều ~50–190 MB/check, từ 2.023 MB xuống **527 MB** lúc check 50 (09:51:41Z); `free` cuối phiên: avail 527 MB, swap đã dùng 406 MB. RAM không hồi phục quá ~1.010 MB sau check 26.
- Kết luận: cửa sổ RAM cao (nếu có) chỉ là spike thoáng qua < 1 chu kỳ poll (45 s), không phải cửa sổ ổn định — watcher poll 45 s khó bắt được dạng spike này.

**Đính chính (kiểm bởi G4 đợt 105, đối chiếu `wait-hiram.out` trên đĩa):** F9 ghi "watcher kết thúc 09:52:26Z, KHÔNG bắt được cửa sổ RAM cao" — **ĐÚNG, khớp từng giây, không cần đính chính.** Giờ kết thúc, số check (50), boot id (`cff65e89`) và RAM cuối phiên (527 MB) đều khớp file trên đĩa.

**Hệ quả:**
- A/B RAM cao **VẪN MỞ** — RAM vẫn là nghi phạm số 1 chưa được kiểm ở mức cao; không có bằng chứng mới nào thay đổi kết luận §8 (máy yên không giảm CAP; RAM < 2173 MB ⇒ 29 CAP/11 lượt).
- E4 A/B vẫn hoãn theo §10 — chỉ chạy sau khi RAM cao bị loại (CAP vẫn ~2,8 ở RAM ≥ 2400 MB) hoặc RAM cao chứng minh được nguyên nhân.
- **Bài học cho đợt sau (đã ghi chi tiết trong `docs/PHASE9_ROUND105_G4_REARM_LIMITS.md` §2–§4):** cửa sổ RAM cao duy nhất quan sát được trong ngày là 09:01:17Z (2.943 MB, boot+5 phút) và biến mất sau 19 s khi sibling bật Chrome; watcher F5 khởi động muộn (09:14:54Z, boot+18 phút) nên đã bỏ lỡ. Đợt sau phải chạy watcher **ngay sau reboot, trước mọi driver khác**, poll 45 s, tối đa ~37 phút.
- Stage: batch F5 chưa từng stage (file `phase9-round104-f5-rearm.txt` không tồn tại); G4 đợt 105 stage kèm trong `~/workspace/repo-1-push/paths-loop/phase9-round105-g4-rearm.txt` (gồm LIMITS này + `apps/web/scripts/probe104f5.mjs` + LIMITS G4).

## Phụ lục — file liên quan

- Phân tích: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round104-f5/` (`analyze-f5-cap-pattern.py`, `cap-pattern-rows.json`, `run-f5.sh`, `run-f5.log` (sau khi chạy), `probe-webkit-load4-gop*-f*/probe-results.json` + `probe-log.txt` (sau khi chạy)).
- Probe mới (F5, stage trong batch này): `apps/web/scripts/probe104f5.mjs` (bản sao probe103e5.mjs, chỉ đổi scratch).
- Doc tiền lệ: `docs/PHASE9_ROUND103_E5_REARM_LIMITS.md` (§4.2, §6), `docs/PHASE9_ROUND102_D6_REARM_LIMITS.md` (§2–§4), `docs/PHASE9_ROUND101_C3_REARM_LIMITS.md`, `docs/PHASE9_ROUND103_LIMITS.md` §4 mục 5 (nợ gốc).
- Stage (không push): đã stage bởi G4 đợt 105 trong `~/workspace/repo-1-push/paths-loop/phase9-round105-g4-rearm.txt` (file `phase9-round104-f5-rearm.txt` không tồn tại — F5 chưa từng stage; xem §10b).
