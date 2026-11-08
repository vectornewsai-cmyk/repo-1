# Phase 9 — Đợt 65, luồng S9: Registry tên project — sửa nhận nhầm 2 file cùng tên + tự nhận chuỗi legacy phân mảnh — LIMITS

Ngày: 08/11/2026 (lượt cron 15:35 +07). Phạm vi: nợ #9 trong
docs/PHASE9_ROUND64_LIMITS.md §8 (nợ R6 đợt 64) + §1/§4 về R6:
nhận nhầm 2 file khác nhau cùng tên ở lần nhận đầu; chuỗi legacy
phân mảnh chưa tự nhận. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| Lỗi nhận nhầm (nợ #9) | **ĐÃ SỬA.** Luật nhận nay cần bằng chứng nội dung: hash spec file đang mở phải khớp hash nhúng trong id `file-<hash>-<tên>` hoặc hash một version trong chuỗi. Hai file khác tên giống nhau nhưng khác nội dung bị từ chối, khóa legacy giữ nguyên để lần mở đúng file sau còn nhận được — test F1 tái hiện đúng lỗi cũ (FAIL trước sửa, PASS sau sửa). |
| Chuỗi legacy phân mảnh | **ĐÃ THÊM tự nhận.** `adoptLegacyHistoryChain` quét mọi chuỗi legacy trong kho (`HistoryStore.listProjectIds` mới) và nhận thêm mảnh CHẮC CHẮN: mảnh `proj-` (project chưa từng lưu file) có hash trùng spec đang mở; mảnh `file-` đổi tên (hash khớp, tên khác). Mảnh mơ hồ (cùng tên, hash lệch) chỉ báo cáo, không đụng. |
| Bảng quy tắc chắc chắn / mơ hồ | **Ghi rõ trong code + §2 dưới đây.** Chắc chắn: hash khớp (nhúng/version) + spec phi tầm thường; chuỗi rỗng (dọn con trỏ chết). Mơ hồ (từ chối, giữ khóa): thiếu spec, spec rỗng 0 clip, tên khớp nhưng hash lệch. |
| Test | Unit mới **43/43** (cũ 28 + mới 15: F1–F6, G1–G6, H1–H3), chạy 2 lần. Hồi quy: projectHistory 15/15, projectId63R7 27/27, idbCleanup61R9 16/16, projectAssetRefs62R7 28/28, projectRepo 10/10, saveToast31 15/15, loadProject54K1 7/7. |
| tsc | **File của luồng này 0 lỗi; lần chạy cuối 0 lỗi toàn repo.** 3 lỗi TS5097 ở `gopTrialDecode65S6.test.ts` của luồng S6 còn ở lần chạy sau sửa đã được chính luồng S6 sửa trong lúc đợt này chạy (không phải file luồng này, không sửa). |
| vite build | **Pass** (43,61s, chỉ cảnh báo chunk >500 kB có sẵn). |
| i18n | **Không cần key mới.** Mọi reason là mã nội bộ, không hiện ra UI. Không sửa vi.json/en.json, không tạo fragment. |
| Headed | **Chưa đo.** Nợ xem §5.6. |

## 1. Vấn đề gốc (đợt 64 R6 §2.3/§5.1)

Luật nhận cũ (`shouldAdoptLegacyChain`) chỉ so hậu tố tên file đã
sanitize: `file-<hash>-<tên>` được nhận khi hậu tố tên khớp file đang
mở. Hash đầu bị bỏ qua với lý do "hash đổi theo nội dung nên không so
được". Hậu quả: hai file khác nhau cùng tên (khác thư mục) đều khớp
hậu tố — lần nhận đầu tiên gộp nhầm chuỗi lịch sử của file kia vào
project đang mở (version của file B rơi vào chuỗi của file A), rồi khóa
legacy bị xóa nên lần mở sau không còn cơ hội sửa.

Nhận xét làm cơ sở cho đợt này: hash KHÔNG phải "không so được" —
hash nhúng trong id là hash spec lúc mở file lần cuối, và mỗi version
trong chuỗi đều mang field `hash` (= hash spec của snapshot đó). File
đang mở có spec → tính được hash của nó → so được với cả hai nguồn.
Chỉ khi file đã sửa nội dung bên ngoài app từ lần mở cuối thì hash mới
lệch — và đó đúng là trường hợp phải từ chối (không phân biệt được với
file khác cùng tên).

## 2. Thiết kế — luật nhận mới (đợt 65 S9)

### 2.1 Bằng chứng nội dung

- `LegacyAdoptionEvidence` (`lib/projectNameRegistry64R6.ts` §3, thuần,
  chỉ mang hash chuỗi — module giữ nguyên quy ước không import value
  từ file anh em): `openedSpecHash` (hash FNV-1a 8 hex của spec file
  đang mở, cùng thuật toán với `specHash` trong `projectHistory.ts`
  và field `hash` của version), `chainVersionHashes` (hash từng
  version trong chuỗi), `specNonTrivial` (spec đang mở có ≥1 clip).
- Caller (`projectHistory.ts`) tính hash bằng `specHash` sẵn có rồi
  truyền vào; đường mở file (`openProjectFlow.ts`) đưa `res.spec` vào
  `adoptLegacyHistoryChain(..., { spec: res.spec })`.

### 2.2 Bảng quy tắc — chuỗi con trỏ (`decideLegacyAdoption`)

| # | Điều kiện | Kết quả | Lý do |
|---|---|---|---|
| 1 | Hash spec đang mở khớp hash nhúng trong id HOẶC hash một version trong chuỗi (spec ≥1 clip) | **Nhận** | `content-hash-match` |
| 2 | Chuỗi rỗng (0 version) + tên khớp | **Nhận (moved 0)** | `adopted-empty-chain` — không có version nào để nhận nhầm, chỉ dọn con trỏ chết |
| 3 | Tên khớp nhưng caller không đưa spec | **Từ chối, giữ khóa** | `ambiguous-no-content-evidence` |
| 4 | Tên khớp, hash khớp, nhưng spec rỗng (0 clip) | **Từ chối, giữ khóa** | `ambiguous-trivial-spec` — hai project mới tinh có spec giống hệt nhau nên hash trùng không phân biệt được |
| 5 | Tên khớp nhưng hash lệch | **Từ chối, giữ khóa** | `ambiguous-name-only-hash-mismatch` — hoặc file khác cùng tên (đúng lỗi nợ #9), hoặc cùng file đã sửa ngoài app; không phân biệt được nên đều từ chối |
| 6 | Tên lệch VÀ hash lệch | Từ chối hẳn | `name-mismatch` |
| 7 | Chuỗi `proj-`, không có khóa, không có tên file | Từ chối hẳn | `not-file-chain` / `no-legacy-id` / `no-file-name` |

Quy tắc 1 nhận cả khi file đã đổi tên trên đĩa (tên khác, hash khớp)
— tên file chỉ là nhãn, nội dung mới là định danh. Quy tắc 2 giữ hành
vi E7 của đợt 64 (chuỗi rỗng thì dọn con trỏ). `shouldAdoptLegacyChain`
cũ giữ nguyên làm CỔNG TÊN (cần nhưng không đủ), test B3 khóa nó.

### 2.3 Bảng quy tắc — mảnh phân mảnh (`classifyLegacyFragment`)

Quét mọi projectId trong kho (`VersionBackend.listProjectIds?` mới —
tùy chọn, backend không hỗ trợ thì quét bỏ qua, không crash;
`MemoryBackend` + `IndexedDBBackend` đã triển khai; `HistoryStore.
listProjectIds()` trả null khi backend không hỗ trợ). Mỗi chuỗi legacy
không phải chuỗi con trỏ, không phải id envelope hiện tại:

| # | Điều kiện | Kết quả |
|---|---|---|
| F1 | Chuỗi `file-`, hash khớp (tên khớp hoặc không) | **Chắc chắn — nhận** (`content-hash-match` / `content-hash-match-renamed`) |
| F2 | Chuỗi `proj-`, hash spec đang mở nằm trong các version của chuỗi | **Chắc chắn — nhận** (`content-hash-match-proj`) — file này đã được lưu ra từ project chưa từng lưu file; không có tín hiệu tên nên chỉ hash mới quy kết được |
| F3 | Chuỗi `file-` cùng tên nhưng hash lệch / thiếu bằng chứng / spec rỗng | **Mơ hồ — báo cáo, KHÔNG nhận, KHÔNG đụng** (`ambiguous-*`, cùng 3 lý do §2.2) — là mảnh cũ của cùng file đã sửa ngoài app HOẶC file khác cùng tên, không phân biệt được |
| F4 | Chuỗi `file-` khác tên + khác hash, hoặc `proj-` không có hash trùng | **Không liên quan — bỏ qua lặng lẽ** (`no-signal`) — không có tín hiệu nào quy kết được; không liệt kê để khỏi nhiễu |
| F5 | UUID envelope của project khác | Không phải legacy (`not-legacy`), không đụng |

Quét giới hạn 200 chuỗi (`scan-truncated` khi vượt); lỗi liệt kê /
migration của một mảnh chỉ ghi mảnh đó là `scan-error`, không hỏng cả
đợt nhận. Kết quả quét nằm trong `AdoptLegacyHistoryResult`:
`fragmentsAdopted[]`, `fragmentsAmbiguous[]`, `fragmentsSkipped?`
(`no-spec` / `store-cannot-enumerate` / `scan-truncated` /
`invalid-envelope-id` / `error`).

### 2.4 Thay đổi hành vi (cần biết)

- `adoptLegacyHistoryChain` nay nhận tham số thứ 4 `opts?: { spec?: VideoSpec }`.
  Không đưa spec (đường autosave-restore / panel — nợ R6 §5.5, chưa nối):
  chuỗi không rỗng bị từ chối (`ambiguous-no-content-evidence`), quét
  mảnh bỏ qua (`fragmentsSkipped: "no-spec"`). Chỉ đường mở file
  (`openProjectFileFlow`) đưa spec nên chỉ đường đó nhận được chuỗi
  legacy — đúng như thiết kế mới, và là thay đổi có chủ đích so với đợt 64.
- Reason thành công đổi từ `"adopted"` sang `"content-hash-match"` /
  `"adopted-empty-chain"` (test E1/F2/F3 khóa). Caller cũ không đọc
  reason nên không ảnh hưởng production (chỉ `openProjectFlow` gọi
  adopt và bỏ qua kết quả trả về).
- Chuỗi con trỏ là `proj-` vẫn không tự nhận qua con trỏ (không có
  tín hiệu tên — giữ nguyên E3), nhưng NAY có thể được nhận qua quét
  mảnh F2 khi hash trùng (test G1).

## 3. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectNameRegistry64R6.ts` | Sửa | §3 mới: `LegacyAdoptionEvidence`, `parseLegacyFileId`, `legacyFileEmbeddedHash`, `decideLegacyAdoption`, `classifyLegacyFragment` (+`FragmentVerdict`/`FragmentClassification`); `shouldAdoptLegacyChain` ghi lại thành cổng tên |
| `apps/web/src/lib/projectNameRegistry64R6.test.ts` | Sửa | E1 đưa spec làm bằng chứng; mới F1–F6 (nhận nhầm + luật hash), G1–G6 (mảnh phân mảnh), H1–H3 (bộ phân loại thuần); 28 → 43 test |
| `apps/web/src/lib/projectHistory.ts` | Sửa | `VersionBackend.listProjectIds?` + triển khai ở `MemoryBackend`/`IndexedDBBackend`; `HistoryStore.listProjectIds()`; `specHasClips` + `buildAdoptionEvidence`; `AdoptLegacyHistoryOpts`, `LegacyFragmentAdoption`, `LegacyFragmentAmbiguous`, `AdoptLegacyHistoryResult` mở rộng; `scanLegacyFragments`; `adoptLegacyHistoryChain` nhận `opts.spec` + quét mảnh |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | 1 dòng: `adoptLegacyHistoryChain(res.projectId, file.name, undefined, { spec: res.spec })` |
| `docs/PHASE9_ROUND65_S9_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): log chi tiết
`hidden_files/round65-s9.md`; fragment
`hidden_files/round65-s9-fragment.txt` (5 entry, NUL cuối).

Stage: `paths-loop/phase9-round65-s9-project-name-registry.txt` — do
parent gộp. KHÔNG push, KHÔNG release/tag.

## 4. Kiểm chứng (số thật)

### 4.1 Unit mới `apps/web/src/lib/projectNameRegistry64R6.test.ts` — 43/43 (chạy 2 lần)

Chạy: `node apps/web/src/lib/projectNameRegistry64R6.test.ts` (~2 s).

- A–E cũ (28): giữ nguyên, trừ E1 nay đưa spec đang mở (hash khớp
  version mới nhất trong chuỗi). Tất cả xanh, không đổi expectation
  ngoài E1.
- F. Nhận nhầm + luật hash (6):
  - F1 **[REPRO nợ #9]**: 2 file khác nhau cùng tên (`Dự án.vcut.json`),
    nội dung khác (clip cA 5s vs cB 9s), con trỏ trỏ chuỗi của file B,
    mở file A → từ chối `ambiguous-name-only-hash-mismatch`, chuỗi B
    còn nguyên 2 version, khóa KHÔNG bị xóa, chuỗi A 0 version.
    **Trước sửa: FAIL** (code cũ nhận luôn chuỗi B — bug tái hiện);
    **sau sửa: PASS**.
  - F2: mở đúng file (hash khớp) → nhận, moved 2, khóa bị xóa.
  - F3: hash nhúng đã cũ (lần mở cuối là spec v2) nhưng file về trạng
    thái v1 → nhận nhờ hash version trong chuỗi (`content-hash-match`).
  - F4: file đổi tên trên đĩa (tên khác, hash khớp) → nhận.
  - F5: spec rỗng (0 clip) dù hash khớp vẫn từ chối
    (`ambiguous-trivial-spec`), chuỗi còn nguyên.
  - F6: không đưa spec → từ chối (`ambiguous-no-content-evidence`),
    giữ khóa.
- G. Mảnh phân mảnh qua `adoptLegacyHistoryChain` thật (6):
  - G1: mảnh `proj-` có version cùng spec đang mở → nhận cùng chuỗi
    con trỏ (`fragmentsAdopted` 1, moved 1); envelope giữ đúng nội dung.
  - G2: mảnh `file-` cũ cùng tên khác nội dung → mơ hồ, báo cáo
    (`fragmentsAmbiguous` 1, `ambiguous-name-only-hash-mismatch`),
    mảnh còn nguyên 1 version, envelope không nhiễm.
  - G3: mảnh `file-` đổi tên (hash khớp) → nhận (`fragmentsAdopted` 1).
  - G4: chuỗi legacy của project khác (khác tên, khác nội dung) →
    không đụng, không liệt kê, còn nguyên.
  - G5: backend không có `listProjectIds` → quét bỏ qua
    (`fragmentsSkipped: "store-cannot-enumerate"`), chuỗi con trỏ vẫn
    nhận bình thường, mảnh còn nguyên.
  - G6: không đưa spec → quét bỏ qua (`fragmentsSkipped: "no-spec"`).
- H. Bộ phân loại thuần (3): parse id legacy + hash nhúng (H1); bảng
  luật `decideLegacyAdoption` 10 trường hợp (H2); bảng luật
  `classifyLegacyFragment` 9 trường hợp (H3).

Chạy trước sửa (chỉ F+G, chưa có H): **28 pass, 12 fail** — F1 tái
hiện đúng bug (nhận chuỗi file B), F2/F3 sai reason (`"adopted"` thay
vì `"content-hash-match"`), F4/F5/F6 sai hành vi, G1–G6 thiếu tính
năng quét mảnh. Sau sửa: **43/43**, chạy lại lần 2 vẫn 43/43.

Lưu ý trong lúc làm: H3 lần chạy đầu fail do TÔI viết sai dữ liệu test
(mảnh `proj-` cần hash đang mở nằm trong `chainVersionHashes`, tôi để
chain là hash khác) — đã sửa expectation, code không đổi. tsc bắt 1
lỗi thật trong lúc làm (xem §4.2).

### 4.2 Hồi quy + build (chạy lại sau mọi sửa)

- projectHistory 15/15, projectId63R7 27/27, idbCleanup61R9 16/16,
  projectAssetRefs62R7 28/28, projectRepo 10/10, saveToast31 15/15,
  loadProject54K1 7/7 (chạy trực tiếp Node).
- `tsc` apps/web: **file của luồng này 0 lỗi; lần chạy cuối 0 lỗi toàn
  repo.** 3 lỗi TS5097 ở `src/lib/gopTrialDecode65S6.test.ts` của luồng
  S6 đợt 65 còn ở lần chạy ngay sau sửa đã được chính luồng S6 sửa
  trong lúc đợt này chạy (import `.ts` đổi về không đuôi — kiểm chứng
  bằng đọc file, không phải file luồng này, không sửa).
  Lỗi tsc của luồng này đã sửa trong lúc làm: `classifyLegacyFragment`
  gọi `.startsWith("proj-")` SAU nhánh false của type guard
  `isLegacyFileHistoryId` (`id is string`) nên tsc thu hẹp `chainId:
  string` thành `never` (TS2339) — sửa bằng cách kiểm tra `proj-`
  TRƯỚC khi gọi type guard.
- `vite build` apps/web: **pass** (43,61s, chỉ cảnh báo chunk >500 kB có sẵn).

### 4.3 vite build

Chạy: `npx vite build` từ `apps/web` — `✓ built in 43.61s`
(`dist/assets/index-2vY6Iq1C.js` 1.494,77 kB / gzip 441,60 kB;
`index-BFo2hR8y.css` 66,09 kB). Chỉ cảnh báo chunk >500 kB có sẵn từ
trước (không phải do luồng này).

## 5. Nợ mở / giới hạn (trung thực)

1. **Mảnh mơ hồ (F3 §2.3) không có đường nhận thủ công.** Mảnh `file-`
   cùng tên khác nội dung có thể là mảnh cũ của cùng file (đã sửa
   ngoài app) hoặc file khác cùng tên — dữ liệu còn lại không phân
   biệt được. Dữ liệu không mất (còn trong IndexedDB dưới id cũ)
   nhưng chưa có UI nhận thủ công — việc cho đợt sau nếu user cần
   (nối tiếp nợ R6 §5.3, nay đã thu hẹp: chỉ còn trường hợp mơ hồ này
   là chưa nhận được, các trường hợp chắc chắn đã tự nhận).
2. **Đường autosave-restore và nhập archive vẫn không nhận chuỗi
   legacy** (nợ R6 §5.5/§5.6). Autosave-restore không có tên file;
   nhưng từ đợt này nó CÓ spec (autosave envelope) nên chỉ cần nối
   `opts.spec` + (tùy chọn) tên file từ envelope là nhận được chuỗi
   con trỏ + quét mảnh — việc nhỏ cho đợt sau, không làm trong luồng
   này để khỏi đụng đường autosave đang chạy. Nhập archive: chuỗi lịch
   sử của file gốc trên máy cũ không đi theo `.vcut.zip` (lịch sử chỉ
   sống trong IndexedDB local) — vẫn đúng, không đổi.
3. **Va chạm id version xác định khi trùng cả `createdAt` lẫn hash
   (nợ R6 §5.2) nay có thêm một đường va chạm hẹp:** hai chuỗi khác
   nhau chứa version cùng spec, lưu trong cùng 1 mili-giây, gộp về
   cùng envelope trong một lần adopt (G1/G3) sẽ chung id migration
   `${to}@${createdAt}-${hash}` — put sau ghi đè put trước. Nội dung
   hai version giống hệt nhau (cùng hash) nên không mất nội dung, chỉ
   mất một bản snapshot trùng + `parentId` của hàng sống sót có thể
   trỏ về chuỗi bên kia. Test G1/G3 né bằng cách không assert số
   version envelope chính xác trong trường hợp này. Sửa triệt để (thêm
   hash của chuỗi nguồn vào id migration) sẽ đổi định dạng id — để đợt
   sau quyết, không đổi trong luồng này.
4. **File sao chép y hệt nội dung (Save-As/copy) được nhận như cùng
   một project tới điểm sao chép.** Hash FNV-1a 32-bit va chạm 2^-32/
   cặp (không đáng kể); nhưng hai file có spec byte-giống-hệt thì hash
   bằng nhau thật — nhận chuỗi chung là đúng về lịch sử tới điểm sao
   chép, chỉ file nào mở trước thì hưởng chuỗi chung đó, file còn lại
   mở sau sẽ bắt đầu chuỗi mới (con trỏ đã bị xóa). Không mất dữ liệu
   (version còn đủ, chỉ nằm dưới envelope của file mở trước).
5. **`IndexedDBBackend.listProjectIds` chưa có test Node** (Node không
   có IndexedDB — cùng giới hạn như mọi hàm IndexedDBBackend khác).
   Logic là duyệt key của index `byProject` bằng `openKeyCursor`,
   gom distinct — cần đo qua headed khi có (xem §5.6). MemoryBackend
   đã có test qua G1–G6.
6. **Headed chưa đo.** Chưa có click-test mở file `.vcut` cũ bằng UI
   thật rồi kiểm tra panel Lịch sử sau adopt (nối tiếp nợ R6 §5.10),
   và chưa đo đường quét mảnh trên IndexedDB thật (chỉ MemoryBackend).
   Harness headed của R6
   (`apps/web/scripts/clicktest-64r6-project-name-registry.mjs`) có
   thể mở rộng cho đợt sau; luồng này không làm để khỏi đụng harness
   đang được các luồng khác dùng.
7. **Không cần key i18n mới.** Mọi reason là mã nội bộ, không hiện ra
   UI. Nếu sau này UI hiện lý do từ chối nhận chuỗi cho user thì mới
   cần key.

## 6. Môi trường chạy

- VM này, không GPU.
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/projectNameRegistry64R6.test.ts` — exit 0 khi 43/43 pass.
  `node apps/web/src/lib/projectHistory.test.ts`,
  `node apps/web/src/lib/projectId63R7.test.ts`,
  `node apps/web/src/lib/idbCleanup61R9.test.ts`,
  `node apps/web/src/lib/projectAssetRefs62R7.test.ts`,
  `node apps/web/src/lib/projectRepo.test.ts`,
  `node apps/web/src/lib/saveToast31.test.ts`,
  `node apps/web/src/lib/loadProject54K1.test.ts` — hồi quy trực tiếp.
- `tsc` chạy từ `apps/web` (`npx tsc --noEmit`).
- `vite build` chạy từ `apps/web`.
