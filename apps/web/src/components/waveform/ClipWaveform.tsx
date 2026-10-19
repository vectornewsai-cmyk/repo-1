/**
 * ClipWaveform — Wrapper gắn waveform vào một audio clip trên timeline.
 *
 * Tự tra MediaItem từ store qua clip.src (src = tên file trong MediaBin),
 * decode PCM bằng Web Audio API rồi tính peaks cho đúng đoạn [in, out)
 * (khớp với trim của clip). Kết quả decode được cache nên kéo/trim/zoom
 * không decode lại.
 *
 * Nếu không tìm được media (vd spec mở từ JSON mà file chưa import) hoặc
 * decode lỗi → render null (waveform là tính năng bổ trợ, không chặn UI).
 */
import { useEffect, useMemo, useState } from "react";
import type { AudioClip } from "@repo-1/video-spec";
import { useStore } from "../../store";
import { decodeAudioPeaks } from "../../lib/waveform";
import { WaveformCanvas } from "./WaveformCanvas";
import "./waveform.css";

const WAVEFORM_H = 24; // px — vừa trong lane audio 46px (trừ label phía trên)

export function ClipWaveform({
  clip,
  pxPerSec,
}: {
  clip: AudioClip;
  pxPerSec: number;
}) {
  const media = useStore((s) => s.media);
  const item = useMemo(
    () => media.find((m) => m.kind === "audio" && m.name === clip.src),
    [media, clip.src],
  );

  const [peaks, setPeaks] = useState<number[] | null>(null);

  const clipW = Math.max(8, Math.round(clip.duration * pxPerSec));
  const width = Math.max(8, clipW - 6); // chừa lề 3px mỗi bên (xem waveform.css)
  // ~2 bucket mỗi pixel, chặn trên để không quá nặng với clip dài.
  const buckets = Math.max(32, Math.min(600, Math.round(width / 2)));

  useEffect(() => {
    if (!item) {
      setPeaks(null);
      return;
    }
    let cancelled = false;
    setPeaks(null); // decode lại khi đổi file/trim (cache nên thường là tức thì)
    decodeAudioPeaks(item.url, clip.in, clip.out, buckets)
      .then((r) => {
        if (!cancelled) setPeaks(r.peaks);
      })
      .catch(() => {
        if (!cancelled) setPeaks(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, clip.in, clip.out, buckets]);

  if (!peaks) return null;
  return (
    <div className="clip-waveform" aria-hidden="true">
      <WaveformCanvas peaks={peaks} width={width} height={WAVEFORM_H} />
    </div>
  );
}
