# Phase 9 đợt 46 — luồng B6: compat i18n + badge (tiếp nối A6 đợt 45)

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist vào batch. Mọi số timing trong đợt này đều đo dưới tải song
song (các luồng đợt 46 khác cùng chạy trên VM) — cấm dùng làm baseline
quiet. Luồng này KHÔNG sửa `preview.tsx` (cố tình, xem §4.3).

## 1. Phạm vi: đóng nợ A6 §4.2, §5.2, §5.3 và một phần §5.5

- A6 §5.3 Wording badge failed mượn key element-missing → ĐÃ ĐÓNG (§2).
- A6 §5.2 Headed cho effect đổi lang lúc pause + badge failed → ĐÃ CÓ
  ở mức HELPER trên Chromium thật (§3); mức APP ĐẦY ĐỦ vẫn là nợ (§5).
- A6 §5.5 Badge vẫn là 1 badge toàn cục → KHÔNG TÁCH, nhưng đã có
  thiết kế + chứng minh bằng test vì sao chưa tách được (§4). Không
  claim tách khi chỉ đổi label toàn cục.
- Safari / Firefox / máy thật / màn hình vật lý: VẪN CHƯA ĐO (§5).

## 2. Key i18n mới + nhánh element-failed

Thêm đúng 2 key mỗi locale vào khối `reverseEngine` (không đổi key cũ):

| Key | vi | en |
|---|---|---|
| `reverseEngine.badgeElementFailed` | `◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)` | `◀ REVERSE: ELEMENT (WebCodecs decode failed)` |
| `reverseEngine.titleElementFailed` | `Đường WebCodecs đã chọn không decode được (controller đã failed) nên preview rơi về đường element (seek từng frame) — không crash, không mất hình.` | `The selected WebCodecs path could not decode (controller failed), so preview falls back to the element path (seeking frame by frame) — no crash, no lost picture.` |

Key mới KHÔNG có placeholder `{api}` (lý do failed không phải tên
API thiếu) nên hàm display gọi `t()` không truyền vars. Nhánh
element-failed trong `reverseEngineBadgeDisplay45A6` nay dùng key
riêng; kind thuần (`element-failed`, `missingApi: null`,
`controllerFailed: true`) và nền amber không đổi. Các nhánh
webcodecs / element-missing giữ nguyên từng chữ dict cũ.

Parity: toàn file vi = en = **968 key** mỗi bên (966 của Z6 + 2 key
mới này). Test 46B6 khóa parity + đủ key mới + nội dung từng chữ
từ dict THẬT (khác test A6 dùng fake dict); con số 968 là snapshot
tại thời điểm B6 — nếu luồng khác cùng đợt 46 cũng thêm key thì
parent gộp cập nhật số này theo tổng thực tế, khóa cứng vẫn là
parity + đủ key mới.

## 3. Bằng chứng headed trên Chromium thật — MỨC HELPER, ghi rõ

Script: `apps/web/scripts/clicktest-round46-b6-badge-pipe.mjs`
(mẫu pipe CDP của Z6 / probe A6; bundle ra tmpdir, không vào repo).

Kết quả: **7/7 PASS**, mode **headed Xvfb :90**, Chrome
`156.0.0.0` (UA: `Mozilla/5.0 (X11; Linux x86_64) ... Chrome/156.0.0.0
Safari/537.36`), chạy 2 lần (trước và sau khi sửa import §6) đều 7/7.

Trang test bundle MODULE THẬT (`reverseBadge45A6.ts` sau sửa B6,
`reversePlayback.ts`, `i18n/index.ts` đọc vi/en JSON thật,
`reverseBadge46B6.ts`) + phần tử DOM badge thật (cùng class
`preview-reverse-engine-badge`, cùng cách ghi textContent / title /
background / display như `preview.tsx`). 7 kiểm tra:

- (b) failed: `resolve(..., failed=true)` → kind `element-failed`,
  `controllerFailed: true`; DOM sau tick khởi tạo = đúng từng chữ
  key vi mới (text + title), nền `rgba(140, 90, 0, 0.92)`, display
  `block`.
