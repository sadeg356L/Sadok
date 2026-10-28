import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./styles/Cursor.css";

/**
 * Desktop-only custom cursor.
 * - Never runs on touch devices.
 * - Disabled for visitors who prefer reduced motion (keeps the native cursor).
 * - All listeners and tweens are removed on unmount.
 */
const Cursor = () => {
  const [enabled, setEnabled] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    document.body.classList.add("cursor-ready");

    const ringX = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power2.out" });

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    let visible = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      if (!visible) {
        visible = true;
        gsap.to([ring, dot], { autoAlpha: 1, duration: 0.25 });
      }

      ringX(event.clientX);
      ringY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest) return;
      const interactive = target.closest(
        'a, button, [role="button"], input, textarea, select, [data-cursor="link"]'
      );
      ring.classList.toggle("is-active", Boolean(interactive));
    };

    const onLeave = () => {
      visible = false;
      gsap.to([ring, dot], { autoAlpha: 0, duration: 0.2 });
    };

    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.body.classList.remove("cursor-ready");
      gsap.killTweensOf([ring, dot]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ringRef} />
      <div className="cursor__dot" ref={dotRef} />
    </div>
  );
};

export default Cursor;
