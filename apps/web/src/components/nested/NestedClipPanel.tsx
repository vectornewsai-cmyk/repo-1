/**
 * NestedClipPanel — Panel tạo/quản lý nested clip (compound clip) trên Timeline.
 *
 * PHẠM VI N4 + R5 (UI only): panel chỉ gọi store action (nestSelection /
 * unnestClip / updateNestedInnerClip) nên mọi thao tác đều đi qua
 * execCommand → undo/redo hoạt động. Panel KHÔNG tự sửa spec, KHÔNG đụng
 * preview/render.
 *
 * R5: i18n qua i18nT (key nested.*); "Xem bên trong" không chỉ liệt kê mà
 * còn cho sửa tối thiểu clip con (start/duration trong compound clip +
 * nội dung clip chữ) qua updateNestedInnerClip — in/out nguồn giữ nguyên,
 * clip con không được vượt ngoài compound clip hay đè clip khác cùng
 * track con (xem nestUtils header R5). Xem thêm R5_LIMITS.md.
 *
 * R7: thêm nút "Transition & opacity" cho mỗi nested clip — đặt/xoá
 * opacity + transition qua biên (chỉ fade, fail-fast, xem nestUtils §R7
 * và R7_UI_LIMITS.md); fallback text hardcode cũ cho clip text rỗng đã
 * thay bằng i18nT("timeline.emptyLabel") như Timeline.clipLabel.
 *
 * Đợt 15 T6: khi lưu clip con mà patch trim/split làm rơi keyframe
 * tốc độ khỏi curve (curveDropped > 0), panel hiển thị cảnh báo rõ
 * trong dòng thông báo chung (msg) — trước đó store chỉ trả boolean
 * nên user không thấy số này (nợ LIMITS đợt 14 §3).
 *
 * Đợt 18 (toast nested): nested clip mang speedKeyframes hoặc
 * reverse === true sẽ bị splitNestedClip/trimNestedClip từ chối
 * (trả null, store giữ nguyên clip — xem nestUtils) vì render worker
 * cấm cả hai field này ở nested (server/render/src/nested.js
 * nestedWindow). Trước đợt này lệnh tách/trim thất bại im lặng, user
 * không biết lý do. Panel nay báo riêng: mỗi nested clip bị ảnh hưởng
 * nhận 1 toast error (pushToast, hệ toast thống nhất K5 — cùng pattern
 * Timeline dùng khi drop bị từ chối) ngay khi panel liệt kê nó, kèm
 * 1 dòng cảnh báo bền vững dưới clip đó (toast tự đóng sau 4.5s nên
 * dòng cảnh báo giữ lý do lại). Panel chỉ ĐỌC field (duck-typed),
 * KHÔNG sửa store.ts hay render worker; toast KHÔNG bắn đúng thời
 * điểm tách/trim (đường đó đi qua Timeline/store, ngoài phạm vi file
 * này) mà bắn chủ động khi panel mở và thấy clip bị cấm — xem
 * docs/PHASE9_ROUND18_CLEANUP_TOAST_LIMITS.md.
 *
 * Đợt 19 G3: detector + câu báo chuyển sang module dùng chung
 * ./nestedRejection.ts (store cũng dùng — tránh hai bản lệch nhau),
 * câu báo qua i18n (key nested.speedRejected + 3 key fix, đủ vi/en)
 * thay cho hardcode tiếng Việt đợt 18. Toast đúng thời điểm tách/trim
 * từ Timeline nay do store bắn (xem store.ts) — panel giữ nguyên vai
 * trò báo chủ động khi liệt kê clip.
 *
 * Đợt 20 R4: block chọn chế độ áp speed curve cho nested clip ĐÃ mang
 * curve (NestedCurveModeEditor, đóng nợ LIMITS G2 "chưa có nút panel
 * cho trim-cố-định"). SpeedPanel KHÔNG phải nơi đặt chế độ này:
 * SpeedPanel chỉ mount cho clip video/audio (Inspector) và tự return
 * null với nested (isSpeedable chỉ nhận video/audio), nên nested clip
 * không bao giờ thấy editor curve ở đó — block này đặt ở panel liệt kê
 * nested clip mới là đường UI thật. Block chỉ hiện khi clip đã có
 * curve (tạo curve mới cho nested từ UI vẫn là nợ mở, xem LIMITS R4);
 * giá trị kỳ vọng tính bằng helper thuần (nestedCurveExpectedOut /
 * applyNestedCurveFixedTrim) nên khớp đúng số action sẽ áp; lỗi action
 * trim-cố-định bắn toast + dòng msg, không im lặng.
 *
 * Đợt 21 T4: block tạo curve MỚI cho nested chưa có curve
 * (NestedCurveCreateEditor, đóng nợ R4 vừa nêu — vẫn đặt ở panel này,
 * không phải SpeedPanel, vì lý do R4). Preset khởi đầu: curve hằng 1×
 * (1 keyframe, xem nestedCurveCreate.ts — lý do chọn 1→1 thay vì 1→2
 * và luật chặn nằm ở đó, panel chỉ gọi). Tạo qua patchClip (chế độ
 * giữ-duration mặc định) trong 1 bước undo; sau khi tạo thành công,
 * spec đổi nên block tạo tự ẩn và NestedCurveModeEditor hiện ngay mà
 * không cần chọn lại clip. Lỗi không im lặng: chặn trước (đã có curve
 * / reverse / hai tầng / không tính được trim.out / track khóa) toast
 * đúng lý do, và kiểm tra lại sau khi gọi store (patchClip trả 0 im
 * lặng cho cả từ chối lẫn thành công không rơi keyframe) nên không
 * báo "đã tạo" sai khi store vừa từ chối.
 */
