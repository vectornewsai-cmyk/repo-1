# Phase 9 đợt 71 — luồng Y3: re-gate bắt được FN của gate 6 s; resume-từ-pause KHỎE, không cần sửa production

**Ngày:** 09/11/2026 (10:23–10:40 +07, 3 phiên hoàn chỉnh + 2 phiên chết ở gate).
**Trạng thái:** ĐO XONG — VERDICT: **re-gate BẮT ĐƯỢC FN (1/1 phiên FN, 0/2 FP)**;
**resume-từ-pause KHÔNG đóng băng draw trong 5/5 probe** — KHÔNG sửa code production.
Harness gốc `measure-65r8-presented-fps.mjs` KHÔNG đổi; gate 6 s hiện tại KHÔNG đổi.
Không push (chỉ stage); không release/tag.

## 1. Kết luận (verdict)

| Câu hỏi | Trả lời |
|---|---|
| Re-gate (đo lại gate 1: seek-0, phát 6 s, sau slot 1) có bắt được FN của gate 6 s không? | **CÓ — 1/1 phiên FN.** Phiên S1: gate1a PASS delta 29, slot 0,4 / 1,0 fps (FN), re-gate **FAIL delta 18** → FN bị chặn. |
| Re-gate có gây false-positive trên phiên khỏe không? | **KHÔNG — 0/2 phiên khỏe.** S2 re-gate PASS delta 137, S3 PASS delta 149 (biên rất lớn). |
| FN này là loại nào — lạnh như V4-P1 hay tải? | **Tải:** S1 load vọt 0,67 → 10,77 trong phiên (luồng khác khởi động việc nặng). FN do máy chậm dần sau gate. **FN lạnh kiểu V4-P1 (load 0,5) KHÔNG tái hiện trong Y3** → bắt FN lạnh vẫn chưa chứng minh. |
| Resume-từ-pause có làm draw đóng băng không? | **KHÔNG, trong 5/5 probe** (2 pause dài + 2 pause ngắn + 1 pause dài): draw = ticks, rs=4 ở 250/250 mẫu, seeking 0/250, hold 0, syncReseeksVideo +1 tổng cộng. |
| Có cần sửa code production không? | **KHÔNG.** Không có đường code nào trong `preview.tsx` dự báo được stall 6–10 s trong khi element vẫn trình chiếu; freeze quan sát được là thoáng qua, tự hồi phục, và KHÔNG đặc thù resume (xem §4). |
| Giả thuyết X2 §4 (idle/holdFrame, rs=1 sau pause) thì sao? | **(a) idle: bác bỏ** — vòng lặp ngủ lúc pause đúng thiết kế nhưng tỉnh lại khi resume (wake qua subscribe), ticks chạy, hold = 0. **(b) rs=1: bác bỏ như bằng chứng freeze** — rs=1 ở mẫu cuối gate là artifact bình thường của justPaused-seek (xem §4.3). **(c) rAF bị bóp: chưa xác nhận, cũng chưa bác bỏ** — vẫn là vector duy nhất còn phù hợp với mẫu freeze, nhưng không có số đo trong cửa sổ freeze nào. |
| Đề xuất tiếp theo | **Nối re-gate vào harness đo presented-FPS như cửa kiểm tra THỨ HAI (phiên chết nếu gate1a HOẶC re-gate FAIL) — tạm thời, tiếp tục thu thập dữ liệu.** Không thay gate 1a, không đổi ngưỡng ≥ 20 khi chưa có thêm dữ liệu, không sửa production. |

## 2. Kết quả đo thật — 3 phiên hoàn chỉnh + 2 phiên chết ở gate

Clip `long1080.mp4` 20 s (h264 1080p 30 fps, GOP ~1,97 s, bitrate 16,6 Mbps),
canvas preview backing 871×275, Chrome headed + Xvfb, VM 2 vCPU/8 GB.
Launcher variant Y3 (dựa trên harness gốc, import qua data: URL): gate 1a giữ
nguyên 100%, thêm re-gate trước rep 2 (seek-0, phát 6 s, FAIL không dừng đo)
và 2 resume-probe lấy mẫu dày sau slot (A: pause dài ~2,5 s; B: pause ngắn
~1 s như X2 — B chỉ có từ phiên 2 trở đi, launcher v2).

