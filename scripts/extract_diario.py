#!/usr/bin/env python3
"""
Extract structured entries from TCE/SC Diario Oficial Eletronico PDFs.

Usage: python scripts/extract_diario.py path/to/dotc-e2026-06-08.pdf
Output: JSON to stdout
"""

import sys
import json
import re
import os
from html import escape

import fitz


# ── Patterns for page headers / noise ───────────────────────────────────────

_PAGE_HEADER_RE = re.compile(
    r'^Tribunal\s+de\s+Contas\s+de\s+Santa\s+Catarina\b.*P[a\u00e1]g\.\s*\d+',
    re.IGNORECASE
)

_MASTHEAD_STARTS = (
    'Tribunal de Contas do Estado de Santa Catarina',
    'www.tce.sc.gov.br',
    'Conselheiros',
    'Minist',
    'Di\u00e1rio Oficial Eletr\u00f4nico',
)

_DIGITAL_SIGN_RE = re.compile(
    r'Assinado de forma digital por|SIMONI DA\s*\n\s*ROSA:\d+',
    re.IGNORECASE
)

_URL_RE = re.compile(r'www\.\w+\.\w+\.\w+')

# ── Field extraction patterns ───────────────────────────────────────────────

_PROCESSO_RE = re.compile(
    r'PROCESSO\s+N[.\u00ba\u00b0\u00aa]?\s*:\s*(.*?)\s*\n',
    re.IGNORECASE
)

_PCG_PROCESSO_RE = re.compile(
    r'Processo\s+n\.\s*:\s*(.*?)\s*\n',
    re.IGNORECASE
)

_FIELD_LABELS = [
    (r'UNIDADE\s+GESTORA\s*:', 'unidade_gestora'),
    (r'RESPONS[.\u00c1\u00c0\u00c2\u00c3]VEL\s*:', 'responsavel'),
    (r'INTERESSADOS?\s*:', 'interessados'),
    (r'ASSUNTO\s*:', 'assunto'),
    (r'RELATOR\s*:', 'relator'),
    (r'UNIDADE\s+T[.\u00c9\u00c8\u00ca\u00cb]CNICA\s*:', 'unidade_tecnica'),
    (r'UNIDADE\s+TECNICA\s*:', 'unidade_tecnica'),
    (r'DECIS[.\u00c3\u00c2]O\s+SINGULAR\s*:', 'decisao_singular'),
]

_PARECER_FIELD_LABELS = [
    (r'Processo\s+n\.\s*:', 'numero_processo_pcg'),
    (r'Assunto\s*:', 'assunto'),
    (r'Respons[.\u00e1\u00e0]vel\s*:', 'responsavel'),
    (r'Unidade\s+Gestora\s*:', 'unidade_gestora'),
    (r'Unidade\s+T[.\u00e9\u00e8]cnica\s*:', 'unidade_tecnica'),
    (r'Parecer\s+Pr[.\u00e9\u00e8]vio.*\bn\.\s*:', 'parecer_numero'),
]

_PARECER_RE = re.compile(
    r'Parecer\s+Pr[.\u00e9\u00e8]vio\s*-\s*Presta[.\u00e7\u00e3\u00e2]'
    r'[.\u00e7\u00e3\u00e2]o\s+de\s+Contas.*?\bn\.\s*:\s*(\S[^\n]*)',
    re.IGNORECASE
)

_PARECER_HEADER_RE = re.compile(
    r'^(Processo\s+n\.|Assunto:|Respons[.\u00e1\u00e0]vel:'
    r'|Unidade\s+Gestora:|Unidade\s+T[.\u00e9\u00e8]cnica:)',
    re.IGNORECASE | re.MULTILINE
)

_NOTIFICACAO_RE = re.compile(
    r'(?:^|\n)\s*NOTIFICA[.\u00c7][.\u00c3][\u00c2]?O\s+DE\s+ALERTA\s+N[.\u00ba\u00b0]?\s*\d+',
    re.IGNORECASE
)

_IGNORE_SECTION_RE = re.compile(
    r'(?:^|\n)\s*(?:Atos\s+Administrativos|Licita[.\u00e7][.\u00f5]es.*Conv[.\u00ea]nios'
    r'|Portaria\s+N\.\s*TC-)\s*\n',
    re.IGNORECASE
)


