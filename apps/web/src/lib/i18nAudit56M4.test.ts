// i18nAudit56M4.test.ts — Phase 9 đợt 56, luồng M4: i18n wiring cho
// store.ts + lib/captions.ts, lib/exportPresets.ts, lib/sharePage.ts,
// lib/archive.ts, lib/openProjectFlow.ts, lib/relink.ts (126 key mới trong
// i18n/fragments/round56-m4.json — parent merge vào vi.json/en.json).
//
// Chạy bằng esbuild bundle (mẫu L1/L2, chạy từ gốc repo; bundle ra scratch
// ngoài repo, KHÔNG ra dist). BẮT BUỘC --format=cjs vì react-dom/server
// dùng require động:
//   ./node_modules/.bin/esbuild apps/web/src/lib/i18nAudit56M4.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round56-m4/m4.test.cjs \
//     && node /tmp/round56-m4/m4.test.cjs
//   VCUT_TEST_LANG=en node /tmp/round56-m4/m4.test.cjs
//
// Hai lần chạy (vi mặc định + en): các const module-load (CAPTION_LANGS,
// EXPORT_PRESETS, RELINK_KIND_META) chỉ nhận đúng ngôn ngữ khi setLang
// chạy TRƯỚC khi module của chúng được nạp, nên test dùng dynamic import
// sau setLang (xem main). Các hàm gọi t() tại thời điểm gọi (validate,
// presetSummary, buildSharePage, importArchive, store actions) thì đổi
// lang lúc nào cũng được.
//
// KHÔNG assert tổng số key vi.json/en.json (parent merge sau); chỉ khóa
// fragment của luồng này (126 key, parity vi/en) + nội dung các key đã
// hiệu chỉnh theo source + source 7 file không còn literal cũ + hành vi
// thật qua store/lib ở cả 2 ngôn ngữ.
//
// LƯU Ý: các test hành vi gọi t() với key MỚI — key này chỉ có trong
// fragment round56-m4.json, chưa merge vào vi.json/en.json (parent merge
// ở cuối đợt). Để test hành vi thật ngay bây giờ, main() deep-merge
// fragment vào đúng object dict mà i18n/index.ts đang dùng (cùng module
// instance trong bundle) — mô phỏng chính xác bước merge của parent,
// không sửa vi.json/en.json trên đĩa.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setLang } from "../i18n";
import viDict from "../i18n/vi.json";
import enDict from "../i18n/en.json";

/** Khai báo tối thiểu để không cần @types/node. */
declare const process: {
  exitCode: number | undefined;
  env: Record<string, string | undefined>;
};

const LANG = (process.env.VCUT_TEST_LANG === "en" ? "en" : "vi") as "vi" | "en";
const VI = LANG === "vi";

let pass = 0;
const queue: Array<{ name: string; fn: () => void | Promise<void> }> = [];
function ok(name: string, fn: () => void | Promise<void>): void {
  queue.push({ name, fn });
}
async function runAll(): Promise<void> {
  for (const t of queue) {
    try {
      await t.fn();
      pass++;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      console.error(`  ✗ ${t.name}: ${(e as Error).message}`);
      process.exitCode = 1;
    }
  }
  console.log(`M4 i18n audit round 56 [lang=${LANG}]: ${pass}/${queue.length} pass`);
}

function read(rel: string): string {
  return readFileSync(`apps/web/src/${rel}`, "utf8");
}

// --- Dict fragment của luồng này ---------------------------------------
function flatten(o: unknown, prefix: string, out: Set<string>): void {
  const rec = o as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const q = prefix ? `${prefix}.${k}` : k;
    if (typeof rec[k] === "object" && rec[k] !== null) flatten(rec[k], q, out);
    else out.add(q);
  }
}
function lookup(raw: Record<string, unknown>, key: string): string {
  let cur: unknown = raw;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown>)[part];
  return cur as string;
}
const FRAG = JSON.parse(
  readFileSync("apps/web/src/i18n/fragments/round56-m4.json", "utf8"),
) as { vi: Record<string, unknown>; en: Record<string, unknown> };

