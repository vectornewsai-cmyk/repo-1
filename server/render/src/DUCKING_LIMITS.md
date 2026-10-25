# DUCKING_LIMITS.md — Audio ducking (nhạc tự nhỏ khi có lời thoại)

> Spec: `DuckingSettings` trong `packages/video-spec/src/audio.ts`
> (+ mirror `.js` cùng thư mục, gắn vào `VideoSpec` bằng module augmentation —
> không sửa `index.ts`).
> Render: `server/render/src/render.js` (nhánh audio, sau `amix` cũ).
> UI: `DuckingSection` trong `apps/web/src/components/audiofx/AudioFxPanel.tsx`.
> Test thật: `server/render/src/test_ducking.js` (+ `test_ducking_measure.py`).

## Nó làm gì (đã đo thật)

Khi `spec.ducking.enabled === true` và `voiceTrackId` trỏ tới track audio có
clip, render tách mix thành 2 nhánh:

- **voice mix**: mọi clip của track giọng (kèm volume/fade/effect từng clip).
- **music mix**: các track audio còn lại + audio kế thừa của clip video.
- Hai nhánh đều `apad` tới đúng độ dài project `D` (nếu không, nhánh nào hết
  sớm sẽ khiến `sidechaincompress` EOF và cắt luôn đầu ra), rồi:
  `music + sidechain(voice) → sidechaincompress → amix với voice`.
- Normalize (export option) vẫn áp SAU mix cuối như cũ.

Số đo thật (test_ducking, nhạc sine 440 Hz liên tục, giọng burst 880 Hz):

| Cửa sổ | Nhạc TẮT | Nhạc BẬT | Giọng TẮT → BẬT |
|---|---|---|---|
| có giọng (2.5–3.5s) | −36.15 dB | −41.13 dB (**−4.99 dB**) | −18.07 → −18.10 dB |
| lặng (4.5–5.5s) | −36.15 dB | −36.15 dB (**Δ 0.00 dB**) | — |
| có giọng (6.5–7.5s) | −36.14 dB | −41.15 dB (**−5.02 dB**) | −18.06 → −18.07 dB |

(Đo bằng DFT tại bin 440/880 Hz — cửa sổ 1s là số nguyên chu kỳ của cả hai
tần số nên không rò rỉ phổ. Mức tuyệt đối thấp do `amix` chuẩn hoá; chỉ
chênh lệch tương đối mới có ý nghĩa.)

## Giới hạn trung thực — đọc trước khi dùng

### 1. Đây là compressor, KHÔNG phải ducking theo envelope hoàn hảo

`sidechaincompress` là compressor kích hoạt bởi sidechain: mức giảm phụ thuộc
vào **mức giọng thực tế từng thời điểm**, không phải lịch trình bật/tắt theo
câu nói. Hệ quả:

- Giọng nhỏ, thì thầm, hoặc dưới ngưỡng (`thresholdDb`, mặc định −20 dB)
  sẽ KHÔNG kéo nhạc xuống — dù tai vẫn nghe thấy giọng.
- Giọng to vượt ngưỡng nhiều thì nhạc giảm sâu hơn mức `duckAmountDb` muốn
  đặt — xem mục 2.
- Attack/release là hằng số của compressor (mặc định 20/250 ms), không phải
  envelope vẽ tay theo từng câu. Nhạc "nhả" lại theo release, không theo
  câu nói kết thúc.

### 2. `duckAmountDb` là mức trần xấp xỉ, không phải knee cứng

`sidechaincompress` không có tham số "giảm tối đa". Implement map
`duckAmountDb` sang tham số `mix` (dry/wet blend):

```
mix = 1 − 10^(−duckAmountDb/20)
```

Khi compressor nén hết, đầu ra còn `(1−mix)` phần dry → giảm đúng
`duckAmountDb`. Nhưng khi compressor chỉ nén một phần, `mix` cũng pha loãng
luôn phần nén đó: **mức giảm thực tế luôn ≤ duckAmountDb, và thường nhỏ
hơn** (test: cấu hình 12 dB cho ra ~5 dB với giọng −18 dB RMS qua ngưỡng
−20 dB, ratio 4). Muốn giảm sâu hơn: hạ `thresholdDb` hoặc tăng `ratio`,
đừng chỉ tăng `duckAmountDb`.

### 3. Track giọng trống / không tìm thấy / không phải audio / bị muted

Render worker **cảnh báo lên stderr và rơi về mix cũ** (filtergraph y hệt
spec tắt — đã kiểm chứng bằng so sánh chuỗi dry-run). Nó KHÔNG fail render,
vì một project cũ hoặc spec viết tay không nên vỡ chỉ vì track giọng bị
xoá. Ngược lại, **param sai khoảng thì fail fast** (throw, render dừng,
lỗi nêu rõ field) — ví dụ `ratio: 99` → exit 1 với thông báo `ducking...`.
Validator ở tầng spec (`validateDuckingSettings`) thì chặt hơn: nó coi
`enabled=true` mà thiếu `voiceTrackId` là lỗi (UI chặn trước khi lưu).

### 4. Chỉ một track giọng duy nhất

`voiceTrackId` là một id. Project có nhiều người nói trên nhiều track thì
chỉ track được chọn mới làm sidechain; các track giọng còn lại rơi vào
nhánh **nhạc** và sẽ bị nén chung với nhạc khi track chính có tiếng.
Muốn nhiều giọng: gộp các clip giọng về cùng một track trước khi bật
ducking (chưa có chế độ "nhiều sidechain source").

### 5. Audio kế thừa của video luôn thuộc nhánh nhạc

Tiếng gốc trong file video (`sourceAudioMode="inherit"`) không bao giờ làm
sidechain — kể cả khi video đó chính là người đang nói. Nếu lời thoại nằm
trong file video, hãy tách nó thành track audio riêng rồi chọn track đó
làm `voiceTrackId`.

### 6. Preview (Web Audio) chưa áp dụng ducking

Panel chỉ đổi `spec.ducking`; preview trong editor vẫn phát mix chưa duck.
Ducking chỉ nghe được sau khi render. Đây là giới hạn UI, không phải lỗi
render — cần nối thêm vào preview engine nếu muốn nghe thử trực tiếp.

### 7. Đổi ducking trong UI chưa đi qua history undo

`DuckingSection` ghi spec qua `useStore.setState` trực tiếp (vì `store.ts`
ngoài phạm vi batch này) nên Ctrl+Z không hoàn tác được thao tác ducking,
khác với hiệu ứng clip (đi qua `patchClip` + history). Muốn undo: cần thêm
một action vào store — việc của batch khác.

### 8. Hai nhánh đều phải có tiếng thì ducking mới chạy

Nếu project chỉ có track giọng mà không có nhạc (hoặc ngược lại), render
rơi về mix cũ — hành vi này là đúng (không có gì để nén), nhưng nó cũng
có nghĩa là **không có cảnh báo riêng cho trường hợp "bật ducking mà
chẳng nén gì"** ngoài cảnh báo khi thiếu track giọng (mục 3).

### 9. Không dùng chung với normalize để "đo" mức giảm

Normalize (export option) áp sau mix cuối nên nó có thể nâng toàn bộ mức
sau ducking. So sánh "trước/sau ducking" mà bật normalize ở cả hai lần
render sẽ thấy chênh lệch bị thu hẹp — test đo mức luôn tắt normalize.
