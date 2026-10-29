/**
 * AdjustmentLayerPanel — Panel tạo/quản lý adjustment layer trên Timeline.
 *
 * PHẠM VI N4 + R5 + R7 (UI only): panel chỉ gọi store action nên mọi thao
 * tác đều đi qua execCommand → undo/redo hoạt động. Filter chọn từ
 * EFFECT_TYPES — toàn bộ là filter FFmpeg native đã có thật trong repo
 * (xem packages/video-spec/src/effects.ts).
 *
 * R7 (thống nhất ngữ nghĩa, xem nestUtils §R7 + R7_UI_LIMITS.md):
 * - Layer MỚI chỉ ghi vào `spec.adjustmentLayers` (chuẩn cấp project) qua
 *   store.addSpecAdjustmentLayer — KHÔNG tạo thêm bản ghi kind:"adjustment"
 *   trong track.clips nữa. Layer chuẩn được phép chồng nhau (spec nối
 *   filter tuần tự), khác luật legacy cũ cấm đè.
 * - Layer LEGACY cũ vẫn hiển thị riêng (badge "legacy"), vẫn sửa/xoá/kéo
 *   được như trước qua hàng FX, và chuyển sang chuẩn được bằng 1 nút
 *   (convert giữ nguyên filter/intensity/thời gian, gỡ clip legacy).
 * - SCOPE (parent tích hợp đợt 7): chọn "Một track" ghi thật field
 *   `tracks` của AdjustmentLayer (U1 thêm field này sau khi U4 viết panel),
 *   render (U2) và preview (U3) đều tôn trọng scope đó.
 * - Layer chuẩn phức tạp (LUT/color/nhiều effect — ví dụ project mở từ
 *   nơi khác) vẫn hiển thị + sửa được thời gian, chỉ không sửa được
 *   filter từ panel này.
 * - HẠN CHẾ HIỂN THỊ (trung thực): layer chuẩn CHƯA vẽ trên hàng FX của
 *   Timeline (Timeline.tsx không sửa trong R7 để tránh đụng luồng khác)
 *   và preview hiện chỉ đọc layer dạng clip/track (duck-typed), chưa đọc
 *   spec.adjustmentLayers — panel là mặt quản lý duy nhất của layer chuẩn
 *   cho tới khi 2 luồng đó nối (xem R7_UI_LIMITS.md §3).
 */
import { useState } from "react";
import { useStore } from "../../store";
import { t as i18nT, useLang } from "../../i18n";
import {
  listUnifiedAdjustmentLayers,
  type UnifiedAdjustmentLayer,
} from "./nestUtils";
import type { AdjustmentLayer } from "@repo-1/video-spec";
import { fmtTime } from "../../lib";
import {
  EFFECT_META,
  EFFECT_TYPES,
} from "../../../../../packages/video-spec/src/effects";
import "./nested.css";

