import gsap from "gsap";
import { splitText } from "./splitText";

/**
 * Hero intro. Runs once the intro overlay is gone.
 *
 * Uses fromTo() with explicit end values (never from()), because the effect can
 * be invoked more than once — React StrictMode remounts, intro skipping, HMR —
 * and from() would capture the already-hidden state as its destination.
 */
export function initialFX(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const name = document.querySelector<HTMLElement>("[data-hero-name]");
  const reveals = gsap.utils.toArray<HTMLElement>("[data-hero-reveal]");
  const visual = document.querySelector<HTMLElement>("[data-hero-visual]");
  const targets = [...reveals, visual].filter(
    (el): el is HTMLElement => Boolean(el)
  );

  if (reduced) {
    gsap.set([name, ...targets].filter(Boolean), { clearProps: "all" });
    return () => {};
  }

  // Re-use characters if a previous run already split the name, otherwise the
  // letters would stay hidden after a remount.
  const chars =
    name?.dataset.split === "done"
      ? Array.from(name.querySelectorAll<HTMLElement>(".split-word > span"))
      : splitText(name, "chars");

  const timeline = gsap.timeline({
    defaults: { ease: "power3.out" },
  });

  if (chars.length > 0) {
    timeline.fromTo(
      chars,
      { yPercent: 118, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.05,
        stagger: 0.045,
        ease: "expo.out",
      },
      0.05
    );
  }

  if (reveals.length > 0) {
    timeline.fromTo(
      reveals,
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.09,
      },
      0.25
    );
  }

  if (visual) {
    timeline.fromTo(
      visual,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 1.3, ease: "power2.out" },
      0.15
    );
  }

  return () => {
    timeline.kill();
    gsap.set([...chars, ...targets], {
      clearProps: "opacity,transform,visibility",
    });
  };
}
