/**
 * free_track_v2_preload.c — Phase 9 đợt 76, luồng D3.
 *
 * Free-tracker v2 LOCK-FREE — trả nợ đợt 75 §7 mục 1 ("ai free chunk
 * đích" vẫn mở vì tracker v1 có vẻ tự ức chế arming).
 *
 * Vấn đề của v1 (xem docs/PHASE9_ROUND75_C3_VIDSTAB_REGS_MAPS_LIMITS.md
 * §5.3): free() interpose khóa pthread_mutex cho MỌI lần free (ffmpeg
 * làm hàng triệu lần/chạy) + tra bảng hash — serialize các thread
 * decode/filter, đổi interleaving, khiến frame không còn writable lúc
 * tới filter. Kết quả: 0/24 lần chạy dưới v1 được armed (td->src
 * +0x17b không bao giờ được cấp), 0/24 crash — không bắt được crash
 * nào để đối chiếu RDI với log FREE.
 *
 * V2 khác v1 ở 5 điểm (không còn lock nào trong toàn bộ file):
 *
 *  1. KHÔNG CÓ MUTEX. Không pthread_mutex_t nào cả. Đường free nóng
 *     không chạm tới bất kỳ lock nào.
 *  2. CỜ ARMING CHỈ LÀ CHẨN ĐOÁN, KHÔNG CỔNG ĐƯỜNG FREE. Bản đầu của
 *     v2 từng thử "armed gate": khi chưa armed, free() bỏ qua luôn
 *     tra bảng (chỉ 1 atomic load). Unit test đã bắt được lỗi của cách
 *     này: FREE của chunk đúng cỡ đã được cấp TRƯỚC khi armed (vd
 *     destbuf cấp ở frame 1, free lúc teardown trong lần chạy không
 *     armed) bị bỏ sót — unit chỉ log 2/4 event, mt unit 200 ALLOC +
 *     0 FREE. Gate đã bị GỠ: free() luôn tra bảng (chỉ atomic load +
 *     CAS khi remove). Bench chứng minh không cần gate: đường probe
 *     chỉ ~1,25x native (xem test_round76_d3_free_track_v2.js), trong
 *     khi v1 chậm ~4,3x. Cờ `armed` giữ lại chỉ để ghi dòng ARMED vào
 *     log khi td->src (+0x17b) lần đầu được cấp — đó là tín hiệu đo
 *     "race đã armed" mà hunt cần, không còn ảnh hưởng đường free.
 *  3. BẢNG THÀNH VIÊN LOCK-FREE, PROBE O(1). Bảng cố định 64 slot;
 *     mỗi slot là `_Atomic(void*) addr` (NULL = trống, TOMBSTONE =
 *     đã xóa). Probe dừng ở slot NULL đầu tiên, bỏ qua tombstone —
 *     thường chỉ 1 atomic load. Insert CAS(NULL/TOMBSTONE -> addr)
 *     vào tombstone/slot trống đầu tiên; remove CAS(addr ->
 *     TOMBSTONE). Không lock, không serialize, không ghi chung trên
 *     đường probe. BÀI HỌC ĐO ĐƯỢC: bản đầu quét toàn bộ 64 slot mỗi
 *     lần free đã đo được ~7x native trên bench (618 ms vs 90 ms)
 *     — gần bằng v1 (680 ms) — nên đã thay bằng probe tombstone này;
 *     xem test_round76_d3_free_track_v2.js §4. Bảng không lưu size
 *     (mọi chunk track đều đúng TRACK_SIZE).
 *  4. RING BUFFER LOCK-FREE. 4096 slot, writer chiếm slot bằng
 *     atomic_fetch_add trên head, ghi record (kind/addr/tid/12 frame
 *     thô), rồi publish bằng release-store của số seq. Không lock,
 *     không CAS vòng lặp. Ring là bản ghi trong tiến trình (mất theo
 *     tiến trình khi crash); đường sống sót sau SIGSEGV là (5).
 *  5. GHI LOG BẰNG MỘT write() DUY NHẤT, không lock. Mỗi event đúng
 *     cỡ được format vào buffer thread-local (<= 8 KB: header +
 *     backtrace đã resolve symbol + dòng ARMED nếu vừa armed) rồi
 *     emit bằng đúng MỘT write() xuống fd O_APPEND — các event của
 *     các thread không xen kẽ nhau. Symbol resolve dùng
 *     backtrace_symbols() (nó malloc — nhưng lúc đó cờ thread-local
 *     in_hook đã bật nên malloc/free nội bộ đi thẳng __libc_*,
 *     không đệ quy). Chỉ event đúng cỡ mới làm việc này (vài lần/
 *     chạy) nên chi phí không đáng kể.
 *
 * Đường malloc/posix_memalign với size != TRACK_SIZE: đi thẳng
 * __libc_* như v1, không chạm bảng/ring/log.
 *
 * Như v1: gọi thẳng __libc_malloc/__libc_free/__libc_memalign (không
 * dlsym — loader gọi malloc trong lúc relocation trước cả constructor).
 * Chỉ theo dõi chunk đúng 2.073.600 byte (plane Y 1080p). Không interpose
 * calloc/realloc/aligned_alloc (av_malloc đi qua posix_memalign — C3 §4).
 *
 * Dùng kèm segv handler: LD_PRELOAD="free_track_v2_preload.so:segv_backtrace_preload.so"
 * để khi crash, đối chiếu RDI trong regs với log FREE.
 *
 * Biên dịch: gcc -Wall -Wextra -shared -fPIC -O2 -o free_track_v2_preload.so free_track_v2_preload.c -rdynamic
 * Lưu ý: chỉ dùng cho thí nghiệm (không phải code production).
 */
