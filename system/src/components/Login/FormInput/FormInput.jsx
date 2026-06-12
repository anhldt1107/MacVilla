import { useState } from "react";
import styles from "./FormInput.module.css";

/**
 * Text input with optional left icon and right slot (e.g. password visibility).
 */
export function FormInput({
  id,
  label,
  type = "text",
  name,
  placeholder,
  autoComplete,
  required,
  value,
  onChange,
  leftIcon,
  className = "",
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  const rightSlot = isPassword ? (
    <button
      type="button"
      className={styles.toggleBtn}
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>
        {showPassword ? "visibility_off" : "visibility"}
      </span>
    </button>
  ) : null;

  return (
    <div className={`${styles.field} ${className}`.trim()}>
      {label && (
        <div className={rightSlot ? styles.labelRow : undefined}>
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
        </div>
      )}
      <div className={styles.inputWrap}>
        {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          className={`${styles.input} ${rightSlot ? styles.inputWithRight : ""}`.trim()}
          {...rest}
        />
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>
    </div>
  );
}
