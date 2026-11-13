# Phase 9 — Đợt 82, luồng J10: Đóng nợ O2 — bin rehydrate + toast style lặp — LIMITS

Ngày: 10/11/2026 (~21:38–22:05 +07, lượt cron 21:35 +07).
Phạm vi: đóng nợ O2 còn lại sau đợt 59 P1 — (a) xác nhận hành vi bin hiện
tại còn lỗi không bằng repro thật với media USER IMPORT (P1 chỉ kiểm
bằng media mẫu); (b) điều tra toast "đã điền style mặc định…" lặp lại
mỗi lần reload. KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG đụng
TTS/Gradio, KHÔNG đụng workflow.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| (a) Bin theo spec với media import thật | **ĐÃ HẾT LỖI — không cần sửa code.** Repro thật 4 lượt headed: import file mp4 → xóa hết clip khỏi timeline → reload → bin VẪN 3 item (mẫu 2 + import 1); import rồi chưa thêm clip nào → reload → bin vẫn 3; xóa chủ đích khỏi bin (nút ✕) → reload → bin còn 2, media import không hồi lại. Thiết kế manifest `binMedia` của P1 hoạt động đúng cả với media import, không chỉ media mẫu. |
| (b) Toast "đã điền style" lặp lại | **ĐÃ HẾT — không còn nguồn sinh style thiếu.** Headed 4 lần reload liên tiếp trong một phiên: toasts `[]` sau mọi lần reload (không có "đã điền style"). Rà soát code mọi nơi sinh text clip: sample.ts, store.addTextClip, CAPTION_DEFAULT_STYLE, templates.ts, addCaptionTrack — tất cả đều sinh đủ field `italic` (P1 đã vá 2 nguồn; các nguồn còn lại đã đủ từ trước). Không sửa code. |
| Sửa code production | **Không có.** Chỉ thêm harness headed mới. |
| Test | Headed mới 7/7 (lượt chạy sạch cuối, exit 0); hồi quy Node binPersist59P1 17/17, rehydrate36S5 27/27; dict i18n vi==en==2463 key lá (không đổi — không thêm chuỗi UI mới); tsc + vite build xem §3.3. |

## 1. Repro thật (a): media import bền qua reload

Harness mới: `apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs`
(vite dev HMR tắt + Chromium headed qua Xvfb display :165 + CDP, Node
thuần, theo mẫu P1; profile Chrome mới tinh; file import
`/tmp/round82-j10/j10-import.mp4` — ffmpeg testsrc 2s 320x240, 13065 byte).

Điểm khác P1 B4: P1 dùng media MẪU (đã có sẵn trong spec lúc đầu); J10
dùng media USER IMPORT THẬT qua input file ẩn của MediaBin
(`DOM.setFileInputFiles`), là đúng kịch bản nợ O2 mô tả.

| Case | Lượt chạy sạch cuối (lượt 4) |
|---|---|
| J0 setup | Mẫu tự load 66ms; 3 clip, bin 2 item mau-1/mau-2.webm (file thật 9638/217459 byte, blob: URL), autosave binMedia 2 entry, textItalic=false |
| J1 import thật | j10-import.mp4 (13065 byte, file thật, blob: URL, assetId a_de0c05947220ccd0) vào bin → bin 3 item; autosave binMedia 3 entry |
| J2 reload #1 (import chưa có clip nào) | Reload 15300ms; bin VẪN 3 item, timeline 2 video + 1 chữ, missing null, mediaCards 3, toasts `[]` |
| J3 thêm import vào timeline → xóa HẾT clip → reload | Thêm j10-import.mp4 vào timeline (sang track video mới vì v1 kín 0–8s) → chọn hết 4 clip (click + Shift+click) → Delete → timeline 0 clip → autosave srcs 0, binMedia 3 → reload 17411ms → bin VẪN 3 item (file thật, blob: URL), timeline 0 clip, missing null, toasts `[]` |
| J4 reload #2 (không sửa gì) | Reload 14674ms; bin vẫn 3, timeline 0 clip, toasts `[]` — toast không lặp |
| J5 xóa chủ đích media import khỏi bin | Bấm ✕ trên card j10-import.mp4 → confirm → bin còn mau-1/mau-2, toast "Đã xóa “j10-import.mp4” khỏi thư viện." (chuỗi vi đã gộp dict, không còn key thô như P1) → autosave binMedia 2 → reload 11426ms → bin vẫn 2 item, missing null |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection qua 4 lần reload |