ok("fragment: 126 key, parity vi/en", () => {
  const viKeys = new Set<string>();
  const enKeys = new Set<string>();
  flatten(FRAG.vi, "", viKeys);
  flatten(FRAG.en, "", enKeys);
  assert.equal(viKeys.size, 126, `fragment vi phải có 126 key, thực tế ${viKeys.size}`);
  assert.deepEqual([...enKeys].sort(), [...viKeys].sort(), "vi/en trong fragment phải cùng tập key");
});

ok("fragment: các key hiệu chỉnh theo source có nội dung đúng", () => {
  // errWidth dùng {min}..{max} (source có range thật, proposal ghi "...").
  assert.equal(lookup(FRAG.vi, "exportPreset.errWidth"), "width phải là số nguyên {min}..{max}.");
  // sizeSummary: source chỉ có 1 var x264Preset, KHÔNG có {vbitrate}/{abitrate}.
  assert.equal(
    lookup(FRAG.vi, "exportPreset.sizeSummary"),
    "{w}×{h} @{fps}fps · CRF {crf} · {x264} · audio {akbps}k",
  );
  assert.ok(!lookup(FRAG.vi, "exportPreset.sizeSummary").includes("{vbitrate}"));
  // projectJsonInvalid: source là mảng ["project.json không hợp lệ:", ...errors] — không có {error}.
  assert.equal(lookup(FRAG.vi, "archive.projectJsonInvalid"), "project.json không hợp lệ:");
  assert.ok(!lookup(FRAG.vi, "archive.projectJsonInvalid").includes("{error}"));
  // unsafeName/unsafeEntry/unknownEntry: var đã là JSON.stringify(src) nên dict KHÔNG chứa ngoặc.
  assert.equal(lookup(FRAG.vi, "archive.unsafeName"), "Tên media không an toàn để đóng gói: {name}.");
  assert.ok(!lookup(FRAG.vi, "archive.unsafeName").includes("“"));
  // Key bị bỏ qua KHÔNG được có trong fragment.
  assert.ok(!("projectMenu" in FRAG.vi), "projectMenu.defaultName là key logic, không được nối");
  assert.ok(!("trackLabel" in (FRAG.vi.captions as Record<string, unknown>)));
  assert.ok(!("translatedTrack" in (FRAG.vi.captions as Record<string, unknown>)));
  // langAttr không phải chuỗi dịch (dùng getLang()), không có trong fragment.
  assert.ok(!("langAttr" in (FRAG.vi.sharePage as Record<string, unknown>)));
});

