/**
 * free_track_v2e_preload.c — Phase 9 đợt 81, luồng I1.
 *
 * Biến thể "poison-quarantine" của v2d (đợt 76) để đo "SUÝT CRASH"
 * (H1 §6 bước 3): khi cửa sổ không còn crash (F3 0/90, G3 0/60,
 * H1 0/60), endpoint crash nhị phân hết power. v2e đổi endpoint:
 * thay vì chờ segfault, nó biến mọi lần transform chạm vào buffer
 * đã free thành TÍN HIỆU QUAN SÁT ĐƯỢC:
 *
 *   - FREE của chunk đã track: ghi log như v2d (kèm backtrace), rồi
 *     memset toàn bộ chunk bằng poison 0xA5 và ĐƯA VÀO QUARANTINE
 *     (FIFO, tối đa 32 chunk) thay vì trả lại cho glibc ngay. Chỉ khi
 *     quarantine đầy mới evict chunk cũ nhất bằng __libc_free thật
 *     (ghi dòng EVICT).
 *   - Nhờ đó, nếu transform (vidstabtransform in-place) đọc lại
 *     buffer đã free, nó đọc được poison thay vì dữ liệu tái cấp phát
 *     — poison lan vào frame output và đo được: (a) frame lệch khỏi
 *     GT (framemd5/showinfo checksum), (b) chữ ký poison: mean Y kéo
 *     về 165 và stdev Y sụp (showinfo mean/stdev từng frame), (c) Y
 *     plane_checksum trùng checksum của mặt phẳng toàn 0xA5 (đo bằng
 *     showinfo trên frame 0xA5 thuần — xem LIMITS I1).
 *   - Phân biệt 2 cơ chế: (a) use-after-free → frame lệch CÓ chữ ký
 *     poison; (b) buffer-reuse khi còn live (decoder ghi đè frame
 *     filter vẫn giữ, không qua free) → frame lệch KHÔNG có poison
 *     (ΔmeanY ≈ 0 như hồi cứu H1: 815/1500 frame 720p lệch, ΔmeanY
 *     trung vị 0). So NC-vs-CP/SP dưới CÙNG instrument vẫn hợp lệ.
 *
 * Giữ thiết kế nhẹ của v2d: ALLOC chỉ insert lặng (không backtrace,
 * không log); chỉ FREE mới log + poison + quarantine. Số FREE đã
 * track mỗi run nhỏ (720p ~11, 1080p ~49 — đo từ log H1) nên chi phí
 * memset + quarantine không đáng kể. Dải track mở rộng lên 12 MB để
 * phủ mặt phẳng Y 4K (8.294.400 byte) nếu đợt sau làm 4K.
 *
 * An toàn: chunk trong quarantine KHÔNG trả lại allocator nên không
 * ai cấp phát lại được địa chỉ đó — mọi lần đọc poison đều là UAF
 * thật (không false positive từ tái cấp phát hợp lệ). Double-free:
 * table_remove lần 2 trả 0 nên không poison 2 lần. realloc nội bộ
 * của glibc không qua hook này (giới hạn đã biết của v2d).
 *
 * Biên dịch: gcc -Wall -Wextra -shared -fPIC -O2 -o free_track_v2e_preload.so free_track_v2e_preload.c -rdynamic
 * Test đơn vị: free_track_v2e_unit.c (malloc 2 MB → free → đọc lại
 * phải toàn 0xA5; 40 lần free → stats quarantined=41 evicted=9).
 * Chỉ dùng cho thí nghiệm (không phải code production).
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

/* Chẩn đoán dải cỡ: track MỌI chunk có cỡ trong [400000, 12000000]
   (mở rộng từ 4,2 MB của v2d để phủ mặt phẳng Y 4K = 8.294.400). */
#define TRACK_MIN 400000UL
#define TRACK_MAX 12000000UL
#define POISON_BYTE 0xA5

static int logfd = -1; /* khai báo sớm: quarantine_push (dưới) dùng logfd để ghi EVICT */

/* --- Quarantine poison (I1): FIFO có chặn, tối đa 32 chunk. ---
   Chunk đã free được poison rồi giữ lại thay vì trả cho glibc;
   khi đầy, evict chunk cũ nhất bằng __libc_free thật (ghi EVICT).
   Bảo vệ bằng spinlock (đường free đã track là lạnh: ~11-49/run).
   Memset poison làm TRƯỚC khi lấy lock (chunk đã là của riêng ta,
   không ai hợp lệ chạm vào nữa). */
