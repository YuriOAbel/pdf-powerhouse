#!/bin/bash

# Script de deploy do PDF Converter no DigitalOcean
# Uso: ./deploy.sh

set -e  # Parar em caso de erro

SERVER="root@192.241.168.116"
CONTAINER_NAME="pdf-converter"
IMAGE_NAME="pdf-to-word-converter"
PORT="8080"

echo "🚀 Iniciando deploy do PDF Converter..."
echo ""

# Criar diretório no servidor
echo "📁 Criando diretório no servidor..."
ssh $SERVER "mkdir -p /root/pdf-converter"

# Copiar arquivos
echo "📤 Enviando arquivos para o servidor..."
scp Dockerfile app.py .dockerignore $SERVER:/root/pdf-converter/

# Build e deploy no servidor
echo "🐳 Fazendo build da imagem Docker..."
ssh $SERVER << 'ENDSSH'
cd /root/pdf-converter

# Parar container anterior se existir
if docker ps -a | grep -q pdf-converter; then
    echo "🛑 Parando container anterior..."
    docker stop pdf-converter || true
    docker rm pdf-converter || true
fi

# Remover imagem antiga se existir
if docker images | grep -q pdf-to-word-converter; then
    echo "🗑️  Removendo imagem antiga..."
    docker rmi pdf-to-word-converter || true
fi

# Build da nova imagem
echo "🔨 Building imagem Docker..."
docker build -t pdf-to-word-converter .

# Executar container
echo "▶️  Iniciando container..."
docker run -d \
  --name pdf-converter \
  --restart unless-stopped \
  -p 8080:8080 \
  pdf-to-word-converter

# Aguardar container iniciar
echo "⏳ Aguardando container iniciar..."
sleep 5

# Verificar status
echo ""
echo "📊 Status do container:"
docker ps | grep pdf-converter || echo "❌ Container não está rodando!"

# Testar health
echo ""
echo "🏥 Testando health check..."
sleep 3
curl -f http://localhost:8080/health && echo "" || echo "❌ Health check falhou!"

ENDSSH

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Informações:"
echo "   - Container: $CONTAINER_NAME"
echo "   - Porta: $PORT"
echo "   - URL: http://192.241.168.116:$PORT"
echo ""
echo "🔍 Ver logs:"
echo "   ssh $SERVER 'docker logs -f $CONTAINER_NAME'"
echo ""
echo "🧪 Testar API:"
echo "   curl http://192.241.168.116:$PORT/health"