// --- Source: 7 file gọi t()/i18nT() cho key đã nối, hết literal cũ -----
const WIRED: Array<[string, string[]]> = [
  ["store.ts", [
    "timeline.field.opacity", "timeline.field.text", "timeline.field.volume",
    "timeline.field.speed", "timeline.field.start", "timeline.field.duration",
    "timeline.field.src", "timeline.field.fallback",
    "timeline.histPatch", "timeline.histPatchMulti",
    "timeline.kind.audio", "timeline.kind.text", "timeline.kind.image",
    "timeline.histAddTrack", "timeline.histDeleteTrack", "timeline.histToggleTrack",
    "timeline.histPatchTrackVolume", "timeline.histPatchTrack",
    "timeline.histAddAudio", "timeline.histAddClip",
    "timeline.histAddMediaToTimeline", "timeline.histAddText", "timeline.histTypeText",
    "caption.title", "silence.title",
    "timeline.histMoveMulti", "timeline.histTrimRipple",
    "timeline.histFixSpeedCurve", "timeline.histFixSpeedKeyframe", "timeline.histFixClipSpeedCurve",
    "timeline.histEditText", "timeline.histSplit",
    "timeline.histAddMarker", "timeline.histEditMarker", "timeline.histDeleteMarker",
    "timeline.histSplitScene",
    "timeline.histPasteMulti", "timeline.histPaste",
    "timeline.histDuplicateMulti", "timeline.histDuplicate",
    "timeline.histNest", "timeline.histUnnest",
    "timeline.histAddFx", "timeline.histDeleteFx", "timeline.histEditFx",
    "timeline.histAddStdFx", "timeline.histEditStdFx", "timeline.histDeleteStdFx",
    "timeline.histConvertFx", "timeline.histSetNestedFx",
    "timeline.histEditNestedChild", "timeline.histEditDeepChild", "timeline.histEditMidNested",
    "timeline.histSetNestedCurve", "timeline.histSplitDeepChild", "timeline.histSplitDeepOuter",
    "timeline.histDeleteRippleMulti", "timeline.histDeleteRipple",
    "timeline.histDeleteMulti", "timeline.histDelete",
    "store.toastUnsupported", "store.toastEmptyMeta", "store.toastUnusedMedia",
    "store.toastDedupNote", "store.toastRelinked", "store.toastRelinkedMulti",
    "store.toastAliasCleaned", "store.toastAliasClean",
  ]],
  ["lib/captions.ts", [
    "captions.langVi", "captions.langAuto", "captions.langEn",
    "captions.invalidData", "captions.noValidSentences", "captions.tooManySentences",
  ]],
  ["lib/exportPresets.ts", [
    "exportPreset.720pLabel", "exportPreset.720pDesc",
    "exportPreset.1080pLabel", "exportPreset.1080pDesc",
    "exportPreset.4kLabel", "exportPreset.4kDesc",
    "exportPreset.tiktokDesc", "exportPreset.youtubeDesc",
    "exportPreset.instaLabel", "exportPreset.instaDesc",
    "exportPreset.customLabel", "exportPreset.customDesc", "exportPreset.customLabelPlain",
    "exportPreset.errNotObject", "exportPreset.errWidth", "exportPreset.errHeight",
    "exportPreset.errFps", "exportPreset.errCrf", "exportPreset.errX264",
    "exportPreset.errAudioBitrate", "exportPreset.sizeSummary", "exportPreset.sizeEstimateNote",
  ]],
  ["lib/sharePage.ts", [
    "sharePage.emptyProject", "sharePage.linkedWarn", "sharePage.bigVideoWarn",
    "sharePage.linkedNote", "sharePage.noVideo", "sharePage.durationLine",
    "sharePage.openHint", "sharePage.timeHeader",
  ]],
  ["lib/archive.ts", [
    "archive.unsafeName", "archive.zipFailed", "archive.manifestNotJson",
    "archive.manifestBadFormat", "archive.manifestVersion", "archive.manifestNoFiles",
    "archive.zipUnreadable", "archive.tooManyFiles", "archive.unsafeEntry",
    "archive.unknownEntry", "archive.noManifest", "archive.manifestInvalid",
    "archive.missingEntry", "archive.projectJsonInvalid", "archive.missingMedia",
    "archive.mediaTooBig", "archive.sizeMismatch", "archive.shaMismatch",
  ]],
  ["lib/openProjectFlow.ts", ["openProject.unsavedConfirm", "openProject.proxyStaleToast"]],
  ["lib/relink.ts", ["relink.kindAudio", "relink.kindImage"]],
];
for (const [file, keys] of WIRED) {
  ok(`source: ${file} gọi t()/i18nT() cho ${keys.length} key`, () => {
    const src = read(file);
    for (const k of keys) {
      assert.ok(
        src.includes(`t("${k}"`) || src.includes(`i18nT("${k}"`),
        `${file} phải gọi t/i18nT("${k}")`,
      );
    }
  });
}

