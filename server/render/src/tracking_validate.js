/**
 * tracking_validate.js — Mirror CJS của packages/video-spec/src/tracking.js
 * (validate) cho render worker (Phase 8 Q5). Giữ đồng bộ với bản gốc:
 * cùng luật: points không rỗng, tối đa 240, t tăng dần, x/y 0..1.
 */
"use strict";

const TRACK_MAX_POINTS = 240;

function isFiniteNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function validateTrackAttachment(v) {
  const errs = [];
  if (v === undefined) return errs;
  if (!v || typeof v !== "object" || Array.isArray(v))
    return [`track phải là object { points: [...] }`];
  if (!Array.isArray(v.points) || v.points.length === 0)
    return [`track.points phải là mảng không rỗng`];
  if (v.points.length > TRACK_MAX_POINTS)
    errs.push(`track.points tối đa ${TRACK_MAX_POINTS} điểm, nhận được ${v.points.length}`);
  let prevT = -Infinity;
  v.points.forEach((p, i) => {
    if (!p || typeof p !== "object") {
      errs.push(`track.points[${i}] phải là object`);
      return;
    }
    if (!isFiniteNum(p.t) || p.t < 0) errs.push(`track.points[${i}].t phải là số >= 0`);
    if (!isFiniteNum(p.x) || p.x < 0 || p.x > 1) errs.push(`track.points[${i}].x phải là số 0..1`);
    if (!isFiniteNum(p.y) || p.y < 0 || p.y > 1) errs.push(`track.points[${i}].y phải là số 0..1`);
    if (p.score !== undefined && (!isFiniteNum(p.score) || p.score < 0 || p.score > 1))
      errs.push(`track.points[${i}].score phải là số 0..1`);
    if (isFiniteNum(p.t)) {
      if (p.t <= prevT && i > 0) errs.push(`track.points[${i}].t phải tăng dần (điểm trước ${prevT})`);
      prevT = p.t;
    }
  });
  return errs;
}

module.exports = { TRACK_MAX_POINTS, validateTrackAttachment };
