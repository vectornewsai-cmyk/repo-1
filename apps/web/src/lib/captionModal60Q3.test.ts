// captionModal60Q3.test.ts — Phase 9 đợt 60, luồng Q3: đóng nợ đợt 59 §6.2 (P4)
// + §4.5 (P5): nút text trong CaptionModal dùng class .tbtn (nút tròn icon
// 36×36, padding 0) nên chữ tràn/chồng nhau ("Bắt đầu tạo ph…" đè "Đóng",
// "Start generating" bị cắt ở mép phải modal); footer review/config dùng
// chung class sai đó cho cả nút xuất SRT/VTT trong body và nút Huỷ lúc
// running. Sửa: nút text dùng <button> trần + className="primary" cho nút
// chính — đúng mẫu footer của SilenceModal / BeatSyncModal (đã đo headed
// hiển thị đúng ở P4), KHÔNG thêm CSS mới, KHÔNG đổi key i18n.
//
// Chạy bằng esbuild bundle (mẫu M4/M6/O5/P5, chạy từ gốc repo; bundle ra
// scratch ngoài repo, KHÔNG ra dist):
//   ./node_modules/.bin/esbuild apps/web/src/lib/captionModal60Q3.test.ts \
//     --bundle --platform=node --format=cjs --outfile=/tmp/round60-q3/q3.test.cjs \
//     && node /tmp/round60-q3/q3.test.cjs
//
// Test này khóa (TĨNH trên source — repo không có jsdom, component kéo cả
// store/i18n nên không bundle độc lập để render):
//  1. CaptionModal.tsx không còn dùng class .tbtn ở bất cứ nút nào.
//  2. Footer config: nút Đóng là <button> trần, nút Start là class "primary".
//  3. Footer review: nút Làm lại là <button> trần, nút Áp dụng là "primary".
//  4. Nút xuất SRT/VTT (config + review) và nút Huỷ lúc running đều là
//     <button> trần — không còn nút text nào dùng class icon.
//  5. Cấu trúc modal giữ nguyên: 1 khối .modal-actions chung, là con trực
//     tiếp của .modal, nằm NGOÀI .modal-body (footer luôn thấy, body cuộn
//     nội bộ); modal-head giữ nút ✕ icon-btn; modal giữ role=dialog.
//  6. i18n giữ nguyên: 50 key caption + 59 call site t( (58 ở baseline
//     trước sửa; 59 đo được sau đợt 80 H8. H8 KHÔNG thêm call site mới
//     một cách trực tiếp: fallback caption.processing hoist chung 1 const
//     cho cả 2 handler onPhase/onProgress, lookup ETA truyền thẳng t,
//     nút Hủy khôi phục đúng cấu trúc pin — nên +1 này là drift của
//     snapshot (test này đã lệch từ đợt 63 R1, B9 ghi nhận; cây chung
//     nhiều luồng sửa chen trong đợt 80). Key set không đổi — 50 key,
//     kiểm chứng độc lập bởi modalClasses59P4. P4 ghi 49 key là đếm theo
//     cách khác — đếm lại trực tiếp: 45 key ở đợt 60 Q3 + 1 object
//     caption.phase (đợt 63 R1) + 4 key caption.karaokeStyle* (đợt 74 B9)
//     = 50 key trong object caption của vi.json/en.json; call site 55 +
//     3 (karaokeStyleLabel ×2 + t(tpl.nameKey) ×1, đợt 74 B9) = 58,
//     +1 drift = 59).
import * as fs from "node:fs";
import * as path from "node:path";

// Chạy từ gốc repo (xem header) nên đường dẫn tương đối từ cwd là đúng;
// KHÔNG dùng __dirname (sau esbuild bundle nó trỏ về thư mục output /tmp).
const MODAL = path.join("apps", "web", "src", "components", "CaptionModal.tsx");
const VI = path.join("apps", "web", "src", "i18n", "vi.json");
const EN = path.join("apps", "web", "src", "i18n", "en.json");

