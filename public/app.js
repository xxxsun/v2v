const $ = (id) => document.getElementById(id);
const state = { type: 'affiliate', generationMode: 't2v', files: [], videoFile: null, jobId: null, videoUrl: null, busy: false };
const MAX_FILE = 3 * 1024 * 1024;
const MAX_TOTAL = 4 * 1024 * 1024;
const MAX_VIDEO = 3 * 1024 * 1024;

function headers(extra = {}) {
  const h = { ...extra };
  const code = localStorage.getItem('rk_access_code');
  if (code) h['x-site-access-code'] = code;
  return h;
}
async function api(url, options = {}) {
  const res = await fetch(url, { ...options, headers: headers(options.headers || {}) });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error((data && data.error) || `Permintaan gagal (${res.status}).`);
  return data;
}
function toast(message) {
  const el = $('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
function setStatus(status, label) {
  const pill = $('statusPill'); pill.className = `status-pill ${status}`; pill.querySelector('span').textContent = label;
}
function setBusy(value) {
  state.busy = value; $('generateBtn').disabled = value;
  $('generateBtn').querySelector('span:nth-child(2)').textContent = value ? 'Sedang memproses…' : 'Generate video';
  $('progressBox').classList.toggle('hidden', !value);
  $('empty-copy').classList.toggle('hidden', value || !!$('videoWrap').dataset.ready);
}
function showError(message) {
  $('errorBox').textContent = message; $('errorBox').classList.remove('hidden');
  $('progressBox').classList.add('hidden'); $('videoWrap').classList.add('hidden'); $('empty-copy').classList.remove('hidden');
  setStatus('failed', 'Ada kendala');
}
function fileToDataURI(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('Gagal membaca file gambar.')); reader.readAsDataURL(file);
  });
}
function updateMedia() {
  const preview = $('mediaPreview'); preview.innerHTML = '';
  state.files.forEach((file, index) => {
    const item = document.createElement('div'); item.className = 'media-thumb';
    const img = document.createElement('img'); img.src = URL.createObjectURL(file); img.alt = `Gambar referensi ${index + 1}`;
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Hapus gambar');
    remove.onclick = () => { state.files.splice(index, 1); updateMedia(); };
    item.append(img, remove); preview.append(item);
  });
  $('imageMode').textContent = state.generationMode === 'r2v' ? 'Character / product reference' : 'Image to Video';
  $('imageLabel').innerHTML = state.generationMode === 'r2v' ? 'Gambar karakter <span class="optional">(opsional, 1 gambar)</span>' : 'Gambar referensi <span class="optional">(hingga 3)</span>';
  $('uploadMode').textContent = state.generationMode === 'r2v' ? 'Video to Video' : state.generationMode === 'i2v' ? 'Image to Video' : 'Text to Video';
  $('imageSourceBox').classList.toggle('hidden', state.generationMode === 't2v');
  $('videoSourceBox').classList.toggle('hidden', state.generationMode !== 'r2v');
  $('mediaInput').multiple = state.generationMode !== 'r2v';
  $('mediaInput').accept = 'image/png,image/jpeg,image/webp';
  const maxImages = state.generationMode === 'r2v' ? 1 : 3;
  if (state.files.length > maxImages) state.files.splice(maxImages);
}
function promptFromFields() {
  if (state.generationMode === 'r2v') {
    if (state.type === 'influencer') {
      const name = $('personaName').value.trim() || 'persona AI saya';
      const look = $('personaLook').value.trim() || 'tampilan konsisten dan natural';
      const bible = $('characterBible').value.trim();
      const scene = $('influencerScene').value.trim() || 'pertahankan ide dan alur adegan dari video sumber';
      return `Gunakan video sumber sebagai referensi gerakan, urutan adegan, framing kamera, dan ritme. Reimajinasikan pemeran utama sebagai persona AI bernama ${name}; jangan sekadar menyalin identitas pemeran asli. Ciri visual persona: ${look}. ${bible ? `Character Bible yang harus diikuti: ${bible}.` : ''} ${state.files.length ? 'Gunakan gambar referensi yang diunggah sebagai acuan visual utama karakter.' : ''} Adegan/arah kreatif: ${scene}. Jaga desain karakter dan pakaiannya konsisten sepanjang klip, usahakan gerakan dan komposisi mengikuti video sumber, hasilkan tampilan natural dan sinematik. Hindari teks/logo acak. Gunakan hanya video dan referensi yang hak penggunaannya saya miliki.`;
    }
    const product = $('productName').value.trim() || 'produk dalam video';
    const benefit = $('sellingPoint').value.trim();
    const cta = $('cta').value.trim() || 'Lihat detail produk';
    return `Gunakan video sumber sebagai referensi adegan, timing, gerakan kamera, dan ritme untuk membuat versi baru konten affiliate. Fokuskan cerita pada ${product}. ${benefit ? `Sorot manfaat: ${benefit}.` : ''} ${state.files.length ? 'Gunakan gambar referensi tambahan sebagai acuan produk/gaya.' : ''} Pertahankan gerakan yang relevan, tampilkan produk dengan jelas, dan akhiri dengan ajakan “${cta}”. Hasil harus natural dan tidak membuat klaim produk berlebihan. Gunakan hanya media yang hak penggunaannya saya miliki.`;
  }
  if (state.type === 'affiliate') {
    const product = $('productName').value.trim() || 'produk yang ditampilkan';
    const benefit = $('sellingPoint').value.trim();
    const cta = $('cta').value.trim() || 'Lihat detail produk';
    const style = $('styleSelect').value;
    return `Buat video pendek vertikal 9:16 untuk konten affiliate bergaya ${style}. Tampilkan ${product} sebagai fokus utama dengan detail produk yang jelas dan realistis. ${benefit ? `Sorot manfaat utama: ${benefit}.` : 'Tampilkan cara penggunaan dan manfaat produk secara natural.'} Buat pembuka yang menarik dalam 2 detik pertama, demonstrasi singkat, pencahayaan bagus, gerakan kamera halus, dan suasana autentik seperti rekomendasi jujur dari kreator. Akhiri dengan ajakan: “${cta}”. Jangan menambahkan teks/logo acak, jangan membuat klaim berlebihan, dan jangan mengubah bentuk produk.`;
  }
  const name = $('personaName').value.trim() || 'seorang kreator';
  const niche = $('personaNiche').value.trim() || 'lifestyle';
  const look = $('personaLook').value.trim() || 'tampilan natural dan ekspresif';
  const bible = $('characterBible').value.trim();
  const scene = $('influencerScene').value.trim() || 'menyapa audiens dan membagikan satu tips menarik';
  return `Buat video pendek vertikal 9:16 bergaya AI influencer untuk niche ${niche}. Persona bernama ${name}, ciri visual: ${look}. ${bible ? `Character Bible: ${bible}.` : ''} Adegan: ${scene}. Gunakan karakter yang konsisten sepanjang video, ekspresi wajah natural, bahasa tubuh santai, pencahayaan lembut, framing medium close-up, dan kamera stabil dengan gerakan halus. Gaya konten ramah, terasa personal, dan cocok untuk TikTok/Reels. Hindari teks/logo acak dan jangan meniru orang nyata.`;
}
async function updateCredits() {
  $('creditText').innerHTML = 'Kredit <b>…</b>';
  try {
    const data = await api('/api/credit');
    const value = Number(data.credit);
    $('creditText').innerHTML = `Kredit <b>${Number.isFinite(value) ? value.toLocaleString('id-ID') : '—'}</b>`;
    $('creditBtn').title = data.unlimited ? 'API Unlimited aktif' : `Saldo kredit: ${data.credit}`;
  } catch (e) {
    $('creditText').innerHTML = 'Kredit <b>—</b>';
    if (/akses|kode/i.test(e.message)) toast('Kode akses diperlukan. Klik ikon kunci di kanan atas.');
  }
}
async function generate() {
  if (state.busy) return;
  const prompt = $('prompt').value.trim();
  if (!prompt) { $('prompt').focus(); toast('Isi prompt video terlebih dahulu.'); return; }
  if (state.generationMode === 'i2v' && state.files.length === 0) { toast('Unggah setidaknya satu gambar untuk Image-to-Video.'); return; }
  if (state.generationMode === 'r2v' && !state.videoFile) { toast('Unggah video sumber MP4 terlebih dahulu.'); return; }
  if (state.generationMode === 'r2v' && state.files.length > 1) { toast('Video-to-Video menerima satu gambar karakter opsional.'); return; }
  if (state.files.length > 3) { toast('Maksimal 3 gambar referensi.'); return; }
  $('errorBox').classList.add('hidden'); $('videoWrap').classList.add('hidden'); $('videoWrap').dataset.ready = '';
  $('empty-copy').classList.add('hidden'); $('progressBox').classList.remove('hidden');
  $('progressTitle').textContent = 'Sedang menyiapkan video'; $('progressText').textContent = 'Mengirim brief ke generator…';
  setStatus('working', 'Mengirim brief'); setBusy(true);
  try {
    const imageMedia = await Promise.all(state.files.map(fileToDataURI));
    const body = { mode: state.generationMode, prompt, ratio: Number($('ratio').value), resolution: Number($('resolution').value) };
    if (state.generationMode === 'i2v') body.media = imageMedia;
    if (state.generationMode === 'r2v') body.media = [await fileToDataURI(state.videoFile), ...imageMedia];
    const submitted = await api('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!submitted.job_id) throw new Error('Generator tidak mengembalikan ID pekerjaan.');
    state.jobId = submitted.job_id;
    $('progressTitle').textContent = 'Video sedang dibuat';
    const seconds = Number(submitted.est_seconds) || 60;
    $('progressText').textContent = `Job masuk antrean · estimasi awal sekitar ${seconds} detik.`;
    setStatus('working', 'Dalam antrean');
    await pollUntilDone(state.jobId);
    const downloadResponse = await fetch(`/api/download?id=${encodeURIComponent(state.jobId)}`, { headers: headers() });
    if (!downloadResponse.ok) {
      let message = `Unduhan gagal (${downloadResponse.status}).`;
      try { const payload = await downloadResponse.json(); message = payload.error || message; } catch (_) {}
      throw new Error(message);
    }
    const videoBlob = await downloadResponse.blob();
    if (!videoBlob.size) throw new Error('Hasil video kosong atau tidak bisa diunduh.');
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.videoUrl = URL.createObjectURL(videoBlob.type ? videoBlob : new Blob([videoBlob], { type: 'video/mp4' }));
    $('resultVideo').src = state.videoUrl; $('videoWrap').classList.remove('hidden'); $('videoWrap').dataset.ready = '1';
    $('videoInfo').textContent = `${$('ratio').value === '2' ? 'Vertikal 9:16' : 'Lanskap 16:9'} · MP4`;
    $('empty-copy').classList.add('hidden'); $('progressBox').classList.add('hidden');
    setStatus('success', 'Video selesai'); toast('Video berhasil dibuat.');
    $('resultVideo').load();
    updateCredits();
  } catch (e) {
    showError(e.message || 'Terjadi kesalahan saat membuat video.');
    if (/akses|kode/i.test(e.message)) toast('Periksa atau masukkan kode akses studio.');
  } finally { setBusy(false); }
}
async function pollUntilDone(id) {
  const started = Date.now();
  while (Date.now() - started < 7 * 60 * 1000) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const data = await api(`/api/jobs?id=${encodeURIComponent(id)}`);
    const job = data.job || data;
    const status = String(job.status || '').toLowerCase();
    if (status === 'done' || status === 'completed' || status === 'complete') return job;
    if (status === 'failed' || status === 'error') throw new Error(job.error || 'Pembuatan video gagal. Kredit akan mengikuti kebijakan refund Nexabot.');
    $('progressText').textContent = status === 'queued' ? 'Job masih menunggu giliran di antrean…' : 'AI sedang merender adegan dan gerakan…';
    setStatus('working', status === 'queued' ? 'Dalam antrean' : 'Sedang render');
  }
  throw new Error('Proses belum selesai setelah 7 menit. Coba periksa kembali atau buat job baru.');
}

