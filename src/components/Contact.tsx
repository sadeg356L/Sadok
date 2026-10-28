import { useState } from "react";
import { contact, profile } from "../data/content";
import "./styles/Contact.css";

const Contact = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      className="section contact"
      id="contact"
      aria-labelledby="contact-title"
    >
      <div className="shell contact__inner">
        <div className="contact__copy" data-reveal>
          <span className="eyebrow">{contact.availability}</span>
          <h2 className="contact__title" id="contact-title">
            {contact.heading}
          </h2>
          <p className="contact__body">{contact.body}</p>

          <div className="contact__actions">
            <a className="btn btn-primary" href={`mailto:${profile.email}`}>
              أرسل بريدًا
              <span className="btn-arrow" aria-hidden="true">
                ←
              </span>
            </a>
            <a
              className="btn btn-ghost"
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="latin">GitHub</span>
            </a>
          </div>
        </div>

        <div className="contact__card" data-reveal>
          <div className="contact__row">
            <span className="contact__label">البريد الإلكتروني</span>
            <a className="contact__value latin" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </div>

          <div className="contact__row">
            <span className="contact__label">المعرّف على GitHub</span>
            <a
              className="contact__value latin"
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{profile.githubHandle}
            </a>
          </div>

          <div className="contact__row">
            <span className="contact__label">الموقع</span>
            <span className="contact__value">{profile.location}</span>
          </div>

          <div className="contact__row">
            <span className="contact__label">الحالة</span>
            <span className="contact__value contact__value--status">
              {contact.availability}
            </span>
          </div>

          <button type="button" className="contact__copy" onClick={copyEmail}>
            {copied ? "تم نسخ البريد ✓" : "نسخ البريد الإلكتروني"}
          </button>

          <p className="contact__note">
            هذه البيانات موجودة في ملف واحد:{" "}
            <code className="latin">src/data/content.ts</code> — يمكن تغييرها
            دون لمس أي مكوّن.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
