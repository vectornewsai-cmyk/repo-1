# PHASE 9 — ĐỢT 64, LUỒNG R8: HIỂN THỊ job.note TRONG UI — LIMITS

Ngày: 2026-11-08. Luồng R8, đóng nợ đợt 63 §2/§6.7 (key
`jobNote.recoveredRestart` đã có trong fragment round63-r5 nhưng parent
gộp đợt 63 KHÔNG đưa vào dict vì "web hiện không hiển thị job.note ở đâu").
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG
release/tag.

## 0. Tóm tắt những gì đã nối

| Hạng mục | Trước | Sau |
|---|---|---|
| Web hiển thị `job.note` | không chỗ nào hiển thị (grep verify đợt 63 R5) | ExportPanel hiện dòng `.render-note` dưới thanh tiến trình khi job có note |
| `publicJob.note`/`noteCode` | bridge đã lộ ra API từ đợt 63 R5, web bỏ qua | `pollStatus` đọc `data.noteCode`/`data.note` mỗi giây, resolve qua `lib/jobNote64R8.ts` |
| `jobNote.recoveredRestart` | chỉ trong fragment round63-r5, chưa vào dict | khai lại trong fragment round64-r8 (giá trị Y HỆT) để parent gộp đợt 64 đưa vào dict; lib đọc fragment trực tiếp nên hiện ngay, không chờ gộp |
| Test khóa | không có | `jobNote64R8.test.ts` 19/19 + headed `clicktest-64r8-job-note-headed.mjs` 6/6 |

## 1. Đường đi của job.note — đã verify trên code + đo thật

```
bridge jobQueue recover sau restart (4 nhánh, đợt 63 R5)
  → job.note = RECOVER_NOTE ("Phục hồi sau khi server restart — render lại từ đầu.")
  → job.noteCode = "JOB_RECOVERED_RESTART", lưu bền trong job.json
  → publicJob lộ note + noteCode ra API (GET /api/render/:id, cả khi poll ?detail=1)
  → ExportPanel.pollStatus (poll 1s) đọc data.noteCode / data.note
  → resolveJobNote (lib/jobNote64R8.ts): mã quen → chuỗi localize theo
    locale; mã lạ → chuỗi note thô; không note → "" (không hiện gì)
  → state renderNote → dòng <div class="render-note" role="note">
    trong khối .render-progress (dưới nhãn tiến trình, chỉ khi đang render)
```

**Điểm tiêu thụ publicJob trong web — liệt kê đầy đủ (grep `api/render`
trên `apps/web/src`, phi-test): CHỈ CÓ ExportPanel.** `pollStatus` là
nơi duy nhất poll job (`GET ${BRIDGE_URL}/api/render/${id}?detail=1`).
Không có job panel / job list / status bar nào khác trong web; `media.ts`
chỉ nhắc `render/` ở đường khác, không poll job. Vì vậy ExportPanel là
chỗ hiển thị duy nhất hợp lý — không tạo panel mới, không dùng toast
(toast hiện 1 lần rồi mất, còn note là trạng thái bền của job trong lúc
nó chạy lại từ đầu).

**Vì sao poll vẫn bắt được note sau restart:** `pollStatus` giữ interval
khi fetch lỗi (catch giữ polling — bridge chết thì poll lỗi lặng, bridge
lên lại thì poll tiếp job id cũ; job đã phục hồi từ `job.json` nên GET
trả `noteCode` ngay). Đo headed H3/H4 chứng minh thật (xem §5).

## 2. i18n / fragment / dict

- Fragment mới `apps/web/src/i18n/fragments/round64-r8.json`: **1 key**
  `jobNote.recoveredRestart`, giá trị vi/en **Y HỆT** fragment round63-r5
  (test `jobNote64R8` khóa vi khớp từng byte `RECOVER_NOTE` của bridge;
  test `validationErrors63R5` khóa round64-r8 đồng giá trị round63-r5 —
  lệch là đỏ). KHÔNG sửa trực tiếp `vi.json`/`en.json`.
- Lib đọc fragment trực tiếp lúc chạy (mẫu `scenePhase63R5.ts`): chuỗi en
  hiện ngay, không chờ parent gộp dict.
- **Bẫy đã gặp và sửa trong lúc làm:** mã bridge là `JOB_RECOVERED_RESTART`
  (SCREAMING_SNAKE) nhưng key fragment là `recoveredRestart` (camelCase)
  — lần chạy test đầu 15/19 vì lookup thẳng `table[noteCode]` ra
  `undefined`. Đã thêm map tường minh `NOTE_CODE_TO_FRAGMENT_KEY`
  (cầu nối duy nhất giữa 2 quy ước đặt tên), test khóa map 1:1 cả 2 chiều.
