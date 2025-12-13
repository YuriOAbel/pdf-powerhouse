from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf2docx import Converter
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import subprocess
import base64
import os
import uuid
import logging
from datetime import datetime

# Importar pdf2pptx para conversão PDF → PowerPoint
try:
    from pdf2pptx import convert_pdf2pptx
except ImportError:
    # Fallback se não tiver pdf2pptx instalado
    convert_pdf2pptx = None
    logger.warning('pdf2pptx não disponível')

app = Flask(__name__)
CORS(app)  # Habilitar CORS para Supabase Edge Functions

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Diretório temporário
TEMP_DIR = '/tmp/conversions'
os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'pdf-to-word-converter',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/convert-pdf-to-word', methods=['POST'])
def convert_pdf_to_word():
    """
    Converte PDF para Word (.docx) usando LibreOffice
    
    Request body:
    {
        "pdfBase64": "base64_string",
        "filename": "nome_arquivo"
    }
    """
    try:
        # Validar request
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'Request deve ser JSON'
            }), 400
        
        data = request.json
        pdf_base64 = data.get('pdfBase64')
        filename = data.get('filename', 'documento')
        
        if not pdf_base64:
            return jsonify({
                'success': False,
                'error': 'Campo pdfBase64 é obrigatório'
            }), 400
        
        # Gerar ID único para os arquivos (sem extensão no nome base)
        file_id = str(uuid.uuid4())
        pdf_filename = f'{file_id}.pdf'
        pdf_path = os.path.join(TEMP_DIR, pdf_filename)
        # LibreOffice mantém o nome base e adiciona nova extensão
        docx_path = os.path.join(TEMP_DIR, f'{file_id}.docx')
        
        logger.info(f'📄 Iniciando conversão: {filename}')
        
        # Remover prefixo data URL se existir
        if 'base64,' in pdf_base64:
            pdf_base64 = pdf_base64.split('base64,')[1]
        
        # Decodificar PDF
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
            logger.info(f'✅ PDF decodificado: {len(pdf_bytes)} bytes')
        except Exception as e:
            logger.error(f'❌ Erro ao decodificar base64: {e}')
            return jsonify({
                'success': False,
                'error': 'Erro ao decodificar PDF base64'
            }), 400
        
        # Salvar PDF temporariamente
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        logger.info(f'💾 PDF salvo: {pdf_path}')
        
        # Converter com pdf2docx usando OCR quando necessário
        logger.info('🔄 Iniciando conversão com pdf2docx + OCR...')
        try:
            cv = Converter(pdf_path)
            # pdf2docx com suporte a OCR automático
            cv.convert(docx_path, start=0, end=None)
            cv.close()
            logger.info('✅ Conversão pdf2docx completa')
        except Exception as e:
            logger.error(f'❌ pdf2docx erro: {str(e)}')
            raise Exception(f'Erro no pdf2docx: {str(e)}')
        
        # Debug: listar arquivos no diretório
        logger.info(f'📁 Arquivos no diretório: {os.listdir(TEMP_DIR)}')
        
        # Verificar se arquivo foi gerado
        if not os.path.exists(docx_path):
            logger.error(f'❌ Arquivo esperado não encontrado: {docx_path}')
            raise Exception('Arquivo .docx não foi gerado')
        
        # Ler arquivo gerado
        with open(docx_path, 'rb') as f:
            docx_bytes = f.read()
        
        logger.info(f'📦 DOCX gerado: {len(docx_bytes)} bytes')
        
        # Converter para base64
        docx_base64 = base64.b64encode(docx_bytes).decode('utf-8')
        
        # Limpar arquivos temporários
        try:
            os.remove(pdf_path)
            os.remove(docx_path)
            logger.info('🧹 Arquivos temporários removidos')
        except Exception as e:
            logger.warning(f'⚠️ Erro ao limpar arquivos: {e}')
        
        # Retornar resultado
        return jsonify({
            'success': True,
            'filename': f'{filename}.docx',
            'data': docx_base64,
            'message': 'Conversão concluída com sucesso',
            'size_bytes': len(docx_bytes)
        })
        
    except subprocess.TimeoutExpired:
        logger.error('❌ Timeout na conversão')
        return jsonify({
            'success': False,
            'error': 'Timeout: conversão demorou muito tempo'
        }), 408
        
    except Exception as e:
        logger.error(f'❌ Erro na conversão: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/convert-pdf-to-text', methods=['POST'])