Kết quả các lượt chạy (xem §4 để biết vì sao cần 4 lượt):

| Lượt | Kết quả | Nguyên nhân |
|---|---|---|
| 1 | Harness lỗi exit 2 | Chromium 1248 trong cache đã bị dọn (VM restart) — không thấy chrome |
| 2 | J0/J1/J2 PASS, J3 FAIL, J4 timeout → exit 2 | Lỗi harness J10 (xem §2.1, §2.2), không phải lỗi app |
| 3 | 5/7 (J0 + J3 FAIL) | Media mẫu mau-1.webm ghi được 0 byte — flake sinh mẫu (xem §5.1); bản chất J3 vẫn đúng (bin 3, timeline 0 sau reload — J4 PASS xác nhận) |
| 4 | **7/7, exit 0** | Lượt sạch cuối, số đo ở bảng trên |

## 2. Hai lỗi harness tự tìm thấy và sửa (không phải lỗi app)

### 2.1 J3: `videoClips` chỉ lọc track `v1` — clip mới sang track mới bị tính là "thêm thất bại"

`STATE_FN.videoClips` lọc `trackId === "v1"`. Khi bấm "＋ Thêm" trên
card import, `addMediaAtPlayhead` thấy v1 kín 0–8s (playhead 0, dur 2s
chồng clip mẫu) nên tạo track video mới và thêm clip vào đó — đúng hành
vi app. Harness cũ kiểm `videoClips.some(src === ...)` nên báo thêm
thất bại dù clip đã có trên timeline. Sửa: kiểm `clips.some(...)`
(quét mọi track) + chờ bằng `waitFor` 30s thay vì đọc một lần sau
`sleep(800)`.

### 2.2 Card thứ 3 nằm dưới nếp gấp của lưới media — click trượt

Lưới media cuộn được, 2 cột: card thứ 3 nằm dưới vùng nhìn thấy.
`getBoundingClientRect` trả tọa độ ngoài viewport → CDP click trượt
(xem screenshot J2 lượt 2: bin chỉ hiện 2 card mẫu, card import nằm
dưới). Sửa: `CARD_BTN_FN` gọi `btn.scrollIntoView({ block: "nearest" })`
trước khi đo tọa độ — áp dụng cho cả nút "＋ Thêm" (J3) và nút ✕ (J5).
Sau sửa, J3 thêm clip thành công ngay lượt 3.

### 2.3 J4/J5 không được throw khi case trước lỗi

Lượt 2: J3 FAIL → J4 `waitFor(clipCount === 0)` timeout 120s rồi ném
lỗi, giết cả lượt (J5/H9 không chạy). Sửa: J4/J5 chỉ `waitFor` theo
`mediaCount`, rồi assert `clipCount` trong `if` (fail nhanh thay vì
timeout). Cùng mẫu "fail nhanh, không timeout dây chuyền" nên áp dụng
cho harness sau.

### 2.4 Chromium trong cache đã đổi phiên bản

`~/.cache/ms-playwright/chromium-1248` không còn (VM restart/dọn
cache); hiện có chromium-1254 (và 1187). Harness J10 chọn chrome theo
danh sách ứng viên `[1254, 1248, 1187]` + env `J10_CHROME`, thay vì
đường dẫn cứng. Các harness cũ còn ghi cứng 1248 sẽ gặp cùng lỗi này
khi chạy lại — ghi nhận để luồng khác tự sửa harness của mình (không
sửa harness luồng khác trong đợt này).

## 3. Điều tra toast (b): không còn nguồn sinh style thiếu

### 3.1 Đo headed

4 lần reload liên tiếp trong phiên lượt 4 (J2, J3, J4, J5): toasts `[]`
sau mọi lần reload. Lượt 3 cũng `[]` cả 4 lần. Không còn toast
"đã điền style" trên đường đi bình thường (mẫu tự load → import →
thêm clip → xóa hết clip → reload lặp).

### 3.2 Rà soát code: mọi nơi sinh text clip đều đủ `italic`

