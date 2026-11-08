# PHASE9_ROUND56_M1 — i18n wiring: App / MediaBin / preview / Inspector / Toasts / desktop / media / TrackPanel / TtsButton

Luồng M1, đợt 56. Nối 77 key đề xuất đợt 55 L2 (`hidden_files/round55-l2-keys.json`)
+ 1 key phụ, tổng **78 key**, cho 9 file. Không sửa `vi.json`/`en.json`
trực tiếp — key nằm trong fragment riêng
`apps/web/src/i18n/fragments/round56-m1.json`, parent gộp ở cuối đợt.

## 1. Key đã nối (78 key, theo file)

| File | Key | Site |
|---|---|---|
| `App.tsx` | `app.proxyStaleToast`, `app.mediaLibrary` (×2 site), `app.openMediaLibrary`, `app.clipProps` (×2), `app.openInspector`, `app.mediaLibraryShort`, `app.closeMediaLibrary`, `app.propsShort`, `app.closeInspector` | 9 key / 11 site |
| `MediaBin.tsx` | `mediabin.bridgeStatus` (×2), `mediabin.noProxyUrl` (×2), `mediabin.smallEnough`, `mediabin.proxyAttached`, `mediabin.proxyFailed`, `mediabin.proxyStaleTitle`, `mediabin.proxyOnTitle`, `mediabin.proxyCreateTitle`, `mediabin.recreateProxyFor`, `mediabin.createProxyFor`, `mediabin.proxyStaleBtn`, `mediabin.proxyCreating`, `mediabin.proxyFailedBtn`, `mediabin.proxyNotNeeded`, `mediabin.bridgeDown`, `mediabin.autoProxyHint`, `mediabin.emptyStep1/2/3`, `mediabin.reloadSample`, `mediabin.sampleProject`, `mediabin.unknownError` (phụ, xem §2) | 22 key / 26 site |
| `preview.tsx` | `preview.missingMedia`, `preview.curveWarnHidden`, `preview.curveWarnFallback`, `preview.curveFallbackLinear`, `preview.curveFallbackHidden`, `preview.curveFallbackLinearShort`, `preview.curveToast`, `preview.flattenWarn`, `preview.flattenWarnDetail`, `preview.flattenToast`, `preview.holdStale`, `preview.hold`, `preview.volumeTitle`, `preview.proxyBadge`, `preview.lutBadge`, `preview.motionBadge`, `preview.reverseBadge`, `preview.reverseLabel`, `preview.holdBadge`, `preview.fsExitTitle`, `preview.fsEnterTitle`, `preview.fsExit`, `preview.fsEnter`, `preview.emptyTitle`, `preview.emptyHint` | 25 key / 26 site |
| `Inspector.tsx` | `inspector.beatSectionTitle`, `inspector.beatAnalyzeHint` | 2 key / 2 site |
| `components/Toasts.tsx` | `toasts.closeAria` | 1 key / 1 site |
| `desktop.ts` | `desktop.saveError` | 1 key / 1 site |
| `media.ts` | `media.videoMetaFailed`, `media.audioMetaFailed`, `media.imageReadFailed`, `media.unsupported` | 4 key / 4 site |
| `components/sticker/TrackPanel.tsx` | `motionTrack.invalid`, `motionTrack.readFailed`, `motionTrack.attached`, `motionTrack.lost`, `motionTrack.followNote`, `motionTrack.loadOther`, `motionTrack.detach`, `motionTrack.intro`, `motionTrack.loadJson` | 9 key / 9 site |
| `components/TtsButton.tsx` | `tts.noRefFile`, `tts.bridgeErrorHttp`, `tts.cloneFromSample`, `tts.refFileLabel`, `tts.cloneHint` | 5 key / 5 site |

Tổng: **78 key / 85 site**. Mọi site đều đã đọc source trước khi sửa;
không có proposal nào thuộc 9 file này bị bỏ qua (0 site bỏ qua).

## 2. Quyết định ngoài đề xuất (ghi rõ để parent kiểm tra)

1. **`mediabin.unknownError` (key phụ, không có trong proposals).**
   `MediaBin.tsx` có fallback `"lỗi không rõ"` lồng trong template
   `mediabin.proxyFailed` (`e instanceof Error ? e.message : "lỗi không rõ"`).
   Đề xuất L2 ghi note "{error} fallback … → en 'unknown error'" nhưng
   không cấp key riêng. M1 thêm key phụ `mediabin.unknownError`
   (vi "lỗi không rõ" / en "unknown error") và truyền qua vars
   `{error: ...}` để không còn literal VI nào sót lại. Nếu parent muốn
   giữ đúng 77 key thì xóa key này và chấp nhận literal fallback — test
   M1 sẽ fail ở assert `'"lỗi không rõ"'` vắng mặt, cần sửa test theo.
2. **`motionTrack.intro`: giữ thẻ `<code>` cho đường dẫn script.**
   JSX gốc bọc `server/tracking/track.py` trong `<code>`. M1 render chuỗi
   đã dịch rồi tách theo đúng literal path (bất biến giữa vi/en) để bọc
   lại bằng `<code>`; nếu chuỗi dịch không chứa path (vd key thiếu →
   fallback trả về key) thì render nguyên chuỗi, không crash.
3. **`preview.curveToast` / `preview.curveFallbackLinear|Hidden`:**
   `{fallback}` truyền giá trị đã dịch của `curveFallbackLinearShort`
   hoặc `curveFallbackHidden`, đúng note của đề xuất L2.
4. **`desktop.saveError`:** sink là fallback `written.error ?? t(...)`
   trong `pushToast` ở `desktop.ts:212` (đường lưu file Electron) — đã
   xác minh theo note "kiểm tra lại sink khi gộp".