import { useEffect, useRef, useState } from "react";
import { useStore } from "../../store";
import { pushToast } from "../../lib/toast";
import { t as i18nT, useLang } from "../../i18n";
import type { Clip, NestedClip, SpeedCurve } from "@repo-1/video-spec";
import { nestedEffectiveTrim } from "@repo-1/video-spec";
import {
  applyNestedCurveFixedTrim,
  checkTwoLevelOuterCurve,
  isAdjustmentLayer,
  isNestedClip,
  listNestedClips,
  nestedCurveExpectedOut,
  nestedInnerCount,
  nestedSubtreeHasSpeedCurve,
  readNestedBoundary,
} from "./nestUtils";
import {
  nestedSpeedRejectionFields,
  nestedSpeedRejectionMessage,
} from "./nestedRejection";
import {
  createNestedCurvePreset,
  nestedCurveCreateBlock,
  nestedCurveCreateTwoLevelReason,
} from "./nestedCurveCreate";
import { fmtTime } from "../../lib";
import "./nested.css";

/**
 * Editor tối thiểu cho 1 clip con. key của component ở phía parent chứa
 * start/duration/text nên sau khi lưu thành công component remount với
 * giá trị mới (tránh input kẹt ở giá trị cũ).
 */
function InnerClipEditor({
  hostTrackId,
  nestedId,
  innerTrackId,
  clip,
  onMsg,
}: {
  hostTrackId: string;
  nestedId: string;
  innerTrackId: string;
  clip: Clip;
  onMsg: (msg: string) => void;
}) {
  const [start, setStart] = useState(clip.start);
  const [duration, setDuration] = useState(clip.duration);
  const [text, setText] = useState((clip as { text?: string }).text ?? "");
  const isText = clip.kind === "text";

  const save = () => {
    const res = useStore.getState().updateNestedInnerClip(hostTrackId, nestedId, innerTrackId, clip.id, {
      start,
      duration,
      ...(isText ? { text } : {}),
    });
    if (!res.ok) {
      onMsg(i18nT("nested.innerSaveFail"));
    } else if (res.curveDropped > 0) {
      // Cảnh báo rơi keyframe: user cần thấy ngay là trim/split vừa
      // cắt keyframe khỏi curve (khôi phục bằng Undo nếu không muốn).
      onMsg(
        `${i18nT("nested.innerSaveOk")} ${i18nT("nested.innerCurveDropped", { n: String(res.curveDropped) })}`,
      );
    } else {
      onMsg(i18nT("nested.innerSaveOk"));
    }
  };

  return (
    <div className="nested-panel-row">
      <span className="nested-inner-clip">
        {clip.kind === "text"
          ? ((clip as { text?: string }).text || i18nT("timeline.emptyLabel"))
          : ((clip as { src?: string }).src ?? clip.kind)}{" "}
        ({fmtTime(clip.start)}–{fmtTime(clip.start + clip.duration)})
      </span>
      <label>
        {i18nT("nested.innerStart")}{" "}
        <input
          type="number"
          min={0}
          step={0.1}
          value={start}
          aria-label={i18nT("nested.innerStart")}
          onChange={(e) => setStart(Number(e.target.value))}
        />
      </label>
      <label>
        {i18nT("nested.innerDuration")}{" "}
        <input
          type="number"
          min={0.2}
          step={0.1}
          value={duration}
          aria-label={i18nT("nested.innerDuration")}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </label>
      {isText && (
        <label>
          {i18nT("nested.innerText")}{" "}
          <input
            value={text}
            aria-label={i18nT("nested.innerText")}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
      )}
      <button onClick={save}>{i18nT("nested.innerSave")}</button>
    </div>
  );
}