| Nơi sinh text clip | Style | Kết luận |
|---|---|---|
| `sample.ts` `buildSampleProject` | thêm `italic: false` (P1 vá) | đủ |
| `store.ts` `addTextClip` | thêm `italic: false` (P1 vá) | đủ |
| `lib/captions.ts` `CAPTION_DEFAULT_STYLE` | có `italic: false` từ trước | đủ |
| `store.ts` `addCaptionTrack` | `{ ...CAPTION_DEFAULT_STYLE, ...opts?.style }` | đủ (spread giữ `italic` của default khi caller không truyền) |
| `lib/captions.ts` `segmentsToTextClips` | `{ ...CAPTION_DEFAULT_STYLE, ...style }` | đủ, cùng lý do |
| `lib/subtitles.ts` `cuesToTextClips` | `{ ...style }` — style do caller truyền | caller duy nhất là đường import SRT qua `addCaptionTrack` (style đã qua spread default ở trên) — đủ |
| `lib/captionFollow.ts` `linkSegmentsToClips` | nhận `style` nguyên từ caller | KHÔNG có caller production (chỉ test) — đường linked-caption trong `addCaptionTrack` truyền `style` đã spread default — đủ |
| `lib/templates.ts` (mọi template) | mọi style text clip đều có `"italic": false/true` | đủ |
| `lib/projectRepo.ts` `DEFAULT_TEXT_STYLE` | có `italic: false` | đủ |

Đường toast vẫn còn sống và đúng: `normalizeTextStyles` ở cổng load
(`parseProjectText`/`loadAutosave`) vẫn điền style + toast + ghi lại
autosave cho file/autosave CŨ thật sự thiếu style (P1 đã kiểm chứng
B3: toast đúng 1 lần rồi tự lành). J10 không đụng đường này.

### 3.3 Đính chính: đợt 79 G9 KHÔNG sửa toast style

Nhiệm vụ giao ghi "đợt 79 G9 đã sửa 1 chỗ toast style lặp tại nguồn".
Kiểm chứng: `docs/PHASE9_ROUND79_G9_MODALS_I18N_LIMITS.md` không nhắc
tới toast style nào — G9 là modals + i18n (khóa class modal, dịch
toast tại điểm gọi bằng key `nested.*`). Chỗ sửa toast style tại nguồn
thực sự là **P1 (đợt 59)**: `sample.ts` + `store.addTextClip` thêm
`italic: false`. J10 xác nhận không còn nguồn nào khác (bảng §3.2) —
không có "chỗ khác" nào sót lại để sửa.

## 4. Kiểm chứng (số thật)

### 4.1 Headed `apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs` — 7/7 (lượt 4)

Chạy: `node apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs`
(vite dev HMR tắt + Chromium 1254 headed qua Xvfb display :165 +
CDP, profile mới tinh; cổng dev 5490/debug 9590 tự chọn). Exit 0 khi
7/7 pass. Report JSON + 7 screenshot:
`hidden_files/round82-j10/headed/` (lượt 4 ghi đè lượt 3 — cùng thư
mục scratch; log các lượt trong file report lượt cuối +
`j10-vite.log`/`j10-chrome.log`).

Reload đo được (lượt 4): J2 15300ms, J3 17411ms, J4 14674ms, J5 9626ms
(lượt 3: J2 20676ms, J3 20188ms, J4 13882ms, J5 11426ms — dao động do
tải VM khi các luồng đợt 82 chạy song song).

### 4.2 Hồi quy Node (chạy lại độc lập, không sửa production)

- `binPersist59P1.test.ts`: **17/17** (rehydrate + envelope binMedia +
  toast O6).
- `rehydrate36S5.test.ts`: **27/27**.
- Dict i18n: đếm trực tiếp `vi.json`/`en.json` → **2463/2463 key lá**
  (không đổi — J10 không thêm chuỗi UI mới nên không cần fragment).
  Lưu ý: `codecProbeUi75C6.test.ts` (test khóa dict 2463) KHÔNG chạy
  được bằng `node` trực tiếp — lỗi `ERR_MODULE_NOT_FOUND` do import
  thư mục `codecProbe` (cần bundle esbuild như P1 đã ghi); số key đã
  xác nhận bằng đếm trực tiếp thay cho test đó.

### 4.3 tsc + vite build

