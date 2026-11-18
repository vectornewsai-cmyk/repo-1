# PHASE9_ROUND134_T3_C2_LIMITS — T3 đợt 134 (tiếp): bước 2 với JSON partial + quyết định KHÔNG revert

> **Verdict: BƯỚC 2 KHÔNG CÓ DỮ LIỆU MỚI — P1–P7 ĐỀU KHÔNG KIỂM ĐƯỢC (0 attempt hợp lệ, 0 tick post-flip, 0 (c2)). Logger đã nới (preview.tsx 530e10a7) CHƯA ĐƯỢC KIỂM CHỨNG runtime (log draw partial n=53 toàn loop 1, 0 wrap — không chứng minh được cũng không bác bỏ được). KHÔNG REVERT trong đợt này: điều kiện revert theo quyết parent §12.1(a) là "revert SAU KHI ĐO" — đợt này chưa đo được lượt nào nên điều kiện chưa xảy ra. md5 cuối 530e10a7 (fix còn nguyên sau 4 reboot). Việc GIỮ hay REVERT là câu hỏi chờ quyết parent — T10 ghi vào §12 LIMITS gộp.**
> **Prereg ghost-freeze/skew ĐỨNG NGUYÊN theo kết quả đợt 133 (P1 5/5, P3 5/5, P2/P4 đúng; cộng dồn P1 14/14, P3 13/14) — không sửa prereg sau khi thấy dữ liệu. Ngưỡng lượt yên ≤60 ms GIỮ NGUYÊN (không có số mới).**

## 0. Môi trường lúc T3-tiếp đóng (01:06–01:20Z 18/11)

- Boot hiện tại: **cc1f9de0-4f66-49e3-91d7-4f3fab07ca39**, btime **2026-11-18T00:17:36Z** (tuổi ~50 phút lúc 01:07Z) — cùng boot T4 đóng lúc 01:00:55Z, **không reboot thêm** trong lúc T3-tiếp làm việc.
- RAM available lúc bắt đầu: **446 MB** (free -m 01:06:55Z; total 7934 MB, used 7487 MB).
- `~/workspace/repo-1` **không phải git repo** (`git status` → "fatal: not a git repository") — push đi bằng push-files, nên md5 là phương pháp đối chiếu file duy nhất; ghi rõ để T10 khỏi tìm git log.
- Chốt chặn `round-in-progress.md` còn đó — T3-tiếp KHÔNG xóa (chỉ T10 xóa).

## 1. Giai đoạn A — tóm tắt lại (T3 gốc, xong 23:47Z 17/11)

- Sửa instrumentation `apps/web/src/preview.tsx` theo quyết parent đợt 133 §12.1(a): md5 **805409f0 → 530e10a7** (đầy đủ `530e10a7266b8c148411ba21510b501a`).
- Nội dung sửa (chỉ đúng hunk `c2DrawLogPush`): (1) loop-gate nới — ghi mọi loop ≥1 (mặc định không giới hạn; `window.__vcutC2DrawLogMaxLoop = N` để giới hạn, `=2` khôi phục hành vi cũ); (2) re-enable KHÔNG xóa mảng / KHÔNG reset loopNo nữa (chỉ reset khi `window.__vcutC2DrawLogReset === true`); log vẫn mặc định tắt (chỉ ghi khi `window.__vcutC2DrawLog === true`); **không đổi hành vi render**.
- Kiểm chứng: **tsc 0 lỗi; vite build PASS** (13,01 s, 290 modules, `dist/index-BMVwYB-q.js`).
- Cờ `round134-t3-fix.done` có (mtime 23:48:59Z). Diff: `hidden_files/round134-t3/preview-fix.diff`. Bản gốc: `hidden_files/round134-t3/preview.tsx.orig-805409f0` (md5 `805409f0046dbf43358aeec95bf46f15` — đã đối chiếu lại, khớp).

## 2. Giai đoạn B — xác nhận md5 sau 4 reboot (01:07Z 18/11)

- `apps/web/src/preview.tsx` md5 = **530e10a7** — fix còn nguyên sau cả 4 reboot (d2e66749 → 81335571 → 52ca5d6d → 1d2e984d → cc1f9de0).
- Đối chiếu diff: `diff preview.tsx.orig-805409f0 preview.tsx` hiện tại cho đúng các hunk trong `preview-fix.diff` (thêm `c2DrawLogMaxLoop()`, nhánh reset có điều kiện, nới loop-gate; bỏ 3 dòng reset vô điều kiện + gate `> 2`) — **không có thay đổi nào ngoài diff đã duyệt**.
- T4 đã kiểm độc lập 3 lần trong lượt (00:13:45Z, 00:18:19Z, 01:00:55Z) đều 530e10a7; T3-tiếp kiểm lần thứ 4 lúc 01:07Z — nhất quán.

