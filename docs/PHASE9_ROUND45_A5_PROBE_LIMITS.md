# Phase 9 đợt 45, luồng A5 — Probe: sweep đính chính "GOP thưa" từng dòng + chạy lại chuỗi chain — LIMITS

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG ghi qua GitHub
connector, KHÔNG release/tag, KHÔNG binary, KHÔNG dist vào repo.
KHÔNG tự stage batch paths-loop (parent gộp, theo tiền lệ Z5).
Luồng này CHỈ sửa comment trong 1 file probe (`per-seek-probe.mjs`)
+ thêm 1 test khóa 45A5 + file này — không sửa docs cũ trực tiếp,
không sửa preview.tsx, store.ts, tsconfig.json, bridge, hay file
của luồng khác (đặc biệt không đụng preview.tsx của luồng A6).

Đọc trước: `docs/PHASE9_ROUND44_Z5_PROBE_LIMITS.md` §2 (phương pháp
stss + bảng §2.2/§2.3/§2.4) và §2.5 (danh sách hệ quả chưa sửa từng
dòng — chính là đầu vào của sweep này), `docs/PHASE9_ROUND44_LIMITS.md`
§4 mục 6 (nợ giao cho đợt 45).

## 0. Kết luận ngắn

1. **Sweep "GOP thưa" từng dòng ĐÃ XONG ở mức bảng đính chính (§2).**
   Quy tắc phân biệt duy nhất vẫn là của Z5: `-g 300` (đặt encoder)
   ≠ GOP hiệu dụng (hộp `stss` đo được). File `sparse-gop-noise.mp4`
   đặt `-g 300` nhưng scenecut chèn keyframe mỗi 30 frame → GOP hiệu
   dụng 30 (= 1 s ở 30 fps), nên mọi nhãn "GOP thưa" / "GOP 300" gắn
   với file này là SAI; mọi nhãn gắn với `sparse-gop-flat.mp4` hoặc
   `noise-30s.mp4` (Q3, `-sc_threshold 0`) là ĐÚNG. A5 đo lại stss
   độc lập (§1) và khớp đúng số của Z5.
2. **19 dòng §2.5 của Z5 + echo tổng hợp đều SAI nhãn, số đo vẫn đứng.**
   Đó là: T5 (4 dòng), pipe fallback T5 (2 dòng), U5 (3 dòng),
   T6 đợt 39 (2 dòng — đáng chú ý: chính tài liệu T6 đo đúng
   GOP=30 bằng ffprobe ở L57–60 nhưng vẫn gọi file là "GOP thưa"),
   V3 (2 dòng), T2-perseek (1 dòng), LIMITS tổng hợp đợt 37/38/39
   (5 dòng). Đọc các dòng đó kèm bảng này: **số đo latency vẫn đứng,
   chỉ diễn giải "thưa" là sai** (GOP hiệu dụng 30 = 1 s, bằng GOP dày).
   A5 KHÔNG sửa trực tiếp docs cũ — bảng §2 là đính chính đầy đủ,
   test khóa `gop-sparse-correction-45a5.test.mjs` giữ bảng này.
3. **2 comment mơ hồ trong file probe đã sửa tại chỗ (chỉ comment,
   không đổi logic).** `per-seek-probe.mjs` từng viết "fixture
   sparse-gop: 300 frame @30fps = 10 s" mà không ghi rõ là file phẳng
   — nay ghi rõ `sparse-gop-flat` + cảnh báo không phải file noise.
4. **Chuỗi chain đầy đủ solo→Q6→N2 sau sửa copy frozen-dist:
   CHAIN-OK (§3).** Nợ Z5 §4 mục 2 nay ĐÃ ĐÓNG: cờ `N2_PERSEEK=1`
   chảy qua đủ 3 tầng, soloReport present, 33 entry, validate 0
   problem, Q6 labeled mang perSeek khớp N2 (33 = 33), frozen-dist
   VALID. Lỗi ENOENT cũ KHÔNG tái hiện nên `freeze-dist.mjs` giữ
   nguyên, không sửa.
