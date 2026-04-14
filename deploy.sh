#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# ImobiSaaS — Script de deploy para VPS Linux
# Execute como root ou com sudo: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       ImobiSaaS — Deploy no VPS          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Instalar Docker e Docker Compose ──────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "▸ Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✔ Docker instalado"
else
  echo "✔ Docker já instalado"
fi

if ! docker compose version &> /dev/null; then
  echo "▸ Instalando Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
fi

# ── 2. Criar arquivo .env.production se não existir ──────────────────────────
if [ ! -f .env.production ]; then
  echo ""
  echo "⚠ Arquivo .env.production não encontrado!"
  echo "  Crie o arquivo com base em .env.production.example"
  echo "  cp .env.production.example .env.production && nano .env.production"
  echo ""
  exit 1
fi

# Usar .env.production como .env para o docker-compose
cp .env.production .env

# ── 3. Build e subir os containers ───────────────────────────────────────────
echo ""
echo "▸ Construindo imagem Docker..."
docker compose build --no-cache

echo ""
echo "▸ Iniciando containers..."
docker compose up -d

echo ""
echo "▸ Aguardando aplicação ficar pronta..."
sleep 10

# ── 4. Status ────────────────────────────────────────────────────────────────
echo ""
docker compose ps
echo ""
echo "✔ Deploy concluído!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " App rodando em: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para ver os logs:"
echo "  docker compose logs -f app"
echo ""
echo "Para configurar HTTPS (após apontar domínio):"
echo "  bash ssl.sh seu-dominio.com.br seu@email.com"
echo ""
