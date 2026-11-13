# Phase 9 đợt 69 — luồng W8: gate presented-FPS 6 s có bỏ lọt suy giảm ở slot sau không?

**Ngày:** 09/11/2026. **Trạng thái:** PHÂN TÍCH XONG (offline, không đo mới, không Chrome).
**Nợ đóng:** V4 đợt 68 §6 — gate chỉ kiểm tra 6 s đầu (trạng thái mượt nhất); slot 10 s sau đó
có thể vẽ kém hơn nhiều (phiên 1: gate 7,5 fps → slot 0,69 fps).
**Kết luận ngắn:** CÓ, gate 6 s bỏ lọt suy giảm — false-negative 3/6 slot (50%, Wilson 95%:
19–81%, n nhỏ). Gate qua không dự báo được slot tốt: gate cao hơn (45) lại đi kèm slot tệ
hơn (0,69 fps) so với gate thấp hơn (35 → slot 6,11 fps). **Đề xuất: đợt sau THỬ NGHIỆM
gate mở rộng (cửa sổ 2: giây 6–16, delta ≥ 20) — thiết kế + prototype đã sẵn, chưa nối
production — nhưng chỉ áp dụng sau khi thử nghiệm đo thật xác nhận giả thiết A1 (§5).**

## 1. Cơ chế gate hiện tại — đối chiếu code thật (không đoán)

Harness gốc `apps/web/scripts/measure-65r8-presented-fps.mjs` (dòng ~535–558), launcher V4
giữ nguyên 100% logic này:

1. Tắt 3 enhance (denoise/stabilize/deinterlace) → seek playhead về 0 → `waitIdle`.
2. `draw0 = STATE_FN().hold.draw` (bộ đếm tích lũy `__vcutHoldStats.draw`).
3. Bấm Space (phát) → `sleep(6000)` → bấm Space (dừng) → `sleep(400)`.
4. `drawAfter`, `drawDelta = drawAfter − draw0`; lấy mẫu element (`SLOT_SAMPLE_FN`) + hook.
5. **PASS khi TẤT CẢ:** `drawDelta ≥ 20` VÀ element tồn tại VÀ `rs ≥ 1` VÀ `w > 0` VÀ
   `ct > 0` VÀ có `srcAttr` VÀ hook baseline (denoise/stabilize/deinterlace đều off,
   đúng clip). Ngược lại throw — dừng cả lần đo, không ghi số.
6. Sau gate, mỗi rep: seek 0 → waitIdle → đánh dấu element → phát → `sleep(10000)` →
   lấy mẫu cuối → draw của slot = `(b.draw − a.draw) / dtSecs` (cùng bộ đếm draw).