5. **Nợ còn lại: trần 1000 trên element preview thật vẫn MỞ** (§4) —
   cần đường asset HTTP trong app, đợt này không làm vì đụng
   preview.tsx của luồng A6 (đúng như giao).

## 1. Đo lại stss độc lập (parse hộp, không giải mã)

Script Python đọc cây box moov (không dùng số của Z5 làm đầu vào):

| File (scratch ngoài repo) | stss | GOP hiệu dụng | Kết luận |
|---|---|---|---|
| `tmp-round34-q2/sparse-gop-noise.mp4` (419.967.521 byte) | 30 mục, [1, 31, 61, …], cách nhau 30 | 30 (= 1 s) | Nhãn "GOP thưa"/"GOP 300" SAI |
| `tmp-round27-k4/sparse-gop-flat.mp4` (45.369 byte) | [1, 301, 601] | 300 (= 10 s) | Nhãn "GOP 300" ĐÚNG |
| `tmp-round34-q3/wc/noise-30s.mp4` (210.771.214 byte) | [1, 301, 601] | 300 (= 10 s) | Nhãn "GOP 300" ĐÚNG |

Grep toàn repo (trừ node_modules/dist): 355 dòng chứa "GOP 300" /
"sparse-gop" / "GOP thưa" (Z5 đếm 46 dòng chỉ cho "GOP 300" — số
355 là hợp cả 3 mẫu, không mâu thuẫn). Phân loại đầy đủ ở §2: chỉ
liệt kê từng dòng cho tập SAI + MƠ HỒ + đã-đính-chính; tập ĐÚNG
liệt kê theo nhóm file (toàn bộ đều là file phẳng / noise-30s /
noise-1080-15s đã kiểm chứng ở Z5 §2.4, A5 đối chiếu lại stss ở
bảng trên thay vì đếm lại từng dòng phẳng).

## 2. Bảng audit từng dòng

Cách đọc: "SAI" = nhãn thưa/300 gắn với file noise (GOP hiệu dụng
30). "Số đo vẫn đứng" áp dụng cho MỌI dòng SAI dưới đây: độ trễ
seek/frame đầu muộn là hiện tượng thật của đường element cũ trên
file 420 MB, chỉ cơ chế giải thích ("phải giải lại GOP dài") là sai
— với GOP 30, mỗi seek chỉ giải lại tối đa ~30 frame từ keyframe
gần nhất, nên độ trễ 9–13 s không thể đổ cho độ dài GOP mà thuộc
về seek-chase/tải/guard như T5/U5/T6 đã chẩn đoán ở phần khác.

### 2.1 SAI — dòng §2.5 của Z5, nay đính chính bằng bảng này (không sửa gốc)

