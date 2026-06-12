import { BRAND_LOGO_SRC, BRAND_NAME, BRAND_TAGLINE } from "@/config/brand";
import styles from "./LoginBranding.module.css";

export function LoginBranding() {
  return (
    <div className={styles.branding}>
      <div className={styles.bgDecor} aria-hidden />
      <div className={styles.content}>
        <img
          src={BRAND_LOGO_SRC}
          alt={BRAND_NAME}
          className={styles.logoImg}
          width={192}
          height={120}
        />
        <h1 className={styles.title}>{BRAND_NAME}</h1>
        <p className={styles.subtitle}>{BRAND_TAGLINE}</p>
      </div>
    </div>
  );
}
