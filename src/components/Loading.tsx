import { useEffect } from "react";
import "./styles/Loading.css";

interface Props {
  progress: number;
  onSkip: () => void;
}

/**
 * Intro overlay. It never blocks the site permanently: it auto-closes,
 * can be skipped with the mouse or Escape, and is skipped entirely when the
 * visitor prefers reduced motion.
 */
const Loading = ({ progress, onSkip }: Props) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") onSkip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSkip]);

  const percent = Math.round(progress);

  return (
    <div
      className={`intro${percent >= 100 ? " intro--out" : ""}`}
      aria-label="شاشة الدخول"
    >
      <div className="intro__glow" aria-hidden="true" />
      <div className="intro__top">
        <span className="intro__brand latin">SADOK</span>
        <span className="intro__meta latin">Full-Stack Developer · TN</span>
      </div>

      <div className="intro__center">
        <p className="intro__hello">أهلًا، هذه تجربتي</p>
        <p className="intro__name latin" aria-hidden="true">
          SADOK
        </p>
        <p className="intro__sub">واجهات، حركة، وثلاثي الأبعاد — داخل المتصفح.</p>
      </div>

      <div className="intro__bottom">
        <div
          className="intro__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="نسبة تحميل الموقع"
        >
          <span style={{ transform: `scaleX(${percent / 100})` }} />
        </div>
        <div className="intro__row">
          <span className="intro__percent latin">
            {String(percent).padStart(3, "0")}%
          </span>
          <button type="button" className="intro__skip" onClick={onSkip}>
            تخطّي
          </button>
        </div>
      </div>
    </div>
  );
};

export default Loading;
