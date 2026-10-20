export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, messages } = req.body || {};
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';

  const systemPrompt = `Anda adalah CakraBot (Cakra AI), asisten kecerdasan buatan resmi agronomi presisi TANACAKRA untuk para petani dan penyuluh di lereng Gunung Merapi (Kapanewon Cangkringan, Kabupaten Sleman, D.I. Yogyakarta).

Karakter & Pedoman:
1. Bersikap ramah, santun, solutif, dan menghargai petani.
2. Jawablah SPESIFIK dan TEPAT SASARAN sesuai pertanyaan petani.
   - Contoh: Jika petani menanyakan rekomendasi tanaman di musim kemarau untuk luas lahan 200 m², hitung dan sarankan komoditas yang cocok (misalnya: Cabai Rawit, Tomat, Terung, atau Sayuran Semusim dengan mulsa dan irigasi tetes/gembor hemat air), jelaskan kebutuhan bibit/populasi untuk luas 200 m², serta langkah praktisnya.
3. Selalu perhatikan ekosistem lokal lereng Merapi Cangkringan: tanah regosol vulkanik berpasir (drainase cepat, butuh pupuk kandang matang/kompos), ketinggian 400-900 mdpl.
4. Jangan berikan jawaban umum yang kaku atau template cuaca jika petani menanyakan hal spesifik. Berikan solusi langsung yang aplikatif di lapangan!
5. Jawab dalam Bahasa Indonesia yang alami, mengalir, dan terstruktur rapi.`;

  const formattedMessages = [{ role: 'system', content: systemPrompt }];
  if (Array.isArray(messages) && messages.length > 0) {
    for (const m of messages) {
      formattedMessages.push({
        role: m.role || 'user',
        content: m.content || m.text || ''
      });
    }
  } else if (prompt) {
    formattedMessages.push({ role: 'user', content: prompt });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Tanacakra-Vercel-AI'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({
      reply,
      source: 'NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)',
      model: 'NVIDIA Llama 3.2'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
