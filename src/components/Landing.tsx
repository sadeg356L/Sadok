import { PropsWithChildren } from "react";
import { heroFacts, profile } from "../data/content";
import "./styles/Landing.css";

const Landing = ({ children }: PropsWithChildren) => {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero__aura" aria-hidden="true" />
      <div className="hero__grid shell">
        <div className="hero__copy">
          <p className="eyebrow" data-hero-reveal>
            {profile.eyebrow} · {profile.location}
          </p>

          <h1 className="hero__title" id="hero-title" aria-label="SADOK">
            <span className="latin" data-hero-name>
              SADOK
            </span>
          </h1>

          <p className="hero__role" data-hero-reveal>
            <span>
              مطوّر <span className="latin">Full-Stack</span>
            </span>
            <span className="hero__role-sep" aria-hidden="true">
              /
            </span>
            <span className="hero__role-alt">واجهات · 3D · تجربة</span>
          </p>

          <p className="hero__intro" data-hero-reveal>
            {profile.intro}
          </p>

          <div className="hero__actions" data-hero-reveal>
            <a className="btn btn-primary" href="#work">
              شاهد أعمالي
              <span className="btn-arrow" aria-hidden="true">
                ←
              </span>
            </a>
            <a className="btn btn-ghost" href="#contact">
              تواصل معي
            </a>
          </div>

          <ul className="hero__facts" data-hero-reveal>
            {heroFacts.map((fact) => (
              <li key={fact.label}>
                <span className="hero__fact-label">{fact.label}</span>
                <span className="hero__fact-value">{fact.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__visual" data-hero-visual>
          <div className="hero__halo" aria-hidden="true" />
          <div className="hero__orb" aria-hidden="true" />
          {children}
          <p className="hero__visual-note latin" aria-hidden="true">
            MOVE YOUR CURSOR
          </p>
        </div>
      </div>

      <a className="hero__scroll" href="#about" aria-label="انتقل إلى نبذة عني">
        <span className="hero__scroll-line" aria-hidden="true" />
        <span>اسحب للأسفل</span>
      </a>
    </section>
  );
};

export default Landing;