5. **`Toasts.tsx`:** param `.map((t) => …)` che tên import `t` nên phải
   dùng alias `i18nT` (phát hiện nhờ `tsc`, xem §4). Không đổi tên param
   để tránh đụng chạm không cần thiết.

## 3. Giới hạn còn lại (trung thực)

- **Chưa render-test được chuỗi VI sau nối ở trạng thái hiện tại.**
  Key mới chỉ nằm trong fragment, chưa gộp vào `vi.json`/`en.json` nên
  `t()` trả về chính key khi render. Test M1 vì vậy:
  (a) khóa nội dung fragment + mô phỏng dict đã gộp (main + fragment)
  bằng cùng logic lookup của `i18n/index.ts`;
  (b) render EN thật chỉ assert "không còn literal VI" và chấp nhận
  key-hoặc-chuỗi-EN. Assert render VI đầy đủ ("Thư viện media" hiện
  khi `setLang("vi")`, "Media library" khi `setLang("en")`) chỉ chạy
  được SAU KHI parent gộp fragment — chưa làm trong đợt này, cần một
  lượt kiểm chứng sau merge.
- **Chưa render-test `App.tsx`, `preview.tsx`, `Inspector.tsx`,
  `TrackPanel.tsx`, `Toasts.tsx`, `desktop.ts`, `media.ts`.**
  App/preview là component nặng (canvas + store + effect); TrackPanel
  trả `null` khi không có selection (SSR thấy state khởi tạo, cùng giới
  hạn như L2 đã ghi cho HistoryPanel); Toasts trả `null` khi không có
  toast (subscribe chạy trong `useEffect`, SSR không chạy); desktop.ts /
  media.ts là code non-React (lỗi chỉ hiện khi bridge/probe lỗi thật).
  Các file này chỉ khóa ở mức source + dict — đo headed trên browser
  thật sẽ phủ các nhánh này.
- **Literal VI còn sót trong 9 file: 0** (kiểm tra bằng script quét mọi
  đoạn text cố định của 77 proposal + fallback `"lỗi không rõ"`; 2 kết
  quả dương tính giả đều là comment code: `TrackPanel.tsx:11` "bám điểm
  quỹ đạo…" và `preview.tsx:2630,3710` "nested lỗi…"). Các literal VI
  khác ngoài phạm vi 9 file / ngoài 77 key đề xuất KHÔNG thuộc luồng này.
- **`MediaBin.tsx` — nút proxy khi `proxyBusy` hiện `"…"` và khi có
  proxy hiện `` `✓ PROXY ${h}p` ``:** không có key đề xuất cho 2 chuỗi
  này (chỉ là ký hiệu, không chứa tiếng Việt) nên giữ nguyên.
- **25 proposal có note "cần xác minh theo source":** không proposal
  nào trong số đó thuộc 9 file của M1 (đã kiểm tra bằng script lọc theo
  sites); mọi site của M1 đều khớp literal gốc từng chữ.
- **Fragment chưa được merge:** `vi.json`/`en.json` hiện tại chưa chứa
  78 key này. Parent PHẢI gộp `fragments/round56-m1.json` (deep-merge
  theo namespace) trước khi các chuỗi mới hiện ở UI. Test M1 có assert
  tương thích cả 2 trạng thái (pre-merge vắng / post-merge trùng giá
  trị) nên vẫn xanh sau merge.

## 4. Kiểm chứng (số thật, chạy trong đợt)

- `tsc --noEmit` trong `apps/web`: **pass, 0 error** (lúc đầu báo 2 lỗi
  ở `Toasts.tsx` do `t` bị param map che — đã sửa bằng alias `i18nT`
  rồi chạy lại sạch; xem §2.5).
- Test `apps/web/src/lib/i18nAudit56M1.test.ts`, bundle bằng esbuild
  `--format=cjs` rồi chạy node:
  `./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M1.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round56-m1/m1.test.cjs && node /tmp/round56-m1/m1.test.cjs`
  → **14/14 pass** (3 test dict fragment/merge + 2 test render EN
  MediaBin/TtsButton + 9 test source theo file). Cảnh báo esbuild duy
  nhất là `import.meta` không khả dụng ở format cjs trong `bridgeUrl.ts`
  — có từ trước, giống mẫu L2, không ảnh hưởng test.
- `vite build` trong `apps/web`: **pass** (`✓ built in 31.82s`;
  cảnh báo chunk > 500 kB có từ trước).
- Kiểm tra va chạm key: 78 key fragment không trùng key nào trong
  `vi.json`/`en.json` hiện tại; placeholder `{var}` khớp vi/en ở cả 78 key.
- Stage: `~/workspace/repo-1-push/paths-loop/phase9-round56-m1-i18n-app.txt`
  (NUL-delimited, 12 file text, đã verify bằng read-back).

## 5. File đổi/thêm (12 file, KHÔNG push)

- `apps/web/src/App.tsx`
- `apps/web/src/MediaBin.tsx`
- `apps/web/src/preview.tsx`
- `apps/web/src/Inspector.tsx`
- `apps/web/src/components/Toasts.tsx`
- `apps/web/src/desktop.ts`
- `apps/web/src/media.ts`
- `apps/web/src/components/sticker/TrackPanel.tsx`
- `apps/web/src/components/TtsButton.tsx`
- `apps/web/src/i18n/fragments/round56-m1.json` (mới)
- `apps/web/src/lib/i18nAudit56M1.test.ts` (mới)
- `docs/PHASE9_ROUND56_M1_I18N_WIRING_LIMITS.md` (mới, file này)
