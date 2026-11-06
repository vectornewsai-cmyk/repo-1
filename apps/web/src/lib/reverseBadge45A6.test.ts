// reverseBadge45A6.test.ts — Phase 9 đợt 45, luồng A6: badge từng frame
// theo trạng thái failed của controller + hiển thị đổi lang không chờ
// tick (đóng nợ Z6 §6.2 và §6.3 ở mức thuần).
//
// Chạy bằng esbuild bundle (mẫu Z6, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/reverseBadge45A6.test.ts \
//     --bundle --platform=node --format=esm --outfile=<scratch>/a6.test.mjs \
//     && node <scratch>/a6.test.mjs
//
// Phạm vi Node: logic thuần + hàm t() giả lập vi/en — KHÔNG mạo nhận
// là browser thật, KHÔNG mạo nhận đã chạy effect React của preview
// (effect [previewLang] ở preview.tsx chỉ được kiểm chứng bằng tsc +
// đọc code; headed cho effect đó vẫn là nợ mở, xem LIMITS A6).
// Test này KHÔNG đọc file i18n JSON thật (tránh lỗi CWD như Z6 §2
// parent): chuỗi vi/en được mô phỏng bằng 2 hàm t() giả có cùng key
// và placeholder {api} như dict thật — khóa là hành vi đổi lang của
// hàm display, không phải nội dung dict (dict đã khóa ở test Z6).
import assert from "node:assert/strict";
import {
  resolveReverseEngineBadge,
  resolveReverseEngineDetailed,
} from "./reversePlayback.ts";
import {
  resolveReverseEngineBadge45A6,
  reverseEngineBadgeDisplay45A6,
} from "./reverseBadge45A6.ts";

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
  console.log(`A6 badge: ${pass}/${queue.length} pass`);
}

const WC = { engine: "webcodecs", reason: "webcodecs-ok" } as const;
const MISSING = {
  engine: "element",
  reason: "missing-video-decoder",
} as const;
const OPT_OFF = { engine: "element", reason: "opt-in-off" } as const;

// Hàm t() giả lập vi/en: cùng key + placeholder {api} như dict thật.
function fakeT(lang: "vi" | "en"): (key: string, vars?: Record<string, string>) => string {
  const dict: Record<string, string> = {
    "reverseEngine.badgeWebcodecs":
      lang === "vi" ? "◀ NGƯỢC: WEBCODECS" : "◀ REVERSE: WEBCODECS",
    "reverseEngine.titleWebcodecs":
      lang === "vi" ? "title-wc-vi" : "title-wc-en",
    "reverseEngine.badgeElementMissing":
      lang === "vi"
        ? "◀ NGƯỢC: ELEMENT (thiếu {api})"
        : "◀ REVERSE: ELEMENT (missing {api})",
    "reverseEngine.titleElementMissing":
      lang === "vi" ? "title-el-vi {api}" : "title-el-en {api}",
    // ROUND46-B6: nhánh failed nay dùng key riêng (giá trị fake = đúng
    // chuỗi dict thật, để test này cũng khóa wording mới).
    "reverseEngine.badgeElementFailed":
      lang === "vi"
        ? "◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)"
        : "◀ REVERSE: ELEMENT (WebCodecs decode failed)",
    "reverseEngine.titleElementFailed":
      lang === "vi"
        ? "Đường WebCodecs đã chọn không decode được (controller đã failed) nên preview rơi về đường element (seek từng frame) — không crash, không mất hình."
        : "The selected WebCodecs path could not decode (controller failed), so preview falls back to the element path (seeking frame by frame) — no crash, no lost picture.",
  };
  return (key: string, vars?: Record<string, string>) => {
    const raw = dict[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);
  };
}

// --- 1. Khóa chính: failed -> badge failed ---------------------------
ok("failed + đường đã chọn webcodecs + stepping -> element-failed", () => {
  const b = resolveReverseEngineBadge45A6(WC, true, true);
  assert.deepEqual(b, {
    kind: "element-failed",
    missingApi: null,
    controllerFailed: true,
  });
});

ok("failed = false + webcodecs -> giữ webcodecs, controllerFailed false", () => {
  assert.deepEqual(resolveReverseEngineBadge45A6(WC, true, false), {
    kind: "webcodecs",
    missingApi: null,
    controllerFailed: false,
  });
});

// --- 2. Các trạng thái cũ không đổi (đối chiếu trực tiếp hàm Z6) -----
ok("mọi trạng thái cũ: kind + missingApi bằng đúng hàm Z6 khi failed=false", () => {
  const cases = [
    { detailed: WC, stepping: true },
    { detailed: WC, stepping: false },
    { detailed: MISSING, stepping: true },
    { detailed: MISSING, stepping: false },
    { detailed: OPT_OFF, stepping: true },
    { detailed: OPT_OFF, stepping: false },
    {
      detailed: { engine: "element", reason: "missing-encoded-video-chunk" },
      stepping: true,
    },
    {
      detailed: { engine: "element", reason: "missing-video-frame" },
      stepping: true,
    },
  ] as const;
  for (const c of cases) {
    const old = resolveReverseEngineBadge(c.detailed, c.stepping);
    const next = resolveReverseEngineBadge45A6(c.detailed, c.stepping, false);
    if (old === null) {
      assert.equal(next, null, `case ${JSON.stringify(c)} phải null như cũ`);
    } else {
      assert.deepEqual(
        { kind: next?.kind, missingApi: next?.missingApi },
        { kind: old.kind, missingApi: old.missingApi },
        `case ${JSON.stringify(c)} lệch kind/missingApi so với Z6`,
      );
      assert.equal(next?.controllerFailed, false);
    }
  }
});

