// Probe per-seek cho harness N2 — Phase 9 đợt 39, luồng T2;
// v2: Phase 9 đợt 40, luồng V6 (xem docs/PHASE9_ROUND40_V6_CPU_PERSEEK_LIMITS.md).
//
// Hiện thực hoá thiết kế docs/PHASE9_ROUND38_U6_SOLO_RUNNER_LIMITS.md §3.3
// (CHƯA từng được cài trước đợt này). File này CHỈ ĐO, không sửa logic
// sản phẩm, không sửa preview.tsx: nó chạy trong trang đo qua
// Runtime.evaluate của harness N2, chặn setter currentTime ở prototype
// (pool video của MediaPool tạo element tách khỏi DOM nên querySelector
// không tìm được chúng — chặn prototype là cách duy nhất bắt mọi seek).
//
// Cách dùng (từ harness, không gọi tay trong app thật):
//   1. evaluate nội dung file này  -> window.__n2PerSeek được định nghĩa,
//      CHƯA chặn gì (đường đo mặc định không đổi).
//   2. window.__n2PerSeek.install({ fps: 30 }) -> bắt đầu chặn setter +
//      vòng rAF riêng của probe.
//   3. window.__n2PerSeek.mark("forward" | "reverse" | "idle" | "ready")
//      để gắn nhãn phase cho mỗi seek (phân tích chỉ lấy phase reverse).
//   4. window.__n2PerSeek.read() -> { version, entries, marks,
//      droppedOverflow, counts } (read là cuối phiên: flush các seek
//      chưa xong thành unresolved/seeked-no-draw, dừng vòng rAF).
//   5. window.__n2PerSeek.setEnabled(false|true) -> tạm dừng / tiếp tục
//      ghi trong một phiên đã install (khi tắt, setter wrapper chỉ còn
//      một lần kiểm tra cờ rồi gọi setter gốc — không ghi, không rAF).
//
// v2 bổ sung (mặc định TẮT như v1 — harness vẫn chỉ evaluate khi
// N2_PERSEEK=1; 17 trường spec §3.3 giữ nguyên tên + ngữ nghĩa):
// - elementId: số nguyên gán theo element (WeakMap, element đầu tiên
//   thấy = 0, cùng element giữ nguyên id qua các seek). Đóng gap T2
//   §4.3: hai entry không supersede nhau mà khác elementId thì là hai
//   element khác nhau, không phải seek bị bỏ.
// - decodedSamplesWhileSeeking: mỗi tick rAF TRONG lúc seeking=true
//   (tức trước khi seeked chốt) ghi một mẫu { tMs, decoded, dropped }
//   với tMs = performance.now() tuyệt đối. Đóng gap T2 §4.2: v1 chỉ
//   biết decoded tăng bao nhiêu từ lúc gán tới lúc seeked, không biết
//   decode tiến triển hay đứng yên TRONG lúc chờ — v2 tách được
//   seek-scheduling (decoded tăng đều trong lúc seeking) khỏi decode
//   stall (decoded đứng yên suốt lúc seeking rồi mới tăng sau seeked).
//   Tối đa maxSeekingSamples mẫu/entry (mặc định 1000, ~16 s ở 60 fps);
//   vượt thì đếm vào droppedSeekingSamples, không tràn bộ nhớ trang.
// - Lúc read() flush: entry chưa xong được ghi thêm flushElementSrc
//   (currentSrc || src) + flushElementReadyState để đối chiếu entry
//   unresolved thuộc element nào (ví dụ thumbnail bị gỡ src).
// v2 KHÔNG đổi mechanismLabel (xem per-seek-probe.mjs): mẫu trong lúc
// seeking là bằng chứng thô cho analyzeSeekingSamples, không làm lệch
// nhãn cũ — phân tích cơ chế từ v1 vẫn tái tạo được từ dữ liệu v2.
//
// Định nghĩa vận hành (trung thực — §3.3 thiếu các điểm này, xem LIMITS
// T2 §2; mọi điểm dưới đây đều được ghi rõ để không mạo nhận):
// - "Một seek" = một lần gán el.currentTime trong lúc probe bật. Pacing
//   L2 của syncMedia cấm seek chồng, nhưng scrub/seek khác vẫn có thể
//   gán đè: seek cũ chưa xong bị chốt status "superseded" (chưa seeked)
//   hoặc "seeked-no-draw" (đã seeked nhưng chưa có draw) thay vì bị ghi
//   đè lặng lẽ.
// - seekRequestedAtMs = performance.now() lúc wrapper setter chạy (trước
//   khi gọi setter gốc). currentTimeAtSeek = currentTime trước khi gán.
// - seekedAtMs: ƯU TIÊN timestamp của sự kiện "seeked" thật (listener gắn
//   một lần cho mỗi element khi nó bị gán lần đầu). Nếu sự kiện không tới
//   mà rAF thấy seeking=false và currentTime đã tới target (sai số
//   0.5/fps) thì chốt bằng rAF, seekedEvent=false — lúc đó seekLatency
//   mang thêm tối đa ~1 khoảng rAF sai số quan sát, ghi rõ trong entry.
// - firstDrawAfterSeekAtMs: tick rAF ĐẦU TIÊN sau seeked mà element đủ
//   điều kiện vẽ (readyState>=2 và currentTime vẫn ở frame đã seeked,
//   sai số 0.5/fps). Đây là "đủ điều kiện vẽ", KHÔNG phải bằng chứng
//   canvas drawImage đã chạy cho element đó — harness không nhìn được
//   drawVideoClip trong preview.tsx. firstDrawBasis ghi rõ "raf-eligible".
//   Vì vậy drawLatencyMs đo "seeked -> đủ điều kiện vẽ", và trường mở
//   rộng firstDecodedAfterSeekAtMs (tick rAF đầu tiên mà totalVideoFrames
//   tăng sau seeked) mới là tín hiệu tách decode khỏi presentation:
//   decode stall = draw trễ mà decoded đứng yên; presentation = decoded
//   đã tăng prompt mà draw-eligible vẫn trễ (xem per-seek-probe.mjs).
// - rafTicksWhileWaiting = số tick rAF của probe từ lúc requested tới
//   lúc firstDraw (dừng đếm khi entry chốt, đúng §3.3).
// - holdCountAtSeek / holdCountAtFirstDraw đọc window.__vcutHoldStats.hold
//   — đây là BỘ ĐẾM TOÀN CỤC của preview, không phải theo element.
//   Trong phiên N2 một clip thì delta giữa các seek vẫn nối được với
//   drawDelta hiện có; phiên nhiều clip thì không được đọc hold theo
//   element từ hai trường này.
// - Đường WebCodecs reverse KHÔNG gán currentTime nên probe này không
//   thấy seek nào của nó — entries rỗng trên đường đó là đúng, không
//   phải lỗi probe (xem LIMITS T2 §5).
// - Giới hạn: tối đa maxEntries entry (mặc định 5000); vượt thì bỏ seek
//   mới và tăng droppedOverflow, không bao giờ làm tràn bộ nhớ trang đo.
(() => {
  if (window.__n2PerSeek) return "already";
  const VERSION = "per-seek-v2";
  const DEFAULT_FPS = 30;
  const DEFAULT_MAX_ENTRIES = 5000;
  const DEFAULT_MAX_SEEKING_SAMPLES = 1000;

  function qualityOf(el) {
    try {
      if (typeof el.getVideoPlaybackQuality === "function") {
        const q = el.getVideoPlaybackQuality();
        return {
          decoded: typeof q.totalVideoFrames === "number" ? q.totalVideoFrames : null,
          dropped: typeof q.droppedVideoFrames === "number" ? q.droppedVideoFrames : null,
        };
      }
    } catch (e) { /* rơi xuống fallback bên dưới */ }
    return {
      decoded: typeof el.webkitDecodedFrameCount === "number" ? el.webkitDecodedFrameCount : null,
      dropped: typeof el.webkitDroppedFrameCount === "number" ? el.webkitDroppedFrameCount : null,
    };
  }
  function holdCount() {
    try {
      const h = window.__vcutHoldStats && window.__vcutHoldStats.hold;
      return typeof h === "number" ? h : null;
    } catch (e) { return null; }
  }

  const probe = {
    version: VERSION,
    enabled: false,
    installed: false,
    fps: DEFAULT_FPS,
    maxEntries: DEFAULT_MAX_ENTRIES,
    maxSeekingSamples: DEFAULT_MAX_SEEKING_SAMPLES,
    entries: [],
    marks: [],
    currentPhase: "ready",
    droppedOverflow: 0,
    _pendingByEl: new WeakMap(),
    _elementIds: new WeakMap(),
    _nextElementId: 0,
    _pendings: [],
    _listened: new WeakSet(),
    _rafId: null,
    _rafStopped: true,
    _readDone: false,
    _origSetter: null,
    _origDescriptor: null,
  };

  function tol() { return 0.5 / (probe.fps > 0 ? probe.fps : DEFAULT_FPS); }
  function near(a, b) { return typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= tol(); }

  function finalize(entry, status) {
    entry.status = status;
    if (entry.seekedAtMs !== null && entry.firstDrawAfterSeekAtMs !== null) {
      entry.drawLatencyMs = entry.firstDrawAfterSeekAtMs - entry.seekedAtMs;
    } else {
      entry.drawLatencyMs = null;
    }
    if (entry.seekedAtMs !== null) {
      entry.seekLatencyMs = entry.seekedAtMs - entry.seekRequestedAtMs;
    } else {
      entry.seekLatencyMs = null;
    }
    entry.decodedDeltaToFirstDraw = (entry.decodedFramesAtFirstDraw !== null && entry.decodedFramesAtSeeked !== null)
      ? entry.decodedFramesAtFirstDraw - entry.decodedFramesAtSeeked : null;
    const i = probe._pendings.indexOf(entry);
    if (i >= 0) probe._pendings.splice(i, 1);
    try { probe._pendingByEl.delete(entry._el); } catch (e) { /* WeakMap delete không throw thực tế */ }
    delete entry._el;
    return entry;
  }

  function onSeekedFor(el) {
    return function onSeeked() {
      try {
        const entry = probe._pendingByEl.get(el);
        if (!entry || entry.seekedAtMs !== null) return;
        const now = performance.now();
        const q = qualityOf(el);
        entry.seekedAtMs = now;
        entry.seekedEvent = true;
        entry.currentTimeAtSeeked = el.currentTime;
        entry.decodedFramesAtSeeked = q.decoded;
        entry.droppedFramesAtSeeked = q.dropped;
        entry.seekingSeen = true;
      } catch (e) { /* probe không bao giờ được phá playback */ }
    };
  }

  function ensureListener(el) {
    try {
      if (probe._listened.has(el)) return;
      probe._listened.add(el);
      el.addEventListener("seeked", onSeekedFor(el));
    } catch (e) { /* element không hỗ trợ listener: rAF fallback vẫn chạy */ }
  }

  // v2: id ổn định theo element (WeakMap — element bị GC thì id theo đó
  // mất, không rò rỉ; element mới sau đó nhận id tiếp theo, không tái
  // dùng id cũ nên 2 entry khác id không bao giờ là cùng element).
  function elementIdFor(el) {
    try {
      if (!probe._elementIds.has(el)) {
        probe._elementIds.set(el, probe._nextElementId);
        probe._nextElementId += 1;
      }
      return probe._elementIds.get(el);
    } catch (e) { return null; }
  }

  // v2: một mẫu decoded TRONG lúc seeking (chỉ gọi khi el.seeking=true
  // và entry chưa seeked — xem tick()). Vượt trần thì đếm, không lưu.
  function pushSeekingSample(entry, el, now) {
    try {
      if (entry.decodedSamplesWhileSeeking.length >= probe.maxSeekingSamples) {
        entry.droppedSeekingSamples += 1;
        return;
      }
      const q = qualityOf(el);
      entry.decodedSamplesWhileSeeking.push({ tMs: now, decoded: q.decoded, dropped: q.dropped });
    } catch (e) { /* mẫu lỗi thì bỏ mẫu đó, không giết vòng probe */ }
  }

  function recordSeek(el, target) {
    if (!probe.enabled || probe._readDone) return;
    try {
      ensureListener(el);
      const prev = probe._pendingByEl.get(el);
      if (prev) {
        // Seek mới đè seek cũ chưa chốt: chốt cũ trung thực, không ghi đè.
        finalize(prev, prev.seekedAtMs !== null ? "seeked-no-draw" : "superseded");
      }
      if (probe.entries.length >= probe.maxEntries) {
        probe.droppedOverflow += 1;
        return;
      }
      const now = performance.now();
      const q = qualityOf(el);
      const entry = {
        k: probe.entries.length,
        targetTime: target,
        seekRequestedAtMs: now,
        seekedAtMs: null,
        firstDrawAfterSeekAtMs: null,
        firstDecodedAfterSeekAtMs: null,
        seekLatencyMs: null,
        drawLatencyMs: null,
        currentTimeAtSeek: el.currentTime,
        currentTimeAtSeeked: null,
        decodedFramesAtSeek: q.decoded,
        decodedFramesAtSeeked: null,
        decodedFramesAtFirstDraw: null,
        droppedFramesAtSeek: q.dropped,
        droppedFramesAtSeeked: null,
        rafTicksWhileWaiting: 0,
        holdCountAtSeek: holdCount(),
        holdCountAtFirstDraw: null,
        phase: probe.currentPhase,
        status: "pending",
        elementKind: (el.tagName ? String(el.tagName).toLowerCase() : "media"),
        seekedEvent: false,
        seekingSeen: false,
        firstDrawBasis: "raf-eligible",
        // v2 (ngoài spec §3.3): id element + mẫu decoded trong lúc seeking
        // + ảnh chụp element lúc read() flush (null cho tới khi flush).
        elementId: elementIdFor(el),
        decodedSamplesWhileSeeking: [],
        droppedSeekingSamples: 0,
        flushElementSrc: null,
        flushElementReadyState: null,
        _el: el,
      };
      probe.entries.push(entry);
      probe._pendings.push(entry);
      probe._pendingByEl.set(el, entry);
    } catch (e) { /* ghi lỗi thì bỏ seek đó, không phá setter gốc */ }
  }

  function tick() {
    if (probe._rafStopped) return;
    probe._rafId = requestAnimationFrame(tick);
    const now = performance.now();
    const pendings = probe._pendings.slice();
    for (const entry of pendings) {
      try {
        entry.rafTicksWhileWaiting += 1;
        const el = entry._el;
        if (!el) continue;
        if (entry.seekedAtMs === null) {
          if (el.seeking) {
            entry.seekingSeen = true;
            // v2: lấy mẫu decoded TRONG lúc seeking, trước khi seeked
            // chốt — tick này seeking vẫn true nên mẫu thuộc về lúc chờ.
            pushSeekingSample(entry, el, now);
          } else if (near(el.currentTime, entry.targetTime)) {
            // Fallback rAF khi sự kiện seeked không tới (seek nhanh hoàn
            // tất trước tick đầu, hoặc listener gắn hụt).
            const q = qualityOf(el);
            entry.seekedAtMs = now;
            entry.seekedEvent = false;
            entry.currentTimeAtSeeked = el.currentTime;
            entry.decodedFramesAtSeeked = q.decoded;
            entry.droppedFramesAtSeeked = q.dropped;
          }
        }
        if (entry.seekedAtMs !== null) {
          const q = qualityOf(el);
          if (entry.firstDecodedAfterSeekAtMs === null
            && entry.decodedFramesAtSeeked !== null && q.decoded !== null
            && q.decoded > entry.decodedFramesAtSeeked) {
            entry.firstDecodedAfterSeekAtMs = now;
          }
          if (entry.firstDrawAfterSeekAtMs === null
            && el.readyState >= 2
            && entry.currentTimeAtSeeked !== null
            && near(el.currentTime, entry.currentTimeAtSeeked)) {
            entry.firstDrawAfterSeekAtMs = now;
            entry.holdCountAtFirstDraw = holdCount();
            entry.decodedFramesAtFirstDraw = q.decoded;
            finalize(entry, "completed");
          }
        }
      } catch (e) { /* một entry lỗi không được giết vòng probe */ }
    }
  }

  function startLoop() {
    if (!probe._rafStopped) return;
    probe._rafStopped = false;
    probe._rafId = requestAnimationFrame(tick);
  }
  function stopLoop() {
    probe._rafStopped = true;
    try {
      if (typeof cancelAnimationFrame === "function" && probe._rafId !== null) cancelAnimationFrame(probe._rafId);
    } catch (e) { /* không có cancel thì cờ stopped đã đủ */ }
    probe._rafId = null;
  }

  probe.install = function install(options) {
    const opts = options || {};
    if (typeof opts.fps === "number" && opts.fps > 0) probe.fps = opts.fps;
    if (typeof opts.maxEntries === "number" && opts.maxEntries > 0) probe.maxEntries = opts.maxEntries;
    if (typeof opts.maxSeekingSamples === "number" && opts.maxSeekingSamples > 0) probe.maxSeekingSamples = opts.maxSeekingSamples;
    if (probe.installed) {
      probe.enabled = true;
      startLoop();
      return "already-installed";
    }
    let descriptor = null;
    try {
      descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime");
    } catch (e) { descriptor = null; }
    if (!descriptor || typeof descriptor.set !== "function") return "no-setter";
    if (descriptor.set.__n2PerSeekPatched) return "already-patched";
    const origSet = descriptor.set;
    probe._origSetter = origSet;
    probe._origDescriptor = descriptor;
    const wrapper = function (value) {
      // Ghi trước, gọi setter gốc sau — và LUÔN gọi setter gốc kể cả khi
      // ghi lỗi, để probe không bao giờ chặn được playback thật.
      try { recordSeek(this, value); } catch (e) { /* bỏ qua */ }
      return origSet.call(this, value);
    };
    wrapper.__n2PerSeekPatched = true;
    try {
      Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
        configurable: true, enumerable: descriptor.enumerable,
        get: descriptor.get, set: wrapper,
      });
    } catch (e) { return "patch-failed"; }
    probe.installed = true;
    probe.enabled = true;
    startLoop();
    return "installed";
  };

  probe.setEnabled = function setEnabled(on) {
    probe.enabled = !!on;
    if (probe.enabled && probe.installed && !probe._readDone) startLoop();
    else stopLoop();
    return probe.enabled ? "enabled" : "disabled";
  };

  probe.mark = function mark(name) {
    probe.currentPhase = String(name);
    probe.marks.push({ name: String(name), t: performance.now() });
    return probe.marks.length;
  };

  probe.read = function read() {
    if (!probe._readDone) {
      probe._readDone = true;
      stopLoop();
      const pendings = probe._pendings.slice();
      for (const entry of pendings) {
        // v2: trước khi chốt, chụp src/readyState của element lúc flush
        // để đối chiếu entry unresolved (ví dụ element thumbnail bị gỡ
        // src trước khi seek xong — đúng trường hợp T2 §4.3).
        try {
          const el = entry._el;
          if (el) {
            entry.flushElementSrc = el.currentSrc || el.src || null;
            entry.flushElementReadyState = typeof el.readyState === "number" ? el.readyState : null;
          }
        } catch (e) { /* chụp lỗi thì giữ null, không chặn flush */ }
        finalize(entry, entry.seekedAtMs !== null ? "seeked-no-draw" : "unresolved");
      }
    }
    const counts = {};
    for (const e of probe.entries) counts[e.status] = (counts[e.status] || 0) + 1;
    return {
      version: probe.version,
      entries: probe.entries,
      marks: probe.marks,
      droppedOverflow: probe.droppedOverflow,
      counts: counts,
    };
  };

  window.__n2PerSeek = probe;
  return "defined";
})();
