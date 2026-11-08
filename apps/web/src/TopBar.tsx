/**
 * Thanh công cụ trên cùng: tên dự án, điều khiển phát, thao tác clip, export.
 *
 * R1-107: dùng i18n (vi/en) cho toàn bộ chuỗi hiển thị + aria-label cho các nút
 * chỉ có icon, aria-live cho thông báo flash.
 */
import { useState } from "react";
import { useStore } from "./store";
import { subscribeToasts } from "./lib/toast";
import { fmtTime } from "./lib";
import {
  readReverseWebcodecsOptIn,
  setReverseWebcodecsOptIn,
} from "./lib/reversePlayback";
import { ProjectMenu } from "./components/project/ProjectMenu";
import { t, useLang, setLang, getLang } from "./i18n";

// D1 Phase 9 đợt 4: tách nhãn ngắn dạng "emoji + chữ" (vd "💬 Phụ đề",
// "+ Text") thành icon + span chữ. Chuỗi vẫn lấy từ đúng key i18n cũ,
// chỉ thêm span để CSS ẩn riêng phần chữ ở viewport hẹp (icon-only) mà
// không phải sửa key hay đụng vào ProjectMenu (file của agent khác).
function splitShortLabel(s: string): [string, string] {
  const i = s.indexOf(" ");
  return i > 0 ? [s.slice(0, i), s.slice(i + 1)] : [s, ""];
}

function ShortLabel({ text }: { text: string }) {
  const [icon, label] = splitShortLabel(text);
  if (!label) return <>{text}</>;
  return (
    <>
      <span aria-hidden="true">{icon}</span> <span className="tbtn-label">{label}</span>
    </>
  );
}

