import { useState } from "react";
import styles from "./ProductGallery.module.css";

const DEFAULT_MAIN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB12_ZQqFqBNNR69aeEufPKiK9jGzJACXkaqdH_54OTxHqlW9GA48FwiXubWdNv8oPEjG1nrvpupL1v-Y50qsPOYU3iDwKAiUwA52RP8v2gZFcYHu4XyLCaKYixLsrfQTZgJSQiUi7RNUCil0nNgwv1N_s43nnqhf69vy-flY3JTkt-qcwTBn-fecMXblE9aAxn47Tcdvr78oVJed8TJlGZtUfYaFjlykNY2W_mtlBJvHFCVUH8u72ffM89QV8snXZguvFRNGxLy3h0";
const DEFAULT_THUMBS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBC9aRuAOk5xeQF6kLmbYn88-ONMBJOZMsLeVuFR3Koj24_CGyDV6wm1XFoyovmT5SD3meDL4eopcE4YI5grAO4V_Bb31iyyS7BScZb8m_gnwcgE3u_iDZSYIF6OmK9j-D_MLjdadZzbPNZOsw-2yc2y2EvAj70xJnr-JMWM5ru0ppKZjzbxH2v3EtMAsf4t2b894S6qql7jkEnT8dDV0UZRsz8k-AbcTgHqo4dS8J_ZY2F7Q9GBOmhiC61jM5KLyz4m1knJvRKNo2m",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBGdriudPoV6gvsGOsNBgvhFyW0W-Pn1siSmKTxHBOx5pRoeLL-PDcFK28v0UWZgV_NfPDOYRRFuchhMH4gNbKgpG44YxlaoligQfuJKsl0kZtrmLwhLsYEN2cyHenNvcuJThoUzebN9ykJJs75mKYuGYNFtIKn0ib1cel1nSHeiBu-UheEcdKYlbDOJpLZpi0jMyQpwCWofsIeqWp16cRzU_JJfZurt7fUikT5RkhSzlBW0fcEPmJuDXqaW85FpLGmzXlWzRtdjWvF",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAFgAyTVGEVqD5smusZb0GGcA-WVrH8YhLSDFaSr5Ls1trONdhTzwVtdw8jY7sYkHEWM_r1v_Mfy6wX-G5WKyrkThpX2ck3TubbvsARe6WivQu-zKzIzn8N46JnX9RdikfugZOsbpR8myuA-tljofNhr_5SlAwBrCIzLx_FGEm8njPNWoGKRNDDulimhHetFnvxKD7Zkid_-LCuxZ5RxuLT5sooBdOEdDdwfHVJ9WfpwZzFo_h85arGgjuYiHH1gMk3ZmRTPWHPLhCH",
];

export function ProductGallery({
  mainImage = DEFAULT_MAIN,
  thumbnails = DEFAULT_THUMBS,
  badge = "Premium",
  moreCount = 4,
  onImageSelect,
}) {
  const [selected, setSelected] = useState(mainImage);
  const current = selected || mainImage;

  return (
    <div className={styles.card}>
      <div className={styles.grid}>
        <div className={styles.main}>
          <img src={current} alt="" className={styles.mainImg} />
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>
        <div className={styles.thumbs}>
          {thumbnails.slice(0, 2).map((src, i) => (
            <div
              key={i}
              className={styles.thumb}
              onClick={() => {
                setSelected(src);
                onImageSelect?.(src);
              }}
            >
              <img src={src} alt="" className={styles.thumbImg} />
            </div>
          ))}
          <div className={styles.more} onClick={() => onImageSelect?.(thumbnails[2])}>
            <img src={thumbnails[2]} alt="" className={styles.moreImg} />
            <div className={styles.moreOverlay}>+{moreCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
