import { profile } from "../data/content";
import "./styles/About.css";

const interests = [
  "تطوير الويب",
  "الذكاء الاصطناعي",
  "التصميم التفاعلي",
  "Three.js",
  "WebGL",
];

const About = () => {
  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <div className="shell">
        <div className="section-head" data-reveal>
          <span className="section-index">01</span>
          <div>
            <h2 className="section-title" id="about-title">
              نبذة <span className="accent">عنّي</span>
            </h2>
            <p className="section-lede">
              من أنا، وما الذي أشتغل عليه فعلًا — بدون مبالغة.
            </p>
          </div>
        </div>

        <div className="about__grid">
          <aside className="about__meta" data-reveal>
            <dl>
              <div>
                <dt>الاسم</dt>
                <dd className="latin">SADOK</dd>
              </div>
              <div>
                <dt>العمر</dt>
                <dd>{profile.age} سنة</dd>
              </div>
              <div>
                <dt>الموقع</dt>
                <dd>{profile.location}</dd>
              </div>
              <div>
                <dt>التخصص</dt>
                <dd className="latin">Full-Stack Developer</dd>
              </div>
              <div>
                <dt>اللغة الأساسية</dt>
                <dd>العربية</dd>
              </div>
            </dl>
            <p className="about__note">
              كل ما هو مذكور هنا قابل للتحقق من الروابط والمشاريع.
            </p>
          </aside>

          <div className="about__body">
            {profile.about.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 24)}
                data-reveal
                data-reveal-delay={(index * 0.08).toFixed(2)}
              >
                {paragraph}
              </p>
            ))}

            <div className="about__interests" data-reveal>
              <span className="about__interests-label">أهتم بـ</span>
              <ul>
                {interests.map((interest) => (
                  <li key={interest}>{interest}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
