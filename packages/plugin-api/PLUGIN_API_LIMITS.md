# PLUGIN_API_LIMITS.md — Giới hạn trung thực của Plugin API (R1-105)

## Những gì đã kiểm chứng (test-plugin-api.mjs: 24/24 pass)

1. Nạp 2 plugin mẫu (hello-world, watermark); hooks chạy đúng; log capture đúng.
2. `onClipRender` của watermark trả về filter `drawtext=...` hợp lệ; filter này
   đã được chạy **thật qua FFmpeg** và render ra MP4 hợp lệ (ffprobe đọc được).
3. Config override lúc load (text/fontSize/opacity) áp dụng đúng.
4. Capability registry liệt kê đúng capability của từng plugin.
5. Sandbox chặn: `require`, `process`, `eval`/`new Function` (codeGeneration tắt).
6. Manifest sai bị từ chối: thiếu permission `filter:inject` cho onClipRender,
   apiVersion không hỗ trợ, tên trùng.
7. Hook vòng lặp vô hạn bị timeout (~1s), lỗi ghi vào `hookErrors`, host không sập.
8. Filter nguy hiểm (`movie=/etc/passwd`) bị từ chối, không vào filter chain.
9. Hook trả Promise bị báo lỗi (hooks phải đồng bộ).
10. **Render worker đã nối registry thật** (`server/render/test_plugin_wire.js`:
    15/15 pass) — render MP4 với plugin watermark theo `id` trong spec, kiểm
    tra pixel: vùng dưới-phải sáng lên (mean xám 76.0 → 93.9), vùng trên-trái
    không đổi; warning của `onProjectValidate`/`onExportFinish` và log của
    `onExportStart` đều xuất hiện trên stderr của render (kênh bridge gom
    vào job log); 4 dạng spec plugins sai đều fail fast exit 1.

## Giới hạn còn lại (chưa làm / không làm được)

1. **vm không phải security boundary tuyệt đối.** Node.js docs nói rõ điều này.
   Sandbox ở đây chặn API host và escape thường gặp (require/process/eval/
   Function), nhưng attacker quyết tâm vẫn có lý thuyết thoát được qua
   prototype chain. → **Chỉ load plugin từ nguồn tin cậy.**
2. Plugin là file JS đơn, không có hệ thống dependency — plugin không `require`
   được thư viện ngoài (kể cả của VCut). Muốn dùng thư viện thì bundle tay vào
   file plugin.
3. `onClipRender` chỉ chèn filter xử lý pixel vào chain của clip. Không hỗ trợ:
   transition mới (xfade là của render worker), export format mới, track mới.
   "Transition mới" muốn render thật phải sửa `server/render` — plugin API hiện
   tại chưa mở extension point này.
4. Filter bị giới hạn 4096 ký tự; cấm mọi tham số đọc file (`subtitles=`,
   `fontfile=`...) nên plugin không tự chọn font drawtext — host resolve font.
5. Hooks đồng bộ, timeout ~1s/lần gọi — không làm được tác vụ nặng trong hook.
6. Config override chỉ nhận lúc `registry.load()` — chưa có UI chỉnh config
   plugin trong editor.
7. Registry chưa persist: plugin nạp lại mỗi lần khởi động host; chưa có
   enable/disable trong UI (API có `unload()` nhưng chưa nối UI).
8. Wiring vào render worker **đã xong** (cập nhật): spec khai `plugins:
   [{ id | path, config? }]` (type `PluginRef` trong video-spec, validate
   cấu trúc ở `server/render/src/validate.js`), host ở
   `server/render/src/plugins.js`:
   - `onClipRender` nối vào `buildFilterGraph`: filter plugin chèn **sau
     effects, trước xfade/opacity** (sau toàn bộ pipeline pixel của clip,
     trước tầng timeline). Frame tại điểm chèn đã đúng W×H nên biểu thức
     theo w/h của plugin khớp khung output.
   - `onProjectValidate` chạy ngay sau validateSpec (errors chặn render);
     `onExportStart`/`onExportFinish` chạy quanh lần chạy ffmpeg thật
     (không cháy ở `--dry-run`), warnings in ra stderr → bridge gom vào
     kết quả job (`_stderrTail`).
   - Nạp plugin thất bại (thiếu file/manifest sai) → render **fail**,
     không lặng lẽ bỏ qua; lỗi trong hook thì chỉ log, không sập render.
   Giới hạn còn lại của wiring: chỉ **video clip** được gọi onClipRender
   (image/sticker/text clip chưa nối); `onTimelineAction` chưa có nguồn
   phát (thuộc editor, render worker không có timeline action); plugin
   được nạp lại mỗi job render (mỗi job là 1 process riêng — đúng vòng
   đời hiện tại của worker, chưa có cache xuyên job); `path` tương đối
   resolve theo thư mục chứa spec, path tuyệt đối được chấp nhận (spec do
   chính user chạy render viết — mức tin cậy tương đương file plugin).
9. Không có chữ ký/xác thực plugin — không chống được plugin giả mạo tên.
10. Log của plugin ra stderr của host — chưa có log viewer trong UI.

## Quyết định thiết kế đáng chú ý

- Mọi dữ liệu qua biên sandbox là JSON (deep clone) — plugin không bao giờ
  cầm tham chiếu object của host.
- Gọi hook qua `vm.runInContext` với script cố định (không nối chuỗi tham số
  vào code) — tránh injection từ dữ liệu clip.
- Lỗi 1 plugin không sập host: mọi hook đều try/catch ở registry, lỗi gom
  vào `hookErrors` để UI/log hiển thị.