#define _GNU_SOURCE
#include <execinfo.h>
#include <fcntl.h>
#include <stdatomic.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>

/* Hàm thật của glibc (không bị interpose). */
extern void *__libc_malloc(size_t size);
extern void __libc_free(void *ptr);
extern void *__libc_memalign(size_t alignment, size_t size);

#define TRACK_SIZE 2073600UL /* plane Y 1920x1080 */
#define TABLE_SLOTS 64
#define RING_N 4096
#define BT_DEPTH 12
#define EMIT_BUF 8192

static int logfd = -1;

/* Cờ arming (CHẨN ĐOÁN ONLY): 0 = chưa thấy td->src được cấp;
   1 = race đã armed. Chỉ dùng để ghi dòng ARMED vào log — KHÔNG
   cổng đường free (xem header §2). */
static _Atomic int armed = 0;

/* --- Bảng thành viên lock-free: open addressing + tombstone. ---
   Mỗi slot là `_Atomic(void*) addr`: NULL = trống, TOMBSTONE = đã
   xóa, còn lại = chunk đang live. Mọi chunk được track đều có cùng
   cỡ TRACK_SIZE nên bảng không cần lưu size (tránh race ghi size).
   Probe dừng ở slot NULL đầu tiên (insert không bao giờ nhảy qua slot
   trống), bỏ qua tombstone — nên probe thường chỉ tốn 1 atomic load.
   Insert: ghi vào tombstone đầu tiên gặp (hoặc slot trống đầu tiên),
   CAS(NULL/TOMBSTONE -> addr). Remove: CAS(addr -> TOMBSTONE).
   Không lock, không serialize; bảng chỉ 64 slot = 512 byte. */
#define TOMBSTONE ((void *)1)
typedef struct {
  _Atomic(void *) addr;
} slot_t;
static slot_t table[TABLE_SLOTS];

static unsigned hash_addr(void *a) {
  uintptr_t x = (uintptr_t)a >> 4;
  x ^= x >> 16;
  return (unsigned)(x % TABLE_SLOTS);
}

/* Trả 1 nếu chunk đã có trong bảng hoặc insert được; 0 nếu bảng đầy
   hoặc CAS thua quá nhiều lần (hiếm: insert đúng cỡ chỉ vài lần/chạy). */
