# Modal de Loading de Conversão

## Visão Geral

Sistema de feedback visual durante conversões de PDF com animações, barras de progresso e steps simulando o processo de conversão.

## Componente: ConversionLoadingModal

### Localização
`src/components/ConversionLoadingModal.tsx`

### Features

1. **Animação de Pastas**
   - Pasta azul (origem) com documentos saindo
   - Pasta verde (destino)
   - Linha pontilhada conectando
   - Ícone PDF flutuante animado

2. **Barra de Progresso**
   - Animação suave de 0-100%
   - Cores: gradiente teal (from-teal-500 to-teal-600)
   - Porcentagem exibida abaixo

3. **Steps de Conversão**
   - ✅ Baixando
   - ✅ Convertendo o documento
   - ✅ Protegendo o documento

4. **Estados dos Steps**
   - **Completed:** CheckCircle verde
   - **Current:** Loader animado girando
   - **Pending:** Círculo vazio cinza

5. **Modal Não-fechável**
   - `onInteractOutside` bloqueado
   - Previne fechamento durante conversão

## Implementação na Landing Page

### Localização
`src/pages/PDFConverter.tsx`

### Estados

```typescript
const [showLoadingModal, setShowLoadingModal] = useState(false);
const [progress, setProgress] = useState(0);
const [conversionSteps, setConversionSteps] = useState([
  { label: 'Baixando', completed: false, current: false },
  { label: 'Convertendo o documento', completed: false, current: false },
  { label: 'Protegendo o documento', completed: false, current: false },
]);
```

### Função updateStep

```typescript
const updateStep = (stepIndex: number, completed: boolean, current: boolean) => {
  setConversionSteps(prev => prev.map((step, idx) => ({
    ...step,
    completed: idx < stepIndex ? true : (idx === stepIndex ? completed : false),
    current: idx === stepIndex ? current : false,
  })));
};
```

### Função handleExport (Conversão)

**Fluxo:**

1. **Fecha modal de seleção**
2. **Abre modal de loading**
3. **Step 1: Baixando** (10% - 33%)
   - Para PNG/JPG: delay de 1s
4. **Step 2: Convertendo** (40% - 80%)
   - Chama função de conversão apropriada:
     - `convertPdfToImages()` → PNG/JPG
     - `convertPdfToWord()` → DOCX
     - `convertPdfToPowerPoint()` → PPTX
   - Para PNG/JPG: delay adicional de 1s
5. **Step 3: Protegendo** (80% - 100%)
   - Delay de 500ms
   - Marca como completo
6. **Download**
   - Delay de 500ms para mostrar 100%
   - Executa download
   - Delay de 1s antes de fechar
7. **Fecha modal de loading**
8. **Exibe toast de sucesso**

### Delays por Formato

| Formato | Delay Total | Motivo |
|---------|-------------|--------|
| PNG/JPG | ~3 segundos | Formatos leves, melhor UX |
| Word | Nenhum | Processamento pesado |
| PowerPoint | Nenhum | Processamento pesado |

### Progressos

```
0%   → Início
10%  → Step 1 iniciado (Baixando)
33%  → Step 1 para PNG/JPG (após 1s)
40%  → Step 2 iniciado (Convertendo)
60%  → Conversão PNG/JPG (após 1s)
80%  → Conversão completa
100% → Step 3 completo (Protegendo)
```

## Animações

### Pasta e Documentos

```typescript
// Documento flutuando
<motion.div
  animate={{
    x: [0, 50, 100],      // Move da esquerda para direita
    y: [0, -10, 0],       // Sobe e desce
    opacity: [1, 0.5, 0], // Desaparece
  }}
  transition={{
    duration: 2,
    repeat: Infinity,      // Loop infinito
    ease: "easeInOut"
  }}
>
  <div className="bg-red-500">PDF</div>
</motion.div>
```

### Barra de Progresso

```typescript
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.5 }}
  className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
/>
```

### Steps

```typescript
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: index * 0.2 }} // Stagger effect
>
  {step.completed ? <CheckCircle2 /> : 
   step.current ? <Loader2 className="animate-spin" /> :
   <div className="rounded-full border-2 border-gray-300" />}
</motion.div>
```

## Tratamento de Erros

```typescript
try {
  // Conversão...
} catch (error) {
  console.error('Erro na conversão:', error);
  setShowLoadingModal(false);
  toast.error('Erro na conversão', {
    description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado'
  });
}
```

## Exemplo de Uso

```tsx
{/* Modal de Loading */}
<ConversionLoadingModal
  open={showLoadingModal}
  steps={conversionSteps}
  progress={progress}
/>
```

## UX Considerações

### Por que 3 segundos para PNG/JPG?

1. **Conversões muito rápidas parecem "falsas"**
   - Usuário pode não confiar no resultado
   - Sensação de que algo foi pulado

2. **Feedback visual adequado**
   - Usuário vê todas as etapas
   - Compreende o processo
   - Sente que houve trabalho realizado

3. **Tempo ideal**
   - Não muito longo (não frustra)
   - Não muito curto (não parece falso)
   - ~3 segundos é o sweet spot

### Conversões Pesadas (Word, PowerPoint)

- **Sem delays artificiais**
- Tempo real de processamento já é suficiente
- Modal mostra progresso genuíno
- Usuário entende que é um processo mais complexo

## Melhorias Futuras

- [ ] Progress real baseado em callbacks do backend
- [ ] Cancelamento de conversão
- [ ] Estimativa de tempo baseada em tamanho do arquivo
- [ ] Histórico de conversões
- [ ] Conversão em lote (múltiplos arquivos)
- [ ] Preview do resultado antes do download

## Testes Recomendados

1. **PNG/JPG**
   - PDF com 1 página
   - PDF com múltiplas páginas
   - PDF muito grande (>10MB)

2. **Word**
   - PDF simples (texto)
   - PDF com imagens
   - PDF escaneado (OCR)

3. **PowerPoint**
   - PDF com múltiplas páginas
   - PDF com design complexo

4. **Erros**
   - Arquivo corrompido
   - Timeout de rede
   - Backend indisponível