## 3. Giai đoạn B — bước 2 trên JSON partial attempt1 (phân tích độc lập)

### 3.1 Script bước 2 gốc KHÔNG chạy được trên JSON partial — ghi rõ, không giấu

- Chạy `t3-step2-verify.py` (script T3 gốc viết cho JSON đầy đủ, đã validate khô khớp 100% dữ liệu lượt #10) trên JSON partial → **crash `TypeError` tại dòng 92**: `flip.wallMs=None` nên `t.get("tBlend", 0) >= fwall + 2000` lỗi `unsupported operand ... NoneType + int`.
- Script chỉ kịp in 3 dòng đầu (file/size/sha256, engine, flip `afterPass=5 wallMs=None passes=2`) rồi dừng — **không có output phân tích nào từ script gốc**.
- Quyết định: **không sửa script gốc sau khi thấy dữ liệu** (sửa để chạy được trên partial cũng không tạo ra (c2) nào — xem §3.2; giữ script nguyên bản cho đợt sau dùng lại trên JSON đầy đủ). Phân tích partial bằng script riêng viết mới `t3-step2-partial-analysis.py` (chỉ đọc JSON gốc, tự tính lại mọi số, không dùng output của T4 làm đầu vào).
- Đây là sai số thiết kế của T3 gốc (ghi ở §7): script bước 2 không có nhánh xử lý JSON partial/`wallMs=None`.

### 3.2 Số liệu độc lập từ JSON gốc (khớp 100% với T4 — kiểm chứng chéo, không copy)

File: `hidden_files/round134-t4/preview-b-f3-flip-webkit-t4-attempt1.json-ABORTED-boot-d2e66749-reboot235317Z` — size **257.631 B**, sha256 `b402b3f3f83137a785303784eeb3a02c6653b1413b34552dce230533d3766bc6`, engine webkit 27.2, pageErrs=[], `partial=true`, `partialReason="sau pass"`.

| Hạng mục | Số độc lập (T3-tiếp) | T4 | Khớp? |
|---|---|---|---|
| flip | afterPass=5, wallMs=None (chưa tới) | như vậy | ✓ |
| passes | 2 (len) | 2 | ✓ |
| blendTick | n=23, seq 0→22, viaRvfc=0 toàn bộ, tBlend 10697→12787 | n=23 | ✓ |
| tick post-flip (cửa sổ prereg flip+2000) | **0** | 0 | ✓ |
| tickCost | n=27, median **58 ms** — **chỉ pre-flip, KHÔNG phải số lượt yên, KHÔNG dùng làm verdict** | không báo (đúng — T4 không dùng) | — |
| c2DrawLog | **n=53**: drawSrc 27 / rawUnit 26; loopNo {1: 53}, **wrap (loop≥2): 0**; frameIdx 0–65 (distinct 17); ct 0–2,167 s; wallMs 9696→12741 (span 3045 ms); srcKind 'canvas 1280x720' 53/53; readyState 4 53/53; seeking False 53/53 | n=53, y hệt | ✓ |

- Log draw chỉ phủ ~3 s đầu sau khi logger bật (chưa tới wrap đầu tiên) vì probe chết giữa pass 3 và JSON partial chỉ giữ snapshot tới lần ghi cuối.
- **Đọc đúng: 0 entry loop ≥3 — fix CHƯA ĐƯỢC CHỨNG MINH ở runtime.** Đây không phải bằng chứng chống lại fix (chưa có cơ hội ghi loop ≥3), cũng không phải bằng chứng ủng hộ — chỉ là "chưa kiểm được".

### 3.3 P1–P7: từng cái KHÔNG KIỂM ĐƯỢC (ghi rõ từng P, không bịa số)

- **P1 (curPix run ≥3 tick, (c2) gần run-end): KHÔNG KIỂM ĐƯỢC** — 0 tick post-flip → 0 run, 0 (c2); không có k/n, không có p.
- **P2 (100% (c2) lag ≥ +1f, 0 lag âm): KHÔNG KIỂM ĐƯỢC** — 0 (c2); không có lag nào để đếm.
- **P3 (A1, đóng băng-tại-tick): KHÔNG KIỂM ĐƯỢC** — 0 (c2); không có cặp tick kề để so labelMs.
- **P4 (thuần +1f 2–8; tổng skp=0 2–12; skp=1 = 0; lag ≥+5f = 0): KHÔNG KIỂM ĐƯỢC** — (c2) skp=0 = 0 và skp=1 = 0; số 0 ở đây là "không có dữ liệu", KHÔNG phải "đạt 0".
- **P5 (snap-label median 34–48 ms; raw-label 8–10 ms; label-floor +1 63–76%; run ≥3 tick 13–22): KHÔNG KIỂM ĐƯỢC** — không có ghostPix post-flip (snap/raw/label-floor/run: n/a).
- **P6 (khoảng thực nghiệm 8 lượt, KHÔNG verdict): KHÔNG KIỂM ĐƯỢC** — không có ghost occ post-flip (histogram: n/a).
- **P7 (log draw phủ ≥1 seq (c2), drawSrc không trễ sau ct): KHÔNG KIỂM ĐƯỢC** — log n=53 toàn loop 1, 0 wrap; không có (c2) để đối chiếu; logger mới chưa được kiểm chứng runtime.
- Prereg đứng nguyên — không sửa prereg sau khi thấy dữ liệu. Ngưỡng ≤60 ms GIỮ NGUYÊN (9 lượt trước: 49,5 / 40,0 / 52,0 / 47,5 / 44,0 / 54,0 / 40,0 / 56,0 / 39,5 ms, trung bình 46,9 ms).

## 4. Đối chiếu chéo với T5 pha 2

- **T5 pha 2 CHƯA CÓ lúc T3 đóng** — không có cờ `round134-t5.done`, không có LIMITS T5 trong `repo-1/docs/` (chỉ có T1, T2, T4, T6, T7, T9). Thư mục `round134-t5/` lúc 01:07Z chỉ có state postboot/watcher (b85/b86/b87), file `t5-c2-drawlog-analysis.py` (analyzer của T5) nhưng **không có output phân tích nào trên dữ liệu đợt 134**, và cờ `POSTBOOT_PASS` cũ đã đổi tên `.stale-d2e66749`.
- Ghi chú từ build-loop-log (parent): T5 vẫn đang chạy; pha 2 của T5 cũng sẽ là không có dữ liệu mới (postboot cho boot mới chưa PASS).
- → **T10 đối chiếu T5 pha 2 khi đóng sổ.** Không có khớp/khác nào để ghi ở đây; không suy đoán kết quả T5.

## 5. Giai đoạn C — quyết định KHÔNG revert (có căn cứ, không máy móc)

- Điều kiện revert theo quyết parent đợt 133 §12.1(a) là **"revert SAU KHI ĐO"** — nhưng đợt này **0 attempt hợp lệ, chưa đo được lượt nào** (lượt yên #11 không đo được; xem LIMITS T4). Điều kiện revert **chưa xảy ra**.
- Vì vậy T3-tiếp **KHÔNG revert trong đợt này**. Lý do:
  - (a) Điều kiện revert chưa xảy ra (chưa đo được lượt yên nào với logger đã nới).
  - (b) Revert bây giờ sẽ hủy sửa chẩn đoán đã duyệt **trước khi nó được kiểm chứng runtime lần nào** — đợt 135 sẽ phải sửa lại từ đầu để đo lại lượt yên #11/#12.
  - (c) Bản gốc **805409f0 vẫn còn nguyên** tại `hidden_files/round134-t3/preview.tsx.orig-805409f0` (đã đối chiếu md5 lại §1) nên revert sau vẫn làm được trong 1 bước, không có rủi ro mất bản gốc.
  - (d) Việc GIỮ hay REVERT là **câu hỏi chờ quyết parent** — T10 sẽ ghi vào §12 của LIMITS gộp, parent quyết ở main chat. T4 (chủ đo) cũng đề xuất GIỮ fix cho đợt 135 — T3-tiếp đồng ý với đề xuất này, nhưng quyết cuối thuộc về parent.
- **preview.tsx KHÔNG đưa vào stage file đợt này** (net-change của đợt này đối với file đó là sửa đã duyệt nhưng chưa revert — ghi rõ trạng thái md5 cuối trong LIMITS này; T10 sẽ đối chiếu md5 lúc đóng). Stage file `phase9-round134-t3-c2.txt` chỉ chứa LIMITS này (1 entry).
- Nếu parent quyết REVERT ở đợt 135: revert = copy `preview.tsx.orig-805409f0` đè lên `apps/web/src/preview.tsx`, verify md5 về 805409f0, tsc + vite build lại, rồi mới đo lượt yên tiếp theo bằng logger cũ (hoặc đo lại với logger đã nới trước rồi mới revert — tùy quyết parent).

## 6. Trạng thái sau đóng (kiểm cuối 01:07–01:20Z 18/11)

- preview.tsx md5 cuối: **530e10a7** (fix còn nguyên).
- Boot cc1f9de0 còn sống; không reboot thêm trong lúc T3-tiếp làm việc.
- Vite :5187 đã chết (theo T4); không process đo nào còn chạy của T3-tiếp (chỉ đọc file + chạy script phân tích).
- Cờ `round134-t3.done` sẽ được ghi khi LIMITS + stage xong (ghi tóm tắt: bước 2 không có dữ liệu mới; KHÔNG revert — chờ quyết parent; md5 cuối 530e10a7).
- Hồ sơ: `hidden_files/round134-t3/` — `preview-fix.diff`, `preview.tsx.orig-805409f0`, `t3-step2-verify.py`, `t3-step2-dryrun-133a1.txt`, `t3-step2-partial-analysis.py`, `t3-step2-partial-134a1.txt`, `wait-t4.sh`, `wait-t4.log`.

## 7. Sai số của chính T3 (gốc + tiếp) — ghi trung thực

1. **Nhãn ngày sai trong wait-script (T3 gốc):** `wait-t4.sh` dòng 16 log `cutoff=2026-11-17T22:30:00Z` nhưng epoch in kèm là `1794965400` = **2026-11-18T01:30:00Z** (đã kiểm bằng `date -u -d @1794965400`). Comment đầu file cũng ghi sai ngày: "tới hạn cắt 01:30Z 17/11/2026". **Epoch hạn cắt là đúng** — code tính `CUTOFF_EPOCH=$(date -u -d "2026-11-18 01:30:00 UTC" +%s)` nên hạn cắt thực tế chạy là 01:30Z 18/11; dòng log poll "còn ~100 phút tới hạn cắt" lúc 23:49:47Z cũng khớp epoch này (100 phút = tới 01:30Z). Chỉ nhãn hiển thị sai (sai cả ngày 17→18 và giờ 22:30→01:30); hành vi chờ không bị ảnh hưởng. Nhãn "T3-133"/"T3 dot 133" trong cùng script cũng là copy từ đợt 133 (thư mục đúng là round134-t3) — sai nhãn, không sai hành vi.
2. **Script bước 2 không chịu được JSON partial (T3 gốc):** `t3-step2-verify.py` crash `TypeError` khi `flip.wallMs=None` (§3.1) — không có nhánh xử lý partial. Đã ghi nhận, không sửa sau khi thấy dữ liệu; đợt sau nên thêm guard `wallMs is None → báo "không có dữ liệu post-flip" và dừng có kiểm soát` thay vì crash.
3. **Wait-script chỉ chạy được 1 poll rồi bị reboot #1 giết** (log `wait-t4.log` chỉ 3 dòng, poll duy nhất 23:49:47Z) — T3 gốc kết thúc phiên 23:47Z, wait-script chạy nền bị giết cùng reboot; T3-tiếp không chạy lại wait (cờ `round134-t4.done` đã có lúc bắt đầu, 01:04Z).
4. **Đếm dòng diff (nhỏ, không ảnh hưởng verdict):** cờ fix.done ghi diff "60 dòng"; T4 ghi "36 dòng +/-"; T3-tiếp đếm lại `preview-fix.diff` có **34 dòng nội dung +/-** (không tính header `---`/`+++`). Chênh nhau do cách đếm khác nhau, không phải do nội dung diff khác — diff đã đối chiếu khớp §2.
5. **Ghi chú nhỏ:** T4 LIMITS ghi `passesDone=2`; T3-tiếp đọc `results.b.passesDone` được `None` — số 2 pass được xác nhận bằng `len(passes)=2`, không dùng trường `passesDone` (có thể nằm ở cấp khác trong JSON partial). Không ảnh hưởng kết luận.

## 8. Câu hỏi cho parent (T10 đưa vào §12 LIMITS gộp)

1. **GIỮ hay REVERT fix 530e10a7 cho đợt 135?** T3-tiếp + T4 đề xuất GIỮ (điều kiện revert "sau khi đo" chưa xảy ra; revert lúc này phí lần sửa đã duyệt). Nếu parent quyết REVERT: revert bằng bản gốc đã lưu (§5), verify md5 805409f0 + build lại.
2. **Lượt yên #11 chạy lại đợt 135 với logger đã nới?** (Nếu giữ fix: đo lại lượt yên #11 bằng logger 530e10a7 để kiểm chứng loop ≥3 lần đầu; nếu revert: đo bằng logger cũ và P7 tiếp tục không kiểm được.)
