/**
 * TemplatePicker — chọn template mẫu rồi điền placeholder để tạo project mới.
 * (R1-104/R1-105, Batch J)
 *
 * Luồng: gallery 10 template → click 1 template → form điền placeholder
 * (chữ: input; media: chọn file trong kho media hoặc giữ mặc định) →
 * "Tạo project" → store.replaceProject(spec) (1 project mới, không undo
 * xuyên project — giống newProject/loadProject).
 */
import { useMemo, useState } from "react";
import { useStore } from "../store";
import {
  applyTemplateValues,
  type TemplateDef,
  type TemplatePlaceholder,
} from "../lib/templateEngine";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "../lib/templates";

const KIND_LABEL: Record<TemplatePlaceholder["kind"], string> = {
  video: "🎞 Video",
  image: "🖼 Ảnh",
  audio: "🎵 Audio",
  text: "✏️ Chữ",
};

/** Gợi ý aspect ratio thành nhãn hiển thị. */
function aspectLabel(aspect: string): string {
  if (aspect === "1920:1080") return "16:9 ngang";
  if (aspect === "1080:1920") return "9:16 dọc";
  if (aspect === "1080:1080") return "1:1 vuông";
  return aspect;
}

export function TemplatePicker({ onClose }: { onClose: () => void }) {
  const media = useStore((s) => s.media);
  const replaceProject = useStore((s) => s.replaceProject);
  const checkMissingMedia = useStore((s) => s.checkMissingMedia);

  const [cat, setCat] = useState<string>("all");
  const [selected, setSelected] = useState<TemplateDef | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const filtered = useMemo(
    () => (cat === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.template.category === cat)),
    [cat]
  );

  const setValue = (id: string, v: string) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  /** Media trong kho khớp loại placeholder (để user chọn thay vì gõ tên file). */
  const mediaFor = (kind: TemplatePlaceholder["kind"]) => {
    const want = kind === "video" ? "video" : kind === "image" ? "image" : "audio";
    return media.filter((m) => m.kind === want);
  };

  const apply = () => {
    if (!selected) return;
    const res = applyTemplateValues(selected, values);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    replaceProject(res.spec);
    // Quét media thiếu để RelinkPanel hiện lên nếu user chưa nạp file mẫu.
    setTimeout(() => checkMissingMedia(), 0);
    onClose();
  };

  // ---- Bước 2: form điền placeholder ----
  if (selected) {
    const tpl = selected.template;
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal template-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>🎬 {tpl.name}</h3>
            <button className="icon-btn" onClick={() => { setSelected(null); setError(null); }} title="Quay lại danh sách">
              ←
            </button>
          </div>
          <p className="muted">{tpl.description}</p>
          <p className="muted">
            {aspectLabel(tpl.aspect)} · {tpl.durationSec}s · {tpl.placeholders.length} mục cần điền
          </p>

          <div className="template-form">
            {tpl.placeholders.map((p) => (
              <label key={p.id} className="field">
                <span>
                  {KIND_LABEL[p.kind]} — {p.label}
                </span>
                {p.kind === "text" ? (
                  <input
                    type="text"
                    value={values[p.id] ?? ""}
                    placeholder={p.default}
                    onChange={(e) => setValue(p.id, e.target.value)}
                  />
                ) : (
                  <select
                    value={values[p.id] ?? ""}
                    onChange={(e) => setValue(p.id, e.target.value)}
                  >
                    <option value="">(mặc định: {p.default})</option>
                    {mediaFor(p.kind).map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            ))}
          </div>

          {error && <p className="error">{error}</p>}

          {!confirming ? (
            <div className="modal-actions">
              <button onClick={onClose}>Huỷ</button>
              <button className="primary" onClick={() => setConfirming(true)}>
                Tạo project từ mẫu
              </button>
            </div>
          ) : (
            <div className="confirm-box">
              <p>
                Tạo project mới từ mẫu <b>{tpl.name}</b>? Project hiện tại sẽ bị
                thay thế (không undo được).
              </p>
              <div className="modal-actions">
                <button onClick={() => setConfirming(false)}>Quay lại</button>
                <button className="primary danger" onClick={apply}>
                  Xác nhận tạo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- Bước 1: gallery ----
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal template-modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>🎬 Mẫu video (10 mẫu)</h3>
          <button className="icon-btn" onClick={onClose} title="Đóng">
            ✕
          </button>
        </div>
        <div className="chip-row">
          <button
            className={cat === "all" ? "chip active" : "chip"}
            onClick={() => setCat("all")}
          >
            Tất cả
          </button>
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={cat === c.id ? "chip active" : "chip"}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="template-grid">
          {filtered.map((t) => (
            <button
              key={t.template.id}
              className="template-card"
              onClick={() => {
                setSelected(t);
                setValues({});
                setError(null);
                setConfirming(false);
              }}
              title={t.template.description}
            >
              <span className="template-aspect">{aspectLabel(t.template.aspect)}</span>
              <span className="template-name">{t.template.name}</span>
              <span className="template-desc">{t.template.description}</span>
              <span className="template-meta">
                {t.template.durationSec}s · {t.template.placeholders.length} mục điền
              </span>
            </button>
          ))}
        </div>
        <p className="muted">
          Mẫu do VCut Studio thiết kế (MIT). File gốc: <code>assets/templates/</code>
        </p>
      </div>
    </div>
  );
}
