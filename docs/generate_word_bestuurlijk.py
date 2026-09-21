from pathlib import Path
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from PIL import Image, ImageChops
import os

base = Path('/Users/rrienks/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/SovScan')
shots = base / 'docs' / 'screenshots'
out_file = base / 'docs' / 'SovScan_Bestuurlijke_Samenvatting.docx'


def cropped_image_for_doc(image_path: Path) -> Path:
    """Trim excessive white margins so screenshots render compactly in Word."""
    img = Image.open(image_path).convert('RGB')
    bg = Image.new('RGB', img.size, (255, 255, 255))
    diff = ImageChops.difference(img, bg)
    bbox = diff.getbbox()
    if not bbox:
        return image_path

    left, top, right, bottom = bbox
    pad = 16
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)

    cropped = img.crop((left, top, right, bottom))
    out = image_path.with_name(f'{image_path.stem}_cropped{image_path.suffix}')
    cropped.save(out, optimize=True)
    return out

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)

# Voorblad
p = doc.add_paragraph('SovScan')
p.style = doc.styles['Title']
p.alignment = WD_ALIGN_PARAGRAPH.LEFT

doc.add_paragraph('Bestuurlijke Samenvatting')
doc.add_paragraph('Versie: 1.0')
doc.add_paragraph('Datum: 15 juni 2026')
doc.add_paragraph('Doel: besluitvorming over digitale soevereiniteit versnellen')

doc.add_page_break()

# 1. Executive summary
doc.add_heading('1. Executive Summary', level=1)
doc.add_paragraph(
    'SovScan is een praktisch besluitvormingsinstrument voor digitale soevereiniteit. '
    'De tool ondersteunt zowel strategische keuzes voor nieuwe initiatieven (Scenario Assessment) '
    'als de feitelijke beoordeling van bestaande systemen (Soevereiniteitsaudit).'
)
doc.add_paragraph(
    'Als basis levert SovScan een SEAL-level inventarisatie op, waarmee bestuur en teams een eenduidig '
    'startbeeld krijgen van volwassenheid, risico\'s en verbeterprioriteiten.'
)
doc.add_paragraph('Bestuurlijke waarde:')
for item in [
    'Sneller en consistenter besluit over hosting- en governance-opties.',
    'Eenduidige score-uitkomsten met onderbouwing per dimensie.',
    'SEAL-level inventarisatie als objectieve nulmeting voor sturing en periodieke herijking.',
    'Inzicht in risico\'s zoals vendor lock-in, compliance en operationele afhankelijkheid.',
    'Geschikt voor interne sturing en externe verantwoording.'
]:
    doc.add_paragraph(item, style='List Bullet')

# 2. Scope en gebruik
doc.add_heading('2. Scope en Gebruik in 4 Stappen', level=1)
for step in [
    'Inloggen en statuscheck (API/DB).',
    'Kiezen van module: Scenario Assessment of Soevereiniteitsaudit.',
    'Invullen van vragen/beoordelingen door proceseigenaar of expertteam.',
    'Bespreken van uitkomst, maatregelen en vervolgstappen in governance-overleg.'
]:
    doc.add_paragraph(step, style='List Number')

# 3. Resultaatbeeld
doc.add_heading('3. Resultaatbeeld voor Bestuur en MT', level=1)
doc.add_paragraph(
    'De rapportage levert een compact besluitbeeld op met scorekaart, adviestekst en prioriteiten. '
    'Voor de audit wordt dit visueel ondersteund met een radar/spinnenweb over meerdere dimensies.'
)

doc.add_paragraph('Typische besluitvragen die met SovScan worden ondersteund:')
for q in [
    'Welk scenario past het best bij risicoprofiel en regie-ambitie?',
    'Welke dimensies vereisen direct mitigerende maatregelen?',
    'Waar is afhankelijkheid van leveranciers te groot?',
    'Welke roadmapstappen zijn nodig om compliance en controle te verbeteren?'
]:
    doc.add_paragraph(q, style='List Bullet')

# Kernscreenshots
doc.add_heading('4. Kernscreenshots', level=1)
images = [
    ('4.1 Dashboard-overzicht', '02-dashboard.png', 'Startpunt met de drie bestuurlijk relevante modules.'),
    ('4.2 Auditresultaat met spinnenweb', '06-audit-result-spinnenweb.png', 'Visuele managementsamenvatting per soevereiniteitsdimensie.'),
    ('4.3 Scenario-scan resultaat', '07-scan-resultaat.png', 'Scores per scenario met advies voor de voorkeursrichting.'),
]

for title, filename, caption in images:
    t = doc.add_paragraph(title)
    t.runs[0].bold = True
    img = shots / filename
    if img.exists():
        cropped = cropped_image_for_doc(img)
        doc.add_picture(str(cropped), width=Inches(6.2))
        c = doc.add_paragraph(caption)
        c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    else:
        doc.add_paragraph(f'[Screenshot ontbreekt: {filename}]')
    doc.add_paragraph('')

# 5. Bestuurlijke aandachtspunten
doc.add_heading('5. Bestuurlijke Aandachtspunten', level=1)
for item in [
    'Leg normenkader en besluitcriteria vooraf vast (bijv. AVG, BIO, NIS2, AI Act).',
    'Gebruik periodieke herbeoordeling om voortgang op soevereiniteit te monitoren.',
    'Koppel uitkomsten aan portfolio- en investeringsbesluiten.',
    'Borg eigenaarschap per dimensie (security, data, compliance, operatie).'
]:
    doc.add_paragraph(item, style='List Bullet')

# 6. Deploy
doc.add_heading('6. Deployment URL\'s (huidige omgeving)', level=1)
frontend_url = os.getenv('SOVSCAN_FRONTEND_URL', 'https://sovscan-frontend.azurewebsites.net/')
backend_url = os.getenv('SOVSCAN_BACKEND_URL', f"{frontend_url.rstrip('/')}/api")
health_url = os.getenv('SOVSCAN_HEALTH_URL', f"{frontend_url.rstrip('/')}/health")

url_table = doc.add_table(rows=1, cols=2)
url_header = url_table.rows[0].cells
url_header[0].text = 'Onderdeel'
url_header[1].text = 'URL'
for name, url in [
    ('Frontend', frontend_url),
    ('Backend API', backend_url),
    ('Healthcheck', health_url),
]:
    row = url_table.add_row().cells
    row[0].text = name
    row[1].text = url

doc.add_paragraph('Noot: vervang localhost-URL\'s met de formele productie-URL\'s bij vrijgave.')

doc.save(out_file)
print(out_file)
