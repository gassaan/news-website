export type Category = {
  slug: string;
  name: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  category: string;
  author: string;
  publishedAt: string;
  featured?: boolean;
};

export const categories: Category[] = [
  { slug: "siyaasee", name: "ސިޔާސީ" },
  { slug: "viyafaari", name: "ވިޔަފާރި" },
  { slug: "kulhivaru", name: "ކުޅިވަރު" },
  { slug: "dhuniye", name: "ދުނިޔެ" },
  { slug: "life", name: "ދިރިއުޅުން" },
];

export const articles: Article[] = [
  {
    slug: "sample-article-1",
    title: "މާލޭގައި އާ މަޝްރޫޢުތަކެއް ފެށިއްޖެ",
    excerpt:
      "ސަރުކާރުން ހާމަކުރި ގޮތުގައި، ވެރިރަށުގެ ތަރައްޤީއަށް ހިންގާ ބައެއް މަޝްރޫޢުތައް މިހާރު ވަނީ ފެށިފައި.",
    body: [
      "މިއީ ނަމޫނާ ލިޔުމެކެވެ. މި ސައިޓުގައި ހިމެނޭ ހުރިހާ ޚަބަރުތަކަކީ ވެބްސައިޓް ފަރުމާކުރުމަށްޓަކައި ބޭނުންކޮށްފައިވާ ނަމޫނާ ލިޔުންތަކެކެވެ.",
      "ހަޤީޤީ ޚަބަރު ޝާއިއުކުރުމުގެ ކުރިން، މި ލިޔުންތައް ބަދަލުކުރައްވާށެވެ.",
    ],
    category: "siyaasee",
    author: "ނަމޫނާ ލިޔުންތެރިޔާ",
    publishedAt: "2026-08-18",
    featured: true,
  },
  {
    slug: "sample-article-2",
    title: "ފަތުރުވެރިކަމުގެ ދާއިރާއިން ރަނގަޅު ނަތީޖާތަކެއް",
    excerpt:
      "މި އަހަރުގެ ފުރަތަމަ ހަ މަހުގައި ރާއްޖެ އައި ފަތުރުވެރިންގެ ޢަދަދު އިތުރުވެފައިވާ ކަމަށް ތަފާސްހިސާބުތަކުން ދައްކައިފި.",
    body: [
      "މިއީ ނަމޫނާ ލިޔުމެކެވެ. ހަޤީޤީ ބޭނުމަށްޓަކައި މި ލިޔުން ބަދަލުކުރައްވާށެވެ.",
    ],
    category: "viyafaari",
    author: "ނަމޫނާ ލިޔުންތެރިޔާ",
    publishedAt: "2026-08-17",
    featured: true,
  },
  {
    slug: "sample-article-3",
    title: "ގައުމީ ޓީމް ފައިނަލަށް",
    excerpt:
      "ރޭ ކުޅުނު ސެމީ ފައިނަލް މެޗް ކާމިޔާބުކޮށް، ގައުމީ ފުޓްބޯޅަ ޓީމް ފައިނަލުން ޖާގަ ހޯދައިފި.",
    body: [
      "މިއީ ނަމޫނާ ލިޔުމެކެވެ. ހަޤީޤީ ބޭނުމަށްޓަކައި މި ލިޔުން ބަދަލުކުރައްވާށެވެ.",
    ],
    category: "kulhivaru",
    author: "ނަމޫނާ ލިޔުންތެރިޔާ",
    publishedAt: "2026-08-16",
  },
  {
    slug: "sample-article-4",
    title: "ދުނިޔޭގެ ބާޒާރުގައި ތެލުގެ އަގު",
    excerpt: "ބައިނަލްއަޤްވާމީ ބާޒާރުގައި ތެލުގެ އަގަށް އަންނަނީ ބަދަލުތަކެއް.",
    body: [
      "މިއީ ނަމޫނާ ލިޔުމެކެވެ. ހަޤީޤީ ބޭނުމަށްޓަކައި މި ލިޔުން ބަދަލުކުރައްވާށެވެ.",
    ],
    category: "dhuniye",
    author: "ނަމޫނާ ލިޔުންތެރިޔާ",
    publishedAt: "2026-08-15",
  },
  {
    slug: "sample-article-5",
    title: "ސިއްޙަތަށް ފައިދާހުރި ކެއުމުގެ އާދަތައް",
    excerpt: "ދުޅަހެޔޮ ސިއްޙަތެއްގައި ދެމިހުރުމަށް ބައެއް ފަސޭހަ ލަފާތައް.",
    body: [
      "މިއީ ނަމޫނާ ލިޔުމެކެވެ. ހަޤީޤީ ބޭނުމަށްޓަކައި މި ލިޔުން ބަދަލުކުރައްވާށެވެ.",
    ],
    category: "life",
    author: "ނަމޫނާ ލިޔުންތެރިޔާ",
    publishedAt: "2026-08-14",
  },
];

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return articles.filter((a) => a.category === categorySlug);
}

export function getFeaturedArticles(): Article[] {
  return articles.filter((a) => a.featured);
}
