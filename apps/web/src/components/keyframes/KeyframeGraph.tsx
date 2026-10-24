/**
 * KeyframeGraph — đồ thị đường cong keyframe dạng SVG (Phase 7 P4).
 *
 * Hiển thị giá trị của property đang chọn theo thời gian, lấy mẫu qua
 * interpolateKeyframes (cùng easing với render/preview) nên đường cong
 * thấy trên đồ thị là đường cong thật sẽ render.
 *
 * Tương tác:
 * - Kéo-thả điểm trên đồ thị: đổi CẢ thời điểm (ngang) và giá trị (dọc).
 *   Kéo qua điểm khác có thể gộp điểm (normalizeKeyframes: trùng t thì
 *   keyframe sau thắng) — giống hành vi kéo diamond trên lane.
 * - Nhấp đúp vào nền đồ thị: thêm keyframe tại thời điểm đó.
 * - Nhấp vào điểm: chọn điểm đó (đồng bộ với editor số bên dưới).
 */
import { useRef, useState } from "react";
import {
  PROP_META,
  formatPropValue,
  interpolateKeyframes,
  type AnimatableProp,
  type Keyframe,
} from "@repo-1/video-spec";
import "./keyframes.css";

const W = 400;
const H = 160;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 20;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

export function KeyframeGraph({
  prop,
  kfs,
  duration,
  localT,
  selectedIdx,
  onSelect,
  onMovePoint,
  onAddAt,
}: {
  prop: AnimatableProp;
  kfs: Keyframe[];
  duration: number;
  localT: number;
  selectedIdx: number;
  onSelect: (i: number) => void;
  onMovePoint: (i: number, patch: { t: number; v: number }) => void;
  onAddAt: (t: number) => void;
}) {
  const meta = PROP_META[prop];
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragIdx, setDragIdx] = useState(-1);

  const x = (t: number) => PAD_L + (duration > 0 ? (t / duration) * PLOT_W : 0);
  const y = (v: number) =>
    PAD_T + (1 - (v - meta.min) / (meta.max - meta.min)) * PLOT_H;
  const toTime = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const sx = ((clientX - rect.left) / rect.width) * W;
    return Math.max(0, Math.min(duration, ((sx - PAD_L) / PLOT_W) * duration));
  };
  const toValue = (clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return meta.def;
    const sy = ((clientY - rect.top) / rect.height) * H;
    const v = meta.min + (1 - (sy - PAD_T) / PLOT_H) * (meta.max - meta.min);
    return Math.max(meta.min, Math.min(meta.max, v));
  };

  // Đường cong: lấy mẫu ~80 điểm qua interpolateKeyframes (kèm easing).
  let path = "";
  if (kfs.length > 0 && duration > 0) {
    const pts: string[] = [];
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * duration;
      let v: number;
      try {
        v = interpolateKeyframes(kfs, t);
      } catch {
        v = meta.def;
      }
      pts.push(`${x(t).toFixed(1)},${y(v).toFixed(1)}`);
    }
    path = `M ${pts.join(" L ")}`;
  }

  const onPointDown = (e: React.PointerEvent, i: number) => {
    e.stopPropagation();
    (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
    onSelect(i);
    setDragIdx(i);
  };
  const onPointMove = (e: React.PointerEvent, i: number) => {
    if (dragIdx !== i) return;
    onMovePoint(i, { t: toTime(e.clientX), v: toValue(e.clientY) });
  };
  const onPointUp = () => setDragIdx(-1);

  const playheadX = x(Math.max(0, Math.min(duration, localT)));

  return (
    <div className="kf-graph-wrap">
      <div className="kf-graph-head">
        <span>
          📈 Đồ thị {meta.label.toLowerCase()} ({kfs.length} điểm)
        </span>
        <span className="kf-graph-hint">Kéo điểm để đổi thời gian + giá trị · Nhấp đúp để thêm điểm</span>
      </div>
      <svg
        ref={svgRef}
        className="kf-graph"
        viewBox={`0 0 ${W} ${H}`}
        onDoubleClick={(e) => onAddAt(toTime(e.clientX))}
      >
        {/* Lưới ngang: min / giữa / max */}
        {[0, 0.5, 1].map((f) => {
          const v = meta.min + f * (meta.max - meta.min);
          const yy = y(v);
          return (
            <g key={f}>
              <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} className="kf-graph-grid" />
              <text x={PAD_L + 2} y={yy - 3} className="kf-graph-axis">
                {formatPropValue(prop, v)}
              </text>
            </g>
          );
        })}
        {/* Đường cong */}
        {path && <path d={path} className="kf-graph-curve" fill="none" />}
        {/* Playhead */}
        <line x1={playheadX} y1={PAD_T} x2={playheadX} y2={H - PAD_B} className="kf-graph-playhead" />
        {/* Nhãn trục thời gian */}
        <text x={PAD_L} y={H - 5} className="kf-graph-axis">0s</text>
        <text x={W - PAD_R} y={H - 5} className="kf-graph-axis" textAnchor="end">
          {duration.toFixed(1)}s
        </text>
        {/* Điểm keyframe */}
        {kfs.map((k, i) => (
          <circle
            key={`${k.t}-${i}`}
            cx={x(k.t)}
            cy={y(k.v)}
            r={i === selectedIdx ? 7 : 5.5}
            className={"kf-graph-point" + (i === selectedIdx ? " sel" : "")}
            onPointerDown={(e) => onPointDown(e, i)}
            onPointerMove={(e) => onPointMove(e, i)}
            onPointerUp={onPointUp}
            onPointerCancel={onPointUp}
          >
            <title>{`t=${k.t.toFixed(2)}s, v=${formatPropValue(prop, k.v)}`}</title>
          </circle>
        ))}
      </svg>
      {kfs.length === 0 && (
        <p className="kf-graph-empty">Chưa có keyframe — nhấp đúp vào đồ thị (hoặc nút +) để thêm điểm.</p>
      )}
    </div>
  );
}
