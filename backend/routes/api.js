const crypto = require('crypto');

const express = require('express');
const router = express.Router();
const db = require('../db');
const { Resend } = require('resend');

// Initialize Resend lazily — only when an email is actually sent
let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ 
      token: 'mock-token-123',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Questions
router.get('/questions', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM questions ORDER BY display_order, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: POST Question
router.post('/questions', async (req, res) => {
  const { cluster, dimensie, question_text, toelichting, base_factor, op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee, ko_on_ja, ko_on_nee, info_text, ko_reason, ko_mitigation, answer_type } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO questions 
       (cluster, dimensie, question_text, toelichting, base_factor, op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee, ko_on_ja, ko_on_nee, info_text, ko_reason, ko_mitigation, answer_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [cluster, dimensie, question_text, toelichting, base_factor, op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee, ko_on_ja, ko_on_nee, info_text || null, ko_reason || null, ko_mitigation || null, answer_type || 'scale']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: PUT Question
router.put('/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { cluster, dimensie, question_text, toelichting, base_factor, op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee, ko_on_ja, ko_on_nee, info_text, ko_reason, ko_mitigation, answer_type } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE questions SET 
       cluster=$1, dimensie=$2, question_text=$3, toelichting=$4, base_factor=$5, 
       op_ja=$6, op_nee=$7, opp_ja=$8, opp_nee=$9, euc_ja=$10, euc_nee=$11, 
       hyp_ja=$12, hyp_nee=$13, ko_on_ja=$14, ko_on_nee=$15,
       info_text=$16, ko_reason=$17, ko_mitigation=$18, answer_type=$19 
       WHERE id=$20 RETURNING *`,
      [cluster, dimensie, question_text, toelichting, base_factor, op_ja, op_nee, opp_ja, opp_nee, euc_ja, euc_nee, hyp_ja, hyp_nee, ko_on_ja, ko_on_nee, info_text || null, ko_reason || null, ko_mitigation || null, answer_type || 'scale', id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: DELETE Question
router.delete('/questions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ message: 'Vraag verwijderd' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Assessment
router.post('/assessments', async (req, res) => {
  const { userId, projectName, answers } = req.body;
  try {
    const { rows: questions } = await db.query('SELECT * FROM questions');
    
    let totalMaxOP = 0, totalMaxOPP = 0, totalMaxEUC = 0, totalMaxHYP = 0;
    let scoreOP = 0, scoreOPP = 0, scoreEUC = 0, scoreHYP = 0;
    let koOP = false, koOPP = false, koEUC = false, koHYP = false;

    questions.forEach(q => {
      const answer = answers.find(a => a.questionId === q.id);
      // slider value 0-100 (0=Nee, 100=Ja); default 50 (neutral)
      const sliderVal = (answer && answer.value !== undefined) ? parseFloat(answer.value) : 50;
      const t = sliderVal / 100; // interpolation factor 0-1
      const userFactor = (answer && answer.factor) ? parseFloat(answer.factor) : 1;

      const effectiveFactor = (q.base_factor || 1) * userFactor * (parseFloat(q.dimensie_gewicht) || 1.0);

      // Answer confidence: neutral answers (sliderVal=50) weigh half as much as decisive ones
      const answerConfidence = 0.5 + 0.5 * (Math.abs(sliderVal - 50) / 50);
      const weightedFactor = effectiveFactor * answerConfidence;
      
      totalMaxOP  += Math.max(q.op_ja  || 0, q.op_nee  || 0) * effectiveFactor;
      totalMaxOPP += Math.max(q.opp_ja || 0, q.opp_nee || 0) * effectiveFactor;
      totalMaxEUC += Math.max(q.euc_ja || 0, q.euc_nee || 0) * effectiveFactor;
      totalMaxHYP += Math.max(q.hyp_ja || 0, q.hyp_nee || 0) * effectiveFactor;

      // Interpolate between Nee score (t=0) and Ja score (t=1), scaled by answer confidence
      scoreOP  += ((q.op_nee  || 0) + ((q.op_ja  || 0) - (q.op_nee  || 0)) * t) * weightedFactor;
      scoreOPP += ((q.opp_nee || 0) + ((q.opp_ja || 0) - (q.opp_nee || 0)) * t) * weightedFactor;
      scoreEUC += ((q.euc_nee || 0) + ((q.euc_ja || 0) - (q.euc_nee || 0)) * t) * weightedFactor;
      scoreHYP += ((q.hyp_nee || 0) + ((q.hyp_ja || 0) - (q.hyp_nee || 0)) * t) * weightedFactor;

      // KO: >= 75 leans decisively toward Ja, <= 25 decisively toward Nee
      // Neutraal/licht-eens (35-65) triggert geen KO
      if (sliderVal >= 75 && q.ko_on_ja) {
        const kos = q.ko_on_ja.split(',').map(s => s.trim());
        if (kos.includes('OP'))  koOP  = true;
        if (kos.includes('OPP')) koOPP = true;
        if (kos.includes('EUC')) koEUC = true;
        if (kos.includes('HYP')) koHYP = true;
      }
      if (sliderVal <= 25 && q.ko_on_nee) {
        const kos = q.ko_on_nee.split(',').map(s => s.trim());
        if (kos.includes('OP'))  koOP  = true;
        if (kos.includes('OPP')) koOPP = true;
        if (kos.includes('EUC')) koEUC = true;
        if (kos.includes('HYP')) koHYP = true;
      }
    });

    const finalOP = totalMaxOP > 0 ? (scoreOP / totalMaxOP) * 100 : 0;
    const finalOPP = totalMaxOPP > 0 ? (scoreOPP / totalMaxOPP) * 100 : 0;
    const finalEUC = totalMaxEUC > 0 ? (scoreEUC / totalMaxEUC) * 100 : 0;
    const finalHYP = totalMaxHYP > 0 ? (scoreHYP / totalMaxHYP) * 100 : 0;

    const { rows: assessment } = await db.query(
      `INSERT INTO assessments 
       (user_id, project_name, score_op, score_opp, score_euc, score_hyp, is_ko_op, is_ko_opp, is_ko_euc, is_ko_hyp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, projectName, finalOP, finalOPP, finalEUC, finalHYP, koOP, koOPP, koEUC, koHYP]
    );

    const assessmentId = assessment[0].id;

    for (const ans of answers) {
      if (ans.questionId && ans.value !== undefined) {
        await db.query(
          'INSERT INTO answers (assessment_id, question_id, answer_value, user_factor) VALUES ($1, $2, $3, $4)',
          [assessmentId, ans.questionId, parseFloat(ans.value), ans.factor || 1]
        );
      }
    }

    res.status(201).json(assessment[0]);
  } catch (err) {
    console.error("Assessment Error:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Assessments
router.get('/assessments', async (req, res) => {
  const { userId } = req.query;
  try {
    const { rows } = await db.query('SELECT * FROM assessments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Detailed Assessment
router.get('/assessments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const assessmentRes = await db.query('SELECT * FROM assessments WHERE id = $1', [id]);
    if (assessmentRes.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    
    const answersRes = await db.query(`
      SELECT a.answer_value, a.user_factor, q.question_text, q.cluster, q.dimensie,
             q.ko_on_ja, q.ko_on_nee, q.ko_reason, q.ko_mitigation, q.info_text, q.answer_type
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = $1
      ORDER BY q.display_order, q.id
    `, [id]);

    res.json({
      ...assessmentRes.rows[0],
      details: answersRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Email Assessment Report
router.post('/assessments/:id/email', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email adres is verplicht' });

  console.log(`Email request for assessment ${id} to ${email}`);

  try {
    const { rows } = await db.query(`
      SELECT a.*, u.username 
      FROM assessments a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.id = $1
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    const assessment = rows[0];

    const answersRes = await db.query(`
      SELECT a.answer_value, a.user_factor, q.question_text, q.ko_on_ja, q.ko_on_nee
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      WHERE a.assessment_id = $1
      ORDER BY q.display_order, q.id
    `, [id]);
    const details = answersRes.rows;

    const dateStr = new Date(assessment.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    let answersHtml = `
      <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px;">
        <h3 style="color: #000; text-transform: uppercase; font-size: 16px;">Gegeven Antwoorden</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f3f3f3; text-align: left;">
              <th style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px;">Vraag</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px;">Antwoord</th>
              <th style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px;">Prioriteit</th>
            </tr>
          </thead>
          <tbody>
    `;

    details.forEach(ans => {
        let priorityLabel = 'Standaard';
        const factor = parseFloat(ans.user_factor);
        if (factor < 0.9) priorityLabel = 'Lager';
        if (factor > 1.1) priorityLabel = 'Hoger';

        const sliderVal = parseFloat(ans.answer_value);
        let antwoordLabel;
        if (sliderVal >= 85)      antwoordLabel = 'Ja (sterk)';
        else if (sliderVal >= 60) antwoordLabel = 'Ja (licht)';
        else if (sliderVal >= 40) antwoordLabel = 'Neutraal';
        else if (sliderVal >= 15) antwoordLabel = 'Nee (licht)';
        else                      antwoordLabel = 'Nee (sterk)';

        answersHtml += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">
              ${ans.question_text}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; font-weight: bold;">${antwoordLabel} (${Math.round(sliderVal)})</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px;">${priorityLabel}</td>
          </tr>
        `;
    });

    answersHtml += `</tbody></table></div>`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #000; background-color: #fff;">
        <h1 style="color: #000; font-size: 32px; margin-bottom: 10px;">Deloitte<span style="color: #86BC25;">.</span></h1>
        <h2 style="color: #000; font-size: 24px; border-bottom: 4px solid #86BC25; padding-bottom: 10px; margin-bottom: 30px;">Sovereignty Assessment Rapport</h2>
        
        <p style="font-size: 16px;">Hieronder vindt u de resultaten van de soevereiniteitsanalyse voor het project: <strong>${assessment.project_name}</strong>.</p>
        
        <div style="background-color: #000; color: #fff; padding: 30px; margin: 30px 0;">
          <h3 style="color: #86BC25; text-transform: uppercase; font-size: 14px; margin-top: 0; letter-spacing: 1px;">Analyse resultaat</h3>
          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #333;">On-Premise:</td>
              <td style="text-align: right; font-weight: bold; font-size: 24px; color: ${assessment.is_ko_op ? '#ff0000' : '#86BC25'};">
                ${assessment.is_ko_op ? 'N/A (KO)' : Math.round(assessment.score_op) + '%'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #333;">On-Premise Partner:</td>
              <td style="text-align: right; font-weight: bold; font-size: 24px; color: ${assessment.is_ko_opp ? '#ff0000' : '#86BC25'};">
                ${assessment.is_ko_opp ? 'N/A (KO)' : Math.round(assessment.score_opp) + '%'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #333;">EU Cloud:</td>
              <td style="text-align: right; font-weight: bold; font-size: 24px; color: ${assessment.is_ko_euc ? '#ff0000' : '#86BC25'};">
                ${assessment.is_ko_euc ? 'N/A (KO)' : Math.round(assessment.score_euc) + '%'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">Hyperscaler:</td>
              <td style="text-align: right; font-weight: bold; font-size: 24px; color: ${assessment.is_ko_hyp ? '#ff0000' : '#86BC25'};">
                ${assessment.is_ko_hyp ? 'N/A (KO)' : Math.round(assessment.score_hyp) + '%'}
              </td>
            </tr>
          </table>
        </div>

        ${answersHtml}

        <div style="margin-top: 60px; padding: 20px; background-color: #f9f9f9; font-size: 11px; color: #666; border-left: 4px solid #86BC25;">
          <p><strong>DISCLAIMER</strong></p>
          <p>Dit rapport is automatisch gegenereerd door de <strong>Deloitte Sovereignty Assessment Tool</strong> op <strong>${dateStr}</strong>.</p>
          <p>De getoonde resultaten en scores zijn gebaseerd op de door de gebruiker verstrekte antwoorden en dienen uitsluitend ter indicatie. Aan dit rapport kunnen geen rechten worden ontleend. De analyse vormt geen vervanging voor formeel juridisch, technisch of strategisch advies.</p>
          <p>&copy; ${new Date().getFullYear()} Deloitte Netherlands</p>
        </div>
      </div>
    `;

    console.log(`Attempting to send email via Resend to ${email}...`);

    const result = await getResend().emails.send({
      from: 'SovScan <onboarding@resend.dev>',
      to: [email],
      subject: `Sovereignty Rapport: ${assessment.project_name}`,
      html: htmlContent,
    });

    if (result.error) {
        console.error("Resend SDK Error:", result.error);
        return res.status(500).json({ error: result.error.message });
    }

    console.log("Resend Success, ID:", result.data.id);
    res.json({ message: 'Email verzonden', id: result.data.id });
  } catch (err) {
    console.error("Backend Email Error:", err);
    res.status(500).json({ error: 'Fout bij verzenden email: ' + err.message });
  }
});

// ─── Soevereiniteitsaudit ──────────────────────────────────────────────────

// GET Audit Questions
router.get('/audit-questions', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM audit_questions ORDER BY display_order, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Audit — store answers and compute per-dimension scores
router.post('/audits', async (req, res) => {
  const { userId, systemName, answers } = req.body;
  try {
    const { rows: questions } = await db.query('SELECT * FROM audit_questions ORDER BY display_order, id');

    const { rows: audit } = await db.query(
      'INSERT INTO audits (user_id, system_name) VALUES ($1, $2) RETURNING *',
      [userId, systemName]
    );
    const auditId = audit[0].id;

    for (const ans of answers) {
      if (ans.questionId && ans.score !== undefined) {
        await db.query(
          'INSERT INTO audit_answers (audit_id, question_id, score) VALUES ($1, $2, $3)',
          [auditId, ans.questionId, parseInt(ans.score)]
        );
      }
    }

    // Compute dimension scores — alleen op basis van DAADWERKELIJK beantwoorde stellingen.
    // Niet-beantwoorde stellingen worden NIET als 3 (neutraal) meegerekend.
    const dimensionMap = {};
    questions.forEach(q => {
      const ans = answers.find(a => a.questionId === q.id);
      if (!ans || ans.score === undefined || ans.score === null) return;
      if (!dimensionMap[q.dimensie]) dimensionMap[q.dimensie] = [];
      dimensionMap[q.dimensie].push(parseInt(ans.score));
    });

    const dimensionScores = Object.entries(dimensionMap).map(([dimensie, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { dimensie, score: Math.round(((avg - 1) / 4) * 100) };
    });

    const overallScore = dimensionScores.length > 0
      ? Math.round(dimensionScores.reduce((a, b) => a + b.score, 0) / dimensionScores.length)
      : 0;

    res.status(201).json({ ...audit[0], dimensionScores, overallScore });
  } catch (err) {
    console.error('Audit Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Audits for user
router.get('/audits', async (req, res) => {
  const { userId } = req.query;
  try {
    const { rows } = await db.query(
      'SELECT * FROM audits WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Audit detail with per-dimension scores
router.get('/audits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const auditRes = await db.query('SELECT * FROM audits WHERE id = $1', [id]);
    if (auditRes.rows.length === 0) return res.status(404).json({ error: 'Audit not found' });

    const answersRes = await db.query(`
      SELECT aa.score, aq.question_text, aq.toelichting, aq.dimensie
      FROM audit_answers aa
      JOIN audit_questions aq ON aa.question_id = aq.id
      WHERE aa.audit_id = $1
      ORDER BY aq.display_order, aq.id
    `, [id]);

    const dimensionMap = {};
    answersRes.rows.forEach(row => {
      if (!dimensionMap[row.dimensie]) dimensionMap[row.dimensie] = [];
      dimensionMap[row.dimensie].push(row.score);
    });

    const dimensionScores = Object.entries(dimensionMap).map(([dimensie, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { dimensie, score: Math.round(((avg - 1) / 4) * 100) };
    });

    const overallScore = dimensionScores.length > 0
      ? Math.round(dimensionScores.reduce((a, b) => a + b.score, 0) / dimensionScores.length)
      : 0;

    res.json({
      ...auditRes.rows[0],
      details: answersRes.rows,
      dimensionScores,
      overallScore
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Assessment Invites ────────────────────────────────────────────────────

// POST Create invite — generates a unique token/link
router.post('/invites', async (req, res) => {
  const { userId, projectName, expiresInDays, inviteType } = req.body;
  if (!projectName) return res.status(400).json({ error: 'Projectnaam is verplicht' });

  const token = crypto.randomBytes(32).toString('hex');
  const type = inviteType === 'audit' ? 'audit' : 'assessment';
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days

  try {
    const { rows } = await db.query(
      `INSERT INTO assessment_invites (token, created_by, project_name, invite_type, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [token, userId, projectName, type, expiresAt]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Invite Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET List invites for a user
router.get('/invites', async (req, res) => {
  const { userId } = req.query;
  try {
    const { rows } = await db.query(
      'SELECT * FROM assessment_invites WHERE created_by = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Validate invite token (public — no auth required)
router.get('/invites/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const { rows } = await db.query(
      'SELECT * FROM assessment_invites WHERE token = $1',
      [token]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ongeldige uitnodiging' });

    const invite = rows[0];
    if (invite.used_at) return res.status(410).json({ error: 'Deze uitnodiging is al gebruikt' });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Deze uitnodiging is verlopen' });
    }

    res.json({ id: invite.id, projectName: invite.project_name, inviteType: invite.invite_type || 'assessment', expiresAt: invite.expires_at });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Submit assessment via invite token (public — no auth required)
router.post('/invites/:token/submit', async (req, res) => {
  const { token } = req.params;
  const { respondentName, respondentEmail, answers } = req.body;

  try {
    // Validate invite
    const { rows: invites } = await db.query(
      'SELECT * FROM assessment_invites WHERE token = $1',
      [token]
    );
    if (invites.length === 0) return res.status(404).json({ error: 'Ongeldige uitnodiging' });

    const invite = invites[0];
    if (invite.used_at) return res.status(410).json({ error: 'Deze uitnodiging is al gebruikt' });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Deze uitnodiging is verlopen' });
    }

    // Compute scores (same logic as POST /assessments)
    const { rows: questions } = await db.query('SELECT * FROM questions');

    let totalMaxOP = 0, totalMaxOPP = 0, totalMaxEUC = 0, totalMaxHYP = 0;
    let scoreOP = 0, scoreOPP = 0, scoreEUC = 0, scoreHYP = 0;
    let koOP = false, koOPP = false, koEUC = false, koHYP = false;

    questions.forEach(q => {
      const answer = answers.find(a => a.questionId === q.id);
      const sliderVal = (answer && answer.value !== undefined) ? parseFloat(answer.value) : 50;
      const t = sliderVal / 100;
      const userFactor = (answer && answer.factor) ? parseFloat(answer.factor) : 1;
      const effectiveFactor = (q.base_factor || 1) * userFactor * (parseFloat(q.dimensie_gewicht) || 1.0);
      const answerConfidence = 0.5 + 0.5 * (Math.abs(sliderVal - 50) / 50);
      const weightedFactor = effectiveFactor * answerConfidence;

      totalMaxOP  += Math.max(q.op_ja  || 0, q.op_nee  || 0) * effectiveFactor;
      totalMaxOPP += Math.max(q.opp_ja || 0, q.opp_nee || 0) * effectiveFactor;
      totalMaxEUC += Math.max(q.euc_ja || 0, q.euc_nee || 0) * effectiveFactor;
      totalMaxHYP += Math.max(q.hyp_ja || 0, q.hyp_nee || 0) * effectiveFactor;

      scoreOP  += ((q.op_nee  || 0) + ((q.op_ja  || 0) - (q.op_nee  || 0)) * t) * weightedFactor;
      scoreOPP += ((q.opp_nee || 0) + ((q.opp_ja || 0) - (q.opp_nee || 0)) * t) * weightedFactor;
      scoreEUC += ((q.euc_nee || 0) + ((q.euc_ja || 0) - (q.euc_nee || 0)) * t) * weightedFactor;
      scoreHYP += ((q.hyp_nee || 0) + ((q.hyp_ja || 0) - (q.hyp_nee || 0)) * t) * weightedFactor;

      if (sliderVal >= 65 && q.ko_on_ja) {
        const kos = q.ko_on_ja.split(',').map(s => s.trim());
        if (kos.includes('OP'))  koOP  = true;
        if (kos.includes('OPP')) koOPP = true;
        if (kos.includes('EUC')) koEUC = true;
        if (kos.includes('HYP')) koHYP = true;
      }
      if (sliderVal <= 35 && q.ko_on_nee) {
        const kos = q.ko_on_nee.split(',').map(s => s.trim());
        if (kos.includes('OP'))  koOP  = true;
        if (kos.includes('OPP')) koOPP = true;
        if (kos.includes('EUC')) koEUC = true;
        if (kos.includes('HYP')) koHYP = true;
      }
    });

    const finalOP = totalMaxOP > 0 ? (scoreOP / totalMaxOP) * 100 : 0;
    const finalOPP = totalMaxOPP > 0 ? (scoreOPP / totalMaxOPP) * 100 : 0;
    const finalEUC = totalMaxEUC > 0 ? (scoreEUC / totalMaxEUC) * 100 : 0;
    const finalHYP = totalMaxHYP > 0 ? (scoreHYP / totalMaxHYP) * 100 : 0;

    // Insert assessment (user_id = invite creator for traceability)
    const { rows: assessment } = await db.query(
      `INSERT INTO assessments
       (user_id, project_name, score_op, score_opp, score_euc, score_hyp, is_ko_op, is_ko_opp, is_ko_euc, is_ko_hyp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [invite.created_by, invite.project_name, finalOP, finalOPP, finalEUC, finalHYP, koOP, koOPP, koEUC, koHYP]
    );
    const assessmentId = assessment[0].id;

    for (const ans of answers) {
      if (ans.questionId && ans.value !== undefined) {
        await db.query(
          'INSERT INTO answers (assessment_id, question_id, answer_value, user_factor) VALUES ($1, $2, $3, $4)',
          [assessmentId, ans.questionId, parseFloat(ans.value), ans.factor || 1]
        );
      }
    }

    // Mark invite as used
    await db.query(
      `UPDATE assessment_invites
       SET used_at = NOW(), assessment_id = $1, respondent_name = $2, respondent_email = $3
       WHERE id = $4`,
      [assessmentId, respondentName || null, respondentEmail || null, invite.id]
    );

    res.status(201).json(assessment[0]);
  } catch (err) {
    console.error('Invite Submit Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE Revoke invite
router.delete('/invites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM assessment_invites WHERE id = $1', [id]);
    res.json({ message: 'Uitnodiging verwijderd' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST Submit audit via invite token (public — no auth required)
router.post('/invites/:token/submit-audit', async (req, res) => {
  const { token } = req.params;
  const { respondentName, respondentEmail, systemName, answers } = req.body;

  try {
    const { rows: invites } = await db.query(
      'SELECT * FROM assessment_invites WHERE token = $1',
      [token]
    );
    if (invites.length === 0) return res.status(404).json({ error: 'Ongeldige uitnodiging' });

    const invite = invites[0];
    if (invite.used_at) return res.status(410).json({ error: 'Deze uitnodiging is al gebruikt' });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Deze uitnodiging is verlopen' });
    }

    const { rows: questions } = await db.query('SELECT * FROM audit_questions ORDER BY display_order, id');

    const { rows: audit } = await db.query(
      'INSERT INTO audits (user_id, system_name) VALUES ($1, $2) RETURNING *',
      [invite.created_by, systemName || invite.project_name]
    );
    const auditId = audit[0].id;

    for (const ans of answers) {
      if (ans.questionId && ans.score !== undefined) {
        await db.query(
          'INSERT INTO audit_answers (audit_id, question_id, score) VALUES ($1, $2, $3)',
          [auditId, ans.questionId, parseInt(ans.score)]
        );
      }
    }

    const dimensionMap = {};
    questions.forEach(q => {
      const ans = answers.find(a => a.questionId === q.id);
      const score = ans ? parseInt(ans.score) : 3;
      if (!dimensionMap[q.dimensie]) dimensionMap[q.dimensie] = [];
      dimensionMap[q.dimensie].push(score);
    });

    const dimensionScores = Object.entries(dimensionMap).map(([dimensie, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { dimensie, score: Math.round(((avg - 1) / 4) * 100) };
    });

    const overallScore = Math.round(
      dimensionScores.reduce((a, b) => a + b.score, 0) / dimensionScores.length
    );

    await db.query(
      `UPDATE assessment_invites
       SET used_at = NOW(), audit_id = $1, respondent_name = $2, respondent_email = $3
       WHERE id = $4`,
      [auditId, respondentName || null, respondentEmail || null, invite.id]
    );

    res.status(201).json({ ...audit[0], dimensionScores, overallScore });
  } catch (err) {
    console.error('Invite Audit Submit Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