| File | Dòng | Nội dung cũ (tóm tắt) | Đính chính A5 |
|---|---|---|---|
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L48 | "element seek đuổi target trên GOP thưa" (guard K4) | File đo là noise (GOP 30): guard chặn seek chưa khớp là đúng, nhưng không phải vì GOP thưa |
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L112 | "File: sparse-gop-noise … GOP thưa" | SAI nhãn: GOP hiệu dụng 30; kích thước 419.967.521 byte và mọi số blob/heap vẫn đúng |
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L250 | "element đang seek đuổi target ngược trên GOP thưa" | Như L48 |
| `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` | L318 | "Frame thật đầu tiên tới muộn ~9–12 s trên file GOP thưa 420 MB" | Số 9–12 s vẫn đứng; nguyên nhân không phải GOP thưa |
| `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` | L40 | "Trên file noise GOP thưa 420 MB, element seek đuổi target ngược" | SAI nhãn; tiêu chí PARTIAL (firstContentIndex, nền 12,67) vẫn đúng |
| `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` | L308 | Thông báo PARTIAL nhắc "trên GOP thưa" | SAI nhãn; verdict PARTIAL vẫn đúng |
| `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` | L207 | "File: sparse-gop-noise … (420 MB, GOP thưa, như T5)" | SAI nhãn, kế thừa từ T5 |
| `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` | L234 | "muốn frame sớm hơn trên file GOP thưa này vẫn cần cải tiến đường element" | Nhu cầu cải tiến vẫn đúng; lý do không phải GOP thưa |
| `docs/PHASE9_ROUND38_U5_MOBILE_DPR_LIMITS.md` | L283 | "Fallback frame đầu muộn ~9–13 s trên file GOP thưa 420 MB vẫn mở" | Số 9–13 s vẫn đứng; nhãn sai |
| `docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md` | L26 | "Cải tiến đường element cho frame đầu muộn trên file GOP thưa 420 MB" | SAI nhãn; chẩn đoán seek bay 1,2–6,8 s + sửa bypass guard vẫn đứng |
| `docs/PHASE9_ROUND39_T6_MOBILE_DPR_LIMITS.md` | L57 | "File GOP thưa: … keyframe mỗi 1 s (GOP=30, đo bằng ffprobe)" | Nhãn SAI nhưng số trong cùng dòng ĐÚNG: chính dòng này tự chứng minh GOP=30 — đây là bằng chứng nội bộ mạnh nhất cho đính chính |
| `docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md` | L25 | "(frame đầu 17,808 ms → 6,886 ms trên file GOP thưa)" | Số T6 vẫn đứng (không đo lại trong V3); nhãn file sai |
| `docs/PHASE9_ROUND40_V3_PAUSE_T0_LIMITS.md` | L214 | "chạy lại diag fallback của T6 trên file GOP thưa 420 MB" | Như trên; nợ đo lại vẫn mở, không đổi |
| `docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md` | L165 | "chi phí giải mã lại từ keyframe của GOP thưa" | File đo ở L120 là noise (GOP 30): chi phí giải lại tối đa ~30 frame, không phải 300; kết luận "seeked chỉ bắn khi frame đã sẵn" vẫn đứng |
| `docs/PHASE9_ROUND37_LIMITS.md` | L72 | "đường element cũ đuổi seek trên GOP thưa — nợ của đường element cũ" | Echo của T5; nhãn sai, nợ vẫn đúng |
| `docs/PHASE9_ROUND37_LIMITS.md` | L153 | "GOP thưa 420 MB) thuộc về luồng sở hữu preview" | Echo của T5; như trên |
| `docs/PHASE9_ROUND38_LIMITS.md` | L56 | "(frame thật đầu muộn ~9–13 s trên file GOP thưa 420 MB)" | Echo của U5; số đứng, nhãn sai |
| `docs/PHASE9_ROUND38_LIMITS.md` | L172 | "muộn ~9–13 s trên file GOP thưa 420 MB cần cải tiến đường element" | Echo của U5; như trên |
| `docs/PHASE9_ROUND39_LIMITS.md` | L92 | "muộn trên file GOP thưa 420 MB: mỗi seek bay 1,2–6,8 s…" | Echo của T6; số đứng, nhãn sai |

Không sửa dữ liệu đo: 2 file JSON `benchmarks/results/v37-t5-fallback-clicktest.json`
và `v38-u5-fallback-clicktest.json` mang cùng câu "GOP thưa — độ trễ
của đường element cũ" — đây là bản ghi đo, đọc kèm bảng này, không
sửa (theo đúng quyết của Z5 §2.5). File `v39-t6-fallback-diag-*.json`
chỉ ghi đường dẫn file noise, không mang nhãn thưa — không phải claim.

### 2.2 SAI gốc — ĐÃ có ghi chú đính chính Z5 ở đợt 44, A5 không sửa lại

- `docs/PHASE9_ROUND41_W5_PROBE_V2_LIMITS.md` (fixture "GOP 300"):
  đã có ghi chú Z5 sau dòng fixture; số perSeek W5 vẫn đứng.
