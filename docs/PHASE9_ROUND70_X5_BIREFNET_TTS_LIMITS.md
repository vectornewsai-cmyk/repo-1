# LIMITS — Phase 9 đợt 70, luồng X5: đo lại tốc độ birefnet sau bump + kiểm tra lại TTS gradio

Ngày: 09/11/2026 (lượt cron 06:35 +07). Đóng nợ đợt 69 §4 mục 5
(W1: birefnet chưa đo lại tốc độ sau bump; W7: gradio 6.31.0 vẫn kẹp
pillow<13). KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG chạm
venv TTS thật, KHÔNG thử bump lại. Mọi số dưới đây là số đo thật.

## 0. Kết quả — tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Birefnet fps sau bump | **VẪN KHÔNG ĐO ĐƯỢC** — 0/3 lần predict hoàn thành, cả 3 lần chết giữa predict #1 (exit 137, SIGKILL, không exception) |
| Birefnet session init (480×480, sau bump) | 48,7 s (lúc yên) / 100,5–104,1 s (lúc tải nặng); RSS sau init 1,90–2,00 GB |
| Baseline trước bump (J8 §5.2) | init 16,4 s (yên) / 22,0 s / 54,8 s (tải nặng); RSS 2,02–2,06 GB; predict 1024×1024: 1 lần hoàn thành duy nhất (timing từng frame bị mất), 3 lần chết giữa predict #1 — **cũng không có fps ổn định** |
| So sánh bump | **Không chứng minh được hồi quy cũng không có cải thiện**: init chậm hơn J8 nhưng hoàn toàn nằm trong biên độ tải máy (xem §1.3); RSS sau init khớp J8; mẫu chết predict #1 giống hệt J8 |
| Fallback / smooth (venv mới) | **PASS, không regression**: fallback 7/7, smooth 4/4 |
| pip-audit bgremove (chạy lại) | **0 lỗ hổng** ("No known vulnerabilities found", exit 0) — khớp W1/U8 |
| gradio mới nhất (PyPI, chạy lại) | **6.31.0** (28/10/2026) — không có bản mới hơn; kẹp `pillow<13.0,>=8.0` **VẪN CÒN NGUYÊN** |
| vieneu / pillow mới nhất | **3.8.3** / **13.0.0** — không đổi so với W7 |
| pip-audit TTS (chạy lại) | **39, không đổi** — toàn Pillow 12.3.0, fix 13.0.0 |
| test_bgremove.py full với birefnet | **KHÔNG CHẠY** — có lý do (xem §1.4): probe 0/3 thì chạy full 180 frame chỉ tốn thời gian rồi chết |

## 1. Đo lại tốc độ birefnet sau bump

### 1.1 Cách đo

- Venv: `server/bgremove/.venv` (Python 3.12.3) — xác nhận lại trước khi
  đo: rembg **2.0.87**, Pillow **13.0.0**, numpy **2.5.4**, cv2 **5.0.0**,
  onnxruntime **1.23.2**; `BiRefNetSessionGeneral` import được.
- Model: `~/.u2net/birefnet-general.onnx`, 972.666.916 byte, md5
  **7a35a0141cbbc80de11d9c9a28f52697** — khớp đúng md5 weights mà U8 ghi
  (không tải lại, không đổi model).
- Ảnh: `~/workspace/scratch-bgremove/person.jpg` (JPEG thật 640×640,
  43.409 byte, đã dùng ở W1) resize về **480×480** (= max-side 480 mà
  `test_bgremove.py` dùng) — nhỏ hơn 1024×1024 của J8, tức là điều kiện
  đo lần này DỄ HƠN J8 mà vẫn chết.
- Probe: script scratch `~/workspace/.tmp-r70x5/probe_birefnet.py`
  (không nằm trong repo, không stage): `new_session("birefnet-general")`
  rồi predict 3 lần, ghi wall time + RSS đỉnh (`ru_maxrss`) + thống kê
  alpha. Đây là cùng code path với `bgremove.py` (`session.predict` trên
  PIL) nhưng KHÔNG qua ffmpeg — đo thuần tốc độ model.

### 1.2 Số đo thật — 3 lần thử, 0 lần predict xong

| Lần | Thời điểm (+07) | Điều kiện máy lúc chạy | Init | RSS sau init | Predict #1 |
|---|---|---|---|---|---|
| 1 | 06:41–06:44 | loadavg ~10–18 (nhiều luồng đợt 70 chạy song song), RAM trống ~2,0 GB, swap đang dùng 349 MB, vừa reboot (up 2 phút, page cache lạnh) | **104,1 s** | 1,90 GB | **chết — exit 137 (SIGKILL), không exception, không traceback** |
| 2 | 06:45–06:47 | loadavg 10,55, RAM trống 3,5 GB | **100,5 s** | 2,00 GB | **chết — exit 137, y hệt lần 1** |
| 3 ("yên") | 06:48–06:52 | loadavg 1,58, RAM trống 4,56 GB (máy đã yên lại) | **48,7 s** | 1,96 GB | **chết — exit 137 sau ~198 s trong predict, vẫn không trả về mask** |

