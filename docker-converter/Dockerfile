FROM ubuntu:22.04

# Evitar prompts interativos durante instalação
ENV DEBIAN_FRONTEND=noninteractive

# Instalar Tesseract OCR, LibreOffice, unoconv, Python e dependências
# Tesseract: OCR para melhorar extração de texto de PDFs escaneados
# LibreOffice: Engine para conversões de documentos Office
# unoconv: Conversor universal usando LibreOffice
# pdf2docx: Conversão específica de PDF para DOCX
# ghostscript: Compressão e manipulação de PDFs
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-por \
    tesseract-ocr-eng \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    unoconv \
    python3 \
    python3-pip \
    poppler-utils \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Atualizar pip
RUN pip3 install --upgrade pip

# Instalar bibliotecas Python
# pdf2pptx: Conversão específica PDF para PowerPoint
# pdf2docx: Conversão PDF para Word
# pytesseract: OCR com Tesseract
# pdf2image: Renderização de PDFs
# python-pptx: Manipulação de arquivos PowerPoint
# PyMuPDF (fitz): Renderização de PDFs (dependência do pdf2pptx)
RUN pip3 install flask flask-cors gunicorn pdf2docx pytesseract pdf2image pillow pdf2pptx python-pptx PyMuPDF

# Criar diretório de trabalho
WORKDIR /app

# Copiar código da aplicação
COPY app.py .

# Criar diretório temporário
RUN mkdir -p /tmp/conversions

# Expor porta
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Executar com Gunicorn (production-ready)
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "app:app"]
