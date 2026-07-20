const isAuth = localStorage.getItem('innocean_auth') === 'true';
if (
  !isAuth || // Selalu paksa mode gelap jika belum login (Landing Page)
  localStorage.getItem('theme') === 'dark' ||
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark');
  document.documentElement.style.backgroundColor = '#0a0a0a'; /* Warna gelap */
} else {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.backgroundColor = '#fafafa'; /* Warna terang */
}
