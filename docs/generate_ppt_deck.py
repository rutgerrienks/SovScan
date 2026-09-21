#!/usr/bin/env python3
"""Genereert SovScan_Presentatie.pptx — flow en screenshots conform handleiding.md."""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")
OUT = os.path.join(HERE, "SovScan_Presentatie_v1.0.pptx")

BLACK = RGBColor(0x00, 0x00, 0x00)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GREEN = RGBColor(0x86, 0xBC, 0x25)
DGREEN = RGBColor(0x2E, 0x7D, 0x00)
GREY = RGBColor(0x66, 0x66, 0x66)
LGREY = RGBColor(0xAA, 0xAA, 0xAA)
PANEL = RGBColor(0xF5, 0xF5, 0xF5)
BORDER = RGBColor(0xDD, 0xDD, 0xDD)
RED = RGBColor(0xFF, 0x44, 0x44)
AMBER = RGBColor(0xF5, 0xC4, 0x00)
ORANGE = RGBColor(0xFF, 0x88, 0x00)
INK = RGBColor(0x22, 0x22, 0x22)
FONT = "Arial"

SW, SH = Inches(13.333), Inches(7.5)

prs = Presentation()
prs.slide_width = SW
prs.slide_height = SH
BLANK = prs.slide_layouts[6]


def slide():
    return prs.slides.add_slide(BLANK)


def rect(s, l, t, w, h, fill=None, line=None, line_w=None, shape=MSO_SHAPE.RECTANGLE):
    sp = s.shapes.add_shape(shape, l, t, w, h)
    sp.shadow.inherit = False
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = fill
    if line is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line
        sp.line.width = line_w or Pt(0.75)
    return sp


def text(s, l, t, w, h, runs, size=14, color=INK, bold=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=None, wrap=True):
    """runs: string, of lijst paragrafen; paragraaf = string of lijst (tekst, dict) tuples."""
    tb = s.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = wrap
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    if isinstance(runs, str):
        runs = [runs]
    for i, para in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if spacing is not None:
            p.space_after = spacing
        if isinstance(para, str):
            para = [(para, {})]
        for txt, st in para:
            r = p.add_run()
            r.text = txt
            f = r.font
            f.name = FONT
            f.size = Pt(st.get("size", size))
            f.bold = st.get("bold", bold)
            f.color.rgb = st.get("color", color)
            if st.get("italic"):
                f.italic = True
            if st.get("spacing"):  # letter spacing in Pt-honderdsten
                r.font._rPr.set("spc", str(st["spacing"]))
    return tb


def kicker(s, l, t, txt, color=GREEN, size=12):
    text(s, l, t, Inches(9), Inches(0.3),
         [[(txt.upper(), {"size": size, "bold": True, "color": color, "spacing": 200})]])


def footer(s, n, dark=False):
    c = LGREY if not dark else RGBColor(0x88, 0x88, 0x88)
    rect(s, Inches(0.55), SH - Inches(0.52), SW - Inches(1.1), Pt(0.8),
         fill=BORDER if not dark else RGBColor(0x33, 0x33, 0x33))
    text(s, Inches(0.55), SH - Inches(0.42), Inches(8), Inches(0.3),
         [[("SovScan · Deloitte Digital Sovereignty Platform", {"size": 9, "color": c})]])
    text(s, SW - Inches(1.55), SH - Inches(0.42), Inches(1.0), Inches(0.3),
         [[(str(n), {"size": 9, "color": c, "bold": True})]], align=PP_ALIGN.RIGHT)


def step_badge(s, l, t, label):
    b = rect(s, l, t, Inches(1.15), Inches(0.34), fill=GREEN)
    tf = b.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name = FONT
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = BLACK
    return b


def title_block(s, title, step=None, sub=None):
    y = Inches(0.5)
    if step:
        step_badge(s, Inches(0.55), y, step)
        y = Inches(0.98)
    text(s, Inches(0.55), y, Inches(11.5), Inches(0.7),
         [[(title, {"size": 30, "bold": True, "color": BLACK})]])
    rect(s, Inches(0.57), y + Inches(0.62), Inches(1.6), Pt(3), fill=GREEN)
    if sub:
        text(s, Inches(0.55), y + Inches(0.78), Inches(12.2), Inches(0.5),
             [[(sub, {"size": 13, "color": GREY})]])


