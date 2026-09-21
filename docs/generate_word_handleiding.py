from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from pathlib import Path
from PIL import Image, ImageChops
import os

base = Path('/Users/rrienks/Library/CloudStorage/OneDrive-Deloitte(O365D)/Documents/projects/SovScan')
out_file = base / 'docs' / 'SovScan_Gebruikershandleiding.docx'
shots = base / 'docs' / 'screenshots'


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

# Title page
p = doc.add_paragraph('SovScan')
p.style = doc.styles['Title']
p.alignment = WD_ALIGN_PARAGRAPH.LEFT

doc.add_paragraph('Gebruikershandleiding')
doc.add_paragraph('Versie: 1.0')
doc.add_paragraph('Datum: 15 juni 2026')
doc.add_paragraph('Doelgroep: Eindgebruikers, projectleiders en beheerders')

doc.add_page_break()

# Inhoud
h = doc.add_heading('1. Introductie', level=1)
doc.add_paragraph(
    'SovScan is een Deloitte-tool waarmee organisaties digitale soevereiniteit kunnen beoordelen. '
    'De tool bevat twee onderdelen: (1) Scenario Assessment voor nieuwe initiatieven en '
    '(2) Soevereiniteitsaudit voor bestaande systemen.'
)
doc.add_paragraph(
    'De toepassing ondersteunt daarnaast een SEAL-level inventarisatie als gestructureerde nulmeting, '
    'zodat organisaties een gemeenschappelijke taal krijgen voor volwassenheid, risico\'s en prioriteiten.'
)

doc.add_heading('2. Wat doet de tool?', level=1)
doc.add_paragraph('Met SovScan kunt u:')
for item in [
    'de geschiktheid van vier hosting-scenario\'s vergelijken: On-Premise, OP Partner, EU Cloud en Hyperscaler;',
    'de soevereiniteit van een bestaand systeem scoren op 7 dimensies;',
    'een SEAL-level inventarisatie uitvoeren om het huidige volwassenheidsniveau expliciet vast te leggen;',
    'rapportages en resultaten gebruiken als input voor besluitvorming;',
    'externe partijen via uitnodigingslinks laten meewerken zonder login-account.'
]:
    doc.add_paragraph(item, style='List Bullet')

doc.add_heading('3. Deployment URL\'s', level=1)
doc.add_paragraph('Toegangspunten in deze omgeving:')

frontend_url = os.getenv('SOVSCAN_FRONTEND_URL', 'https://sovscan-frontend.azurewebsites.net/')
backend_url = os.getenv('SOVSCAN_BACKEND_URL', f"{frontend_url.rstrip('/')}/api")
health_url = os.getenv('SOVSCAN_HEALTH_URL', f"{frontend_url.rstrip('/')}/health")

url_table = doc.add_table(rows=1, cols=2)
url_header = url_table.rows[0].cells
url_header[0].text = 'Onderdeel'
url_header[1].text = 'URL'
url_rows = [
    ('Frontend (app)', frontend_url),
    ('Backend API (base)', backend_url),
    ('Backend health', health_url),
]
for name, url in url_rows:
    row = url_table.add_row().cells
    row[0].text = name
    row[1].text = url
doc.add_paragraph('Voor productie: vervang bovenstaande localhost-URL\'s door de formele deployment-URL van de omgeving.')

# Logins

doc.add_heading('4. Inloggen en Rollen', level=1)
doc.add_paragraph('Standaardaccounts in deze omgeving:')

table = doc.add_table(rows=1, cols=3)
header = table.rows[0].cells
header[0].text = 'Gebruikersnaam'
header[1].text = 'Wachtwoord'
header[2].text = 'Rol'

rows = [
    ('admin', 'admin123', 'User (eindgebruiker)'),
    ('sovadmin', 'sovadmin123', 'Admin (beheerder)')
]
for u, pw, role in rows:
    r = table.add_row().cells
    r[0].text = u
    r[1].text = pw
    r[2].text = role

doc.add_paragraph(
    'Let op: in productie moeten deze standaardwachtwoorden direct worden vervangen door sterke, unieke wachtwoorden.'
)

# Werkwijze

doc.add_heading('5. Werking Stap Voor Stap', level=1)

