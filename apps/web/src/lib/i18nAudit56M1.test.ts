// i18nAudit56M1.test.ts — Phase 9 đợt 56, luồng M1: nối key i18n cho
// App.tsx, MediaBin.tsx, preview.tsx, Inspector.tsx, components/Toasts.tsx,
// desktop.ts, media.ts, components/sticker/TrackPanel.tsx,
// components/TtsButton.tsx (77 key đề xuất đợt 55 L2 + 1 key phụ
// mediabin.unknownError cho fallback "lỗi không rõ" trong mediabin.proxyFailed).
//
// Khác đợt 55 L2: key MỚI nằm trong fragment riêng
// apps/web/src/i18n/fragments/round56-m1.json — parent gộp vào vi.json/en.json
// ở cuối đợt, KHÔNG sửa vi.json/en.json trực tiếp. Vì vậy test này:
//  - khóa nội dung fragment (78 key, vi/en parity, placeholder khớp),
//  - mô phỏng dict ĐÃ GỘP (main + fragment) rồi assert lookup y hệt
//    i18n/index.ts, thay vì assert trực tiếp trên dict chính,
//  - assert source 9 file dùng t()/i18nT() + hết literal VI cũ,
//  - render thật EN MediaBin + TtsButton: không còn literal VI đã nối
//    (pre-merge render ra chính key, post-merge render ra chuỗi EN —
//    test chấp nhận cả 2, và assert VI render đầy đủ chỉ sau khi merge,
//    xem LIMITS M1 §3).
//
// Chạy bằng esbuild bundle (mẫu L2, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M1.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m1/m1.test.cjs \
//     && node /tmp/round56-m1/m1.test.cjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { setLang } from "../i18n";
import { MediaBin } from "../MediaBin";
import { TtsButton } from "../components/TtsButton";

