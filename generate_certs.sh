#!/usr/bin/env bash
set -euo pipefail

DOMAIN="backendpickmymaid.site"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

check_existing_cert() {
  [[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]]
}

print_expiry() {
  local expiry
  expiry=$(openssl x509 -enddate -noout -in "${CERT_DIR}/fullchain.pem" | cut -d= -f2 || true)
  echo "Current certificate expires on: $expiry"
}

create_cert() {
  echo "🔐 No valid certificate found. Creating wildcard certificate for ${DOMAIN} and *.${DOMAIN}"
  echo "📌 You will now get a TXT record from certbot. Add it to your DNS and continue."

  sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}" \
    -d "*.${DOMAIN}" \
    --manual-public-ip-logging-ok \
    --email "admin@${DOMAIN}"

  echo "🎉 Certificate created successfully"
}

renew_if_needed() {
  echo "🔍 Checking if renewal is required..."
  sudo certbot renew --manual-public-ip-logging-ok || true
  echo "⚡ Renewal check done"
}

################################
# MAIN LOGIC
################################

if ! check_existing_cert; then
  create_cert
  exit 0
fi

echo "📦 Certificate already exists for ${DOMAIN}."
print_expiry
renew_if_needed
echo "✔️ Renewed if needed. Done!"
