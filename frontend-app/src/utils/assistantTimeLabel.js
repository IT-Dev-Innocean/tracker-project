function capitalize(text) {
  const value = String(text || '');
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function messageDate(msg) {
  const raw = msg?.timestamp;
  if (raw) {
    const match = String(raw).match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
    );
    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0)
      );
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const id = Number(msg?.id);
  if (Number.isFinite(id) && id > 1e11) return new Date(Math.floor(id));
  return null;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatClock(date, language) {
  const minutes = String(date.getMinutes()).padStart(2, '0');
  if (language === 'id') {
    const hours = String(date.getHours()).padStart(2, '0');
    return `${hours}.${minutes}`;
  }
  let hours = date.getHours();
  const suffix = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${hours}.${minutes} ${suffix}`;
}

export function formatAssistantTimeLabel(date, language = 'en', now = new Date()) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const clock = formatClock(date, language);
  if (sameDay(date, now)) {
    return language === 'id' ? `Hari ini ${clock}` : `Today ${clock}`;
  }
  const weekday = capitalize(
    date.toLocaleDateString(locale, { weekday: 'long' })
  );
  const month = capitalize(date.toLocaleDateString(locale, { month: 'long' }));
  return `${weekday}, ${date.getDate()} ${month} ${date.getFullYear()}`;
}

export function shouldShowAssistantTimeLabel(previousDate, nextDate) {
  if (!nextDate) return false;
  if (!previousDate) return true;
  if (!sameDay(previousDate, nextDate)) return true;
  const now = new Date();
  if (!sameDay(nextDate, now)) return false;
  return Math.abs(nextDate.getTime() - previousDate.getTime()) >= 30 * 60 * 1000;
}

export function withMessageTimestamp(msg, fallbackTimestamp) {
  if (!msg || msg.timestamp || msg.sender === 'system') return msg;
  const date = messageDate(msg);
  if (!date) {
    return fallbackTimestamp ? { ...msg, timestamp: fallbackTimestamp } : msg;
  }
  const pad = (n) => String(n).padStart(2, '0');
  return {
    ...msg,
    timestamp: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  };
}

export function normalizeMessageTimestamps(messages) {
  return (messages || []).map((msg) => withMessageTimestamp(msg));
}