- (a) đổi lang lúc pause: sau tick khởi tạo, trang KHÔNG đặt
  rAF/interval nào (mô phỏng vòng lặp ngủ lúc pause). Đổi lang
  vi→en chỉ bằng thân effect `[previewLang]` sao từng dòng từ
  `preview.tsx` (đọc badge đã lưu → display qua `t()` hiện tại →
  ghi DOM) → DOM = đúng từng chữ key en mới, **tickCount vẫn 1**
  (không tick nào chạy thêm). Đổi ngược en→vi cũng vậy (tickCount
  vẫn 1). Badge webcodecs đổi lang lúc pause cũng đổi chuỗi mà
  tickCount không tăng (2 → 2).
- Per-track tầng thuần trên Chromium: collect 2 track → 2 kind
  (`webcodecs`, `element-failed`), render đơn → track đầu (`t0`).

GIỚI HẠN MỨC NÀY (không phóng đại): đây là helper, không phải app
đầy đủ. Nó chứng minh hàm display thật + dict thật + ghi DOM thật
hoạt động trên Chromium khi loop dừng, nhưng KHÔNG chứng minh wiring
React thật (effect `[previewLang]` có chạy khi user bấm nút đổi lang
ở TopBar trong app đầy đủ không, ref badge đã được tick điền chưa)
và KHÔNG chứng minh `controller.failed` thật từ footage hỏng trong
app. Hai phần đó vẫn là nợ mở (§5) — cần click-test app đầy đủ với
footage thật + clip reverse + pause + bấm đổi lang, ngoài phạm vi
luồng này.

## 4. Badge từng track: thiết kế + chứng minh chưa tách được

File mới `apps/web/src/lib/reverseBadge46B6.ts` (thuần, không import
`.ts` để tsc không báo TS5097 như file test):

- `collectReverseTrackBadges(inputs)`: một badge mỗi clip stepping
  tại playhead, giữ thứ tự track; loại clip không tại playhead /
  không stepping / resolve null. Với 2 clip chồng nhau (track 0
  webcodecs-ok, track 1 failed) → 2 badge, kind khác nhau theo từng
  track (test khóa).
- `renderSingleBadgeFromTracks(perTrack)`: mô tả đúng hành vi render
  HIỆN TẠI của `preview.tsx` — lấy entry đầu tiên. Với cùng 2 track
  trên, render đơn chỉ giữ track 0 (`webcodecs`), track 1 failed
  vô hình. Đây là chứng minh nợ còn mở, không phải tách.

Vì sao chưa tách gọn trong `preview.tsx` (cả 3 điều kiện đều thiếu):

1. Vùng neo riêng từng track trong khung preview: preview là MỘT
   canvas đã composite — các track chỉ là lớp z chồng nhau, không có
   làn riêng trên khung preview để gắn badge vào (làn track chỉ có
   ở panel Timeline, không phải preview).
2. Nhãn track cho user đọc được: `track.id` nội bộ không phải tên
   hiển thị; badge xếp chồng ở góc mà không có tên track thì user
   không biết badge nào thuộc track nào.
3. Plumbing DOM: badge hiện tại cố tình ghi DOM trực tiếp để tránh
   re-render React mỗi frame; một pool N badge theo tick là plumbing
   mới trong vòng lặp preview, phải đi kèm test headed trên app thật.

Hệ quả: khi preview có đủ (1)+(2)+(3) thì chỉ cần thay điểm render
bằng `collectReverseTrackBadges` mà không sửa lại logic resolve.
Trước lúc đó, hàm này KHÔNG được `preview.tsx` gọi (cố tình — gọi
mà không đổi render chỉ là code chết mạo nhận đã tách).

## 5. Nợ còn lại trung thực

1. **App đầy đủ CHƯA ĐO**: wiring effect `[previewLang]` qua nút
   đổi lang TopBar trong app thật, và badge failed từ controller
   failed thật (footage hỏng) trong app thật — đều chưa có click-test
   app đầy đủ (xem §3 về giới hạn mức helper).
2. **Safari CHƯA ĐO, Firefox CHƯA ĐO, máy thật / màn hình vật lý
   CHƯA ĐO**: giữ nguyên từ A6 — mọi suy luận về 2 trình duyệt này
   vẫn chỉ từ guard, chưa có bằng chứng thật nào.
3. **Badge từng track vẫn là nợ mở** (§4): badge hiện tại vẫn là 1
   badge toàn cục theo clip stepping đầu tiên (track duyệt trước).
