#!/usr/bin/env bash
# Jalankan DI VPS (sudah login root), dari mana saja:
#   bash /var/www/tracker-innocean/scripts/setup-tracker-ssl.sh
# atau tempel isi file ini ke sesi SSH.
set -euo pipefail

DOMAIN="tracker.innocean.tech"
EMAIL="bagas.pratama@innocean.co.id"
APP_DIR="/var/www/tracker-innocean"
ORIGIN="https://${DOMAIN}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Jalankan sebagai root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[1/6] Install certbot"
apt-get update -qq
if ! apt-get install -y certbot python3-certbot-nginx; then
  echo "Paket certbot apt gagal; coba snap..."
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
fi

echo "[2/6] Tulis nginx vhost HTTP untuk ${DOMAIN}"
SITE=""
if grep -RIl '127.0.0.1:8085' /etc/nginx >/tmp/nginx-tracker-sites 2>/dev/null; then
  SITE="$(head -1 /tmp/nginx-tracker-sites)"
fi
if [[ -z "${SITE}" ]]; then
  SITE="/etc/nginx/sites-available/tracker-innocean"
fi

cat > "${SITE}" <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name tracker.innocean.tech 31.97.188.65;

    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:8085;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 15s;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
NGINX

mkdir -p /etc/nginx/sites-enabled
ln -sfn "${SITE}" "/etc/nginx/sites-enabled/$(basename "${SITE}")"
if [[ -e /etc/nginx/sites-enabled/default ]] && [[ "$(basename "${SITE}")" != "default" ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl reload nginx

if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
fi

echo "[3/6] Minta sertifikat Let's Encrypt"
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect

echo "[4/6] Set FRONTEND_URL=${ORIGIN}"
cd "${APP_DIR}"
if [[ ! -f .env ]]; then
  echo "File ${APP_DIR}/.env tidak ada." >&2
  exit 1
fi
if grep -q '^FRONTEND_URL=' .env; then
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${ORIGIN}|" .env
else
  printf '\nFRONTEND_URL=%s\n' "${ORIGIN}" >> .env
fi

echo "[5/6] Rebuild frontend + recreate backend (CORS)"
docker compose up -d --build frontend
docker compose up -d --force-recreate --no-deps backend

echo "[6/6] Cek HTTPS"
sleep 2
docker compose ps
curl -sI --max-time 15 "https://${DOMAIN}/" | head -n 15 || true
echo
echo "Selesai. Buka ${ORIGIN}"