static int table_insert(void *a, size_t sz) {
  (void)sz; /* mọi chunk track đều cỡ TRACK_SIZE — không cần lưu */
  for (int attempt = 0; attempt < 8; attempt++) {
    unsigned start = hash_addr(a);
    int first_tomb = -1;
    unsigned target = TABLE_SLOTS;
    for (unsigned n = 0; n < TABLE_SLOTS; n++) {
      unsigned j = (start + n) % TABLE_SLOTS;
      void *cur =
          atomic_load_explicit(&table[j].addr, memory_order_relaxed);
      if (cur == a) return 1; /* đã có sẵn */
      if (cur == TOMBSTONE) {
        if (first_tomb < 0) first_tomb = (int)j;
        continue;
      }
      if (cur == NULL) {
        target = first_tomb >= 0 ? (unsigned)first_tomb : j;
        break;
      }
    }
    if (target == TABLE_SLOTS) {
      if (first_tomb >= 0) target = (unsigned)first_tomb;
      else return 0; /* bảng đầy */
    }
    void *expected =
        atomic_load_explicit(&table[target].addr, memory_order_relaxed);
    if (expected != NULL && expected != TOMBSTONE) continue; /* retry */
    if (atomic_compare_exchange_strong_explicit(
            &table[target].addr, &expected, a, memory_order_release,
            memory_order_relaxed))
      return 1;
    /* CAS thua: slot vừa đổi chủ — quét lại. */
  }
  return 0;
}

/* Trả 1 nếu tìm thấy và gỡ được (CAS addr -> TOMBSTONE). */
static int table_remove(void *a) {
  unsigned start = hash_addr(a);
  for (unsigned n = 0; n < TABLE_SLOTS; n++) {
    unsigned j = (start + n) % TABLE_SLOTS;
    void *cur = atomic_load_explicit(&table[j].addr, memory_order_acquire);
    if (cur == NULL) return 0; /* hết chuỗi probe — không có */
    if (cur == TOMBSTONE) continue;
    if (cur != a) continue;
    void *expected = a;
    if (atomic_compare_exchange_strong_explicit(
            &table[j].addr, &expected, TOMBSTONE, memory_order_acq_rel,
            memory_order_relaxed))
      return 1;
    return 0; /* có thread khác vừa gỡ nó (double-free) — không log */
  }
  return 0;
}

/* --- Ring buffer lock-free (bản ghi trong tiến trình). --- */
typedef struct {
  _Atomic unsigned long seq; /* 0 = chưa publish; id+1 khi đã ghi xong */
  unsigned long id;
  int kind; /* 0=ALLOC-malloc 1=ALLOC-memalign 2=FREE */
  void *addr;
  long tid;
  int depth;
  void *frames[BT_DEPTH];
} ringrec_t;
static ringrec_t ring[RING_N];
static _Atomic unsigned long ring_head = 0;

static unsigned long ring_push(int kind, void *addr, long tid, void **frames,
                      int depth) {
  unsigned long id = atomic_fetch_add_explicit(&ring_head, 1,
                                               memory_order_relaxed);
  ringrec_t *r = &ring[id % RING_N];
  r->id = id;
  r->kind = kind;
  r->addr = addr;
  r->tid = tid;
  r->depth = depth > BT_DEPTH ? BT_DEPTH : depth;
  for (int i = 0; i < r->depth; i++) r->frames[i] = frames[i];
  /* Publish sau cùng (release): reader thấy seq != 0 thì mọi field
     trên đã sẵn sàng. */
  atomic_store_explicit(&r->seq, id + 1, memory_order_release);
  return id;
}

static __thread int in_hook = 0;
static __thread char emit_buf[EMIT_BUF];

/* Format + emit MỘT event bằng đúng 1 write() (không lock).
   Trả về 1 nếu backtrace chứa site td->src (+0x17b). */