def shot(s, path, l, t, max_w, max_h, caption=None):
    img = Image.open(path)
    ar = img.width / img.height
    w, h = max_w, Emu(int(max_w / ar))
    if h > max_h:
        h = max_h
        w = Emu(int(max_h * ar))
    cx = l + Emu(int((max_w - w) / 2))
    rect(s, cx - Pt(1), t - Pt(1), w + Pt(2), h + Pt(2), fill=WHITE, line=BORDER, line_w=Pt(1))
    rect(s, cx - Pt(1), t - Pt(1) + h + Pt(2), w + Pt(2), Pt(3.5), fill=GREEN)
    s.shapes.add_picture(path, cx, t, width=w, height=h)
    if caption:
        text(s, cx, t + h + Inches(0.12), w, Inches(0.3),
             [[(caption, {"size": 10, "color": GREY, "italic": True})]], align=PP_ALIGN.CENTER)
    return w, h


def bullets(s, l, t, w, items, size=13, gap=Pt(10)):
    paras = []
    for head, body in items:
        para = [("▪  ", {"size": size, "color": GREEN, "bold": True}),
                (head, {"size": size, "bold": True, "color": INK})]
        if body:
            para.append((" — " + body, {"size": size, "color": GREY}))
        paras.append(para)
    text(s, l, t, w, Inches(4.5), paras, spacing=gap)


def score_bar(s, l, t, w, label, pct, ko=False):
    text(s, l, t - Inches(0.02), Inches(1.9), Inches(0.28),
         [[(label, {"size": 11, "bold": True, "color": WHITE})]])
    bl, bw = l + Inches(2.0), w - Inches(2.75)
    rect(s, bl, t + Inches(0.03), bw, Inches(0.14), fill=RGBColor(0x33, 0x33, 0x33))
    if ko:
        rect(s, bl, t + Inches(0.03), bw, Inches(0.14), fill=RED)
        tag = rect(s, l + w - Inches(0.68), t - Inches(0.03), Inches(0.62), Inches(0.26), fill=RED)
        p = tag.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = "KO"
        r.font.name = FONT; r.font.size = Pt(10); r.font.bold = True; r.font.color.rgb = WHITE
        tag.text_frame.margin_top = tag.text_frame.margin_bottom = 0
    else:
        rect(s, bl, t + Inches(0.03), Emu(int(bw * pct / 100)), Inches(0.14), fill=GREEN)
        text(s, l + w - Inches(0.72), t - Inches(0.02), Inches(0.7), Inches(0.28),
             [[(f"{pct}%", {"size": 11, "bold": True, "color": GREEN})]], align=PP_ALIGN.RIGHT)


def style_table(tbl, header_fill=BLACK, header_color=WHITE, size=12):
    for j, cell in enumerate(tbl.rows[0].cells):
        cell.fill.solid(); cell.fill.fore_color.rgb = header_fill
        for p in cell.text_frame.paragraphs:
            for r in p.runs:
                r.font.name = FONT; r.font.size = Pt(size); r.font.bold = True
                r.font.color.rgb = header_color
    for i in range(1, len(tbl.rows)):
        for cell in tbl.rows[i].cells:
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if i % 2 else RGBColor(0xF9, 0xF9, 0xF9)
            for p in cell.text_frame.paragraphs:
                for r in p.runs:
                    r.font.name = FONT; r.font.size = Pt(size)
                    if r.font.color.type is None:
                        r.font.color.rgb = INK


def make_table(s, l, t, w, rows, col_widths=None, size=12, row_h=Inches(0.32)):
    tbl_shape = s.shapes.add_table(len(rows), len(rows[0]), l, t, w, row_h * len(rows))
    tbl = tbl_shape.table
    # geen standaard-stijl banding
    tbl.first_row = False
    tbl.horz_banding = False
    if col_widths:
        for j, cw in enumerate(col_widths):
            tbl.columns[j].width = cw
    for i, row in enumerate(rows):
        tbl.rows[i].height = row_h
        for j, val in enumerate(row):
            cell = tbl.rows[i].cells[j]
            cell.margin_left = Inches(0.12); cell.margin_right = Inches(0.08)
            cell.margin_top = cell.margin_bottom = Inches(0.03)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            p = cell.text_frame.paragraphs[0]
            r = p.add_run(); r.text = str(val)
            r.font.name = FONT
    style_table(tbl, size=size)
    return tbl