// Literal cũ đã nối phải hết (trừ 4 key logic cố tình giữ — xem LIMITS).
const GONE: Array<[string, string[]]> = [
  ["store.ts", [
    '"độ trong suốt"', '"nội dung chữ"', '"âm lượng"', '"tốc độ"', '"vị trí"', '"độ dài"',
    '"nguồn media"', '"thuộc tính"', '`Thêm track ${labels[kind]}`',
    '"Đổi trạng thái track"', '"Chỉnh âm lượng track"', '"Chỉnh thuộc tính track"',
    '"Thêm media vào timeline"', '"Nhập chữ…"', '"Tạo phụ đề tự động"',
    '"Cắt khoảng lặng"', '"Cắt clip (ripple)"',
    '"Sửa 1 keyframe tốc độ (báo cáo tải)"', '"Sửa curve tốc độ của 1 clip (báo cáo tải)"',
    '"Chỉnh chữ"', '"Tách clip"', '"Thêm marker"', '"Sửa marker"', '"Xoá marker"',
    '"Rã compound clip"', '"Xoá adjustment layer"', '"Sửa adjustment layer"',
    '"Sửa adjustment layer chuẩn"', '"Xoá adjustment layer chuẩn"',
    '"Chuyển adjustment layer sang chuẩn spec"', '"Đặt transition/opacity cho nested clip"',
    '"Sửa clip con trong compound clip"', '"Sửa clip con sâu trong compound clip"',
    '"Sửa nested trung gian sâu trong compound clip"',
    '"Đặt speed curve cho nested clip (giữ trim)"',
    '"Tách clip con sâu trong compound clip"', '"Tách clip con sâu theo mốc ngoài (đảo τ)"',
    '"Xoá clip (ripple)"', 'Không đọc được file "${file.name}"',
    'metadata rỗng (có thể file hỏng)', 'Không còn clip nào dùng "${oldSrc}"',
    'Nội dung trùng với file "${res.manifest.originalName}"',
    'Đã relink → "${n}"', 'Đã relink ${updatedCount} clip',
    'Đã dọn ${report.removed.length} alias thừa', 'Không có alias thừa (đã quét',
  ]],
  ["lib/captions.ts", [
    '"Tiếng Việt"', '"Tự động phát hiện"', '"Tiếng Anh"',
    '"Dữ liệu phụ đề không hợp lệ."', '"Không có câu phụ đề hợp lệ nào."', '"Quá nhiều câu phụ đề."',
  ]],
  ["lib/exportPresets.ts", [
    '"720p · Nhanh"', '"4K · Chất lượng cao"',
    '"Tùy chỉnh…"', '"Tùy chỉnh"', '"Preset phải là object."',
    'width phải là số nguyên ${', 'crf phải là số nguyên ${',
  ]],
  ["lib/sharePage.ts", [
    '"(Project trống, chưa có clip)"', '<html lang="vi">',
    '"Chế độ linked: phải gửi kèm file video', '"Cần videoBase64 (embedded)',
    'Thời lượng: ${fmtDuration(duration)}', 'Mở file này bằng trình duyệt là xem được',
  ]],
  ["lib/archive.ts", [
    '"manifest.json không phải JSON hợp lệ."', '"manifest.json không đúng định dạng vcut-archive."',
    '"manifest.json thiếu danh sách files."', '"Archive thiếu manifest.json."',
    '"manifest.json không hợp lệ."', 'Tổng dung lượng media vượt giới hạn ${MAX_ARCHIVE_BYTES}',
    'SHA-256 không khớp manifest',
  ]],
  ["lib/openProjectFlow.ts", [
    '"Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục?"',
    'Proxy của ${rehydrated.staleProxies',
  ]],
  ["lib/relink.ts", ['label: "Âm thanh"', 'label: "Ảnh"']],
];
for (const [file, lits] of GONE) {
  ok(`source: ${file} hết ${lits.length} literal cũ đã nối`, () => {
    const src = read(file);
    for (const lit of lits) {
      assert.ok(!src.includes(lit), `${file} còn literal cũ: ${lit}`);
    }
  });
}