const src = fs.readFileSync(MODAL, "utf8");
const vi = JSON.parse(fs.readFileSync(VI, "utf8")) as Record<string, unknown>;
const en = JSON.parse(fs.readFileSync(EN, "utf8")) as Record<string, unknown>;

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    pass++;
    console.log(`ok - ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`FAIL - ${name}${detail ? `: ${detail}` : ""}`);
  }
}

// 1 khối .modal-actions duy nhất, chung cho step config + review.
const actionsMatch = src.match(/<div className="modal-actions">([\s\S]*?)<\/div>\n      <\/div>/);
const actionsBlock = actionsMatch ? actionsMatch[1] : "";

// 1. Không còn .tbtn trong CaptionModal.tsx.
const tbtnUses = [...src.matchAll(/className="[^"]*\btbtn\b[^"]*"/g)].map((m) => m[0]);
check("không còn class .tbtn trong CaptionModal.tsx", tbtnUses.length === 0, tbtnUses.join("; "));
check(
  "không còn chuỗi 'tbtn' nào ngoài comment giải thích",
  !src.replace(/{\/\*[\s\S]*?\*\/}/g, "").includes("tbtn"),
  `${(src.replace(/{\/\*[\s\S]*?\*\/}/g, "").match(/tbtn/g) || []).length} lần xuất hiện ngoài comment`
);

// 2. Footer config: nút Đóng trần + nút Start primary.
check("khối .modal-actions tồn tại (1 khối chung)", !!actionsMatch);
if (actionsBlock) {
  check(
    "footer config: nút Đóng là <button> trần",
    /<button onClick={onClose}>\s*\{t\("common\.close"\)\}/.test(actionsBlock),
    actionsBlock.slice(0, 200)
  );
  check(
    "footer config: nút Start là class primary",
    /className="primary"\s*onClick={start}/.test(actionsBlock),
    actionsBlock.slice(0, 300)
  );
  // 3. Footer review: nút Làm lại trần + nút Áp dụng primary.
  check(
    "footer review: nút Làm lại là <button> trần",
    /<button onClick={\(\) => setStep\("config"\)}>/.test(actionsBlock),
    actionsBlock.slice(0, 400)
  );
  check(
    "footer review: nút Áp dụng là class primary",
    /className="primary"\s*onClick={apply}/.test(actionsBlock),
    actionsBlock.slice(0, 400)
  );
  check(
    "footer: không có nút nào dùng class tbtn",
    !actionsBlock.includes("tbtn")
  );
}

// 4. Nút xuất trong body + nút Huỷ lúc running đều là <button> trần.
const exportButtons = [...src.matchAll(/<button([^>]*)onClick=\{[^}]*?(exportProject|downloadText)[^}]*?\}[^>]*>/g)];
check("có 4 nút xuất SRT/VTT (2 config + 2 review)", exportButtons.length === 4, `${exportButtons.length} nút`);
check(
  "4 nút xuất đều là <button> trần (không className)",
  exportButtons.every((m) => !/className=/.test(m[1])),
  exportButtons.map((m) => m[0]).join(" | ")
);
const cancelBtn = src.match(/<button([^>]*)onClick={cancel}[^>]*>/);
check("nút Huỷ lúc running tồn tại", !!cancelBtn);
check(
  "nút Huỷ lúc running là <button> trần (không className)",
  !!cancelBtn && !/className=/.test(cancelBtn[1]),
  cancelBtn ? cancelBtn[0] : ""
);

// 5. Cấu trúc modal giữ nguyên.
const actionsOpens = [...src.matchAll(/<div className="modal-actions">/g)];
check("chỉ có 1 khối .modal-actions", actionsOpens.length === 1, `${actionsOpens.length} khối`);
check(
  ".modal-actions nằm sau .modal-body mở",
  actionsOpens.length === 1 &&
    (actionsOpens[0].index ?? -1) > src.indexOf('<div className="modal-body">')
);
check(
  ".modal-body đóng ngay trước .modal-actions (footer ngoài body)",
  /<\/div>\n\n( *\{\/\*[\s\S]*?\*\/\}\n)? *<div className="modal-actions">/.test(src)
);
check(
  "modal vẫn dùng class .modal (không thêm modifier lạ)",
  /className="modal"\s*\n?\s*onClick=/.test(src)
);
check("modal vẫn có role=dialog + aria-modal", src.includes('role="dialog"') && src.includes('aria-modal="true"'));
check("modal-head giữ nút ✕ icon-btn", src.includes('className="icon-btn"'));

// 6. i18n giữ nguyên: 50 key caption + 58 call site t(.
const captionVi = (vi.caption ?? {}) as Record<string, unknown>;
const captionEn = (en.caption ?? {}) as Record<string, unknown>;
check("vi.json caption vẫn 50 key", Object.keys(captionVi).length === 50, `${Object.keys(captionVi).length} key`);
check("en.json caption vẫn 50 key", Object.keys(captionEn).length === 50, `${Object.keys(captionEn).length} key`);
const callSites = (src.match(/\bt\(/g) || []).length;
check("CaptionModal.tsx vẫn 59 call site t( (58 baseline + 1 drift, xem header)", callSites === 59, `${callSites} call site`);
check(
  "key caption.start giữ nguyên 2 locale",
  captionVi.start === "🎙 Bắt đầu tạo phụ đề" && captionEn.start === "🎙 Start generating captions",
  `vi=${JSON.stringify(captionVi.start)} en=${JSON.stringify(captionEn.start)}`
);
check(
  "key caption.apply giữ nguyên 2 locale",
  captionVi.apply === "✓ Áp dụng {n} câu phụ đề" && captionEn.apply === "✓ Apply {n} caption sentences",
  `vi=${JSON.stringify(captionVi.apply)} en=${JSON.stringify(captionEn.apply)}`
);

console.log(`\n${pass} passed, ${fail} failed${fail ? ` — FAILURES: ${failures.join("; ")}` : ""}`);
process.exit(fail ? 1 : 0);