#define QCAP 32
typedef struct {
  void *ptr;
  size_t size;
} qent_t;
static qent_t quarantine[QCAP];
static int q_head = 0; /* vị trí evict tiếp theo (cũ nhất) */
static int q_len = 0;
static atomic_flag q_lock = ATOMIC_FLAG_INIT;
static _Atomic unsigned long stat_quarantined = 0;
static _Atomic unsigned long stat_evicted = 0;
static _Atomic unsigned long stat_peak_bytes = 0;
static _Atomic unsigned long stat_quarantine_bytes = 0;

static void quarantine_push(void *p, size_t sz) {
  while (atomic_flag_test_and_set_explicit(&q_lock, memory_order_acquire)) {
    /* spin ngắn: critical section chỉ là vài phép tính trên mảng */
  }
  if (q_len == QCAP) {
    qent_t old = quarantine[q_head];
    quarantine[q_head].ptr = p;
    quarantine[q_head].size = sz;
    q_head = (q_head + 1) % QCAP;
    atomic_fetch_add_explicit(&stat_evicted, 1, memory_order_relaxed);
    atomic_fetch_sub_explicit(&stat_quarantine_bytes, old.size, memory_order_relaxed);
    /* Ghi EVICT (không lock log — write() đơn là đủ; xen kẽ dòng là
       chấp nhận được vì dòng EVICT tự chứa đủ thông tin). */
    if (logfd >= 0) {
      char buf[160];
      int n = snprintf(buf, sizeof(buf),
                       "[free_track_v2e] EVICT addr=%p size=%lu\n",
                       old.ptr, (unsigned long)old.size);
      if (n > 0) {
        size_t left = (size_t)n;
        const char *cp = buf;
        while (left > 0) {
          ssize_t w = write(logfd, cp, left);
          if (w <= 0) break;
          cp += (size_t)w;
          left -= (size_t)w;
        }
      }
    }
    atomic_flag_clear_explicit(&q_lock, memory_order_release);
    __libc_free(old.ptr); /* trả thật — ngoài lock */
  } else {
    int pos = (q_head + q_len) % QCAP;
    quarantine[pos].ptr = p;
    quarantine[pos].size = sz;
    q_len++;
    atomic_flag_clear_explicit(&q_lock, memory_order_release);
  }
  atomic_fetch_add_explicit(&stat_quarantined, 1, memory_order_relaxed);
  unsigned long cur =
      atomic_fetch_add_explicit(&stat_quarantine_bytes, sz, memory_order_relaxed) + sz;
  unsigned long peak = atomic_load_explicit(&stat_peak_bytes, memory_order_relaxed);
  while (cur > peak &&
         !atomic_compare_exchange_weak_explicit(&stat_peak_bytes, &peak, cur,
                                                memory_order_relaxed, memory_order_relaxed)) {
    /* retry với peak mới */
  }
}

static int is_tracked(size_t sz) {
  return sz >= TRACK_MIN && sz <= TRACK_MAX;
}
#define TABLE_SLOTS 1024
#define RING_N 4096
#define BT_DEPTH 12
#define EMIT_BUF 8192

/* logfd đã khai báo ở trên (dòng ~69) để quarantine_push dùng được. */

/* Cờ arming (CHẨN ĐOÁN ONLY): 0 = chưa thấy td->src được cấp;
   1 = race đã armed. Chỉ dùng để ghi dòng ARMED vào log — KHÔNG
   cổng đường free. */
static _Atomic int armed = 0;

/* --- Bảng thành viên lock-free: open addressing + tombstone. ---
   Mỗi slot là `_Atomic(void*) addr` + size: NULL = trống, TOMBSTONE
   = đã xóa, còn lại = chunk đang live. Size ghi TRƯỚC khi publish
   addr bằng CAS (chỉ để ghi log chẩn đoán; xem header v2b).
   Probe dừng ở slot NULL đầu tiên (insert không bao giờ nhảy qua slot
   trống), bỏ qua tombstone — nên probe thường chỉ tốn 1 atomic load.
   Insert: ghi vào tombstone đầu tiên gặp (hoặc slot trống đầu tiên),
   CAS(NULL/TOMBSTONE -> addr). Remove: CAS(addr -> TOMBSTONE).
   Không lock, không serialize; bảng chỉ 64 slot. */