// --- Hành vi thật (chạy ở cả vi và en) ----------------------------------
// Lib modules được import ĐỘNG sau setLang để const module-load nhận đúng lang.
async function main(): Promise<void> {
  setLang(LANG);
  // Mô phỏng bước merge của parent: deep-merge fragment vào đúng object
  // dict mà i18n/index.ts đang dùng (cùng module instance trong bundle).
  // Phải chạy TRƯỚC mọi dynamic import (const module-load gọi t() lúc nạp).
  const deepMerge = (dst: Record<string, unknown>, src: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(src)) {
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        const cur = dst[k];
        if (cur !== null && typeof cur === "object" && !Array.isArray(cur)) {
          deepMerge(cur as Record<string, unknown>, v as Record<string, unknown>);
          continue;
        }
        dst[k] = {};
        deepMerge(dst[k] as Record<string, unknown>, v as Record<string, unknown>);
      } else {
        dst[k] = v;
      }
    }
  };
  deepMerge(viDict as unknown as Record<string, unknown>, FRAG.vi);
  deepMerge(enDict as unknown as Record<string, unknown>, FRAG.en);
  // Mọi module app đều import ĐỘNG sau setLang (kể cả store — store kéo
  // theo captions.ts qua CAPTION_TRACK_LABEL, nên import tĩnh sẽ nạp
  // captions trước setLang và làm hỏng lần chạy en).
  const { useStore } = await import("../store");
  const captions = await import("./captions");
  const exportPresets = await import("./exportPresets");
  const sharePage = await import("./sharePage");
  const archive = await import("./archive");
  const relink = await import("./relink");
  const JSZip = (await import("jszip")).default;

  ok("captions: lỗi validate dịch theo lang", () => {
    assert.throws(() => captions.validateCaptionSegments({}), /./);
    try {
      captions.validateCaptionSegments({});
    } catch (e) {
      assert.equal(
        (e as Error).message,
        VI ? "Dữ liệu phụ đề không hợp lệ." : "Invalid caption data.",
      );
    }
    try {
      captions.validateCaptionSegments([]);
    } catch (e) {
      assert.equal(
        (e as Error).message,
        VI ? "Không có câu phụ đề hợp lệ nào." : "No valid caption sentences.",
      );
    }
  });

  ok("captions: nhãn dropdown theo lang (const module-load)", () => {
    const byCode = new Map(captions.CAPTION_LANGS.map((l: { code: string; label: string }) => [l.code, l.label]));
    assert.equal(byCode.get("vi"), VI ? "Tiếng Việt" : "Vietnamese");
    assert.equal(byCode.get("auto"), VI ? "Tự động phát hiện" : "Auto-detect");
    assert.equal(captions.TRANSLATE_TARGET_LANGS[0].label, VI ? "Tiếng Anh" : "English");
  });

  ok("captions: track label CỐ TÌNH giữ nguyên (key logic — xem LIMITS)", () => {
    // subtitles.ts nhận diện track phụ đề bằng prefix "Phụ đề"; dịch nhãn
    // sẽ làm rớt cue khi xuất SRT/VTT project. Khóa hành vi cũ ở đây.
    // Đợt 59 P5: key captions.translatedTrack ĐÃ merge thật vào dict
    // (parent gộp fragment round58-o5) nên translatedTrackLabel theo
    // locale — lock cũ "luôn Phụ đề (EN)" chỉ đúng trước merge.
    assert.equal(captions.CAPTION_TRACK_LABEL, "Phụ đề");
    assert.equal(
      captions.translatedTrackLabel("en"),
      VI ? "Phụ đề (EN)" : "Subtitles (EN)",
    );
  });

  ok("exportPresets: preset labels/descriptions theo lang", () => {
    const p720 = exportPresets.EXPORT_PRESETS.find((p: { id: string }) => p.id === "720p");
    assert.ok(p720);
    assert.equal(p720.label, VI ? "720p · Nhanh" : "720p · Fast");
    assert.ok(p720.description.includes(VI ? "file nhẹ" : "light file"));
    const custom = exportPresets.defaultCustomPreset();
    assert.equal(custom.label, VI ? "Tùy chỉnh" : "Custom");
  });

  ok("exportPresets: validate + summary + size estimate theo lang", () => {
    const errs = exportPresets.validateExportPreset({ width: 1 });
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes(VI ? "width phải là số nguyên 16..7680." : "width must be an integer 16..7680."));
    const p = exportPresets.getPreset("1080p");
    assert.ok(p);
    assert.equal(
      exportPresets.presetSummary(p),
      VI
        ? "1920×1080 @30fps · CRF 20 · medium · audio 160k"
        : "1920×1080 @30fps · CRF 20 · medium · audio 160k",
    );
    const label = exportPresets.sizeEstimateLabel(p, 60);
    assert.ok(label.startsWith("≈ "));
    assert.ok(label.includes(VI ? "ước tính" : "estimated"));
  });

  ok("sharePage: trang chia sẻ theo lang + lang attr", () => {
    const spec = {
      version: "0.2.0" as const,
      meta: { name: "Test", width: 1280, height: 720, fps: 30 },
      tracks: [],
    };
    const r = sharePage.buildSharePage({
      title: "Test",
      spec,
      videoMime: "video/mp4",
      videoFileName: "video.mp4",
    });
    assert.ok(r.html.includes(`<html lang="${LANG}">`), "html lang phải theo ngôn ngữ hiện tại");
    assert.ok(r.html.includes(VI ? "Thời lượng: 0:00" : "Duration: 0:00"));
    assert.ok(r.html.includes(VI ? "(Project trống, chưa có clip)" : "(Empty project, no clips yet)"));
    assert.ok(r.html.includes(VI ? "Mở file này bằng trình duyệt" : "Open this file in a browser"));
    assert.ok(r.warnings.some((w: string) => w.includes(VI ? "Chế độ linked" : "Linked mode")));
    assert.throws(
      () => sharePage.buildSharePage({ title: "T", spec, videoMime: "video/mp4" }),
      new RegExp(VI ? "Cần videoBase64" : "Need videoBase64"),
    );
  });

  ok("archive: import zip thiếu manifest báo lỗi theo lang", async () => {
    const emptyZip = await new JSZip().generateAsync({ type: "blob" });
    const res = await archive.importArchive(emptyZip);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e: string) => e.includes(VI ? "Archive thiếu manifest.json." : "The archive is missing manifest.json.")));
    const garbage = await archive.importArchive(new Blob(["khong-phai-zip"]));
    assert.equal(garbage.ok, false);
    assert.ok(garbage.errors.some((e: string) => e.includes(VI ? "Không đọc được file zip" : "Could not read the zip file")));
  });

  ok("relink: nhãn kind theo lang (const module-load)", () => {
    assert.equal(relink.RELINK_KIND_META.audio.label, VI ? "Âm thanh" : "Audio");
    assert.equal(relink.RELINK_KIND_META.image.label, VI ? "Ảnh" : "Image");
    assert.equal(relink.RELINK_KIND_META.video.label, "Video");
  });

  ok("store: undo label + text mặc định theo lang", () => {
    // Zustand set() tạo state object mới — phải đọc lại getState() sau mỗi
    // action, không dùng object đã capture trước đó.
    useStore.getState().newProject();
    const tid = useStore.getState().addTrack("audio");
    assert.equal(useStore.getState().undoLabel, VI ? "Thêm track Âm thanh" : "Add Audio track");
    assert.ok(tid);
    useStore.getState().addTextClip();
    assert.equal(useStore.getState().undoLabel, VI ? "Thêm chữ" : "Add text");
    const textTrack = useStore.getState().spec.tracks.find((t: { kind: string }) => t.kind === "text");
    assert.ok(textTrack);
    assert.equal(
      (textTrack.clips[0] as { text: string }).text,
      VI ? "Nhập chữ…" : "Type text…",
    );
    useStore.getState().addMarkerAtPlayhead();
    assert.equal(useStore.getState().undoLabel, VI ? "Thêm marker" : "Add marker");
  });

  await runAll();
}

main().catch((e) => {
  console.error(`M4 test crashed: ${(e as Error).stack ?? e}`);
  process.exitCode = 1;
});