- `docs/PHASE9_ROUND42_X5_PROBE_CHAIN_LIMITS.md` ("GOP 300 — cùng
  fixture W5"): đã có ghi chú Z5; kết luận CHAIN-OK không phụ thuộc
  GOP nên vẫn đứng (và §3 dưới đây chạy lại chain độc lập).
- `apps/web/scripts/per-seek-probe-chrome-cap-run.mjs` (header +
  comment seek): Z5 đã sửa thành GOP hiệu dụng 30 + mốc seek rơi
  đúng keyframe 1 s.
- 3 pipe clicktest (`clicktest-reverse-hold-pipe.mjs`,
  `clicktest-round30-m2-forward-pipe.mjs`,
  `clicktest-round31-n2-reverse-fps-pipe.mjs`): Z5 đã thêm ghi chú
  rằng các dòng "GOP thưa (1 keyframe / 300 frame)" mô tả tiền đề
  lượt K4 trên file PHẲNG, không phải file noise mặc định của pipe.
  Các dòng còn lại trong 3 pipe nhắc "GOP thưa" (vd comment "lần
  chạy GOP thưa thấy pass xuôi cũng có 54 hold") đều chỉ lượt K4
  trên file phẳng — ĐÚNG trong ngữ cảnh đó, đọc kèm ghi chú Z5.
- `docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md` +
  `docs/PHASE9_ROUND33_LIMITS.md` + comment
  `apps/web/src/lib/reverseDecodeAhead.ts`: Z5 đã ghi chú "GOP 300"
  của P5 là cửa sổ decode 300 frame (clip P5 tự tạo có 5 keyframe
  do scenecut), số 31,9 fps vẫn đứng.

### 2.3 MƠ HỒ — làm rõ, không kết luận sai

| Chỗ | Vấn đề | Đọc đúng |
|---|---|---|
| `apps/web/scripts/per-seek-probe.mjs` (trước A5) | Comment "fixture sparse-gop: 300 frame @30fps = 10 s" và "fixture sparse-gop 10 s" không ghi rõ file nào | ĐÃ SỬA tại chỗ (2 hunk `ROUND45-A5`, chỉ comment): đó là `sparse-gop-flat`, KHÔNG phải file noise (GOP hiệu dụng 30) |
| `docs/PHASE9_ROUND39_T2_PERSEEK_PROBE_LIMITS.md` L48 + `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs` L79 | Ví dụ "sparse-gop 300 frame @30fps → 10 s" / "fixture sparse-gop 300 frame" | Chỉ đúng cho file phẳng (hoặc noise-30s Q3); với file noise thì đoạn 10 s chứa 10 GOP, không phải 1 GOP — nhóm theo đoạn khi đó chỉ là khoảng thời gian mô tả (chính T2 §3.3 đã ghi rõ điểm này) |
| `docs/PHASE9_ROUND27_K4_REVERSE_HOLD_LIMITS.md` L196–197 | "bản nhiễu sparse-gop-noise đã tạo nhưng không dùng — GOP thưa một mình đã…" | "GOP thưa" ở đây chỉ tiền đề file phẳng (file noise đã tạo nhưng KHÔNG dùng cho số hold); không phải claim về file noise |
| `docs/PHASE9_ROUND40_V4_SETTLE_RULER_LIMITS.md` L188 | Liệt kê "file GOP thưa" trong các trường hợp chưa đo, không nêu tên file | Mơ hồ chung, không gắn file cụ thể — không sửa; nếu hiểu là file noise thì sai, nếu là footage thưa nói chung thì đúng |
| `docs/PHASE9_ROUND42_LIMITS.md` L28/L163 + `docs/PHASE9_ROUND43_LIMITS.md` L18 | Chỉ tiêu nợ "GOP thưa > 32 MiB qua Range" | KHÔNG phải claim về file noise: Y1 sau đó đo đúng nợ này bằng fixture riêng 66,62 MiB, GOP 90 frame (Y1 §3.1) — "thưa" ở đây là nghĩa chung (GOP 90), không phải file noise |
| `docs/PHASE9_ROUND32_O5_REVERSE_WEBCODECS_LIMITS.md` L218 | "footage nhiễu/thật (ví dụ sparse-gop-noise.mp4)" | KHÔNG phải claim GOP: chỉ nêu file làm ví dụ footage nhiễu cần đo lại, không gọi nó là thưa/300 |
| `apps/web/scripts/probe-round37-t5-blob-cancel-pipe.mjs`, `probe-round36-s4-file-heap-pipe.mjs` | Chỉ ghi đường dẫn file noise, không gắn nhãn GOP | KHÔNG phải claim — không sửa |

### 2.4 ĐÚNG — đã kiểm chứng, KHÔNG sửa (đừng đảo ngược hàng loạt)

- Toàn bộ nhãn "GOP thưa / GOP 300" gắn với file PHẲNG
  (`sparse-gop-flat.mp4`, stss [1,301,601]): K4, L2, M2, N2, O5
  (phần phẳng), Q1, Q6, R1, S1, T1, U6, `seek-ab-solo-run.mjs`,
  `probe-round35-r4-webcodecs-gpu-pipe.mjs` (phần phẳng) — đúng
  theo Z5 §2.4, A5 đối chiếu lại stss ở §1.
- Toàn bộ nhãn gắn với file nhiễu Q3/S3 (`noise-30s.mp4`,
  `noise-1080-15s.mp4`, stss [1,301,601] / [1,301]): Q3, R4, S3 —
  đúng (đặt `-sc_threshold 0`).
- Y5 LIMITS (§0.3/§3.3: chính nơi phát hiện file noise không phải
  GOP 300), ROUND43_LIMITS (chỉ ghi nợ đính chính), ROUND44_LIMITS
  (ghi đúng "noise thực chất GOP 30"), Z5 LIMITS, T2-perseek §3.3
  (cảnh báo segment ≠ chỉ số GOP với footage không đều) — đúng,
  không sửa.
- Lưu ý ranh giới: từ "sparse" trong TÊN FILE `sparse-gop-noise.mp4`
  là tên đặt từ lúc tạo (kỳ vọng -g 300), không phải đo lường —
  tên file giữ nguyên (đổi tên sẽ vỡ mọi script/scratch tham chiếu),
  chỉ nhãn diễn giải mới phải đọc kèm đính chính.

## 3. Chạy lại chuỗi chain đầy đủ sau sửa copy frozen-dist (nợ Z5 §4.2 — ĐÃ ĐÓNG)

Lệnh (từ gốc repo, scratch/display/port riêng tránh đụng các luồng
đợt 45 khác):

```
N2_PERSEEK=1 N2_PERSEEK_GOP_SEC=10 node \
  apps/web/scripts/per-seek-probe-chain-run.mjs \
  --fixture ~/workspace/tmp-round27-k4/sparse-gop-noise.mp4 \
  --scratch /tmp/round45-a5/chain1 --display :97 --port 4197
```

Kết quả (evidence `/tmp/round45-a5/chain1/probe-chain-evidence.json`,
scratch ngoài repo, không stage):

- **CHAIN-OK** (tiêu chí của script: soloReport present +
  perSeekEnabled true), exit 0. Chuỗi không gãy ở bước nào.
- Tầng solo: `N2_PERSEEK=1` giữ nguyên, `GOP_SEC=10`, đủ 6/6 khóa Q6.
- Tầng Q6: frozen-dist bundle `index-DQV-DvFX.js`, 254 file,
  validity VALID, problems []; labeled mang perSeek (kế thừa Y5).
- Tầng N2: perSeekEnabled true, soloReport present, **33 entry,
  validate 0 problem**, max mẫu seeking/entry 33, dropped 0.
  Q6 labeled perSeek entries = 33 = N2 → `q6PerSeekMatchesN2: true`.
- N2 verdict riêng là PARTIAL (harness exit 1) dưới tải under-load
  (load1 trước-xuôi 2,3 / trước-ngược 2,17, fps xuôi 0,342, fps ngược
  0,507) — đây là verdict đo của N2, KHÔNG phải lỗi chuỗi: tiêu chí
  CHAIN-OK chỉ kiểm tra cờ chảy qua 3 tầng, như X5. Số 33 entry
  (X5: 32) khác lượt chạy, không so sánh như hồi quy.
- Lỗi ENOENT cũ của `cpSync` KHÔNG tái hiện: copy frozen-dist qua
  `freezeDist` chạy 1 lần thành công, đích VALID. Vì vậy
  `freeze-dist.mjs` giữ nguyên — A5 không sửa file này (đúng điều
  kiện "chỉ sửa khi chain tái hiện lỗi cũ").
- Lưu ý: `N2_PERSEEK_GOP_SEC=10` là tham số nhóm đoạn của harness,
  không phải claim GOP của fixture: với file noise (GOP 1 s) thì
  segment 10 s chứa 10 GOP — summary theo segment chỉ mang tính mô
  tả (đúng cảnh báo T2 §3.3). CHAIN-OK không phụ thuộc GOP.

## 4. Cái gì CHƯA làm (nợ còn lại — không mạo nhận, không ép đóng)

1. **Trần 1000 trên element preview thật (MediaPool) vẫn chưa đo:**
   cần đường asset HTTP trong app — hiện chưa có; số Z5 §1 là mức
   app-page (element đo nằm ngoài preview), không được trích thành
   "preview đã chạm trần". Đợt này KHÔNG làm vì đụng preview.tsx
   của luồng A6 (đúng giao).
2. **Docs cũ vẫn mang nhãn sai tại chỗ:** đính chính sống ở bảng §2
   này (+ ghi chú Z5 ở §2.2), không phải ở từng dòng gốc — người đọc
   tương lai phải đọc kèm bảng này. Đây là lựa chọn có chủ ý theo
   luật "docs cũ không sửa trực tiếp" của luồng, không phải sót.
3. **Bản ghi đo JSON (v37/v38) giữ nhãn cũ** theo quyết Z5 (không
   sửa dữ liệu) — đọc kèm §2.1.
4. **Nợ đứng chung:** phiên solo A/B thật + phiên quiet có điều phối
   vẫn chờ cửa sổ yên từ main chat; Safari / máy thật / footage
   B-frame / đường WebCodecs vẫn chưa đo cho trần 1000.

## 5. Kiểm chứng đã chạy (lệnh + số thật)

- `node --check` cho `per-seek-probe.mjs` (sau sửa comment) và test
  mới → pass.
- `node --test` 3 file → **11/11 pass, 0 fail**: test mới 45A5 4/4,
  test Z5 cũ 3/3 (giữ đính chính đợt 44), test freeze-dist 4/4.
- `npx tsc --noEmit -p apps/web/tsconfig.json` → không đụng file
  .ts nào nên không chạy lại tsc (thay đổi duy nhất là comment
  .mjs + test .mjs mới, ngoài phạm vi tsc của app).
- Chain đầy đủ §3: CHAIN-OK, exit 0 (xem số §3).
- Đo stss §1: Python parse hộp moov, khớp Z5 (noise 30 mục cách
  nhau 30; flat và noise-30s [1,301,601]).

## 6. File đổi/thêm (chỉ của A5 — text, không binary, không dist)

- Mới: `docs/PHASE9_ROUND45_A5_PROBE_LIMITS.md` (file này).
- Mới: `apps/web/scripts/gop-sparse-correction-45a5.test.mjs` (4 test
  khóa bảng đính chính + comment probe + freezeDist trong chain).
- Sửa: `apps/web/scripts/per-seek-probe.mjs` (2 hunk comment
  `ROUND45-A5`, không đổi logic: "sparse-gop" → "sparse-gop-flat"
  + cảnh báo không phải file noise).
- Không sửa: `apps/web/scripts/freeze-dist.mjs` (chain không tái
  hiện lỗi cũ nên giữ nguyên), mọi docs cũ (chỉ đính chính bằng
  bảng §2), mọi file của luồng khác, preview.tsx, store.ts,
  tsconfig.json, bridge, paths-loop, build-loop-log. Không push,
  không tag, không stage batch (parent gộp).
- Scratch ngoài repo (không stage): `/tmp/round45-a5/` (chain1 +
  evidence JSON), `/tmp/round45-a5-grep.txt` (grep 355 dòng).
