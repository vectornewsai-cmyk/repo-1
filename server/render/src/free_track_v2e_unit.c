/**
 * free_track_v2e_unit.c — Phase 9 đợt 81, luồng I1.
 *
 * Test đơn vị cho free_track_v2e_preload.so (chạy với LD_PRELOAD):
 *   1. malloc(2.000.000) → ghi 0x11 → free → đọc lại (UAF CÓ CHỦ Ý
 *      trong test): mọi byte phải là poison 0xA5 (quarantine giữ
 *      chunk, không trả cho glibc).
 *   2. malloc/free 40 chunk 2 MB → quarantine cap 32 → stats trong
 *      log phải là quarantined=41, evicted=9 (41 lần free đã track:
 *      1 ở test 1 + 40 ở test 2; 41-32 = 9 lần evict).
 *   3. malloc nhỏ (100 byte, ngoài dải track) vẫn hoạt động bình
 *      thường (ghi/đọc lại đúng).
 *   4. free(NULL) không crash.
 *
 * Đọc qua `volatile` để compiler không tối ưu bỏ lần đọc UAF.
 * Biên dịch: gcc -Wall -Wextra -O2 -o free_track_v2e_unit free_track_v2e_unit.c
 * Chạy: FREE_TRACK_LOG=/tmp/v2e-unit.log LD_PRELOAD=./free_track_v2e_preload.so ./free_track_v2e_unit
 * rồi kiểm tra log có dòng stats như trên.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Cảnh báo -Wuse-after-free là CÓ CHỦ Ý: test này đọc lại bộ nhớ sau
   free để kiểm tra poison (đó chính là thứ cần kiểm). */
#pragma GCC diagnostic ignored "-Wuse-after-free"

static int check_poison(volatile unsigned char *p, size_t n) {
  unsigned long sum = 0;
  for (size_t i = 0; i < n; i++) sum += p[i];
  /* Mọi byte 0xA5: tổng = 0xA5 * n. */
  return sum == 0xA5UL * (unsigned long)n;
}

int main(void) {
  /* Test 1: poison sau free. */
  size_t n1 = 2000000;
  unsigned char *a = (unsigned char *)malloc(n1);
  if (!a) { printf("FAIL malloc test1\n"); return 1; }
  memset(a, 0x11, n1);
  free(a);
  if (!check_poison((volatile unsigned char *)a, n1)) {
    printf("FAIL test1: chunk sau free KHONG toan 0xA5 (quarantine/poison hong)\n");
    return 1;
  }
  printf("PASS test1: 2MB chunk sau free doc lai toan 0xA5\n");

  /* Test 2: 40 lần free → vượt cap 32 → evict. */
  void *ptrs[40];
  for (int i = 0; i < 40; i++) {
    ptrs[i] = malloc(n1);
    if (!ptrs[i]) { printf("FAIL malloc test2 i=%d\n", i); return 1; }
    memset(ptrs[i], (unsigned char)i, n1);
  }
  for (int i = 0; i < 40; i++) free(ptrs[i]);
  /* Chunk cuối cùng (chưa bị evict vì mới free) vẫn còn poison. */
  if (!check_poison((volatile unsigned char *)ptrs[39], n1)) {
    printf("FAIL test2: chunk moi free nhat KHONG toan 0xA5\n");
    return 1;
  }
  printf("PASS test2: 40 chunk free xong, chunk moi nhat van poison (xem stats trong log: quarantined=41 evicted=9)\n");

  /* Test 3: malloc nhỏ ngoài dải track vẫn bình thường. */
  char *s = (char *)malloc(100);
  if (!s) { printf("FAIL malloc test3\n"); return 1; }
  strcpy(s, "v2e-unit-ok");
  if (strcmp(s, "v2e-unit-ok") != 0) { printf("FAIL test3: du lieu nho sai\n"); return 1; }
  free(s);
  printf("PASS test3: malloc nho (ngoai dai track) binh thuong\n");

  /* Test 4: free(NULL). */
  free(NULL);
  printf("PASS test4: free(NULL) khong crash\n");
  printf("ALL UNIT PASS\n");
  return 0;
}
