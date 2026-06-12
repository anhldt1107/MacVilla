import styles from "./OrderProgressCard.module.css";

const DEFAULT_STEPS = [
  { key: "pending", label: "Chờ xác nhận", done: true },
  { key: "confirmed", label: "Đã xác nhận", current: true },
  { key: "shipping", label: "Đang giao", pending: true },
  { key: "delivered", label: "Đã giao", pending: true },
];

export function OrderProgressCard({
  statusLabel = "Đã xác nhận (25%)",
  steps = DEFAULT_STEPS,
  progressPercent = 33,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Trạng thái đơn hàng</h3>
        <span className={styles.badge}>{statusLabel}</span>
      </div>
      <div className={styles.stepperWrap}>
        <div className={styles.track} aria-hidden />
        <div
          className={styles.trackFill}
          style={{ width: `${progressPercent}%` }}
          aria-hidden
        />
        <div className={styles.steps}>
          {steps.map((step) => (
            <div key={step.key} className={styles.step}>
              <div
                className={`${styles.dot} ${
                  step.done ? styles.dotDone : step.current ? styles.dotCurrent : styles.dotPending
                }`}
              >
                {step.done && <span className="material-symbols-outlined">check</span>}
              </div>
              <span
                className={`${styles.stepLabel} ${
                  step.done || step.current ? styles.stepLabelActive : styles.stepLabelMuted
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
