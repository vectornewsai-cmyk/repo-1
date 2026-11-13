# Phase 9 đợt 75 — C6: Nối codecProbe vào UI (badge + modal + gộp toast + probe lại lúc rehydrate)

Ngày: 09/11/2026, lượt cron 21:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 74 §4 (LIMITS B3): probe lúc import đã có (toast 1 lần +
cờ `unsupportedCodec`) nhưng cờ không render ở đâu trong UI — toast tự
đóng sau 4,5 s là user mất dấu vết, không biết phải làm gì với file đó;
import nhiều file thì toast chồng nhau (B3 §4 mục 4); reload là mất cờ
(cờ không lưu manifest).

## 1. Đã làm

1. **Badge cảnh báo bền vững trên thẻ media** (`MediaBin.tsx`):
   item có `unsupportedCodec` thì thumbnail có badge đỏ
   "⚠️ Không phát được" (góc trái trên, `data-testid=
   "codec-unsupported-badge"`), title/aria-label nêu codec; bấm mở modal.
   Style inline (không đụng `styles.css` — file chung với luồng khác
   đợt này).
2. **Modal giải thích** (`components/CodecUnsupportedModal.tsx` mới):
   nêu tên file + codec, 2 cách xử lý thật (đổi định dạng sang MP4
   H.264+AAC bằng HandBrake/FFmpeg; tạo proxy 720p để xem trước — proxy
   chuyển mã sang H.264, xuất vẫn dùng file gốc) + ghi rõ xuất file vẫn
   dùng được (FFmpeg đọc được codec này). Dùng đúng class CSS đã có
   (`modal-backdrop/modal/modal-head/modal-body/modal-actions/mini-btn/
   icon-btn` + scoped `.modal-body .warn/.muted`) nên không thêm CSS.
   Đóng bằng nút ✕ / nút Đóng / bấm backdrop — KHÔNG thêm Escape (xem §4
   mục 6: Escape cho modal là phần luồng C9 đợt này).
3. **Gộp toast lúc import** (`store.ts` + helper mới
   `formatUnsupportedNameList` trong `codecProbe.ts`): 1 file → giữ
   toast đơn cũ (`mediabin.codecUnsupported`); >1 file → MỘT toast tổng
   `mediabin.codecUnsupportedMany` ({count} {names}, tối đa 3 tên đầu +
   `+N`). Badge trên từng thẻ vẫn đánh dấu từng file nên gộp toast
   không mất thông tin.
4. **Probe lại lúc rehydrate** (`rehydrate36S5.ts` + nối ở `App.tsx` và
   `openProjectFlow.ts`): thêm dep tùy chọn `probeUnsupportedCodec`
   (theo đúng mẫu `checkProxyUrl` — module rehydrate không import value
   từ file anh em theo quy ước node strip-types, nên probe đi qua dep);
   item khôi phục lại được probe từ File đã dựng bằng trình duyệt HIỆN
   TẠI (đúng cả khi user đổi trình duyệt giữa hai phiên). Dep throw /
   không truyền → fail-open, item vẫn khôi phục bình thường, chỉ thiếu cờ.
   Không toast lúc rehydrate (badge là tín hiệu bền vững).
5. **i18n**: +8 key `mediabin.codec*` (vi≠en, placeholder khớp) → dict
   **2405 → 2413** (vi==en giữ 54); bump 2405 → 2413 ở 10 test khóa số
   key + 2 comment + thêm test mới vào tsconfig exclude.

## 2. Kiểm chứng (chạy thật trên VM này)

### 2.1 Unit — `codecProbeUi75C6.test.ts`: 16/16 pass

- `formatUnsupportedNameList`: 0 tên → rỗng; 1–3 tên nối phẩy; 4 tên →
  `… +1`; 5 tên → `… +2`; maxShown tùy chỉnh.
- Dict 2413 key lá, đủ 8 key mới cả hai bên, placeholder khớp
  (`codecUnsupportedMany` {count} {names}, `codecDetailBody` {name}
  {codec}, `codecBadgeTitle` {codec}), vi≠en, vi==en giữ 54.