/**
 * Đợt 19 G3: detector + câu báo dùng chung nằm ở ./nestedRejection.ts
 * (store cũng dùng cho toast đúng thời điểm tách/trim); panel chỉ gọi
 * chúng với i18nT — không còn bản hardcode tiếng Việt riêng như đợt 18.
 * nestedSpeedRejectionMessage(clip.name, fields) ở các chỗ dùng dưới
 * đây thực chất là nestedSpeedRejectionMessage(i18nT, name, fields).
 */

/**
 * Editor transition qua biên + opacity cho 1 nested clip (R7, xem nestUtils
 * §R7). key của component ở phía parent chứa toàn bộ field biên hiện tại
 * nên sau khi lưu thành công component remount với giá trị mới. Type select
 * cố tình có cả type không phải fade (wipeleft/slideleft/dissolve) để user
 * thấy fail-fast: chọn chúng rồi lưu sẽ bị từ chối, không ghi gì cả.
 */
function NestedBoundaryEditor({
  hostTrackId,
  clip,
  onMsg,
}: {
  hostTrackId: string;
  clip: NestedClip;
  onMsg: (msg: string) => void;
}) {
  const cur = readNestedBoundary(clip);
  const [opacityText, setOpacityText] = useState(
    cur.opacity === undefined ? "" : String(cur.opacity),
  );
  const [inType, setInType] = useState(cur.transitionIn?.type ?? "");
  const [inDur, setInDur] = useState(
    cur.transitionIn === undefined ? "" : String(cur.transitionIn.duration),
  );
  const [outType, setOutType] = useState(cur.transitionOut?.type ?? "");
  const [outDur, setOutDur] = useState(
    cur.transitionOut === undefined ? "" : String(cur.transitionOut.duration),
  );

  const save = () => {
    const ok = useStore.getState().setNestedClipBoundary(hostTrackId, clip.id, {
      opacity: opacityText.trim() === "" ? null : Number(opacityText),
      transitionIn: inType === "" ? null : { type: inType, duration: Number(inDur) },
      transitionOut: outType === "" ? null : { type: outType, duration: Number(outDur) },
    });
    onMsg(ok ? i18nT("nestedBoundary.saveOk") : i18nT("nestedBoundary.saveFail"));
    if (!ok) {
      // Lưu thất bại thì form phải quay về giá trị đã lưu thật, tránh
      // draft bị từ chối vẫn hiển thị như đã lưu (parent tích hợp đợt 7:
      // U6b đọc form sau khi lưu thất bại và thấy transIn=fade dù store
      // đã từ chối đúng vì nested đã có transOut — không đặt cả hai đầu).
      setOpacityText(cur.opacity === undefined ? "" : String(cur.opacity));
      setInType(cur.transitionIn?.type ?? "");
      setInDur(cur.transitionIn === undefined ? "" : String(cur.transitionIn.duration));
      setOutType(cur.transitionOut?.type ?? "");
      setOutDur(cur.transitionOut === undefined ? "" : String(cur.transitionOut.duration));
    }
  };

  const typeOptions = ["fade", "wipeleft", "slideleft", "dissolve"];

  return (
    <div className="nested-inner">
      <p className="nested-panel-note">{i18nT("nestedBoundary.note")}</p>
      <div className="nested-panel-row">
        <span className="nested-item-time">
          {i18nT("nestedBoundary.opacity")}:{" "}
          {cur.opacity === undefined ? i18nT("nestedBoundary.transNone") : cur.opacity}
          {" · "}
          {i18nT("nestedBoundary.transIn")}:{" "}
          {cur.transitionIn
            ? `${cur.transitionIn.type} ${cur.transitionIn.duration}s`
            : i18nT("nestedBoundary.transNone")}
          {" · "}
          {i18nT("nestedBoundary.transOut")}:{" "}
          {cur.transitionOut
            ? `${cur.transitionOut.type} ${cur.transitionOut.duration}s`
            : i18nT("nestedBoundary.transNone")}
        </span>
      </div>
      <div className="nested-panel-row">
        <label>
          {i18nT("nestedBoundary.opacity")}{" "}
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={opacityText}
            placeholder="0..1"
            aria-label={i18nT("nestedBoundary.opacityAria")}
            onChange={(e) => setOpacityText(e.target.value)}
          />
        </label>
      </div>
      <div className="nested-panel-row">
        <span>{i18nT("nestedBoundary.transIn")}:</span>
        <label>
          {i18nT("nestedBoundary.transType")}{" "}
          <select
            value={inType}
            aria-label={i18nT("nestedBoundary.transIn")}
            onChange={(e) => setInType(e.target.value)}
          >
            <option value="">{i18nT("nestedBoundary.transNone")}</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          {i18nT("nestedBoundary.transDuration")}{" "}
          <input
            type="number"
            min={0}
            step={0.1}
            value={inDur}
            aria-label={i18nT("nestedBoundary.transDuration")}
            onChange={(e) => setInDur(e.target.value)}
          />
        </label>
      </div>
      <div className="nested-panel-row">
        <span>{i18nT("nestedBoundary.transOut")}:</span>
        <label>
          {i18nT("nestedBoundary.transType")}{" "}
          <select
            value={outType}
            aria-label={i18nT("nestedBoundary.transOut")}
            onChange={(e) => setOutType(e.target.value)}
          >
            <option value="">{i18nT("nestedBoundary.transNone")}</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          {i18nT("nestedBoundary.transDuration")}{" "}
          <input
            type="number"
            min={0}
            step={0.1}
            value={outDur}
            aria-label={i18nT("nestedBoundary.transDuration")}
            onChange={(e) => setOutDur(e.target.value)}
          />
        </label>
      </div>
      <div className="nested-panel-row">
        <button onClick={save}>{i18nT("nestedBoundary.save")}</button>
      </div>
    </div>
  );
}

