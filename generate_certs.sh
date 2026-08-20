#!/usr/bin/env bash
set -euo pipefail

DOMAIN="api.backendpickmymaid.site"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
HAPROXY_CERT_DIR="/etc/haproxy/certs"
HAPROXY_CERT_FILE="${HAPROXY_CERT_DIR}/api-backendpickmymaid-prod.pem"

check_existing_cert() {
  [[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]]
}

print_expiry() {
  local expiry
  expiry=$(openssl x509 -enddate -noout -in "${CERT_DIR}/fullchain.pem" | cut -d= -f2 || true)
  echo "Current certificate expires on: $expiry"
}

create_cert() {
  echo "🔐 No valid certificate found. Creating certificate for ${DOMAIN}"

  sudo certbot certonly \
    --standalone \
    --preferred-challenges http \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}" \
    --email "admin@${DOMAIN}"

  echo "🎉 Certificate created successfully"
}

renew_if_needed() {
  echo "🔍 Checking if renewal is required..."
  sudo certbot renew --quiet || true
  echo "⚡ Renewal check done"
}

combine_for_haproxy() {
  sudo mkdir -p "${HAPROXY_CERT_DIR}"
  sudo bash -c "cat '${CERT_DIR}/fullchain.pem' '${CERT_DIR}/privkey.pem' > '${HAPROXY_CERT_FILE}'"
  sudo chmod 600 "${HAPROXY_CERT_FILE}"
  echo "📦 Combined cert written to ${HAPROXY_CERT_FILE}"
}

################################
# MAIN LOGIC
################################

if ! check_existing_cert; then
  create_cert
else
  echo "📦 Certificate already exists for ${DOMAIN}."
  print_expiry
  renew_if_needed
fi

combine_for_haproxy
echo "✔️ Done!"