/** Editor thời gian (+ filter đơn) cho 1 layer chuẩn spec (1 bước undo). */
function SpecLayerEditor({
  layer,
  legacy,
  complex,
  onMsg,
}: {
  layer: AdjustmentLayer;
  legacy: UnifiedAdjustmentLayer["legacyLayer"];
  complex: boolean;
  onMsg: (msg: string) => void;
}) {
  const [start, setStart] = useState(layer.start);
  const [duration, setDuration] = useState(layer.duration);
  const [filterType, setFilterType] = useState<string>(legacy?.filterType ?? EFFECT_TYPES[0]);
  const [intensity, setIntensity] = useState(legacy?.intensity ?? 0.5);

  const save = () => {
    const ok = useStore.getState().updateSpecAdjustmentLayer(layer.id, {
      start,
      duration,
      ...(complex ? {} : { filterType, intensity }),
    });
    onMsg(ok ? i18nT("adjustment.specSaveOk") : i18nT("adjustment.specSaveFail"));
  };

  return (
    <div>
      <div className="nested-panel-row">
        <label>
          {i18nT("adjustment.editStart")}{" "}
          <input
            type="number"
            min={0}
            step={0.1}
            value={start}
            aria-label={i18nT("adjustment.editStart")}
            onChange={(e) => setStart(Number(e.target.value))}
          />
        </label>
        <label>
          {i18nT("adjustment.editDuration")}{" "}
          <input
            type="number"
            min={0.2}
            step={0.1}
            value={duration}
            aria-label={i18nT("adjustment.editDuration")}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
        <button onClick={save}>{i18nT("adjustment.save")}</button>
      </div>
      {!complex && (
        <div className="nested-panel-row">
          <label>
            {i18nT("adjustment.filterLabel")}{" "}
            <select
              value={filterType}
              aria-label={i18nT("adjustment.filterAria")}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {EFFECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EFFECT_META[t].label} ({t})
                </option>
              ))}
            </select>
          </label>
          <label>
            {i18nT("adjustment.intensity", { n: String(Math.round(intensity * 100)) })}{" "}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={intensity}
              aria-label={i18nT("adjustment.intensityAria")}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function AdjustmentLayerPanel({ onClose }: { onClose: () => void }) {
  useLang();
  const spec = useStore((s) => s.spec);
  const playhead = useStore((s) => s.playhead);
  const [filterType, setFilterType] = useState<string>(EFFECT_TYPES[0]);
  const [intensity, setIntensity] = useState(0.5);
  const [start, setStart] = useState(() => Math.round(playhead * 100) / 100);
  const [duration, setDuration] = useState(3);
  const [scope, setScope] = useState<"all" | "single">("all");
  const [scopeTrackIndex, setScopeTrackIndex] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const unified = listUnifiedAdjustmentLayers(spec);
  const specLayers = unified.filter((u) => u.origin === "spec");
  const legacyLayers = unified.filter((u) => u.origin === "legacy");
  const videoTrackIndices = spec.tracks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.kind === "video");
  const hasVideoTrack = videoTrackIndices.length > 0;
  const doAdd = () => {
    const st = useStore.getState();
    const ok = st.addSpecAdjustmentLayer(
      filterType,
      intensity,
      start,
      duration,
      scope === "all" ? "all" : { trackIndices: [scopeTrackIndex] },
    );
    setMsg(ok ? i18nT("adjustment.addOk") : i18nT("adjustment.specAddFail"));
  };

  return (
    <div className="nested-panel" role="region" aria-label="Adjustment layer">
      <div className="nested-panel-head">
        <strong>{i18nT("adjustment.title")}</strong>
        <button onClick={onClose} aria-label={i18nT("adjustment.closeAria")}>×</button>
      </div>
      <p className="nested-panel-note">{i18nT("adjustment.note")}</p>
      <p className="nested-panel-note">{i18nT("adjustment.specNote")}</p>

      {!hasVideoTrack && (
        <p className="nested-panel-warn">{i18nT("adjustment.noVideoTrack")}</p>
      )}

      <div className="nested-panel-section">
        <div className="nested-panel-row">
          <label>
            {i18nT("adjustment.filterLabel")}{" "}
            <select
              value={filterType}
              aria-label={i18nT("adjustment.filterAria")}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {EFFECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EFFECT_META[t].label} ({t})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="nested-panel-row">
          <label>
            {i18nT("adjustment.intensity", { n: String(Math.round(intensity * 100)) })}{" "}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={intensity}
              aria-label={i18nT("adjustment.intensityAria")}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="nested-panel-row">
          <label>
            {i18nT("adjustment.startLabel")}{" "}
            <input
              type="number"
              min={0}
              step={0.1}
              value={start}
              aria-label={i18nT("adjustment.startAria")}
              onChange={(e) => setStart(Number(e.target.value))}
            />
          </label>
          <label>
            {i18nT("adjustment.durationLabel")}{" "}
            <input
              type="number"
              min={0.2}
              step={0.1}
              value={duration}
              aria-label={i18nT("adjustment.durationAria")}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="nested-panel-row">
          <span>{i18nT("adjustment.scopeLabel")}:</span>
          <label>
            <input
              type="radio"
              name="adj-scope"
              checked={scope === "all"}
              onChange={() => setScope("all")}
            />{" "}
            {i18nT("adjustment.scopeAll")}
          </label>
          <label>
            <input
              type="radio"
              name="adj-scope"
              checked={scope === "single"}
              onChange={() => setScope("single")}
            />{" "}
            {i18nT("adjustment.scopeSingle")}
          </label>
          {scope === "single" && (
            <select
              value={scopeTrackIndex}
              aria-label={i18nT("adjustment.trackSelectAria")}
              onChange={(e) => setScopeTrackIndex(Number(e.target.value))}
            >
              {videoTrackIndices.map(({ t, i }) => (
                <option key={t.id} value={i}>
                  {t.label ?? t.kind}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="nested-panel-row">
          <button disabled={!hasVideoTrack} onClick={doAdd}>
            {i18nT("adjustment.addButton")}
          </button>
        </div>
        <p className="nested-panel-note">
          {EFFECT_META[filterType as keyof typeof EFFECT_META]?.description ?? ""}
        </p>
      </div>

      <div className="nested-panel-section">
        <strong>{i18nT("adjustment.specListTitle", { n: String(specLayers.length) })}</strong>
        {specLayers.length === 0 && (
          <p className="nested-panel-note">{i18nT("adjustment.emptyList")}</p>
        )}
        {specLayers.map((u) => (
          <div key={u.id} className="nested-item">
            <div className="nested-panel-row">
              <span className="nested-item-name">
                🎛{" "}
                {u.complex
                  ? u.filterLabel
                  : (EFFECT_META[u.filterLabel as keyof typeof EFFECT_META]?.label ?? u.filterLabel)}
              </span>
              <span className="nested-item-time">
                {fmtTime(u.start)} → {fmtTime(u.start + u.duration)}
                {u.intensity !== null && ` · ${Math.round(u.intensity * 100)}%`}
              </span>
            </div>
            {u.complex && (
              <p className="nested-panel-note">{i18nT("adjustment.complexFilter")}</p>
            )}
            <div className="nested-panel-row">
              <button
                onClick={() => {
                  useStore.getState().deleteSpecAdjustmentLayer(u.id);
                  setMsg(i18nT("adjustment.deleteOk"));
                }}
              >
                {i18nT("adjustment.deleteButton")}
              </button>
            </div>
            {u.specLayer && (
              <SpecLayerEditor
                key={`${u.id}:${u.start}:${u.duration}:${u.filterLabel}:${u.intensity ?? ""}`}
                layer={u.specLayer}
                legacy={u.legacyLayer}
                complex={u.complex}
                onMsg={setMsg}
              />
            )}
          </div>
        ))}
      </div>

      <div className="nested-panel-section">
        <strong>{i18nT("adjustment.legacyListTitle", { n: String(legacyLayers.length) })}</strong>
        {legacyLayers.length === 0 && (
          <p className="nested-panel-note">{i18nT("adjustment.emptyList")}</p>
        )}
        {legacyLayers.map((u) => (
          <div key={u.id} className="nested-item">
            <div className="nested-panel-row">
              <span className="nested-item-name">
                🎛 {EFFECT_META[u.filterLabel as keyof typeof EFFECT_META]?.label ?? u.filterLabel}
              </span>
              <span className="nested-legacy-badge">{i18nT("adjustment.legacyBadge")}</span>
              <span className="nested-item-time">
                {fmtTime(u.start)} → {fmtTime(u.start + u.duration)}
                {u.intensity !== null && ` · ${Math.round(u.intensity * 100)}%`}
              </span>
            </div>
            <div className="nested-panel-row">
              <button
                onClick={() => {
                  if (u.legacyHostTrackId) {
                    useStore.getState().select({ trackId: u.legacyHostTrackId, clipId: u.id });
                  }
                }}
              >
                {i18nT("adjustment.selectOnTimeline")}
              </button>
              <button
                onClick={() => {
                  if (!u.legacyHostTrackId) return;
                  const ok = useStore.getState().convertLegacyLayerToSpec(u.legacyHostTrackId, u.id);
                  setMsg(ok ? i18nT("adjustment.convertOk") : i18nT("adjustment.convertFail"));
                }}
              >
                {i18nT("adjustment.convertButton")}
              </button>
              <button
                onClick={() => {
                  if (!u.legacyHostTrackId) return;
                  useStore.getState().deleteAdjustmentLayer(u.legacyHostTrackId, u.id);
                  setMsg(i18nT("adjustment.deleteOk"));
                }}
              >
                {i18nT("adjustment.deleteButton")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="nested-panel-msg">{msg}</p>}
    </div>
  );
}
