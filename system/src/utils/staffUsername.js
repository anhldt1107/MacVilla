/**
 * Chữ cái Latin đầu tiên của một ký tự (bỏ dấu, thường).
 * @param {string} ch
 */
function firstAsciiFromChar(ch) {
  if (!ch) return "";
  const normalized = ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const m = normalized.match(/[a-z0-9]/u);
  return m ? m[0] : "";
}

/**
 * Username gốc từ họ tên Việt: chữ cái đầu của Tên, Họ, rồi từng chữ đệm.
 * Ví dụ: "Nguyễn Văn An" → "anv"
 * @param {string} fullName
 */
export function baseUsernameFromFullName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";

  if (parts.length === 1) {
    let out = "";
    for (const c of parts[0]) {
      const L = firstAsciiFromChar(c);
      if (L) out += L;
      if (out.length >= 8) break;
    }
    return out || "u";
  }

  const ho = parts[0];
  const ten = parts[parts.length - 1];
  const dem = parts.slice(1, -1);
  let s = firstAsciiFromChar(ten[0]) + firstAsciiFromChar(ho[0]);
  for (const d of dem) {
    s += firstAsciiFromChar(d[0]);
  }
  return s.replace(/[^a-z0-9]/gi, "").toLowerCase() || "u";
}

/**
 * Mật khẩu mặc định: [username] + 4 số cuối SĐT (chỉ lấy chữ số, thiếu thì pad 0 bên trái).
 * @param {string} username
 * @param {string} phone
 */
export function buildStaffDefaultPassword(username, phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const tail = digits.slice(-4).padStart(4, "0");
  return `${username}${tail}`;
}

/**
 * Chuỗi username thử lần lượt: base, base+1, base+2, …
 * @param {string} base
 * @param {number} attempt 0-based
 */
export function staffUsernameVariant(base, attempt) {
  const b = base || "u";
  if (attempt <= 0) return b;
  return `${b}${attempt}`;
}