**Điểm mù cấu trúc:** gate và slot đều bắt đầu từ seek-0 + waitIdle (trạng thái "vừa đệm
xong, mượt nhất"), nhưng gate chỉ lấy mẫu **6 s đầu**, slot lấy mẫu **10 s**. Mọi suy giảm
khởi phát sau giây thứ 6 (lag tích lũy → syncMedia re-seek ngưỡng 0,35 s → element kẹt
seeking, `rs < 2` → `decideVideoFrame` hold/skip) đều nằm ngoài cửa sổ gate. Gate đo "element
có vẽ được không lúc mới phát", không đo "element có vẽ TIẾP được không".

**Số đo gate thật (log launcher V4, không lưu trong JSON):** phiên 1 (lạnh): draw 2 → 47
(delta **45**, ct 6,871, `q.total` 39 — element đã trình chiếu chậm ngay trong gate);
phiên 2 (ấm): draw 2 → 37 (delta **35**, ct 6,7, `q.total` 71). Cả 2 đều PASS (≥ 20).

## 2. Kết quả phân tích — gate-pass có dự báo được slot tốt không?

Nguồn: `hidden_files/round68-v4/presented-1080p-idle/presented-fps.json` (phiên 1) và
`.../presented-1080p-idle-run2/presented-fps.json` (phiên 2). Script phân tích:
`apps/web/scripts/analyze-69w8-gate-window.mjs` (chạy lại được bằng `node`).

| Phiên | Gate delta (6 s) | Gate fps | Slot draw fps (rep 1/2/3) | Slot draw mean | Slot presented mean |
|---|---|---|---|---|---|
| P1 lạnh | 45 | 7,50 | 0,49 / 0,98 / 0,60 | **0,69** | 11,77 |
| P2 ấm | 35 | 5,83 | 8,31 / 5,12 / 4,90 | **6,11** | 23,68 |

- **False-negative** (định nghĩa W8: gate PASS nhưng slot draw < 2 fps — ngưỡng "preview gần
  như đứng hình"): **3/6 slot = 50%**, Wilson 95% **[19%, 81%]**. Toàn bộ 3 FN tập trung ở
  phiên lạnh (3/3 slot), phiên ấm 0/3. FN là hiện tượng theo PHIÊN, không rải đều theo slot.
- **Tương quan:** Pearson r(gateDelta, slot draw) = **−0,925**; r(gateDelta, slot presented)
  = **−0,894** — ÂM, ngược kỳ vọng. Gate cao hơn (45) đi kèm slot tệ hơn 8,9×.
  ⚠️ Đọc đúng: chỉ có 2 giá trị gate khác nhau (45 vs 35) nên r này thực chất là so sánh
  2 nhóm (point-biserial). KHÔNG được diễn giải "gate càng cao slot càng tệ" tổng quát.
  Kết luận đúng duy nhất: **gate 6 s không phân biệt được 2 phiên có slot chênh nhau 9×**
  (cả 2 PASS với delta tương đương 45 vs 35).
- **Trong phiên, slot ổn định:** P1 cả 3 slot đều < 1 fps; P2 cả 3 slot đều ≥ 4,9 fps.
  Biến thiên chính nằm GIỮA phiên (lạnh/ấm), không phải giữa các rep trong phiên.

## 3. Time-course draw — suy giảm có phải quy luật theo thời gian?

JSON presented KHÔNG có time-course (slot chỉ lưu tổng cuối), nên phân tích theo từng
khoảng 2 s chỉ làm được trên probe A/B (`gate-ab/gate-ab.json`, 3 lần, mẫu ~0,5–1 s,
phát liên tục ~10–12 s, cùng clip long1080):

| Lần | 0–2 s | 2–4 s | 4–6 s | 6–8 s | 8–10 s | 0–6 s | Sau 6 s | Sau/trước |
|---|---|---|---|---|---|---|---|---|
| A1 | 3,85 | 1,76 | 1,75 | 2,11 | 3,62 | 2,41 | 3,12 | 1,29× |
| B2 | 3,31 | 2,51 | 3,30 | 4,95 | 3,60 | 3,04 | 4,98 | 1,64× |
| A3 | 2,63 | 3,87 | 3,65 | 4,29 | 4,58 | 3,39 | 4,80 | 1,42× |

Trong phiên A/B (máy khỏe, load ~1, RAM khả dụng 2,6 GB), tốc độ vẽ KHÔNG sụp sau 6 s —
dao động 1,7–5,0 fps theo bucket, thậm chí nhanh dần (tỉ lệ sau/trước 1,29–1,64×).
**Suy giảm của phiên lạnh không phải quy luật theo thời gian chung** — nó là đặc thù
trạng thái phiên (cache lạnh → lag → re-seek storm), không xuất hiện trong phiên khỏe.
Hệ quả: dữ liệu hiện có KHÔNG chứa time-course nào của phiên lạnh sau giây 6 — cửa sổ
6–16 s ở phiên lạnh là điểm mù, chỉ có thể ước lượng qua giả thiết A1 (§5), không đo trực tiếp.

**Lưu ý phương pháp:** tốc độ tuyệt đối của probe A/B (2,4–3,4 fps trong 6 s đầu) thấp hơn
gate harness thật (5,8–7,5 fps) vì probe lấy mẫu liên tục (overhead CDP cạnh tranh vòng
rAF), còn harness ngủ yên 6 s không lấy mẫu. Vì vậy KHÔNG được so sánh delta tuyệt đối
giữa A/B và gate harness — chỉ dùng tốc độ sau-6-s/tỉ lệ trong cùng probe (đại lượng tương
đối, ít nhạy với overhead). Ngưỡng gate 6 s (≥ 20, tức ≥ 3,33 fps) vốn đã sát với tốc độ
của phiên khỏe khi có overhead lấy mẫu — một cảnh báo phụ: ngưỡng này ít biên an toàn.

## 4. Thiết kế gate mở rộng (chỉ thiết kế + prototype, CHƯA nối production)

Prototype: `apps/web/scripts/measure-69w8-gate-extended-prototype.mjs`
(`node --check` OK; `--replay` / `--simulate p1|p2|a1|collapse` chạy không cần Chrome).

- **Giữ nguyên gate 1** (6 s, delta ≥ 20 + điều kiện element/hook) — KHÔNG sửa, KHÔNG hạ chuẩn.
- **Thêm cửa sổ 2 RIÊNG BIỆT:** sau gate 1, phát TIẾP từ vị trí dừng (KHÔNG seek lại) thêm
  10 s (giây ~6–16), đo `delta2 = drawAt16 − drawAt6`. PASS khi `delta2 ≥ 20` (≥ 2,0 fps).
- **Vì sao phải đo riêng, không kéo dài gate 1 thành 16 s rồi đếm tích lũy:** đếm tích lũy bị
  45 draws của 6 s đầu "gánh" (45 + ~7 = 52 ≥ 20 → vẫn PASS oan). Chỉ tốc độ RIÊNG của
  giây 6–16 mới bắt được sụp đổ. Đây là điểm thiết kế quan trọng nhất.
- **Ràng buộc clip:** long1080 dài 20 s; gate 1 kết thúc ở ct ≈ 6,7–6,9 s nên cửa sổ 2 kết
  thúc ở ct ≈ 17 s, còn 3 s biên. Nếu ct cuối gate 1 > 10 s thì verdict là INCONCLUSIVE
  (không kết luận FAIL) — prototype đã cài guard này, và đã bắt được 1 bug thật trong lúc
  thử (guard ban đầu dùng ct sau cửa sổ 2 ≈ 17 s nên luôn INCONCLUSIVE oan; đã sửa sang
  dùng ct cuối gate 1 — xem log luồng).
- **Chi phí:** +10 s phát/lần chạy (~+25% thời gian; gate từ ~7 s lên ~17 s wall).
- **Ngưỡng 2,0 fps:** tách được cả 3 nhóm dữ liệu hiện có (P1 FAIL, P2 PASS, A/B PASS với
  biên nhỏ nhất 56% — A1: delta2 ≈ 31 vs ngưỡng 20). Ngưỡng ≥ 3 fps sẽ giết oan phiên
  khỏe (A1 sau-6s chỉ 3,12 fps, biên 4%). Ngưỡng 1,5 vs 2,0 fps chưa phân biệt được —
  không có dữ liệu phiên nào ở 1,5–2,0 fps.

## 5. Replay mô hình — giảm false-negative kỳ vọng (ƯỚC LƯỢNG, không phải đo thật)

**Giả thiết A1 (CHƯA kiểm chứng, là điểm yếu lớn nhất của phân tích này):** tốc độ vẽ ở
cửa sổ 2 (phát liên tục giây 6–16, không seek lại) ≈ tốc độ vẽ trung bình của slot 10 s
cùng phiên (phát từ seek-0). A1 có thể SAI nếu sụp đổ do SEEK gây ra (mỗi rep seek lại
mới sinh re-seek storm) chứ không phải do phát liên tục quá 6 s — khi đó cửa sổ 2 (không
seek) có thể vẫn khỏe trong khi slot sụp, và gate mở rộng sẽ KHÔNG bắt được FN. Chỉ có
đo thật mới phân biệt được 2 cơ chế này.

Dưới A1:

| Phiên | Gate 1 | Cửa sổ 2 ước lượng (delta2/10 s) | Verdict mở rộng |
|---|---|---|---|
| P1 lạnh | 45 PASS | ≈ 6,9 (0,69 fps) | **FAIL ở gate 2 — FN bị chặn** |
| P2 ấm | 35 PASS | ≈ 61,1 (6,11 fps) | PASS |
| A1/B2/A3 (sau-6s đo trực tiếp) | n/a (probe) | ≈ 31 / 50 / 48 | gate 2 PASS |

**FN 3/6 → 0/6 (ước lượng mô hình).** Mô phỏng `--simulate collapse` (7,5 fps 6 s đầu →
0,69 fps sau đó) xác nhận logic prototype: gate 1 PASS delta 45, gate 2 FAIL delta 7 —
đúng mẫu lỗi P1; gate 6 s cũ sẽ PASS oan mẫu này. Mô phỏng `--simulate p2` (6,11 fps
hằng số): PASS cả 2 cửa sổ (delta 37 / 61).

## 6. Kết luận — có nên đề xuất đợt sau thử nghiệm gate mở rộng?

**CÓ — đề xuất thử nghiệm, với 3 điều kiện:**

1. **Thử nghiệm, không áp dụng ngay:** nối prototype vào một bản sao/variant của harness
   (như cách V4 làm launcher variant qua data: URL — KHÔNG sửa harness gốc), chạy đo thật
   ít nhất 2 phiên (1 lạnh sau reboot + 1 ấm) và so sánh verdict gate mở rộng với slot
   draw thực tế. Chỉ khi đo thật xác nhận A1 (cửa sổ 2 FAIL đúng các phiên có slot < 2 fps
   và PASS các phiên khỏe) mới cân nhắc thay gate production.
2. **Thử nghiệm phải đo được cơ chế:** ghi thêm time-course draw (mẫu 1 s) trong cửa sổ 2
   để phân biệt "sụp do phát lâu" vs "sụp do seek" — nếu cửa sổ 2 khỏe nhưng slot vẫn sụp
   thì A1 sai và thiết kế này vô dụng, phải quay lại thiết kế khác (ví dụ: gate đo 2 lần
   seek-0 cách nhau 10 s thay vì phát liên tục).
3. **Giữ nguyên gate 6 s hiện tại cho đến khi có kết quả thử nghiệm.** Không hạ chuẩn ≥ 20,
   không thay ngưỡng cửa sổ 2 (2,0 fps) khi chưa có dữ liệu phiên ở vùng 1,5–2,0 fps.

**Căn cứ số liệu cho đề xuất:** FN đã quan sát thật 3/6 slot (50%, CI 19–81%); gate 6 s
được chứng minh không phân biệt được 2 phiên chênh nhau 9× về slot draw; mô hình cửa sổ 2
tách được cả 3 nhóm dữ liệu hiện có với biên ≥ 56%; chi phí chỉ +10 s/lần chạy. Rủi ro
chính đã nêu rõ: A1 chưa kiểm chứng, và gate chặt hơn sẽ làm chết nhiều lần đo hơn trên
máy yếu (đổi lấy số đo đáng tin hơn — đúng mục đích của gate).

**Nếu đợt sau không thử nghiệm** thì chấp nhận FN đã đo (50% trên 6 slot, tập trung ở
phiên lạnh) và phải ghi rõ trong mọi báo cáo presented-FPS rằng: "gate PASS không bảo
đảm slot vẽ tốt; số slot draw < 2 fps vẫn có thể xuất hiện sau gate PASS".

## 7. Giới hạn (trung thực)

- **n nhỏ:** 6 slot, 2 phiên + 3 lần A/B. Tỉ lệ FN 50% có CI 95% rộng 19–81% — chưa đủ
  mẫu để kết luận thống kê mạnh. Mọi con số "giảm FN" đều là ước lượng mô hình, không
  phải kết quả đo.
- **Giả thiết A1 chưa kiểm chứng** (xem §5): cửa sổ 2 liên tục có thể không tái hiện được
  sụp đổ của slot (nếu sụp do seek). Đây là rủi ro thiết kế lớn nhất.
- **Không có time-course của phiên lạnh sau giây 6:** JSON presented chỉ lưu tổng cuối
  slot; A/B chỉ đo phiên khỏe. Không thể trích draw theo từng 2 s cho phiên lạnh.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb) với clip long1080
  20 s, canvas 871×275. Không suy ra ngoài VM/clip khác.
- **Gate delta trong JSON:** `presented-fps.json` không lưu số gate; số gate 45/35 lấy từ
  log launcher V4 (đã đối chiếu với LIMITS V4 §3/§7). Mọi số slot đều trích trực tiếp
  từ JSON.
- **Prototype chưa chạy headed:** chỉ `node --check` + replay/mô phỏng fake clock. Logic
  nối CDP thật (5 hàm inject) chưa được kiểm chứng trên trình duyệt thật — đó là việc
  của đợt thử nghiệm.
- **Không sửa gì trong production:** harness gốc `measure-65r8-presented-fps.mjs` không đổi;
  gate hiện tại không đổi; không push (chỉ stage).

## 8. File và log

- Script phân tích (mới): `apps/web/scripts/analyze-69w8-gate-window.mjs` — đọc 3 JSON V4,
  in bảng gate-vs-slot, FN + Wilson CI, Pearson r, bucket 2 s của A/B, replay gate mở rộng,
  độ nhạy ngưỡng. Chạy: `node apps/web/scripts/analyze-69w8-gate-window.mjs`.
- Prototype gate mở rộng (mới): `apps/web/scripts/measure-69w8-gate-extended-prototype.mjs` —
  `decideExtendedGate` (thuần túy) + `runExtendedGate` (I/O inject) + `--replay` /
  `--simulate p1|p2|a1|collapse`. `node --check` OK; replay + mô phỏng đều chạy đúng.
- Doc này: `docs/PHASE9_ROUND69_W8_GATE_WINDOW_LIMITS.md`.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round69-w8-gate-window.md`.
- Nguồn dữ liệu (không sửa): `hidden_files/round68-v4/presented-1080p-idle/presented-fps.json`,
  `.../presented-1080p-idle-run2/presented-fps.json`, `.../gate-ab/gate-ab.json`.
- Không stage: file log luồng (goal workspace, không phải repo).