| Phiên | Gate 1a (delta / load) | Slot draw fps (rep 1/2/3) | Re-gate (delta / load) | Verdict |
|---|---|---|---|---|
| **S1** (chạy lại) | **29 PASS** (4,83 fps), load 0,67 | **0,40 / 3,15 / 1,00** (mean 1,52; presented 15,9/22,2/15,0) | **18 FAIL** (3,0 fps), load 6,79 | **FN — re-gate BẮT ĐƯỢC** |
| **S2** | **34 PASS** (5,67 fps), load 2,65 | **16,28 / 21,45 / 22,08** (mean 19,94; presented ~30) | **137 PASS** (22,83 fps), load 2,98 | Khỏe — không FP |
| **S3** (chạy lại) | **44 PASS** (7,33 fps), load 0,78 | **22,57 / 20,66 / 23,47** (mean 22,23; presented ~30) | **149 PASS** (24,83 fps), load 0,70 | Khỏe — không FP |
| S1 lần 1 | FAIL delta 2 (load vọt 1,83 → 9,44 giữa gate; element cũng chậm: presented 14 frame/6 s) | — (dừng) | — | Gate chặn đúng phiên máy yếu |
| S3 lần 1 | FAIL delta 4 (load 1,59; element phát tốt: ct 5,567, presented 89 frame/6 s) | — (dừng) | — | **Freeze "sạch" ở gate** (xem §4.4) |

**Gộp Y3:** FN **2/9 slot** (Wilson 95% [6%, 55%]); phiên FN **1/3**; re-gate bắt
được **1/1**; re-gate FP **0/2** phiên không FN (Wilson [0%, 66%]).
**Gộp với dữ liệu cũ (V4 P1/P2 + X2 S4: 9 slot, FN 3/9):** FN **5/18 slot (28%)**,
Wilson 95% [12%, 51%] (trước Y3: 33%).

**Đọc đúng bảng:**
- S1 là phiên FN duy nhất của Y3, và nó là FN **do tải**: load 1-min đi 0,67 (gate)
  → 4,48 (slot 1) → 6,79 (re-gate) → 8,87 (slot 2) → 10,77 (slot 3). Slot 2 vẽ
  3,15 fps (qua ngưỡng 2 fps) trong khi slot 1 và 3 sụp — FN không đều trong phiên.
  Re-gate đo đúng trạng thái máy lúc đó (load 6,79) nên FAIL — cơ chế bắt FN là
  "đo lại trạng thái hiện tại", không phải "đo dài hơn".
- **Biên mỏng ở S1: re-gate delta 18 so với ngưỡng 20 — chỉ thiếu 2 draws.**
  Ngưỡng ≥ 20 (kế thừa từ gate 1a) chưa được hiệu chuẩn riêng cho re-gate; một lần
  chạy kém may mắn hơn là re-gate qua oan (delta 20–21) và FN lọt. Không hạ hay
  nâng ngưỡng khi chưa có thêm dữ liệu ở vùng 15–25.
- S2/S3 là 2 phiên khỏe nhất từng đo trên VM này (slot 16–23 fps, rAF gapP50
  33 ms, presented ~30 fps) — re-gate qua với biên 6–7× ngưỡng (137/149 vs 20).
  Không có dấu hiệu re-gate giết oan phiên khỏe.
- S1 lần 1 chết ở gate 1a đúng luật (gate làm đúng việc khi load vọt — như X2 §6).
  S3 lần 1 chết ở gate 1a với mẫu freeze sạch (xem §4.4) — đó là dữ liệu, không
  phải lỗi harness.

## 3. Resume-probe — resume-từ-pause KHỎE (5/5 probe)

Mỗi probe: phát 6 s như gate → pause (A: lấy mẫu dày 1,5 s; B: 1 mẫu sau ~1 s)
→ resume 10–14 s lấy mẫu dày ~200 ms (draw/hold/skip, ticks, sleeping,
lastDrawn/lastRequested, pendingSeek, cap W2/X2, syncReseeks, element
rs/ct/paused/seeking/q.total, mark) → pause. Probe B chỉ có ở S2/S3 (launcher v2).

