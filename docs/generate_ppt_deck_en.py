#!/usr/bin/env python3
"""Generates SovScan_Presentation_EN.pptx — English variant; flow and screenshots per handleiding.md."""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")
OUT = os.path.join(HERE, "SovScan_Presentation_EN_v1.0.pptx")

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
    """runs: string, or list of paragraphs; paragraph = string or list of (text, dict) tuples."""
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
            if st.get("spacing"):  # letter spacing in Pt-hundredths
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
     [[("Digital sovereignty mapped — from scenario assessment to audit.",
        {"size": 20, "color": WHITE})],
      [("The complete user flow in eight steps, with screenshots from the live tool.",
        {"size": 14, "color": LGREY})]], spacing=Pt(8))
text(s, Inches(0.9), Inches(6.55), Inches(11), Inches(0.4),
     [[("Deloitte Consulting Netherlands  ·  Version 1.0  ·  July 2026", {"size": 11, "color": GREY})]])

# ═══════════════════════ 2 · THE FLOW AT A GLANCE ═══════════════════════
s = slide()
title_block(s, "The flow at a glance",
            sub="Two instruments, one platform — this deck follows the eight steps from the user manual.")
steps = [
    ("01", "Log in", "Browser-based, no installation"),
    ("02", "Dashboard", "Assessments, audits & invitations"),
    ("03", "Complete the assessment", "23 slider questions, live scores"),
    ("04", "Interpret the results", "Scores per scenario + KOs"),
    ("05", "Run the audit", "8 dimensions, scored 1–5"),
    ("06", "Spider chart & benchmark", "Radar vs. sector average"),
    ("07", "Invitations", "Shareable links, no account needed"),
    ("08", "Tips & FAQ", "Handling uncertainty & KOs"),
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

# ════════════════════════════ 3 · LOG IN ════════════════════════════
s = slide()
title_block(s, "Log in", step="STEP 1", sub="Open the tool in your browser — no installation required.")
shot(s, os.path.join(SHOTS, "01-login_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Login screen: two instruments, one platform (tool interface is in Dutch)")
rect(s, Inches(0.55), Inches(2.05), Inches(5.35), Inches(0.62), fill=BLACK)
text(s, Inches(0.8), Inches(2.2), Inches(5.0), Inches(0.35),
     [[("URL  ", {"size": 12, "bold": True, "color": GREEN}),
       ("sovscan-frontend-1473.azurewebsites.net", {"size": 13, "color": WHITE})]])
text(s, Inches(0.55), Inches(2.95), Inches(5.3), Inches(0.3),
     [[("Default credentials", {"size": 14, "bold": True})]])
make_table(s, Inches(0.55), Inches(3.3), Inches(5.35),
           [["Role", "Username", "Password"],
            ["Consultant", "admin", "see manual"],
            ["Administrator", "sovadmin", "see manual"]],
           col_widths=[Inches(1.75), Inches(1.9), Inches(1.7)], row_h=Inches(0.38))
text(s, Inches(0.55), Inches(4.55), Inches(5.35), Inches(0.25),
     [[("Passwords are listed in the user manual (chapter 1).",
        {"size": 10.5, "color": GREY, "italic": True})]])
callout(s, Inches(0.55), Inches(4.9), Inches(5.35), Inches(1.0), "💡 Tip",
        "Are you an administrator? Use the Admin Panel to create new users and manage permissions.")
footer(s, 3)

# ════════════════════════════ 4 · DASHBOARD ════════════════════════════
s = slide()
title_block(s, "Dashboard", step="STEP 2",
            sub="After logging in you see your personal dashboard — the starting point for both instruments.")
shot(s, os.path.join(SHOTS, "02-dashboard_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Dashboard: choose Scenario Assessment (01) or Sovereignty Audit (02)")
bullets(s, Inches(0.55), Inches(2.15), Inches(5.5), [
    ("Your assessments", "all previously completed scenario analyses"),
    ("Your audits", "all previously performed sovereignty audits"),
    ("Manage invitations", "shareable links for clients or colleagues"),
], size=14, gap=Pt(14))
callout(s, Inches(0.55), Inches(4.6), Inches(5.35), Inches(1.15), "Start right away",
        "Click New Assessment or New Audit to begin immediately. You can always switch via the navigation.",
        dark=True)
footer(s, 4)

# ══════════════════ 5 · TOOL 1: STARTING THE ASSESSMENT ══════════════════
s = slide()
title_block(s, "Tool 1 — Sovereignty Assessment", step="STEP 3",
            sub="Determine in under 10 minutes which cloud scenario best fits your project or organisation.")
shot(s, os.path.join(SHOTS, "03-assessment-new_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="New analysis: enter a project name and start the questionnaire")
bullets(s, Inches(0.55), Inches(2.15), Inches(5.5), [
    ("23 slider questions", "every question feeds into the sovereignty score"),
    ("Four scenarios side by side", "On-Premise, On-Premise Partner, EU Cloud and Hyperscaler"),
    ("Live score preview", "see the effect of every answer on all scenarios instantly"),
    ("Objective comparison", "based on your specific project requirements"),
], size=13.5, gap=Pt(13))
footer(s, 5)

# ══════════════════ 6 · SLIDER, SCORE SCALE & KNOCK-OUT ══════════════════
s = slide()
title_block(s, "The slider & knock-out criteria",
            sub="Answers are nuanced (0–100); hard legal boundaries eliminate a scenario instantly.")
text(s, Inches(0.55), Inches(1.95), Inches(5.5), Inches(0.3),
     [[("Score scale", {"size": 14, "bold": True})]])
make_table(s, Inches(0.55), Inches(2.3), Inches(5.5),
           [["Slider position", "Meaning"],
            ["0 – 25", "No (strong to slight)"],
            ["25 – 50", "Neutral / slight no"],
            ["50 – 75", "Neutral / slight yes"],
            ["75 – 100", "Yes (slight to strong)"]],
           col_widths=[Inches(2.0), Inches(3.5)], row_h=Inches(0.36))
callout(s, Inches(0.55), Inches(4.45), Inches(5.5), Inches(1.15), "💡 Not sure?",
        "Choose the neutral position (50). Neutral answers carry less weight than outspoken ones — the tool recognises uncertainty.")
# Live score preview panel (KO example)
pl, pt, pw = Inches(6.7), Inches(1.95), Inches(6.05)
rect(s, pl, pt, pw, Inches(3.05), fill=BLACK)
kicker(s, pl + Inches(0.3), pt + Inches(0.22), "Live score preview · example: classified data", size=11)
score_bar(s, pl + Inches(0.3), pt + Inches(0.75), pw - Inches(0.6), "On-Premise", 88)
score_bar(s, pl + Inches(0.3), pt + Inches(1.2), pw - Inches(0.6), "On-Premise Partner", 74)
score_bar(s, pl + Inches(0.3), pt + Inches(1.65), pw - Inches(0.6), "EU Cloud", 0, ko=True)
score_bar(s, pl + Inches(0.3), pt + Inches(2.1), pw - Inches(0.6), "Hyperscaler", 0, ko=True)
text(s, pl + Inches(0.3), pt + Inches(2.5), pw - Inches(0.6), Inches(0.5),
     [[("⚠ KO reason: commercial cloud is ruled out for classified (BBi+) data — EU Cloud and Hyperscaler are eliminated.",
        {"size": 10.5, "color": RGBColor(0x99, 0x99, 0x99)})]])
callout(s, pl, pt + Inches(3.3), pw, Inches(1.3), "Knock-Out (KO)",
        "As soon as an answer exposes a legal or physical impossibility, the scenario is eliminated immediately — shown in red, with an explanation of why and what the alternative is.",
        accent=RED)
footer(s, 6)

# ══════════════════ 7 · ASSESSMENT RESULT ══════════════════
s = slide()
title_block(s, "Interpreting the assessment result", step="STEP 4",
            sub="After the last question, an overview page appears with scores per scenario.")
shot(s, os.path.join(SHOTS, "07-scan-resultaat_cropped.png"), Inches(6.3), Inches(2.0), Inches(6.45), Inches(4.55),
     caption="Analysis result: match score per scenario, with interpretation and advice")
bullets(s, Inches(0.55), Inches(2.15), Inches(5.5), [
    ("Highest score without a KO", "that is the recommended direction"),
    ("Interpretation & advice", "the tool explains why a scenario fits"),
    ("Export report", "save and share the result with a single click"),
], size=13.5, gap=Pt(13))
callout(s, Inches(0.55), Inches(4.5), Inches(5.35), Inches(1.25), "Example",
        "Government project with classified (BBi) data: On-Premise Partner wins (74%); EU Cloud and Hyperscaler are eliminated by KO.",
        dark=True)
footer(s, 7)

# ══════════════════ 8 · TOOL 2: SOVEREIGNTY AUDIT ══════════════════
s = slide()
title_block(s, "Tool 2 — Sovereignty Audit", step="STEP 5",
            sub="Not a scenario comparison, but an in-depth view of your current sovereignty level.")
shot(s, os.path.join(SHOTS, "05-audit-list_cropped.png"), Inches(6.55), Inches(2.3), Inches(6.2), Inches(3.6),
     caption="Audit overview: open earlier audits or start a new one")
bullets(s, Inches(0.55), Inches(2.25), Inches(5.7), [
    ("Eight dimensions", "from data sovereignty to price/TCO"),
    ("Score 1 to 5 per dimension", "you rate today's reality"),
    ("Sector benchmark", "Government, Financial sector, Healthcare or Commercial"),
], size=13, gap=Pt(10))
make_table(s, Inches(0.55), Inches(4.15), Inches(5.7),
           [["Score", "Label"],
            ["1", "Not sovereign"],
            ["2", "Limited sovereignty"],
            ["3", "Partially sovereign"],
            ["4", "Largely sovereign"],
            ["5", "Fully sovereign"]],
           col_widths=[Inches(1.1), Inches(4.6)], row_h=Inches(0.33), size=11.5)
footer(s, 8)

# ══════════════════ 9 · SPIDER CHART & BENCHMARK ══════════════════
s = slide()
title_block(s, "Audit result — the spider chart", step="STEP 6",
            sub="Green area = your score per dimension; blue dashed line = the sector average.")
shot(s, os.path.join(SHOTS, "06-audit-result-spinnenweb_cropped.png"), Inches(6.3), Inches(2.15), Inches(6.45), Inches(4.4),
     caption="Radar chart with total score, score per dimension and action advice")
bullets(s, Inches(0.55), Inches(2.05), Inches(5.5), [
    ("Total sovereignty score", "a single percentage as a management summary"),
    ("Strongest & weakest dimensions", "identified automatically, with action advice"),
    ("Below the benchmark?", "then that is a priority area for the roadmap"),
], size=13, gap=Pt(10))
text(s, Inches(0.55), Inches(4.05), Inches(5.5), Inches(0.3),
     [[("What each colour means", {"size": 13, "bold": True})]])
chips = [("≥ 80%  Fully sovereign", DGREEN, WHITE), ("60–79%  Largely", GREEN, WHITE),
         ("40–59%  Partially", AMBER, BLACK), ("20–39%  Limited", ORANGE, WHITE),
         ("< 20%  Not sovereign", RED, WHITE)]
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

# ══════════════════ 10 · INVITATIONS ══════════════════
s = slide()
title_block(s, "Sending invitations", step="STEP 7",
            sub="Let clients or colleagues complete an assessment or audit — without needing an account.")
inv = [
    ("1", "Click Invitations", "in the dashboard"),
    ("2", "Configure the link", "project name, type (Assessment or Audit) and expiry date"),
    ("3", "Share the link", "copy and send via e-mail or Teams"),
    ("4", "Result appears", "automatically in your dashboard once the recipient is done"),
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
callout(s, Inches(0.55), Inches(5.3), Inches(12.25), Inches(0.95), "Please note",
        "The invitation link is valid until the expiry date you set; after that it can no longer be used. You can manage multiple invitations at once.",
        accent=ORANGE)
footer(s, 10)

# ══════════════════ 11 · TIPS & FAQ ══════════════════
s = slide()
title_block(s, "Tips & frequently asked questions", step="STEP 8")
faqs = [
    ("How do I save a result?",
     "Automatically, after completing an assessment or audit. Everything is available in your dashboard."),
    ("Can I redo an assessment?",
     "Yes — start a new assessment from the dashboard. Earlier versions are kept."),
    ("What if I don't know the answer?",
     "Set the slider to 50 (neutral). The tool recognises uncertainty and gives the answer less weight."),
    ("What exactly are KO criteria?",
     "Hard legal or technical requirements that make a scenario impossible. The scenario is eliminated, with an explanation and mitigation advice."),
    ("How do I interpret the gap with the benchmark?",
     "Dimensions significantly below the benchmark are priority areas — input for the roadmap conversation with your Deloitte advisor."),
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

# ══════════════════ 12 · CLOSING ══════════════════
s = slide()
rect(s, 0, 0, SW, SH, fill=BLACK)
rect(s, 0, 0, Pt(6), SH, fill=GREEN)
kicker(s, Inches(0.9), Inches(2.0), "Make compliance tangible", size=13)
text(s, Inches(0.85), Inches(2.35), Inches(11.6), Inches(1.7),
     [[("Use SovScan as a conversation starter.", {"size": 36, "bold": True, "color": WHITE})],
      [("Fill in the questions together with your client and discuss the scores and KO criteria live — "
        "turning an abstract compliance discussion into something tangible.", {"size": 16, "color": LGREY})]],
     spacing=Pt(12))
rect(s, Inches(0.9), Inches(4.6), Inches(6.6), Inches(0.7), fill=RGBColor(0x11, 0x11, 0x11), line=GREEN, line_w=Pt(1))
text(s, Inches(1.15), Inches(4.78), Inches(6.2), Inches(0.4),
     [[("▶  ", {"size": 13, "color": GREEN, "bold": True}),
       ("sovscan-frontend-1473.azurewebsites.net", {"size": 15, "color": WHITE, "bold": True})]])
text(s, Inches(0.9), Inches(6.55), Inches(11), Inches(0.4),
     [[("SovScan · Deloitte Consulting Netherlands · © 2026", {"size": 11, "color": GREY})]])

prs.save(OUT)
print("OK:", OUT)
