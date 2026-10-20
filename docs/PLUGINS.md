# Viết plugin cho VCut Studio

Plugin là **1 file JavaScript duy nhất** (`plugin.js`) export `{ manifest, hooks }`.
File chạy trong sandbox `vm` với API giới hạn — không có `require`, `process`,
`fs`, `fetch`, `eval`.

## Plugin tối thiểu

```js
// plugins/my-effect/plugin.js
module.exports = {
  manifest: {
    name: "my-effect",          // kebab-case, duy nhất
    version: "1.0.0",           // semver
    author: "Tên bạn",
    description: "Mô tả ngắn.",
    apiVersion: 1,              // hiện tại chỉ có 1
    hooks: ["onClipRender"],    // hooks implement
    permissions: ["filter:inject"],
    capabilities: [
      { kind: "effect", id: "my-effect", label: "Hiệu ứng của tôi" },
    ],
    defaultConfig: { intensity: 0.5 },  // config mặc định (JSON)
  },
  hooks: {
    // Chèn thêm FFmpeg filter vào clip video.
    onClipRender: function (ctx) {
      if (ctx.clipKind !== "video") return;
      return { filters: ["eq=brightness=0.1"] };
    },
  },
};
```

Trong plugin bạn có: `console.log/info/warn/error` (log ra host có prefix tên
plugin) và `vc.log(message)`, `vc.apiVersion`.

**Hooks phải đồng bộ** — trả Promise sẽ bị báo lỗi.

## Các hook

| Hook | Khi chạy | Trả về |
|------|----------|--------|
| `onClipRender(ctx)` | Mỗi clip video/image khi render | `{ filters: string[] }` — FFmpeg filter nối vào chain của clip |
| `onExportStart(ctx)` | Trước khi export | (quan sát) |
| `onExportFinish(ctx)` | Sau khi export | `{ warnings: string[] }` |
| `onTimelineAction(ctx)` | Action trên timeline (`split`, `undo`, `trim`, `addClip`...) | (quan sát) |
| `onProjectValidate(ctx)` | Khi validate project | `{ errors: string[], warnings: string[] }` |

`ctx` luôn là JSON thuần; `ctx.config` là config đã gộp default + override.

## Filter an toàn (onClipRender)

Filter plugin chèn phải qua kiểm tra an toàn, nếu không bị từ chối:

- ✅ Cho phép: `drawtext=text='...'`, `eq`, `colorbalance`, `vignette`,
  `gblur`, `unsharp`... (filter xử lý pixel, không đọc file)
- ❌ Cấm: dấu `;`, xuống dòng, stream label `[a]`, và mọi filter/tham số
  đọc file tạo nguồn: `movie=`, `amovie=`, `subtitles=`, `ass=`,
  `textfile=`, `fontfile=`.

Escape text cho drawtext: `\` → `\\`, `'` → `\'`, `:` → `\:`, `%` → `%%`
(xem `plugins/watermark/plugin.js`).

## Load plugin trong code host

```js
import { PluginRegistry } from "@repo-1/plugin-api";

const registry = new PluginRegistry();
registry.load(pluginSource, { config: { text: "My Brand" } }); // override config

// Khi render clip:
const { filters, hookErrors } = registry.runClipRender({
  clip, clipKind: "video", project: { width: 1920, height: 1080, fps: 30 },
});
// nối filters vào filter chain của clip

// Liệt kê năng lực cho UI:
registry.listCapabilities(); // [{ kind, id, label, plugin }]
```

Lỗi của 1 plugin **không làm sập host** — được bắt và trả trong `hookErrors`.

## Giới hạn (đọc kỹ)

- Sandbox `vm` ngăn truy cập API host và escape thường gặp, nhưng Node docs
  nói rõ `vm` **không phải** security boundary tuyệt đối. Chỉ load plugin từ
  nguồn bạn tin tưởng.
- Hook bị giới hạn thời gian (~1s mỗi lần gọi); vòng lặp vô hạn bị cắt.
- `onClipRender` chỉ chèn được filter xử lý pixel — không đọc file ngoài,
  không tạo nguồn mới, không nối stream.
- Xem đầy đủ trong `packages/plugin-api/PLUGIN_API_LIMITS.md`.

## Plugin mẫu

- `plugins/hello-world/` — log sự kiện timeline/export (chỉ quan sát).
- `plugins/watermark/` — đóng dấu chữ mờ góc dưới-phải clip video
  (demo `onClipRender` + config override).
