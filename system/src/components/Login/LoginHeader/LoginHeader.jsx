import { BRAND_LOGO_SRC, BRAND_NAME } from "@/config/brand";
import styles from "./LoginHeader.module.css";

export function LoginHeader({
  title = "Đăng nhập",
  description = "Tài khoản nội bộ do quản trị viên cấp.",
}) {
  return (
    <header className={styles.header}>
      <div className={styles.mobileBrand}>
        <img
          src={BRAND_LOGO_SRC}
          alt=""
          className={styles.mobileLogoImg}
          width={48}
          height={48}
        />
        <span className={styles.mobileTitle}>{BRAND_NAME}</span>
      </div>
      <div className={styles.intro}>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
    </header>
  );
}