- Kiểm tra tĩnh trên source (mẫu modalClasses59P4): modal dùng đủ key
  + testid + role=dialog; mọi class trong modal đã có trong styles.css;
  MediaBin có badge + modal + key; store có 2 nhánh toast (1 file / >1
  file) + helper; rehydrate có dep + gắn cờ; cả 2 call site nối dep.
- Rehydrate động với fake deps: dep báo unsupported → item mang cờ
  "HEVC / MP4"; dep báo chơi được / không truyền dep / dep throw →
  item khôi phục bình thường, không cờ (fail-open).

### 2.2 Headed Chromium 1254 (headless=new + CDP, app dist vừa build)

File test thật (ffmpeg libx265, 1920×1080, 2 s): `hevc-a/b/c/d.mp4`
(4 file khác bytes — tần số sine 440/550/660/770 Hz để hash khác nhau,
xem §4 mục 4) + đối chứng `h264.mp4`. Harness
`/tmp/round75-c6/headed75C6.mjs` — **19/19 pass**:

- A: import 1 HEVC → toast đơn đúng tên + "HEVC / MP4"; badge xuất
  hiện, nhãn "⚠️ Không phát được".
- B: bấm badge → modal mở, nêu đúng tên + codec, có gợi ý đổi định
  dạng + Proxy 720p + "Xuất file vẫn dùng được"; đóng được bằng nút ✕.
- C: import 3 HEVC cùng lúc → CHỈ 1 toast "3 file … (hevc-b.mp4,
  hevc-c.mp4, hevc-d.mp4)"; badge lên 4.
- D: đối chứng H.264 → không thêm badge, không toast codec.
- E: reload (sau khi chờ autosave debounce, xem §4 mục 5) → badge vẫn
  đủ 4 — rehydrate probe lại hoạt động.
- F: proxy H.264 chuyển mã từ HEVC 1080p phát được trong Chromium này
  (videoWidth 1280 / height 720, metadata load); bấm nút Proxy trên thẻ
  HEVC trong app thật → nút thành "✓ PROXY 720p".

### 2.3 Cơ chế proxy (đo trực tiếp bằng curl, bridge 8787)

- `POST /api/proxy` với HEVC 1920×1080 thật → proxy
  `hevc-a__proxy_720p.mp4`, ffprobe: **H.264 1280×720** (proxy.js
  transcode libx264) — gợi ý proxy trong modal là thật với file >720p.
- HEVC 320×180 → bridge trả `{"skipped":true,
  "reason":"source-already-small"}` — xem §4 mục 2.

### 2.4 Hồi quy

- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **pass** (20,02 s; cảnh báo chunk >500 kB có sẵn).
- `codecProbe74B3` 19/19, `rehydrate36S5` 27/27, `i18nOrphans60Q4`
  16/16 (0 key mồ côi), `i18nAudit59P7` pass, `i18nRound57N4` 14/14,
  `reverseBadge46B6` 8/8, `reverseCompat44Z6` 10/10,
  `reversePlaybackI18n49E2` 3/3, `reverseToggleI18n48D4` 3/3,
  `saveToast31` 15/15, `structuredNotes32` 12/12,
  `ProjectMenu.i18n55L1` 6/6, `speedWarnTooShortDead63R10` 5/5,
  `errorDetail34Q4` 35/35, `modalClasses59P4` 33/33,
  `npm run test:unit` (render self-tests) pass.

## 3. Files (stage, KHÔNG push)

- Mới: `apps/web/src/components/CodecUnsupportedModal.tsx`,
  `apps/web/src/lib/codecProbeUi75C6.test.ts`,
  `docs/PHASE9_ROUND75_C6_CODEC_PROBE_UI_LIMITS.md`.
- Sửa: `apps/web/src/i18n/vi.json` + `en.json` (+8 key),
  `apps/web/src/lib/codecProbe.ts` (helper rút gọn tên),
  `apps/web/src/MediaBin.tsx` (badge + modal),
  `apps/web/src/store.ts` (gộp toast),
  `apps/web/src/lib/rehydrate36S5.ts` (dep probe),
  `apps/web/src/App.tsx` + `apps/web/src/lib/openProjectFlow.ts`
  (nối dep), `apps/web/tsconfig.json` (exclude test mới),
  10 test khóa số key 2405 → 2413 + 2 file comment.