- Tổng wall mỗi lần: ~157 s / ~155 s / ~247 s (gồm init; timeout đặt
  900–1500 s nên KHÔNG phải timeout giết — exit 137 là SIGKILL).
- Không có lần nào predict trả về mask → **không có số fps, không có
  thống kê alpha, không có con số s/frame nào** — và không được bịa ra
  từ 198 s "trong predict" (không biết predict còn thiếu bao nhiêu).
- Log đầy đủ: `~/workspace/.tmp-r70x5/probe_birefnet{,_retry,_quiet}.log`
  (scratch, không stage).

### 1.3 So sánh với baseline trước bump — trung thực

Baseline lấy từ `docs/PHASE9_ROUND53_J8_BGREMOVE_VENV_LIMITS.md` §5.2
(đo trước bump, venv cũ rembg 2.0.60/Pillow 12.x):

- J8 init: 16,4 s (yên) / 22,0 s / 54,8 s (tải nặng); RSS sau init
  2,02–2,06 GB. Lần này: 48,7 s (yên) / 100,5–104,1 s (tải nặng);
  RSS 1,90–2,00 GB — **RSS khớp, init chậm hơn**.
- Nhưng init chậm hơn **CHƯA CHỨNG MINH ĐƯỢC LÀ DO BUMP**: lần 1–2 đo
  dưới loadavg 10–18 + VM vừa reboot (page cache lạnh, model 973 MB
  phải đọc lại từ đĩa) + swap đang dùng; lần 3 "yên" (48,7 s) vẫn nằm
  sát mức 54,8 s "tải nặng" của J8. Init time biến thiên theo tải máy
  mạnh hơn biến thiên theo version (J8 tự nó đã dao động 16,4→54,8 s,
  gấp 3,3×). Muốn tách riêng ảnh hưởng của bump phải đo A/B cùng máy
  yên với cả 2 venv — venv cũ đã xóa ở W1 nên không làm được nữa.
- Kết luận đúng mức: **sau bump, birefnet vẫn không đo được fps ổn
  định — y hệt trước bump**. Không có hồi quy đã chứng minh, không có
  cải thiện. Nợ "đo lại tốc độ birefnet sau bump" đóng lại ở dạng:
  đã đo lại 3 lần, kết quả là vẫn chết như cũ (xem §4 mục 1).

### 1.4 Vì sao KHÔNG chạy full test_bgremove.py với birefnet

`test_bgremove.py --session birefnet-general` cần 180 lần predict
(mask 90 + alpha 90, mỗi lần nạp lại session). Probe 1 ảnh đã 0/3
— chạy full test chỉ lặp lại cái chết đó với chi phí ~10–20 phút và
không cho thêm thông tin nào (không có lần predict nào xong để tính
fps). Đây là quyết định tiết kiệm thời gian có căn cứ, không phải bỏ
qua test: test vẫn sẽ được chạy lại ngay khi có 1 lần predict đơn
hoàn thành (xem §4).

### 1.5 Vì sao chết — và giới hạn của kết luận

- Dấu hiệu khớp hoàn toàn OOM-kill như J8 đã ghi: tiến trình biến mất
  giữa predict, không exception, không exit code Python (chỉ exit 137
  của shell), RSS sau init đã ~2 GB và predict còn cấp thêm activation.
- Nhưng **không khẳng định tuyệt đối là OOM-kill**: `dmesg` không có
  quyền đọc (`Operation not permitted`) nên không thấy dòng oom-killer
  — cùng giới hạn như J8. Điều chắc chắn: kernel/shell giết tiến trình
  bằng SIGKILL trong lúc predict, 3/3 lần, kể cả lúc máy yên với
  4,56 GB RAM trống và ảnh chỉ 480×480.
- Lưu ý: J8 từng có 1 lần predict 1024×1024 hoàn thành (dưới loadavg
  ~18) — nên birefnet-general không phải "không bao giờ chạy được" mà
  là **bấp bênh ở ngưỡng RAM**: lúc thì qua, thường thì chết. 3 lần
  chết liên tiếp lần này không chứng minh "chết 100%", chỉ chứng minh
  "không đo được fps ổn định trên VM 8 GB này".

## 2. Fallback + smooth — PASS, không regression sau bump

Chạy bằng venv mới (không cần model):

```
.venv/bin/python -u test_bgremove_fallback.py  → 7 pass, 0 fail
.venv/bin/python -u test_bgremove_smooth.py    → 4/4 PASS
```

Khớp đúng W1. Không đổi code `bgremove.py` trong luồng này.