| Probe | Draw fps | Hold / Skip fps | Presented fps | Ticks/s | rs=4 | Seeking | syncReseeksVideo |
|---|---|---|---|---|---|---|---|
| S1-A (pause dài) | 5,14 | 0 / 0,82* | 26,64 | 5,96 | 50/50 | 0/50 | 19 → 20 (+1) |
| S2-A (pause dài) | 19,90 | 0 / 0 | 30,02 | 19,90 | 50/50 | 0/50 | 7 → 7 (+0) |
| S2-B (pause ngắn) | 19,00 | 0 / 0 | 30,11 | 19,00 | 50/50 | 0/50 | 9 → 9 (+0) |
| S3-A (pause dài) | 23,05 | 0 / 0 | 30,07 | 23,05 | 50/50 | 0/50 | 7 → 7 (+0) |
| S3-B (pause ngắn) | 23,17 | 0 / 0 | 30,05 | 23,17 | 50/50 | 0/50 | 9 → 9 (+0) |

\* S1-A: skip 0,82 fps chỉ từ 2 bucket cuối khi ct chạm 20 (clip hết, clip 2
`mau-2.webm` kích hoạt — xem §6); phần resume sạch (+0 đến +12 s) vẽ 2,86–6,10 fps,
không skip. Tương tự, 6 mẫu `paused` của S1-A đều ở ct=20 (element ended).

**Gộp 5 probe (250 mẫu resume): rs=4 ở 250/250; seeking 0/250; hold 0,00 fps;
syncReseeksVideo +1 tổng cộng; mark element không đổi (`r8-rep3`) — không pool
drop/tạo lại; `decoderErrorRecoveredPlaying` +0; `pauseRetryExhausted` và
`seekFailureExhausted` đều false. Draw ≈ ticks trong mọi probe (tỉ lệ ~1,0) —
mỗi tick đều vẽ được, không hold/skip.**

**Pha pause (đo được chính xác ở S1-A/S2-A/S3-A, 10 mẫu/pha):**
- S1-A: seeking=true, rs=1 ở 2 mẫu đầu → seeking=false, rs=4 ở mẫu 3 (~0,4 s sau
  khi pause); pendingSeek true → false; lastDrawn null → 6,467 (vẽ +1 draw);
  sau đó vòng lặp ngủ (7/10 mẫu sleeping, ticks đóng băng ở 762).
- S2-A: đã rs=4 ngay mẫu pause đầu (seek xong trước cả mẫu đầu); ngủ 9/10 mẫu.
- S3-A: đã settle + ngủ 10/10 mẫu ngay từ đầu.
- **Pause-seek (justPaused) settle trong ≤ ~0,5 s và vòng lặp ngủ đúng thiết kế;
  resume đánh thức đúng (wake qua subscribe store) — ticks chạy lại ngay, draw
  tăng từ mẫu resume đầu tiên.**

**Probe B (pause ngắn ~1 s, mẫu shortPause ngay trước resume):** cả S2-B và S3-B
đều ghi `seeking=false, rs=4, pendingSeek=false, sleeping=true,
lastDrawn=lastRequested` — tức pause-seek đã xong + vòng lặp đã ngủ TRƯỚC khi
resume, dù pause chỉ ~1 s. Giả thuyết "resume cắt ngang pause-seek còn đang bay"
không tái hiện được: muốn cắt ngang thật phải resume trong < ~0,5 s sau pause,
ngắn hơn cả pause của X2 (~1,0–1,2 s).

## 4. Vì sao X2-S4 đóng băng — điều tra lại với dữ liệu Y3

### 4.1. Freeze là có thật, nhưng KHÔNG đặc thù resume
Mẫu freeze "draw ~1 fps trong khi presented ~15–21 fps" nay có 3 lần quan sát:
X2-S4 cửa sổ 2 (1,0 fps, presented 21), X2-S1 cửa sổ 2 partial (0,20 fps),
**Y3-S3 lần 1 ở gate 1a (0,67 fps, presented ~15 fps, load 1,59)**. S3-lần-1 là
quan trọng nhất: freeze đánh vào cửa sổ phát ĐẦU TIÊN sau seek-0, không có resume
nào trước đó. **Freeze không phải bệnh của resume-từ-pause** — nó là trạng thái
stall thoáng qua theo cửa sổ phát, có thể đánh vào bất kỳ cửa sổ nào (gate, cửa
sổ 2, slot), rồi tự hồi phục (slot của X2-S4 ngay sau cửa sổ 2 vẽ 8,5 fps).