- Batch stage:
  `~/workspace/repo-1-push/paths-loop/phase9-round75-c6-codec-probe-ui.txt`
  (24 entry, toàn file text, không binary/workflow).

## 4. Giới hạn / nợ mở

1. **Safari thật vẫn chưa đo** (kế thừa B3): mọi verdict trên Safari
   vẫn là suy ra từ `canPlayType` của trình duyệt đang chạy; badge/
   modal/toast gộp/re-probe chỉ đo trên Chromium 1254. Cần máy
   macOS/iOS thật để đo toast + badge + modal trên Safari.
2. **Gợi ý proxy chỉ đúng khi file cao hơn 720p.** Bridge bỏ qua
   proxy khi nguồn đã ≤ target (`source-already-small` — đã đo với
   HEVC 320×180): file HEVC nhỏ vẫn không xem trước được dù bấm Proxy
   (nút báo "đủ nhỏ"), chỉ còn cách đổi định dạng. Modal không nêu
   ngoại lệ này (giữ ngắn gọn) — file quay bằng điện thoại thường
   ≥1080p nên trường hợp này hiếm. Hướng sau: proxy vẫn tạo khi codec
   không hỗ trợ dù file nhỏ (đổi hành vi skip trong proxy.js — ngoài
   phạm vi luồng này).
3. **Proxy cần bridge chạy.** Trên bản web không chạy bridge, nút Proxy
   báo lỗi bridge như hành vi cũ; trên bản desktop bridge tự chạy nên
   proxy thường tạo được. Modal không nhắc tới bản desktop riêng vì
   preview của Electron vẫn là Chromium (HEVC cũng không phát được ở
   đó) — đường cứu thực sự là proxy, không phải "đổi sang desktop".
4. **File trùng bytes dedup thành 1 asset** (hành vi U3 có sẵn, đã đo
   ở lần chạy headed đầu: 4 file HEVC copy y hệt nhau → sau reload chỉ
   còn 1 item + 1 badge; trong phiên thì đủ 4). Harness lần cuối dùng
   4 file khác bytes nên E2 đo đúng 4/4; giới hạn dedup này thuộc về
   assetStore/rehydrate, không sửa ở đây.
5. **Cửa sổ autosave debounce 5 s.** Reload trong 5 s sau import có
   thể làm binMedia chưa kịp ghi → rehydrate chỉ khôi phục media trong
   spec, HEVC chưa lên timeline sẽ vắng (đã đo ở lần chạy headed thứ
   hai: reload sớm → badge=0; chờ 10 s rồi reload → badge=4). Đã biết
   từ trước (App.tsx:337), không sửa ở đây.
6. **Modal chưa đóng bằng Escape.** Cố tình không thêm — Escape cho
   modal là phần của luồng C9 đợt này; thêm trùng sẽ xung đột.
7. **Race project mẫu lúc mở app lần đầu (phát hiện thêm, KHÔNG sửa).**
   Lần chạy headed đầu: import HEVC ngay sau khi mở app, rồi project
   mẫu load xong muộn → `replaceProject` reset bin, file vừa import
   biến mất khỏi bin (chỉ còn mau-1/mau-2). User thật import trong vài
   giây đầu sau lần mở đầu tiên cũng gặp — cần đợt riêng xếp lại thứ
   tự load mẫu / giữ lại media vừa import.
8. **Badge chỉ có trên thẻ MediaBin.** Clip đã kéo lên timeline không
   có dấu hiệu nào (preview.tsx không đụng — file chung với luồng C7
   đợt này); preview clip không hỗ trợ vẫn đen lặng, user chỉ biết qua
   badge ở bin. Hướng sau: badge/warning trên clip timeline + overlay
   preview.
9. **Verdict `maybe` vẫn im lặng** (quyết định B3 giữ nguyên: `maybe`
   là đáp án thường cho mime container trần nên toast sẽ thành nhiễu).
   Sniff vẫn giới hạn như B3 (slice đầu 1 MiB, CodecID đầu tiên).
10. **Dict là file chung với các luồng round 75 khác.** Lúc C6 bump,
    dict là 2413; nếu luồng khác thêm key sau thời điểm này thì parent
    gộp phải đếm lại và bump các test khóa số key (mẫu B3/B9 đợt 74).
