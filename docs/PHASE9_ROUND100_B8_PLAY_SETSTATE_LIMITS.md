# PHASE9_ROUND100_B8_PLAY_SETSTATE_LIMITS — Vì sao chỉ 1–2/17 lệnh `play()` tới được GStreamer dạng `set_state`

> Luồng B8, đợt 100. Nợ LIMITS gộp đợt 99 §4 mục 2 ("vì sao chỉ 1–2/17 lệnh
> `play()`/`pause()` tới được GStreamer dưới dạng `set_state` — cần đọc code
> WebKit, ngoài phạm vi probe page").
> Repo `~/workspace/repo-1` (cây làm việc). **KHÔNG push. KHÔNG release/tag.**
> **B8 KHÔNG sửa file production nào** — chỉ đọc code + phân tích lại log A4 +
> một thí nghiệm GStreamer cục bộ (ctypes, không đụng app). Tài liệu này là
> file duy nhất của B8 trong repo.

## 0. Verdict ngắn

- **Câu hỏi đã trả lời được ở mức cơ chế: các lệnh `play()` bị hấp thụ ở
  tầng WebKit (HTMLMediaElement → MediaPlayer → MediaPlayerPrivateGStreamer),
  KHÔNG phải ở tầng GStreamer.** Bằng chứng quyết định là thí nghiệm trực tiếp
  trên GStreamer 1.24.2 (§2): `gst_element_set_state` ghi log `set_state to X`
  trên **mọi** lần gọi, kể cả gọi trùng trạng thái hiện tại (no-op, trả về
  SUCCESS + dòng `element is already in the ... state`). Trong log A4, pipeline
  media (`blob-media-player-6`) có **0 dòng `already in state`** ở cả 2 lượt —
  tức WebKit chưa từng gọi thừa; số lệnh gọi thật chỉ là 1–2, không phải 17
  lệnh bị GStreamer gộp.
- **Đã đọc được 5 cửa chặn trong code WebKit** (main @ `223e7828`, 2026-11-12,
  §3): (M1) `play()` chỉ lật cờ `m_paused` đồng bộ, lệnh pipeline đi qua
  admission MediaSession **bất đồng bộ**; (M2) khi admission về,
  `updatePlayState()` tính lại `shouldBePlaying` từ `m_paused` hiện tại —
  probe đã re-pause thì lệnh play bị nuốt; (M3) `updatePlayState()` chỉ gọi
  `playPlayer()`/`pausePlayer()` khi `player->paused()` đổi trạng thái, mà
  `paused()` trả về cờ lạc quan `!m_isPipelinePlaying`, không phải trạng thái
  GST thật; (M4) `MediaPlayerPrivateGStreamer::play/pause/changePipelineState`
  từ chối khi pipeline đang chờ preroll, và `pause()` bỏ qua khi pipeline chưa
  tới PAUSED; (M5) mỗi `play()` mới `disconnect()` admission đang bay của
  lệnh `play()` trước — dưới tải, admission gần như không bao giờ kịp về
  trước khi lệnh tiếp theo tới.
- **Đính chính số đếm của A4 (§4): con số "1 PLAYING + 0 PAUSED (r2) /
  1+1 (r3) trong cửa sổ freeze" phụ thuộc vào anchor giờ GST↔wall mà A4
  không kiểm chứng được** ("lệnh PLAYING đầu tiên ≈ lúc bấm phát"). Đọc lại
  toàn bộ timeline thì: r2 cả lượt pipeline chỉ nhận **4 PLAYING + 4 PAUSED**,
  r3 **6 PLAYING + 5 PAUSED** — dù anchor dịch vài giây theo hướng nào, số
  lệnh trong/near cửa sổ freeze vẫn chỉ là 1–2 so với 17/11 lệnh JS. **Kết
  luận "1–2/17" là chắc chắn; con số PAUSED chính xác trong cửa sổ (0 hay 1)
  thì không chắc chắn.** Thêm phát hiện mới: poll `get_state` cho thấy
  pipeline đang **PAUSED ngay trước cửa sổ freeze** (r2: GST 124,25–124,28) —
  tức **ngay cả lệnh play() ban đầu lúc bắt đầu phát (relPlay 0) cũng không
  tới được pipeline ngay**; ct nhích 0→0,5 trước freeze là do `syncMedia`
  seek trên pipeline đang PAUSED, không phải pipeline đang phát.
- **Còn thiếu (§5):** dưới mọi anchor, lệnh PAUSED vẫn lệch **~200–600 ms**
  so với lệnh `el.pause()` gần nhất, trong khi đường pause của WebKit là đồng
  bộ — chưa giải thích được. Nghi vấn mạnh nhất còn mở: đường **suspend**
  (video muted + ngoài viewport → WebKit tự `set_state` trực tiếp, đặt lại
  cờ `m_isPipelinePlaying`) — element của MediaPool **đã xác nhận là
  `muted=true`** (`media.ts:147,190`), config `scroll-blur` có cuộn trang —
  nhưng log A4 **không bật category `webkitmediaplayer`** nên mọi quyết định
  nội bộ của WebKit đều mù trong log. Cần một probe xác nhận theo recipe ở
  §6; B8 không chạy probe đó vì VM đã bị thay mới giữa chừng (GStreamer hệ
  thống biến mất, §1) và máy đang tải.

## 1. Phương pháp, nguồn, môi trường

- **Boot id:** lúc bắt đầu `66fb273d-6b9f-4fe5-ba13-dc5165a5d6bd`; **VM bị
  reboot/thay mới giữa chừng** — lúc kết thúc boot id là
  `aa3f2b67-7aa9-497a-bc8c-6c2973417b10`, uptime 7 phút, GStreamer hệ thống
  (1.24.2, `gst-launch-1.0`) **không còn tồn tại** trên VM mới. Mọi lệnh đọc
  log A4 + code WebKit đều làm trước reboot; thí nghiệm ctypes (§2) chạy
  trước reboot, log gốc mất theo `/tmp` — số liệu §2 được chép lại từ output
  đã đọc trực tiếp lúc chạy, script thí nghiệm còn nguyên trong
  `hidden_files/round100-b8/gst_setstate_calls_test.py` (chạy lại được sau khi
  cài lại GStreamer).
- **Code WebKit:** clone nông GitHub mirror `WebKit/WebKit`, main @
  `223e78283cfae80cd4b65c9b0f7512d43f3d110e` (2026-11-12 12:37 -0800), chỉ đọc,
  sparse-checkout các file: `Source/WebCore/html/HTMLMediaElement.{cpp,h}`,
  `Source/WebCore/platform/graphics/MediaPlayer.{cpp,h}`,
  `Source/WebCore/platform/graphics/gstreamer/MediaPlayerPrivateGStreamer.{cpp,h}`,
  `Source/WebCore/html/MediaElementSession.cpp`. Lưu ý: bản Playwright dùng
  là webkit-2388 / Version 27.2 — main 2026-11-12 là bản gần nhất, không phải
  đúng revision của build đó; các hàm liên quan (`play/pause/updatePlayState`,
  `changePipelineState`) có hình dạng ổn định nhiều năm, nhưng số dòng chỉ
  đúng với main đã đọc. `MediaPlayerPrivateGStreamerBase` đã được gộp vào
  `MediaPlayerPrivateGStreamer.cpp` ở main này.
- **Dữ liệu A4 đọc lại:** `hidden_files/round99-a4/wk-paused-r{2,3}/`
  (`frame-parity-results.json`, `gst.log`, `frame-parity-log.txt`) +
  `analyze99a4.mjs` + probe `apps/web/scripts/probe99a4-watchdog-paused.mjs`
  (đọc code probe để biết chính xác thời điểm ghi `pausedAt` và cơ chế
  re-pause: `setInterval` 5 ms danh nghĩa, flip và `el.pause()` cùng một
  callback — tức lệnh pause xảy ra gần như đúng thời điểm `flipEvents[].t`).
- **Không chạy probe WebKit mới.** Lý do: (a) câu hỏi cốt lõi đã trả lời
  được bằng code + log cũ + thí nghiệm GST; (b) VM mới không còn GStreamer
  hệ thống nên probe WebKit không chạy được cho tới khi cài lại; (c) máy đang
  tải (các luồng đợt 100 khác đang chạy).

## 2. Thí nghiệm quyết định: GST log ghi MỌI lần gọi `set_state`

Mục đích: phân biệt "WebKit gọi 17 lần nhưng GStreamer gộp" với "WebKit chỉ
gọi 1–2 lần". Dùng `ctypes` gọi thẳng `libgstreamer-1.0.so.0` (1.24.2):
pipeline `videotestsrc ! fakesink`, gọi `set_state` 5 lần cách nhau 300 ms
với `GST_DEBUG=GST_STATES:5`.

| Lần gọi | Trả về | Dòng `set_state to` cho `pipeline0` |
|---|---|---|
| PLAYING | ASYNC (2) | có — `0:00:00.048 ... set_state to PLAYING` |
| PLAYING lần nữa (đã PLAYING) | SUCCESS (1) | **có** — `0:00:00.357 ... set_state to PLAYING` + dòng `element is already in the PLAYING state` |
| PAUSED | SUCCESS (1) | có — `0:00:00.657 ... set_state to PAUSED` |
| PAUSED lần nữa (đã PAUSED) | SUCCESS (1) | **có** — `0:00:00.958 ... set_state to PAUSED` + dòng `element is already in the PAUSED state` |
| PLAYING lần 2 | SUCCESS (1) | có — `0:00:01.258 ... set_state to PLAYING` |

Kết luận: **dòng `set_state to X` trong `GST_STATES` là log ở đầu hàm
`gst_element_set_state_func`, ghi trên mọi lần gọi kể cả no-op.** Do đó số
đếm của analyzer A4 (regex khớp chính dòng này) là **số lần WebKit gọi
`gst_element_set_state`**, không phải số lần pipeline chuyển trạng thái thật.

Đối chiếu log A4: pipeline `blob-media-player-6` có **0 dòng
`element is already in the ... state`** ở cả r2 (357 dòng `already` trong
toàn log đều thuộc pipeline khác) và r3 (403 dòng, 0 của -6). WebKit không
những không gọi thừa — nó gần như không gọi. **GStreamer được loại trừ khỏi
danh sách nghi phạm.**

## 3. Năm cửa chặn trong code WebKit (đường đi `play()` → `set_state`)

### M1 — `play()` lật cờ JS đồng bộ, lệnh pipeline đi đường admission bất đồng bộ

`HTMLMediaElement::playInternal()` (`HTMLMediaElement.cpp:4766`):

- `if (didTransitionFromPaused) { setPaused(false); ... scheduleEvent(playEvent); }`
  — `el.paused` lật `true→false` **ngay trong lệnh `play()`**, trước mọi
  admission. Đây là flip mà probe đếm (17/17).
- Lệnh pipeline chỉ xảy ra trong `completePlayInternal()` → `updatePlayState()`,
  mà `completePlayInternal` chỉ chạy trong callback `onAdmissionSettled` của
  `mediaSession->clientWillBeginPlayback()->whenSettled(RunLoop::mainSingleton(), …)`
  (`:4889`). `MediaElementSession::clientWillBeginPlayback()`
  (`MediaElementSession.cpp:281`) lại bọc thêm **một** `whenSettled` nữa trên
  promise của `PlatformMediaSession` — tức ít nhất **2 hop runloop** (hoặc
  hơn nếu platform session làm IPC) giữa `play()` và lệnh pipeline. Ngoại lệ
  duy nhất: nếu `mediaSession->state() == Playing` sẵn thì chạy inline
  (`:4886`).

### M2 — Khi admission về, `updatePlayState()` tính lại từ `m_paused` hiện tại

`updatePlayState()` (`:7016`): `shouldBePlaying = potentiallyPlaying()`,
mà `potentiallyPlaying()` → `couldPlayIfEnoughData()` trả `false` ngay khi
`paused()` là true. Nhánh forward chỉ gọi `playPlayer()` khi
`shouldBePlaying && playerPaused`. Probe re-pause sau mỗi flip 46–180 ms
(r2) / 129–310 ms (r3) — nếu admission về **sau** re-pause, `updatePlayState`
thấy `shouldBePlaying == false` và **lệnh play bị nuốt hoàn toàn**: không có
`playPlayer()`, không có `set_state`, không để lại dấu vết nào trong log GST.
Đây là cửa chặn chính, khớp với nhịp tick: mỗi lượt chỉ lệnh nào có admission
về kịp trước re-pause tiếp theo mới thoát được.

### M3 — Cờ lạc quan `m_isPipelinePlaying` khiến `updatePlayState()` bỏ qua lệnh trùng

`MediaPlayer::paused()` (`MediaPlayer.cpp:909`) → `MediaPlayerPrivateGStreamer::paused()`
(`MediaPlayerPrivateGStreamer.cpp:562`): **luôn trả về `!m_isPipelinePlaying`** —
cờ do WebKit tự đặt trong `changePipelineState()` (`:1227`, sau khi gọi
`gst_element_set_state`), không phải trạng thái GST thật (trạng thái thật chỉ
được dùng cho `ASSERT` ở build debug). `updatePlayState()` chỉ gọi
`playPlayer()` `if (playerPaused)` và chỉ gọi `pausePlayer()`
`if (!playerPaused)`. Hệ quả: sau một lệnh PLAYING đã phát ra, mọi `play()`
tiếp theo đều bị bỏ qua ở tầng element cho tới khi một lệnh PAUSED phát ra
lật cờ lại — và ngược lại. Cờ này là "chốt": một khi một lệnh play bị nuốt
(M2) trong lúc cờ đang là "paused", mọi re-pause sau đó cũng bị bỏ qua
(`playerPaused == true` → không gọi `pausePlayer()`), nên không có lệnh
PAUSED nào được phát ra để mở chốt cho lệnh play sau.

### M4 — Cửa chặn trong `MediaPlayerPrivateGStreamer::play/pause/changePipelineState`

- `play()` (`:490`): nếu `!m_playbackRate` → return luôn; nếu
  `isPipelineWaitingPreroll()` (chuyển trạng thái ASYNC đang chờ, current
  PAUSED + pending ≥ PAUSED) → đặt `m_playbackRatePausedState =
  ShouldMoveToPlaying` và **return không gọi `set_state`** (lệnh play được
  hoãn tới khi `updateStates()` xử lý buffering xong, `:3138`).
- `changePipelineState()` (`:1189`): nếu `isPipelineWaitingPreroll(...)` →
  trả `Rejected`, **không gọi `gst_element_set_state`**. (Trong log A4 không
  có dòng nào chứng minh/từ chối cửa này — xem §5: category ghi các dòng
  này không được bật.)
- `pause()` (`:542`): `gst_element_get_state(...)`; nếu
  `currentState < PAUSED && pendingState <= PAUSED` → **return luôn** (pipeline
  chưa tới PAUSED thì không cần pause). Đây là lý do lệnh pause ở đầu cửa sổ
  freeze là no-op: pipeline vốn đã PAUSED (xem §4).

### M5 — Mỗi `play()` mới hủy admission của lệnh trước

`playInternal()`: `if (m_beginPlaybackRequest->hasCallback())
m_beginPlaybackRequest->disconnect();` trước khi tạo admission mới; tương tự
`pauseInternal()` hủy admission đang bay (trừ khi `m_playPromiseSettlementGuaranteed`).
Với các lệnh play cách nhau 88–399 ms (r2) và admission cần ≥2 hop runloop
dưới tải (loadavg 4,7–15, main thread bị throttle tới ~350 ms/lượt quan sát),
đa số admission bị hủy trước khi kịp về. Chỉ lệnh nào có khoảng trống đủ dài
trước lệnh tiếp theo — hoặc gặp session đã ở trạng thái Playing (đường
inline) — mới thoát được. Khớp với quan sát: chỉ lệnh play **đầu tiên** của
cửa sổ là lệnh thoát được (dưới cả hai anchor, §4).

### Các đường khác đã kiểm tra (không phải nguyên nhân)

- `GST_MESSAGE_CLOCK_LOST` (`:2420`): gọi thẳng `gst_element_set_state`
  PAUSED rồi PLAYING — nhưng không có bằng chứng clock-lost trong log, và
  nó tạo ra cặp PAUSED+PLAYING chứ không nuốt lệnh.
- `checkPlayingConsistency()` (`:5044`): chỉ can thiệp một lần khi sink chưa
  PLAYING dù pipeline đã PLAYING.
- Đường suspend (`:4328`–`:4390`): xem §5 — là nghi vấn mở, không phải kết
  luận.

## 4. Đối chiếu lại số đếm A4 — đính chính anchor

### 4.1 Timeline đầy đủ (không phụ thuộc anchor)

Trích bằng regex của analyzer A4 trên `gst.log` (script tái tạo:
`hidden_files/round100-b8/analyze_b8.py`, output
`hidden_files/round100-b8/b8-media-timelines.txt`).

r2 — pipeline media `blob-media-player-6`, cả lượt (12 lệnh `set_state`):

| GST (s) | Lệnh |
|---|---|
| 2,415 | PAUSED (preroll lúc load) |
| 124,828 | PLAYING |
| 128,105 | PAUSED |
| 128,512 | PLAYING |
| 128,899 | PAUSED |
| 131,524 | PLAYING |
| 134,310 / 134,388 | READY / PAUSED (load clip mới) |
| 135,186 | PLAYING |
| 138,098 / 138,340 | PAUSED / READY |
| 146,035 | NULL |

r3 — `blob-media-player-6`, cả lượt (16 lệnh):

| GST (s) | Lệnh |
|---|---|
| 3,069 | PAUSED (preroll lúc load) |
| 132,074 | PLAYING |
| 140,443 | PAUSED |
| 144,459 | PLAYING |
| 147,244 | PAUSED |
| 148,378 | PLAYING |
| 148,560 / 148,855 | READY / PAUSED |
| 150,861 | PLAYING |
| 151,942 | PAUSED |
| 153,152 | PLAYING |
| 155,956 | PAUSED |
| 156,901 | PLAYING |
| 159,590 / 159,685 | READY / PAUSED |
| 164,280 | NULL |

Các pipeline khác (`blob-media-player-0`…`-5`): mỗi cái chỉ 2 lệnh
(PAUSED lúc tạo trong GST 0,09–2,75 s rồi NULL lúc 0,8–2,8 s) — là element
của MediaPool tạo lúc load rồi hủy sớm; **chỉ -6 sống tới cuối lượt**, nên
-6 đúng là pipeline của element bị freeze. Tổng cả lượt: r2 **4 PLAYING +
4 PAUSED**, r3 **6 PLAYING + 5 PAUSED** — so với 17/11 lệnh JS trong cửa sổ
2,5 s. Nhịp `set_state` trong log không bao giờ tiệm cận nhịp JS
(88–399 ms): cặp PLAYING→PAUSED gần nhất là 387–405 ms, còn lại cách nhau
hàng giây. **Chênh lệch 17→1–2 là chắc chắn, không phụ thuộc anchor.**

### 4.2 Anchor GST↔wall không vững — số "trong cửa sổ" của A4 phải đính chính

A4 neo giờ bằng giả định "lệnh PLAYING đầu tiên của pipeline ≈ lúc bấm
phát", cho cửa sổ freeze r2 = GST [129,49, 132,01] → 1 PLAYING + 0 PAUSED.
Giả định này **không kiểm chứng được**:

- File `gst.log` có `birth` 17:51:25,211Z (r2) / 17:59:09,243Z (r3), trong khi
  giờ bắt đầu phát suy từ `pausedWall − pausedAt` là 17:53:41,470Z (r2) /
  18:01:33,218Z (r3) và `playT0rel` 120,133 s / 120,492 s → page load ≈
  17:51:41,3Z / 17:59:32,7Z. File birth sớm hơn page load 16,1 s / 23,5 s —
  file được tạo bởi tiến trình khác (browser/UI process lúc khởi động) chứ
  không phải WebProcess, nên **birth không phải GST0**.
- Cả 7 pipeline đều được tạo trong GST 0,09–3,07 s — app tạo MediaPool lúc
  mount (page load). Nếu GST0 ≈ lúc khởi động browser (sớm hơn page load
  ~3,3 s ở r2 — khoảng launch→navigation rất hợp lý), thì play-start GST r2
  ≈ 123,44 và cửa sổ freeze = GST [128,13, 130,66] → **1 PLAYING (128,512)
  + 1 PAUSED (128,899)**. Nếu GST0 ≈ page load (giả định của A4) thì cửa sổ
  = [124,79, 127,32] → **1 PLAYING (124,828) + 0 PAUSED**. Hai anchor đều
  hợp lý, cho số PAUSED khác nhau; r3 còn bất định hơn (launch→navigation
  ~23 s theo birth, cửa sổ có thể chứa 0 lệnh).
- Hệ quả: **giữ kết luận "chỉ 1–2/17", bỏ con số PAUSED chính xác trong cửa
  sổ** (0 hay 1 tùy anchor). A4 §3 nên được đọc với đính chính này.

### 4.3 Phát hiện mới: pipeline đã PAUSED trước cả cửa sổ freeze

Poll `gst_element_get_state` cho -6 (do chính WebKit gọi trong
`paused()`/`isPipelineWaitingPreroll()`), r2:

- GST 124,25–124,28 (ngay trước PLAYING 124,828): **PAUSED, pending
  VOID_PENDING, SUCCESS** — tức trong ~0,8–4,7 s đầu phát (tùy anchor),
  pipeline **chưa từng PLAYING**.
- GST 124,833 (+5 ms sau `set_state` PLAYING): PLAYING; các poll sau đó
  (124,96 / 126,92 / 128,10) đều PLAYING.
- State-changed r2: PAUSED→PLAYING lúc 124,833; 127,909
  `bin_handle_async_start: lost state of PLAYING, new PAUSED` (một sink mất
  preroll — tương quan GST của chính cú freeze); 128,029/128,042 pipeline
  tự về PLAYING **không có lệnh `set_state` nào** (hoàn tất async); 128,114
  PLAYING→PAUSED; 128,514 PAUSED→PLAYING; 129,089 PLAYING→PAUSED.

Đọc đúng: **ngay cả lệnh `play()` ban đầu (relPlay 0) cũng không tới được
pipeline ngay** — nó bị nuốt bởi cùng cơ chế M1/M2/M5 (admission dưới tải),
và ct nhích 0→0,5 trước freeze là do `syncMedia` **seek** trên pipeline
đang PAUSED (seek vẫn đổi `currentTime` khi PAUSED), còn playhead của app
tiến theo đồng hồ rAF riêng. "Freeze" mà probe đo vì thế có thể không phải
"pipeline đang phát thì kẹt", mà là "element chưa bao giờ được pipeline phát
từ đầu". Lệnh PLAYING duy nhất trong cửa sổ — dưới anchor nào thì cũng là
lệnh play-call **đầu tiên** của cửa sổ (+31 ms theo anchor A4, +405 ms theo
anchor launch — cả hai đều tương thích với một admission về kịp trước
re-pause đầu tiên).

## 5. Còn thiếu — chưa giải thích được, không giấu

1. **Lệnh PAUSED lệch ~200–600 ms so với lệnh `el.pause()` gần nhất, dưới
   mọi anchor.** Đường pause của WebKit là đồng bộ (`pause()` →
   `pauseInternal()` → `updatePlayState()` → `pausePlayer()` →
   `changePipelineState()` → `set_state`, không có hop runloop). Probe ghi
   flip và `el.pause()` trong cùng một callback interval (5 ms danh nghĩa),
   nên lệnh PAUSED phải xuất hiện trong vòng ~1 ms sau thời điểm flip. Thực
   tế: r2 PAUSED 128,899 nằm sau flip #1/#2/#3/#4 lần lượt 612/472/295/207 ms
   (anchor launch) — tức 1–3 re-pause đầu đã bị nuốt (phù hợp M3: cờ vẫn
   "paused" vì lệnh play chưa tới pipeline), nhưng re-pause cuối cùng vẫn
   lệch ≥207 ms mà đường đồng bộ không giải thích được. Tương tự ở r3.
   Có thể còn một độ trễ chưa đọc tới (vd: `pause()` bị chặn ở
   `playbackStateChangePermitted` rồi thử lại ở tick sau, hoặc anchor vẫn
   lệch ~0,2–0,6 s), hoặc các lệnh PAUSED đó không phải từ re-pause.
2. **Nghi vấn suspend chưa kiểm chứng được.** Video của MediaPool là
   **muted** (`apps/web/src/media.ts:147,190` — `v.muted = true`), và đường
   suspend (`MediaPlayerPrivateGStreamer.cpp:4328`–`:4390`: muted + ngoài
   viewport → `gst_element_set_state` **trực tiếp** (không qua
   `changePipelineState`) + đặt `m_isPipelinePlaying = false`) có thể phát
   ra / nuốt lệnh `set_state` ngoài đường play/pause thông thường — config
   `scroll-blur` có cuộn trang nên element hoàn toàn có thể ra khỏi viewport
   trong lúc chạy. Nhưng log A4 **không chứa bằng chứng nào** cho hướng này.
3. **Log A4 mù với quyết định nội bộ của WebKit.** `GST_DEBUG` của A4 là
   `GST_STATES:5,playbin:5`. Mọi `GST_DEBUG_OBJECT`/`GST_INFO_OBJECT` của
   WebKit (category **`webkitmediaplayer`**, khởi tạo ở
   `MediaPlayerPrivateGStreamer.cpp:337`) đều **không được ghi**: không có
   dòng nào `Changing state from…`, `Processing playback request`,
   `Pausing`, `rejected state change during preroll` trong cả hai log
   (grep trả về 0 dòng). Vì vậy không thể xác nhận từ log rằng cửa M4
   (preroll reject) hay đường suspend đã kích hoạt bao nhiêu lần — chỉ có
   code chứng minh chúng tồn tại, không có đếm thực nghiệm.
4. **Phiên bản code:** đã đọc main 2026-11-12, không phải đúng revision của
   Playwright webkit-2388. Các cơ chế M1–M5 có hình dạng ổn định nhiều năm,
   nhưng nếu build 2388 khác biệt ở `MediaSession` (đường admission) thì
   M1/M5 cần kiểm lại bằng đúng revision.

## 6. Nợ mở cho đợt sau (probe xác nhận — recipe)

Không sửa production. Probe tiếp theo nên làm **một lần, có kiểm soát**,
thay vì đọc lại log cũ:

1. `GST_DEBUG=GST_STATES:5,playbin:5,webkitmediaplayer:5` (thêm category
   WebKit) để đếm được `changePipelineState`, preroll reject, suspend/resume.
2. Neo giờ chắc chắn: ghi `performance.now()` + `Date.now()` cùng lúc với
   một lệnh `set_state` đã biết (vd: gọi `play()` rồi `pause()` cách nhau
   2 s trên element đơn, không tải), hoặc bật `GST_DEBUG` có timestamp wall
   clock nếu bản GStreamer hỗ trợ — thay vì suy anchor từ file birth.
3. Kiểm tra giả thuyết suspend: log `m_isVisibleInViewport` (qua
   `getBoundingClientRect` trong probe) cùng lúc với các lệnh `set_state`
   lạ; thử chạy với element cố định trong viewport để loại trừ.
4. Kiểm tra giả thuyết "initial play cũng bị nuốt": đếm `set_state` PLAYING
   trong 5 s đầu phát ở lượt chạy nhẹ (không freeze) — nếu = 0 thì freeze
   của Z4/A4 đo được thực chất là element chưa bao giờ phát ở tầng pipeline.
5. Không thử lại birefnet, không đụng TTS 39, không đụng code production
   (luật đợt).

## 7. Batch đã stage (KHÔNG push)

- `phase9-round100-b8-play-setstate.txt` — 1 entry, read-back OK
  (NUL-delimited, 0 binary, 0 workflow):
  - `docs/PHASE9_ROUND100_B8_PLAY_SETSTATE_LIMITS.md` (file này)
- Dữ liệu thô (không nằm trong repo, không đưa vào batch):
  `hidden_files/round100-b8/` — `analyze_b8.py`,
  `b8-media-timelines.txt` (timeline `set_state` đầy đủ r2/r3),
  `gst_setstate_calls_test.py` (thí nghiệm ctypes §2 — chạy lại sau khi cài
  lại GStreamer; log gốc mất theo `/tmp` khi VM bị thay mới, số liệu §2 chép
  từ output đã đọc trực tiếp), `webkit-src/` (source WebKit đã đọc, đã gỡ
  `.git`, còn ~14 MB).
- Không sửa file production nào. Không chạy tsc/vite build/test suite: B8
  không đụng code production hay test (chỉ thêm doc) — để luồng kiểm chứng
  gộp đợt 100 đo trên cây đã gộp.