def callout(s, l, t, w, h, head, body, dark=False, accent=GREEN):
    bg = BLACK if dark else PANEL
    fg = WHITE if dark else INK
    rect(s, l, t, w, h, fill=bg)
    rect(s, l, t, Pt(4), h, fill=accent)
    text(s, l + Inches(0.25), t + Inches(0.14), w - Inches(0.45), h - Inches(0.25),
         [[(head + "  ", {"size": 12, "bold": True, "color": accent if dark else INK}),
           (body, {"size": 12, "color": RGBColor(0xCC, 0xCC, 0xCC) if dark else GREY})]])


# ════════════════════════════ 1 · COVER ════════════════════════════
s = slide()
rect(s, 0, 0, SW, SH, fill=BLACK)
rect(s, 0, 0, Pt(6), SH, fill=GREEN)
kicker(s, Inches(0.9), Inches(1.7), "Deloitte Digital Sovereignty Platform", size=14)
text(s, Inches(0.85), Inches(2.05), Inches(11), Inches(1.6),
     [[("SovScan", {"size": 72, "bold": True, "color": WHITE})]])
rect(s, Inches(0.92), Inches(3.35), Inches(2.4), Pt(4), fill=GREEN)
text(s, Inches(0.9), Inches(3.65), Inches(10.5), Inches(0.9),
     [[("Digitale soevereiniteit in kaart — van scenario-assessment tot audit.",
        {"size": 20, "color": WHITE})],
      [("De volledige gebruikersflow in acht stappen, met screenshots uit de live tool.",
        {"size": 14, "color": LGREY})]], spacing=Pt(8))
text(s, Inches(0.9), Inches(6.55), Inches(11), Inches(0.4),
     [[("Deloitte Consulting Netherlands  ·  Versie 1.0  ·  Juli 2026", {"size": 11, "color": GREY})]])

# ═══════════════════════ 2 · DE FLOW IN ÉÉN OOGOPSLAG ═══════════════════════
s = slide()
title_block(s, "De flow in één oogopslag",
            sub="Twee instrumenten, één platform — dit deck volgt de acht stappen uit de gebruikershandleiding.")
steps = [
    ("01", "Inloggen", "Browser, geen installatie"),
    ("02", "Dashboard", "Assessments, audits & uitnodigingen"),
    ("03", "Assessment invullen", "23 slider-vragen, live scores"),
    ("04", "Resultaat interpreteren", "Scores per scenario + KO's"),
    ("05", "Audit uitvoeren", "8 dimensies, score 1–5"),
    ("06", "Spinnenweb & benchmark", "Radar vs. sectorgemiddelde"),
    ("07", "Uitnodigingen", "Deelbare links zonder account"),
    ("08", "Tips & FAQ", "Slim omgaan met twijfel & KO's"),
]
cw, ch, gx, gy = Inches(2.92), Inches(2.05), Inches(0.18), Inches(0.25)
x0, y0 = Inches(0.55), Inches(2.35)
for i, (num, head, sub) in enumerate(steps):
    col, row = i % 4, i // 4
    l, t = x0 + (cw + gx) * col, y0 + (ch + gy) * row
    dark = i % 2 == 0
    rect(s, l, t, cw, ch, fill=BLACK if dark else GREEN)
    text(s, l + Inches(0.22), t + Inches(0.18), cw - Inches(0.4), Inches(0.4),
         [[(num, {"size": 15, "bold": True, "color": GREEN if dark else BLACK})]])
    text(s, l + Inches(0.22), t + Inches(0.62), cw - Inches(0.44), Inches(0.75),
         [[(head, {"size": 16, "bold": True, "color": WHITE if dark else BLACK})]])
    text(s, l + Inches(0.22), t + Inches(1.32), cw - Inches(0.44), Inches(0.65),
         [[(sub, {"size": 11, "color": RGBColor(0xBB, 0xBB, 0xBB) if dark else RGBColor(0x2A, 0x3B, 0x0C)})]])
footer(s, 2)

