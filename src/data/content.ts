/**
 * SADOK — single source of truth for all editable content.
 * Edit this file to update the site. No database, no admin panel.
 *
 * Contact details were verified on SADOK's own published site
 * (sadeg356l.github.io/volt-arc-portfolio). Remove or replace them freely.
 */

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const profile = {
  name: "SADOK",
  age: 19,
  location: "تونس",
  role: "Full-Stack Developer",
  roleAr: "مطوّر ويب متكامل",
  eyebrow: "متاح للفرص والتدريب",
  headline: "أبني الويب كما يجب أن يكون: سريع، واضح، وحيّ.",
  intro:
    "مطوّر Full-Stack من تونس، عمري 19 سنة. أشتغل على الواجهات، التجربة البصرية، والرسوميات ثلاثية الأبعاد، وأحوّل الأفكار إلى مواقع تعمل بسلاسة على الهاتف والحاسوب.",
  about: [
    "بدأت من HTML وCSS، ثم انتقلت إلى JavaScript وReact وTypeScript. اليوم أركّز على بناء تطبيقات ويب كاملة: من بنية المحتوى والواجهة، إلى الحركة والأداء والنشر.",
    "أهتم أيضًا بالذكاء الاصطناعي كأداة عمل يومية، وبـ Three.js وWebGL لأنها تفتح بابًا مختلفًا للتجربة البصرية على الويب.",
    "لا أبيع أرقامًا أو سنوات خبرة لم أعشها. ما تراه هنا مشاريع حقيقية وروابط قابلة للفحص.",
  ],
  email: "sadegtrabelsi39@gmail.com",
  github: "https://github.com/sadeg356L",
  githubHandle: "sadeg356L",
} as const;

export const navLinks = [
  { label: "الرئيسية", href: "#home" },
  { label: "نبذة", href: "#about" },
  { label: "مهارات", href: "#skills" },
  { label: "أعمال", href: "#work" },
  { label: "تواصل", href: "#contact" },
] as const;

export const heroFacts = [
  { label: "العمر", value: "19 سنة" },
  { label: "الموقع", value: "تونس" },
  { label: "التخصص", value: "Full-Stack" },
] as const;

export const marqueeWords = [
  "تطوير كامل",
  "واجهات React",
  "تجربة مستخدم",
  "Three.js",
  "ذكاء اصطناعي",
  "أداء",
] as const;

export type SkillGroup = {
  id: string;
  title: string;
  caption: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: "core",
    title: "الأساسيات",
    caption: "الطبقة التي يقف عليها كل شيء.",
    items: ["HTML", "CSS", "JavaScript", "Responsive Design", "Accessibility"],
  },
  {
    id: "frontend",
    title: "الواجهات",
    caption: "مكوّنات واضحة بدل صفحات مكرّرة.",
    items: ["React", "TypeScript", "Hooks", "Vite", "Component Architecture"],
  },
  {
    id: "threed",
    title: "ثلاثي الأبعاد",
    caption: "مساحة، ضوء، وحركة داخل المتصفح.",
    items: ["Three.js", "React Three Fiber", "WebGL", "GLTF", "Lighting & Materials"],
  },
  {
    id: "python",
    title: "Python",
    caption: "أدوات صغيرة وأتمتة عند الحاجة.",
    items: ["Python", "Scripting", "Data Handling"],
  },
  {
    id: "ai",
    title: "الذكاء الاصطناعي",
    caption: "أستخدمه كمساعد بناء، لا كبديل عن الفهم.",
    items: ["AI-assisted Development", "Prompting", "أدوات بناء المواقع بالذكاء الاصطناعي"],
  },
  {
    id: "design",
    title: "التصميم",
    caption: "الشكل يخدم الوضوح.",
    items: ["UI/UX", "Design Tokens", "Typography", "Motion"],
  },
  {
    id: "tools",
    title: "الأدوات",
    caption: "بيئة عمل بسيطة وثابتة.",
    items: ["Git", "GitHub", "npm", "DevTools", "Vite"],
  },
  {
    id: "practice",
    title: "طريقة العمل",
    caption: "ما أفعله قبل أن أسمّيه منتهيًا.",
    items: ["تنظيم الكود", "اختبار يدوي", "تحسين الأداء", "احترام prefers-reduced-motion"],
  },
];

