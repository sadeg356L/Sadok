import { useEffect, useState } from "react";
import { navLinks } from "../data/content";
import "./styles/Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("#home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0 || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-40% 0px -52% 0px", threshold: [0.01, 0.2, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${
        open ? " is-open" : ""
      }`}
    >
      <div className="site-header__inner shell">
        <a className="brand" href="#home" aria-label="SADOK — الرئيسية">
          <span className="brand__mark latin" aria-hidden="true">
            S
          </span>
          <span className="brand__name latin">SADOK</span>
          <span className="brand__dot" aria-hidden="true" />
        </a>

        <nav className="site-nav" aria-label="التنقل الرئيسي">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={active === link.href ? "is-active" : undefined}
                  aria-current={active === link.href ? "true" : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a className="header-cta" href="#contact">
          لنبدأ
          <span aria-hidden="true">↖</span>
        </a>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="قائمة الهاتف">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              <span className="mobile-nav__index latin">
                {String(index + 1).padStart(2, "0")}
              </span>
              {link.label}
            </a>
          ))}
          <a
            className="mobile-nav__mail"
            href="#contact"
            onClick={() => setOpen(false)}
          >
            متاح للعمل والتدريب
          </a>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
