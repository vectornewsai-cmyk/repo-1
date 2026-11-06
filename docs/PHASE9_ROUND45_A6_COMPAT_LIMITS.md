# Phase 9 đợt 45 — luồng A6: compat (badge từng frame + badge đổi lang + chi phí probe)

Ngày: 05/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist vào batch. Mọi số timing trong đợt này đều đo dưới tải song
song (các luồng đợt 45 khác cùng chạy trên VM) — cấm dùng làm baseline
quiet. Luồng này chỉ sửa `preview.tsx` trong các file chung; `store.ts`
đã rà soát và KHÔNG cần sửa (xem §2.4).

## 1. Phạm vi: đóng nợ Z6 §6.2, §6.3, §6.4 (nợ compat đợt 44 §4.7)

- §6.2 Badge từng frame: Z6 khóa badge = đường đã chọn; muốn badge đổi
  theo frame thực tế cần đọc trạng thái `failed` của controller.
  → ĐÃ LÀM (§2.1–§2.2).
- §6.3 Badge đổi lang lúc pause có thể chậm 1 tick (thực chất: chậm tới
  khi vòng lặp tỉnh lại, vì vòng lặp NGỦ khi pause — xem §3.2).
  → ĐÃ SỬA ở mức code + khóa ở mức thuần (§2.3, §3.2); headed cho
  effect vẫn là nợ (§5.2).
- §6.4 Chi phí probe mỗi cửa sổ GOP chưa có số ms.
  → ĐÃ ĐO trên Chromium thật (§2.5, §3.3).
- Safari / Firefox / máy thật / màn hình vật lý: VẪN CHƯA ĐO (ghi rõ,
  không bịa — §5.1).

## 2. Các sửa (marker `// ROUND45-A6`, không reformat file)

### 2.1. Trạng thái `failed` của controller nằm ở đâu

`ReversePreviewController.failed` (getter, `reverseWebcodecs.ts:718`)
= cờ riêng `unsupported`, dính vĩnh viễn sau: load hỏng
(`loadPromise` false), decode 0 frame ở cả 2 đường ensureWindow,
decode throw (fail-soft), hoặc khóa file lớn S4 (`rejectLargeFile`).
Nó là trạng thái "controller này không còn decode WebCodecs được nữa,
mọi frame sau đó rơi về element" — đúng tín hiệu badge từng frame cần.
A6 KHÔNG sửa `reverseWebcodecs.ts` (ngoài phạm vi file của luồng).

### 2.2. Badge từng frame (không sửa `reversePlayback.ts`)

File mới: `apps/web/src/lib/reverseBadge45A6.ts` — bọc hàm Z6
`resolveReverseEngineBadge`, chỉ thêm MỘT đầu vào `controllerFailed`:

- `resolveReverseEngineBadge45A6(detailed, stepping, controllerFailed)`:
  - Đường đã chọn webcodecs + failed → `{ kind: "element-failed",
    missingApi: null, controllerFailed: true }` (badge đổi sang
    element, nền amber như element-missing).
  - failed = false → kind + missingApi BẰNG ĐÚNG hàm Z6 (test đối
    chiếu trực tiếp cả 8 trường hợp cũ, §3.1).
  - Đường đã chọn đã là element (thiếu API) + failed → giữ nguyên
    element-missing, `controllerFailed: false`: controller WebCodecs
    không chạy thì failed không áp dụng, không được ghi đè lý do
    thiếu API.
  - Không stepping hoặc opt-in tắt → null (badge ẩn), kể cả khi
    failed = true.
- `preview.tsx` (khối badge trong tick): khi đường đã chọn là
  webcodecs + đang stepping, đọc `failed` của controller cho clip
  đang xem ở playhead `t` qua `getReversePreviewController` với ĐÚNG
  tham số đường vẽ dùng (`it.proxyUrl ?? it.url`,
  `knownSizeBytesForPreview(it)`, `{ gopRangeEnabled: true }`) nên
  lần tạo controller (nếu chưa có) không khác gì đường vẽ tạo sau đó
  trong cùng tick — không khóa nhầm GOP, không fetch thêm (fetch chỉ
  bắt đầu ở `frameAt` trong `drawVideoClip`). Chỉ xét clip đang
  stepping (phát ngược toàn cục → mọi clip; ngược lại chỉ clip có
  `reverse=true`) để controller failed cũ của clip phát xuôi dùng
  chung URL không làm lệch badge. Toàn bộ khối bọc try/catch như cũ:
  badge không được làm hỏng vòng lặp.