/**
 * Đợt 21 T4 — tạo speed curve MỚI cho 1 nested clip chưa có curve.
 * Chỉ render nội dung khi clip chưa có curve; ngược lại trả null (panel
 * vẫn mount component cho mọi item để thứ tự hook không đổi — component
 * này không dùng hook nên việc mount/unmount cũng an toàn).
 *
 * Preset + luật chặn nằm ở ./nestedCurveCreate.ts (module thuần, test
 * bundle khóa cùng giá trị): curve hằng 1× qua patchClip (giữ duration,
 * tính lại trim.out theo tích phân — với nested tốc độ 1 thì trim
 * không đổi). Preview hiện TRƯỚC khi tạo bằng đúng helper thuần mà
 * store sẽ dùng (nestedCurveExpectedOut trên clip tạm gắn preset) nên
 * user thấy trước trim.out mới, kể cả trường hợp nested tốc độ khác 1
 * làm trim.out đổi. Tạo xong, block này tự ẩn (clip nay đã có curve)
 * và NestedCurveModeEditor hiện ngay trong cùng item, không cần chọn
 * lại clip — đó là vì cả hai component đều mount sẵn cho mọi item và
 * chỉ đổi nhánh null/nội dung theo spec mới.
 * Handler kiểm tra trước 5 trường hợp (đã có curve / reverse / hai
 * tầng / không tính được trim.out / track khóa) rồi kiểm tra LẠI sau
 * khi gọi store: patchClip trả 0 cả khi bị từ chối lẫn khi thành công
 * không rơi keyframe nên không thể tin giá trị trả về — chỉ khi đọc
 * lại clip từ store và thấy curve mới thì mới báo thành công.
 */
