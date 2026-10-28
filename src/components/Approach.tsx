import { approach } from "../data/content";
import "./styles/Approach.css";

const Approach = () => {
  return (
    <section
      className="section approach"
      id="approach"
      aria-labelledby="approach-title"
    >
      <div className="shell">
        <div className="section-head" data-reveal>
          <span className="section-index">02</span>
          <div>
            <h2 className="section-title" id="approach-title">
              كيف <span className="accent">أبني</span>
            </h2>
            <p className="section-lede">
              ثلاث خطوات ثابتة أتبعها في كل مشروع، من الفكرة إلى النشر.
            </p>
          </div>
        </div>

        <div className="approach__list">
          {approach.map((step) => (
            <article className="approach__item" key={step.index} data-reveal>
              <span className="approach__index" aria-hidden="true">
                {step.index}
              </span>
              <div>
                <h3 className="approach__title">{step.title}</h3>
                <p className="approach__body">{step.body}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="approach__aside" data-reveal>
          <span>
            <strong>البناء</strong> يمر عبر <span className="latin">Vite</span>{" "}
            و<span className="latin">TypeScript</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong>النشر</strong> عبر <span className="latin">GitHub Pages</span>
          </span>
        </p>
      </div>
    </section>
  );
};

export default Approach;
