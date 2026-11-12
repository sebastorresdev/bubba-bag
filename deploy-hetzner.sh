#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado para Hetzner VPS (Ubuntu 22.04 / 24.04 LTS)
# Sistema: ProgrammingCar / SKVIA
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "   Iniciando Despliegue de ProgrammingCar / SKVIA en Hetzner VPS"
echo "======================================================================"

# 1. Comprobar permisos de root
if [ "$EUID" -ne 0 ]; then
  echo "[-] Por favor ejecute este script con privilegios de root o con sudo."
  exit 1
fi

# 2. Comprobar existencia del archivo .env
if [ ! -f .env ]; then
  if [ -f .env.production.example ]; then
    echo "[!] No se encontró el archivo .env. Creando uno a partir de .env.production.example..."
    cp .env.production.example .env
    echo "[!] IMPORTANTE: Edite el archivo .env con 'nano .env' y configure contraseñas seguras antes de continuar."
    exit 1
  else
    echo "[-] Error: No existe el archivo .env ni .env.production.example."
    exit 1
  fi
fi

# 3. Instalar Docker si no está instalado
if ! command -v docker &> /dev/null; then
  echo "[+] Instalando Docker y Docker Compose..."
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "[+] Docker instalado correctamente."
fi

# 4. Configurar cortafuegos básico UFW
if command -v ufw &> /dev/null; then
  echo "[+] Verificando reglas de firewall UFW..."
  ufw allow 22/tcp comment 'SSH' || true
  ufw allow 80/tcp comment 'HTTP' || true
  ufw allow 443/tcp comment 'HTTPS' || true
  ufw --force enable || true
fi

# 5. Crear directorio de backups persistentes
mkdir -p backups

# 6. Compilar y levantar contenedores
echo "[+] Construyendo imágenes y levantando servicios en Docker..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true
docker compose -f docker-compose.prod.yml up -d --build

# 7. Comprobar estado de los servicios
echo "[+] Esperando a que los servicios inicien..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo "======================================================================"
echo "   ¡Despliegue completado exitosamente!"
echo "   Verifique los logs con: docker compose -f docker-compose.prod.yml logs -f"
echo "======================================================================"