export function TopBar({ onExport, onCaption, onSilence, onTemplate, onWelcome }: { onExport: () => void; onCaption: () => void; onSilence: () => void; onTemplate: () => void; onWelcome: () => void }) {
  useLang(); // re-render khi đổi ngôn ngữ
  const name = useStore((s) => s.spec.meta.name);
  const playing = useStore((s) => s.playing);
  // K4 (đợt 27): cờ phát ngược toàn cục (xem store.ts).
  const reversePlayback = useStore((s) => s.reversePlayback);
  const playhead = useStore((s) => s.playhead);
  const selection = useStore((s) => s.selection);
  const media = useStore((s) => s.media);
  const undoDepth = useStore((s) => s.undoDepth);
  const redoDepth = useStore((s) => s.redoDepth);
  const undoLabel = useStore((s) => s.undoLabel);
  const redoLabel = useStore((s) => s.redoLabel);
  const clipboardSize = useStore((s) => s.clipboardSize); // K2: bật/tắt nút Dán
  const [flash, setFlash] = useState<string | null>(null);
  // Đợt 47 C5 — toggle đường phát ngược WebCodecs (trong đó có GOP
  // Range cho file lớn): MẶC ĐỊNH BẬT, tắt được, lưu localStorage
  // `vcut-reverse-webcodecs` (xem reversePlayback.ts).
  // ROUND48-D4: nhãn/title lấy từ key i18n topbar.reverseWebcodecs*
  // (vi + en, parity khóa ở reverseToggleI18n48D4.test.ts) thay cho
  // chuỗi Việt trực tiếp của C5; aria-label là điểm bám ổn định cho
  // harness đo; preview đọc cờ mỗi tick nên bật/tắt có hiệu lực ngay
  // ở lần stepping kế tiếp, không cần reload.
  const [reverseWc, setReverseWc] = useState(readReverseWebcodecsOptIn);
  const st = useStore.getState();
  const duration = st.duration();
  // R1-072: chỉ bật nút phụ đề khi có file video/audio gốc để transcribe.
  const canCaption = media.some(
    (m) => (m.kind === "video" || m.kind === "audio") && m.file
  );

  const doSplit = () => {
    // Đợt 19 G3: splitAtPlayhead đã tự toast lý do thật khi nested bị
    // từ chối (xem store.ts) — khi đó KHÔNG flash câu chung nữa, vì
    // "Không có clip nào tại playhead" là sai sự thật (clip có đó, chỉ
    // không tách được) và thành báo trùng. Cách nhận biết không đổi
    // hợp đồng trả về của action: đếm toast trước/sau lời gọi qua API
    // công khai subscribeToasts (callback chạy ngay với snapshot hiện
    // tại); action tách hiện không bắn toast nào khác nên toast mới
    // xuất hiện trong lời gọi này chính là lý do thất bại đã báo.
    let before = 0;
    const unsubBefore = subscribeToasts((list) => {
      before = list.length;
    });
    unsubBefore();
    const ok = st.splitAtPlayhead();
    let after = 0;
    const unsubAfter = subscribeToasts((list) => {
      after = list.length;
    });
    unsubAfter();
    if (!ok && after === before) {
      setFlash(t("topbar.noClipAtPlayhead"));
      setTimeout(() => setFlash(null), 1800);
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo" aria-hidden="true">◧</div>
        <div className="brand-name">{t("app.name")}</div>
      </div>

      <input
        className="project-name"
        value={name}
        onChange={(e) => st.setProjectName(e.target.value)}
        title={t("topbar.projectName")}
        aria-label={t("topbar.projectName")}
        maxLength={60}
      />

      <div className="transport" role="group" aria-label="transport">
        <button
          className="tbtn"
          title={t("topbar.toStart")}
          aria-label={t("topbar.toStart")}
          onClick={() => st.stopPlayback()}
        >
          <span aria-hidden="true">⏮</span>
        </button>
        <button
          className="tbtn play"
          title={playing ? t("topbar.pause") : t("topbar.play")}
          aria-label={playing ? t("topbar.pause") : t("topbar.play")}
          aria-pressed={playing}
          onClick={() => {
            // K4 (đợt 27): nút ▶ luôn nghĩa là phát XUÔI — nếu đang ở
            // chế độ ngược thì tắt cờ trước; đang phát ngược thì giữ
            // nguyên playing (chuyển hướng ngay), đang dừng thì phát.
            // Space/K (togglePlay) thì giữ nguyên hướng hiện tại.
            if (reversePlayback) {
              st.setReversePlayback(false);
              if (!playing) st.togglePlay();
            } else {
              st.togglePlay();
            }
          }}
        >
          <span aria-hidden="true">{playing ? "⏸" : "▶"}</span>
        </button>
        {/* K4 (đợt 27): phát ngược toàn cục — playhead lùi từng frame,
            mọi video seek từng frame, audio tắt (không phát ngược đồng
            bộ được). ROUND49-E2: title/aria-label lấy từ i18n
            (topbar.reversePlayback*) thay cho chuỗi Việt trực tiếp;
            giá trị vi giữ nguyên "Phát ngược" nên selector harness
            [aria-label="Phát ngược"] không đổi. */}
        <button
          className={`tbtn${reversePlayback && playing ? " play" : ""}`}
          title={t("topbar.reversePlaybackHint")}
          aria-label={t("topbar.reversePlayback")}
          aria-pressed={reversePlayback && playing}
          onClick={() => st.toggleReversePlayback()}
        >
          <span aria-hidden="true">◀</span>
        </button>
        {/* Đợt 47 C5 — toggle đường phát ngược WebCodecs (GOP cho file
            lớn): mặc định BẬT. Tắt thì preview ngược rơi về đường
            element-seek cũ; bật lại thì file trong (32, 128] MiB dùng
            GOP Range thay vì tải toàn file. Trạng thái hiển thị đúng
            qua aria-pressed + class "play" (sáng khi bật).
            ROUND48-D4: title/aria-label lấy từ i18n
            (topbar.reverseWebcodecs*) thay cho chuỗi Việt trực tiếp. */}
        <button
          className={`tbtn${reverseWc ? " play" : ""}`}
          title={
            reverseWc
              ? t("topbar.reverseWebcodecsOn")
              : t("topbar.reverseWebcodecsOff")
          }
          aria-label={t("topbar.reverseWebcodecs")}
          aria-pressed={reverseWc}
          data-testid="reverse-webcodecs-toggle"
          onClick={() => {
            const v = !reverseWc;
            setReverseWebcodecsOptIn(v);
            setReverseWc(v);
          }}
        >
          <span aria-hidden="true">⚡</span>
        </button>
        <div className="time-display" aria-live="off">
          {fmtTime(playhead)} <span>/</span> {fmtTime(duration)}
        </div>
      </div>

      {/* D1 Phase 9 đợt 4: nhóm ưu tiên lên hàng 1 (bên phải) — xuất bản,
          bắt đầu, ngôn ngữ không bao giờ phải cuộn ngang mới bấm được. */}
      <div className="topbar-priority">
        <button className="primary" onClick={onExport} title={t("topbar.publish")} data-tour="export">
          {t("topbar.publishShort")}
        </button>
        <button
          type="button"
          title={t("topbar.welcomeHint")}
          aria-label={t("topbar.welcomeLabel")}
          onClick={onWelcome}
        >
          {t("topbar.welcome")}
        </button>
        <button
          className="tbtn topbar-lang-btn"
          title={t("common.language")}
          aria-label={t("common.language")}
          onClick={() => setLang(getLang() === "vi" ? "en" : "vi")}
        >
          <span aria-hidden="true">{getLang() === "vi" ? "🇻🇳" : "🇺🇸"}</span>
        </button>
      </div>

      <div className="topbar-actions">
        <button
          title={undoLabel ? t("topbar.undoWith", { label: undoLabel }) : t("topbar.undo")}
          aria-label={undoLabel ? t("topbar.undoWith", { label: undoLabel }) : t("topbar.undo")}
          onClick={() => st.undo()}
          disabled={undoDepth === 0}
        >
          <span aria-hidden="true">↩</span>
        </button>
        <button
          title={redoLabel ? t("topbar.redoWith", { label: redoLabel }) : t("topbar.redo")}
          aria-label={redoLabel ? t("topbar.redoWith", { label: redoLabel }) : t("topbar.redo")}
          onClick={() => st.redo()}
          disabled={redoDepth === 0}
        >
          <span aria-hidden="true">↪</span>
        </button>
        <ProjectMenu />
        <button title={t("topbar.addText")} onClick={() => st.addTextClip()} data-tour="add-text">
          <ShortLabel text={t("topbar.addTextShort")} />
        </button>
        <button title={t("topbar.split")} onClick={doSplit}>
          <ShortLabel text={t("topbar.splitShort")} />
        </button>
        {/* K2 (Phase 6): copy/paste/duplicate clip */}
        <button
          title={t("topbar.copy")}
          onClick={() => st.copySelection()}
          disabled={selection.length === 0}
        >
          <ShortLabel text={t("topbar.copyShort")} />
        </button>
        <button
          title={t("topbar.paste")}
          onClick={() => st.pasteClipboard()}
          disabled={clipboardSize === 0}
        >
          <ShortLabel text={t("topbar.pasteShort")} />
        </button>
        <button
          title={t("topbar.duplicate")}
          onClick={() => st.duplicateSelection()}
          disabled={selection.length === 0}
        >
          <ShortLabel text={t("topbar.duplicateShort")} />
        </button>
        <button
          title={t("topbar.caption")}
          onClick={onCaption}
          disabled={!canCaption}
        >
          <ShortLabel text={t("topbar.captionShort")} />
        </button>
        <button
          title={t("topbar.cutSilence")}
          onClick={onSilence}
          disabled={!canCaption}
        >
          <ShortLabel text={t("topbar.cutSilenceShort")} />
        </button>
        <button
          title={t("topbar.template")}
          onClick={onTemplate}
        >
          <ShortLabel text={t("topbar.templateShort")} />
        </button>
        <button
          title={t("topbar.delete")}
          onClick={() => st.deleteSelection()}
          disabled={selection.length === 0}
        >
          <ShortLabel text={t("topbar.deleteShort")} />
        </button>
      </div>

      {flash && (
        <div className="flash-msg" role="status" aria-live="polite">
          {flash}
        </div>
      )}
    </header>
  );
}
