/**
 * Panel Export: kiểm tra spec hợp lệ (dùng isVideoSpec + kiểm tra sâu),
 * xem trước JSON, tải xuống file .videospec.json hoặc sao chép.
 *
 * Phase P0-01: thêm xuất MP4 thật qua bridge server (server/bridge/).
 * Bridge nhận spec + file media, chạy render worker, trả về MP4.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { VideoSpec } from "@repo-1/video-spec";
import { isVideoSpec, projectDuration, SPEC_VERSION } from "@repo-1/video-spec";
import { buildSharePage, downloadSharePage, SHARE_EMBED_MAX_BYTES } from "./lib/sharePage";
import { useStore } from "./store";
import { fmtTime } from "./lib";
import {
  EXPORT_PRESETS,
  X264_PRESETS,
  defaultCustomPreset,
  estimateSize,
  formatBytes,
  getPreset,
  presetSummary,
  validateExportPreset,
  type ExportPreset,
  type X264Preset,
} from "./lib/exportPresets";

/** Địa chỉ bridge server (có thể đổi qua env khi build). */
const BRIDGE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BRIDGE_URL ||
  "http://127.0.0.1:8787";

type RenderStatus = "idle" | "uploading" | "rendering" | "done" | "error" | "cancelled";

/** 1 điểm trajectory từ reframe.py --analyze-only (tọa độ pixel nguồn). */
interface TrajPoint {
  frame: number;
  t: number;
  x0: number;
  y0: number;
  w: number;
  h: number;
  x_center_norm: number;
}

/** Summary JSON của /api/reframe/analyze (Phase 7 P6). */
interface TrajSummary {
  aspect: string;
  source_size: [number, number];
  duration_sec: number;
  detections: { face: number; motion: number; none: number };
  crop_window: [number, number];
  trajectory: TrajPoint[];
  trajectory_points: number;
}