ok("failed + đường đã chọn element (thiếu API) -> giữ element-missing, failed không ghi đè lý do", () => {
  const b = resolveReverseEngineBadge45A6(MISSING, true, true);
  assert.deepEqual(b, {
    kind: "element-missing",
    missingApi: "VideoDecoder",
    controllerFailed: false,
  });
});

ok("failed + không stepping -> null (badge ẩn, như cũ)", () => {
  assert.equal(resolveReverseEngineBadge45A6(WC, false, true), null);
});

ok("failed + opt-in tắt -> null (badge ẩn, như cũ)", () => {
  assert.equal(resolveReverseEngineBadge45A6(OPT_OFF, true, true), null);
});

ok("đường đã chọn từ resolveReverseEngineDetailed(true, đủ API) + failed -> element-failed", () => {
  const detailed = resolveReverseEngineDetailed(true, {
    videoDecoder: true,
    encodedVideoChunk: true,
    videoFrame: true,
  });
  assert.deepEqual(resolveReverseEngineBadge45A6(detailed, true, true)?.kind, "element-failed");
});

// --- 3. Hiển thị: đổi lang render lại ngay (không chờ tick) ----------
ok("display: cùng badge webcodecs, t() vi -> chuỗi vi, t() en -> chuỗi en (không cần tick)", () => {
  const b = resolveReverseEngineBadge45A6(WC, true, false)!;
  const vi = reverseEngineBadgeDisplay45A6(b, fakeT("vi"));
  const en = reverseEngineBadgeDisplay45A6(b, fakeT("en"));
  assert.equal(vi.text, "◀ NGƯỢC: WEBCODECS");
  assert.equal(en.text, "◀ REVERSE: WEBCODECS");
  assert.notEqual(vi.text, en.text);
  assert.equal(vi.bg, "rgba(40,120,180,0.92)");
  assert.equal(en.bg, "rgba(40,120,180,0.92)");
});

ok("display: badge failed -> text element (amber), khác webcodecs, qua key riêng B6 (không còn mượn key missing)", () => {
  const b = resolveReverseEngineBadge45A6(WC, true, true)!;
  const vi = reverseEngineBadgeDisplay45A6(b, fakeT("vi"));
  const en = reverseEngineBadgeDisplay45A6(b, fakeT("en"));
  assert.equal(vi.text, "◀ NGƯỢC: ELEMENT (decode WebCodecs lỗi)");
  assert.equal(en.text, "◀ REVERSE: ELEMENT (WebCodecs decode failed)");
  assert.equal(vi.bg, "rgba(140,90,0,0.92)");
  assert.ok(vi.title.includes("không decode được"));
  assert.ok(en.title.includes("could not decode"));
  assert.ok(!vi.text.includes("thiếu"));
});

ok("display: badge element-missing giữ đúng tên API thiếu (vi/en)", () => {
  const b = resolveReverseEngineBadge45A6(MISSING, true, false)!;
  assert.equal(
    reverseEngineBadgeDisplay45A6(b, fakeT("vi")).text,
    "◀ NGƯỢC: ELEMENT (thiếu VideoDecoder)",
  );
  assert.equal(
    reverseEngineBadgeDisplay45A6(b, fakeT("en")).text,
    "◀ REVERSE: ELEMENT (missing VideoDecoder)",
  );
});

ok("display: badge null -> text/title/bg rỗng (badge ẩn)", () => {
  assert.deepEqual(reverseEngineBadgeDisplay45A6(null, fakeT("vi")), {
    text: "",
    title: "",
    bg: "",
  });
});

ok("mô hình lang-tick (ghi rõ là mô hình, không phải code repo): text cache cũ giữ chuỗi cũ tới khi display tính lại", () => {
  // Cách cũ (chỉ tính trong tick): đổi lang không tự tính lại text.
  let cachedText = reverseEngineBadgeDisplay45A6(
    resolveReverseEngineBadge45A6(WC, true, false)!,
    fakeT("vi"),
  ).text;
  assert.equal(cachedText, "◀ NGƯỢC: WEBCODECS");
  // Sau khi đổi lang nhưng CHƯA có tick/effect tính lại: cache vẫn cũ.
  assert.equal(cachedText, "◀ NGƯỢC: WEBCODECS");
  // Cách mới (effect [previewLang] gọi lại display): tính lại ngay, không chờ tick.
  cachedText = reverseEngineBadgeDisplay45A6(
    resolveReverseEngineBadge45A6(WC, true, false)!,
    fakeT("en"),
  ).text;
  assert.equal(cachedText, "◀ REVERSE: WEBCODECS");
});

runAll();
