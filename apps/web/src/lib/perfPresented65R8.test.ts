// perfPresented65R8.test.ts — Phase 9 đợt 65, luồng S8: khóa logic lấy mẫu
// presented-frame rate cho FPS meter (PerfOverlay) + key fragment.
//
// Chạy bằng esbuild bundle (mẫu test của repo, chạy từ gốc repo):
//   ./node_modules/.bin/esbuild apps/web/src/lib/perfPresented65R8.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round65-r8/perfPresented65R8.test.cjs \
//     && node /tmp/round65-r8/perfPresented65R8.test.cjs
import assert from "node:assert/strict";
import {
  FRAGMENT_KEY_PRESENTED_FPS,
  FRAGMENT_KEY_PRESENTED_NOTE,
  perfPresentedTable,
  presentedLabel,
  presentedNote,
  presentedRate,
  readPlayingPresentedTotal,
  type MediaElsWindowLike,
} from "./perfPresented65R8";

/** Khai báo tối thiểu để không cần @types/node (mẫu M7/O5). */
declare const process: {
  exitCode: number | undefined;
};

let n = 0;
function check(name: string, fn: () => void) {
  n++;
  fn();
  console.log(`ok ${n} - ${name}`);
}

/** Element giả trong __vcutMediaEls. */
function fakeWin(entries: Array<{ tag: string; paused: boolean; total: number; noApi?: boolean }>): MediaElsWindowLike {
  return {
    __vcutMediaEls: entries.map((e) => ({
      tag: e.tag,
      el: {
        paused: e.paused,
        ...(e.noApi ? {} : { getVideoPlaybackQuality: () => ({ totalVideoFrames: e.total }) }),
      },
    })),
  };
}

// 1. Fragment: đủ 2 key, vi + en đều có chuỗi, không rỗng, khác nhau vi/en.
check("fragment có đủ perf.presentedFps + perf.presentedNote, vi/en đều có chuỗi", () => {
  assert.equal(FRAGMENT_KEY_PRESENTED_FPS, "perf.presentedFps");
  assert.equal(FRAGMENT_KEY_PRESENTED_NOTE, "perf.presentedNote");
  const t = perfPresentedTable();
  for (const lang of ["vi", "en"] as const) {
    assert.equal(typeof t[lang].presentedFps, "string");
    assert.ok(t[lang].presentedFps.length > 0, `${lang}.presentedFps rỗng`);
    assert.equal(typeof t[lang].presentedNote, "string");
    assert.ok(t[lang].presentedNote.length > 0, `${lang}.presentedNote rỗng`);
  }
  assert.notEqual(t.vi.presentedFps, t.en.presentedFps);
  assert.notEqual(t.vi.presentedNote, t.en.presentedNote);
});
check("label/note theo locale, fallback vi khi thiếu en", () => {
  assert.equal(presentedLabel("vi"), perfPresentedTable().vi.presentedFps);
  assert.equal(presentedLabel("en"), perfPresentedTable().en.presentedFps);
  assert.equal(presentedNote("vi"), perfPresentedTable().vi.presentedNote);
  assert.equal(presentedNote("en"), perfPresentedTable().en.presentedNote);
  const table = { vi: { presentedFps: "VI", presentedNote: "GHI VI" }, en: {} };
  assert.equal(presentedLabel("en", table), "VI");
  assert.equal(presentedNote("en", table), "GHI VI");
  assert.equal(presentedLabel("en", { vi: {}, en: {} }), "presentedFps");
});

// 2. Tổng total của element VIDEO đang phát; bỏ qua element pause/audio.
check("cộng total các video đang phát, bỏ qua video pause + audio", () => {
  const w = fakeWin([
    { tag: "VIDEO", paused: false, total: 300 },
    { tag: "VIDEO", paused: true, total: 999 },
    { tag: "AUDIO", paused: false, total: 555 },
    { tag: "VIDEO", paused: false, total: 30 },
  ]);
  assert.equal(readPlayingPresentedTotal(w), 330);
});
check("không có video đang phát → null (không phải 0)", () => {
  assert.equal(readPlayingPresentedTotal(fakeWin([{ tag: "VIDEO", paused: true, total: 100 }])), null);
  assert.equal(readPlayingPresentedTotal(fakeWin([])), null);
  assert.equal(readPlayingPresentedTotal({}), null);
  assert.equal(readPlayingPresentedTotal(null), null);
});
check("element đang phát nhưng không có API → null", () => {
  assert.equal(
    readPlayingPresentedTotal(fakeWin([{ tag: "VIDEO", paused: false, total: 0, noApi: true }])),
    null,
  );
});

// 3. Tỉ lệ giữa 2 lần đọc: 300 frame / 10 s = 30 fps.
check("tỉ lệ 30 fps từ 2 lần đọc tổng", () => {
  assert.equal(presentedRate(0, 300, 10), 30);
  assert.equal(presentedRate(100, 400, 10), 30);
  assert.equal(presentedRate(500, 500, 10), 0);
});
check("thiếu mẫu / cửa sổ không tiến / tổng đi lùi → null", () => {
  assert.equal(presentedRate(null, 300, 10), null);
  assert.equal(presentedRate(0, null, 10), null);
  assert.equal(presentedRate(0, 300, 0), null);
  assert.equal(presentedRate(0, 300, -1), null);
  assert.equal(presentedRate(300, 40, 10), null);
});

// 4. Tổng đi lùi = element bị thay: caller phải hủy cửa sổ (null), không ghi số rác.
check("mô phỏng element bị thay giữa 2 mẫu: tổng mới nhỏ hơn → null", () => {
  const w1 = fakeWin([{ tag: "VIDEO", paused: false, total: 300 }]);
  const w2 = fakeWin([{ tag: "VIDEO", paused: false, total: 40 }]);
  const a = readPlayingPresentedTotal(w1);
  const b = readPlayingPresentedTotal(w2);
  assert.equal(presentedRate(a, b, 10), null);
});

console.log(`perfPresented65R8: ${n}/${n} pass`);