#define TOMBSTONE ((void *)1)
typedef struct {
  _Atomic(void *) addr;
  size_t size; /* ghi TRƯỚC khi publish addr (chỉ để ghi log) */
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
    table[target].size = sz; /* ghi size TRƯỚC khi publish addr */
    if (atomic_compare_exchange_strong_explicit(
            &table[target].addr, &expected, a, memory_order_release,
            memory_order_relaxed))
      return 1;
    /* CAS thua: slot vừa đổi chủ — quét lại. */
  }
  return 0;
}

/* Trả 1 + size nếu tìm thấy và gỡ được (CAS addr -> TOMBSTONE). */
static int table_remove(void *a, size_t *sz_out) {
  unsigned start = hash_addr(a);
  for (unsigned n = 0; n < TABLE_SLOTS; n++) {
    unsigned j = (start + n) % TABLE_SLOTS;
    void *cur = atomic_load_explicit(&table[j].addr, memory_order_acquire);
    if (cur == NULL) return 0; /* hết chuỗi probe — không có */
    if (cur == TOMBSTONE) continue;
    if (cur != a) continue;
    size_t sz = table[j].size;
    void *expected = a;
    if (atomic_compare_exchange_strong_explicit(
            &table[j].addr, &expected, TOMBSTONE, memory_order_acq_rel,
            memory_order_relaxed)) {
      *sz_out = sz;
      return 1;
    }
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
                   "[free_track_v2e] seq=%lu %s addr=%p size=%lu tid=%ld\n",
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
                   "[free_track_v2e] ARMED addr=%p (td->src, "
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

/* Xử lý ALLOC đúng dải: CHỈ insert lặng vào bảng (không backtrace,
   không ghi log) — để FREE sau đó nhận ra chunk mà không làm chậm
   đường alloc nóng. Backtrace chỉ ghi ở FREE (hiếm). */
static void on_tracked_alloc(int kind, void *p, size_t sz) {
  (void)kind;
  table_insert(p, sz);
}

void *malloc(size_t size) {
  if (in_hook || !is_tracked(size)) return __libc_malloc(size);
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
  if (in_hook || !is_tracked(size)) {
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
  /* KHÔNG cổng theo `armed`: luôn tra bảng lock-free. Chỉ atomic load
     khi không khớp + CAS khi remove — không lock, không serialize.
     `armed` chỉ là cờ chẩn đoán (dòng ARMED trong log).
     I1: chunk đã track thì POISON + QUARANTINE thay vì trả ngay cho
     glibc — mọi lần đọc sau đó đều thấy 0xA5 (xem header). */
  in_hook = 1;
  size_t sz = 0;
  if (table_remove(ptr, &sz)) {
    log_event(2, ptr, sz, my_tid());
    memset(ptr, POISON_BYTE, sz); /* ngoài lock quarantine */
    quarantine_push(ptr, sz);
  } else {
    __libc_free(ptr);
  }
  in_hook = 0;
}

__attribute__((constructor))
static void init_free_track_v2e(void) {
  const char *path = getenv("FREE_TRACK_LOG");
  if (!path || !*path) path = "./free-track-v2e.log";
  logfd = open(path, O_WRONLY | O_CREAT | O_APPEND, 0644);
  if (logfd >= 0) {
    char buf[160];
    int n = snprintf(buf, sizeof(buf),
                     "[free_track_v2e] === start pid=%ld (poison-quarantine, cap=%d) ===\n",
                     (long)getpid(), QCAP);
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

/* Ghi stats quarantine khi tiến trình thoát (không free lại — tiến
   trình đang thoát; chỉ cần số liệu để harness đối chiếu). */
__attribute__((destructor))
static void fini_free_track_v2e(void) {
  if (logfd < 0) return;
  char buf[256];
  int n = snprintf(buf, sizeof(buf),
                   "[free_track_v2e] === stats quarantined=%lu evicted=%lu peakQuarantineBytes=%lu ===\n",
                   atomic_load_explicit(&stat_quarantined, memory_order_relaxed),
                   atomic_load_explicit(&stat_evicted, memory_order_relaxed),
                   atomic_load_explicit(&stat_peak_bytes, memory_order_relaxed));
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
