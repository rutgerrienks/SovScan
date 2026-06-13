// Aanvullende auditvragen op basis van externe instrumenten (DICTU / EU-kaders).
// Deze set wordt idempotent ingeladen via server.js: alleen ontbrekende vragen
// worden toegevoegd op basis van exacte question_text-match.

module.exports = [
  {
    dimensie: 'Data-soevereiniteit',
    question_text: 'Is het uiteindelijke moederbedrijf van de leverancier juridisch in de EU gevestigd en EU-gecontroleerd?',
    toelichting: 'Score 1: buiten EU/eindzeggenschap buiten EU – Score 5: volledig EU-gevestigd en EU-gecontroleerd',
    display_order: 4,
  },
  {
    dimensie: 'Data-soevereiniteit',
    question_text: 'Zijn alle subverwerkers, datalocaties en doorgiften volledig transparant en contractueel geborgd?',
    toelichting: 'Score 1: onduidelijke keten – Score 5: volledige ketentransparantie met contractuele borging',
    display_order: 5,
  },
  {
    dimensie: 'Security',
    question_text: 'Zijn er aantoonbare technische maatregelen die provider-toegang tot data blokkeren (bijv. HYOK/confidential computing)?',
    toelichting: 'Score 1: geen technische isolatie – Score 5: verifieerbare technische isolatie met attestatie',
    display_order: 13,
  },
  {
    dimensie: 'Security',
    question_text: 'Is privileged beheerpersoneel aantoonbaar gescreend en beperkt conform soevereiniteitseisen?',
    toelichting: 'Score 1: geen aantoonbare borging – Score 5: volledig geborgd via screening en least-privilege',
    display_order: 14,
  },
  {
    dimensie: 'Vendor Lock-in',
    question_text: 'Worden exit- en migratiescenario\'s periodiek getest, inclusief herstel van data en modellen?',
    toelichting: 'Score 1: nooit getest – Score 5: periodiek aantoonbaar getest met succesvolle restores',
    display_order: 23,
  },
  {
    dimensie: 'Vendor Lock-in',
    question_text: 'Zijn open standaarden/API\'s en dataportabiliteit contractueel afgedwongen zonder disproportionele egresskosten?',
    toelichting: 'Score 1: gesloten interfaces en hoge egressbarrieres – Score 5: open standaarden en faire exitvoorwaarden',
    display_order: 24,
  },
  {
    dimensie: 'Auditability & Compliance',
    question_text: 'Is melding en juridisch verzet bij extraterritoriale dataverzoeken expliciet contractueel geregeld?',
    toelichting: 'Score 1: geen meldplicht/verzet – Score 5: afdwingbare meldplicht en actief juridisch verzet',
    display_order: 43,
  },
  {
    dimensie: 'Auditability & Compliance',
    question_text: 'Kan uw organisatie zelfstandig forensisch onderzoek uitvoeren met volledige en onveranderbare logging?',
    toelichting: 'Score 1: vendor-afhankelijk en beperkte logs – Score 5: volledige zelfstandige forensische capaciteit',
    display_order: 44,
  },
  {
    dimensie: 'Operationele controle',
    question_text: 'Is er een aantoonbaar governance- en continuiteitsmodel voor sleutelrollen en kennisbehoud?',
    toelichting: 'Score 1: ad-hoc governance – Score 5: formeel governance- en continuiteitsmodel met periodieke toetsing',
    display_order: 52,
  },
  {
    dimensie: 'Prijs / TCO',
    question_text: 'Zijn kosten voor support, egress, audits en compliance structureel voorspelbaar en contractueel gemaximeerd?',
    toelichting: 'Score 1: onvoorspelbare aanvullende kosten – Score 5: transparante en voorspelbare integrale kostenstructuur',
    display_order: 72,
  },
];