- Giới hạn ngữ nghĩa (ghi rõ, không phóng đại): badge nay là "đường
  đã chọn, trừ khi controller đã failed thì báo element" — vẫn KHÔNG
  phải "đường vẽ của đúng frame vừa vẽ" theo từng frame riêng lẻ
  (frame chưa decode kịp nhưng controller chưa failed vẫn báo
  WEBCODECS như Z6; chỉ khi controller đã khóa failed mới đổi).
  Badge vẫn là 1 badge toàn cục cho clip ở playhead, không phải badge
  riêng từng track khi nhiều clip chồng nhau.

### 2.3. Badge đổi lang lúc pause (nợ Z6 §6.3) — tái hiện + sửa

Tái hiện ở mức thuần (test §3.2): cách cũ chỉ tính text trong tick
vòng lặp → đổi lang mà chưa có tick thì text cache vẫn chuỗi cũ.
Khi đang phát thì tick tới ngay nên chỉ chậm 1 tick (đúng như Z6 ghi);
khi đang pause thì vòng lặp NGỦ (luật T5 đợt 21) và đổi lang không
đánh thức nó (lang sống ở `useSyncExternalStore`, không phải store
subscribe của loop) nên chuỗi cũ kẹt tới khi vòng lặp tỉnh lại —
lâu hơn 1 tick, Z6 ghi "có thể chậm 1 tick" là còn nhẹ.

Sửa ở `preview.tsx` (không đụng `store.ts` — lang không nằm ở đó):

- Hàm hiển thị thuần `reverseEngineBadgeDisplay45A6(badge, t)` (file
  45A6): nhận hàm `t()` hiện tại nên gọi lại là ra chuỗi lang mới,
  không phụ thuộc tick.
- Tick badge lưu badge cuối vào ref `lastReverseEngineBadge45A6Ref`.
- Effect mới `useEffect(..., [previewLang])` (cạnh effect decode-ahead
  của U1): đổi lang → tính lại text/title/bg từ badge đã lưu và ghi
  thẳng DOM, kể cả khi vòng lặp đang ngủ. Badge đang ẩn (null) hoặc
  chưa có tick nào → no-op. Effect cũng chạy ở lần mount đầu nhưng
  khi đó badge chưa có nên vô hại.
- Sau sửa, "lang đổi → badge render lại ngay" đúng ở mức: effect
  React chạy ngay sau re-render do `useLang()` (không chờ tick vòng
  lặp). Mức này chưa có bằng chứng headed (§5.2).

### 2.4. `store.ts`: đã rà, không sửa

Trạng thái badge nằm ở DOM ref trong `preview.tsx`, trạng thái
controller nằm ở registry `previewControllers` trong
`reverseWebcodecs.ts`, trạng thái lang nằm ở `i18n/index.ts`
(`useSyncExternalStore`) — không trạng thái nào trong 3 trạng thái
đó sống ở `store.ts` nên luồng này không sửa `store.ts`. Mọi lệnh
`importFiles`/reverse trong `store.ts` giữ nguyên.

### 2.5. Chi phí probe mỗi cửa sổ GOP (đóng nợ Z6 §6.4)

File mới: `apps/web/scripts/probeCost45A6.mjs` — đo lệnh
`VideoDecoder.isConfigSupported` THẬT trên Chromium thật (Playwright
cache `chromium-1248`, Xvfb riêng, pipe CDP mẫu Z6; không còn display
trống thì rơi về `--headless=new`, ghi rõ mode ở output). Config
dùng đúng shape `decoderConfig` của `decodeGop` (fixture Z6:
`avc1.64001F`, 64×64; arm C xoay 3 codec × 3 kích thước × 2 hw).
Mỗi arm warmup 50 + đo 600 lần gọi tuần tự (1 probe = 1 cửa sổ GOP).

