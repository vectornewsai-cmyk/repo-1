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
 * Đợt 23 G2: (a) đường tạo curve dùng helper dịch-tại-điểm-toast
 * (nestedCurveCreateTwoLevelMessage) nên không còn ráp toast từ chuỗi
 * Việt nội bộ của cổng; (b) InnerClipEditor thêm nút đặt curve 1× cho
 * lá trực tiếp qua store action sâu (chain rỗng) — đường bấm sống tới
 * cổng lá, store toast đúng nhánh khi bị chặn (xem LIMITS G2).
 *
 * Đợt 24 H6: (a) DeepInnerLevel duyệt đệ quy "Xem bên trong" xuống
 * mọi tầng: lá sâu hơn 1 tầng (chain ≥ 1) nay có cùng nút "Đặt curve
 * 1× cho lá" qua store action sâu với chainIds đúng (không còn chỉ lá
 * trực tiếp); bị chặn thì store toast đúng nhánh + panel giữ dòng msg
 * từ res.reason (API hiện có: reason + reasonKey — luồng H2 đợt 24
 * chưa đổi store sang trả check object trên đĩa này, nên chưa dùng
 * check object; xem LIMITS H6). (b) Giới hạn trung thực: nút preset
 * 1× không tự sinh được leafSelfCurveInvalid / ancestorKeyframeProduct
 * từ trạng thái chỉ tạo bằng panel (preset luôn hợp lệ, tích với 1×
 * bằng đúng keyframe tổ tiên đã hợp lệ) — 3 nhánh chỉ tới được qua
 * nút khi project đã có sẵn curve tổ tiên/lá vi phạm (import/MCP/dựng
 * tay); test khóa đủ 3 nhánh ở tầng store action với chain sâu.
 * Đợt 25 I3: panel lá sâu chuyển sang check object (setLeafCurve
 * dịch lại từ res.twoLevelCheck thay vì phụ thuộc chuỗi res.reason;
 * store vẫn trả reason + reasonKey để tương thích) và nested trung
 * gian tầng sâu sửa được vị trí qua action mới
 * updateNestedDeepIntermediateClip (đóng nợ H6; key i18n của ghi chú
 * giới hạn cũ đã dọn ở đợt 27 K6).
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
  nestedSpeedRejectionMessageForClip,
  translateTwoLevelCheck,
} from "./nestedRejection";
import {
  createNestedCurvePreset,
  nestedCurveCreateBlock,
  nestedCurveCreateTwoLevelMessage,
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
  chainIds,
  innerTrackId,
  clip,
  onMsg,
}: {
  hostTrackId: string;
  nestedId: string;
  /** Chain từ con trực tiếp của top xuống nested chứa trực tiếp clip này ([] = lá trực tiếp). Đợt 24 H6. */
  chainIds: string[];
  innerTrackId: string;
  clip: Clip;
  onMsg: (msg: string) => void;
}) {
  const [start, setStart] = useState(clip.start);
  const [duration, setDuration] = useState(clip.duration);
  const [text, setText] = useState((clip as { text?: string }).text ?? "");
  const [outerOffset, setOuterOffset] = useState("");
  const isText = clip.kind === "text";

  /**
   * Đợt 23 G2 — đặt curve hằng 1× lên lá TRỰC TIẾP này qua store action
   * sâu (chain rỗng). Đợt 24 H6 — cùng nút này, với chainIds của tầng
   * chứa trực tiếp lá, phục vụ cả lá sâu (chain ≥ 1, qua DeepInnerLevel):
   * khi bất kỳ tầng tổ tiên nào trong chain đã mang curve mà cặp lá ×
   * tổ tiên vi phạm R1, cổng lá từ chối và store tự toast đúng nhánh
   * (8 nhánh, xem LIMITS G2) + trả check object (twoLevelCheck) kèm
   * reason/reasonKey để panel hiện dòng msg bền vững từ check (đợt
   * 25 I3); lệnh bị chặn không qua execCommand nên không sinh undo.
   * Lá đã có curve thì nút ẩn (hiện ghi chú) thay vì đặt
   * đè. Clip con là nested (kind "nested") không phải lá nên không
   * hiện nút — duyệt sâu hơn qua DeepInnerLevel, không qua nút này.
   */
  const leafCurve = (clip as unknown as { speedKeyframes?: SpeedCurve }).speedKeyframes;
  const hasLeafCurve = !!leafCurve && leafCurve.keyframes.length > 0;
  const setLeafCurve = () => {
    const res = useStore.getState().updateNestedDeepInnerClip(hostTrackId, nestedId, chainIds, innerTrackId, clip.id, {
      speedKeyframes: createNestedCurvePreset(),
    });
    if (res.ok) {
      onMsg(i18nT("nested.deepLeafCurveOk"));
    } else if (res.twoLevelCheck) {
      // Đợt 25 I3 — hiển thị từ CHECK OBJECT mà store trả kèm (đợt
      // 24 H2), không phụ thuộc chuỗi reason: dịch lại theo
      // reasonCode tại thời điểm hiển thị rồi ráp đúng câu bọc
      // nested.deepLeafTwoLevel mà store dùng cho toast (cùng key,
      // cùng tên top, cùng bản dịch) nên dòng msg bền vững giữ
      // nguyên nội dung như trước, chỉ đổi kênh nhận diện nhánh.
      // reasonKey đi kèm check (caller cần nhận diện nhánh thì dùng
      // key, panel không render key thô ra UI).
      const topClip = useStore
        .getState()
        .spec.tracks.find((t) => t.id === hostTrackId)
        ?.clips.find((c) => c.id === nestedId);
      const topName = (topClip as unknown as { name?: string } | undefined)?.name ?? nestedId;
      onMsg(
        i18nT("nested.deepLeafTwoLevel", {
          name: topName,
          reason: translateTwoLevelCheck(i18nT, res.twoLevelCheck),
        }),
      );
    } else if (res.reason) {
      // Tương thích: lỗi không phải cổng lá (không có check) thì
      // store không trả check — panel giữ chuỗi reason trả về, và
      // KHÔNG tách nhánh nào khỏi chuỗi này.
      onMsg(res.reason);
    } else {
      onMsg(i18nT("nested.innerSaveFail"));
    }
  };

  /**
   * Đợt 25 I2 — tách lá tại mốc NGOÀI: user nhập thời gian trên
   * timeline ngoài của nested cha (đã gồm top.start — cùng khung với
   * cửa sổ tuyệt đối của lá; nút "Lấy từ playhead" điền sẵn playhead
   * hiện tại vì playhead cũng ở khung tuyệt đối đó). Panel chỉ gọi
   * store action mới splitNestedDeepInnerClipAtOuterOffset — action
   * đổi mốc qua nestedSplitOffset (đảo τ đợt 24 H1) rồi tách bằng hàm
   * thuần cũ. Bị chặn thì store đã toast + trả reason, panel chỉ giữ
   * dòng msg bền vững (cùng mẫu nút curve 1×). Không có DOM test
   * runner nên phần component này chỉ kiểm chứng bằng tsc + vite
   * build như các đợt trước; tầng store được khóa bằng test I2.
   * Đợt 27 K6: ô rỗng / không phải số được chặn riêng tại panel
   * (câu splitOffsetEmpty, không gọi store) và khóa bằng click-test
   * browser thật (harness clicktest-k6-round27-pipe).
   */
  const usePlayheadOffset = () => {
    setOuterOffset(String(useStore.getState().playhead));
  };
  const splitAtOuterOffset = () => {
    const raw = outerOffset.trim();
    if (raw === "" || !Number.isFinite(Number(raw))) {
      // Đợt 27 K6: ô rỗng / không phải số thì chặn riêng tại panel —
      // không gọi store (tránh Number("") = 0 bị dịch thành câu
      // OutOfRange gây hiểu lầm), không toast (msg ngay cạnh ô nhập
      // đã đủ, theo tiền lệ action trung gian không tự toast),
      // không sinh undo.
      onMsg(i18nT("nested.splitOffsetEmpty"));
      return;
    }
    const res = useStore.getState().splitNestedDeepInnerClipAtOuterOffset(
      hostTrackId, nestedId, chainIds, innerTrackId, clip.id, Number(raw),
    );
    if (res.ok) {
      onMsg(i18nT("nested.splitOffsetOk", { t: fmtTime(res.leafLocalTime ?? 0) }));
    } else if (res.reason) {
      // Store đã toast (trừ lỗi lookup/khóa); panel giữ dòng msg.
      onMsg(res.reason);
    } else {
      onMsg(i18nT("nested.innerSaveFail"));
    }
  };

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
      {clip.kind !== "nested" &&
        (hasLeafCurve ? (
          <span className="nested-panel-note">{i18nT("nested.deepLeafCurveHas")}</span>
        ) : (
          <button onClick={setLeafCurve}>{i18nT("nested.deepLeafCurveButton")}</button>
        ))}
      {clip.kind !== "nested" && (
        <>
          <label>
            {i18nT("nested.splitOffsetLabel")}{" "}
            <input
              type="number"
              step="any"
              value={outerOffset}
              aria-label={i18nT("nested.splitOffsetLabel")}
              onChange={(e) => setOuterOffset(e.target.value)}
            />
          </label>
          <button onClick={usePlayheadOffset}>{i18nT("nested.splitOffsetUsePlayhead")}</button>
          <button onClick={splitAtOuterOffset}>{i18nT("nested.splitOffsetButton")}</button>
        </>
      )}
    </div>
  );
}