function NestedCurveCreateEditor({
  trackId,
  clip,
  onMsg,
}: {
  trackId: string;
  clip: NestedClip;
  onMsg: (msg: string) => void;
}) {
  const curve = (clip as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  if (curve && curve.keyframes.length > 0) return null;
  const preset = createNestedCurvePreset();
  const trim = nestedEffectiveTrim(clip);
  const fmt3 = (x: number) => String(Math.round(x * 1000) / 1000);
  const expectedOut = nestedCurveExpectedOut({
    ...clip,
    speedKeyframes: preset,
  } as NestedClip);
  const preview =
    expectedOut === null
      ? i18nT("nested.curveCreatePreviewFail")
      : Math.abs(expectedOut - trim.out) <= 1e-9
        ? i18nT("nested.curveCreatePreviewSame", {
            dur: fmt3(clip.duration),
            tin: fmt3(trim.in),
            tout: fmt3(trim.out),
          })
        : i18nT("nested.curveCreatePreviewChange", {
            dur: fmt3(clip.duration),
            oldOut: fmt3(trim.out),
            newOut: fmt3(expectedOut),
          });
  const create = () => {
    // Chặn trước bằng đúng luật của module thuần (panel không tự bịa
    // điều kiện riêng, tránh hai bản lệch nhau như bài học đợt 18).
    const block = nestedCurveCreateBlock(clip);
    if (block === "alreadyHas") {
      // Nhánh phòng thủ cho render cũ/double-click: block tạo đã ẩn
      // khi clip có curve, nhưng nếu handler vẫn chạy thì không gọi
      // store (tránh entry undo rỗng).
      onMsg(i18nT("nested.curveCreateAlreadyHas"));
      return;
    }
    if (block === "reverse") {
      const msg = i18nT("nested.curveCreateReverse");
      pushToast(msg, "error");
      onMsg(msg);
      return;
    }
    if (block === "twoLevel") {
      // Luật T2: chỉ cặp vi phạm R1 mới tới đây — toast đúng lý do cụ
      // thể của hàm check (key T2), không dùng câu chung cũ nữa.
      // Fallback câu chung chỉ phòng khi reason rỗng bất thường.
      const reason = nestedCurveCreateTwoLevelReason(clip);
      const msg =
        reason !== null
          ? i18nT("nested.curveTwoLevelInvalid", { name: clip.name ?? clip.id, reason })
          : i18nT("nested.curveTwoLevel", { name: clip.name ?? clip.id });
      pushToast(msg, "error");
      onMsg(msg);
      return;
    }
    if (block === "previewFail") {
      const msg = i18nT("nested.curveCreatePreviewFail");
      pushToast(msg, "error");
      onMsg(msg);
      return;
    }
    // patchClip cũng trả 0 im lặng khi track khóa — panel kiểm tra
    // trước để báo đúng lý do (mẫu R4).
    const st = useStore.getState();
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (!track || track.locked) {
      const msg = i18nT("nested.lockedTrack", { label: track?.label ?? track?.kind ?? trackId });
      pushToast(msg, "error");
      onMsg(msg);
      return;
    }
    // Tạo qua patchClip (chế độ giữ-duration mặc định): clip chưa có
    // curve nên cổng no-change mở (undefined !== object mới), không
    // cần thủ thuật copy như nút áp giữ-duration của R4.
    st.patchClip(trackId, clip.id, {
      speedKeyframes: createNestedCurvePreset(),
    } as Partial<Clip>);
    // Kiểm tra LẠI sau khi gọi store (không tin giá trị trả về).
    const after = useStore
      .getState()
      .spec.tracks.find((t) => t.id === trackId)
      ?.clips.find((c) => c.id === clip.id);
    const afterCurve = (after as unknown as { speedKeyframes?: SpeedCurve } | undefined)
      ?.speedKeyframes;
    if (afterCurve && afterCurve.keyframes.length > 0) {
      onMsg(i18nT("nested.curveCreateOk"));
    } else {
      const msg = i18nT("nested.curveCreateFail");
      pushToast(msg, "error");
      onMsg(msg);
    }
  };
  return (
    <div className="nested-inner">
      <p className="nested-panel-note">{i18nT("nested.curveCreateHead")}</p>
      <p className="nested-panel-note">{i18nT("nested.curveCreateNote")}</p>
      <p className="nested-panel-note">{preview}</p>
      <div className="nested-panel-row">
        <button onClick={create}>{i18nT("nested.curveCreateButton")}</button>
      </div>
    </div>
  );
}

/**
 * Đợt 20 R4 — chọn chế độ áp speed curve cho 1 nested clip đã mang curve.
 * Chỉ render nội dung khi clip có curve; ngược lại trả null (panel vẫn
 * mount component cho mọi item để hook useState không đổi thứ tự).
 *
 * Hai chế độ (spec đợt 18 §2, action store đợt 19 G2):
 *  - fixedDuration (mặc định, đúng patchClip hiện tại): giữ duration,
 *    tính lại trim.out theo tích phân curve.
 *  - fixedTrim: giữ trim, tính lại duration bằng đảo tích phân, qua
 *    action patchNestedCurveFixedTrim đã có sẵn từ đợt 19 G2.
 * Preview hiển thị TRƯỚC khi áp, tính bằng đúng helper thuần mà action
 * dùng (không tự tính lại tích phân ở panel, tránh hai bản lệch nhau):
 * fixedDuration → nestedCurveExpectedOut, fixedTrim → duration của
 * applyNestedCurveFixedTrim. Đổi chế độ chỉ đổi preview, không tự áp
 * (user bấm nút áp mới ghi spec — 1 bước undo, như mọi action panel).
 * Nút áp kiểm tra trước 3 trường hợp patchClip/action trả 0 im lặng
 * (xung đột hai tầng, track khóa, đã khớp giá trị kỳ vọng) để không
 * báo "đã áp" sai; chế độ giữ duration truyền BẢN COPY của curve vì
 * cổng no-change của patchClip so sánh tham chiếu (xem test C1).
 */
function NestedCurveModeEditor({
  trackId,
  clip,
  onMsg,
}: {
  trackId: string;
  clip: NestedClip;
  onMsg: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"fixedDuration" | "fixedTrim">("fixedDuration");
  const curve = (clip as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  if (!curve || curve.keyframes.length === 0) return null;
  const trim = nestedEffectiveTrim(clip);
  const fmt3 = (x: number) => String(Math.round(x * 1000) / 1000);
  const expectedOut = nestedCurveExpectedOut(clip);
  const fixedTrimNext = applyNestedCurveFixedTrim(clip, curve);
  const preview =
    mode === "fixedDuration"
      ? expectedOut !== null
        ? i18nT("nested.curveModePreviewDuration", { dur: fmt3(clip.duration), out: fmt3(expectedOut) })
        : i18nT("nested.curveModePreviewFail")
      : fixedTrimNext !== null
        ? i18nT("nested.curveModePreviewTrim", {
            tin: fmt3(trim.in),
            tout: fmt3(trim.out),
            dur: fmt3(fixedTrimNext.duration),
          })
        : i18nT("nested.curveModePreviewFail");
  const apply = () => {
    const st = useStore.getState();
    // Chặn trước giống store (đợt 21 T2: chỉ chặn cặp hai tầng VI PHẠM
    // luật render R1, kiểm tra bằng đúng hàm guard store dùng —
    // patchClip trả 0 cả khi bị từ chối lẫn khi áp thành công mà không
    // rơi keyframe nào, nên panel không phân biệt được bằng giá trị
    // trả về — kiểm tra trước để khỏi báo "đã áp" sai khi store vừa
    // từ chối. Cặp hai tầng hợp lệ được cho qua, không chặn oan.)
    if (nestedSubtreeHasSpeedCurve(clip)) {
      const chk = checkTwoLevelOuterCurve(clip, curve);
      if (!chk.ok) {
        const msg = i18nT("nested.curveTwoLevelInvalid", { name: clip.name ?? clip.id, reason: chk.reason });
        pushToast(msg, "error");
        onMsg(msg);
        return;
      }
    }
    // patchClip cũng trả 0 im lặng khi track khóa — panel kiểm tra
    // trước để báo đúng lý do thay vì báo "đã áp" sai.
    const track = st.spec.tracks.find((t) => t.id === trackId);
    if (!track || track.locked) {
      const msg = i18nT("nested.lockedTrack", { label: track?.label ?? track?.kind ?? trackId });
      pushToast(msg, "error");
      onMsg(msg);
      return;
    }
    if (mode === "fixedTrim") {
      // Đã khớp thì không gọi store (tránh entry undo không đổi gì).
      if (fixedTrimNext !== null && Math.abs(fixedTrimNext.duration - clip.duration) <= 1e-9) {
        onMsg(i18nT("nested.curveModeAlreadyOk"));
        return;
      }
      const res = st.patchNestedCurveFixedTrim(trackId, clip.id, curve);
      if (!res.ok) {
        // Lỗi action KHÔNG im lặng: toast + dòng msg. Reason của action
        // đã sang key i18n từ đợt 21 T3 (reasonKey + reason đã dịch theo
        // locale hiện tại), không còn hardcode tiếng Việt.
        const reason = res.reason ?? i18nT("nested.curveModeApplyFail");
        pushToast(reason, "error");
        onMsg(reason);
        return;
      }
      onMsg(i18nT("nested.curveModeApplyOk"));
      return;
    }
    // Đã khớp thì không gọi store (tránh entry undo không đổi gì).
    if (expectedOut !== null && Math.abs(expectedOut - trim.out) <= 1e-9) {
      onMsg(i18nT("nested.curveModeAlreadyOk"));
      return;
    }
    // BẮT BUỘC copy curve: patchClip có cổng no-change so sánh tham
    // chiếu (rec[k] !== prec[k]) nên truyền đúng object curve của clip
    // sẽ bị nuốt im lặng (return 0, không exec, trim.out không tính
    // lại) — copy nông đủ để cổng mở và trim.out được tính lại thật.
    // Test C1 khóa hành vi này ở tầng store.
    st.patchClip(trackId, clip.id, {
      speedKeyframes: { ...curve, keyframes: curve.keyframes.map((k) => ({ ...k })) },
    } as Partial<Clip>);
    onMsg(i18nT("nested.curveModeApplyOk"));
  };
  return (
    <div className="nested-inner">
      <p className="nested-panel-note">{i18nT("nested.curveModeHead")}</p>
      <p className="nested-panel-note">
        {i18nT("nested.curveModeCurrent", {
          dur: fmt3(clip.duration),
          tin: fmt3(trim.in),
          tout: fmt3(trim.out),
        })}
      </p>
      <div className="nested-panel-row">
        <label>
          <input
            type="radio"
            name={`curve-mode-${clip.id}`}
            checked={mode === "fixedDuration"}
            onChange={() => setMode("fixedDuration")}
          />{" "}
          {i18nT("nested.curveModeFixedDuration")}
        </label>
      </div>
      <div className="nested-panel-row">
        <label>
          <input
            type="radio"
            name={`curve-mode-${clip.id}`}
            checked={mode === "fixedTrim"}
            onChange={() => setMode("fixedTrim")}
          />{" "}
          {i18nT("nested.curveModeFixedTrim")}
        </label>
      </div>
      <p className="nested-panel-note">{i18nT("nested.curveModeNote")}</p>
      <p className="nested-panel-note">{preview}</p>
      <div className="nested-panel-row">
        <button onClick={apply}>{i18nT("nested.curveModeApply")}</button>
      </div>
    </div>
  );
}

export function NestedClipPanel({ onClose }: { onClose: () => void }) {
  useLang();
  const spec = useStore((s) => s.spec);
  const selection = useStore((s) => s.selection);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [boundaryId, setBoundaryId] = useState<string | null>(null);

  const nestedList = listNestedClips(spec);

  // Đợt 18: toast riêng cho nested clip bị cấm tách/trim. Mỗi clip chỉ
  // nhận toast 1 lần cho mỗi tổ hợp field (key = id + field) trong vòng
  // đời panel — tránh toast bắn lại mỗi lần spec đổi (ví dụ user sửa
  // clip khác). Clip gỡ field rồi mang lại sẽ nhận toast mới vì key đổi.
  const toastedSpeedRejections = useRef(new Set<string>());
  useEffect(() => {
    for (const { clip } of nestedList) {
      const fields = nestedSpeedRejectionFields(clip);
      if (fields.length === 0) continue;
      const key = `${clip.id}:${fields.join("+")}`;
      if (toastedSpeedRejections.current.has(key)) continue;
      toastedSpeedRejections.current.add(key);
      pushToast(nestedSpeedRejectionMessage(i18nT, clip.name ?? clip.id, fields), "error");
    }
    // Cố tình chỉ phụ thuộc spec: nestedList được tạo mới mỗi render
    // nên phụ thuộc nó sẽ chạy effect thừa (ref-set vẫn chặn toast lặp,
    // nhưng không cần chạy lại).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  // Kiểm tra selection có gộp được không (để disable nút + báo lý do).
  let nestDisabledReason: string | null = null;
  if (selection.length < 2) {
    nestDisabledReason = i18nT("nested.needTwo");
  } else {
    for (const s of selection) {
      const track = spec.tracks.find((t) => t.id === s.trackId);
      const clip = track?.clips.find((c) => c.id === s.clipId);
      if (!track || !clip) {
        nestDisabledReason = i18nT("nested.missingClip");
        break;
      }
      if (track.locked) {
        nestDisabledReason = i18nT("nested.lockedTrack", { label: track.label ?? track.kind });
        break;
      }
      if (isNestedClip(clip) || isAdjustmentLayer(clip)) {
        nestDisabledReason = i18nT("nested.nestedOrLayer");
        break;
      }
    }
  }

  const doNest = () => {
    const st = useStore.getState();
    const count = listNestedClips(st.spec).length + 1;
    const ok = st.nestSelection(name.trim() || `Compound clip ${count}`);
    if (ok) {
      setMsg(i18nT("nested.nestOk"));
      setName("");
    } else {
      setMsg(i18nT("nested.nestFail"));
    }
  };

  const doUnnest = (trackId: string, clipId: string) => {
    const ok = useStore.getState().unnestClip(trackId, clipId);
    setMsg(ok ? i18nT("nested.unnestOk") : i18nT("nested.unnestFail"));
    if (ok && openId === clipId) setOpenId(null);
  };

  return (
    <div className="nested-panel" role="region" aria-label="Nested clip">
      <div className="nested-panel-head">
        <strong>{i18nT("nested.title")}</strong>
        <button onClick={onClose} aria-label={i18nT("nested.closeAria")}>×</button>
      </div>
      <p className="nested-panel-note">{i18nT("nested.note")}</p>

      <div className="nested-panel-section">
        <div className="nested-panel-row">
          <span>{i18nT("nested.selected", { n: String(selection.length) })}</span>
        </div>
        {nestDisabledReason && (
          <p className="nested-panel-warn">{nestDisabledReason}</p>
        )}
        <div className="nested-panel-row">
          <input
            value={name}
            placeholder={i18nT("nested.namePlaceholder")}
            aria-label={i18nT("nested.nameAria")}
            onChange={(e) => setName(e.target.value)}
          />
          <button disabled={!!nestDisabledReason} onClick={doNest}>
            {i18nT("nested.nestButton")}
          </button>
        </div>
      </div>

      <div className="nested-panel-section">
        <strong>{i18nT("nested.listTitle", { n: String(nestedList.length) })}</strong>
        {nestedList.length === 0 && (
          <p className="nested-panel-note">{i18nT("nested.emptyList")}</p>
        )}
        {nestedList.map(({ trackId, clip }) => {
          const open = openId === clip.id;
          // Đợt 18: dòng cảnh báo bền vững (toast tự đóng sau 4.5s).
          const speedRejectFields = nestedSpeedRejectionFields(clip);
          return (
            <div key={clip.id} className="nested-item">
              <div className="nested-panel-row">
                <span className="nested-item-name">📦 {clip.name ?? clip.id}</span>
                <span className="nested-item-time">
                  {fmtTime(clip.start)} → {fmtTime(clip.start + clip.duration)}
                  {" · "}
                  {i18nT("nested.innerCount", { n: String(nestedInnerCount(clip)) })}
                </span>
              </div>
              {speedRejectFields.length > 0 && (
                <p className="nested-panel-warn">
                  {nestedSpeedRejectionMessage(i18nT, clip.name ?? clip.id, speedRejectFields)}
                </p>
              )}
              {/* Đợt 21 T4: tạo curve mới (chỉ hiện khi clip chưa có curve). */}
              <NestedCurveCreateEditor trackId={trackId} clip={clip} onMsg={setMsg} />
              {/* Đợt 20 R4: chế độ áp curve (chỉ hiện khi clip đã mang curve). */}
              <NestedCurveModeEditor trackId={trackId} clip={clip} onMsg={setMsg} />
              <div className="nested-panel-row">
                <button
                  onClick={() => {
                    useStore.getState().select({ trackId, clipId: clip.id });
                  }}
                >
                  {i18nT("nested.selectOnTimeline")}
                </button>
                <button onClick={() => setOpenId(open ? null : clip.id)}>
                  {open ? i18nT("nested.hideInside") : i18nT("nested.viewInside")}
                </button>
                <button onClick={() => setBoundaryId(boundaryId === clip.id ? null : clip.id)}>
                  {i18nT("nestedBoundary.button")}
                </button>
                <button onClick={() => doUnnest(trackId, clip.id)}>{i18nT("nested.unnest")}</button>
              </div>
              {boundaryId === clip.id && (
                <NestedBoundaryEditor
                  key={`${clip.id}:${readNestedBoundary(clip).opacity ?? ""}:${readNestedBoundary(clip).transitionIn?.type ?? ""}:${readNestedBoundary(clip).transitionIn?.duration ?? ""}:${readNestedBoundary(clip).transitionOut?.type ?? ""}:${readNestedBoundary(clip).transitionOut?.duration ?? ""}`}
                  hostTrackId={trackId}
                  clip={clip}
                  onMsg={setMsg}
                />
              )}
              {open && (
                <div className="nested-inner">
                  <p className="nested-panel-note">{i18nT("nested.innerHead")}</p>
                  {clip.subSpec.tracks.map((t) => (
                    <div key={t.id} className="nested-inner-track">
                      <span className="nested-inner-track-label">
                        {t.label ?? t.kind}:
                      </span>{" "}
                      {t.clips.map((c) => (
                        <InnerClipEditor
                          key={`${t.id}:${c.id}:${c.start}:${c.duration}:${(c as { text?: string }).text ?? ""}`}
                          hostTrackId={trackId}
                          nestedId={clip.id}
                          innerTrackId={t.id}
                          clip={c}
                          onMsg={setMsg}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && <p className="nested-panel-msg">{msg}</p>}
    </div>
  );
}
