# PHASE 9 — ĐỢT 65, LUỒNG S10: ĐỔI LOCALE GIỮA CHỪNG LÚC jobNote ĐANG HIỆN — LIMITS

Ngày: 2026-11-08. Luồng S10, đóng nợ #10 đợt 65 (docs/PHASE9_ROUND64_LIMITS.md
§8.10 + §1/§4 về R8: "jobNote hiện lúc render thôi; chưa test đổi locale
giữa chừng lúc note đang hiện").
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG
release/tag.

## 0. Kết luận trước: KHÔNG CÓ LỖI — nợ đóng bằng kiểm chứng, không sửa code

Cơ chế R8 đã viết đúng hướng và đo headed chứng minh đúng thật: note
"Phục hồi sau khi server restart — render lại từ đầu." đổi sang chuỗi en
sau **1027 ms** khi đổi locale vi→en giữa chừng, và về lại vi sau **547 ms**
khi đổi ngược — không kẹt text cũ, không crash, modal re-render toàn bộ
sang ngôn ngữ mới, thanh tiến trình vẫn chạy. Không đổi một dòng code
sản phẩm nào trong luồng này; chỉ thêm test (unit 12/12 + headed 9/9).

## 1. Vì sao cơ chế R8 đúng (đã đọc code trước khi test)

- `ExportPanel.pollStatus` (poll 1s) gọi
  `resolveJobNote(data.noteCode, data.note, getLang())` — `getLang()` đọc
  locale HIỆN TẠI lúc poll, không dùng biến `lang` trong closure của
  interval (closure giữ locale lúc `startRender`, dùng nó sẽ kẹt).
- `resolveJobNote`/`jobNoteLabel` là hàm thuần theo locale: cùng một
  (noteCode, note) cho chuỗi vi với `"vi"` và chuỗi en với `"en"`, không
  cache theo mã (unit test khóa cả 2 chiều vi→en→vi→en).
- `setRenderNote` nằm trong tick `setInterval` của poll nên mỗi lần poll
  (≤1s) note được resolve lại theo locale mới — độ trễ tối đa ~1s + độ
  trễ đo, khớp số đo headed H5/H6 (§4).

## 2. Đường đổi locale khi note đang hiện — phát hiện trong lúc làm

Nút ngôn ngữ TopBar **không bấm được khi modal Export đang mở**:
`.modal-backdrop` là `position: fixed; inset: 0; z-index: 400`, phủ toàn
màn hình kể cả TopBar (`z-index: 30`); bấm vào vùng đó sẽ đóng modal
(`handleClose` → `stopPolling()` → unmount, mất note). Đây là hành vi
đúng của modal, không phải lỗi của jobNote — nhưng nó quyết định cách
test headed phải đổi locale:

- **Đường duy nhất đổi locale trong lúc note đang hiện (web + desktop):**
  desktop Electron — menu native Xem > Ngôn ngữ → `desktop.ts:334`
  `api.onLanguageChanged((lang) => setLang(lang))` (không qua DOM nên
  không bị backdrop chặn). Headed test gọi đúng hàm `setLang` này qua
  dynamic import `/src/i18n/index.ts` (cùng module instance với app,
  mẫu `STORE_FN` của R8 đã dùng cho `/src/store.ts`) — tức là đổi locale
  bằng đường thật của desktop, không mock UI.
- **Đường web thuần:** đóng modal → bấm nút cờ TopBar bằng chuột thật →
  mở lại panel. Headed H7 đo đường này: locale lật sang en thật (nút
  Xuất bản thành "⬇ Publish"), panel mở lại bằng en, nhưng
  `.render-note` VẮNG vì mở lại panel không resume job đang chạy
  (không có logic resume — `jobId` là state của component, mất khi
  unmount). Đây là hành vi có chủ đích từ R8 §3 (note chỉ hiện trong
  lúc render, đóng panel dừng polling), KHÔNG phải lỗi mới — ghi nhận
  để tránh hiểu lầm khi test bằng tay trên web.

## 3. Test mới

