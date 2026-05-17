#!/usr/bin/env python3
"""
ODT to PDF converter using fpdf2.
Supports styled content: bold, italic, headings, lists.
"""

import sys
import json
import os
from fpdf import FPDF


_MAC_NAMES = {
    'times.ttf':   'Times New Roman.ttf',
    'timesbd.ttf': 'Times New Roman Bold.ttf',
    'timesi.ttf':  'Times New Roman Italic.ttf',
    'timesbi.ttf': 'Times New Roman Bold Italic.ttf',
}


def _find_times_font(name: str) -> str:
    candidates = []
    if sys.platform == 'win32':
        windir = os.environ.get('WINDIR', '')
        candidates.append(os.path.join(windir, 'Fonts', name))
    elif sys.platform == 'darwin':
        mac_name = _MAC_NAMES.get(name, name)
        candidates += [
            f'/System/Library/Fonts/Supplemental/{mac_name}',
            os.path.join(os.path.expanduser('~'), 'Library', 'Fonts', mac_name),
            f'/Library/Fonts/{mac_name}',
        ]
    else:
        candidates += [
            f'/usr/share/fonts/truetype/msttcorefonts/{name}',
            f'/usr/share/fonts/msttcorefonts/{name}',
            f'/usr/local/share/fonts/{name}',
        ]
    candidates.append(os.path.join(os.path.dirname(__file__), 'fonts', name))
    for path in candidates:
        if os.path.exists(path):
            return path
    raise FileNotFoundError(f'Times New Roman font bulunamadı: {name}. fonts/ dizinine kopyalayın.')


class TurkishPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font('TimesNewRoman', '',   _find_times_font('times.ttf'))
        self.add_font('TimesNewRoman', 'B',  _find_times_font('timesbd.ttf'))
        self.add_font('TimesNewRoman', 'I',  _find_times_font('timesi.ttf'))
        self.add_font('TimesNewRoman', 'BI', _find_times_font('timesbi.ttf'))
        self.set_auto_page_break(True, margin=15)


def convert_styled_blocks_to_pdf(blocks, title=""):
    """Convert structured styled blocks to PDF with proper formatting."""
    pdf = TurkishPDF()
    pdf.add_page()

    page_width = 190

    for block in blocks:
        block_type = block.get('type', 'paragraph')
        content = block.get('content', [])

        if not content:
            continue

        if block_type == 'heading':
            level = block.get('level', 1)
            font_sizes = {1: 18, 2: 16, 3: 14, 4: 12, 5: 11, 6: 10}
            font_size = font_sizes.get(level, 14)

            pdf.set_font('TimesNewRoman', 'B', font_size)
            pdf.ln(4)

            for span in content:
                text = span.get('text', '').strip()
                if not text:
                    continue

                if span.get('bold'):
                    pdf.set_font('TimesNewRoman', 'B', font_size)
                else:
                    pdf.set_font('TimesNewRoman', '', font_size)

                pdf.multi_cell(page_width, font_size / 2.5, text)

            pdf.ln(3)

        elif block_type == 'list-item':
            pdf.set_font('TimesNewRoman', '', 11)
            pdf.ln(2)

            for i, span in enumerate(content):
                text = span.get('text', '').strip()
                if not text:
                    continue

                is_bold = span.get('bold', False)
                is_italic = span.get('italic', False)

                if is_bold and is_italic:
                    pdf.set_font('TimesNewRoman', 'BI', 11)
                elif is_bold:
                    pdf.set_font('TimesNewRoman', 'B', 11)
                elif is_italic:
                    pdf.set_font('TimesNewRoman', 'I', 11)
                else:
                    pdf.set_font('TimesNewRoman', '', 11)

                if i == 0:
                    pdf.cell(5, 6, '-')

                pdf.multi_cell(page_width - 5, 5, text)

            pdf.ln(2)

        elif block_type == 'paragraph':
            pdf.ln(2)

            for span in content:
                text = span.get('text', '').strip()
                if not text:
                    continue

                is_bold = span.get('bold', False)
                is_italic = span.get('italic', False)

                if is_bold and is_italic:
                    pdf.set_font('TimesNewRoman', 'BI', 11)
                elif is_bold:
                    pdf.set_font('TimesNewRoman', 'B', 11)
                elif is_italic:
                    pdf.set_font('TimesNewRoman', 'I', 11)
                else:
                    pdf.set_font('TimesNewRoman', '', 11)

                pdf.multi_cell(page_width, 5, text)

            pdf.ln(3)

    return bytes(pdf.output())


def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Usage: python pdf_generator.py <input.json> <output.pdf>'}))
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            input_data = json.load(f)

        blocks = input_data.get('blocks', [])
        title = input_data.get('title', '')

        if not blocks:
            print(json.dumps({'error': 'No content blocks provided'}), file=sys.stderr)
            sys.exit(1)

        pdf_bytes = convert_styled_blocks_to_pdf(blocks, title)

        with open(output_file, 'wb') as f:
            f.write(pdf_bytes)

        sys.exit(0)

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
