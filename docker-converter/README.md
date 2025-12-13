# PDF Converter Docker Service (com Tesseract OCR)

Serviço Docker que converte PDFs para diversos formatos usando **Tesseract OCR** para melhor extração de texto.

## 🚀 Funcionalidades

- ✅ Conversão de PDF para Word (.docx) com OCR
- ✅ Extração de texto de PDF usando OCR (português + inglês)
- ✅ Suporte a PDFs escaneados (imagens)
- ✅ API REST simples
- ✅ Health check endpoint
- ✅ Logs detalhados

## 🛠️ Tecnologias

- **Python 3.10** - Linguagem base
- **Flask** - Framework web
- **Gunicorn** - Servidor WSGI de produção
- **pdf2docx** - Conversão PDF → Word
- **Tesseract OCR** - Reconhecimento óptico de caracteres
- **pytesseract** - Binding Python para Tesseract
- **pdf2image** - Conversão PDF → Imagens
- **Poppler** - Utilitários para manipulação de PDF

## 📦 Deploy

### Usando o script automático:
```bash
./deploy.sh
```

### Deploy manual:
```bash
# No servidor DigitalOcean
ssh root@192.241.168.116

# Build da imagem
docker build -t pdf-to-word-converter .

# Parar container anterior
docker stop pdf-converter || true
docker rm pdf-converter || true

# Iniciar novo container
docker run -d \
  --name pdf-converter \
  --restart unless-stopped \
  -p 8080:8080 \
  --health-cmd="curl -f http://localhost:8080/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  pdf-to-word-converter
```

## 🔌 API Endpoints

### GET /health
Health check do serviço

**Response:**
```json
{
  "status": "healthy",
  "service": "pdf-to-word-converter",
  "timestamp": "2025-12-12T17:22:22.546507"
}
```

### POST /convert-pdf-to-word
Converte PDF para Word (.docx) usando OCR quando necessário

**Request:**
```json
{
  "pdfBase64": "base64_string_do_pdf",
  "filename": "documento"
}
```

**Response (sucesso):**
```json
{
  "success": true,
  "filename": "documento.docx",
  "data": "base64_string_do_docx",
  "message": "Conversão concluída com sucesso",
  "size_bytes": 36560
}
```

### POST /convert-pdf-to-text
Extrai texto do PDF usando Tesseract OCR

**Request:**
```json
{
  "pdfBase64": "base64_string_do_pdf",
  "filename": "documento",
  "language": "por+eng"
}
```

**Response (sucesso):**
```json
{
  "success": true,
  "filename": "documento.txt",
  "text": "Texto extraído do PDF...",
  "message": "Extração de texto concluída com sucesso",
  "pages": 3,
  "characters": 1523
}
```

## 🧪 Testes

### Testar health check:
```bash
curl http://192.241.168.116:8080/health
```

### Testar conversão para Word:
```bash
curl -X POST http://192.241.168.116:8080/convert-pdf-to-word \
  -H "Content-Type: application/json" \
  -d '{
    "pdfBase64": "JVBERi0x...",
    "filename": "teste"
  }'
```

### Testar extração de texto:
```bash
curl -X POST http://192.241.168.116:8080/convert-pdf-to-text \
  -H "Content-Type: application/json" \
  -d '{
    "pdfBase64": "JVBERi0x...",
    "filename": "teste",
    "language": "por+eng"
  }'
```

## 📊 Logs

### Ver logs em tempo real:
```bash
ssh root@192.241.168.116 'docker logs -f pdf-converter'
```

### Ver últimos logs:
```bash
ssh root@192.241.168.116 'docker logs --tail 50 pdf-converter'
```

## 🔧 Manutenção

### Reiniciar serviço:
```bash
ssh root@192.241.168.116 'docker restart pdf-converter'
```

### Parar serviço:
```bash
ssh root@192.241.168.116 'docker stop pdf-converter'
```

### Remover container:
```bash
ssh root@192.241.168.116 'docker rm -f pdf-converter'
```

### Status do container:
```bash
ssh root@192.241.168.116 'docker ps | grep pdf-converter'
```

## 🌐 Idiomas Suportados no OCR

- **por** - Português
- **eng** - English
- **por+eng** - Português + Inglês (padrão)

Para usar outros idiomas, instale os pacotes necessários no Dockerfile:
```dockerfile
RUN apt-get install -y tesseract-ocr-fra  # Francês
RUN apt-get install -y tesseract-ocr-spa  # Espanhol
```

## 📝 Notas

- O serviço roda na porta **8080**
- Usa **2 workers** do Gunicorn para melhor performance
- Timeout de **120 segundos** para conversões longas
- Arquivos temporários são limpos automaticamente após conversão
- OCR melhora significativamente a qualidade de PDFs escaneados
- DPI de 300 usado para melhor qualidade do OCR

## 🔐 Segurança

- Container roda com restart policy `unless-stopped`
- Health checks automáticos a cada 30 segundos
- CORS habilitado para integração com frontend
- Logs estruturados para auditoria

## 📚 Referências

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [pdf2docx](https://github.com/dothinking/pdf2docx)
- [pytesseract](https://github.com/madmaze/pytesseract)
- [pdf2image](https://github.com/Belval/pdf2image)
