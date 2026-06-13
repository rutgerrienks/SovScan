-- Drop all existing tables
DROP TABLE IF EXISTS assessment_invites CASCADE;
DROP TABLE IF EXISTS audit_answers CASCADE;
DROP TABLE IF EXISTS audits CASCADE;
DROP TABLE IF EXISTS audit_questions CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Recreate everything
-- Users & Organizations
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
  organization_id INTEGER REFERENCES organizations(id)
);

-- Assessment Logic
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  display_order INTEGER DEFAULT 0, -- volgorde in de wizard (lager = eerder)
  cluster VARCHAR(100),
  dimensie VARCHAR(100),
  question_text TEXT NOT NULL,
  toelichting TEXT,
  base_factor NUMERIC DEFAULT 1,
  dimensie_gewicht NUMERIC DEFAULT 1.0, -- weighting per dimension cluster
  -- Scoring for "Ja" answer (0-10)
  op_ja INTEGER DEFAULT 0,
  opp_ja INTEGER DEFAULT 0,
  euc_ja INTEGER DEFAULT 0,
  hyp_ja INTEGER DEFAULT 0,
  -- Scoring for "Nee" answer (0-10)
  op_nee INTEGER DEFAULT 0,
  opp_nee INTEGER DEFAULT 0,
  euc_nee INTEGER DEFAULT 0,
  hyp_nee INTEGER DEFAULT 0,
  -- Knock-out rules (Scenario names that are disqualified if answer is Ja or Nee)
  ko_on_ja VARCHAR(255), -- comma separated: OP,OPP,EUC,HYP
  ko_on_nee VARCHAR(255),
  -- Extra context fields
  info_text TEXT,            -- achtergrondinfo bij de vraag
  ko_reason TEXT,            -- waarom dit antwoord een scenario disqualificeert
  ko_mitigation TEXT,        -- hoe de KO eventueel gemitigeerd kan worden
  answer_type VARCHAR(20) DEFAULT 'scale' -- 'scale' (slider 0-100) of 'binary' (Ja/Nee)
);

CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  project_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  score_op NUMERIC,
  score_opp NUMERIC,
  score_euc NUMERIC,
  score_hyp NUMERIC,
  is_ko_op BOOLEAN DEFAULT false,
  is_ko_opp BOOLEAN DEFAULT false,
  is_ko_euc BOOLEAN DEFAULT false,
  is_ko_hyp BOOLEAN DEFAULT false
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  answer_value NUMERIC DEFAULT 50, -- 0 (Nee) to 100 (Ja), 50 = neutraal
  user_factor NUMERIC DEFAULT 1    -- 0.5 to 2.0 continuous slider
);