$('generateBtn').addEventListener('click', generate);
$('makePrompt').addEventListener('click', () => { $('prompt').value = promptFromFields(); $('charCount').textContent = `${$('prompt').value.length} / 1800`; toast('Prompt dibuat dari isian konsep.'); });
$('prompt').addEventListener('input', () => $('charCount').textContent = `${$('prompt').value.length} / 1800`);
document.querySelectorAll('.type-tab').forEach(tab => tab.addEventListener('click', () => {
  state.type = tab.dataset.type;
  document.querySelectorAll('.type-tab').forEach(el => { const selected = el === tab; el.classList.toggle('selected', selected); el.setAttribute('aria-selected', String(selected)); });
  $('affiliateFields').classList.toggle('hidden', state.type !== 'affiliate'); $('influencerFields').classList.toggle('hidden', state.type !== 'influencer');
}));
document.querySelectorAll('.generation-mode').forEach(button => button.addEventListener('click', () => {
  state.generationMode = button.dataset.mode;
  document.querySelectorAll('.generation-mode').forEach(el => el.classList.toggle('selected', el === button));
  if (state.generationMode === 'r2v' && state.files.length > 1) state.files.splice(1);
  updateMedia();
}));
$('videoInput').addEventListener('change', (e) => {
  const file = e.target.files?.[0]; e.target.value = '';
  if (!file) return;
  if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) { toast('Pilih video MP4.'); return; }
  if (file.size > MAX_VIDEO) { toast('Untuk fungsi upload Netlify ini, video sumber maksimal 3 MB. Kompres videonya dulu.'); return; }
  if (file.size + state.files.reduce((sum, image) => sum + image.size, 0) > MAX_TOTAL) { toast('Video dan gambar referensi bersama-sama maksimal 4 MB.'); return; }
  state.videoFile = file;
  const preview = $('videoSourcePreview'); preview.textContent = '';
  const name = document.createElement('span'); name.className = 'source-name'; name.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'source-remove'; remove.textContent = 'Hapus';
  remove.onclick = () => { state.videoFile = null; preview.classList.add('hidden'); };
  preview.append(name, remove); preview.classList.remove('hidden');
});
$('mediaInput').addEventListener('change', async (e) => {
  const incoming = Array.from(e.target.files || []); e.target.value = '';
  const maxImages = state.generationMode === 'r2v' ? 1 : 3;
  if (state.files.length + incoming.length > maxImages) { toast(state.generationMode === 'r2v' ? 'Video-to-Video menerima satu gambar referensi.' : 'Maksimal 3 gambar referensi.'); return; }
  let total = state.files.reduce((sum, file) => sum + file.size, state.videoFile?.size || 0);
  for (const file of incoming) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast('Gunakan JPG, PNG, atau WebP.'); continue; }
    if (file.size > MAX_FILE) { toast('Ukuran maksimal setiap gambar 3 MB.'); continue; }
    if (total + file.size > MAX_TOTAL) { toast('Total ukuran video dan gambar maksimal 4 MB.'); break; }
    state.files.push(file); total += file.size;
  }
  updateMedia();
});
$('uploadZone').addEventListener('dragover', e => { e.preventDefault(); $('uploadZone').classList.add('dragover'); });
$('uploadZone').addEventListener('dragleave', () => $('uploadZone').classList.remove('dragover'));
$('uploadZone').addEventListener('drop', e => { e.preventDefault(); $('uploadZone').classList.remove('dragover'); const dt = new DataTransfer(); Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f)); $('mediaInput').files = dt.files; $('mediaInput').dispatchEvent(new Event('change')); });
$('downloadBtn').addEventListener('click', () => { if (!state.videoUrl) return; const a = document.createElement('a'); a.href = state.videoUrl; a.download = `ruangkreator-${Date.now()}.mp4`; a.click(); });
$('creditBtn').addEventListener('click', updateCredits);
$('accessBtn').addEventListener('click', () => { $('accessCode').value = localStorage.getItem('rk_access_code') || ''; $('accessDialog').showModal(); });
$('accessForm').addEventListener('submit', e => { if (e.submitter && e.submitter.id === 'saveAccess') { e.preventDefault(); const val = $('accessCode').value.trim(); if (val) localStorage.setItem('rk_access_code', val); else localStorage.removeItem('rk_access_code'); $('accessDialog').close(); toast('Kode akses tersimpan di browser ini.'); updateCredits(); } });
document.querySelectorAll('[data-scroll]').forEach(btn => btn.addEventListener('click', () => document.getElementById(btn.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' })));
updateCredits();