def convert_pdf_to_text():
    """
    Converte PDF para texto usando Tesseract OCR
    
    Request body:
    {
        "pdfBase64": "base64_string",
        "filename": "nome_arquivo",
        "language": "por+eng" (opcional, default: por+eng)
    }
    """
    try:
        # Validar request
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'Request deve ser JSON'
            }), 400
        
        data = request.json
        pdf_base64 = data.get('pdfBase64')
        filename = data.get('filename', 'documento')
        language = data.get('language', 'por+eng')  # Português + Inglês
        
        if not pdf_base64:
            return jsonify({
                'success': False,
                'error': 'Campo pdfBase64 é obrigatório'
            }), 400
        
        # Gerar ID único para os arquivos
        file_id = str(uuid.uuid4())
        pdf_path = os.path.join(TEMP_DIR, f'{file_id}.pdf')
        
        logger.info(f'📄 Iniciando extração de texto OCR: {filename}')
        
        # Remover prefixo data URL se existir
        if 'base64,' in pdf_base64:
            pdf_base64 = pdf_base64.split('base64,')[1]
        
        # Decodificar PDF
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
            logger.info(f'✅ PDF decodificado: {len(pdf_bytes)} bytes')
        except Exception as e:
            logger.error(f'❌ Erro ao decodificar base64: {e}')
            return jsonify({
                'success': False,
                'error': 'Erro ao decodificar PDF base64'
            }), 400
        
        # Salvar PDF temporariamente
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        logger.info(f'💾 PDF salvo: {pdf_path}')
        
        # Converter PDF para imagens
        logger.info('🔄 Convertendo PDF para imagens...')
        images = convert_from_path(pdf_path, dpi=300)
        logger.info(f'✅ {len(images)} páginas convertidas para imagens')
        
        # Extrair texto de cada página usando OCR
        logger.info('🔍 Extraindo texto com Tesseract OCR...')
        extracted_text = []
        
        for i, image in enumerate(images, start=1):
            logger.info(f'📖 Processando página {i}/{len(images)}...')
            # Usar Tesseract para extrair texto da imagem
            page_text = pytesseract.image_to_string(image, lang=language)
            extracted_text.append(f'--- Página {i} ---\n{page_text}\n')
        
        full_text = '\n'.join(extracted_text)
        logger.info(f'✅ Extração completa: {len(full_text)} caracteres')
        
        # Limpar arquivos temporários
        try:
            os.remove(pdf_path)
            logger.info('🧹 Arquivos temporários removidos')
        except Exception as e:
            logger.warning(f'⚠️ Erro ao remover temporários: {e}')
        
        # Retornar texto extraído
        return jsonify({
            'success': True,
            'filename': f'{filename}.txt',
            'text': full_text,
            'message': 'Extração de texto concluída com sucesso',
            'pages': len(images),
            'characters': len(full_text)
        })
        
    except Exception as e:
        logger.error(f'❌ Erro na extração de texto: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/convert-pdf-to-pptx', methods=['POST'])