## 3. TTS gradio — kiểm tra lại, vẫn kẹp; TTS 39 CVE còn nguyên

### 3.1 Chạy lại script kiểm tra (09/11 ~06:41 +07)

```
python3 scripts/check-gradio-pillow-cap.py
gradio latest on PyPI : 6.31.0 (published 2026-10-28T03:41:37)
gradio 6.31.0 pillow requirement: ['pillow<13.0,>=8.0']
vieneu latest on PyPI : 3.8.3
pillow latest on PyPI : 13.0.0
VERDICT: GRADIO STILL CAPS pillow<13 — TTS Pillow bump still
impossible (ResolutionImpossible). Debt stays open.
(exit 1)
```

- Không có bản gradio nào mới hơn 6.31.0 kể từ lúc W7 kiểm tra
  (09/11 ~03:50 +07, cùng ngày). Script không sửa (đã đúng).
- Chỉ đọc metadata PyPI, không chạm venv TTS thật (`.venv2`), không
  thử bump lại (đã chứng minh `ResolutionImpossible` ở W7/U8).

### 3.2 pip-audit chạy lại (venv audit của W1, `~/workspace/.tmp-r69w1/pip-audit-venv`)

- bgremove (`server/bgremove/requirements.txt`): **"No known
  vulnerabilities found", exit 0** — 0 lỗ hổng, khớp W1/U8. File:
  `hidden_files/round70-x5-audit-bgremove.txt`.
- TTS (`server/tts/requirements.txt`, không đổi): **"Found 39 known
  vulnerabilities in 1 package", exit 1** — toàn Pillow 12.3.0, fix
  13.0.0 (đếm lại từ output đầy đủ: 39 dòng `pillow`, khớp đúng 39
  của W1/U8). File: `hidden_files/round70-x5-audit-tts.txt`.
- **Kết luận: TTS 39 CVE CÒN NGUYÊN.** Không có gì thay đổi upstream
  để làm tiếp; lộ trình khi gradio gỡ kẹp vẫn như W7 §3 (chạy lại
  script → dry-run venv tạm → smoke-test → pip-audit → mới sửa
  requirements.txt). Đánh giá rủi ro W7 §2 vẫn đứng: Pillow là dep
  transitive không bao giờ được gọi trong pipeline TTS (tts.py không
  import gradio/Pillow, vieneu không import gradio lúc inference,
  không parse file ảnh) — đây là đánh giá rủi ro, không phải lý do
  xóa nợ.

## 4. File đổi/thêm (batch phase9-round70-x5-birefnet-tts, KHÔNG push)

- `docs/PHASE9_ROUND70_X5_BIREFNET_TTS_LIMITS.md` — doc này (mới).
- KHÔNG đổi: code `bgremove.py`, `server/tts/requirements.txt`,
  `server/bgremove/requirements.txt`, script gradio-check, venv nào.
- Scratch không stage: `~/workspace/.tmp-r70x5/probe_birefnet.py` +
  3 log probe; log audit nằm ở
  `workspace/goals/capcut-clone-video-editor/hidden_files/round70-x5-audit-{bgremove,tts}.txt`
  (bookkeeping của goal, không phải file repo).
- Stage file: `paths-loop/phase9-round70-x5-birefnet-tts.txt`
  (NUL-delimited, 1 entry, verify read-back 1/1 tồn tại và là text).

## 5. Nợ mở cho đợt sau

1. **Birefnet fps vẫn chưa có số** (§1): cần máy yên hơn/RAM trống
   nhiều hơn, hoặc thử `birefnet-general-lite` (model 224 MB, đã được
   J8 đề xuất cho máy yếu — chưa làm), hoặc đo trên máy khác có RAM
   lớn hơn. Khi nào 1 lần predict đơn hoàn thành thì chạy lại full
   `test_bgremove.py --session birefnet-general` để có fps video thật.
   Lưu ý cho đợt sau: đừng đo birefnet lúc nhiều luồng đợt khác đang
   chạy song song (loadavg 10–18 làm init chậm gấp đôi và tăng nguy cơ
   chết); và đừng suy ra fps từ thời gian "chết giữa chừng".
2. **TTS 39 CVE** — phụ thuộc upstream (gradio nới cap `pillow<13`
   hoặc vieneu bỏ dep gradio); kiểm tra lại định kỳ bằng
   `scripts/check-gradio-pillow-cap.py`, không tự ý sửa
   `requirements.txt` thành trạng thái không cài được.
3. **OSV npm audit** — nợ từ W1, không thuộc luồng này, vẫn mở.
4. Môi trường: VM reboot giữa đợt (up 2 phút lúc 06:41 +07); lỗi EPERM
   ghi file qua exec từng xảy ra **không tái diễn** trong luồng này
   (ghi qua exec + tee đều OK).
