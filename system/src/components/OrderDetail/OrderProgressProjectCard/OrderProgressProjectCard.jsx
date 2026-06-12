import { Link } from "react-router-dom";
import styles from "./OrderProgressProjectCard.module.css";

const B2B_STEPS = [
  { key: "pending", label: "Chờ xác nhận", done: true, icon: "check" },
  { key: "confirmed", label: "Đã xác nhận", current: true, icon: "hourglass_empty" },
  { key: "processing", label: "Đang xử lý", pending: true, icon: "settings_suggest" },
  { key: "shipping", label: "Đang giao", pending: true, icon: "local_shipping" },
  { key: "done", label: "Hoàn thành", pending: true, icon: "task_alt" },
];

export function OrderProgressProjectCard({
  steps = B2B_STEPS,
  progressPercent = 25,
  projectCode = "Vinhomes Ocean Park 3",
  projectHref = "#",
}) {
  return (
    <div className={styles.card}>
      <div className={styles.inner}>
        <div className={styles.stepperWrap}>
          <p className={styles.sectionLabel}>Trạng thái đơn hàng</p>
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
                  <span className="material-symbols-outlined">{step.icon}</span>
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
        <div className={styles.divider} aria-hidden />
        <div className={styles.projectBox}>
          <p className={styles.projectLabel}>Mã dự án</p>
          <div className={styles.projectRow}>
            <span className={`material-symbols-outlined icon`}>apartment</span>
            <Link to={projectHref} className={styles.projectLink}>
              {projectCode}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
