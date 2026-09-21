const ID_HINTS =
  /\b(yang|apa|apakah|berapa|ada|dari|untuk|dengan|saya|kamu|anda|tolong|bisa|tidak|bukan|sudah|belum|kenapa|mengapa|dimana|kapan|bagaimana|jumlah|paling|banyak|tim|orang|departemen|silakan|coba|lagi|buat|buatkan|tugas|proyek|berapa|siapa|mohon|terima|kasih|hari|ini|besok)\b/gi;
const EN_HINTS =
  /\b(the|what|how|many|where|when|please|could|would|which|most|team|people|department|today|tomorrow|limit|error|try|again|create|task|project|who|thanks)\b/gi;

export function detectChatLanguage(text) {
  const sample = String(text || '').trim();
  if (!sample) return null;
  const idHits = (sample.match(ID_HINTS) || []).length;
  const enHits = (sample.match(EN_HINTS) || []).length;
  if (idHits === 0 && enHits === 0) return null;
  return idHits >= enHits ? 'id' : 'en';
}

export function settingsLanguage(language) {
  return language === 'id' ? 'id' : 'en';
}

export function resolveAssistantLanguage(settingsLang, userText = '') {
  return detectChatLanguage(userText) || settingsLanguage(settingsLang);
}