-- Soevereiniteitsaudit: assess an existing system per sovereignty dimension
CREATE TABLE audit_questions (
  id SERIAL PRIMARY KEY,
  dimensie VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  toelichting TEXT,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE audits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  system_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_answers (
  id SERIAL PRIMARY KEY,
  audit_id INTEGER REFERENCES audits(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES audit_questions(id) ON DELETE SET NULL,
  score INTEGER -- 1 (niet soeverein) to 5 (volledig soeverein)
);

-- Assessment invites: allow external users to fill in an assessment or audit via a unique link
CREATE TABLE assessment_invites (
  id SERIAL PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id),
  project_name VARCHAR(255) NOT NULL,
  invite_type VARCHAR(20) DEFAULT 'assessment', -- 'assessment' or 'audit'
  respondent_name VARCHAR(255),
  respondent_email VARCHAR(255),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  assessment_id INTEGER REFERENCES assessments(id),
  audit_id INTEGER REFERENCES audits(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed basic data
INSERT INTO organizations (name) VALUES ('Deloitte');
INSERT INTO users (username, password, email, role, organization_id) 
VALUES ('admin', 'admin123', 'admin@deloitte.nl', 'user', 1);
INSERT INTO users (username, password, email, role, organization_id) 
VALUES ('sovadmin', 'sovadmin123', 'sovadmin@deloitte.nl', 'admin', 1);

-- NB: de scenario-vragen worden bij eerste backend-start automatisch ingeladen
-- vanuit backend/seed_questions.js (zie auto-migrate in server.js). Zo blijft
-- de vragenset op één plek beheerd en hoeft init.sql niet te worden bijgewerkt
-- bij elke wijziging.

-- Seed audit questions for the Soevereiniteitsaudit (bestaand systeem beoordelen)
-- Score 1 = niet soeverein, 5 = volledig soeverein
INSERT INTO audit_questions (dimensie, question_text, toelichting, display_order) VALUES
-- Data-soevereiniteit
('Data-soevereiniteit', 'Waar worden de data en AI-modellen van dit systeem opgeslagen?', 'Score 1: buiten EU zonder contractuele garanties – Score 5: uitsluitend op Nederlandse/eigen hardware', 1),
('Data-soevereiniteit', 'Onder welke wetgeving valt de verwerking van uw data?', 'Score 1: niet-Europese wetgeving van toepassing – Score 5: uitsluitend Nederlandse/EU-wetgeving', 2),
('Data-soevereiniteit', 'Wie heeft technisch toegang tot uw productiedata?', 'Score 1: externe partij zonder beperkingen – Score 5: uitsluitend eigen medewerkers', 3),

-- Security
('Security', 'In hoeverre voldoet dit systeem aan geldende beveiligingsnormen (bijv. ISO 27001, BIO)?', 'Score 1: geen certificering of beleid – Score 5: gecertificeerd en regelmatig geauditeerd', 10),
('Security', 'Heeft uw organisatie volledige controle over toegangsbeheer en identiteitsbeheer?', 'Score 1: volledig uitbesteed aan leverancier – Score 5: volledig in eigen beheer', 11),
('Security', 'Hoe frequent worden security-audits en penetratietests uitgevoerd?', 'Score 1: nooit – Score 5: minimaal jaarlijks door onafhankelijke partij', 12),

-- Vendor Lock-in
('Vendor Lock-in', 'Hoe eenvoudig kunt u binnen 12 maanden wisselen van technologieleverancier?', 'Score 1: migratie vrijwel onmogelijk door technische of contractuele koppeling – Score 5: volledig portable, geen lock-in', 20),
('Vendor Lock-in', 'Maakt uw systeem gebruik van open standaarden of open-source componenten?', 'Score 1: volledig gesloten/proprietary – Score 5: volledig open source / open standaarden', 21),
('Vendor Lock-in', 'Kunt u uw data en modellen binnen 30 dagen volledig exporteren zonder dataverlies?', 'Score 1: geen exportmogelijkheid – Score 5: volledige export op elk moment mogelijk', 22),

-- Flexibiliteit / maatwerk
('Flexibiliteit / maatwerk', 'In hoeverre kunt u het systeem aanpassen aan uw specifieke organisatiebehoeften?', 'Score 1: geen aanpassingen mogelijk – Score 5: volledige controle over broncode en configuratie', 30),
('Flexibiliteit / maatwerk', 'Heeft uw organisatie toegang tot de broncode of modelgewichten van de AI-component?', 'Score 1: volledig closed source / gesloten weights – Score 5: volledig open weights en broncode beschikbaar', 31),

-- Auditability & Compliance
('Auditability & Compliance', 'In hoeverre kunt u AI-beslissingen verklaren, reproduceren en auditeerbaar maken?', 'Score 1: black-box, geen inzicht mogelijk – Score 5: volledige explainability en reproduceerbare resultaten', 40),
('Auditability & Compliance', 'Beschikt uw organisatie over een volledige en onwijzigbare audit trail van systeemactiviteiten?', 'Score 1: geen logging aanwezig – Score 5: uitgebreide, gecertificeerde audit trail beschikbaar', 41),
('Auditability & Compliance', 'Voldoet uw systeem aantoonbaar aan AVG, de EU AI Act en sectorspecifieke regelgeving?', 'Score 1: compliance niet aangetoond – Score 5: volledig gedocumenteerde compliance met alle van toepassing zijnde regelgeving', 42),

-- Operationele controle
('Operationele controle', 'Beschikt uw organisatie over voldoende interne expertise om dit systeem zelfstandig te beheren?', 'Score 1: volledig afhankelijk van leverancier voor dagelijks beheer – Score 5: volledig zelfstandig beheer mogelijk', 50),
('Operationele controle', 'In hoeverre bent u afhankelijk van externe partijen voor updates, patches en incidentrespons?', 'Score 1: volledig afhankelijk, geen SLA – Score 5: volledig onafhankelijk, eigen responscapaciteit', 51),

-- Innovatie & schaalbaarheid
('Innovatie & schaalbaarheid', 'In hoeverre heeft uw organisatie zelfstandige controle over het uitrollen van updates en nieuwe functionaliteit?', 'Score 1: volledig afhankelijk van leverancier voor updates – Score 5: eigen CI/CD pipeline, volledig zelfstandig', 60),
('Innovatie & schaalbaarheid', 'Kunt u het systeem naar eigen inzicht schalen zonder afhankelijkheid van één leverancier?', 'Score 1: schaalbaarheid volledig bepaald door leverancier – Score 5: horizontale en verticale schaling volledig in eigen hand', 61),

-- Prijs / TCO
('Prijs / TCO', 'In hoeverre heeft uw organisatie inzicht in en controle over de totale kosten (TCO) van dit systeem?', 'Score 1: kosten onvoorspelbaar en volledig door leverancier bepaald – Score 5: volledige kostentransparantie en -controle', 70),
('Prijs / TCO', 'Kunt u de infra-kosten verlagen door te wisselen van leverancier of door zelf te hosten?', 'Score 1: geen alternatief, hoge exit-kosten – Score 5: meerdere alternatieven, minimale exit-kosten', 71),

-- Aanvullende vragen o.b.v. externe instrumenten (DICTU / EU-kaders)
('Data-soevereiniteit', 'Is het uiteindelijke moederbedrijf van de leverancier juridisch in de EU gevestigd en EU-gecontroleerd?', 'Score 1: buiten EU/eindzeggenschap buiten EU – Score 5: volledig EU-gevestigd en EU-gecontroleerd', 4),
('Data-soevereiniteit', 'Zijn alle subverwerkers, datalocaties en doorgiften volledig transparant en contractueel geborgd?', 'Score 1: onduidelijke keten – Score 5: volledige ketentransparantie met contractuele borging', 5),
('Security', 'Zijn er aantoonbare technische maatregelen die provider-toegang tot data blokkeren (bijv. HYOK/confidential computing)?', 'Score 1: geen technische isolatie – Score 5: verifieerbare technische isolatie met attestatie', 13),
('Security', 'Is privileged beheerpersoneel aantoonbaar gescreend en beperkt conform soevereiniteitseisen?', 'Score 1: geen aantoonbare borging – Score 5: volledig geborgd via screening en least-privilege', 14),
('Vendor Lock-in', 'Worden exit- en migratiescenario\'s periodiek getest, inclusief herstel van data en modellen?', 'Score 1: nooit getest – Score 5: periodiek aantoonbaar getest met succesvolle restores', 23),
('Vendor Lock-in', 'Zijn open standaarden/API\'s en dataportabiliteit contractueel afgedwongen zonder disproportionele egresskosten?', 'Score 1: gesloten interfaces en hoge egressbarrieres – Score 5: open standaarden en faire exitvoorwaarden', 24),
('Auditability & Compliance', 'Is melding en juridisch verzet bij extraterritoriale dataverzoeken expliciet contractueel geregeld?', 'Score 1: geen meldplicht/verzet – Score 5: afdwingbare meldplicht en actief juridisch verzet', 43),
('Auditability & Compliance', 'Kan uw organisatie zelfstandig forensisch onderzoek uitvoeren met volledige en onveranderbare logging?', 'Score 1: vendor-afhankelijk en beperkte logs – Score 5: volledige zelfstandige forensische capaciteit', 44),
('Operationele controle', 'Is er een aantoonbaar governance- en continuiteitsmodel voor sleutelrollen en kennisbehoud?', 'Score 1: ad-hoc governance – Score 5: formeel governance- en continuiteitsmodel met periodieke toetsing', 52),
('Prijs / TCO', 'Zijn kosten voor support, egress, audits en compliance structureel voorspelbaar en contractueel gemaximeerd?', 'Score 1: onvoorspelbare aanvullende kosten – Score 5: transparante en voorspelbare integrale kostenstructuur', 72);
