# Modal de Exportação - Configuração por Contexto

## Visão Geral

O modal de exportação agora suporta diferentes configurações de formatos dependendo do contexto de uso.

## Implementação

### ExportModal.tsx

**Propriedade:** `excludeFormats?: string[]`

- **Padrão:** `['xlsx']` - Exclui apenas Excel
- **Uso:** Permite filtrar formatos específicos do modal

**Formatos Disponíveis:**
```typescript
const allFormats = [
  'pdf',          // PDF
  'compress',     // PDF Comprimido
  'png',          // PNG
  'docx',         // Word
  'xlsx',         // Excel
  'jpg',          // JPG
  'pptx',         // PowerPoint
];
```

## Contextos de Uso

### 1. Editor (/editor)

**Componente:** `PDFEditorNPM.tsx`

**Configuração:**
```tsx
<ExportModal onExport={handleExport} />
// excludeFormats padrão: ['xlsx']
```

**Formatos Exibidos:**
- ✅ PDF
- ✅ PDF Comprimido
- ✅ PNG
- ✅ Word
- ❌ Excel (excluído)
- ✅ JPG
- ✅ PowerPoint

**Layout:** Grid 3 colunas (7 formatos → 3-3-1)

---

### 2. Landing Page (/pt/pdf-converter)

**Componente:** `PDFConverter.tsx`

**Configuração:**
```typescript
// Modal próprio com formatos filtrados
const formats = [
  'png',    // PNG
  'docx',   // Word
  'jpg',    // JPG
  'pptx',   // PowerPoint
];
```

**Formatos Exibidos:**
- ❌ PDF (excluído)
- ❌ PDF Comprimido (excluído)
- ✅ PNG
- ✅ Word
- ❌ Excel (excluído)
- ✅ JPG
- ✅ PowerPoint

**Layout:** Grid 2 colunas (4 formatos → 2-2)

**Razão:** Na landing page, o usuário já tem um PDF e quer convertê-lo para outro formato. Não faz sentido oferecer "salvar como PDF" ou "comprimir PDF" nesse fluxo inicial.

---

## Estrutura do Modal

### PDFConverter (Landing Page)

```tsx
<Dialog open={showExportModal} onOpenChange={setShowExportModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        Ótimo trabalho!
      </DialogTitle>
    </DialogHeader>

    {/* Nome do arquivo */}
    <Input value={filename} onChange={...} />

    {/* Grid 2 colunas - 4 formatos */}
    <div className="grid grid-cols-2 gap-3">
      {/* PNG, Word, JPG, PowerPoint */}
    </div>

    {/* Botão de download */}
    <Button onClick={handleExport}>
      Baixar arquivo
    </Button>
  </DialogContent>
</Dialog>
```

### ExportModal (Editor)

```tsx
<Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        Ótimo trabalho!
      </DialogTitle>
    </DialogHeader>

    {/* Nome do arquivo */}
    <Input value={filename} onChange={...} />

    {/* Grid 3 colunas - 6 formatos */}
    <div className="grid grid-cols-3 gap-3">
      {/* PDF, Compress, PNG, Word, JPG, PowerPoint */}
    </div>

    {/* Botão de exportação */}
    <Button onClick={handleExport}>
      Exportar
    </Button>
  </DialogContent>
</Dialog>
```

## Fluxo de Uso

### Landing Page (/pt/pdf-converter)

1. **Usuário faz upload do PDF**
2. **Modal abre automaticamente**
3. **Escolhe um dos 4 formatos:**
   - PNG
   - Word
   - JPG
   - PowerPoint
4. **Clica em "Baixar arquivo"**
5. **É redirecionado para /editor**
6. **Modal de exportação do editor abre**
7. **Conversão é processada**

### Editor (/editor)

1. **Usuário clica em "Exportar"**
2. **Modal abre com 6 opções:**
   - PDF (exportar com anotações)
   - PDF Comprimido
   - PNG
   - Word
   - JPG
   - PowerPoint
3. **Escolhe formato**
4. **Clica em "Exportar"**
5. **Arquivo é processado e baixado**

## Benefícios

✅ **Contexto Apropriado:** Cada página mostra apenas formatos relevantes

✅ **UX Melhorada:** Usuários não veem opções confusas (como "salvar PDF" quando já têm um PDF)

✅ **Flexibilidade:** Fácil adicionar novos contextos com diferentes formatos

✅ **Manutenibilidade:** Formatos centralizados em `allFormats`

✅ **Consistência:** Mesmo componente base, comportamentos diferentes

## Expansão Futura

Para adicionar novos contextos:

```tsx
// Novo contexto: Merge PDF
<ExportModal 
  onExport={handleExport}
  excludeFormats={['compress', 'png', 'jpg']} // Apenas PDF e documentos
/>
```

Ou criar modais específicos como em PDFConverter para controle total.