### 4.2. Giả thuyết (a) — idle/holdFrame sau pause: BÁC BỎ (như nguyên nhân hệ thống)
Vòng lặp ngủ lúc pause là đúng thiết kế (T5) và tỉnh lại đúng khi resume; trong
5/5 cửa sổ resume, ticks chạy (3,7–30,7/s theo từng giây), hold = 0,00 fps —
không có holdFrame nào giữ khung cũ. `__vcutPreviewIdle.sleeping` chỉ true trong
pha pause, false trong toàn bộ pha resume (trừ mẫu biên). Không có bằng chứng
nào cho "ngủ quên sau pause".

### 4.3. Giả thuyết (b) — rs=1 sau pause: BÁC BỎ như bằng chứng freeze (đính chính X2 §3/§4)
X2 dùng `elRs16 = 1` (mẫu cuối cửa sổ 2) làm bằng chứng phụ cho cơ chế freeze.
Dữ liệu Y3 chứng minh đọc đó là sai: **rs=1 ở mẫu ngay sau pause là artifact
bình thường của justPaused-seek** — S1-A đo được rs 1 → 4 trong ~0,4 s sau khi
pause, trong khi draw vẫn tăng đều. Hơn nữa, mẫu cuối gate 1a của cả 3 phiên Y3
đều rs=1 (S1 delta 29, S2 delta 34, S3 delta 44 — đều PASS, vẽ khỏe), và mẫu
cuối re-gate của S1 cũng rs=1 (delta 18). **rs=1 tại một thời điểm lấy mẫu không
tương quan với draw trong cửa sổ** — nó chỉ nói element đang seeking tại thời
điểm đó (thường là seek vừa pause). Cơ chế freeze của X2-S4 vì vậy vẫn chưa rõ,
và không được suy từ elRs16 nữa.

### 4.4. Giả thuyết (c) — rAF bị bóp sau resume: CHƯA XÁC NHẬN, là vector duy nhất còn lại
Trong mọi cửa sổ ĐO ĐƯỢC (5 probe + 9 slot + 3 re-gate), draw ≈ ticks — tốc độ
vẽ bị khóa vào tốc độ tick rAF. Nếu ticks stall (~1/s) thì draw stall theo
(~1 fps), trong khi element vẫn trình chiếu độc lập (~15–30 fps) — khớp đúng
mẫu freeze (X2-S4: 10 draws/10 s; Y3-S3-lần-1: 4 draws/6 s). Nhưng **không có
cửa sổ freeze nào được lấy mẫu dày** (gate 1a cố tình không lấy mẫu để khỏi
nhiễu; X2 cửa sổ 2 cũng ngủ yên), nên ticks-trong-freeze vẫn là suy luận, chưa
phải số đo. Stall rAF 6–10 s rồi tự hồi phục là chuyện của lịch trình
compositor/trình duyệt dưới headed+Xvfb, không phải logic trong `preview.tsx`:
vòng lặp không thể ngủ lúc phát (`previewLoopShouldSleep` đòi `!playing`),
`decideVideoFrame` vẽ ngay khi rs ≥ 2, và không có đường code nào giữ draw
trong khi element trình chiếu. **Vì vậy không sửa production.**

### 4.5. Giả thuyết phụ — seek-to-mid-GOP đắt + re-seek storm: BÁC BỎ
Keyframe GOP ~1,97 s (59 frame) nên seek tới 6,567 s chỉ giải mã ~20 frame từ
keyframe 5,9 s (~0,7–1 s ở tốc độ decode phần mềm) — không đủ giải thích 10 s
đóng băng. Và đo thật: syncReseeksVideo chỉ +1 trong 5 probe (S1-A), +0 trong
4 probe còn lại; seeking 0/250 mẫu. Không có storm.

## 5. Thiết kế thử nghiệm Y3 (để đợt sau tái hiện hoặc bác bỏ)