Kết quả (2 lần chạy, headed Xvfb `:90`, under-load-parallel):

| Arm | n | supported | median | p95 | p99 | mean | max |
|---|---|---|---|---|---|---|---|
| A cùng config, prefer-software (đường production: mọi điểm gọi controller đều truyền `preferHardware=false`) | 600 | 600 | 0 ms* | 0,1 ms | 0,1 ms | 0,007–0,009 ms | 0,1–0,2 ms |
| B cùng config, prefer-hardware | 600 | 0 | 0 ms* | 0,1 ms | 0,1 ms | 0,014 ms | 0,7 ms |
| C xoay 12 config | 600 | 299 | 0 ms* | 0,1 ms | 0,1 ms | 0,010 ms | 0,2 ms |

\* `performance.now()` trong trang không cross-origin-isolated nên độ
phân giải hiển thị là 0,1 ms: median "0 ms" nghĩa là DƯỚI ngưỡng
phân giải 0,1 ms, không phải 0 thời gian tuyệt đối. Kết luận đúng:
probe tốn ≤ ~0,1 ms mỗi cửa sổ GOP (p95) — không đáng kể so với
decode 1 cửa sổ (ms–giây), không cần tối ưu thêm.

Lưu ý từ arm B (không phải lỗi đo): trên VM không GPU này,
`prefer-hardware` trả unsupported 0/600 cho cùng codec mà
prefer-software hỗ trợ 600/600. Production hiện an toàn vì mọi điểm
gọi đều truyền false; nhưng nếu đường nào trong tương lai truyền
`preferHardware=true`, probe sẽ trả 0 → controller failed → badge
A6 nay sẽ hiện element-failed (đúng), chứ không im lặng như trước.

## 3. Số đo thật sau sửa

### 3.1. Test Node mới A6: 12/12 pass

File: `apps/web/src/lib/reverseBadge45A6.test.ts` (esbuild bundle
`--format=esm`, chạy từ gốc repo, bundle ra scratch ngoài repo):

- failed + webcodecs + stepping → element-failed (khóa chính).
- failed = false → kind/missingApi bằng đúng hàm Z6 ở cả 8 trường
  hợp cũ (webcodecs/missing từng API/opt-off × stepping on/off).
- failed + element-missing → giữ element-missing (không ghi đè lý
  do); failed + không stepping / opt-off → null.
- Display: cùng badge, `t()` vi → chuỗi vi, `t()` en → chuỗi en
  (không cần tick); failed → text element amber + token
  "WebCodecs decode"; badge null → rỗng.
- Test KHÔNG đọc file i18n JSON thật (tránh lỗi CWD như Z6): chuỗi
  vi/en mô phỏng bằng 2 hàm `t()` giả có cùng key + placeholder
  `{api}` như dict thật — khóa hành vi đổi lang của hàm display,
  không mạo nhận đã kiểm chứng nội dung dict (dict đã khóa ở Z6).

### 3.2. Hồi quy + build

- Z6 Node rerun: **10/10** (không đổi).
- `tsc --noEmit` (apps/web): toàn bộ output chỉ có 3 lỗi, TẤT CẢ là
  TS5097 (import đuôi `.ts` khi chưa bật `allowImportingTsExtensions`)
  ở file test — 2 lỗi thuộc test A6 này, 1 lỗi thuộc file test của
  luồng khác cùng đợt 45 (`pause45A2.test.ts`); A6 không sửa lén file
  đó. **Module thuần 45A6 và `preview.tsx`: 0 lỗi.** Xem §4 về
  exclude tsconfig cần parent thêm ở bước gộp.
- `vite build` (trực tiếp, `--outDir /tmp`, KHÔNG qua script `build`
  vì script đó chạy `tsc` trước và sẽ fail do 3 lỗi test trên):
  pass, 6,08 s dưới tải, chỉ cảnh báo chunk > 500 kB cũ. `dist/`
  và `/tmp` KHÔNG đưa vào batch.

## 4. Việc parent cần làm ở bước gộp (A6 KHÔNG tự làm để tránh xung đột)

