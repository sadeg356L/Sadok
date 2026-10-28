import { FaGithub } from "react-icons/fa6";
import { FiMail } from "react-icons/fi";
import { profile } from "../data/content";
import "./styles/SocialIcons.css";

const SocialIcons = () => {
  return (
    <aside className="social-rail" aria-label="روابط مباشرة">
      <a
        href={profile.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub — sadeg356L"
        data-cursor="hide"
      >
        <FaGithub aria-hidden="true" />
      </a>
      <a
        href={`mailto:${profile.email}`}
        aria-label="راسلني عبر البريد الإلكتروني"
        data-cursor="hide"
      >
        <FiMail aria-hidden="true" />
      </a>
      <span className="social-rail__line" aria-hidden="true" />
      <span className="social-rail__label latin" aria-hidden="true">
        TN · 2026
      </span>
    </aside>
  );
};

export default SocialIcons;
