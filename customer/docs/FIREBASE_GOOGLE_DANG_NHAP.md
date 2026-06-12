# Đăng nhập Google (Firebase) — checklist ghi nhớ

Tài liệu này tóm tắt **việc cần làm sau khi đã merge code** để luồng Google hoạt động trên Macvilla-Customer + backend `BE_HDGVH`.

---

## 1. Firebase Console

1. Vào [Firebase Console](https://console.firebase.google.com/) → chọn project (hoặc tạo mới).
2. **Build → Authentication → Sign-in method** → bật **Google**.
3. **Build → Authentication → Settings → Authorized domains**: thêm các domain storefront sẽ chạy (ví dụ `localhost`, domain production).
4. **Project settings** (biểu tượng bánh răng) → mục **Your apps** → app **Web** → lấy object cấu hình SDK (apiKey, authDomain, projectId, appId, messagingSenderId).

---

## 2. Frontend — file `.env` (Macvilla-Customer)

Copy từ [.env.example](../.env.example) và điền (tên biến cố định vì dùng `import.meta.env.VITE_*`):

| Biến | Ghi chú |
|------|--------|
| `VITE_FIREBASE_API_KEY` | Từ Firebase Web config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Từ Firebase Web config |
| `VITE_FIREBASE_PROJECT_ID` | Từ Firebase Web config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Nên có |
| `VITE_FIREBASE_APP_ID` | Nên có |
| `VITE_API_BASE_URL` | URL backend (hoặc để trống nếu dev dùng proxy Vite như `.env.example`) |

Sau khi sửa `.env`, **restart** dev server (`npm run dev`).

**Code tham chiếu:** [`src/lib/firebase/firebaseAuth.js`](../src/lib/firebase/firebaseAuth.js) — popup Google, lấy **Google ID JWT** gửi API.

---

## 3. Backend — `GoogleOAuth:ClientId`

- Trong `appsettings.json` / biến môi trường / secret production, đặt section **`GoogleOAuth`** với **`ClientId`** = **OAuth 2.0 Client ID kiểu Web** (cùng Google Cloud project với Firebase — thường là Web client hiển thị trong Firebase/Google Cloud).

**Bắt buộc khớp:** giá trị này phải là **audience (`aud`)** của JWT mà popup Firebase trả về. Nếu sai hoặc để trống, verify token sẽ thất bại.

**Code tham chiếu:** [`BE_HDGVH/Service/GoogleIdTokenVerifier.cs`](../../BE_HDGVH/Service/GoogleIdTokenVerifier.cs), cấu hình mẫu [`BE_HDGVH/appsettings.json`](../../BE_HDGVH/appsettings.json) (`GoogleOAuth.ClientId`).

**CSDL:** migration `AddCustomerGoogleOAuthColumns` (bảng `Customers`: các cột Google + cho phép `Phone` NULL). Nếu lỗi *Invalid column name 'GoogleSubject'*, backend chưa `database update` — chạy `dotnet ef database update` trong thư mục `BE_HDGVH` (hoặc áp migration tương đương trên SQL Server).

**API đã có:**

- B2C: `POST /api/store/auth/google` — body `{ "idToken": "<jwt>" }`.
- B2B: `POST /api/store/b2b/auth/google` — cùng body; **không tạo** tài khoản đối tác mới, chỉ đăng nhập/liên kết nếu đã có B2B.

---

## 4. Kiểm tra nhanh trên giao diện

1. Mở [trang đăng nhập](../src/pages/LoginPage.jsx): tab **Khách hàng cá nhân** hoặc **Doanh nghiệp**.
2. Bấm **«Tiếp tục với Google»** → chọn tài khoản Google.
3. **B2C:** có thể tạo user mới (email đã xác minh) hoặc liên kết tài khoản email đã tồn tại.
4. **B2B:** chỉ thành công nếu email đã có tài khoản đối tác đăng ký trước; nếu chưa có, backend trả lỗi hướng dẫn đăng ký.
5. Đóng cửa sổ popup không đăng nhập → nên thấy thông báo thân thiện, không crash.

---

## 5. Build production (FE)

Vite 8 yêu cầu **Node.js ≥ 20.19** (hoặc 22.12+). Nếu `npm run build` lỗi vì phiên bản Node, hãy nâng Node rồi build lại và truyền `VITE_*` lúc build (Docker/CI).

---

## 6. Hướng mở rộng (không bắt buộc)

- Fallback `signInWithRedirect` khi trình duyệt chặn popup.
- Dùng **Firebase ID token** thay Google JWT: cần verify bằng **Firebase Admin SDK** trên backend — **khác** luồng hiện tại.

---

*Cập nhật theo triển khai trong repo FE_HDGVH (Macvilla-Customer + BE_HDGVH).*