1. Thêm 1 dòng exclude vào `apps/web/tsconfig.json` cho
   `src/lib/reverseBadge45A6.test.ts` (tiền lệ mọi test `.ts` khác,
   xem §3.2 — A6 cố tình không sửa `tsconfig.json` theo lệnh luồng).
2. (Tùy chọn, wording — không bắt buộc cho tính đúng): thêm 2 key
   `reverseEngine.badgeElementFailed` / `titleElementFailed` (vi/en)
   rồi đổi 2 lời gọi `t()` trong `reverseEngineBadgeDisplay45A6`
   (nhánh element-failed) sang key mới. Hiện tại nhánh đó TẠM dùng
   key element-missing sẵn có với api = "WebCodecs decode" vì luật
   file đợt 45 cấm A6 sửa `i18n/*.json` (tránh xung đột với luồng
   khác + làm lệch đếm key 966/966 mà test khác có thể đang khóa).
   Text hiện tại báo đúng "về element vì decode không dùng được"
   nhưng câu chữ "thiếu …" chưa chuẩn nghĩa "decode thất bại" —
   ghi rõ để parent khỏi tưởng wording đã xong. Kind thuần và test
   không đổi khi đổi key (trừ 1 test khóa token "WebCodecs decode"
   cần cập nhật theo key mới).

## 5. Nợ còn lại trung thực

1. **Safari CHƯA ĐO, Firefox CHƯA ĐO, máy thật / màn hình vật lý
   CHƯA ĐO**: giữ nguyên từ Z6 — mọi suy luận về 2 trình duyệt này
   vẫn chỉ từ guard, chưa có bằng chứng thật nào. Probe cost §2.5
   cũng chỉ là Chromium trên VM.
2. **Headed cho effect đổi lang + badge failed**: effect
   `[previewLang]` và khối badge failed chỉ được kiểm chứng bằng
   test thuần + tsc + vite build; chưa có click-test headed nào bấm
   đổi lang lúc pause rồi đọc badge, hay làm controller failed thật
   trên Chromium rồi đọc badge (cần fixture footage hỏng + đường
   chạy app đầy đủ, ngoài phạm vi test thuần của luồng này).
3. **Wording badge failed** (§4.2): tạm dùng key element-missing,
   chưa phải câu chữ chuẩn "decode thất bại".
4. **Độ phân giải đo probe**: median dưới 0,1 ms là giới hạn của
   `performance.now()` không isolated, không phải độ chính xác tuyệt
   đối; muốn số mịn hơn cần trang cross-origin-isolated hoặc đo
   tổng 600 lần / 600 (mean đã cho ~0,01 ms, cùng bậc).
5. **Badge vẫn là 1 badge toàn cục** (§2.2): nhiều clip chồng nhau ở
   cùng playhead thì badge báo theo clip stepping đầu tiên failed
   (any-failed), không tách riêng từng track.

## 6. Danh sách file đổi/mới chính xác (5 file text, không binary/dist)

Đổi:
1. `apps/web/src/preview.tsx` — import wrapper 45A6 +
   `getReversePreviewController`, ref lưu badge cuối, khối badge
   tick đọc `controller.failed`, effect `[previewLang]` refresh
   badge, comment JSX (hunk `ROUND45-A6`).

Mới:
2. `apps/web/src/lib/reverseBadge45A6.ts` — hàm thuần
   `resolveReverseEngineBadge45A6` + `reverseEngineBadgeDisplay45A6`.
3. `apps/web/src/lib/reverseBadge45A6.test.ts` — test Node 12/12.
4. `apps/web/scripts/probeCost45A6.mjs` — script đo probe Chromium
   thật (3 arm, median/p95/p99).
5. `docs/PHASE9_ROUND45_A6_COMPAT_LIMITS.md` — tài liệu này.

Không đổi (ghi rõ để parent khỏi tìm): `store.ts` (§2.4),
`reversePlayback.ts` (chỉ bọc, không sửa), `reverseWebcodecs.ts`,
`i18n/*.json` (xem §4.2), `tsconfig.json` (xem §4.1), bridge.
File dùng chung `preview.tsx` còn chứa hunk của luồng khác cùng đợt
45 — đối chiếu theo marker.