- `"jobNote."` đã thêm vào `DYNAMIC_PREFIXES` ở cả 2 test
  `i18nAudit59P7` + `i18nOrphans60Q4` (tiền lệ đợt 63 §4.1: key đọc qua
  bảng fragment, chuỗi key đầy đủ không xuất hiện trong src — không thêm
  thì sau khi parent gộp key sẽ bị coi mồ côi).
- `validationErrors63R5.test.ts` đã cập nhật cho trạng thái đợt 64: cho
  phép đúng 1 ngoại lệ trùng key (`jobNote.recoveredRestart` ở
  round64-r8, giá trị phải y hệt); phần "chưa gộp vào dict" vẫn giữ
  nguyên (dict hiện vẫn chưa có key). **Parent gộp đợt 64 phải:**
  (1) đưa key vào dict vi/en từ fragment round64-r8;
  (2) lật 2 assert "chưa gộp" trong test này thành "đã có" (mẫu R5 §7);
  (3) dict sau gộp kỳ vọng 2275 + 1 = **2276 key lá**.

## 3. Hành vi UI — quyết định + hệ quả

- **Chỉ hiện trong lúc render** (khối `.render-progress`, trạng thái
  `uploading`/`rendering`). Khi job `done`/`error`/`cancelled`, khối
  tiến trình unmount nên note biến theo — đúng ngữ nghĩa: note giải thích
  "tại sao render này chạy lại từ đầu", hết render thì không còn cần.
- **Job thường không có note → không hiện gì thêm** (state `null`,
  render có điều kiện `{renderNote && ...}`). Đo headed H1 khóa.
- **Reset note** khi bắt đầu render mới và khi huỷ render (test khóa
  ≥2 lần `setRenderNote(null)`).
- **Đổi locale giữa chừng:** poll dùng `getLang()` (đọc locale hiện tại
  lúc poll) thay vì biến `lang` trong closure của interval — interval giữ
  closure cũ từ lúc `startRender` nên dùng `lang` sẽ kẹt locale cũ; với
  `getLang()`, poll sau (≤1s) dịch lại note theo locale mới.
- **Mã noteCode lạ trong tương lai:** hiện chuỗi note thô bridge gửi kèm
  (không mất thông tin); chỉ cần thêm mã + key fragment thì mới dịch
  được. Mã lạ mà không có note thô → không hiện gì (không bao giờ in mã
  hay key thô ra UI — test khóa).

## 4. Note nào đã / chưa hiển thị

- **Đã hiển thị:** `JOB_RECOVERED_RESTART` — job phục hồi sau restart
  (cả 4 nhánh recover: queued-thiếu-spec, queued-có-spec,
  running→interrupted, và nhánh restoreRecord còn lại — đều gắn cùng
  `RECOVER_NOTE` + mã này; test bridge 142 pass khóa).
- **Chưa có note nào khác trên bridge:** `jobQueue.js` hiện chỉ sinh đúng
  1 mã noteCode này (test quét mọi literal `"MÃ"` trên dòng chứa
  `noteCode` trong `jobQueue.js` — chỉ thấy `JOB_RECOVERED_RESTART`).
  Mã note mới ở bridge sau này tự hiện qua fallback chuỗi thô, nhưng
  muốn dịch thì phải thêm vào `JOB_NOTE_CODES` +
  `NOTE_CODE_TO_FRAGMENT_KEY` + fragment (xem §2).
- **`retry()` xóa note/noteCode** (bridge, đợt 63 R5): job lỗi rồi user
  bấm render lại thì note cũ bị xóa — UI không hiện note của lần chạy cũ
  cho lần chạy mới (đúng vì lần chạy mới không phải phục hồi).

## 5. Kiểm chứng (số thật, chạy 2026-11-08)

| Test | Kết quả |
|---|---|
| `apps/web/src/lib/jobNote64R8.test.ts` (mới) | **19/19 pass** (fragment↔bridge 3 chiều, resolver, fallback, nối UI tĩnh) |
| Headed `apps/web/scripts/clicktest-64r8-job-note-headed.mjs` (mới) | **6/6 pass** — H0 mẫu 3 clip/2 media/8s; H1 `.render-note` vắng trước render; H2 SIGKILL bridge lúc job `b3974d34a3657551` running progress=0; H3 bridge restart recover: job status=`interrupted`, `noteCode=JOB_RECOVERED_RESTART`, note đúng chuỗi; H4 `.render-note` hiện, role=note, visible, đúng chuỗi vi; H5 0 lỗi trang |
| `tsc` apps/web | **xem §6** — file của R8 0 lỗi; 2 lỗi ở `projectHistory.ts` của luồng khác đang làm dở |
| `vite build` apps/web | **pass** (1m 6s) |
| `i18nOrphans60Q4.test.ts` | **16/16 pass** |
| `cssClasses60Q2.test.ts` | **59/59 pass** (`.render-note` đã định nghĩa trong styles.css) |
| `validationErrors63R5.test.ts` | **8/8 pass** (sau khi cập nhật ngoại lệ trùng key, xem §2) |
| `bridgeErrors62R5.test.ts` | **8/9** — 1 fail của luồng khác, xem §6 |
| `i18nAudit59P7.test.ts` | **7/8** — 1 fail của luồng khác, xem §6 |
| `server/bridge/test/test-bridge-error-protocol.cjs` (unit) | **142 pass, 0 fail** (hồi quy server, R8 không đụng server) |