def convert_pdf_to_pptx():
    """
    Converte PDF para PowerPoint (.pptx) usando pdf2pptx
    A biblioteca pdf2pptx renderiza cada página do PDF como imagem PNG
    e cria um arquivo PowerPoint com essas imagens.
    
    Request body:
    {
        "pdfBase64": "base64_string",
        "filename": "nome_arquivo"
    }
    """
    try:
        # Validar request
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'Request deve ser JSON'
            }), 400
        
        data = request.json
        pdf_base64 = data.get('pdfBase64')
        filename = data.get('filename', 'documento')
        
        if not pdf_base64:
            return jsonify({
                'success': False,
                'error': 'Campo pdfBase64 é obrigatório'
            }), 400
        
        # Gerar ID único para os arquivos
        file_id = str(uuid.uuid4())
        pdf_path = os.path.join(TEMP_DIR, f'{file_id}.pdf')
        pptx_path = os.path.join(TEMP_DIR, f'{file_id}.pptx')
        
        logger.info(f'📄 Iniciando conversão PDF→PPTX com pdf2pptx: {filename}')
        
        # Remover prefixo data URL se existir
        if 'base64,' in pdf_base64:
            pdf_base64 = pdf_base64.split('base64,')[1]
        
        # Decodificar PDF
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
            logger.info(f'✅ PDF decodificado: {len(pdf_bytes)} bytes')
        except Exception as e:
            logger.error(f'❌ Erro ao decodificar base64: {e}')
            return jsonify({
                'success': False,
                'error': 'Erro ao decodificar PDF base64'
            }), 400
        
        # Salvar PDF temporariamente
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        logger.info(f'💾 PDF salvo: {pdf_path}')
        
        # Converter com pdf2pptx
        logger.info('🔄 Iniciando conversão com pdf2pptx...')
        
        if convert_pdf2pptx is None:
            raise Exception('Biblioteca pdf2pptx não está disponível')
        
        # Usar pdf2pptx para conversão
        # Assinatura: convert_pdf2pptx(pdf_file, output_file, resolution, start_page, page_count, quiet)
        convert_pdf2pptx(
            pdf_file=pdf_path,
            output_file=pptx_path,
            resolution=200,
            start_page=0,
            page_count=None,  # Todas as páginas
            quiet=True  # Sem progress bar
        )
        
        logger.info('✅ Conversão pdf2pptx completa')
        
        # Verificar se arquivo foi gerado
        if not os.path.exists(pptx_path):
            logger.error(f'❌ Arquivo PPTX não foi gerado: {pptx_path}')
            raise Exception('Arquivo .pptx não foi gerado')
        
        # Ler arquivo gerado
        with open(pptx_path, 'rb') as f:
            pptx_bytes = f.read()
        
        logger.info(f'📦 PPTX gerado: {len(pptx_bytes)} bytes')
        
        # Converter para base64
        pptx_base64 = base64.b64encode(pptx_bytes).decode('utf-8')
        
        # Limpar arquivos temporários
        try:
            os.remove(pdf_path)
            os.remove(pptx_path)
            logger.info('🧹 Arquivos temporários removidos')
        except Exception as e:
            logger.warning(f'⚠️ Erro ao remover temporários: {e}')
        
        # Retornar arquivo convertido
        return jsonify({
            'success': True,
            'filename': f'{filename}.pptx',
            'data': pptx_base64,
            'message': 'Conversão concluída com sucesso usando pdf2pptx',
            'size_bytes': len(pptx_bytes)
        })
        
    except subprocess.TimeoutExpired:
        logger.error('❌ Timeout na conversão')
        return jsonify({
            'success': False,
            'error': 'Timeout: conversão demorou muito tempo'
        }), 408
        
    except Exception as e:
        logger.error(f'❌ Erro na conversão PDF→PPTX: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/compress-pdf', methods=['POST'])