| Test | Kết quả |
|---|---|
| `apps/web/src/lib/jobNote65S10.test.ts` (mới) | **12/12 pass** — lib thuần theo locale (vi→en→vi→en), poll dùng `getLang()` không dùng closure `lang`, resolve trong tick poll 1s, không cache note, backdrop z 400 > topbar z 30, desktop `onLanguageChanged → setLang` |
| Headed `apps/web/scripts/clicktest-65s10-job-note-locale-headed.mjs` (mới) | **9/9 pass** — xem §4 |
| Hồi quy `jobNote64R8.test.ts` (R8, chạy lại) | **19/19 pass** |
| `tsc` apps/web | **0 lỗi** |

Cách chạy unit (từ gốc repo):
`./node_modules/.bin/esbuild apps/web/src/lib/jobNote65S10.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round65-s10/s10.test.cjs && node /tmp/round65-s10/s10.test.cjs`
Cách chạy headed (từ gốc repo):
`node apps/web/scripts/clicktest-65s10-job-note-locale-headed.mjs`
(env cổng/display riêng S10: dev 5650–5659, debug 9750–9759, bridge
8900–8909, display :206–:215, scratch hidden_files/round65-s10/headed).

## 4. Kiểm chứng headed (số thật, chạy 2026-11-08 15:43 +07)

| Case | Kết quả |
|---|---|
| H0 setup vi + mẫu tự load | PASS — 3 clip, media bin 2 item đều có file, duration 8s |
| H1 `.render-note` vắng trước render | PASS |
| H2 kill bridge lúc job running | PASS — job `04b4ce85b653a484` status=running progress=0 lúc SIGKILL |
| H3 bridge restart recover | PASS — job status=`interrupted`, noteCode=`JOB_RECOVERED_RESTART`, note đúng chuỗi vi (bằng chứng server) |
| H4 `.render-note` hiện chuỗi vi | PASS — role=note, visible=true |
| **H5 đổi locale vi→en lúc note đang hiện** | **PASS — note sang đúng chuỗi en "Recovered after a server restart — rendering again from the start." sau 1027 ms; tiêu đề modal sang "Export video"; thanh tiến trình còn; không kẹt text vi** |
| **H6 đổi ngược en→vi lúc note đang hiện** | **PASS — note về đúng chuỗi vi sau 547 ms; tiêu đề modal về "Xuất video"; không kẹt text en** |
| H7 đóng modal → bấm cờ TopBar → mở lại panel | PASS — bấm cờ bằng chuột thật lật locale sang en ("⬇ Publish"); mở lại panel bằng en, `.render-note` vắng (không resume — đúng thiết kế R8 §3) |
| H8 0 lỗi trang | PASS — không window.onerror / unhandledrejection cả phiên |

## 5. Nợ mở (mới + còn lại)

1. **Mở lại ExportPanel không resume job đang chạy** (H7): user đóng
   modal giữa lúc render rồi mở lại sẽ không thấy tiến trình/note nữa
   cho đến khi render xong (panel về idle). Đây là thiếu tính năng
   resume, không phải lỗi locale — cần một luồng riêng nếu muốn nối
   (panel mount → GET job đang chạy gần nhất → poll tiếp). Không làm
   trong luồng này vì ngoài phạm vi nợ #10.
2. **Note chỉ hiện trong lúc render** (nợ cũ R8 §7.2): job đã `done`
   sau phục hồi thì mở lại panel không còn thấy note — chấp nhận có
   chủ đích; muốn giữ lịch sử note cần UI "lịch sử job" riêng.
3. **Chưa test note ở preset custom / mobile viewport** (nợ cũ R8 §7.4):
   headed chạy preset mặc định 1080p, viewport desktop 1440×900.
4. **`.github/workflows/ci-security.yml` vẫn 403** (App thiếu quyền
   workflows:write) — nợ cũ, không đổi.
5. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.

## 6. File đổi/thêm (stage batch `phase9-round65-s10-job-note-locale.txt`, 3 file)

Mới (3): `apps/web/src/lib/jobNote65S10.test.ts`,
`apps/web/scripts/clicktest-65s10-job-note-locale-headed.mjs`,
`docs/PHASE9_ROUND65_S10_LIMITS.md`.
Sửa (0): không đổi code sản phẩm — cơ chế R8 đã đúng, nợ đóng bằng
kiểm chứng.