let pass = 0;
const queue: Array<{ name: string; fn: () => void }> = [];
function ok(name: string, fn: () => void): void {
  queue.push({ name, fn });
}
function runAll(): void {
  for (const t of queue) {
    try {
      t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`M1 i18n audit round 56: ${pass}/${queue.length} pass`);
}

// --- Dict: fragment + main, lookup y hệt i18n/index.ts ---------------
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookup(raw: Record<string, unknown>, key: string): string | undefined {
  let cur: unknown = raw;
  for (const part of key.split(".")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}
function deepMerge(base: Record<string, unknown>, over: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (typeof v === "object" && v !== null && typeof out[k] === "object" && out[k] !== null) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
function readJSON(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(rel, "utf8")) as Record<string, unknown>;
}
function readSrc(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}
function placeholders(s: string): string[] {
  return [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
}

// 78 key của M1: 77 đề xuất đợt 55 L2 + mediabin.unknownError (key phụ).
const EXPECTED: Record<string, [string, string]> = {
  "app.proxyStaleToast": ["Proxy của {names} đã mất trên bridge — bấm nút Proxy trên thẻ media để tạo lại.", "Proxies for {names} are missing on the bridge — tap the Proxy button on the media card to recreate them."],
  "app.mediaLibrary": ["Thư viện media", "Media library"],
  "app.openMediaLibrary": ["Mở thư viện media", "Open the media library"],
  "app.clipProps": ["Thuộc tính clip", "Clip properties"],
  "app.openInspector": ["Mở panel thuộc tính", "Open the properties panel"],
  "app.mediaLibraryShort": ["📁 Thư viện", "📁 Library"],
  "app.closeMediaLibrary": ["Đóng thư viện", "Close the library"],
  "app.propsShort": ["⚙️ Thuộc tính", "⚙️ Properties"],
  "app.closeInspector": ["Đóng panel thuộc tính", "Close the properties panel"],
  "mediabin.bridgeStatus": ["Bridge trả {status}", "Bridge returned {status}"],
  "mediabin.noProxyUrl": ["Bridge không trả proxyUrl.", "The bridge did not return a proxyUrl."],
  "mediabin.smallEnough": ["“{name}” đã đủ nhỏ, không cần proxy.", "“{name}” is already small enough — no proxy needed."],
  "mediabin.proxyAttached": ["Đã gắn proxy {height}p cho “{name}” — preview sẽ mượt hơn.", "Attached a {height}p proxy for “{name}” — preview will be smoother."],
  "mediabin.proxyFailed": ["Không tạo được proxy: {error} (bridge: {url})", "Could not create a proxy: {error} (bridge: {url})"],
  "mediabin.proxyStaleTitle": ["File proxy đã mất trên bridge — bấm để tạo lại bản proxy 720p (export vẫn dùng file gốc)", "The proxy file is missing on the bridge — tap to recreate the 720p proxy (export still uses the original file)."],
  "mediabin.proxyOnTitle": ["Đang dùng proxy {height}p cho preview", "Using a {height}p proxy for preview"],
  "mediabin.proxyCreateTitle": ["Tạo bản proxy 720p qua bridge để preview mượt hơn (export vẫn dùng file gốc)", "Create a 720p proxy via the bridge for smoother preview (export still uses the original file)."],
  "mediabin.recreateProxyFor": ["Tạo lại proxy cho {name}", "Recreate the proxy for {name}"],
  "mediabin.createProxyFor": ["Tạo proxy cho {name}", "Create a proxy for {name}"],
  "mediabin.proxyStaleBtn": ["Proxy mất, tạo lại", "Proxy missing, recreate"],
  "mediabin.proxyCreating": ["Đang tạo…", "Creating…"],
  "mediabin.proxyFailedBtn": ["Proxy lỗi, thử lại", "Proxy failed, retry"],
  "mediabin.proxyNotNeeded": ["Không cần proxy", "No proxy needed"],
  "mediabin.bridgeDown": ["Bridge không chạy ({url}) — proxy tự động thất bại, bấm nút Proxy để thử lại khi bridge đã chạy.", "The bridge is not running ({url}) — automatic proxy creation failed; tap the Proxy button to retry once the bridge is running."],
  "mediabin.autoProxyHint": ["Tự tạo proxy 720p khi import video (preview mượt hơn, export vẫn dùng gốc)", "Auto-create a 720p proxy when importing video (smoother preview; export still uses the original)."],
  "mediabin.emptyStep1": ["Nhấn “＋ Nhập file” để thêm video, audio hoặc ảnh.", "Tap “＋ Import files” to add video, audio, or images."],
  "mediabin.emptyStep2": ["Kéo thả file vào track timeline (hoặc bấm “＋ Thêm”).", "Drag files onto a timeline track (or tap “＋ Add”)."],
  "mediabin.emptyStep3": ["Bấm “⬇ Xuất bản” để xuất video.", "Tap “⬇ Publish” to export the video."],
  "mediabin.reloadSample": ["Tải lại dự án mẫu", "Reload the sample project"],
  "mediabin.sampleProject": ["↺ Dự án mẫu", "↺ Sample project"],
  "motionTrack.invalid": ["Quỹ đạo không hợp lệ: {error}", "Invalid trajectory: {error}"],
  "motionTrack.readFailed": ["Không đọc được file quỹ đạo: {error}", "Could not read the trajectory file: {error}"],
  "motionTrack.attached": ["Đã gắn quỹ đạo: {n} điểm", "Trajectory attached: {n} points"],
  "motionTrack.lost": [" — ⚠️ track bị mất giữa chừng, clip đứng yên từ điểm cuối.", " — ⚠️ tracking was lost mid-way; the clip stays still from the last point."],
  "motionTrack.followNote": ["Clip sẽ bám theo vật thể trong preview và render thật.", "The clip will follow the object in preview and in the real render."],
  "motionTrack.loadOther": ["Nạp quỹ đạo khác", "Load another trajectory"],
  "motionTrack.detach": ["Gỡ quỹ đạo", "Detach trajectory"],
  "motionTrack.intro": ["Chạy {script} trên video gốc để tạo trajectory JSON, rồi nạp file đó vào đây để clip bám theo vật thể.", "Run {script} on the original video to create a trajectory JSON, then load that file here so the clip follows the object."],
  "motionTrack.loadJson": ["Nạp trajectory JSON…", "Load trajectory JSON…"],
  "tts.noRefFile": ["Chưa chọn file giọng mẫu để clone.", "No sample voice file selected for cloning."],
  "tts.bridgeErrorHttp": ["Bridge trả lỗi HTTP {status}", "Bridge returned HTTP error {status}"],
  "tts.cloneFromSample": ["🎭 Clone giọng từ file mẫu (local)", "🎭 Clone voice from a sample file (local)"],
  "tts.refFileLabel": ["File giọng mẫu để clone", "Sample voice file for cloning"],
  "tts.cloneHint": ["Mẫu tốt nhất: 3–30s, một giọng nói rõ, ít nhiễu. Giọng clone chỉ dùng trên máy của bạn, không gửi đi đâu.", "Best sample: 3–30s, one clear voice, little noise. The cloned voice is only used on your machine and is never sent anywhere."],
  "preview.missingMedia": ["Thiếu media: {names}", "Missing media: {names}"],
  "preview.curveWarnHidden": ["⚠ Curve: {n} nested lỗi ({dropped} bị ẩn)", "⚠ Curve: {n} nested clips have errors ({dropped} hidden)"],
  "preview.curveWarnFallback": ["⚠ Curve: {n} nested về 1×", "⚠ Curve: {n} nested clips fell back to 1×"],
  "preview.curveFallbackLinear": ["preview tạm về 1× (export vẫn fail-fast, cần sửa curve thật)", "preview temporarily at 1× (export still fails fast — please fix the real curve)"],
  "preview.curveFallbackHidden": ["tạm ẩn khỏi preview", "temporarily hidden from preview"],
  "preview.curveFallbackLinearShort": ["tạm về 1×", "temporarily at 1×"],
  "preview.curveToast": ["Preview: nested “{id}” có speed curve không hợp lệ ({reason}) — đã {fallback} để preview không dừng. Export vẫn fail-fast theo luật render, cần sửa curve thật.", "Preview: nested “{id}” has an invalid speed curve ({reason}) — {fallback} so preview keeps going. Export still fails fast per render rules; please fix the real curve."],
  "preview.flattenWarn": ["⚠ Preview lỗi làm phẳng", "⚠ Preview failed to flatten"],
  "preview.flattenWarnDetail": ["{msg} — đang hiện spec gốc, nested có thể không hiển thị.", "{msg} — showing the original spec; nested clips may not display."],
  "preview.flattenToast": ["Preview không làm phẳng được project ({msg}) — đang hiện spec gốc, nested có thể không hiển thị.", "Preview could not flatten the project ({msg}) — showing the original spec; nested clips may not display."],
  "preview.holdStale": ["⏸ FRAME GIỮ (cũ)", "⏸ HELD FRAME (stale)"],
  "preview.hold": ["⏸ FRAME GIỮ", "⏸ HELD FRAME"],
  "preview.volumeTitle": ["Mức âm thanh preview", "Preview audio level"],
  "preview.proxyBadge": ["Đang preview bằng bản proxy nhẹ — export cuối vẫn dùng file gốc đủ phân giải", "Previewing with a lightweight proxy — the final export still uses the full-resolution original."],
  "preview.lutBadge": ["Chế độ LUT của preview: WebGL = LUT 3D thật (khớp render); CSS ≈ = xấp xỉ bằng CSS filter", "Preview LUT mode: WebGL = real 3D LUT (matches render); CSS ≈ = approximated with a CSS filter"],
  "preview.motionBadge": ["Motion của clip đang xem: NỘI SUY = bản render sẽ nội suy frame mới (preview giữ fps project, không nội suy); BLUR≈ = preview chỉ vẽ vệt mờ xấp xỉ, render dùng motion blur thật", "Motion of the clip being previewed: INTERPOLATE = the render will interpolate new frames (preview keeps the project fps and does not interpolate); BLUR≈ = preview only draws an approximate blur trail, the render uses real motion blur"],
  "preview.reverseBadge": ["Đang ở chế độ phát ngược: playhead chạy lùi theo từng frame, mọi video seek từng frame, audio bị tắt vì không phát ngược đồng bộ được. Bấm nút ◀ hoặc phím J để dừng, nút ▶ để về phát xuôi.", "Reverse playback mode: the playhead moves backwards frame by frame, every video seeks per frame, and audio is off because it cannot play in sync backwards. Tap the ◀ button or press J to stop, or ▶ to play forwards again."],
  "preview.reverseLabel": ["◀ PHÁT NGƯỢC — không audio", "◀ REVERSE — no audio"],
  "preview.holdBadge": ["Decoder chưa kịp giao frame mới nên preview đang vẽ lại frame tốt cuối cùng thay vì để đen. Nếu hiện (cũ) nghĩa là frame đã giữ quá 3 giây timeline — hình đứng yên trong khi playhead vẫn chạy.", "The decoder hasn't delivered a new frame yet, so preview is redrawing the last good frame instead of showing black. If it says (stale), the frame has been held for over 3 timeline seconds — the picture is frozen while the playhead keeps moving."],
  "preview.fsExitTitle": ["Thoát toàn màn hình (F)", "Exit fullscreen (F)"],
  "preview.fsEnterTitle": ["Xem toàn màn hình (F)", "View fullscreen (F)"],
  "preview.fsExit": ["Thoát toàn màn hình", "Exit fullscreen"],
  "preview.fsEnter": ["Xem toàn màn hình", "View fullscreen"],
  "preview.emptyTitle": ["Chưa có clip nào", "No clips yet"],
  "preview.emptyHint": ["Nhập file vào thư viện, rồi kéo thả vào timeline để bắt đầu.", "Import files into the library, then drag them onto the timeline to start."],
  "toasts.closeAria": ["Đóng thông báo", "Dismiss notification"],
  "inspector.beatAnalyzeHint": ["Phân tích beat & cắt clip", "Analyze beats & cut clips"],
  "inspector.beatSectionTitle": ["🎵 Cắt theo beat", "🎵 Cut to the beat"],
  "desktop.saveError": ["Không ghi được file", "Could not write the file"],
  "media.videoMetaFailed": ["Không đọc được metadata video", "Could not read the video metadata"],
  "media.audioMetaFailed": ["Không đọc được metadata audio", "Could not read the audio metadata"],
  "media.imageReadFailed": ["Không đọc được ảnh", "Could not read the image"],
  "media.unsupported": ["Định dạng không hỗ trợ: {detail}", "Unsupported format: {detail}"],
  "mediabin.unknownError": ["lỗi không rõ", "unknown error"],};

// --- 1. Fragment: đủ 78 key, parity vi/en, nội dung đúng từng chữ ----
ok("fragment: đủ 78 key, vi/en parity, nội dung đúng đề xuất đợt 55", () => {
  const frag = readJSON("apps/web/src/i18n/fragments/round56-m1.json") as {
    vi: Record<string, unknown>;
    en: Record<string, unknown>;
  };
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(frag.vi, "", viKeys);
  flatten(frag.en, "", enKeys);
  assert.equal(viKeys.size, 78, `fragment vi phải có 78 key, có ${viKeys.size}`);
  assert.equal(enKeys.size, 78, `fragment en phải có 78 key, có ${enKeys.size}`);
  for (const k of Object.keys(EXPECTED)) {
    assert.ok(viKeys.has(k), `fragment vi thiếu ${k}`);
    assert.ok(enKeys.has(k), `fragment en thiếu ${k}`);
    const [v, e] = EXPECTED[k];
    assert.equal(lookup(frag.vi, k), v, `${k} vi`);
    assert.equal(lookup(frag.en, k), e, `${k} en`);
    assert.notEqual(v, e, `${k}: vi phải khác en`);
    assert.deepEqual(placeholders(v), placeholders(e), `${k}: placeholder vi/en lệch`);
  }
});

ok("fragment: không đè key dict chính (pre-merge vắng, post-merge trùng giá trị)", () => {
  const vi = readJSON("apps/web/src/i18n/vi.json");
  const en = readJSON("apps/web/src/i18n/en.json");
  for (const k of Object.keys(EXPECTED)) {
    const [v, e] = EXPECTED[k];
    const mv = lookup(vi, k);
    const me = lookup(en, k);
    // Pre-merge: key chưa có trong dict chính. Post-merge (parent đã gộp):
    // key có mặt với đúng giá trị fragment — cả 2 trạng thái đều pass.
    assert.ok(mv === undefined || mv === v, `${k}: vi chính lệch fragment (có ${JSON.stringify(mv)})`);
    assert.ok(me === undefined || me === e, `${k}: en chính lệch fragment (có ${JSON.stringify(me)})`);
  }
});

// --- 2. Dict đã gộp (mô phỏng parent merge): lookup đúng như t() -----
ok("merged dict: 78 key lookup đúng cả vi lẫn en (mô phỏng parent merge)", () => {
  const frag = readJSON("apps/web/src/i18n/fragments/round56-m1.json") as {
    vi: Record<string, unknown>;
    en: Record<string, unknown>;
  };
  const mergedVi = deepMerge(readJSON("apps/web/src/i18n/vi.json"), frag.vi);
  const mergedEn = deepMerge(readJSON("apps/web/src/i18n/en.json"), frag.en);
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(mergedVi, "", viKeys);
  flatten(mergedEn, "", enKeys);
  assert.equal(viKeys.size, enKeys.size, "merged vi/en lệch số key");
  for (const k of Object.keys(EXPECTED)) {
    const [v, e] = EXPECTED[k];
    assert.equal(lookup(mergedVi, k), v, `merged vi ${k}`);
    assert.equal(lookup(mergedEn, k), e, `merged en ${k}`);
  }
});

// --- 3. Render thật EN: MediaBin + TtsButton, không còn literal VI ----

ok("render EN: MediaBin hiện empty steps + sample (key hoặc EN), không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(MediaBin));
  // Pre-merge t() trả về key; post-merge trả về chuỗi EN — chấp nhận cả 2.
  for (const [key, enText] of [
    ["mediabin.emptyStep1", "Tap “＋ Import files”"],
    ["mediabin.emptyStep2", "Drag files onto a timeline track"],
    ["mediabin.emptyStep3", "Tap “⬇ Publish”"],
    ["mediabin.sampleProject", "↺ Sample project"],
    ["mediabin.autoProxyHint", "Auto-create a 720p proxy"],
  ] as const) {
    assert.ok(html.includes(key) || html.includes(enText), `MediaBin EN thiếu ${key} / ${enText}`);
  }
  for (const frag of ["Nhấn “＋ Nhập file”", "Kéo thả file vào track timeline", "Bấm “⬇ Xuất bản”", "↺ Dự án mẫu", "Tự tạo proxy 720p"]) {
    assert.ok(!html.includes(frag), `MediaBin EN vẫn còn literal VI: ${frag}`);
  }
});

ok("render EN: TtsButton hiện label clone (key hoặc EN), không còn literal VI", () => {
  setLang("en");
  const html = renderToStaticMarkup(React.createElement(TtsButton, { text: "xin chào" }));
  assert.ok(
    html.includes("tts.cloneFromSample") || html.includes("🎭 Clone voice from a sample file (local)"),
    "TtsButton EN thiếu label clone",
  );
  assert.ok(!html.includes("🎭 Clone giọng từ file mẫu (local)"), "TtsButton EN vẫn còn label VI");
});

// --- 4. Source: 9 file dùng t()/i18nT() + hết literal VI cũ ----------
ok("source: App.tsx dùng t() cho 9 key, hết literal cũ", () => {
  const src = readSrc("App.tsx");
  assert.ok(src.includes("useLang"), "App.tsx phải gọi useLang()");
  for (const k of ["app.proxyStaleToast", "app.mediaLibrary", "app.openMediaLibrary", "app.clipProps", "app.openInspector", "app.mediaLibraryShort", "app.closeMediaLibrary", "app.propsShort", "app.closeInspector"]) {
    assert.ok(src.includes(`t("${k}"`), `App.tsx phải gọi t("${k}")`);
  }
  for (const frag of ["Proxy của ", '"Thư viện media"', '"Mở thư viện media"', '"Thuộc tính clip"', '"Mở panel thuộc tính"', '"📁 Thư viện"', '"Đóng thư viện"', '"⚙️ Thuộc tính"', '"Đóng panel thuộc tính"']) {
    assert.ok(!src.includes(frag), `App.tsx còn literal cứng: ${frag}`);
  }
});

ok("source: MediaBin.tsx dùng t() cho 21 key + unknownError, hết literal cũ", () => {
  const src = readSrc("MediaBin.tsx");
  assert.ok(src.includes("useLang"), "MediaBin.tsx phải gọi useLang()");
  for (const k of ["mediabin.bridgeStatus", "mediabin.noProxyUrl", "mediabin.smallEnough", "mediabin.proxyAttached", "mediabin.proxyFailed", "mediabin.proxyStaleTitle", "mediabin.proxyOnTitle", "mediabin.proxyCreateTitle", "mediabin.recreateProxyFor", "mediabin.createProxyFor", "mediabin.proxyStaleBtn", "mediabin.proxyCreating", "mediabin.proxyFailedBtn", "mediabin.proxyNotNeeded", "mediabin.bridgeDown", "mediabin.autoProxyHint", "mediabin.emptyStep1", "mediabin.emptyStep2", "mediabin.emptyStep3", "mediabin.reloadSample", "mediabin.sampleProject", "mediabin.unknownError"]) {
    assert.ok(src.includes(`t("${k}"`), `MediaBin.tsx phải gọi t("${k}")`);
  }
  for (const frag of ["Bridge trả ", " đã đủ nhỏ, không cần proxy.", '"Bridge không trả proxyUrl."', "Đã gắn proxy ", "Không tạo được proxy: ", "File proxy đã mất trên bridge", "Đang dùng proxy ", "Tạo bản proxy 720p", "Tạo lại proxy cho ", "Tạo proxy cho ", '"Proxy mất, tạo lại"', '"Đang tạo…"', '"Proxy lỗi, thử lại"', '"Không cần proxy"', "Bridge không chạy (", "Tự tạo proxy 720p khi import video", "Nhấn “＋ Nhập file”", "Kéo thả file vào track timeline", "Bấm “⬇ Xuất bản”", '"Tải lại dự án mẫu"', '"↺ Dự án mẫu"', '"lỗi không rõ"']) {
    assert.ok(!src.includes(frag), `MediaBin.tsx còn literal cứng: ${frag}`);
  }
});

ok("source: preview.tsx dùng i18nT() cho 25 key, hết literal cũ", () => {
  const src = readSrc("preview.tsx");
  assert.ok(src.includes("useLang"), "preview.tsx phải gọi useLang()");
  for (const k of ["preview.missingMedia", "preview.curveWarnHidden", "preview.curveWarnFallback", "preview.curveFallbackLinear", "preview.curveFallbackHidden", "preview.curveFallbackLinearShort", "preview.curveToast", "preview.flattenWarn", "preview.flattenWarnDetail", "preview.flattenToast", "preview.holdStale", "preview.hold", "preview.volumeTitle", "preview.proxyBadge", "preview.lutBadge", "preview.motionBadge", "preview.reverseBadge", "preview.reverseLabel", "preview.holdBadge", "preview.fsExitTitle", "preview.fsEnterTitle", "preview.fsExit", "preview.fsEnter", "preview.emptyTitle", "preview.emptyHint"]) {
    assert.ok(src.includes(`i18nT("${k}"`), `preview.tsx phải gọi i18nT("${k}")`);
  }
  for (const frag of ["Thiếu media: ", "⚠ Curve: ", "nested về 1×", "preview tạm về 1×", "tạm ẩn khỏi preview", "tạm về 1×", "có speed curve không hợp lệ", "⚠ Preview lỗi làm phẳng", "đang hiện spec gốc, nested có thể không hiển thị.", "không làm phẳng được project (", '"⏸ FRAME GIỮ', '"Mức âm thanh preview"', "Đang preview bằng bản proxy nhẹ", "Chế độ LUT của preview", "Motion của clip đang xem", "Đang ở chế độ phát ngược", "◀ PHÁT NGƯỢC — không audio", "Decoder chưa kịp giao frame mới", '"Thoát toàn màn hình (F)"', '"Xem toàn màn hình (F)"', '"Thoát toàn màn hình"', '"Xem toàn màn hình"', '"Chưa có clip nào"', "Nhập file vào thư viện, rồi kéo thả vào timeline"]) {
    assert.ok(!src.includes(frag), `preview.tsx còn literal cứng: ${frag}`);
  }
});

ok("source: Inspector.tsx dùng t() cho 2 key beat, hết literal cũ", () => {
  const src = readSrc("Inspector.tsx");
  for (const k of ["inspector.beatSectionTitle", "inspector.beatAnalyzeHint"]) {
    assert.ok(src.includes(`t("${k}")`), `Inspector.tsx phải gọi t("${k}")`);
  }
  for (const frag of ['"🎵 Cắt theo beat"', "Phân tích beat &amp; cắt clip"]) {
    assert.ok(!src.includes(frag), `Inspector.tsx còn literal cứng: ${frag}`);
  }
});

ok("source: Toasts.tsx dùng t() cho aria đóng, hết literal cũ", () => {
  const src = readSrc("components/Toasts.tsx");
  assert.ok(src.includes("useLang"), "Toasts.tsx phải gọi useLang()");
  assert.ok(src.includes('i18nT("toasts.closeAria")'), "Toasts.tsx phải gọi i18nT(toasts.closeAria)");
  assert.ok(!src.includes('"Đóng thông báo"'), "Toasts.tsx còn literal cứng");
});

ok("source: desktop.ts dùng t() cho lỗi ghi file, hết literal cũ", () => {
  const src = readSrc("desktop.ts");
  assert.ok(src.includes('t("desktop.saveError")'), "desktop.ts phải gọi t(desktop.saveError)");
  assert.ok(!src.includes('"Không ghi được file"'), "desktop.ts còn literal cứng");
});

ok("source: media.ts dùng i18nT() cho 4 lỗi probe/định dạng, hết literal cũ", () => {
  const src = readSrc("media.ts");
  for (const k of ["media.videoMetaFailed", "media.audioMetaFailed", "media.imageReadFailed", "media.unsupported"]) {
    assert.ok(src.includes(`i18nT("${k}"`), `media.ts phải gọi i18nT("${k}")`);
  }
  for (const frag of ['"Không đọc được metadata video"', '"Không đọc được metadata audio"', '"Không đọc được ảnh"', "Định dạng không hỗ trợ: "]) {
    assert.ok(!src.includes(frag), `media.ts còn literal cứng: ${frag}`);
  }
});

ok("source: TrackPanel.tsx dùng t() cho 9 key, hết literal cũ", () => {
  const src = readSrc("components/sticker/TrackPanel.tsx");
  assert.ok(src.includes("useLang"), "TrackPanel.tsx phải gọi useLang()");
  for (const k of ["motionTrack.invalid", "motionTrack.readFailed", "motionTrack.attached", "motionTrack.lost", "motionTrack.followNote", "motionTrack.loadOther", "motionTrack.detach", "motionTrack.intro", "motionTrack.loadJson"]) {
    assert.ok(src.includes(`t("${k}"`), `TrackPanel.tsx phải gọi t("${k}")`);
  }
  for (const frag of ["Quỹ đạo không hợp lệ: ", "Không đọc được file quỹ đạo: ", "Đã gắn quỹ đạo: ", "track bị mất giữa chừng", "Clip sẽ bám theo vật thể trong preview và render thật.", '"Nạp quỹ đạo khác"', '"Gỡ quỹ đạo"', "trên video gốc để tạo", "trajectory JSON, rồi nạp file đó vào đây", '"Nạp trajectory JSON…"']) {
    assert.ok(!src.includes(frag), `TrackPanel.tsx còn literal cứng: ${frag}`);
  }
});

ok("source: TtsButton.tsx dùng i18nT() cho 5 key, hết literal cũ", () => {
  const src = readSrc("components/TtsButton.tsx");
  for (const k of ["tts.noRefFile", "tts.bridgeErrorHttp", "tts.cloneFromSample", "tts.refFileLabel", "tts.cloneHint"]) {
    assert.ok(src.includes(`i18nT("${k}"`), `TtsButton.tsx phải gọi i18nT("${k}")`);
  }
  for (const frag of ['"Chưa chọn file giọng mẫu để clone."', "Bridge trả lỗi HTTP ", '"🎭 Clone giọng từ file mẫu (local)"', '"File giọng mẫu để clone"', "dùng trên máy của bạn, không gửi đi đâu."]) {
    assert.ok(!src.includes(frag), `TtsButton.tsx còn literal cứng: ${frag}`);
  }
});

runAll();