/** R1-083/R1-085: Auto-reframe — crop video theo chủ thể qua bridge /api/reframe. */
function ReframeSection({ media, bridgeUrl }: { media: import("./media").MediaItem[]; bridgeUrl: string }) {
  const videos = media.filter((m) => m.kind === "video" && m.file);
  const [videoName, setVideoName] = useState<string>(videos[0]?.name ?? "");
  const [aspect, setAspect] = useState<string>("9:16");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  // Phase 7 P6: trajectory preview — xem trước quỹ đạo crop trước khi render.
  const [traj, setTraj] = useState<TrajSummary | null>(null);
  const [trajStatus, setTrajStatus] = useState<"idle" | "working" | "error">("idle");
  const [trajError, setTrajError] = useState<string>("");
  const trajCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const previewTrajectory = async () => {
    const item = videos.find((m) => m.name === videoName);
    if (!item?.file || trajStatus === "working") return;
    setTrajStatus("working");
    setTrajError("");
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("aspect", aspect);
      const res = await fetch(`${bridgeUrl}/api/reframe/analyze`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Bridge trả lỗi ${res.status}`);
      }
      setTraj((await res.json()) as TrajSummary);
      setTrajStatus("idle");
    } catch (e) {
      setTrajStatus("error");
      setTrajError(e instanceof Error ? e.message :
        `Không kết nối được bridge server (${bridgeUrl}).`);
    }
  };

  // Vẽ overlay quỹ đạo: khung nguồn + các crop rect mờ + đường tâm crop.
  useEffect(() => {
    const canvas = trajCanvasRef.current;
    if (!canvas || !traj) return;
    const [W, H] = traj.source_size;
    const cw = 480;
    const ch = Math.max(120, Math.round((480 * H) / W));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (x: number) => (x * cw) / W;
    const sy = (y: number) => (y * ch) / H;
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);
    const pts = traj.trajectory;
    if (pts.length === 0) return;
    // Crop rect mờ (lấy mẫu tối đa 48 rect để không rối).
    const step = Math.max(1, Math.floor(pts.length / 48));
    ctx.fillStyle = "rgba(76, 195, 138, 0.07)";
    ctx.strokeStyle = "rgba(76, 195, 138, 0.35)";
    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      ctx.fillRect(sx(p.x0), sy(p.y0), sx(p.w), sy(p.h));
      ctx.strokeRect(sx(p.x0), sy(p.y0), sx(p.w), sy(p.h));
    }
    // Đường tâm crop (xanh lá) + điểm đầu/cuối.
    ctx.strokeStyle = "#4cc38a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = sx(p.x0 + p.w / 2);
      const y = sy(p.y0 + p.h / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const dot = (p: TrajPoint, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx(p.x0 + p.w / 2), sy(p.y0 + p.h / 2), 5, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(pts[0], "#30a46c");
    dot(pts[pts.length - 1], "#e5484d");
    // Rect đầu/cuối đậm để thấy rõ window bắt đầu/kết thúc ở đâu.
    ctx.strokeStyle = "#30a46c";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx(pts[0].x0), sy(pts[0].y0), sx(pts[0].w), sy(pts[0].h));
    ctx.strokeStyle = "#e5484d";
    ctx.strokeRect(
      sx(pts[pts.length - 1].x0), sy(pts[pts.length - 1].y0),
      sx(pts[pts.length - 1].w), sy(pts[pts.length - 1].h)
    );
  }, [traj]);

  const start = async () => {
    const item = videos.find((m) => m.name === videoName);
    if (!item?.file || status === "working") return;
    setStatus("working");
    setMessage("Đang phân tích chủ thể và crop… (video dài có thể mất vài phút)");
    try {
      const form = new FormData();
      form.append("media", item.file, item.file.name);
      form.append("aspect", aspect);
      const res = await fetch(`${bridgeUrl}/api/reframe`, { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Bridge trả lỗi ${res.status}`);
      }
      const blob = await res.blob();
      const dot = item.name.lastIndexOf(".");
      const base = dot > 0 ? item.name.slice(0, dot) : item.name;
      const outName = `${base}_${aspect.replace(":", "x")}.mp4`;
      const file = new File([blob], outName, { type: "video/mp4" });
      await useStore.getState().importFiles([file]);
      setStatus("done");
      setMessage(`✅ Đã thêm "${outName}" vào kho media — xuất bằng preset TikTok 9:16 để đăng.`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? `❌ ${e.message}` :
        `❌ Không kết nối được bridge server (${bridgeUrl}).`);
    }
  };

  if (videos.length === 0) return null;
  return (
    <div className="reframe-section">
      <div className="panel-head">📱 Auto-reframe theo chủ thể</div>
      <p className="tips">
        Crop video ngang sang dọc/vuông, tự động bám theo khuôn mặt hoặc chuyển động
        (OpenCV local, không cloud). Kết quả được thêm vào kho media.
      </p>
      <div className="preset-row">
        <label htmlFor="reframe-video">Video:</label>
        <select
          id="reframe-video"
          value={videoName}
          onChange={(e) => { setVideoName(e.target.value); setTraj(null); }}
          disabled={status === "working"}
        >
          {videos.map((v) => (
            <option key={v.id} value={v.name}>{v.name}</option>
          ))}
        </select>
        <label htmlFor="reframe-aspect">Tỉ lệ:</label>
        <select
          id="reframe-aspect"
          value={aspect}
          onChange={(e) => { setAspect(e.target.value); setTraj(null); }}
          disabled={status === "working"}
        >
          <option value="9:16">9:16 (TikTok/Reels)</option>
          <option value="1:1">1:1 (Instagram)</option>
          <option value="4:5">4:5 (Facebook)</option>
        </select>
        <button onClick={previewTrajectory} disabled={trajStatus === "working" || !videoName}>
          {trajStatus === "working" ? "⏳ Đang phân tích…" : "👁 Xem trước quỹ đạo"}
        </button>
        <button className="primary" onClick={start} disabled={status === "working" || !videoName}>
          {status === "working" ? "⏳ Đang reframe…" : "🔍 Auto-reframe"}
        </button>
      </div>
      {message && <p className="tips">{message}</p>}
      {trajStatus === "error" && <p className="tips">❌ {trajError}</p>}
      {traj && (
        <div style={{ marginTop: 8 }}>
          <canvas ref={trajCanvasRef} style={{ maxWidth: "100%", borderRadius: 4 }} />
          <p className="tips">
            Khung nguồn {traj.source_size[0]}×{traj.source_size[1]} — window crop{" "}
            {traj.crop_window[0]}×{traj.crop_window[1]} ({traj.aspect}),{" "}
            {traj.trajectory_points} điểm / {traj.duration_sec}s. Đường xanh lá là
            tâm vùng cắt theo thời gian (● bắt đầu → ● kết thúc); các khung mờ
            là vùng cắt tại các thời điểm mẫu. Phát hiện: mặt{" "}
            {traj.detections.face}, chuyển động {traj.detections.motion}, không
            thấy {traj.detections.none} mẫu.
            {traj.crop_window[0] >= traj.source_size[0] &&
              " Nguồn đã hẹp hơn tỉ lệ đích nên window là toàn khung hình — không có quỹ đạo di chuyển để xem."}
          </p>
        </div>
      )}
    </div>
  );
}