export const approach = [
  {
    index: "01",
    title: "أفهم قبل أن أبني",
    body: "أبدأ بتوضيح الهدف والجمهور والمحتوى، ثم أرسم هيكل الصفحة قبل كتابة أي سطر. القرار البصري يأتي بعد فهم الوظيفة.",
  },
  {
    index: "02",
    title: "أبني ببساطة",
    body: "مكوّنات صغيرة، أسماء واضحة، وفصل بين المحتوى والتصميم. البساطة ليست شكلاً — هي ما يجعل التعديل لاحقًا ممكنًا.",
  },
  {
    index: "03",
    title: "أختبر وأحسّن",
    body: "أفحص البناء، أخطاء الـConsole، الروابط، والتجاوب. أقلّل المؤثرات الثقيلة على الهاتف، وأترك بديلًا واضحًا حين يفشل WebGL.",
  },
] as const;

export type Project = {
  slug: string;
  name: string;
  aka?: string;
  titleAr: string;
  description: string;
  tech: string[];
  live: string;
  repo: string;
  image: string;
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "sneaker-store-3d",
    name: "KHOTWA",
    aka: "Sneaker Store 3D",
    titleAr: "متجر أحذية بتجربة ثلاثية الأبعاد",
    description:
      "متجر أحذية رياضية عربي موجّه لتونس: مجموعة منتجات، دليل مقاسات، سلة، وطلب مباشر عبر واتساب، مع عارض ثلاثي الأبعاد للحذاء بدل الصور الثابتة.",
    tech: ["JavaScript", "Three.js", "Responsive UI", "WhatsApp flow"],
    live: "https://sadeg356l.github.io/sneaker-store-3d/",
    repo: "https://github.com/sadeg356L/sneaker-store-3d",
    image: asset("previews/sneaker-store.svg"),
    accent: "#b98cff",
  },
  {
    slug: "volt-arc-portfolio",
    name: "NAWAH",
    aka: "Volt Arc Portfolio",
    titleAr: "موقع استوديو تصميم وتطوير",
    description:
      "واجهة استوديو تونسي: خدمات، نماذج أعمال، مراحل تنفيذ، وأسئلة شائعة، مع نموذج طلب يفتح رسالة واتساب جاهزة دون إرسال تلقائي.",
    tech: ["HTML", "CSS", "JavaScript", "MIT template"],
    live: "https://sadeg356l.github.io/volt-arc-portfolio/",
    repo: "https://github.com/sadeg356L/volt-arc-portfolio",
    image: asset("previews/volt-arc.svg"),
    accent: "#8fb8ff",
  },
  {
    slug: "aureon",
    name: "AUREON",
    titleAr: "متجر إلكترونيات مع عرض 3D",
    description:
      "واجهة متجر إلكترونيات فاخرة بالإنجليزية: تصنيفات، الأكثر مبيعًا، أسعار بالدينار التونسي، ومعاينة تفاعلية للمنتجات ثلاثية الأبعاد بالدوران والتكبير.",
    tech: ["TypeScript", "Three.js", "Product Viewer", "E-commerce UI"],
    live: "https://sadeg356l.github.io/aureon/",
    repo: "https://github.com/sadeg356L/aureon",
    image: asset("previews/aureon.svg"),
    accent: "#ff9ad5",
  },
];

export const contact = {
  heading: "لنبنِ شيئًا واضحًا.",
  body: "متاح للعمل الحر، التعاون في مشاريع الويب، وفرص التدريب. اكتب لي سطرين عن الفكرة، وسأردّ بما أستطيع فعله فعلاً.",
  availability: "مفتوح للفرص · تونس",
} as const;
