/**
 * Panel Export: kiểm tra spec hợp lệ (dùng isVideoSpec + kiểm tra sâu),
 * xem trước JSON, tải xuống file .videospec.json hoặc sao chép.
 */
import { useMemo, useState } from "react";
import type { VideoSpec } from "@repo-1/video-spec";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "@repo-1/video-spec";
import { useStore } from "./store";
import { fmtTime } from "./lib";

/** Kiểm tra sâu hơn isVideoSpec: mọi field số phải hợp lệ, clip phải có src... */
function deepValidate(spec: VideoSpec): string[] {
  const issues: string[] = [];
  const m = spec.meta;
  if (!m.name) issues.push("meta.name đang trống.");
  if (!(m.width > 0) || !(m.height > 0)) issues.push("meta.width/height phải > 0.");
  if (!(m.fps > 0)) issues.push("meta.fps phải > 0.");
  for (const t of spec.tracks) {
    if (!t.id) issues.push("Có track thiếu id.");
    if (!["video", "audio", "text"].includes(t.kind)) issues.push(`Track ${t.id}: kind không hợp lệ.`);
    if (!Array.isArray(t.clips)) {
      issues.push(`Track ${t.id}: clips phải là mảng.`);
      continue;
    }
    for (const c of t.clips) {
      const tag = `Clip ${c.id}`;
      if (!(c.start >= 0)) issues.push(`${tag}: start phải >= 0.`);
      if (!(c.duration > 0)) issues.push(`${tag}: duration phải > 0.`);
      if (c.kind === "video" || c.kind === "audio") {
        if (!c.src) issues.push(`${tag}: thiếu src.`);
        if (!(c.in >= 0)) issues.push(`${tag}: in phải >= 0.`);
        if (!(c.out > c.in)) issues.push(`${tag}: out phải > in.`);
      }
      if (c.kind === "text") {
        if (!c.style || !(c.style.fontSize > 0)) issues.push(`${tag}: style.fontSize phải > 0.`);
      }
    }
  }
  return issues;
}

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const spec = useStore((s) => s.spec);
  const [copied, setCopied] = useState(false);

  const { ok, issues, json } = useMemo(() => {
    const list: string[] = [];
    if (!isVideoSpec(spec)) {
      list.push("Spec không đúng định dạng video-spec (sai version hoặc thiếu meta/tracks).");
    } else {
      list.push(...deepValidate(spec));
    }
    return { ok: list.length === 0, issues: list, json: JSON.stringify(spec, null, 2) };
  }, [spec]);

  const download = () => {
    if (!ok) return;
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safe = (spec.meta.name || "project").replace(/[^\w\- ]+/g, "").trim() || "project";
    a.download = `${safe}.videospec.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const dur = projectDuration(spec);
  const clipCount = spec.tracks.reduce((n, t) => n + t.clips.length, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>⬇ Xuất video-spec</span>
          <button className="icon-btn" onClick={onClose} title="Đóng">×</button>
        </div>

        <div className={`valid-banner ${ok ? "ok" : "bad"}`}>
          {ok ? (
            <>✅ Spec hợp lệ (video-spec v{SPEC_VERSION}) — render worker đọc được.</>
          ) : (
            <>❌ Spec chưa hợp lệ — sửa các lỗi dưới rồi xuất lại.</>
          )}
        </div>

        <div className="export-stats">
          <div><span>Thời lượng</span><b>{fmtTime(dur)}</b></div>
          <div><span>Track</span><b>{spec.tracks.length}</b></div>
          <div><span>Clip</span><b>{clipCount}</b></div>
        </div>

        {issues.length > 0 && (
          <ul className="issues">
            {issues.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        )}

        <pre className="json-preview">{json}</pre>

        <p className="tips">
          File JSON này là "ngôn ngữ chung": render worker (Phase 1B) đọc nó để xuất MP4,
          AI agent (Phase 4) cũng sinh đúng định dạng này. Trường <code>src</code> là tên
          file gốc trong thư mục media của dự án.
        </p>

        <div className="modal-actions">
          <button onClick={copy}>{copied ? "✓ Đã sao chép" : "⧉ Sao chép JSON"}</button>
          <button className="primary" onClick={download} disabled={!ok}>
            ⬇ Tải xuống .json
          </button>
        </div>
      </div>
    </div>
  );
}