/** R1-065: format ETA giây → "1:23" / "1:02:03". */
function fmtEta(sec: number | null): string {
  if (sec == null || !isFinite(sec) || sec < 0) return "…";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return (h > 0 ? `${h}:` : "") + `${mm}:${String(r).padStart(2, "0")}`;
}

/** Kiểm tra sâu hơn isVideoSpec: mọi field số phải hợp lệ, clip phải có src... */
function deepValidate(spec: VideoSpec): string[] {
  const issues: string[] = [];
  const m = spec.meta;
  if (!m.name) issues.push("meta.name đang trống.");
  if (!(m.width > 0) || !(m.height > 0)) issues.push("meta.width/height phải > 0.");
  if (!(m.fps > 0)) issues.push("meta.fps phải > 0.");
  for (const t of spec.tracks) {
    if (!t.id) issues.push("Có track thiếu id.");
    if (!["video", "audio", "text", "sticker", "image"].includes(t.kind)) issues.push(`Track ${t.id}: kind không hợp lệ.`);
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
  const media = useStore((s) => s.media);
  const [copied, setCopied] = useState(false);

  // --- P0-01: state xuất MP4 qua bridge ---
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  // R1-065: ETA (giây, null = chưa đủ dữ liệu) + vị trí hàng đợi
  const [renderEta, setRenderEta] = useState<number | null>(null);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [shareMsg, setShareMsg] = useState<string>("");
  const pollRef = useRef<number | null>(null);

  // --- R1-042: export preset ---
  const [presetId, setPresetId] = useState<string>("1080p");
  const [custom, setCustom] = useState<ExportPreset>(() => defaultCustomPreset());
  // --- Phase 7 P3: normalize loudness (tùy chọn export, áp sau amix) ---
  const [normalize, setNormalize] = useState<"off" | "loudnorm" | "dynaudnorm">("off");
  const [normalizeTarget, setNormalizeTarget] = useState<number>(-14);

  /** Preset đang có hiệu lực (custom lấy từ form tay). */
  const activePreset: ExportPreset =
    presetId === "custom" ? { ...custom, id: "custom" } : getPreset(presetId) ?? getPreset("1080p")!;
  const presetIssues = useMemo(() => validateExportPreset(activePreset), [activePreset]);
  const presetOk = presetIssues.length === 0;

  const setCustomField = <K extends keyof ExportPreset>(key: K, value: ExportPreset[K]) => {
    setCustom((c) => ({ ...c, [key]: value }));
  };

  const { ok, issues, json } = useMemo(() => {
    const list: string[] = [];
    if (!isVideoSpec(spec)) {
      list.push("Spec không đúng định dạng video-spec (sai version hoặc thiếu meta/tracks).");
    } else {
      list.push(...deepValidate(spec));
    }
    return { ok: list.length === 0, issues: list, json: JSON.stringify(spec, null, 2) };
  }, [spec]);

  /** Thu thập các file media mà spec đang dùng (theo clip.src). */
  const collectMediaFiles = async (): Promise<{ files: File[]; missing: string[] }> => {
    const needed = new Set<string>();
    for (const t of spec.tracks)
      for (const c of t.clips)
        if ((c.kind === "video" || c.kind === "audio" || c.kind === "sticker") && c.src)
          needed.add(c.src);
    const files: File[] = [];
    const missing: string[] = [];
    for (const name of needed) {
      const item = media.find((m) => m.name === name);
      if (item?.file) files.push(item.file);
      else missing.push(name);
    }
    // K3: LUT user (`user-...`) dùng trong spec → upload file .cube từ
    // IndexedDB kèm theo với tên dành riêng `__lut_<id>.cube` để render
    // worker resolve từ mediaDir của job.
    const userLutIds = new Set<string>();
    for (const t of spec.tracks)
      for (const c of t.clips) {
        const lut = (c as { filter?: { lut?: string } }).filter?.lut;
        if (typeof lut === "string" && lut.startsWith("user-")) userLutIds.add(lut);
      }
    if (userLutIds.size > 0) {
      const { getUserLut, userLutFileName } = await import("./lib/userLut");
      for (const id of userLutIds) {
        const lut = await getUserLut(id);
        if (!lut) {
          missing.push(`LUT user "${id}" (file .cube chưa lưu trong trình duyệt — nhập lại)`);
          continue;
        }
        files.push(
          new File([lut.text], userLutFileName(id), { type: "text/plain" }),
        );
      }
    }
    return { files, missing };
  };

  const startRender = async () => {
    if (!ok || !presetOk || renderStatus === "uploading" || renderStatus === "rendering") return;
    setRenderError(null);
    setRenderProgress(0);
    setRenderEta(null); // R1-065
    setQueuePos(null);  // R1-065

    const { files, missing } = await collectMediaFiles();
    if (missing.length > 0) {
      setRenderStatus("error");
      setRenderError(`Thiếu file media gốc (cần import lại): ${missing.join(", ")}`);
      return;
    }

    setRenderStatus("uploading");
    try {
      // R1-042: clone spec, override meta theo preset (project gốc không đổi).
      const renderSpec: VideoSpec = {
        ...spec,
        meta: {
          ...spec.meta,
          width: activePreset.width,
          height: activePreset.height,
          fps: activePreset.fps,
        },
      };
      const form = new FormData();
      form.append("spec", JSON.stringify(renderSpec));
      form.append("preset", JSON.stringify({
        crf: activePreset.crf,
        x264Preset: activePreset.x264Preset,
        audioBitrateKbps: activePreset.audioBitrateKbps,
        // Phase 7 P3: normalize export (bridge whitelist kiểm tra lại).
        normalize,
        normalizeTarget,
      }));
      for (const f of files) form.append("media", f, f.name);

      const res = await fetch(`${BRIDGE_URL}/api/render`, { method: "POST", body: form });
      if (res.status === 429) {
        throw new Error("Bridge đang bận (đủ job đồng thời) — thử lại sau.");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Bridge trả lỗi ${res.status}`);
      }
      const { jobId: id } = await res.json();
      setJobId(id);
      setRenderStatus("rendering");
      pollStatus(id);
    } catch (e) {
      setRenderStatus("error");
      setRenderError(
        e instanceof Error ? e.message : "Không kết nối được bridge server. " +
        `Hãy chạy: cd server/bridge && npm start (mặc định ${BRIDGE_URL})`
      );
    }
  };

  const pollStatus = (id: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/render/${id}`);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        setRenderProgress(data.progress ?? 0);
        // R1-065: ETA + vị trí hàng đợi
        setRenderEta(typeof data.etaSeconds === "number" ? data.etaSeconds : null);
        setQueuePos(typeof data.queuePosition === "number" ? data.queuePosition : null);
        if (data.status === "done") {
          stopPolling();
          setRenderStatus("done");
        } else if (data.status === "error") {
          stopPolling();
          setRenderStatus("error");
          setRenderError(data.error || "Render thất bại (không rõ lý do).");
        } else if (data.status === "cancelled") {
          stopPolling();
          setRenderStatus("cancelled");
        }
      } catch {
        // giữ polling, có thể bridge lag tạm thời
      }
    }, 1000); // R1-065: poll mỗi 1s cho tiến trình mượt hơn
  };

  const stopPolling = () => {
    if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
  };

  const cancelRender = async () => {
    stopPolling();
    if (jobId) {
      try { await fetch(`${BRIDGE_URL}/api/render/${jobId}`, { method: "DELETE" }); } catch {}
    }
    setRenderStatus("cancelled");
    setJobId(null);
  };

  const downloadMp4 = () => {
    if (!jobId) return;
    const a = document.createElement("a");
    a.href = `${BRIDGE_URL}/api/render/${jobId}/download`;
    const safe = (spec.meta.name || "project").replace(/[^\w\- ]+/g, "").trim() || "project";
    a.download = `${safe}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  /** Q7: Xuất trang chia sẻ HTML tĩnh từ video vừa render xong. */
  const doExportSharePage = async () => {
    if (!jobId) return;
    setShareStatus("working");
    setShareMsg("Đang tải video đã render để đóng gói trang chia sẻ…");
    try {
      const res = await fetch(`${BRIDGE_URL}/api/render/${jobId}/download`);
      if (!res.ok) throw new Error(`Không tải được video (bridge trả ${res.status}).`);
      const blob = await res.blob();
      const title = spec.meta.name || "Video VCut";
      if (blob.size > SHARE_EMBED_MAX_BYTES) {
        // Video lớn: trang linked + nhắc user tải MP4 đặt cạnh.
        const { html, warnings } = buildSharePage({
          title, spec, videoMime: "video/mp4", videoFileName: "video.mp4",
        });
        downloadSharePage(html, title);
        setShareStatus("done");
        setShareMsg(
          `Video ${(blob.size / 1048576).toFixed(0)}MB nên trang dùng chế độ linked: ` +
            `hãy bấm "Tải xuống MP4", đổi tên thành video.mp4 và đặt cùng thư mục với file HTML. ` +
            warnings.join(" "),
        );
        return;
      }
      const buf = new Uint8Array(await blob.arrayBuffer());
      // btoa theo chunk để không tràn stack với video vài chục MB.
      let binary = "";
      const CHUNK = 0x8000;
      for (let i = 0; i < buf.length; i += CHUNK) {
        binary += String.fromCharCode(...buf.subarray(i, i + CHUNK));
      }
      const { html, warnings } = buildSharePage({
        title, spec, videoMime: "video/mp4", videoBase64: btoa(binary),
      });
      downloadSharePage(html, title);
      setShareStatus("done");
      setShareMsg(
        `Đã xuất trang chia sẻ 1 file (${(blob.size / 1048576).toFixed(1)}MB video nhúng trong HTML). ` +
          warnings.join(" "),
      );
    } catch (e) {
      setShareStatus("error");
      setShareMsg("Không xuất được trang chia sẻ: " + (e as Error).message);
    }
  };

  // Dọn polling khi đóng panel
  const handleClose = () => { stopPolling(); onClose(); };

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
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Xuất video"
      >
        <div className="modal-head">
          <span>⬇ Xuất video</span>
          <button className="icon-btn" onClick={handleClose} title="Đóng" aria-label="Đóng">×</button>
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

        {/* --- P0-01: Xuất MP4 qua bridge --- */}
        <div className="mp4-export">
          <div className="panel-head">🎬 Xuất MP4</div>

          {/* --- R1-042: Export presets --- */}
          <div className="preset-row">
            <label htmlFor="export-preset">Chất lượng:</label>
            <select
              id="export-preset"
              value={presetId}
              onChange={(e) => setPresetId(e.target.value)}
              disabled={renderStatus === "uploading" || renderStatus === "rendering"}
            >
              {EXPORT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          {presetId !== "custom" && (
            <p className="tips preset-desc">
              {activePreset.description} — <code>{presetSummary(activePreset)}</code>
            </p>
          )}
          {presetId === "custom" && (
            <div className="preset-grid">
              <label>Width
                <input type="number" min={16} max={7680} step={2}
                  value={custom.width}
                  onChange={(e) => setCustomField("width", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>Height
                <input type="number" min={16} max={7680} step={2}
                  value={custom.height}
                  onChange={(e) => setCustomField("height", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>FPS
                <input type="number" min={1} max={120}
                  value={custom.fps}
                  onChange={(e) => setCustomField("fps", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>CRF (0=tốt nhất)
                <input type="number" min={0} max={51}
                  value={custom.crf}
                  onChange={(e) => setCustomField("crf", Math.round(Number(e.target.value) || 0))} />
              </label>
              <label>x264 preset
                <select
                  value={custom.x264Preset}
                  onChange={(e) => setCustomField("x264Preset", e.target.value as X264Preset)}
                >
                  {X264_PRESETS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>Audio (kbps)
                <input type="number" min={32} max={512} step={32}
                  value={custom.audioBitrateKbps}
                  onChange={(e) => setCustomField("audioBitrateKbps", Math.round(Number(e.target.value) || 0))} />
              </label>
            </div>
          )}
          {!presetOk && (
            <ul className="issues">
              {presetIssues.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          )}
          {presetOk && (
            <p className="tips preset-desc">
              Sẽ xuất: <code>{presetSummary(activePreset)}</code>
              {presetId !== "custom" || (
                <> — project gốc không đổi, preset chỉ áp lúc render.</>
              )}
            </p>
          )}
          {/* --- R1-064: ước tính dung lượng file xuất --- */}
          {presetOk && ok && (
            <p className="tips preset-desc">
              📦 Dung lượng ước tính: <b>{formatBytes(estimateSize(activePreset, dur))}</b>
              {" "}<span title="Ước tính theo công thức bitrate × thời lượng, file thật có thể chênh lệch theo nội dung video">(ước tính)</span>
            </p>
          )}

          {/* --- Phase 7 P3: Chuẩn hoá âm thanh (normalize) --- */}
          <div className="preset-row">
            <label htmlFor="export-normalize">Chuẩn hoá âm thanh:</label>
            <select
              id="export-normalize"
              value={normalize}
              onChange={(e) => setNormalize(e.target.value as "off" | "loudnorm" | "dynaudnorm")}
              disabled={renderStatus === "uploading" || renderStatus === "rendering"}
            >
              <option value="off">Tắt (giữ nguyên âm lượng)</option>
              <option value="loudnorm">Loudnorm — về target LUFS</option>
              <option value="dynaudnorm">Dynaudnorm — cân bằng động</option>
            </select>
          </div>
          {normalize === "loudnorm" && (
            <div className="preset-row">
              <label htmlFor="export-normalize-target">Target (LUFS):</label>
              <input
                id="export-normalize-target"
                type="number" min={-70} max={0} step={1}
                value={normalizeTarget}
                onChange={(e) => setNormalizeTarget(Number(e.target.value) || -14)}
                disabled={renderStatus === "uploading" || renderStatus === "rendering"}
              />
              <p className="tips preset-desc">
                Chuẩn EBU R128: -14 LUFS, true peak -1.5 dB. Chỉ áp khi có audio;
                project câm thì bỏ qua.
              </p>
            </div>
          )}

          {/* --- R1-083/R1-085: Auto-reframe 9:16 --- */}
          <ReframeSection media={media} bridgeUrl={BRIDGE_URL} />

          {renderStatus === "idle" && (
            <p className="tips">
              Xuất video MP4 thật qua bridge server local
              (<code>{BRIDGE_URL}</code>). Media gốc sẽ được tải lên bridge để render.
            </p>
          )}
          {(renderStatus === "uploading" || renderStatus === "rendering") && (
            <div className="render-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.round(renderProgress * 100)}%` }} />
              </div>
              <div className="progress-label">
                {renderStatus === "uploading" ? "Đang tải media lên..." :
                  queuePos != null && renderProgress <= 0
                    ? `Đang xếp hàng (vị trí #${queuePos})…` // R1-065
                    : `Đang render... ${Math.round(renderProgress * 100)}%` +
                      (renderEta != null && renderProgress > 0
                        ? ` — còn ~${fmtEta(renderEta)}` // R1-065
                        : "")}
              </div>
              <button onClick={cancelRender}>Hủy</button>
            </div>
          )}
          {renderStatus === "done" && (
            <div className="valid-banner ok">
              ✅ Render xong! <button className="primary" onClick={downloadMp4}>⬇ Tải xuống MP4</button>{" "}
              <button onClick={() => void doExportSharePage()} disabled={shareStatus === "working"}>
                🌐 Xuất trang chia sẻ
              </button>
              {shareMsg && (
                <div className={shareStatus === "error" ? "valid-banner bad" : "tips"}>{shareMsg}</div>
              )}
            </div>
          )}
          {renderStatus === "error" && renderError && (
            <div className="valid-banner bad">❌ {renderError}</div>
          )}
          {renderStatus === "cancelled" && (
            <div className="tips">Đã hủy render.</div>
          )}
          {(renderStatus === "idle" || renderStatus === "error" || renderStatus === "cancelled" || renderStatus === "done") && (
            <button
              className="primary"
              onClick={startRender}
              disabled={!ok || !presetOk}
              title={!presetOk ? "Preset chưa hợp lệ" : "Xuất MP4"}
            >
              🎬 Xuất MP4 ({activePreset.width}×{activePreset.height})
            </button>
          )}
        </div>

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
