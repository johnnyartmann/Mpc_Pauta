#!/usr/bin/env python3
"""
Extract Ementa de Voto and Proposta de Voto from TCE/SC vote PDFs.

Usage: python scripts/extract_voto.py path/to/voto.pdf
Output: JSON to stdout with ementa_html and proposta_html
"""

import sys
import json
import re
import os

import fitz


def strip_page_noise(text):
    """Remove page headers, footers, and artifacts."""
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        line = line.strip()
        if not line:
            cleaned.append('')
            continue
        # Skip page headers/footers
        if re.match(r'^Tribunal\s+de\s+Contas\s+do\s+Estado', line, re.IGNORECASE):
            continue
        if re.match(r'^Gabinete\s+do\s+Conselheiro', line, re.IGNORECASE):
            continue
        if re.match(r'^Processo:\s*REC', line, re.IGNORECASE):
            continue
        if re.match(r'^\d+\s*$', line) and len(line) < 10:
            continue
        if 'Disponibilizado para' in line:
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)


def text_to_html(text):
    """Convert plain text to basic HTML preserving paragraphs and bold."""
    lines = text.strip().split('\n')
    result = []
    current_para = []

    for line in lines:
        stripped = line.strip()

        if not stripped:
            if current_para:
                result.append('<p>' + '<br/>'.join(current_para) + '</p>')
                current_para = []
            continue

        # Detect section headers (short, all caps or starts with roman numeral)
        is_header = False
        if len(stripped) < 70 and (stripped.isupper() or re.match(r'^[IVX]+[\.\s\-]', stripped)):
            is_header = True

        if is_header:
            if current_para:
                result.append('<p>' + '<br/>'.join(current_para) + '</p>')
                current_para = []
            result.append('<strong>' + stripped + '</strong><br/>')
        else:
            current_para.append(stripped)

    if current_para:
        result.append('<p>' + '<br/>'.join(current_para) + '</p>')

    return '\n'.join(result)


def extract_ementa(text):
    """Extract Ementa section from the beginning of the document."""
    match = re.search(r'PROPOSTA\s+DE\s+VOTO\s*:', text, re.IGNORECASE)
    if not match:
        match = re.search(r'EMENTA\s*[:\-]?\s*$', text, re.IGNORECASE | re.MULTILINE)
    if not match:
        return ""

    start = match.end()
    ementa_text = text[start:]

    end_match = re.search(r'\bI[\.\s\-]+RELAT[ÓO]RIO\b', ementa_text, re.IGNORECASE)
    if end_match:
        ementa_text = ementa_text[:end_match.start()]

    ementa_text = strip_page_noise(ementa_text).strip()
    
    # Join all lines with spaces, then split by double line breaks into paragraphs
    joined = ' '.join(line.strip() for line in ementa_text.split('\n') if line.strip())
    
    # Clean up double spaces
    joined = re.sub(r'\s{2,}', ' ', joined)
    
    # Strip decision number from beginning (e.g. "GAC/JNA - 114/2026", "GAC/WWD - 257/2026")
    joined = re.sub(r'^[A-Z]{2,}(/[A-Z]{1,})?\s*-\s*\d+/\d{4}\s*', '', joined).strip()
    
    # Split into paragraphs by sentence-ending markers
    paragraphs = re.split(r'(?<=\.)\s+(?=[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])', joined)
    
    result = []
    for p in paragraphs:
        p = p.strip()
        if p:
            result.append('<p>' + p + '</p>')
    
    return '\n'.join(result)


def extract_proposta(text):
    """Extract Proposta de Voto (III. VOTO section) from the end."""
    # Find "III. VOTO" near the end - use the LAST occurrence
    matches = list(re.finditer(r'\bIII[\.\s\-]+VOTO\b', text, re.IGNORECASE))
    if not matches:
        # Fallback: try just "VOTO" as section header
        matches = list(re.finditer(r'^VOTO\s*$', text, re.IGNORECASE | re.MULTILINE))
    if not matches:
        return ""

    match = matches[-1]  # Use last occurrence
    start = match.start()
    proposta_text = text[start:]

    # Remove the "III. VOTO" header line itself
    proposta_text = re.sub(r'^.*?VOTO\s*\n', '', proposta_text, count=1, flags=re.IGNORECASE)

    proposta_text = strip_page_noise(proposta_text).strip()
    return text_to_html(proposta_text)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Caminho do PDF nao informado."}, ensure_ascii=False))
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(json.dumps({"error": f"Arquivo nao encontrado: {pdf_path}"}, ensure_ascii=False))
        sys.exit(1)

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(json.dumps({"error": f"Erro ao abrir PDF: {e}"}, ensure_ascii=False))
        sys.exit(1)

    try:
        full_text = ''
        for page in doc:
            text = page.get_text('text')
            full_text += text + '\n'
        doc.close()
    except Exception as e:
        print(json.dumps({"error": f"Erro ao extrair texto: {e}"}, ensure_ascii=False))
        sys.exit(1)

    ementa_html = extract_ementa(full_text)
    proposta_html = extract_proposta(full_text)

    print(json.dumps({
        "ementa_html": ementa_html,
        "proposta_html": proposta_html,
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
