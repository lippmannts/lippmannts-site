/* L³ INTEGRA · utilidades de conteúdo (HUB, catálogo, políticas)
   Todo HTML vindo do editor visual passa por uma lista branca de etiquetas:
   scripts, estilos e códigos maliciosos são removidos antes de gravar. */
const sanitizeHtml = require("sanitize-html");

const OPCOES = {
  allowedTags: ["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "hr", "table", "thead", "tbody", "tr", "th", "td", "iframe", "span", "sup", "sub"],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "width", "height", "loading"],
    iframe: ["src", "title", "allow", "allowfullscreen", "loading", "referrerpolicy"],
    th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
    p: ["style"], span: ["style"],
  },
  allowedStyles: { "*": { "text-align": [/^(left|right|center|justify)$/] } },
  allowedSchemes: ["https", "http", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https", "data"] },
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "youtube.com"],
  transformTags: {
    a: (tag, attr) => ({ tagName: "a", attribs: { ...attr, ...(attr.href && /^https?:/.test(attr.href) ? { target: "_blank", rel: "noopener" } : {}) } }),
    img: (tag, attr) => ({ tagName: "img", attribs: { ...attr, loading: "lazy" } }),
  },
};
const limparHtml = (html) => sanitizeHtml(String(html || ""), OPCOES).slice(0, 200000);

function idYoutube(v) {
  const t = String(v || "").trim();
  const m = t.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(t) ? t : "");
}
function slug(t, max = 80) {
  return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max) || "item";
}
const linhas = (v) => (Array.isArray(v) ? v : String(v || "").split(/\r?\n/)).map((x) => String(x).trim()).filter(Boolean).slice(0, 60);

module.exports = { limparHtml, idYoutube, slug, linhas };