- Launcher `apps/web/scripts/measure-71y3-gate-fn-launcher.mjs`: 21 thay thế trên
  harness gốc (kế thừa V4/X2: config vite `.cjs` pre-create, cổng hardcode
  5570/9670, pickDisplay bằng socket, ghi cuối best-effort), import qua data: URL,
  harness gốc KHÔNG sửa. Gate 1a + logic slot + đối chứng tab trắng giữ nguyên 100%.
- Re-gate: chèn vào đầu vòng slot (trước rep 2) — seek-0 + waitIdle + phát 6 s +
  pause, đo riêng delta1b, FAIL không dừng đo. Khoảng cách gate1a → re-gate:
  ~18 s từ lúc bắt đầu gate1a (≈ 11–12 s từ lúc gate1a kết thúc + 1 slot 10 s ở
  giữa) — vừa là "đo 2 lần seek-0 cách nhau ~10 s" vừa là "đo lại gate 1 sau 1 slot".
- Resume-probe A/B: như §3; mẫu dày ~200 ms qua `PROBE_FN` (toàn bộ
  `__vcutPreviewIdle` + `__vcutHoldStats` + element pool rs/ct/paused/seeking/
  networkState/error/q.total/mark + syncReseeks). Probe B thêm ở launcher v2
  (sau phiên 1) nên S1 chỉ có probe A.
- Phân tích `apps/web/scripts/analyze-71y3-gate-fn.mjs`: đọc JSON các phiên,
  in bảng gate-vs-slot, FN/FP + Wilson CI, tỉ lệ FN gộp với V4+X2, và phân tích
  resume-probe (tóm tắt + bucket theo giây + pha pause + mark).
- Môi trường: config vite `.cjs` pre-create tại `/tmp/round71-y3/vite.y3-presented.config.cjs`
  (file-tool, né EPERM); cổng 5570/9670; mỗi phiên một `R8_SCRATCH` riêng;
  mỗi phiên chờ load 1-min < 2,0 và 5-min < 3,0 trước khi chạy (vòng chờ tối đa
  ~40 phút). Burner-control (`Y3_BURNER=1`, đã cài trong launcher): **KHÔNG CHẠY**
  — S1 đã là FN do tải tăng tự nhiên và re-gate đã bắt được; burner tổng hợp chỉ
  chứng minh lại độ nhạy với tải, không thêm bằng chứng về FN tự nhiên.
- Kiểm chứng: `node --check` OK cả 2 script (launcher dry-run: 21 thay thế áp dụng
  đủ, variant 51.288 byte); analyzer chạy lại được trên JSON 3 phiên (117 dòng);
  `npx tsc --noEmit` apps/web **0 lỗi**, apps/desktop **0 lỗi** (không sửa code
  production nên không có hồi quy nào từ luồng này).

## 6. Giới hạn (trung thực)

- **n nhỏ:** chỉ **3 phiên hoàn chỉnh** (1 FN, 2 khỏe) + 2 phiên chết ở gate.
  Bắt FN 1/1 và FP 0/2 là bằng chứng hướng đúng, KHÔNG phải kết luận thống kê
  mạnh: Wilson 95% cho FP re-gate là [0%, 66%] — khoảng này vẫn rộng. Cần thêm
  phiên (đặc biệt thêm phiên FN) mới thu hẹp được.
- **FN lạnh chưa tái hiện:** S1 là FN do tải tăng; FN lạnh kiểu V4-P1 (load 0,5,
  slot 0,69 fps) không xuất hiện trong Y3. Re-gate bắt được FN do tải vì nó đo
  trạng thái hiện tại; có bắt được FN lạnh (decoder lạnh, không do tải) hay không
  vẫn CHƯA BIẾT — cần một phiên lạnh thật (vd chạy đầu tiên sau reboot) mới trả lời.
- **Biên mỏng:** re-gate S1 delta 18 vs ngưỡng 20 (thiếu 2 draws). Ngưỡng ≥ 20 kế
  thừa từ gate 1a, chưa hiệu chuẩn riêng cho re-gate. Không nên diễn giải "re-gate
  luôn bắt được FN" từ 1 lần bắt với biên 2 draws.
