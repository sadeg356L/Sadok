import { skillGroups } from "../data/content";
import "./styles/Skills.css";

const ARABIC = /[\u0600-\u06FF]/;

const isLatin = (value: string) => !ARABIC.test(value);

const Skills = () => {
  return (
    <section
      className="section skills"
      id="skills"
      aria-labelledby="skills-title"
    >
      <div className="shell">
        <div className="section-head" data-reveal>
          <span className="section-index">03</span>
          <div>
            <h2 className="section-title" id="skills-title">
              ما <span className="accent">أعمل به</span>
            </h2>
            <p className="section-lede">
              أدوات وتقنيات أستخدمها فعليًا في مشاريعي — بدون نسب مئوية
              مُختلقة.
            </p>
          </div>
        </div>

        <div className="skills__grid">
          {skillGroups.map((group, index) => (
            <article
              className="skills__card"
              key={group.id}
              data-reveal
              data-reveal-delay={(index * 0.05).toFixed(2)}
            >
              <div className="skills__head">
                <h3 className="skills__title">{group.title}</h3>
                <span className="skills__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="skills__caption">{group.caption}</p>
              <ul className="skills__items">
                {group.items.map((item) => (
                  <li key={item} dir={isLatin(item) ? "ltr" : undefined}>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="skills__note" data-reveal>
          القائمة تصف ما أستخدمه في العمل اليومي، وليست شهادة أو تقييمًا
          رسميًا. كل تقنية مذكورة هنا ظهرت في مشروع منشور أو في كود هذا الموقع.
        </p>
      </div>
    </section>
  );
};

export default Skills;