steps = [
    ('Stap 1 - Inloggen', 'Gebruiker logt in via het login-scherm en ziet direct de status van API en database.'),
    ('Stap 2 - Dashboard', 'Na inloggen kiest de gebruiker tussen Scenario Assessment, Soevereiniteitsaudit of Externe Uitnodiging.'),
    ('Stap 3 - Scenario Assessment', 'Gebruiker start een nieuwe analyse, vult projectnaam in en beantwoordt de vragenlijst.'),
    ('Stap 4 - Soevereiniteitsaudit', 'Gebruiker beoordeelt een bestaand systeem op meerdere dimensies en krijgt een totaalscore.'),
    ('Stap 5 - Externe Uitnodigingen', 'Gebruiker maakt een unieke invite-link aan voor een externe respondent zonder intern account.'),
]
for title, text in steps:
    doc.add_paragraph(title, style='List Number')
    doc.add_paragraph(text)

# Resultaat voor eindgebruiker

doc.add_heading('6. Resultaat voor de Eindgebruiker', level=1)
doc.add_paragraph('De tool levert de volgende waarde op voor de eindgebruiker:')
for item in [
    'Heldere, kwantitatieve score per scenario/dimensie;',
    'Sneller besluitvormingstraject rondom cloud- en soevereiniteitskeuzes;',
    'Inzicht in risico\'s zoals vendor lock-in, compliance en operationele afhankelijkheid;',
    'Eenvoudige export/rapportage (print/PDF) voor interne en externe stakeholders.'
]:
    doc.add_paragraph(item, style='List Bullet')

# Screenshots

doc.add_heading('7. Schermafbeeldingen', level=1)

images = [
    ('7.1 Login-scherm', '01-login.png', 'Inlogscherm met statusindicatoren voor API en database.'),
    ('7.2 Dashboard', '02-dashboard.png', 'Startpunt met de drie hoofdmodules van SovScan.'),
    ('7.3 Nieuwe Scenario Assessment', '03-assessment-new.png', 'Start van een nieuwe analyse met projectnaam-invoer.'),
    ('7.4 Externe Uitnodigingen', '04-invites.png', 'Beheer van uitnodigingslinks voor externe respondenten.'),
    ('7.5 Soevereiniteitsaudit Overzicht', '05-audit-list.png', 'Overzicht van bestaande audits en mogelijkheid om nieuwe audit te starten.'),
    ('7.6 Audit Resultaat (met spinnenweb)', '06-audit-result-spinnenweb.png', 'Resultaatpagina van de audit met spinnenweb/radarvisualisatie per dimensie.'),
    ('7.7 Scenario Scan Resultaat', '07-scan-resultaat.png', 'Resultaatpagina van de scenario scan met scores en adviestekst.'),
]

for title, filename, caption in images:
    doc.add_paragraph(title).runs[0].bold = True
    img = shots / filename
    if img.exists():
        cropped = cropped_image_for_doc(img)
        doc.add_picture(str(cropped), width=Inches(6.5))
        cap = doc.add_paragraph(caption)
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    else:
        doc.add_paragraph(f'[Screenshot ontbreekt: {filename}]')
    doc.add_paragraph('')

# Beheer

doc.add_heading('8. Beheerfunctionaliteit', level=1)
doc.add_paragraph(
    'Beheerders (rol admin) kunnen de vragenbank onderhouden: vragen toevoegen, wijzigen en verwijderen. '
    'Hiermee kan de inhoud van de assessment worden afgestemd op actuele wet- en regelgeving.'
)

# Afsluiting

doc.add_heading('9. Praktische Tips', level=1)
for item in [
    'Controleer altijd eerst of API- en DB-status op online staan bij het login-scherm.',
    'Gebruik duidelijke projectnamen, zodat resultaten later makkelijk terug te vinden zijn.',
    'Gebruik externe uitnodigingen voor samenwerking met leveranciers of business owners.',
    'Sla rapportages op als PDF voor besluitvormingsdossiers.'
]:
    doc.add_paragraph(item, style='List Bullet')

doc.add_paragraph('---')
doc.add_paragraph('Document automatisch samengesteld op basis van de actuele SovScan-omgeving.')

doc.save(out_file)
print(out_file)