- **Freeze chưa có số đo trong cửa sổ:** 3 lần freeze quan sát được đều ở cửa sổ
  KHÔNG lấy mẫu dày (gate 1a, cửa sổ 2 của X2). Kết luận "rAF stall" ở §4.4 là
  suy luận từ draw ≈ ticks ở cửa sổ khỏe, chưa phải đo trực tiếp. Muốn bắt freeze
  trong cửa sổ thì cần probe phát liên tục có lấy mẫu dày — nhưng đặt probe đó
  vào gate sẽ nhiễu chính gate (overhead CDP như probe A/B đợt 68 đã chứng minh).
- **Nhiễu tải giữa các phiên:** S1 bị tải tăng trong phiên (luồng đợt 71 khác);
  S2/S3 lặng. Slot nhanh nhất (22–23 fps) và chậm nhất (0,4 fps) chênh nhau 50×
  giữa các phiên — mọi tỉ lệ gộp theo slot đều phải đọc theo phiên, không gộp mù.
- **Bucket +13/+14 s của probe S1-A là artifact chuyển clip** (ct chạm 20, clip 2
  `mau-2.webm` kích hoạt: skip 14,82 fps ở +13 s, draw 17 fps ở +14 s) — đã loại
  khỏi verdict resume; phần resume sạch là +0 đến +12 s.
- **Probe B thiếu 2 cờ cap trong summary JSON** (`pauseRetryExhausted`,
  `seekFailureExhausted` không ghi vào object resumeProbeB — chỉ có trong
  `samples`); analyzer đã đọc bù từ mẫu cuối (đều false). Không ảnh hưởng verdict.
- **Chỉ đo trên VM này** (2 vCPU/8 GB, không GPU, Chrome headed + Xvfb, clip
  long1080 20 s, canvas 871×275) và trong buổi sáng có sóng load từ các luồng
  song song. Số trên máy thật/khác clip sẽ khác — nhưng verdict re-gate là về
  THIẾT KẾ (đo lại trạng thái hiện tại sau slot 1), không phải về con số tuyệt
  đối, nên ít nhạy với máy đo hơn.
- **Không sửa gì trong production:** harness gốc không đổi; gate 6 s không đổi;
  không push (chỉ stage); không release/tag. Launcher v2 (probe B) chỉ dùng từ
  phiên 2 trở đi nên S1 không có probe B — không chạy lại S1 chỉ để bổ sung B
  (tốn phiên, verdict A đã đủ).
- **Quan sát phụ (không phải kết quả chính):** log inject clip dài ghi
  `"patched":0` ở cả 5 lần chạy nhưng clip vẫn thay đúng src (gate chạy đúng
  clip dài) — quirk ghi log có sẵn của harness, không điều tra thêm trong luồng này.

## 7. File và log

- Launcher thử nghiệm (mới, đã stage): `apps/web/scripts/measure-71y3-gate-fn-launcher.mjs`
  — `node --check` OK; dry-run 21 thay thế OK; chạy 5 lần (3 phiên hoàn chỉnh + 2 chết ở gate).
- Script phân tích (mới, đã stage): `apps/web/scripts/analyze-71y3-gate-fn.mjs` —
  `node --check` OK; chạy được trên JSON 3 phiên Y3, in verdict + Wilson CI + resume-probe.
- Doc này: `docs/PHASE9_ROUND71_Y3_GATE_FN_LIMITS.md`.
- Log luồng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round71-y3.md`.
- Log đo: `hidden_files/round71-y3/session1/` (chạy lại: hoàn chỉnh;
  lần 1 chết ở gate: chỉ có log console trong handoff, không JSON),
  `session2/` (hoàn chỉnh), `session3/` (chạy lại: hoàn chỉnh; lần 1 chết ở
  gate: không JSON). Mỗi session: `presented-fps.json`, `presented-fps.log`,
  `r8-presented-chrome.log`, `r8-presented-vite.log`, `r8-presented-done.png`.
  Kết quả phân tích gộp: `/tmp/round71-y3/analyze-final.txt` (tmpfs, mất khi reboot).
- Không stage: config vite `.cjs` trong /tmp (file sinh ra), ảnh
  `r8-presented-done.png` (binary), log luồng + log đo (goal workspace, không phải repo).