# ── Text extraction ─────────────────────────────────────────────────────────

def is_page_header(text):
    t = text.strip()
    if not t:
        return True
    if _PAGE_HEADER_RE.search(t):
        return True
    return False


def is_masthead(text):
    t = text.strip()
    if not t:
        return True
    for start in _MASTHEAD_STARTS:
        if t.startswith(start) and len(t) < 200:
            return True
    if _DIGITAL_SIGN_RE.search(t):
        return True
    if _URL_RE.search(t) and len(t) < 100:
        return True
    return False


def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    all_text = []

    for page_num, page in enumerate(doc):
        blocks = page.get_text('blocks')
        page_text = []

        for block in blocks:
            text = block[4].strip()
            if is_page_header(text):
                continue
            if page_num == 0 and is_masthead(text):
                continue
            if text:
                page_text.append(text)

        all_text.append('\n'.join(page_text))

    doc.close()
    return '\n'.join(all_text)


# ── Metadata extraction ─────────────────────────────────────────────────────

def extract_date(filepath):
    basename = os.path.basename(filepath)
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', basename)
    if m:
        return f'{m.group(1)}-{m.group(2)}-{m.group(3)}'
    return None


def extract_edition(text):
    m = re.search(r'Ano\s+\d+\s*-\s*n[.\u00ba\u00b0\u00aa\u00b0]?\s*(\d+)', text)
    if m:
        return m.group(1)
    return None


# ── Entry detection ─────────────────────────────────────────────────────────

def find_entry_starts(text):
    entries = []

    for m in re.finditer(_PROCESSO_RE, text):
        entries.append({'pos': m.start(), 'type': 'processo'})

    for m in re.finditer(_PCG_PROCESSO_RE, text):
        entries.append({'pos': m.start(), 'type': 'parecer_previo'})

    entries.sort(key=lambda x: x['pos'])

    # Deduplicate entries too close together.
    # Prefer parecer_previo if both types exist for the same entry.
    unique = []
    for e in entries:
        if not unique or e['pos'] - unique[-1]['pos'] > 200:
            unique.append(e)
        elif e['type'] == 'parecer_previo':
            unique[-1] = e

    return unique


# ── Field extraction ────────────────────────────────────────────────────────

def extract_header_fields(header_text, labels=None):
    if labels is None:
        labels = _FIELD_LABELS
    fields = {}
    remaining = header_text

    for pattern, key in labels:
        m = re.search(rf'^{pattern}\s*(.+?)\s*$', remaining, re.MULTILINE | re.IGNORECASE)
        if not m:
            # Allow value to span lines (non-greedy, stop at next label)
            m = re.search(rf'^{pattern}\s*(.+?)\s*$', remaining, re.MULTILINE | re.IGNORECASE)

        if not m:
            continue

        prefix_match = re.match(rf'^{pattern}\s*', m.group(0), re.IGNORECASE)
        prefix_len = len(prefix_match.group(0))
        value_start = m.start() + prefix_len

        # Find the next field label after this value
        next_label_pos = None
        for p2, _ in labels:
            if p2 == pattern:
                continue
            nm = re.search(rf'^{p2}', remaining[value_start:], re.MULTILINE | re.IGNORECASE)
            if nm:
                pos = value_start + nm.start()
                if next_label_pos is None or pos < next_label_pos:
                    next_label_pos = pos

        if next_label_pos:
            value = remaining[value_start:next_label_pos].strip()
        else:
            value = remaining[value_start:].strip()

        value = re.sub(r'\n{3,}', '\n\n', value)
        value = re.sub(r'\s+', ' ', value).strip()

        fields[key] = value
        remaining = remaining[next_label_pos:] if next_label_pos else ''

    return fields


def extract_parecer_previo_fields(text):
    fields = {}

    pats = {
        'unidade_gestora': r'Unidade\s+Gestora\s*:\s*(.+?)\s*\n',
        'responsavel': r'Respons[.\u00e1\u00e0]vel\s*:\s*(.+?)\s*\n',
        'assunto': r'Assunto\s*:\s*(.+?)\s*\n',
        'unidade_tecnica': r'Unidade\s+T[.\u00e9\u00e8]cnica\s*:\s*(.+?)\s*\n',
    }

    for key, pattern in pats.items():
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            fields[key] = re.sub(r'\s+', ' ', m.group(1).strip())

    return fields


