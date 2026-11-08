/**
 * gpuProbe.js — Trạng thái + probe lại GPU encoder cho bridge (Phase 9 đợt 65,
 * luồng S4 — đóng nợ đợt 64 R1 §1/§8.4 + §1 R1).
 *
 * Bối cảnh: render worker cache kết quả probe GPU xuống đĩa
 * (~/.cache/vcut/gpu-probe.json, TTL 30 ngày, xem server/render/src/gpuencode.js).
 * Nếu GPU bị tháo trong TTL, cache vẫn nói encoder GPU còn đó → render
 * worker encode GPU fail → đợt 65 S4 đã thêm fallback libx264 + xoá cache
 * lỗi ở bước encode chính (server/render/src/render.js bước 7). Module này
 * là mặt còn lại: cho web UI (nút "Probe lại GPU" trong ExportPanel) đọc
 * trạng thái cache hiện tại và ép probe lại thủ công, không cần chờ render
 * fail mới biết GPU đã mất.
 *
 * Hai hàm, tách ra để test đơn vị không cần khởi động bridge:
 *   - getGpuProbeStatus(ffmpeg): CHỈ ĐỌC cache đĩa, KHÔNG probe (nhanh, ~ms).
 *     Chưa từng probe → { probed: false, encoder: null }.
 *   - reprobeGpu(ffmpeg): xoá cache lỗi + probe lại THẬT (encode thử 1 frame
 *     từng encoder, tối đa ~15s/encoder — đồng bộ, chặn event loop; chỉ gọi
 *     từ nút bấm thủ công, không gọi trên đường render nóng).
 *
 * Cả hai đều không bao giờ throw vì lỗi cache/probe — lỗi trả về trong
 * payload để UI hiển thị, không làm sập request.
 */
"use strict";

const {
  clearGpuProbeCache,
  getGpuProbeCachePath,
  gpuProbeCacheEnabled,
  probeGpuEncoderCached,
  readGpuProbeCache,
} = require("../../render/src/gpuencode");

/**
 * Trạng thái probe GPU hiện tại (chỉ đọc cache đĩa, không probe).
 * @param {string} ffmpeg đường dẫn ffmpeg (mặc định "ffmpeg")
 * @param {object} [opts] { cachePath? } — chỉ test dùng
 * @returns {{ probed: boolean, encoder: string|null, detail: string,
 *   cached: boolean, source: string|null, probedAtMs: number|null,
 *   cacheEnabled: boolean }}
 */
function getGpuProbeStatus(ffmpeg, opts) {
  const o = opts || {};
  const cacheEnabled = gpuProbeCacheEnabled();
  if (!cacheEnabled) {
    return {
      probed: false, encoder: null,
      detail: "cache probe GPU đang tắt (VCUT_GPU_PROBE_CACHE=0) — render nào cũng probe lại",
      cached: false, source: null, probedAtMs: null, cacheEnabled: false,
    };
  }
  const cachePath = o.cachePath || getGpuProbeCachePath();
  let hit = null;
  try {
    hit = readGpuProbeCache(cachePath, ffmpeg || "ffmpeg");
  } catch {
    hit = null;
  }
  if (!hit) {
    return {
      probed: false, encoder: null,
      detail: "chưa probe GPU trên máy này (hoặc cache đã hết hạn / ffmpeg đã đổi)",
      cached: false, source: null, probedAtMs: null, cacheEnabled: true,
    };
  }
  return {
    probed: true,
    encoder: hit.encoder,
    detail: hit.detail,
    cached: true,
    source: "disk",
    probedAtMs: hit.probedAtMs,
    cacheEnabled: true,
  };
}

/**
 * Ép probe lại GPU: xoá cache cũ (kể cả cache lỗi) rồi probe thật.
 * @param {string} ffmpeg đường dẫn ffmpeg (mặc định "ffmpeg")
 * @param {object} [opts] { cachePath? } — chỉ test dùng
 * @returns {{ encoder: string|null, tried: string[], detail: string,
 *   cached: boolean, source: "probe", cacheCleared: boolean,
 *   probedAtMs: number }}
 */
function reprobeGpu(ffmpeg, opts) {
  const o = opts || {};
  const cachePath = o.cachePath || getGpuProbeCachePath();
  let cleared = false;
  try {
    cleared = clearGpuProbeCache(cachePath);
  } catch {
    cleared = false;
  }
  const res = probeGpuEncoderCached(ffmpeg || "ffmpeg", {
    forceReprobe: true,
    cachePath,
  });
  return {
    encoder: res.encoder,
    tried: res.tried,
    detail: res.detail,
    cached: false,
    source: "probe",
    cacheCleared: cleared,
    probedAtMs: Date.now(),
  };
}

module.exports = { getGpuProbeStatus, reprobeGpu };
