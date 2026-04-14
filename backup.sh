#!/bin/bash
# ============================================================
# Script de Backup — ImobiSaaS
# Executa: dump do MySQL + compressão das fotos
# Configurar no cron: crontab -e
#   0 3 * * * /home/imobisaas/imobisaas/backup.sh >> /home/imobisaas/logs/backup.log 2>&1
# ============================================================

set -euo pipefail

DATE=$(date +%Y-%m-%d_%H-%M-%S)
APP_DIR="/home/imobisaas/imobisaas"
BACKUP_DIR="/home/imobisaas/backups"
DB_NAME="imobisaas"
DB_USER="imobisaas_user"
DB_PASS="SENHA_DO_BANCO"   # ← alterar para a senha real
KEEP_DAYS=14               # Manter backups dos últimos 14 dias

mkdir -p "$BACKUP_DIR"

echo "[$DATE] Iniciando backup..."

# 1. Dump do banco de dados
echo "[$DATE] Fazendo dump do MySQL..."
mysqldump \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_NAME" | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

echo "[$DATE] Dump salvo: db_${DATE}.sql.gz"

# 2. Backup das fotos (uploads)
if [ -d "$APP_DIR/uploads" ]; then
  echo "[$DATE] Comprimindo uploads..."
  tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" -C "$APP_DIR" uploads/
  echo "[$DATE] Uploads salvos: uploads_${DATE}.tar.gz"
fi

# 3. Remover backups antigos
echo "[$DATE] Removendo backups com mais de $KEEP_DAYS dias..."
find "$BACKUP_DIR" -name "*.gz" -mtime +"$KEEP_DAYS" -delete

# 4. Mostrar espaço usado
echo "[$DATE] Espaço em backups: $(du -sh $BACKUP_DIR | cut -f1)"
echo "[$DATE] Backup concluído com sucesso."