# ── Type determination ──────────────────────────────────────────────────────

def determine_tipo(entry_text):
    if re.search(r'DECIS[.\u00c3\u00c2]O\s+SINGULAR', entry_text, re.IGNORECASE):
        return 'decisao_singular'
    if re.search(
        r'Parecer\s+Pr[.\u00e9\u00e8]vio\s*-\s*Presta[.\u00e7][.\u00e3\u00e2]o\s+de\s+Contas',
        entry_text, re.IGNORECASE
    ):
        return 'parecer_previo'
    return 'deliberacao_plenario'


# ── Decision number extraction ──────────────────────────────────────────────

def extract_decision_number(entry_text, tipo):
    if tipo == 'decisao_singular':
        m = re.search(
            r'DECIS[.\u00c3\u00c2]O\s+SINGULAR\s*:\s*(\S[^\n]*)',
            entry_text, re.IGNORECASE
        )
        if m:
            return m.group(1).strip()
    elif tipo == 'parecer_previo':
        m = re.search(
            r'Parecer\s+Pr[.\u00e9\u00e8]vio.*?\bn\.\s*:\s*(\S[^\n]*)',
            entry_text, re.IGNORECASE
        )
        if m:
            return m.group(1).strip()
    return ''


# ── Processo number extraction ──────────────────────────────────────────────

def extract_processo_number(entry_text):
    m = re.search(r'PROCESSO\s+N[.\u00ba\u00b0\u00aa]?\s*:\s*(\S[^\n]*)', entry_text)
    if m:
        return m.group(1).strip()
    m = re.search(r'Processo\s+n\.\s*:\s*(\S[^\n]*)', entry_text)
    if m:
        return m.group(1).strip()
    return ''


# ── Content boundaries ──────────────────────────────────────────────────────

def find_content_marker_pos(text, entry_type):
    """Find position after decision/header line to start content extraction."""
    if entry_type == 'decisao_singular':
        m = re.search(
            r'DECIS[.\u00c3\u00c2]O\s+SINGULAR\s*:.*\n',
            text, re.IGNORECASE
        )
        if m:
            return m.end()
    elif entry_type == 'parecer_previo':
        m = re.search(
            r'Parecer\s+Pr[.\u00e9\u00e8]vio.*?\bn\.\s*:\s*\S+.*\n',
            text, re.IGNORECASE
        )
        if m:
            return m.end()
    # For deliberacao_plenario, start after RELATOR or UNIDADE_TÉCNICA line
    for label in ['RELATOR', 'UNIDADE T']:
        m = re.search(rf'^{label}\w*:.*\n', text, re.MULTILINE | re.IGNORECASE)
        if m:
            # Advance past header section until first content marker
            after_header = text[m.end():]
            # Find I- RELATÓRIO or I RELATÓRIO or similar
            cm = re.search(r'^(?:I[\s-]*RELAT[.\u00d3\u00d2]RIO)', after_header, re.MULTILINE | re.IGNORECASE)
            if cm:
                return m.end() + cm.start()
            return m.end()
    return 0


def find_content_end(full_text, start_pos, next_entry_pos):
    """Find the end of content before ignore blocks or next entry."""
    between = full_text[start_pos:next_entry_pos]

    # Stop before NOTIFICAÇÃO DE ALERTA
    m = _NOTIFICACAO_RE.search(between)
    if m:
        return start_pos + m.start()

    # Stop before ignored sections (Atos Administrativos, Licitações, Portarias)
    m = _IGNORE_SECTION_RE.search(between)
    if m:
        return start_pos + m.start()

    return next_entry_pos


# ── HTML conversion ─────────────────────────────────────────────────────────

def _is_header_line(text):
    """Check if a line looks like a section header (ALL CAPS, short)."""
    stripped = text.strip()
    if not stripped:
        return False
    if len(stripped) > 80:
        return False
    # Check if it's predominantly uppercase after stripping accents
    letters_only = re.sub(r'[^A-Za-z\u00c0-\u00ff\u0100-\u024f]', '', stripped)
    if len(letters_only) < 4:
        return False
    # Count uppercase letters
    lowered = letters_only.lower()
    # If mostly uppercase AND contains accented characters (Portuguese)
    # Actually, just check if >= 60% of letters are uppercase equivalents
    upper_count = sum(1 for c in letters_only if c.isupper())
    if upper_count >= len(letters_only) * 0.75:
        return True
    # Check for numbered section patterns like "IV -" or "2.1. "
    if re.match(r'^[IVXivx]+[\s\-\.]', stripped) and len(stripped) < 80:
        return True
    if re.match(r'^[\d]+\.[\d]+\s', stripped) and len(stripped) < 80:
        return True
    return False