4. **Snapshot số key 968** (§2): parent gộp phải đối chiếu lại nếu
   luồng khác cùng đợt 46 cũng thêm key i18n.

## 6. Số đo thật sau sửa

- Test Node mới 46B6: **8/8 pass** (esbuild bundle `--format=esm`,
  chạy từ gốc repo, bundle ra `/tmp`).
- Hồi quy A6: **12/12 pass** (test A6 đã cập nhật fake dict + kỳ
  vọng theo key mới — xem §7; logic resolve A6 không đổi).
- Hồi quy Z6: **10/10 pass** (test Z6 chỉ cập nhật số đếm 966→968,
  logic không đổi — xem §7).
- Headed helper: **7/7 pass** (Chromium thật, headed Xvfb :90,
  Chrome 156; chạy 2 lần đều 7/7).
- `tsc --noEmit` (apps/web): **0 lỗi ở mọi file B6** (module 46B6,
  display 45A6, test đã exclude). Toàn bộ output còn lại thuộc
  luồng khác cùng đợt 46 (`gopTail46B4.test.ts`,
  `pause46B2.test.ts`) và `seek.ts` có sẵn — B6 không sửa lén các
  file đó, parent gộp xử lý riêng.
- `vite build` (trực tiếp, `--outDir /tmp`, không qua script `build`
  vì script đó chạy `tsc` trước và sẽ fail do lỗi của luồng khác
  trên): pass, ~5,4 s dưới tải, chỉ cảnh báo chunk > 500 kB cũ.
  `dist/` và `/tmp` KHÔNG đưa vào batch.

## 7. Việc B6 đã sửa ở file của luồng khác (ghi rõ để parent đối chiếu)

1. `reverseBadge45A6.test.ts`: thêm 2 key mới vào fake dict (giá
   trị = đúng chuỗi dict thật) + đổi kỳ vọng test failed sang
   chuỗi key mới + đổi assert title sang "không decode được" /
   "could not decode". Không đổi logic resolve nào của A6.
2. `reverseCompat44Z6.test.ts`: chỉ đổi 2 dòng đếm 966→968 + comment
   ghi rõ B6 thêm đúng 2 key. Không đổi logic test Z6 nào.
3. `apps/web/tsconfig.json`: thêm 1 dòng exclude cho
   `src/lib/reverseBadge46B6.test.ts` (tiền lệ mọi test `.ts` khác;
   kiểm tra thấy exclude cho test A6 đã có sẵn trước B6 nên §4.1
   của A6 coi như đã xong, B6 không cần làm lại).
4. `preview.tsx`: KHÔNG SỬA — badge failed tự đổi wording mới vì
   nó gọi hàm display 45A6; tránh xung đột với luồng khác cùng đợt
   đang sửa file chung này.

## 8. Danh sách file đổi/mới chính xác (10 file text, không binary/dist)

Đổi:
1. `apps/web/src/i18n/vi.json` — thêm 2 key (§2).
2. `apps/web/src/i18n/en.json` — thêm 2 key (§2).
3. `apps/web/src/lib/reverseBadge45A6.ts` — nhánh element-failed
   dùng key mới + cập nhật comment đầu file (nợ wording đã đóng).
4. `apps/web/src/lib/reverseBadge45A6.test.ts` — fake dict + kỳ
   vọng theo key mới (§7.1).
5. `apps/web/src/lib/reverseCompat44Z6.test.ts` — đếm 966→968 (§7.2).
6. `apps/web/tsconfig.json` — exclude test 46B6 (§7.3).

Mới:
7. `apps/web/src/lib/reverseBadge46B6.ts` — collect per-track +
   render-đơn mô tả hành vi hiện tại (§4).
8. `apps/web/src/lib/reverseBadge46B6.test.ts` — test Node 8/8
   (dict thật + per-track).
9. `apps/web/scripts/clicktest-round46-b6-badge-pipe.mjs` — script
   headed helper 7/7 (§3).
10. `docs/PHASE9_ROUND46_B6_COMPAT_LIMITS.md` — tài liệu này.

Không đổi (ghi rõ để parent khỏi tìm): `preview.tsx` (§7.4),
`reversePlayback.ts`, `reverseWebcodecs.ts`, `store.ts`, bridge.