## 6. Không xanh do luồng khác đang làm dở (KHÔNG phải của R8, không đụng vào)

- **`projectHistory.ts` (luồng R6 đợt 64, đang sửa lúc R8 chạy):**
  file sửa 05:49:57 UTC trong lúc R8 chạy tsc lần 1; `tsc` lần 1 báo 2 lỗi
  tại đó (import `projectNameRegistry64R6.ts` chưa dùng + đuôi `.ts`
  không được phép), lần 2 (06:0x UTC) còn 1 lỗi TS5097 — luồng đó đã sửa
  được 1/2 trong lúc R8 chạy. P7 1 fail cũng từ file này (literal
  `migrateVersions cần projectId đích hợp lệ…` chưa nối). R8 không sửa
  file này — chờ luồng đó xong thì 2 chỗ này phải xanh lại.
- **`fastMotion64R2.test.ts` (luồng R2 đợt 64):** `tsc` lần 2 báo thêm 1
  lỗi TS6133 (`approx` khai mà không dùng, dòng 66) — file của luồng
  khác, xuất hiện sau lần chạy tsc đầu của R8. R8 không đụng.
- **`bridgeErrors62R5` 8/9 — `RATE_LIMITED` trong catalog nhưng không còn
  call site nào dùng:** `server/bridge/src/index.js` sửa 05:51:03 UTC +
  `server/bridge/src/rateLimit.js` sửa 05:50:39 UTC — một luồng khác
  đang sửa rate limiter trong lúc R8 chạy test. R8 không đụng file
  server nào.
- Cả 2 nhóm đỏ đều được xác định bằng mtime file + nội dung lỗi (không
  liên quan file R8 chạm), theo tiền lệ đợt 63 R5 LIMITS §7.

## 7. Nợ mở (mới + cũ, chưa đóng)

1. **Parent gộp đợt 64** (xem §2): đưa `jobNote.recoveredRestart` vào
   dict + lật test `validationErrors63R5` sang "đã có" (dict kỳ vọng 2276
   lá). Nếu parent quên, key vẫn hiển thị được qua fragment trực tiếp
   (không vỡ UI), chỉ là dict thiếu 1 key.
2. **Note chỉ hiện trong lúc render** (xem §3): job đã `done` sau khi
   phục hồi thì user mở lại ExportPanel không còn thấy note — chấp nhận
   có chủ đích; muốn giữ lịch sử note thì cần UI "lịch sử job" riêng
   (hiện web chưa có job list).
3. **Chưa test đổi locale giữa chừng lúc note đang hiện** (en ↔ vi khi
   job recovered đang render): logic `getLang()` + poll 1s đã viết đúng
   hướng nhưng chưa có case headed nào bấm đổi locale đúng lúc đó.
   Trường hợp này hiếm (đổi locale giữa lúc render sau restart) nên để
   nợ, không chặn đợt.
4. **Chưa test note ở preset custom / mobile viewport:** headed chạy
   preset mặc định 1080p, viewport desktop 1440×900. `.render-note` là
   block text thường trong flex column nên không có lý do vỡ layout ở
   mobile, nhưng chưa đo thật.
5. **`.github/workflows/ci-security.yml` vẫn 403** (App thiếu quyền
   workflows:write) — nợ cũ, không đổi.
6. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.

## 8. File đổi/thêm (stage batch `phase9-round64-r8-job-note-ui.txt`, 10 file)

Mới (5): `apps/web/src/lib/jobNote64R8.ts`,
`apps/web/src/lib/jobNote64R8.test.ts`,
`apps/web/src/i18n/fragments/round64-r8.json`,
`apps/web/scripts/clicktest-64r8-job-note-headed.mjs`,
`docs/PHASE9_ROUND64_R8_JOB_NOTE_UI_LIMITS.md`.
Sửa (5): `apps/web/src/ExportPanel.tsx` (import + state renderNote +
poll + reset + JSX `.render-note`), `apps/web/src/styles.css`
(`.render-note`), `apps/web/src/lib/i18nAudit59P7.test.ts`
(`"jobNote."` vào DYNAMIC_PREFIXES),
`apps/web/src/lib/i18nOrphans60Q4.test.ts` (như trên),
`apps/web/src/lib/validationErrors63R5.test.ts` (ngoại lệ trùng key
round64-r8 + ghi chú lật test lúc parent gộp).
