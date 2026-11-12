import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = 'ChIJD_H4-aMgJ1wR2Z25wRuFG8I';
  const linkAvaliar = 'https://g.page';

  if (!apiKey) {
    return res.status(200).json({ ok: false, configurado: false, avaliar: linkAvaliar });
  }

  try {
    const { data: cacheRow } = await supabase
      .from('config')
      .select('valor')
      .eq('chave', 'google_avaliacoes_cache')
      .single();

    if (cacheRow && cacheRow.valor) {
      const cache = JSON.parse(cacheRow.valor);
      if (cache.ok && cache.atualizado_em && (Date.now() - cache.atualizado_em < 86400000)) {
        return res.status(200).json(cache);
      }
    }

    const url = `https://googleapis.com{placeId}?languageCode=pt-BR`;
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        configurado: true,
        avaliar: linkAvaliar,
        detalhe_erro: data.error?.message || 'Erro na Places API (New)'
      });
    }

    const avaliacoes = (data.reviews || []).map((r) => ({
      autor: r.authorAttribution?.displayName || 'Cliente LIPPMANN',
      foto: r.authorAttribution?.photoUri || '',
      nota: r.rating || 5,
      tempo: r.relativePublishTimeDescription || '',
      texto: r.text?.text || r.originalText?.text || ''
    }));

    const resultado = {
      ok: true,
      configurado: true,
      nota: data.rating || 4.9,
      total: data.userRatingCount || 51,
      avaliar: linkAvaliar,
      avaliacoes,
      atualizado_em: Date.now()
    };

    await supabase.from('config').upsert({
      chave: 'google_avaliacoes_cache',
      valor: JSON.stringify(resultado)
    }, { onConflict: 'chave' });

    return res.status(200).json(resultado);
  } catch (err) {
    return res.status(200).json({
      ok: false,
      configurado: true,
      avaliar: linkAvaliar,
      detalhe_erro: err.message
    });
  }
}