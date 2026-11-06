# Phase 9 đợt 30, luồng M4 — Dịch nốt + sửa mức keyframe + click-test Cancel — GIỚI HẠN

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không sửa backend CLI/bridge (luồng M3 lo). Đọc cùng:
`docs/PHASE9_ROUND29_L4_PERLINE_FIX_LIMITS.md` (nợ §3 mà đợt này
đóng) và `docs/PHASE9_ROUND29_L3_ERRORDETAIL_UI_LIMITS.md` (chuỗi
cứng tạm mà đợt này thay bằng key).

## 1. Đã làm

### (1) Dịch nốt — banner ExportPanel, toast ProjectMenu, chuỗi errorDetail

- `ExportPanel.tsx` (chỉ banner/toast/i18n; logic poll `?detail=1`
  của L3 ở dòng ~507–510 KHÔNG đụng tới):
  - Banner warning nay dùng `formatWarningTranslated` (helper đợt 29
    L4) qua key `exportPanel.curveWarningsTitle` /
    `exportPanel.curveWarningsMore` / `exportPanel.curveBlockerNote` /
    `exportPanel.fixCurves`. Lưu ý dạng ngắn kế thừa từ L4: message
    J5 dịch là dạng ngắn của dict `speedCurve` (không còn tiền tố
    `.speedKeyframes.keyframes[i]` như message gốc) — cùng dạng
    panel đã hiện từ đợt 28; message gốc đầy đủ không mất (báo cáo
    vẫn giữ `message` gốc, chỉ cách hiển thị dùng dạng ngắn).
  - Khối errorDetail của L3: hai chuỗi cứng tạm nay qua key
    `exportPanel.errorDetailTitle` (`Chi tiết lỗi [{code}]:`) và
    `exportPanel.errorDetailMore` (`… và N dòng lỗi khác đã lược
    bớt.`). Summary/details/redactedTail KHÔNG dịch vì đó là dữ liệu
    bridge trả về (tiếng Việt từ server), không phải chuỗi UI cứng
    của L3 — muốn chúng theo locale phải dịch ở bridge, ngoài phạm
    vi luồng này (xem §3.4).
  - Confirm + tóm tắt của nút "Sửa curve vi phạm" nay dịch hết qua
    `formatFixEntryChanges` / `resolveUnsalvageableReason` /
    `formatSanitizeSummaryLocalized` + tái dùng key
    `loadReport.fixConfirm*` của App (không sinh key trùng nghĩa).
- `ProjectMenu.tsx` (chỉ đường mở file / nhập bản nén):
  - `warnListReport` mới: toast dựng từ CHÍNH report dùng cho panel
    (`buildLoadReport`): warnings cấu trúc dịch qua
    `formatWarningTranslated`, `otherWarnings` giữ nguyên (xem
    §3.2), câu tràn 100 qua key `loadReport.atCap`, tiền tố qua key
    mới `projectMenu.loadNotes`. `onFile` / `onArchiveFile` nay dùng
    chung một report cho toast + panel nên hai chỗ không lệch nhau.
  - Cổng LƯU FILE vẫn dùng `warnList` chuỗi thô cũ (xem §3.2).
- i18n: 11 key mới (2 `loadReport.*`, 1 `curveFix.*`, 7
  `exportPanel.*`, 1 `projectMenu.*`), vi/en khớp 1–1 — kiểm tra
  bằng test flatten TOÀN BỘ dict (899 key mỗi bên, 0 key mồ côi cả
  hai chiều; trước đợt này là 888). Không còn key thô rò ra UI ở
  các đường đã sửa (khóa bằng test + click-test en).

### (2) Toast sau sửa từ ExportPanel: truyền summary thật

- ĐÃ LÀM ĐƯỢC SẠCH, không cần giữ hành vi cũ: `fixCurves` nay gọi
  `st.fixSpeedCurveViolations(formatSanitizeSummaryLocalized(res,
  lookup))` thay vì gọi không tham số. Preview `res` tính trên cùng
  spec và `window.confirm` là đồng bộ nên tóm tắt truyền vào khớp
  kết quả action áp dụng ngay sau đó (cùng input → cùng kết quả);
  `curveFixMsg` hiển thị cũng lấy từ kết quả `applied` đã dịch.
  Nợ §3.3 của đợt 29 L4 nay ĐÓNG — toast sau sửa ở ExportPanel theo
  locale hiện tại ở cả hai locale (khóa bằng tóm tắt vi khớp từng
  chữ hàm cũ + en không rò key/vi trong test; wiring React được
  khóa bằng tsc + click-test, không có test render React).

### (3) Sửa mức KEYFRAME đơn lẻ — ĐÃ LÀM ĐƯỢC SẠCH

