import { useState } from "react";
import { FormInput } from "../FormInput/FormInput";
import styles from "./LoginForm.module.css";

const ICON_SIZE = { fontSize: "1.25rem" };

export function LoginForm({ onSubmit, submitting = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit?.({ username, password, remember });
  };

  return (
    <form className={styles.form} method="post" onSubmit={handleSubmit} noValidate>
      <FormInput
        id="username"
        label="Tên đăng nhập"
        type="text"
        name="username"
        placeholder="Nhập tên đăng nhập"
        autoComplete="username"
        required
        disabled={submitting}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        leftIcon={
          <span className="material-symbols-outlined" style={ICON_SIZE}>
            person
          </span>
        }
      />
      <FormInput
        id="password"
        label="Mật khẩu"
        type="password"
        name="password"
        placeholder="Nhập mật khẩu"
        autoComplete="current-password"
        required
        disabled={submitting}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={
          <span className="material-symbols-outlined" style={ICON_SIZE}>
            lock
          </span>
        }
      />
      <label className={styles.rememberRow} htmlFor="remember-me">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          className={styles.checkbox}
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          disabled={submitting}
        />
        <span>Ghi nhớ đăng nhập</span>
      </label>
      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