static int log_event(int kind, void *addr, size_t sz, long tid) {
  if (logfd < 0) return 0;
  void *frames[BT_DEPTH];
  int depth = backtrace(frames, BT_DEPTH);
  unsigned long seq = ring_push(kind, addr, tid, frames, depth);

  char **symarr = NULL;
  if (depth > 0) {
    symarr = backtrace_symbols(frames, depth);
    /* backtrace_symbols malloc qua hook của chúng ta nhưng in_hook
       đang bật nên đi thẳng __libc_malloc — không đệ quy. */
  }
  const char *kstr =
      kind == 0 ? "ALLOC-malloc" : kind == 1 ? "ALLOC-memalign" : "FREE";
  size_t off = 0;
  int n = snprintf(emit_buf + off, EMIT_BUF - off,
                   "[free_track_v2] seq=%lu %s addr=%p size=%lu tid=%ld\n",
                   seq, kstr, addr, (unsigned long)sz, tid);
  if (n > 0) off += (size_t)n;
  int is_td_src = 0;
  if (symarr) {
    for (int i = 0; i < depth && off < EMIT_BUF - 2; i++) {
      const char *s = symarr[i];
      if (strstr(s, "vsTransformPrepare+0x17b")) is_td_src = 1;
      size_t len = strlen(s);
      if (off + len + 1 >= EMIT_BUF) break;
      memcpy(emit_buf + off, s, len);
      off += len;
      emit_buf[off++] = '\n';
    }
    __libc_free(symarr);
  }
  /* Dòng ARMED gộp chung trong CÙNG một write() để không xen kẽ. */
  if (is_td_src && kind != 2) {
    int expected = 0;
    if (atomic_compare_exchange_strong_explicit(
            &armed, &expected, 1, memory_order_acq_rel,
            memory_order_relaxed)) {
      n = snprintf(emit_buf + off, EMIT_BUF - off,
                   "[free_track_v2] ARMED addr=%p (td->src, "
                   "vsTransformPrepare+0x17b)\n",
                   addr);
      if (n > 0) off += (size_t)n;
    }
  }
  /* Một write() duy nhất cho toàn bộ event. */
  size_t left = off;
  const char *p = emit_buf;
  while (left > 0) {
    ssize_t w = write(logfd, p, left);
    if (w <= 0) break;
    p += (size_t)w;
    left -= (size_t)w;
  }
  return is_td_src;
}

static long my_tid(void) { return (long)syscall(SYS_gettid); }

/* Xử lý chung cho ALLOC đúng cỡ: insert bảng + log (kèm phát hiện arming). */
static void on_tracked_alloc(int kind, void *p, size_t sz) {
  table_insert(p, sz);
  log_event(kind, p, sz, my_tid());
}

void *malloc(size_t size) {
  if (in_hook || size != TRACK_SIZE) return __libc_malloc(size);
  in_hook = 1;
  void *p = __libc_malloc(size);
  if (p) on_tracked_alloc(0, p, size);
  in_hook = 0;
  return p;
}

int posix_memalign(void **memptr, size_t alignment, size_t size) {
  if (alignment == 0 || (alignment & (alignment - 1)) != 0 ||
      alignment < sizeof(void *))
    return 22 /* EINVAL */;
  if (in_hook || size != TRACK_SIZE) {
    void *p = __libc_memalign(alignment, size);
    if (!p) return 12 /* ENOMEM */;
    *memptr = p;
    return 0;
  }
  in_hook = 1;
  void *p = __libc_memalign(alignment, size);
  int r = p ? 0 : 12 /* ENOMEM */;
  if (r == 0) {
    *memptr = p;
    on_tracked_alloc(1, p, size);
  }
  in_hook = 0;
  return r;
}

void free(void *ptr) {
  if (!ptr) {
    __libc_free(NULL);
    return;
  }
  if (in_hook) {
    __libc_free(ptr);
    return;
  }
  /* KHÔNG cổng theo `armed` (xem header §2): luôn tra bảng lock-free.
     Chỉ atomic load khi không khớp + CAS khi remove — không lock,
     không serialize. `armed` chỉ là cờ chẩn đoán (dòng ARMED trong log). */
  in_hook = 1;
  if (table_remove(ptr)) log_event(2, ptr, TRACK_SIZE, my_tid());
  __libc_free(ptr);
  in_hook = 0;
}

__attribute__((constructor))
static void init_free_track_v2(void) {
  const char *path = getenv("FREE_TRACK_LOG");
  if (!path || !*path) path = "./free-track-v2.log";
  logfd = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (logfd >= 0) {
    char buf[160];
    int n = snprintf(buf, sizeof(buf),
                     "[free_track_v2] === start pid=%ld (lock-free) ===\n",
                     (long)getpid());
    if (n > 0) {
      size_t left = (size_t)n;
      const char *p = buf;
      while (left > 0) {
        ssize_t w = write(logfd, p, left);
        if (w <= 0) break;
        p += (size_t)w;
        left -= (size_t)w;
      }
    }
  }
}
