const { json, accessError, apiKey, missingKey, upstream, upstreamError } = require('../_shared');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Gunakan POST.' });
  const locked = accessError(event); if (locked) return locked;
  if (!apiKey()) return missingKey();
  try {
    const data = JSON.parse(event.body || '{}');
    const modes = new Set(['t2v', 'i2v', 'r2v']);
    if (!modes.has(data.mode)) return json(400, { error: 'Mode tidak valid.' });
    if (typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 1800) return json(400, { error: 'Prompt wajib diisi (maksimal 1800 karakter).' });
    if (![1, 2].includes(Number(data.ratio))) return json(400, { error: 'Rasio harus 1 atau 2.' });
    const payload = { mode: data.mode, prompt: data.prompt.trim(), ratio: Number(data.ratio), resolution: Number(data.resolution) === 1080 ? 1080 : 720 };
    if (data.mode === 'i2v') {
      if (!Array.isArray(data.media) || data.media.length < 1 || data.media.length > 3) return json(400, { error: 'Image to Video memerlukan 1–3 gambar referensi.' });
      const totalChars = data.media.reduce((sum, item) => sum + (typeof item === 'string' ? item.length : 0), 0);
      if (totalChars > 6 * 1024 * 1024 || data.media.some(item => typeof item !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(item))) return json(413, { error: 'Gambar tidak valid atau total ukurannya terlalu besar. Gunakan JPG/PNG/WebP dengan total maksimal 4 MB.' });
      payload.media = data.media;
    }
    if (data.mode === 'r2v') {
      if (!Array.isArray(data.media) || data.media.length < 1 || data.media.length > 2) return json(400, { error: 'Video to Video memerlukan satu video MP4, dengan satu gambar referensi opsional.' });
      const [video, image] = data.media;
      const totalChars = data.media.reduce((sum, item) => sum + (typeof item === 'string' ? item.length : 0), 0);
      if (totalChars > 6 * 1024 * 1024 || typeof video !== 'string' || !/^data:video\/mp4;base64,/.test(video) || (image !== undefined && (typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(image)))) return json(413, { error: 'Video atau gambar referensi tidak valid/terlalu besar. Gunakan MP4 dan opsional JPG/PNG/WebP.' });
      payload.media = data.media;
    }
    const response = await upstream('/api/v1/api', { method: 'POST', body: JSON.stringify(payload) });
    if (!response.ok) return upstreamError(response);
    return json(response.status === 202 ? 202 : response.status, await response.json());
  } catch (error) {
    return json(502, { error: error.message || 'Tidak dapat menghubungi Nexabot.' });
  }
};