- `curveFix.sanitizeOneKeyframeCurve(curve, duration, keyframeIndex)`
  (mới, thuần): áp đúng luật K2 nhưng CHỈ cho keyframe đích.
  Keyframe khác giữ nguyên CẢ GIÁ TRỊ LẪN THAM CHIẾU (mảng mới chỉ
  thay/bỏ đúng một phần tử — test khóa bằng `===`). Các luật:
  clamp t/v, easing/bezier về linear, loại kf xấu (không phải
  object, t/v không hợp lệ), đơn điệu (chỉ kf sau bị loại, dùng t
  thô của kf hữu hạn gần nhất trước nó theo cách J5 tính prevT —
  quét ngược, bỏ qua kf có t không hữu hạn, dừng ở kf không phải
  object), vượt 128 (kf ngoài 128 đầu bị loại, key mới
  `curveFix.changeDropBeyondCap`), clamp t chạm t trước → loại
  (khớp kết quả toàn curve: clamp rồi loại ở bước đơn điệu).
  Khi bị loại chỉ báo đúng một thay đổi là "loại" (hiệu ứng ròng;
  các bước clamp trước đó vô nghĩa vì kf đã biến mất).
- `curveFix.sanitizeOneKeyframe(spec, path, keyframeIndex)` (mới) +
  `store.fixOneKeyframeViolation(path, keyframeIndex, summary?)`
  (mới, 1 bước undo, label riêng "Sửa 1 keyframe tốc độ (báo cáo
  tải)"): chỉ clip đích đổi, clip khác giữ nguyên tham chiếu;
  nested đúng clip trong; track khóa → skippedLocked; không cứu
  được → unsalvageable (đặc biệt: keyframe duy nhất mà phải bị loại
  thì KHÔNG loại lén — loại nó sẽ để lại curve rỗng nên toàn curve
  cũng từ chối, mức keyframe cũng vậy).
- UI: `LoadReportPanel` thêm nút "Sửa keyframe này"
  (`loadReport.fixKeyframe`, chỉ hiện khi dòng có keyframeIndex) +
  `App.handleFixKeyframe` (confirm liệt kê ĐÚNG MỘT thay đổi của kf
  đó, tiêu đề `loadReport.fixKeyframeConfirmTitle` ghi rõ clip +
  path + số keyframe). Nút "Sửa dòng này" (mức clip) GIỮ NGUYÊN
  ngữ nghĩa đợt 29 L4 — không đổi lén thành mức keyframe.
- Giới hạn trung thực của mức keyframe (không giấu):
  - Quyết định đơn điệu dùng t THÔ của hàng xóm chưa sửa. Sửa mức
    keyframe là một bước tiến tới curve sạch, không bảo đảm sạch
    toàn curve trong một lần (quét lại sau sửa có thể còn warning
    ở kf khác — đúng chủ đích: kf khác ở lại).
  - Warning quá 128 của J5 có keyframeIndex null nên KHÔNG có nút
    mức keyframe (không có kf đơn lẻ để nhắm tới) — dùng nút mức
    clip / fix-all. Tương tự warning shape/rỗng (null index).
  - Nút mức keyframe không sửa được kf duy nhất phải loại (xem
    trên) — khi đó chỉ toast tóm tắt "chưa sửa được", user sửa tay
    hoặc dùng nút mức clip (cũng sẽ báo không cứu được, đúng luật).

### (4) Click-test browser thật: Cancel + hồi quy (8/8 pass)

- Script mới `apps/web/scripts/clicktest-m4-round30-pipe.mjs` (tái
  dùng infra L4: pipe CDP `--remote-debugging-pipe` + snapshot dist
  + seed qua autosave + static server; khác L4 ở chỗ PipeCdp hỗ trợ
  DISMISS dialog qua `cdp.nextDialogAccept = false` để giả lập user
  bấm Cancel ở confirm thật — dialog vẫn là `window.confirm` thật,
  CDP chỉ bấm Accept/Cancel thay user).
- Seed phân biệt mức keyframe với mức clip: clip MULTI 2 kf vi phạm
  (kf0 v=5, kf1 v=0.1) + CLIP-B v=9 → đúng 3 warnings MULTI#0,
  MULTI#1, CLIP-B. Kết quả 8/8 pass (log đầy đủ ở
  `~/workspace/tmp-round30-m4/v30-m4-clicktest.json`):
  - M1: panel (3), 3 nút "Sửa dòng này" + 3 nút "Sửa keyframe này"
    + 1 nút "Sửa tất cả".
  - M2: click "Sửa keyframe này" dòng MULTI#0 → confirm chỉ nhắc
    keyframes[0] (không nhắc keyframes[1], không nhắc CLIP-B);
    autosave MULTI=[4, 0.1], B=9; panel còn 2 dòng.
  - M3 (case Cancel, nợ đợt 29 L4 §3.8 nay đóng): click "Sửa dòng
    này" dòng MULTI#1 rồi Cancel → dialog ghi accepted:false;
    autosave spec KHÔNG ĐỔI; panel vẫn 2 dòng; bấm lại cùng nút →
    confirm mở lại CÙNG NỘI DUNG (Cancel không tiêu thụ action).
  - M4/M5: hồi quy per-line (MULTI kf1 về 0.25, B vẫn 9) và fix-all
    (B về 4, panel hết warning) của L4.
  - M7 (locale en): panel en đủ 3 nhãn, confirm en chỉ nhắc
    keyframes[0], không rò key thô (`loadReport.` / `curveFix.` /
    `exportPanel.` / `projectMenu.`), không rò tiếng Việt; Cancel
    → autosave spec không đổi, panel vẫn 3 dòng.
  - M6/M8: 0 `Runtime.exceptionThrown` ở cả hai phiên.
