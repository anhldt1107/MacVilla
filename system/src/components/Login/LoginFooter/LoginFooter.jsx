import { BRAND_COPYRIGHT } from "@/config/brand";
import styles from "./LoginFooter.module.css";

export function LoginFooter({ copyright = BRAND_COPYRIGHT }) {
  return <p className={styles.footer}>{copyright}</p>;
}