def compress_pdf():
    """
    Comprime PDF usando Ghostscript
    
    Request body:
    {
        "pdfBase64": "base64_string",
        "filename": "nome_arquivo",
        "quality": "screen|ebook|printer|prepress" (opcional, default: ebook)
    }
    
    Níveis de qualidade:
    - screen: 72 DPI - menor tamanho, menor qualidade
    - ebook: 150 DPI - boa compressão, qualidade razoável (padrão)
    - printer: 300 DPI - boa qualidade, compressão moderada
    - prepress: 300 DPI - melhor qualidade, menor compressão
    """
    try:
        # Validar request
        if not request.json:
            return jsonify({
                'success': False,
                'error': 'Request deve ser JSON'
            }), 400
        
        data = request.json
        pdf_base64 = data.get('pdfBase64')
        filename = data.get('filename', 'documento')
        quality = data.get('quality', 'ebook')  # Padrão: boa compressão
        
        # Validar qualidade
        valid_qualities = ['screen', 'ebook', 'printer', 'prepress']
        if quality not in valid_qualities:
            return jsonify({
                'success': False,
                'error': f'Qualidade deve ser uma de: {", ".join(valid_qualities)}'
            }), 400
        
        if not pdf_base64:
            return jsonify({
                'success': False,
                'error': 'Campo pdfBase64 é obrigatório'
            }), 400
        
        # Gerar ID único para os arquivos
        file_id = str(uuid.uuid4())
        input_pdf = os.path.join(TEMP_DIR, f'{file_id}_input.pdf')
        output_pdf = os.path.join(TEMP_DIR, f'{file_id}_compressed.pdf')
        
        logger.info(f'📄 Iniciando compressão de PDF: {filename} (qualidade: {quality})')
        
        # Remover prefixo data URL se existir
        if 'base64,' in pdf_base64:
            pdf_base64 = pdf_base64.split('base64,')[1]
        
        # Decodificar PDF
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
            original_size = len(pdf_bytes)
            logger.info(f'✅ PDF decodificado: {original_size} bytes')
        except Exception as e:
            logger.error(f'❌ Erro ao decodificar base64: {e}')
            return jsonify({
                'success': False,
                'error': 'Erro ao decodificar PDF base64'
            }), 400
        
        # Salvar PDF temporariamente
        with open(input_pdf, 'wb') as f:
            f.write(pdf_bytes)
        logger.info(f'💾 PDF salvo: {input_pdf}')
        
        # Comprimir com Ghostscript
        logger.info('🔄 Comprimindo PDF com Ghostscript...')
        
        gs_command = [
            'gs',
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            f'-dPDFSETTINGS=/{quality}',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            '-dDetectDuplicateImages=true',
            '-dCompressFonts=true',
            '-r150',  # Resolução de 150 DPI
            f'-sOutputFile={output_pdf}',
            input_pdf
        ]
        
        try:
            result = subprocess.run(
                gs_command,
                capture_output=True,
                text=True,
                timeout=120  # 2 minutos timeout
            )
            
            if result.returncode != 0:
                logger.error(f'❌ Ghostscript erro: {result.stderr}')
                raise Exception(f'Erro no Ghostscript: {result.stderr}')
            
            logger.info('✅ Compressão Ghostscript completa')
            
        except subprocess.TimeoutExpired:
            raise Exception('Timeout: compressão demorou muito tempo')
        
        # Verificar se arquivo foi gerado
        if not os.path.exists(output_pdf):
            logger.error(f'❌ PDF comprimido não foi gerado: {output_pdf}')
            raise Exception('PDF comprimido não foi gerado')
        
        # Ler arquivo comprimido
        with open(output_pdf, 'rb') as f:
            compressed_bytes = f.read()
        
        compressed_size = len(compressed_bytes)
        compression_ratio = ((original_size - compressed_size) / original_size) * 100
        
        logger.info(f'📦 PDF comprimido: {compressed_size} bytes')
        logger.info(f'📊 Compressão: {compression_ratio:.1f}% reduzido')
        
        # Converter para base64
        compressed_base64 = base64.b64encode(compressed_bytes).decode('utf-8')
        
        # Limpar arquivos temporários
        try:
            os.remove(input_pdf)
            os.remove(output_pdf)
            logger.info('🧹 Arquivos temporários removidos')
        except Exception as e:
            logger.warning(f'⚠️ Erro ao remover temporários: {e}')
        
        # Retornar PDF comprimido
        return jsonify({
            'success': True,
            'filename': f'{filename}_compressed.pdf',
            'data': compressed_base64,
            'message': 'Compressão concluída com sucesso',
            'original_size_bytes': original_size,
            'compressed_size_bytes': compressed_size,
            'compression_ratio_percent': round(compression_ratio, 1),
            'quality': quality
        })
        
    except subprocess.TimeoutExpired:
        logger.error('❌ Timeout na compressão')
        return jsonify({
            'success': False,
            'error': 'Timeout: compressão demorou muito tempo'
        }), 408
        
    except Exception as e:
        logger.error(f'❌ Erro na compressão: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/', methods=['GET'])
def index():
    """Página inicial com informações da API"""
    return jsonify({
        'service': 'PDF Converter API with OCR',
        'version': '4.1.0',
        'endpoints': {
            '/health': 'GET - Health check',
            '/convert-pdf-to-word': 'POST - Converter PDF para Word (.docx)',
            '/convert-pdf-to-pptx': 'POST - Converter PDF para PowerPoint (.pptx - usando pdf2pptx)',
            '/convert-pdf-to-text': 'POST - Extrair texto do PDF usando OCR',
            '/compress-pdf': 'POST - Comprimir PDF com Ghostscript'
        },
        'powered_by': 'pdf2docx + Tesseract OCR + pdf2pptx (PyMuPDF + python-pptx) + Ghostscript',
        'ocr_languages': ['por (Português)', 'eng (English)']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
