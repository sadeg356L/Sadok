import { useState } from "react";
import { projects } from "../data/content";
import "./styles/Work.css";

const ExternalIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <path
      d="M4 12 12 4M6 4h6v6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CodeIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path
      d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProjectVisual = ({ project }: { project: (typeof projects)[number] }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`work__visual${failed ? " is-fallback" : ""}`}
      style={{ ["--project-accent" as string]: project.accent }}
    >
      {!failed ? (
        <img
          src={project.image}
          alt={`معاينة واجهة مشروع ${project.name} — ${project.titleAr}`}
          loading="lazy"
          decoding="async"
          width="1200"
          height="800"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="work__fallback" aria-hidden="true">
          <span className="work__fallback-name latin">{project.name}</span>
          <span className="work__fallback-line" />
        </div>
      )}
      <span className="work__visual-glow" aria-hidden="true" />
    </div>
  );
};

const Work = () => {
  return (
    <section className="section work" id="work" aria-labelledby="work-title">
      <div className="shell">
        <div className="section-head" data-reveal>
          <span className="section-index">04</span>
          <div>
            <h2 className="section-title" id="work-title">
              مشاريع <span className="accent">منشورة</span>
            </h2>
            <p className="section-lede">
              ثلاثة مشاريع حقيقية، كل واحد منها برابط مباشر ومستودع كود يمكن
              فتحه الآن.
            </p>
          </div>
        </div>

        <div className="work__list">
          {projects.map((project, index) => (
            <article className="work__item" key={project.slug} data-reveal>
              <div className="work__body">
                <div className="work__topline">
                  <span className="work__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="work__name latin">{project.name}</h3>
                </div>

                {project.aka && (
                  <p className="work__aka">
                    المستودع: <span className="latin">{project.aka}</span>
                  </p>
                )}

                <p className="work__subtitle">{project.titleAr}</p>
                <p className="work__description">{project.description}</p>

                <ul className="work__tech" aria-label="التقنيات المستخدمة">
                  {project.tech.map((tech) => (
                    <li key={tech} dir="ltr">
                      {tech}
                    </li>
                  ))}
                </ul>

                <div className="work__links">
                  <a
                    className="work__link work__link--primary"
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    زيارة الموقع
                    <ExternalIcon />
                  </a>
                  <a
                    className="work__link"
                    href={project.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CodeIcon />
                    الكود على GitHub
                  </a>
                </div>
              </div>

              <a
                className="work__media"
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`فتح موقع ${project.name}`}
                tabIndex={-1}
              >
                <ProjectVisual project={project} />
              </a>
            </article>
          ))}
        </div>

        <p className="work__note" data-reveal>
          المشاريع الثلاثة منشورة على{" "}
          <span className="latin">GitHub Pages</span>. قد تتغيّر أسماء المتاجر
          أو محتواها مع تطويرها، لكن الروابط أدناه هي الروابط الرسمية الحالية.
        </p>
      </div>
    </section>
  );
};

export default Work;
