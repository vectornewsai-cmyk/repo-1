# Phase 9 — Đợt 104: Đóng nợ LIMITS gộp đợt 103 §4 (2 MiB, ghost F8b, re-arm, blur r7, EPERM, G1, zombie, harness) — GỘP MỘT PHẦN

> Ngày: 13/11/2026. Lượt cron 15:35 +07. 9 luồng F1–F9 spawn song song; **3 luồng F2/F6/F7 về đủ** (LIMITS + log + batch stage). **F5 (Re-arm) CHƯA XONG** — LIMITS đã viết (phân tích dữ liệu cũ xong + đo live máy yên xong 5/6 lượt, 14 CAP) nhưng đang chờ watcher A/B RAM cao (`wait-hiram.sh`, tối đa ~37 phút) cho 2 lượt f6r/f7; chưa stage batch, chưa cập nhật LIMITS §10b. **F1 (G1), F3 (Ghost), F4 (Zombie), F8 (Harness), F9 (Verify) chưa về** — chỉ có dữ liệu đo thô (F1: 3 run deint 60fps; F3: script phân tích + preview JSON; F4: chains-spread/drawsgap; F8: run deint/N10; F9: poll.log đang poll). Parent gộp 3 luồng đã xong thay F1–F9. F1/F3/F4/F5/F8/F9 là nợ cho đợt 105. KHÔNG push. HEAD vẫn 5f548ef8.
>
> **Đính chính báo cáo worker:** worker nói "chỉ F2/F6 hoàn thành, F7 chưa về" là SAI — F7 đã về đủ (LIMITS + batch `phase9-round104-f7-eperm.txt` 1 entry trên đĩa, probe #23, mù #22 đóng hoàn toàn). Worker cũng nói F5 "chưa stage batch cuối" — đúng, nhưng LIMITS F5 đã viết xong phần phân tích + đo live (xem §1 F5 dưới đây).

## 1. Kết quả từng luồng

### F1 — G1: CHƯA XONG
- Chỉ có dữ liệu đo thô (3 run deint 60fps trong `round104-f1/`). Không LIMITS, không batch — nợ đợt 105.

### F2 — 2 MiB: HOÀN THÀNH (nợ §4 mục 2)
- **Refill tạo đoạn sai ĐÃ XÁC ĐỊNH — dataReceived của Range cuối cùng trước pull đầu tiên (R5/R6); adapter webkitwebsrc vô tội ở thời điểm pull; đoạn sai nằm trong cache push-phase nội bộ typefind.** Shim không ức chế bogus (10/12 run).
- Vì sao đúng 2.097.152 vẫn mở (có quan sát mới: run4 seek thật tới đúng 2097152 lần đầu trong 48 run gộp).
- Batch: 5 file text (`benchmarks/render/f2_adapter_probe.c`, `benchmarks/render/webkit_blob_flaky_104f2_2mib.mjs`, 2 JSON kết quả, LIMITS).

### F3 — Ghost: CHƯA XONG
- Chỉ có dữ liệu đo thô (script phân tích `analyze-f3*.py` + preview JSON trong `round104-f3/`). Không LIMITS, không batch — nợ đợt 105.

### F4 — Zombie: CHƯA XONG
- Chỉ có dữ liệu đo thô (`chains-spread.txt`, `chr-mixedalt-f4y1/2/3`, `drawsgap-all.txt`, script `drawsgap.py`/`freeze.py` trong `round104-f4/`). Không LIMITS, không batch — nợ đợt 105.

### F5 — Re-arm: CHƯA XONG (phân tích + đo live xong, chờ A/B RAM cao)
- **Kết luận phân tích dữ liệu cũ (§1–§6):** (1) Tái hiện độc lập đúng 20/20 ca CAP (9 CAP ở k + 11 CAP ở r, tuổi 5001–5313 ms, khớp từng ca với kiểm tay E5). (2) **Phát hiện mới — đóng băng TRONG LÚC ĐUÔI MỞ mới là chỉ số phân biệt:** trung vị freeze tối đa trong lúc đuôi mở: pre-fix j **1179 ms** vs post-fix k **4847 ms** vs r **4901 ms** — post-fix element + playhead đóng băng CÙNG NHAU ~4,9 s (freeze trong khi ph đang chạy chỉ 258–388 ms, so với 836 ms pre-fix) — toàn bộ pipeline stall, đuôi chỉ còn đường chạm trần 5000 ms. Đây là bằng chứng đo được cho cơ chế "decoder đói", không phải gate tính sai. (3) **RAM là biến môi trường phân tách mạnh nhất:** pre-fix j RAM 2173–2843 MB (trung vị 2620) — 0 CAP/6 lượt; post-fix k/r 1471–2344 MB (trung vị ~2000) — 20 CAP/10 lượt; 6/6 lượt RAM < 2173 MB đều có ≥1 CAP. (4) Load lúc bắt đầu KHÔNG phân tách (j 0,51–14,55 vs k/r 0,56–10,64, chồng lấn hoàn toàn) — "máy yên" phải định nghĩa bằng RAM + không probe song song, không phải loadavg. (5) **E5 fix KHÔNG THỂ là nguyên nhân trên phẳng** (chứng minh cấu trúc: flat === spec khi không có adjustment/nested → drift gate tính sau fix bằng đúng trước fix; công việc mới duy nhất mỗi tick là 1 lần ghi ref). (6) **E4 fix VẪN LÀ NGHI PHẠM CHƯA LOẠI ĐƯỢC** (confound hoàn hảo: E4 land 06:28:22Z; cả 6 lượt load4 k chạy SAU đó, cả 6 lượt load4 j chạy TRƯỚC đó; 2 đuôi CAP ở load2 (k7 5027 ms, k11 5107 ms) chạy TRƯỚC E4 land — E4 không phải điều kiện cần cho CAP). (7) Confound thứ ba — E3 CDP trùng cửa sổ k-load4 (run-a2 06:29 + run-b2 06:32, trùng đúng 5/6 lượt load4 k).
- **Đo live máy yên (lần 2, 09:01:36–09:11:32Z, KẾT QUẢ CHÍNH): 5/6 lượt hợp lệ, 14 CAP / 5 lượt = 2,80 CAP/lượt** (13 f4-like, tuổi 5004–5271 ms), rate trung vị 0,110×, freeze-trong-đuôi-mở 4900 ms, RAM bắt đầu 1464–2015 MB. **Máy yên KHÔNG làm giảm CAP — giả thuyết "tải song song" BỊ BÁC** (f4 load 1,16 → 4 CAP; f5 load 0,62 → 3 CAP). RAM vẫn là nghi phạm số 1 nhưng chưa được kiểm ở mức cao.
- **Đang chờ:** watcher A/B RAM cao (`wait-hiram.sh`, tối đa ~37 phút) — chạy f6r (gop250) + f7 (gop30) khi RAM ≥ 2400 MB và máy yên; sau đó cập nhật LIMITS §10b, stage batch, báo cáo. Reboot #29 ~08:56Z (boot 8c1c5131 → cff65e89) cắt ngang: driver lần 1 (08:57:46Z) fail toàn bộ 6 lượt do WebKit `libevent-2.1.so.7` thiếu trong cửa sổ boot+1–2 phút; không tính 6 lượt lỗi.
- F5 KHÔNG stage (chưa xong theo brief của chính luồng) — nợ đợt 105.

### F6 — Blur: HOÀN THÀNH (nợ §4 mục 6)
- **r7 VẪN MỞ — strip dài hơn BỊ BÁC offline** (stimulus tuần hoàn ~5 frame; suy biến nằm ở stimulus, không ở độ dài strip). Đo timing đăng ký trước: **0/13 ca A content gap 2, 8/10 ca rVFC content gap đúng 6 — bác mạnh "nội dung gap 2"**, đề xuất stimulus không tuần hoàn. B-band c0 kiểm chứng đăng ký trước không đủ bằng chứng (p=1,0, power 15%). **D floor gộp 0/1767** (CI trên 0,170%). Reboot #29 ~08:57Z cắt ngang 1 lượt, đã chạy lại.

### F7 — EPERM: HOÀN THÀNH (nợ §4 mục 7)
- **Probe #23 + khoảng mù #22 ĐÃ ĐÓNG HOÀN TOÀN** (05:40:24Z → 08:39:02Z, 2h58'38" — chứa đúng 2 reboot, cả hai đều có giờ chính xác từng giây). Quét writeFileSync theo chuẩn mới (đối chiếu snapshot E7 đợt 103); RAM hiện tại (birefnet: KHÔNG chạy — vẫn dưới ngưỡng guard).

### F8 — Harness: CHƯA XONG
- Chỉ có dữ liệu đo thô (run deint/N10 trong `round104-f8/`). Không LIMITS, không batch — nợ đợt 105.

### F9 — Verify: CHƯA XONG
- Chỉ có poll.log + poll.sh + watcher.sh (đang poll). Không LIMITS, không batch, không verify log — nợ đợt 105.

## 2. Ghi chú gộp parent

- **Báo cáo worker sai 2 điểm (handoff cũ):** (1) F7 đã về đủ — LIMITS + batch trên đĩa, probe #23, mù #22 đóng hoàn toàn; (2) F5 có LIMITS đã viết (phân tích + đo live xong) — chỉ còn chờ watcher A/B RAM cao. Parent kiểm từ đĩa, không tin handoff.
- F5 không stage vì brief chưa xong theo chính luồng (chờ watcher A/B RAM cao, cập nhật LIMITS §10b, rồi mới stage batch). Phân tích F5 ghi lại ở §1 trên để đợt 105 dùng tiếp, không cần đo lại.
- Không có log tổng đợt 104 nào trước parent gộp (grep "đợt 104" = 0) — mục gộp này là log đầu tiên của đợt.

## 3. Kiểm chứng parent (cây đã gộp)

- tsc web 0, desktop 0; vite build PASS (5,99s); r6-i18n-check PASS (dict 2767, không đổi); P7 8/8; orphans 17/17; css60 60/60; css61 60/60.
- playheadPacing 19/19; playheadHold 75/75; test-preview-engine.sh **354 assertions pass**; U4 failfast 141/141.
- Không chạy lại: F2/F6/F7 harness đo đầy đủ (tin LIMITS từng luồng + số đo JSON trên đĩa); O8 chưa chạy lại (F9 chưa xong — nợ đợt 105).

## 4. Nợ mở cho đợt 105

1. F1 G1 (chỉ có dữ liệu đo thô) + F3 Ghost + F4 Zombie + F8 Harness + F9 kiểm chứng độc lập + O8 cả 2 engine (chưa xong).
2. F5 Re-arm — chờ watcher A/B RAM cao (f6r gop250 + f7 gop30 khi RAM ≥ 2400 MB); RAM là nghi phạm số 1 cho CAP load4; E4 fix vẫn là nghi phạm chưa loại được; E3 CDP là confound thứ ba.
3. G1 đóng hay chưa — user quyết (metric G5 hay M2; E1 đợt 103 thêm Q5: mốc 80,0% đúng chóc của khung (c) có đủ không, hay cần đệm).
4. 2 MiB — refill tạo đoạn sai đã xác định (dataReceived Range cuối trước pull đầu, cache push-phase nội bộ typefind); shim không ức chế bogus (10/12 run); vì sao đúng 2.097.152 vẫn mở (run4 seek thật tới đúng 2097152 lần đầu trong 48 run gộp).
5. Ghost residual — F8 không land; hướng còn đứng: F8b nhãn bằng frame anchor THÔ + siết ngưỡng tươi anchor 500ms → ~50ms (đã đo: gate 50ms giữ anchor đúng 81–88%).
6. Blur parity — r7 vẫn mở; D floor gộp 0/1767; đề xuất stimulus không tuần hoàn; B-band c0 không đủ bằng chứng (p=1,0, power 15%).
7. EPERM: probe #24 + khoảng mù #23; cron riêng 10 phút vẫn chờ user quyết.
8. Birefnet-general trong gói: chỉ thử lại khi RAM đổi (quyết định parent đợt 92) — vẫn 0 lần chạy thành công.
9. TTS 39: vẫn chờ Gradio stable 7.x — **CẤM kiểm lại mỗi đợt**.
10. ci-security.yml + ci-build.yml: vẫn 403 (chờ user thêm tay qua web GitHub hoặc cấp quyền workflows cho App).
11. Release gate giữ nguyên: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 5. Batch đã stage (KHÔNG push)

- Đợt 104: 3 luồng, **8 entry / 3 file** (F2 5, F6 2, F7 1).
- Closing đợt 104: 2 entry (LIMITS gộp này + `PHASE9_GAP_ANALYSIS.md` §33).
- **Tổng chờ push sau đợt 104: 2470 entry / 375 file batch / 1503 file duy nhất** (đợt 67–103: 2460/371/1494; đợt 104: 10/4 — 8 entry luồng + closing 2 entry / +9 file duy nhất (LIMITS gộp mới + 8 file luồng mới; gap analysis đã stage từ trước. Đếm lại trực tiếp từ đĩa). HEAD vẫn 5f548ef8. KHÔNG push.
- F1/F3/F4/F5/F8/F9 không stage (chưa xong, không batch).