# ════════════════════════════ 3 · INLOGGEN ════════════════════════════
s = slide()
title_block(s, "Inloggen", step="STAP 1", sub="Open de tool via uw browser — er is geen installatie nodig.")
shot(s, os.path.join(SHOTS, "01-login_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Loginscherm: twee instrumenten, één platform")
rect(s, Inches(0.55), Inches(2.05), Inches(5.35), Inches(0.62), fill=BLACK)
text(s, Inches(0.8), Inches(2.2), Inches(5.0), Inches(0.35),
     [[("URL  ", {"size": 12, "bold": True, "color": GREEN}),
       ("sovscan-frontend-1473.azurewebsites.net", {"size": 13, "color": WHITE})]])
text(s, Inches(0.55), Inches(2.95), Inches(5.3), Inches(0.3),
     [[("Standaard inloggegevens", {"size": 14, "bold": True})]])
make_table(s, Inches(0.55), Inches(3.3), Inches(5.35),
           [["Rol", "Gebruikersnaam", "Wachtwoord"],
            ["Consultant", "admin", "zie handleiding"],
            ["Beheerder", "sovadmin", "zie handleiding"]],
           col_widths=[Inches(1.75), Inches(1.9), Inches(1.7)], row_h=Inches(0.38))
text(s, Inches(0.55), Inches(4.55), Inches(5.35), Inches(0.25),
     [[("Wachtwoorden staan in de gebruikershandleiding (hoofdstuk 1).",
        {"size": 10.5, "color": GREY, "italic": True})]])
callout(s, Inches(0.55), Inches(4.9), Inches(5.35), Inches(1.0), "💡 Tip",
        "Bent u beheerder? Gebruik het Admin Panel om nieuwe gebruikers aan te maken en rechten te beheren.")
footer(s, 3)

# ════════════════════════════ 4 · DASHBOARD ════════════════════════════
s = slide()
title_block(s, "Dashboard", step="STAP 2",
            sub="Na het inloggen ziet u uw persoonlijk dashboard — de startplek voor beide instrumenten.")
shot(s, os.path.join(SHOTS, "02-dashboard_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Dashboard: kies Scenario Assessment (01) of Soevereiniteitsaudit (02)")
bullets(s, Inches(0.55), Inches(2.15), Inches(5.5), [
    ("Uw assessments", "alle eerder ingevulde scenario-analyses"),
    ("Uw audits", "alle eerder uitgevoerde soevereiniteitsaudits"),
    ("Uitnodigingen beheren", "deelbare links voor klanten of collega's"),
], size=14, gap=Pt(14))
callout(s, Inches(0.55), Inches(4.6), Inches(5.35), Inches(1.15), "Direct starten",
        "Klik op Nieuw Assessment of Nieuwe Audit om meteen te beginnen. Wisselen kan altijd via de navigatie.",
        dark=True)
footer(s, 4)

# ══════════════════ 5 · TOOL 1: ASSESSMENT STARTEN ══════════════════
s = slide()
title_block(s, "Tool 1 — Sovereignty Assessment", step="STAP 3",
            sub="Bepaal in minder dan 10 minuten welk cloud-scenario past bij uw project of organisatie.")
shot(s, os.path.join(SHOTS, "03-assessment-new_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Nieuwe analyse: projectnaam invullen en vragenlijst starten")
bullets(s, Inches(0.55), Inches(2.15), Inches(5.5), [
    ("23 vragen met een schuifknop", "elke vraag weegt mee in de soevereiniteitsscore"),
    ("Vier scenario's naast elkaar", "On-Premise, On-Premise Partner, EU Cloud en Hyperscaler"),
    ("Live score-preview", "u ziet per antwoord direct het effect op alle scenario's"),
    ("Objectieve vergelijking", "op basis van uw specifieke projecteisen"),
], size=13.5, gap=Pt(13))
footer(s, 5)

# ══════════════════ 6 · SLIDER, SCORESCHAAL & KNOCK-OUT ══════════════════
s = slide()
title_block(s, "De slider & Knock-Out criteria",
            sub="Antwoorden zijn genuanceerd (0–100); harde juridische grenzen slaan een scenario direct uit.")
text(s, Inches(0.55), Inches(1.95), Inches(5.5), Inches(0.3),
     [[("Scoreschaal", {"size": 14, "bold": True})]])
make_table(s, Inches(0.55), Inches(2.3), Inches(5.5),
           [["Slider-positie", "Betekenis"],
            ["0 – 25", "Nee (sterk tot licht)"],
            ["25 – 50", "Neutraal / licht nee"],
            ["50 – 75", "Neutraal / licht ja"],
            ["75 – 100", "Ja (licht tot sterk)"]],
           col_widths=[Inches(2.0), Inches(3.5)], row_h=Inches(0.36))
callout(s, Inches(0.55), Inches(4.45), Inches(5.5), Inches(1.15), "💡 Twijfelt u?",
        "Kies de neutrale stand (50). Neutrale antwoorden wegen lichter mee dan uitgesproken keuzes — de tool herkent onzekerheid.")
# Live score-preview paneel (KO-voorbeeld)
pl, pt, pw = Inches(6.7), Inches(1.95), Inches(6.05)
rect(s, pl, pt, pw, Inches(3.05), fill=BLACK)
kicker(s, pl + Inches(0.3), pt + Inches(0.22), "Live score-preview · voorbeeld BBi-data", size=11)
score_bar(s, pl + Inches(0.3), pt + Inches(0.75), pw - Inches(0.6), "On-Premise", 88)
score_bar(s, pl + Inches(0.3), pt + Inches(1.2), pw - Inches(0.6), "On-Premise Partner", 74)
score_bar(s, pl + Inches(0.3), pt + Inches(1.65), pw - Inches(0.6), "EU Cloud", 0, ko=True)
score_bar(s, pl + Inches(0.3), pt + Inches(2.1), pw - Inches(0.6), "Hyperscaler", 0, ko=True)
text(s, pl + Inches(0.3), pt + Inches(2.5), pw - Inches(0.6), Inches(0.5),
     [[("⚠ KO-reden: commerciële cloud is uitgesloten voor BBi+ data — EU Cloud en Hyperscaler vallen af.",
        {"size": 10.5, "color": RGBColor(0x99, 0x99, 0x99)})]])
callout(s, pl, pt + Inches(3.3), pw, Inches(1.3), "Knock-Out (KO)",
        "Zodra een antwoord een juridische of fysieke onmogelijkheid blootlegt, valt het scenario direct af — rood weergegeven, mét toelichting waarom en wat het alternatief is.",
        accent=RED)
footer(s, 6)

# ══════════════════ 7 · ASSESSMENT RESULTAAT ══════════════════
s = slide()
title_block(s, "Assessment resultaat interpreteren", step="STAP 4",
            sub="Na de laatste vraag verschijnt de overzichtspagina met scores per scenario.")
shot(s, os.path.join(SHOTS, "07-scan-resultaat_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Analyse-resultaat: matchscore per scenario, met duiding en advies")
bullets(s, Inches(0.55), Inches(2.15), Inches(5.5), [
    ("Hoogste score zonder KO", "dat is de aanbevolen richting"),
    ("Duiding & advies", "de tool licht toe waaróm een scenario past"),
    ("Rapport exporteren", "resultaat opslaan en delen met één knop"),
], size=13.5, gap=Pt(13))
callout(s, Inches(0.55), Inches(4.5), Inches(5.35), Inches(1.25), "Voorbeeld",
        "Overheidsproject met BBi-classificatie: On-Premise Partner wint (74%), EU Cloud en Hyperscaler vallen af op KO.",
        dark=True)
footer(s, 7)

# ══════════════════ 8 · TOOL 2: SOVEREIGNTY AUDIT ══════════════════
s = slide()
title_block(s, "Tool 2 — Sovereignty Audit", step="STAP 5",
            sub="Geen scenario-vergelijking, maar een diepgaand beeld van uw huidige soevereiniteitsniveau.")
shot(s, os.path.join(SHOTS, "05-audit-list_cropped.png"), Inches(6.55), Inches(2.3), Inches(6.2), Inches(3.6),
     caption="Auditoverzicht: eerdere audits openen of een nieuwe starten")
bullets(s, Inches(0.55), Inches(2.25), Inches(5.7), [
    ("Acht dimensies", "van data-soevereiniteit tot prijs/TCO"),
    ("Score 1 t/m 5 per dimensie", "u scoort de werkelijkheid van vandaag"),
    ("Sectorale benchmark", "Overheid, Financiële sector, Zorg of Commercieel"),
], size=13, gap=Pt(10))
make_table(s, Inches(0.55), Inches(4.15), Inches(5.7),
           [["Score", "Label"],
            ["1", "Niet soeverein"],
            ["2", "Beperkt soeverein"],
            ["3", "Gedeeltelijk soeverein"],
            ["4", "Grotendeels soeverein"],
            ["5", "Volledig soeverein"]],
           col_widths=[Inches(1.1), Inches(4.6)], row_h=Inches(0.33), size=11.5)
footer(s, 8)

# ══════════════════ 9 · SPINNENWEB & BENCHMARK ══════════════════
s = slide()
title_block(s, "Auditresultaat — het spinnenweb", step="STAP 6",
            sub="Groen vlak = uw score per dimensie; blauwe stippellijn = het sectorgemiddelde.")
shot(s, os.path.join(SHOTS, "06-audit-result-spinnenweb_cropped.png"), Inches(6.3), Inches(2.15), Inches(6.45), Inches(4.4),
     caption="Radargrafiek met totaalscore, score per dimensie en aanpakadvies")
bullets(s, Inches(0.55), Inches(2.05), Inches(5.5), [
    ("Totale soevereiniteitsscore", "één percentage als managementsamenvatting"),
    ("Sterkste & zwakste dimensies", "automatisch benoemd, met aanpakadvies"),
    ("Onder de benchmark?", "dan is dat een prioriteitsgebied voor de roadmap"),
], size=13, gap=Pt(10))
text(s, Inches(0.55), Inches(4.05), Inches(5.5), Inches(0.3),
     [[("Scorebetekenis per kleur", {"size": 13, "bold": True})]])
chips = [("≥ 80%  Volledig soeverein", DGREEN, WHITE), ("60–79%  Grotendeels", GREEN, WHITE),
         ("40–59%  Gedeeltelijk", AMBER, BLACK), ("20–39%  Beperkt", ORANGE, WHITE),
         ("< 20%  Niet soeverein", RED, WHITE)]
cy = Inches(4.4)
for i, (lbl, bg, fg) in enumerate(chips):
    col, row = i % 2, i // 2
    ch_l = Inches(0.55) + col * Inches(2.85)
    ch_t = cy + row * Inches(0.42)
    c = rect(s, ch_l, ch_t, Inches(2.7), Inches(0.32), fill=bg)
    tf = c.text_frame; tf.margin_left = Inches(0.1); tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]; r = p.add_run(); r.text = lbl
    r.font.name = FONT; r.font.size = Pt(10.5); r.font.bold = True; r.font.color.rgb = fg
footer(s, 9)

# ══════════════════ 10 · UITNODIGINGEN ══════════════════
s = slide()
title_block(s, "Uitnodigingen versturen", step="STAP 7",
            sub="Laat klanten of collega's een assessment of audit invullen — zonder dat zij een account nodig hebben.")
inv = [
    ("1", "Klik op Uitnodigingen", "in het dashboard"),
    ("2", "Configureer de link", "projectnaam, type (Assessment of Audit) en vervaldatum"),
    ("3", "Deel de link", "kopieer en verstuur via e-mail of Teams"),
    ("4", "Resultaat verschijnt", "automatisch in uw dashboard zodra de ontvanger klaar is"),
]
cw2, gap2 = Inches(2.92), Inches(0.18)
for i, (num, head, body) in enumerate(inv):
    l = Inches(0.55) + i * (cw2 + gap2)
    t = Inches(2.5)
    rect(s, l, t, cw2, Inches(2.3), fill=PANEL)
    rect(s, l, t, cw2, Pt(4), fill=GREEN)
    circ = rect(s, l + Inches(0.25), t + Inches(0.3), Inches(0.55), Inches(0.55), fill=BLACK, shape=MSO_SHAPE.OVAL)
    p = circ.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = num
    r.font.name = FONT; r.font.size = Pt(18); r.font.bold = True; r.font.color.rgb = GREEN
    circ.text_frame.margin_top = circ.text_frame.margin_bottom = 0
    text(s, l + Inches(0.25), t + Inches(1.05), cw2 - Inches(0.5), Inches(0.55),
         [[(head, {"size": 14, "bold": True})]])
    text(s, l + Inches(0.25), t + Inches(1.55), cw2 - Inches(0.5), Inches(0.7),
         [[(body, {"size": 11.5, "color": GREY})]])
    if i < 3:
        text(s, l + cw2 - Inches(0.06), t + Inches(0.9), Inches(0.35), Inches(0.5),
             [[("›", {"size": 26, "bold": True, "color": GREEN})]])
callout(s, Inches(0.55), Inches(5.3), Inches(12.25), Inches(0.95), "Let op",
        "De uitnodigingslink is geldig tot de ingestelde vervaldatum; daarna is de link niet meer bruikbaar. U kunt meerdere uitnodigingen tegelijk beheren.",
        accent=ORANGE)
footer(s, 10)

# ══════════════════ 11 · TIPS & FAQ ══════════════════
s = slide()
title_block(s, "Tips & veelgestelde vragen", step="STAP 8")
faqs = [
    ("Hoe sla ik een resultaat op?",
     "Automatisch, na het afronden van een assessment of audit. U vindt alles terug in uw dashboard."),
    ("Kan ik een assessment opnieuw invullen?",
     "Ja — start een nieuw assessment via het dashboard. Eerdere versies blijven bewaard."),
    ("Wat als ik een vraag niet weet?",
     "Zet de slider op 50 (neutraal). De tool herkent onzekerheid en weegt het antwoord lichter mee."),
    ("Wat zijn KO-criteria precies?",
     "Harde juridische of technische eisen die een scenario onmogelijk maken. Het scenario valt af, mét uitleg en mitigatieadvies."),
    ("Hoe interpreteer ik het verschil met de benchmark?",
     "Dimensies significant onder de benchmark zijn prioriteitsgebieden — input voor het roadmap-gesprek met uw Deloitte-adviseur."),
]
fy = Inches(1.95)
for i, (q, a) in enumerate(faqs):
    col, row = i % 2, i // 2
    l = Inches(0.55) + col * Inches(6.3)
    t = fy + row * Inches(1.45)
    if i == 4:
        l = Inches(0.55); w = Inches(12.25)
    else:
        w = Inches(6.1)
    rect(s, l, t, w, Inches(1.3), fill=PANEL)
    rect(s, l, t, Pt(4), Inches(1.3), fill=GREEN)
    text(s, l + Inches(0.25), t + Inches(0.13), w - Inches(0.45), Inches(0.35),
         [[(q, {"size": 13, "bold": True})]])
    text(s, l + Inches(0.25), t + Inches(0.5), w - Inches(0.45), Inches(0.75),
         [[(a, {"size": 11.5, "color": GREY})]])
footer(s, 11)

# ══════════════════ 12 · SLOT ══════════════════
s = slide()
rect(s, 0, 0, SW, SH, fill=BLACK)
rect(s, 0, 0, Pt(6), SH, fill=GREEN)
kicker(s, Inches(0.9), Inches(2.0), "Maak compliance concreet", size=13)
text(s, Inches(0.85), Inches(2.35), Inches(11.6), Inches(1.7),
     [[("Gebruik SovScan als gespreksopener.", {"size": 36, "bold": True, "color": WHITE})],
      [("Vul samen met de klant de vragen in en bespreek live de scores en KO-criteria — "
        "zo wordt een abstracte compliance-discussie direct concreet.", {"size": 16, "color": LGREY})]],
     spacing=Pt(12))
rect(s, Inches(0.9), Inches(4.6), Inches(6.6), Inches(0.7), fill=RGBColor(0x11, 0x11, 0x11), line=GREEN, line_w=Pt(1))
text(s, Inches(1.15), Inches(4.78), Inches(6.2), Inches(0.4),
     [[("▶  ", {"size": 13, "color": GREEN, "bold": True}),
       ("sovscan-frontend-1473.azurewebsites.net", {"size": 15, "color": WHITE, "bold": True})]])
text(s, Inches(0.9), Inches(6.55), Inches(11), Inches(0.4),
     [[("SovScan · Deloitte Consulting Netherlands · © 2026", {"size": 11, "color": GREY})]])

prs.save(OUT)
print("OK:", OUT)
