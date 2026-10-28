import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section reveal — GSAP core + ScrollTrigger only (no Club/trial plugins).
 * Content is only hidden after JS has successfully initialised.
 */
export function initReveals(): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");

  if (reduced || items.length === 0) {
    gsap.set(items, { clearProps: "all" });
    return () => {};
  }

  try {
    const context = gsap.context(() => {
      items.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            delay: Number(el.dataset.revealDelay ?? 0),
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              once: true,
            },
          }
        );
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh).catch(() => undefined);
    }
    window.addEventListener("load", refresh, { once: true });

    return () => {
      window.removeEventListener("load", refresh);
      context.revert();
    };
  } catch (error) {
    // If ScrollTrigger fails for any reason, never leave the content hidden.
    console.warn("Reveal animations disabled:", error);
    gsap.set(items, { opacity: 1, y: 0 });
    return () => {};
  }
}

export function refreshScroll() {
  ScrollTrigger.refresh();
}