- `tsc` apps/web (`npx tsc --noEmit`): **0 lỗi** (không có output lỗi;
  chạy lúc 22:0x +07, cây chung có file các luồng đợt 82 đang sửa —
  vẫn sạch).
- `vite build` apps/web: **pass, 1m 30s** (chỉ cảnh báo chunk >500kB
  có sẵn; chậm hơn P1 9.51s do tải VM khi các luồng đợt 82 chạy song
  song).

## 5. Nợ mở / giới hạn (trung thực)

1. **Flake sinh media mẫu: `mau-1.webm` 0 byte (lượt 3).** MediaRecorder
   trong trình duyệt đôi khi ghi 0 byte cho clip mẫu đầu (kích thước
   mẫu dao động mạnh giữa các lượt: 284011/414488 (O2) → 359871/588581
   (P1) → 150157/170952 → 14789/53482 → 0/63771 (J10 lượt 3) →
   9638/217459 (J10 lượt 4)). Media 0 byte vẫn có `file` + blob: URL
   nên bin/rehydrate không vỡ, nhưng export/render mẫu sẽ thiếu dữ
   liệu thật cho clip đó. Chưa điều tra nguyên nhân (có thể do tải VM
   khi nhiều luồng chạy song song) — nợ cho đợt sau, không phải của J10.
2. **Race ghi đè binMedia trong cửa sổ debounce 5s (P1 §5.1) vẫn mở,
   chưa đo thấy:** `replaceProject` reset media về [] rồi rehydrate
   khôi phục lại; đường mở file thường ghi autosave KHÔNG kèm binMedia.
   J10 không tái hiện được (mọi reload đều chờ autosave ghi xong) —
   vẫn là nợ mở, cần đo có chủ đích ở đợt sau.
3. **Bytes mồ côi trong IndexedDB** (P1 §5.2, nợ chung từ S5): xóa
   khỏi bin không xóa bytes/manifest — chưa có UI dọn kho.
4. **Bin theo autosave, không theo file `.vcut.json`** (P1 §5.3):
   media bin-only không đi theo file — quyết định thiết kế, không phải
   bug.
5. **Harness J10 dùng display :165 + cổng 5490/9590 tự chọn:** chạy
   song song với các luồng đợt 82 khác — vite dev HMR tắt nhưng mỗi
   reload vẫn fetch module mới từ cây đang được các luồng khác sửa;
   boot marker ổn định trong cả 4 lần reload lượt 4 (không phát hiện
   reload lén). Số đo headed là của cây tại thời điểm chạy
   (10/11 ~15:00–15:02 +07, lượt 4).
6. **Không kiểm chứng đường mở file .vcut/archive với binMedia**
   (P1 §5.8 vẫn mở): chỉ kiểm autosave/reload.

## 6. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs` | Mới | Harness headed J0–J5 + H9 (7/7, exit 0): import thật qua DOM.setFileInputFiles, scrollIntoView cho card dưới nếp gấp, kiểm bin 3 qua reload + xóa hết clip + xóa chủ đích khỏi bin |
| `docs/PHASE9_ROUND82_J10_BIN_REHYDRATE_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): evidence headed
`hidden_files/round82-j10/headed/` (report JSON, vite/chrome log, 7
screenshot lượt cuối); file import test `/tmp/round82-j10/j10-import.mp4`
(ffmpeg testsrc, tái tạo được bằng 1 lệnh — xem §1); log luồng
`hidden_files/round82-j10.md`.

Stage: `paths-loop/phase9-round82-j10-bin-rehydrate.txt` — 2 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 7. Môi trường chạy (lượt 4)

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1254`
  (headed qua Xvfb display riêng `:165`, 1440×900).
- Vite dev cổng 5490, CDP debug 9590, TMPDIR `/tmp/round82-j10/tmp`.
- Lệnh chạy (từ gốc repo):
  `node apps/web/scripts/clicktest-82j10-bin-rehydrate-import.mjs`
  — exit 0 khi 7/7 pass, 1 khi có FAIL, 2 khi harness lỗi.
- File import test tái tạo: `ffmpeg -y -f lavfi -i
  testsrc=duration=2:size=320x240:rate=30 -c:v libx264 -pix_fmt yuv420p
  /tmp/round82-j10/j10-import.mp4` (13065 byte).
