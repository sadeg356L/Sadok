import { navLinks, profile } from "../data/content";
import "./styles/Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__mark latin" aria-hidden="true">
            S
          </span>
          <div>
            <p className="site-footer__name latin">SADOK</p>
            <p className="site-footer__role">
              مطوّر ويب متكامل · {profile.location}
            </p>
          </div>
        </div>

        <nav className="site-footer__nav" aria-label="روابط التذييل">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-footer__meta">
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            className="latin"
          >
            GitHub
          </a>
          <a href={`mailto:${profile.email}`} className="latin">
            Email
          </a>
          <a href="#home" className="site-footer__top">
            إلى الأعلى
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>

      <div className="shell site-footer__bottom">
        <p>
          © {year} <span className="latin">SADOK</span>. جميع الحقوق محفوظة.
        </p>
        <p className="site-footer__build">
          مبني بـ <span className="latin">React · TypeScript · Three.js</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
