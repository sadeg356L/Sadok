import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Loading from "../components/Loading";
import { LoadingContext } from "./loadingContext";

const STORAGE_KEY = "sadok:intro-seen";

function shouldSkipIntro() {
  if (typeof window === "undefined") return true;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return true;

  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [skip] = useState(shouldSkipIntro);
  const [progress, setProgress] = useState(skip ? 100 : 0);
  const [isIntroDone, setIsIntroDone] = useState(skip);
  const finished = useRef(skip);
  const frame = useRef(0);
  const hideTimer = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    cancelAnimationFrame(frame.current);
    setProgress(100);

    hideTimer.current = window.setTimeout(() => {
      setIsIntroDone(true);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* storage can be blocked — the intro still closes */
      }
    }, 480);
  }, []);

  useEffect(() => {
    if (finished.current) return;

    const start = performance.now();
    const tick = (now: number) => {
      if (finished.current) return;
      const t = Math.min(1, (now - start) / 1200);
      setProgress(Math.round(t * 94));
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    frame.current = requestAnimationFrame(tick);
    const safety = window.setTimeout(finish, 3200);

    return () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(safety);
      window.clearTimeout(hideTimer.current);
    };
  }, [finish]);

  useEffect(() => {
    document.fonts?.ready.then(() => finish()).catch(() => undefined);
  }, [finish]);

  // The intro is a full-screen overlay: the page behind it must not scroll.
  useEffect(() => {
    if (isIntroDone) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [isIntroDone]);

  const value = useMemo(
    () => ({ progress, isIntroDone, finish }),
    [progress, isIntroDone, finish]
  );

  return (
    <LoadingContext.Provider value={value}>
      {!isIntroDone && <Loading progress={progress} onSkip={finish} />}
      <main className="app" id="main">
        {children}
      </main>
    </LoadingContext.Provider>
  );
};
