/** Tránh ký tự dễ nhầm (0/O, 1/l/I). */
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGIT = "23456789";
const ALNUM = UPPER + LOWER + DIGIT;

function randomBelow(max) {
  const buf = new Uint32Array(1);
  const limit = 0x100000000 - (0x100000000 % max);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function pick(str) {
  return str[randomBelow(str.length)];
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/**
 * Mật khẩu 6 ký tự: luôn có chữ hoa, chữ thường và chữ số; 3 ký tự còn lại từ bảng chữ-số;
 * thứ tự trộn bằng crypto (Fisher–Yates).
 */
export function generateResetPassword6() {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(ALNUM), pick(ALNUM), pick(ALNUM)];
  shuffleInPlace(chars);
  return chars.join("");
}