def content_to_html(content):
    if not content.strip():
        return ''

    # Split into paragraphs by double newlines
    paragraphs = re.split(r'\n\s*\n', content.strip())
    html_parts = []

    for para in paragraphs:
        if not para.strip():
            continue

        lines = para.split('\n')
        processed = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            if _is_header_line(stripped):
                processed.append(f'<strong>{escape(stripped)}</strong><br/>')
            else:
                processed.append(escape(stripped))

        if processed:
            para_html = '<br/>'.join(processed)
            html_parts.append(f'<p>{para_html}</p>')

    return '\n'.join(html_parts)


# ── Content text cleanup ────────────────────────────────────────────────────

def clean_content_text(text):
    """Remove page boundary artifacts and normalise whitespace."""
    # Remove any remaining page header-like lines
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        if _PAGE_HEADER_RE.search(stripped):
            continue
        if is_masthead(stripped):
            continue
        clean_lines.append(stripped)
    text = '\n'.join(clean_lines)

    # Normalise excessive newlines
    text = re.sub(r'\n{4,}', '\n\n\n', text)

    return text.strip()


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'PDF file path required'}, ensure_ascii=False))
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not os.path.exists(pdf_path):
        print(json.dumps({'error': f'File not found: {pdf_path}'}, ensure_ascii=False))
        sys.exit(1)

    try:
        full_text = extract_text(pdf_path)

        data_publicacao = extract_date(pdf_path)
        numero_edicao = extract_edition(full_text)

        entries_info = find_entry_starts(full_text)

        entradas = []

        for i, info in enumerate(entries_info):
            start_pos = info['pos']

            if i + 1 < len(entries_info):
                next_pos = entries_info[i + 1]['pos']
            else:
                next_pos = len(full_text)

            end_pos = find_content_end(full_text, start_pos, next_pos)
            entry_text = full_text[start_pos:end_pos]

            tipo = determine_tipo(entry_text)
            numero_processo = extract_processo_number(entry_text)
            numero_decisao = extract_decision_number(entry_text, tipo)

            # Extract header fields
            if info['type'] == 'parecer_previo':
                header_fields = extract_parecer_previo_fields(entry_text)
            else:
                header_fields = extract_header_fields(entry_text)

            # Extract content after the header/decision area
            content_start = find_content_marker_pos(entry_text, tipo)

            # If no marker found, try to skip the header fields section
            if content_start == 0 and tipo != 'parecer_previo':
                # Find the last header field line
                last_field_pos = 0
                for pattern, _ in _FIELD_LABELS:
                    for m in re.finditer(rf'^{pattern}\s*.*$', entry_text, re.MULTILINE):
                        if m.end() > last_field_pos:
                            last_field_pos = m.end()
                if last_field_pos > 0:
                    content_start = last_field_pos

            content = entry_text[content_start:].strip() if content_start > 0 else ''
            content = clean_content_text(content)
            conteudo_html = content_to_html(content)

            entrada = {
                'numero_processo': numero_processo,
                'unidade_gestora': header_fields.get('unidade_gestora', ''),
                'interessados': header_fields.get('interessados', ''),
                'assunto': header_fields.get('assunto', ''),
                'relator': header_fields.get('relator', ''),
                'unidade_tecnica': header_fields.get('unidade_tecnica', ''),
                'tipo': tipo,
                'numero_decisao': numero_decisao,
                'conteudo_html': conteudo_html,
            }

            if header_fields.get('responsavel'):
                entrada['responsavel'] = header_fields['responsavel']

            entradas.append(entrada)

        output = {
            'data_publicacao': data_publicacao,
            'numero_edicao': numero_edicao,
            'entradas': entradas,
        }

        print(json.dumps(output, ensure_ascii=False, indent=2))

    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == '__main__':
    main()
