#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ImobiSaaS — Configurar SSL com Let's Encrypt (Certbot)
# Uso: bash ssl.sh seu-dominio.com.br seu@email.com
# ─────────────────────────────────────────────────────────────────────────────
set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Uso: bash ssl.sh seu-dominio.com.br seu@email.com"
  exit 1
fi

echo "▸ Instalando Certbot..."
apt-get install -y certbot

echo "▸ Emitindo certificado para $DOMAIN..."
certbot certonly --webroot \
  --webroot-path=/var/lib/docker/volumes/imobisaas_certbot_www/_data \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo "▸ Atualizando configuração do Nginx para HTTPS..."
sed -i "s|seu-dominio.com.br|$DOMAIN|g" nginx/default.conf

# Desabilita bloco HTTP direto e habilita redirect
sed -i 's|^    # return 301|    return 301|' nginx/default.conf
sed -i '/location \/ {/,/^    }$/{ s|^|    # |; }' nginx/default.conf

# Descomenta bloco HTTPS
sed -i 's|^# server {|server {|' nginx/default.conf
sed -i 's|^#     |    |' nginx/default.conf

echo "▸ Recarregando Nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "✔ HTTPS configurado! Acesse: https://$DOMAIN"
echo ""
echo "O certificado renova automaticamente a cada 90 dias."
echo "Para renovar manualmente: certbot renew"
