/* GET /api/avaliacoes · avaliações do perfil oficial no Google (Places API · New)
   Variáveis da Vercel: GOOGLE_PLACES_API_KEY e GOOGLE_PLACE_ID (ID do perfil "Lippmann Treinamentos & Soluções").
   Sem a chave, responde { ok:false } e a página usa os depoimentos de reserva. */
const U = require("./_lib/util");

module.exports = async (req, res) => {
  if (!U.apenasMetodo(req, res, "GET")) return;
  const chave = process.env.GOOGLE_PLACES_API_KEY, lugar = process.env.GOOGLE_PLACE_ID;
  const sair = (status, dados, cache) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", cache || "public, s-maxage=300"); res.end(JSON.stringify(dados)); };
  if (!chave || !lugar) return sair(200, { ok: false, configurado: false });
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(lugar)}?languageCode=pt-BR`, {
      headers: { "X-Goog-Api-Key": chave, "X-Goog-FieldMask": "displayName,rating,userRatingCount,googleMapsUri,reviews,googleMapsLinks" },
    });
    const j = await r.json();
    if (!r.ok) { console.error("avaliacoes:", r.status, JSON.stringify(j).slice(0, 300)); return sair(200, { ok: false, configurado: true }); }
    const reviews = (j.reviews || []).filter((x) => x.text && x.text.text).map((x) => ({
      nome: (x.authorAttribution || {}).displayName || "Cliente Google",
      perfil: (x.authorAttribution || {}).uri || "",
      foto: (x.authorAttribution || {}).photoUri || "",
      nota: x.rating || 5,
      texto: (x.originalText && x.originalText.text) || x.text.text,
      data: x.publishTime || null,
      relativo: x.relativePublishTimeDescription || "",
      link: x.googleMapsUri || "",
    }));
    const links = j.googleMapsLinks || {};
    return sair(200, {
      ok: true, nome: (j.displayName || {}).text || "", nota: j.rating || null, total: j.userRatingCount || 0, reviews,
      url: links.reviewsUri || j.googleMapsUri || "", avaliar: links.writeAReviewUri || `https://search.google.com/local/writereview?placeid=${encodeURIComponent(lugar)}`,
    }, "public, s-maxage=21600, stale-while-revalidate=86400");
  } catch (e) {
    console.error("avaliacoes:", e);
    return sair(200, { ok: false, configurado: true });
  }
};
