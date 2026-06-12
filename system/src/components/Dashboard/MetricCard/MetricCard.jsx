import styles from "./MetricCard.module.css";

const ICON_VARIANTS = {
  primary: styles.iconWrapPrimary,
  orange: styles.iconWrapOrange,
  blue: styles.iconWrapBlue,
  red: styles.iconWrapRed,
};

const BADGE_VARIANTS = {
  positive: styles.badgePositive,
  negative: styles.badgeNegative,
  danger: styles.badgeDanger,
  neutral: styles.badgeNeutral,
};

/**
 * Thẻ metric: icon, badge (tùy chọn), label, value.
 */
export function MetricCard({
  icon,
  iconVariant = "primary",
  badge,
  badgeVariant = "positive",
  label,
  value,
  valueSuffix,
  valueDanger,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={`${styles.iconWrap} ${ICON_VARIANTS[iconVariant] ?? styles.iconWrapPrimary}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        {badge != null && (
          <span className={`${styles.badge} ${BADGE_VARIANTS[badgeVariant] ?? styles.badgeNeutral}`}>
            {badge}
          </span>
        )}
      </div>
      <p className={styles.label}>{label}</p>
      <p className={`${styles.value} ${valueDanger ? styles.valueDanger : ""}`}>
        {value}
        {valueSuffix != null && <span className={styles.valueSuffix}> {valueSuffix}</span>}
      </p>
    </div>
  );
}
