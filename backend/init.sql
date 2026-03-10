-- Drop all existing tables
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
  cluster VARCHAR(100),
  dimensie VARCHAR(100),
  question_text TEXT NOT NULL,
  toelichting TEXT,
  base_factor NUMERIC DEFAULT 1,
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
  ko_on_nee VARCHAR(255)
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
  answer_value VARCHAR(10), -- 'Ja' or 'Nee'
  user_factor NUMERIC DEFAULT 1 -- 0.5, 1, or 2
);

-- Seed basic data
INSERT INTO organizations (name) VALUES ('Deloitte');
INSERT INTO users (username, password, email, role, organization_id) 
VALUES ('admin', 'admin123', 'admin@deloitte.nl', 'user', 1);
INSERT INTO users (username, password, email, role, organization_id) 
VALUES ('sovadmin', 'sovadmin123', 'sovadmin@deloitte.nl', 'admin', 1);

-- Seed questions from the model
INSERT INTO questions (cluster, dimensie, question_text, toelichting, base_factor, op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee, ko_on_ja, ko_on_nee) VALUES
('Agility', 'Flexibiliteit / maatwerk', 'De oplossing vereist veel maatwerk', 'Mate waarin infra & software aanpasbaar zijn', 1, 10, 0, 10, 0, 10, 2, 10, 8, NULL, NULL),
('Agility', 'Ontwikkelsnelheid', 'Dient een MVP binnen 3 maanden operationeel zijn?', NULL, 1, 0, 10, 0, 8, 4, 10, 10, 10, NULL, NULL),
('Agility', 'Flexibiliteit / maatwerk', 'Is er met enige regelmaat noodzaak tot updates? (DevOps-cultuur)?', NULL, 1, 2, 10, 0, 10, 8, 10, 10, 10, NULL, NULL),
('Vendor-lock-in', 'Vendor-lock-in', 'Is belangrijk is het om binnen 12 mnd te kunnen migreren?', 'Afhankelijkheid van één leverancier', 1, 10, 10, 4, 10, 8, 10, 2, 10, NULL, NULL),
('Vendor-lock-in', 'Vendor-lock-in', 'Gebruik je bij voorkeur open-source software?', NULL, 1, 10, 0, 10, 2, 10, 4, 10, 10, NULL, NULL),
('Risk & Trust', 'Security', 'Maakt de oplossing gebruik van hooggerubriceerde data?', 'Beveiliging van data & systemen', 1, 10, 10, 10, 10, 6, 10, 0, 10, 'HYP', NULL),
('Risk & Trust', 'Security', 'Out-of the box securityoplossingen zijn een vereiste', NULL, 1, 0, 10, 4, 10, 8, 10, 10, 10, NULL, NULL),
('Kostenmodel', 'Prijs / TCO', 'Is er ruimte voor een CAPEX investering voor hardware/licenties?', 'Totale kosten (capex, opex, gebruik)', 1, 10, 0, 10, 10, 10, 10, 10, 10, NULL, 'OP'),
('Kostenmodel', 'Prijs / TCO', 'Een voorspelbaar bedrag per maand is een vereiste (max ~10% variatie)', NULL, 1, 10, 10, 10, 10, 0, 10, 0, 10, NULL, NULL),
('Operationele complexiteit', 'Community / vaardigheden', 'Beschikt je organisatie over voldoende specialisten om de oplossing te ontwikkelen en beheren?', 'Beschikbare skills & ecosysteem', 1, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 'OP'),
('Operationele complexiteit', 'Community / vaardigheden', 'Verwacht u extra specialisten te moeten inschakelen voor de realisatie van de oplossing?', NULL, 1, 0, 10, 0, 10, 6, 10, 10, 10, NULL, NULL),
('Operationele complexiteit', 'Community / vaardigheden', 'Volwaardige support is een vereiste voor een af te nemen product', NULL, 1, 2, 10, 4, 10, 6, 10, 10, 10, NULL, NULL),
('Operationele complexiteit', 'Community / vaardigheden', 'Er is een omvangrijke community voor dit type oplossing', NULL, 1, 0, 10, 0, 10, 2, 10, 10, 10, NULL, NULL),
('Operationele complexiteit', 'Hosting LLM', 'De LLM dient lokaal gehost te worden om maximale controle over de data te waarborgen', NULL, 1, 10, 10, 6, 10, 0, 10, 0, 10, NULL, 'EUC,HYP'),
('Agility', 'Innovatie & schaalbaarheid', 'Is toegang tot de nieuwste foundation-models vereist?', 'Snel toegang tot nieuwe tech & opschaling', 1, 2, 10, 2, 10, 6, 10, 10, 10, NULL, NULL),
('Agility', 'Innovatie & schaalbaarheid', 'Is automatische schaalvergroting bij pieken gewenst?', NULL, 1, 2, 10, 2, 10, 6, 10, 10, 10, 'EUC', NULL),
('Risk & Trust', 'Data-soevereiniteit', 'De data dient enkel onderhevig te zijn aan Europese of Nederlandse wetgeving', 'Fysieke & juridische locatie van data', 1, 10, 10, 10, 10, 10, 10, 0, 10, NULL, 'HYP'),
('Operationele complexiteit', 'Integratie-complexiteit', 'Wilt u uitsluitend kant-en-klare managed services?', 'Moeilijkheid van implementatie & beheer', 1, 0, 10, 2, 10, 6, 10, 10, 10, 'OP', NULL),
('Operationele complexiteit', 'Integratie-complexiteit', 'Is uw organisatie bereid om in beheer te investeren?', NULL, 1, 10, 0, 10, 2, 10, 8, 10, 10, NULL, NULL),
('Risk & Trust', 'Uptime / Weerbaarheid', 'Het product dient minimaal 99,5% van de tijd beschikbaar/bereikbaar te zijn', 'Beschikbaarheid van het product', 1, 0, 10, 0, 10, 8, 10, 10, 10, 'OP', NULL),
('Risk & Trust', 'Auditability & Compliance', 'Is een volledige audit op korte termijn vereist voordat de oplossing live kan gaan?', 'Controleerbaarheid & voldoen aan regelgeving', 1, 0, 10, 0, 10, 6, 10, 6, 10, NULL, NULL),
('Risk & Trust', 'Netwerk & bereikbaarheid', 'Het product dient te allen tijde bereikbaar te zijn, ook zonder internet', 'Netwerk', 1, 10, 10, 0, 10, 0, 10, 0, 10, NULL, NULL),
('Risk & Trust', 'Auditability & Compliance', 'Monitoring (logging, gebruiksstatistieken etc.) dient out-of-the-box beschikbaar te zijn', 'Monitoring', 1, 0, 10, 0, 10, 6, 10, 10, 10, NULL, NULL);