- Bài học harness trong lượt (ghi rõ, không giấu): lần chạy đầu M3
  FAIL ở Cancel lần 2 vì assertion so sánh CHUỖI RAW của autosave
  (gồm envelope `savedAt`) — autosave debounce ghi lại envelope với
  `savedAt` mới dù spec y nguyên. Sửa assertion sang so sánh SPEC
  (JSON của spec) rồi chạy lại → 8/8. Lần chạy đầu không phải lỗi
  sản phẩm: spec không đổi trong cả hai lần Cancel (chỉ envelope
  đổi), và lần chạy lại xác nhận điều đó.

## 2. Kết quả kiểm chứng (chạy thật, 31/10/2026)

- Mới `curveFixKeyframe30.test.ts`: **21 pass, 0 fail** (node trực
  tiếp): kf-level chỉ kf đích đổi (tham chiếu kf khác giữ nguyên),
  đơn điệu / clamp chạm / easing / bezier / loại kf xấu / sole-kf /
  ngoài mảng / shape-rỗng / vượt 128, spec-level chỉ clip đích đổi
  + nested + khóa + path lạ, i18n parity toàn dict 899==899 + 11
  key mới + changeItems dịch vi khớp từng chữ / en không rò,
  chuỗi App kf-level (sửa kf0 → quét lại chỉ còn warning kf1),
  banner dùng formatWarningTranslated (en không rò key/vi).
- Hồi quy (node trực tiếp): L4 per-line **14/14**, `loadReport`
  **10/10**, fix28 **8/8**, J5 **15/15**, K2 **17/17**,
  `projectRepo` **10/10**, nested22 **7/7**, `projectHistory`
  **15/15** — tổng hồi quy 96, cộng 21 mới = **117 xanh, 0 fail**.
- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npx vite build` (apps/web): **pass** (34.10s).
- JSON vi/en đã parse kiểm chứng sau khi sửa (không vỡ cú pháp).
- Click-test: **8/8 pass** (xem §1.4; bundle snapshot chứa đủ nhãn
  đợt 30 + đợt 29 nên dist dùng để test đúng là code đợt này).

## 3. Chưa làm / giới hạn trung thực

1. **Toast đường LƯU FILE trong ProjectMenu vẫn chuỗi thô**
   (`warnList` giữ nguyên): `saveProject` chỉ trả `string[]`, không
   có warnings cấu trúc để dịch như đường mở file/archive. Muốn dịch
   phải đổi `saveProject` trả thêm warnings cấu trúc (phạm vi khác,
   đụng cổng lưu) — ngoài nhiệm vụ "mở file/nhập bản nén" của đợt
   này nên giữ nguyên, không sửa lén.
2. **Các lưu ý chuỗi khác trong toast mở file/archive giữ nguyên**
   (blob/migration/format): `buildLoadReport` tách chúng ra
   `otherWarnings` nhưng chúng không có dạng cấu trúc/messageKey
   nên không dịch được bằng `formatWarningTranslated` — chỉ warnings
   speedKeyframes là đã dịch. Toast en vì vậy có thể lẫn câu tiếng
   Việt ở phần lưu ý khác (không phải key thô, không phải lỗi dịch
   sai — là chuỗi gốc không có bản dịch).
3. **Toast lỗi (errors) của ProjectMenu giữ nguyên tiếng Việt**
   ("Không mở được file: …", "Không nhập được bản nén: …",
   "Không xuất được bản nén: …"): errors là chuỗi từ cổng load,
   không có dạng cấu trúc để dịch — ngoài nhiệm vụ đợt này (chỉ
   toast lưu ý/warnings), nên không claim là đã dịch hết ProjectMenu.
4. **Summary/details của errorDetail vẫn tiếng Việt của bridge**:
   chỉ tiêu đề + dòng "… và N dòng khác" là chuỗi UI (nay đã qua
   key); nội dung lỗi từ bridge vốn là tiếng Việt. Dịch nội dung
   này cần bridge trả summary/details theo locale (luồng M3/bridge),
   không phải việc của web đợt này.
5. **"Không sinh undo" sau Cancel chỉ chứng minh gián tiếp**: code
   return trước mọi store action + autosave spec + panel không đổi
   + confirm mở lại cùng nội dung. Độ sâu undo stack không đọc
   được qua CDP nên click-test không assert trực tiếp stack — xem
   ghi chú trong script. Đây là giới hạn của harness, không phải
   nghi ngờ về hành vi (đường code là `if (!confirm) return` trước
   mọi action, giống L4 đã khóa bằng logic thuần).
6. **Không có test render React** cho App handler / panel /
   ExportPanel / ProjectMenu (không chạy được bằng Node
   type-stripping, như mọi đợt trước). Các chỗ này là lớp mỏng gọi
   đúng các hàm thuần đã test; wiring khóa bằng tsc 0 lỗi + vite
   build pass + click-test browser thật 8/8.
7. **Click-test auto-accept/dismiss confirm** (ghi rõ như L4): dialog
   `window.confirm` là thật (browser tự mở, CDP ghi message), chỉ
   thao tác bấm OK/Cancel là harness thực hiện qua
   `Page.handleJavaScriptDialog` — vì không có người bấm thật.
   Nội dung confirm được assert đầy đủ nên việc này không làm giảm
   giá trị kiểm chứng; riêng case Cancel thì chính thao tác dismiss
   là đối tượng kiểm chứng (dialog ghi accepted:false).
8. **Ngoại lệ về danh sách file được đụng (báo cáo thẳng)**: nhiệm
   vụ liệt kê `App.tsx` không nằm trong file được đụng, nhưng nút
   "Sửa keyframe này" không thể hiện ra nếu App không truyền prop
   `onFixKeyframe` (panel prop là optional, không có handler thì nút
   ẩn). Luồng này đã sửa `App.tsx` TỐI THIỂU: chỉ thêm handler mới
   `handleFixKeyframe` + 1 import + 1 prop, KHÔNG sửa bất kỳ dòng
   handler cũ nào (per-line / fix-all / autosave giữ nguyên, hồi
   quy click-test M4/M5 xác nhận). Tương tự `store.ts` (thêm action
   mới, không sửa action cũ) và `tsconfig.json` (thêm file test mới
   vào exclude, theo quy ước repo từ L4) là phần nối bắt buộc của
   tính năng, không phải sửa lén ngữ nghĩa.

## 4. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/curveFix.ts` (`sanitizeOneKeyframeCurve`,
  `sanitizeOneKeyframe`; luật cũ giữ nguyên)
- `apps/web/src/store.ts` (action mới `fixOneKeyframeViolation`;
  hai action cũ không đổi)
- `apps/web/src/components/project/LoadReportPanel.tsx` (prop mới
  `onFixKeyframe` + nút "Sửa keyframe này" ở dòng có keyframeIndex)
- `apps/web/src/App.tsx` (handler mới `handleFixKeyframe` + truyền
  prop; xem ngoại lệ §3.8)
- `apps/web/src/ExportPanel.tsx` (chỉ banner/toast/i18n: warning
  qua `formatWarningTranslated`, confirm + summary đã dịch, toast
  sau sửa truyền summary thật, errorDetail qua key; logic poll
  `?detail=1` của L3 KHÔNG đụng)
- `apps/web/src/components/project/ProjectMenu.tsx` (toast mở
  file/nhập bản nén qua `warnListReport`; `warnList` đường lưu giữ
  nguyên)
- `apps/web/src/i18n/vi.json` (11 key mới; 888 → 899 key)
- `apps/web/src/i18n/en.json` (như vi, parity 1–1)
- `apps/web/tsconfig.json` (thêm `curveFixKeyframe30.test.ts` vào
  exclude, theo quy ước repo)
- `apps/web/src/lib/curveFixKeyframe30.test.ts` (mới, 21 test)
- `apps/web/scripts/clicktest-m4-round30-pipe.mjs` (mới, click-test
  CDP 8/8; log ở `~/workspace/tmp-round30-m4/v30-m4-clicktest.json`
  — thư mục tmp ngoài repo, không đưa vào batch)
- `docs/PHASE9_ROUND30_M4_I18N_KEYFRAME_LIMITS.md` (mới, file này)

Không đụng: `server/bridge/**`, CLI, `projectRepo.ts` (message J5
giữ nguyên), `preview.tsx`, `HistoryPanel.tsx`, logic poll
`?detail=1` của L3, handler per-line/fix-all cũ của App, action
store cũ. Không push, không tag, không binary, không file
paths-loop (parent lo stage). `apps/web/dist/` chỉ được build lại
tại chỗ để click-test snapshot, không tính là file đổi của đợt.
