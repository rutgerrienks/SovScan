const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check / DB check logic
const healthCheck = async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'online', database: 'connected' });
  } catch (err) {
    console.error("Health Check Error:", err);
    res.status(503).json({ status: 'online', database: 'disconnected', error: err.message });
  }
};

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Routes
app.use('/api', apiRoutes);

// Auto-migrate: ensure new tables/columns exist
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS assessment_invites (
        id SERIAL PRIMARY KEY,
        token VARCHAR(64) UNIQUE NOT NULL,
        created_by INTEGER REFERENCES users(id),
        project_name VARCHAR(255) NOT NULL,
        invite_type VARCHAR(20) DEFAULT 'assessment',
        respondent_name VARCHAR(255),
        respondent_email VARCHAR(255),
        expires_at TIMESTAMPTZ,
        used_at TIMESTAMPTZ,
        assessment_id INTEGER REFERENCES assessments(id),
        audit_id INTEGER REFERENCES audits(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Add columns if table already existed without them
    await db.query(`ALTER TABLE assessment_invites ADD COLUMN IF NOT EXISTS invite_type VARCHAR(20) DEFAULT 'assessment'`);
    await db.query(`ALTER TABLE assessment_invites ADD COLUMN IF NOT EXISTS audit_id INTEGER REFERENCES audits(id)`);
    // Question metadata for richer UX (info, KO-redenen, mitigatie, vraagtype)
    await db.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS info_text TEXT`);
    await db.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS ko_reason TEXT`);
    await db.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS ko_mitigation TEXT`);
    await db.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_type VARCHAR(20) DEFAULT 'scale'`);
    await db.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0`);

    // Vernieuwde vragenset: detecteer of de oude set nog actief is en vervang
    // hem dan eenmalig door de nieuwe set uit seed_questions.js. Idempotent:
    // wordt niet opnieuw uitgevoerd zodra de nieuwe set in de DB staat.
    const seedQuestions = require('./seed_questions');
    const auditSeedQuestions = require('./seed_audit_questions');
    const oldMarker = await db.query(
      `SELECT 1 FROM questions WHERE question_text = 'Maakt de oplossing gebruik van hooggerubriceerde data?' LIMIT 1`
    );
    const newMarker = await db.query(
      `SELECT 1 FROM questions WHERE question_text = 'Moet de leverancier juridisch buiten de invloedssfeer van de US CLOUD Act / OFAC-sancties vallen?' LIMIT 1`
    );

    if (oldMarker.rowCount > 0 || newMarker.rowCount === 0) {
      // Oude set actief, of helemaal leeg → wipe en herseed.
      await db.query('DELETE FROM answers WHERE question_id IS NOT NULL');
      await db.query('DELETE FROM questions');
      for (const q of seedQuestions) {
        await db.query(
          `INSERT INTO questions (
            display_order, cluster, dimensie, question_text, toelichting,
            base_factor, dimensie_gewicht,
            op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee,
            ko_on_ja, ko_on_nee, info_text, ko_reason, ko_mitigation, answer_type
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
          )`,
          [
            q.display_order, q.cluster, q.dimensie, q.question_text, q.toelichting || null,
            q.base_factor || 1, q.dimensie_gewicht || 1.0,
            q.op_ja || 0, q.op_nee || 0, q.opp_ja || 0, q.opp_nee || 0,
            q.euc_ja || 0, q.euc_nee || 0, q.hyp_ja || 0, q.hyp_nee || 0,
            q.ko_on_ja || null, q.ko_on_nee || null,
            q.info_text || null, q.ko_reason || null, q.ko_mitigation || null,
            q.answer_type || 'scale'
          ]
        );
      }
      console.log(`Migration OK: vragenset vervangen, ${seedQuestions.length} vragen ingeladen.`);
    } else {
      console.log('Migration OK: nieuwe vragenset al aanwezig, geen wijziging.');
    }

    // Voeg ontbrekende auditvragen idempotent toe zonder bestaande antwoorden
    // te verwijderen. Match op exacte question_text om duplicaten te voorkomen.
    let insertedAuditCount = 0;
    for (const q of auditSeedQuestions) {
      const exists = await db.query(
        `SELECT 1 FROM audit_questions WHERE question_text = $1 LIMIT 1`,
        [q.question_text]
      );
      if (exists.rowCount === 0) {
        await db.query(
          `INSERT INTO audit_questions (dimensie, question_text, toelichting, display_order)
           VALUES ($1, $2, $3, $4)`,
          [q.dimensie, q.question_text, q.toelichting || null, q.display_order || 0]
        );
        insertedAuditCount += 1;
      }
    }
    if (insertedAuditCount > 0) {
      console.log(`Migration OK: ${insertedAuditCount} aanvullende auditvragen toegevoegd.`);
    }
  } catch (err) {
    console.error('Migration error:', err.message);
  }
})();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
