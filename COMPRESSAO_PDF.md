# Compressão de PDF

## Visão Geral

Sistema de compressão de PDF usando Ghostscript no backend, integrado com Supabase Edge Functions e frontend React.

## Arquitetura

```
Frontend (React) 
    ↓
Supabase Edge Function (compress-pdf)
    ↓
Docker API (192.241.168.116:8080/compress-pdf)
    ↓
Ghostscript (compressão)
```

## Backend - Docker API

### Endpoint: POST /compress-pdf

**Localização:** `docker-converter/app.py`

**Request Body:**
```json
{
  "pdfBase64": "base64_string",
  "filename": "documento",
  "quality": "ebook" // Opcional: screen|ebook|printer|prepress
}
```

**Níveis de Qualidade:**
- `screen`: 72 DPI - menor tamanho, menor qualidade
- `ebook`: 150 DPI - boa compressão, qualidade razoável (padrão)
- `printer`: 300 DPI - boa qualidade, compressão moderada
- `prepress`: 300 DPI - melhor qualidade, menor compressão

**Response:**
```json
{
  "success": true,
  "filename": "documento_compressed.pdf",
  "data": "base64_compressed_pdf",
  "original_size_bytes": 1048576,
  "compressed_size_bytes": 524288,
  "compression_ratio_percent": 50.0,
  "quality": "ebook"
}
```

**Implementação:**
- Usa Ghostscript para compressão
- Comando: `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook ...`
- Timeout: 120 segundos
- Retorna estatísticas de compressão

## Supabase Edge Function

**Localização:** `supabase/functions/compress-pdf/index.ts`

**Funcionalidade:**
- Proxy entre frontend e Docker API
- Valida request
- Repassa dados para Docker API
- Retorna resultado para frontend

**Deploy:**
```bash
supabase functions deploy compress-pdf
```

## Frontend

### Biblioteca: src/lib/compressPdf.ts

**Funções Principais:**

1. `compressPdf(options)` - Comprime PDF
   - Converte Blob para base64
   - Chama Supabase Edge Function
   - Retorna resultado com estatísticas

2. `downloadCompressedPdf(base64, filename)` - Baixa PDF comprimido
   - Converte base64 para Blob
   - Cria URL e faz download

**Uso:**
```typescript
import { compressPdf, downloadCompressedPdf } from '@/lib/compressPdf';

const result = await compressPdf({
  pdfBlob: pdfBlob,
  filename: 'documento',
  quality: 'ebook' // Opcional
});

if (result.success && result.data) {
  downloadCompressedPdf(result.data, 'documento_compressed');
}
```

### Integração no Editor

**Localização:** `src/components/editor/PDFEditorNPM.tsx`

**Implementação:**
```typescript
} else if (format === 'compress') {
  // 1. Obter PDF com anotações usando EmbedPDF
  const task = exportProvides.saveAsCopy();
  const arrayBuffer = await task.toPromise();
  const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
  
  // 2. Comprimir usando backend
  const result = await compressPdf({
    pdfBlob,
    filename,
    quality: 'ebook'
  });
  
  // 3. Mostrar estatísticas
  toast.success(`Redução de ${ratio}% (${originalMB} MB → ${compressedMB} MB)`);
  
  // 4. Baixar PDF comprimido
  downloadCompressedPdf(result.data, `${filename}_compressed`);
}
```

### Menu de Exportação

**Localização:** `src/components/editor/ExportModal.tsx`

**Adicionado:**
```typescript
{
  id: 'compress',
  label: 'PDF Comprimido',
  extension: '.pdf',
  icon: <FileArchive className="w-6 h-6" />,
  color: 'bg-indigo-500'
}
```

## Docker

### Dockerfile

**Adicionado:**
```dockerfile
# ghostscript: Compressão e manipulação de PDFs
RUN apt-get update && apt-get install -y \
    ... \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*
```

### Versão

**Atualizada para:** 4.1.0

**Powered by:**
- pdf2docx
- Tesseract OCR
- pdf2pptx (PyMuPDF + python-pptx)
- **Ghostscript** ← NOVO

## Fluxo de Uso

1. **Usuário clica em "Exportar"**
2. **Seleciona "PDF Comprimido"**
3. **Sistema:**
   - Obtém PDF com todas as anotações do EmbedPDF
   - Envia para Supabase Edge Function
   - Edge Function envia para Docker API
   - Ghostscript comprime o PDF
   - Retorna PDF comprimido com estatísticas
4. **Usuário baixa PDF comprimido**
5. **Vê estatísticas:** 
   - Tamanho original
   - Tamanho comprimido
   - Taxa de compressão (%)

## Benefícios

✅ **Redução de Tamanho:** 30-70% dependendo do PDF
✅ **Mantém Anotações:** Usa `exportProvides.saveAsCopy()`
✅ **Qualidade Configurável:** 4 níveis de compressão
✅ **Feedback Visual:** Toasts com progresso e estatísticas
✅ **Arquivo Único:** Download do PDF comprimido

## Testes

### Testar Backend Diretamente

```bash
# Criar PDF de teste em base64
PDF_BASE64=$(base64 -i documento.pdf)

# Testar compressão
curl -X POST http://192.241.168.116:8080/compress-pdf \
  -H "Content-Type: application/json" \
  -d "{
    \"pdfBase64\": \"$PDF_BASE64\",
    \"filename\": \"teste\",
    \"quality\": \"ebook\"
  }"
```

### Testar via Supabase Edge Function

```typescript
const { data, error } = await supabase.functions.invoke('compress-pdf', {
  body: {
    pdfBase64: '...',
    filename: 'teste',
    quality: 'ebook'
  }
});
```

## Deploy

1. **Docker API:**
   ```bash
   cd docker-converter
   ./deploy.sh
   ```

2. **Supabase Edge Function:**
   ```bash
   supabase functions deploy compress-pdf
   ```

3. **Frontend:**
   - Código já integrado
   - Basta fazer commit e push

## Status

✅ Backend implementado (v4.1.0)
✅ Ghostscript instalado
✅ Endpoint /compress-pdf criado
✅ Edge Function deployada
✅ Biblioteca frontend criada
✅ Integração no editor completa
✅ Menu de exportação atualizado
✅ Deploy realizado com sucesso

## Próximos Passos

- [ ] Adicionar seleção de qualidade na UI
- [ ] Mostrar preview do tamanho estimado
- [ ] Adicionar compressão em lote (múltiplos PDFs)
- [ ] Implementar compressão com remoção de imagens/páginas
