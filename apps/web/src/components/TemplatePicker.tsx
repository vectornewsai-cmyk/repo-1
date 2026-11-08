/**
 * TemplatePicker — chọn template mẫu rồi điền placeholder để tạo project mới.
 * (R1-104/R1-105, Batch J)
 *
 * Luồng: gallery 10 template → click 1 template → form điền placeholder
 * (chữ: input; media: chọn file trong kho media hoặc giữ mặc định) →
 * "Tạo project" → store.replaceProject(spec) (1 project mới, không undo
 * xuyên project — giống newProject/loadProject).
 */
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import {
  applyTemplateValues,
  type TemplateDef,
  type TemplatePlaceholder,
} from "../lib/templateEngine";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "../lib/templates";
import { localizeTemplateMeta, localizeTemplatePlaceholders } from "../lib/templateContentLocale";
import { t, useLang } from "../i18n";

/** Nhãn loại placeholder — video/audio giống hệt ở en nên giữ literal. */
function kindLabel(kind: TemplatePlaceholder["kind"]): string {
  if (kind === "image") return t("templatePicker.kindImage");
  if (kind === "text") return t("templatePicker.kindText");
  if (kind === "audio") return "🎵 Audio";
  return "🎞 Video";
}

/** Gợi ý aspect ratio thành nhãn hiển thị. */
function aspectLabel(aspect: string): string {
  if (aspect === "1920:1080") return t("templatePicker.aspect169");
  if (aspect === "1080:1920") return t("templatePicker.aspect916");
  if (aspect === "1080:1080") return t("templatePicker.aspect11");
  return aspect;
}

export function TemplatePicker({ onClose }: { onClose: () => void }) {
  useLang(); // re-render khi đổi ngôn ngữ
  const media = useStore((s) => s.media);
  const replaceProject = useStore((s) => s.replaceProject);
  const checkMissingMedia = useStore((s) => s.checkMissingMedia);

  const [cat, setCat] = useState<string>("all");
  const [selected, setSelected] = useState<TemplateDef | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Đợt 60 Q10 — Escape ĐÓNG HẲN modal ở cả 2 bước (đổi quyết định
  // đợt 59 P2: P2 cho bước 2 quay lại gallery vì đọc nút ← header
  // thành "nút ✕", nhưng ← là điều hướng, không phải nút đóng.
  // Đường đóng thật của bước 2 là nút "Hủy" (common.cancel →
  // onClose()) và click backdrop (cũng onClose()), nên Escape =
  // Hủy = đóng hẳn mới nhất quán. Muốn quay lại gallery thì bấm
  // nút ← bằng chuột (handler còn nguyên). Pattern O1 đợt 58:
  // guard INPUT/TEXTAREA/SELECT, không chặn BUTTON.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(
    () => (cat === "all" ? TEMPLATES : TEMPLATES.filter((d) => d.template.category === cat)),
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
    const res = applyTemplateValues(selected, values, t);
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
    // M7: chỉ tên/mô tả HIỂN THỊ được localize; placeholder label/default
    // và tpl gốc truyền vào apply() giữ nguyên (nội dung project).
    const meta = localizeTemplateMeta(selected);
    // Đợt 57 gộp N5: chỉ nhãn form (label) được localize để HIỂN THỊ;
    // apply() vẫn nhận `selected` gốc nên default/nội dung mẫu giữ VI.
    const displayTpl = localizeTemplatePlaceholders(selected);
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal template-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>🎬 {meta.name}</h3>
            <button className="icon-btn" onClick={() => { setSelected(null); setError(null); }} title={t("templatePicker.backToList")}>
              ←
            </button>
          </div>
          <p className="muted">{meta.description}</p>
          <p className="muted">
            {t("templatePicker.meta", { aspect: aspectLabel(tpl.aspect), duration: String(tpl.durationSec), count: String(tpl.placeholders.length) })}
          </p>

          <div className="template-form">
            {displayTpl.template.placeholders.map((p) => (
              <label key={p.id} className="field">
                <span>
                  {kindLabel(p.kind)} — {p.label}
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
                    <option value="">{t("templatePicker.defaultValue", { value: p.default })}</option>
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
              <button onClick={onClose}>{t("common.cancel")}</button>
              <button className="primary" onClick={() => setConfirming(true)}>
                {t("templatePicker.createFromTemplate")}
              </button>
            </div>
          ) : (
            <div className="confirm-box">
              <p>
                {t("templatePicker.confirmNew", { name: tpl.name })}
              </p>
              <div className="modal-actions">
                <button onClick={() => setConfirming(false)}>{t("templatePicker.back")}</button>
                <button className="primary danger" onClick={apply}>
                  {t("templatePicker.confirmCreate")}
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
          <h3>{t("templatePicker.title", { n: String(TEMPLATES.length) })}</h3>
          <button className="icon-btn" onClick={onClose} title={t("common.close")}>
            ✕
          </button>
        </div>
        <div className="chip-row">
          <button
            className={cat === "all" ? "chip active" : "chip"}
            onClick={() => setCat("all")}
          >
            {t("sticker.allTab")}
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
          {filtered.map((item) => {
            // M7: tên/mô tả gallery được localize để hiển thị; item gốc
            // vẫn truyền vào setSelected (nội dung project giữ nguyên).
            const meta = localizeTemplateMeta(item);
            return (
              <button
                key={item.template.id}
                className="template-card"
                onClick={() => {
                  setSelected(item);
                  setValues({});
                  setError(null);
                  setConfirming(false);
                }}
                title={meta.description}
              >
                <span className="template-aspect">{aspectLabel(item.template.aspect)}</span>
                <span className="template-name">{meta.name}</span>
                <span className="template-desc">{meta.description}</span>
                <span className="template-meta">
                  {t("templatePicker.metaShort", { duration: String(item.template.durationSec), count: String(item.template.placeholders.length) })}
                </span>
              </button>
            );
          })}
        </div>
        <p className="muted">
          {t("templatePicker.credit")} <code>assets/templates/</code>
        </p>
      </div>
    </div>
  );
}