/**
 * Đợt 25 I3 — sửa vị trí (start/duration) của 1 nested TRUNG GIAN ở
 * tầng sâu qua store action mới updateNestedDeepIntermediateClip
 * (parentChainIds = chain tới tầng chứa trực tiếp đích). Component
 * remount theo key start/duration ở phía parent như InnerClipEditor
 * để input không kẹt giá trị cũ sau khi lưu. Lỗi cổng hai tầng của
 * chính đích: action trả reason đã dịch + reasonKey + check nguyên;
 * panel hiển thị reason trả về (không tách chuỗi, không toast trùng
 * vì action này không tự toast — xem store.ts).
 */
function DeepIntermediateEditor({
  hostTrackId,
  topId,
  parentChainIds,
  innerTrackId,
  clip,
  onMsg,
}: {
  hostTrackId: string;
  topId: string;
  /** Chain tới tầng chứa trực tiếp đích (cùng quy ước hàm thuần sâu). */
  parentChainIds: string[];
  innerTrackId: string;
  clip: NestedClip;
  onMsg: (msg: string) => void;
}) {
  const [start, setStart] = useState(clip.start);
  const [duration, setDuration] = useState(clip.duration);
  const save = () => {
    const res = useStore.getState().updateNestedDeepIntermediateClip(hostTrackId, topId, parentChainIds, innerTrackId, clip.id, {
      start,
      duration,
    });
    if (!res.ok) {
      onMsg(res.reason ?? i18nT("nested.innerSaveFail"));
    } else if (res.curveDropped > 0) {
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
        📦 {clip.name ?? clip.id} ({fmtTime(clip.start)}–{fmtTime(clip.start + clip.duration)})
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
      <button onClick={save}>{i18nT("nested.innerSave")}</button>
    </div>
  );
}

/**
 * Đợt 24 H6 — duyệt đệ quy các tầng bên trong một nested clip.
 *
 * Ngữ nghĩa chainIds (khớp resolveDeepLevels của hàm thuần sâu): chain
 * là id các nested TRUNG GIAN từ con trực tiếp của top xuống nested
 * chứa trực tiếp lá đang hiển thị. Với chính top thì chainIds = [];
 * với nested con N1 của top thì chainIds = ["N1"]; với N2 trong N1 thì
 * ["N1", "N2"]. Lá ở tầng này gọi InnerClipEditor với đúng chainIds
 * đó nên nút "Đặt curve 1× cho lá" đi qua cổng lá với đủ tầng tổ tiên
 * (không còn rỗng như G2 khi lá sâu hơn 1 tầng).
 *
 * Nested trung gian: ở tầng trực tiếp của top (chainIds = []) vẫn giữ
 * nguyên InnerClipEditor cũ (lưu start/duration qua updateNestedInnerClip
 * tầng 1); ở tầng sâu hơn (chainIds ≥ 1) đợt 25 I3 dùng
 * DeepIntermediateEditor (lưu qua action mới
 * updateNestedDeepIntermediateClip, parentChainIds = chainIds) thay
 * cho dòng ghi chú giới hạn của H6 — vị trí trung gian sâu nay sửa
 * được thật (không phải lá nên vẫn không có nút curve). Nút "Xem bên
 * trong" đệ quy mở tầng con của nó. Đệ quy tin cậy cây spec là hữu
 * hạn (như listNestedClips); hàm thuần sâu vẫn chặn vòng lặp/độ sâu
 * > 8 ở tầng store nếu project dị thường.
 */
function DeepInnerLevel({
  hostTrackId,
  topId,
  chainIds,
  nestedClip,
  onMsg,
}: {
  hostTrackId: string;
  topId: string;
  chainIds: string[];
  nestedClip: NestedClip;
  onMsg: (msg: string) => void;
}) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return (
    <div className="nested-inner">
      {chainIds.length > 0 && (
        <p className="nested-panel-note">
          {i18nT("nested.deepLevelHead", { name: nestedClip.name ?? nestedClip.id })}
        </p>
      )}
      {nestedClip.subSpec.tracks.map((t) => (
        <div key={t.id} className="nested-inner-track">
          <span className="nested-inner-track-label">{t.label ?? t.kind}:</span>{" "}
          {t.clips.map((c) => {
            if (isNestedClip(c)) {
              const child = c as unknown as NestedClip;
              const childChain = [...chainIds, c.id];
              const open = openIds.includes(c.id);
              return (
                <div key={`${t.id}:${c.id}`}>
                  {chainIds.length === 0 ? (
                    <InnerClipEditor
                      key={`${t.id}:${c.id}:${c.start}:${c.duration}:${(c as { text?: string }).text ?? ""}`}
                      hostTrackId={hostTrackId}
                      nestedId={topId}
                      chainIds={chainIds}
                      innerTrackId={t.id}
                      clip={c}
                      onMsg={onMsg}
                    />
                  ) : (
                    // Đợt 25 I3: nested trung gian sâu nay sửa được vị
                    // trí qua action mới (thay cho dòng ghi chú giới
                    // hạn của H6; key i18n của ghi chú cũ đã dọn ở
                    // đợt 27 K6).
                    <DeepIntermediateEditor
                      key={`${t.id}:${c.id}:${c.start}:${c.duration}`}
                      hostTrackId={hostTrackId}
                      topId={topId}
                      parentChainIds={chainIds}
                      innerTrackId={t.id}
                      clip={child}
                      onMsg={onMsg}
                    />
                  )}
                  <div className="nested-panel-row">
                    <button onClick={() => toggle(c.id)}>
                      {open ? i18nT("nested.hideInside") : i18nT("nested.viewInside")}
                    </button>
                  </div>
                  {open && (
                    <DeepInnerLevel
                      hostTrackId={hostTrackId}
                      topId={topId}
                      chainIds={childChain}
                      nestedClip={child}
                      onMsg={onMsg}
                    />
                  )}
                </div>
              );
            }
            return (
              <InnerClipEditor
                key={`${t.id}:${c.id}:${c.start}:${c.duration}:${(c as { text?: string }).text ?? ""}`}
                hostTrackId={hostTrackId}
                nestedId={topId}
                chainIds={chainIds}
                innerTrackId={t.id}
                clip={c}
                onMsg={onMsg}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Đợt 19 G3: detector + câu báo dùng chung nằm ở ./nestedRejection.ts
 * (store cũng dùng cho toast đúng thời điểm tách/trim); panel chỉ gọi
 * chúng với i18nT — không còn bản hardcode tiếng Việt riêng như đợt 18.
 * Đợt 22 A: panel dùng dạng clip-aware (ForClip) cho toast effect và
 * dòng cảnh báo bền vững, và dịch reason cổng hai tầng qua
 * translateTwoLevelReason trước khi toast. Đợt 23 G1: đường áp curve
 * trực tiếp (có check nguyên) dịch theo reasonCode trước
 * (translateTwoLevelCheck); đường tạo curve chỉ có chuỗi reason nên
 * vẫn fallback về mapper khớp chuỗi — xem LIMITS đợt 23 G1.
 * Đợt 24 H2: đường tạo curve nay cũng cầm check nguyên
 * (nestedCurveCreateTwoLevelCheck → translateTwoLevelCheck), mapper
 * khớp chuỗi đã xóa — cả hai đường panel đều dịch theo reasonCode.
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
      // Luật T2: chỉ cặp vi phạm R1 mới tới đây. Đợt 23 G2: toast qua
      // helper dịch-tại-điểm-toast (nestedCurveCreateTwoLevelMessage)
      // thay vì tự ráp từ chuỗi tiếng Việt nội bộ của cổng — panel
      // không còn cầm chuỗi Việt thô nên locale en không rò tiếng
      // Việt. Helper trả null chỉ khi không còn ở nhánh này (không
      // xảy ra vì block vừa kiểm tra), fallback câu chung phòng thủ.
      const msg =
        nestedCurveCreateTwoLevelMessage(i18nT, clip) ??
        i18nT("nested.curveTwoLevel", { name: clip.name ?? clip.id });
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
        // Đợt 23 G1: dịch theo reasonCode của check trước, fallback
        // mapper khớp chuỗi khi code vắng (xem nestedRejection.ts).
        const msg = i18nT("nested.curveTwoLevelInvalid", {
          name: clip.name ?? clip.id,
          reason: translateTwoLevelCheck(i18nT, chk),
        });
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
        // locale hiện tại); đợt 22 A đóng nốt đuôi tiếng Việt của nhánh
        // hai tầng (store dịch reason cổng trước khi trả về).
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
      // Đợt 22 A: toast clip-aware — nêu đúng lý do từng case thay vì
      // lý do chung của dạng fields-only (fields vẫn dùng cho key).
      pushToast(nestedSpeedRejectionMessageForClip(i18nT, clip, clip.name ?? clip.id), "error");
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
                  {nestedSpeedRejectionMessageForClip(i18nT, clip, clip.name ?? clip.id)}
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
                  {/* Đợt 24 H6: duyệt đệ quy thay cho liệt kê 1 tầng cũ — lá sâu
                      nhận đúng chainIds, nested trung gian có nút "Xem bên trong"
                      riêng để mở tầng con của nó. */}
                  <DeepInnerLevel
                    hostTrackId={trackId}
                    topId={clip.id}
                    chainIds={[]}
                    nestedClip={clip}
                    onMsg={setMsg}
                  />
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
