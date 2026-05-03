const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Déterminer si on utilise PostgreSQL (production) ou JSON (local)
const USE_POSTGRES = !!process.env.DATABASE_URL;

let pool = null;
let questionnairesData = { questionnaires: [], activeId: null };
const JSON_FILE = path.join(__dirname, 'questionnaires-data.json');
let dbReady = false;

// Fonction d'initialisation asynchrone
async function initDatabase() {
  if (USE_POSTGRES) {
    console.log('🐘 Utilisation de PostgreSQL');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    // Créer les tables et attendre
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS questionnaires (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL,
          qcm_data JSONB NOT NULL,
          is_active BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS responses (
          id TEXT PRIMARY KEY,
          questionnaire_id TEXT NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
          timestamp TIMESTAMP NOT NULL,
          answers_data JSONB NOT NULL,
          results_data JSONB NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_active ON questionnaires(is_active);
        CREATE INDEX IF NOT EXISTS idx_responses_qid ON responses(questionnaire_id);
      `);
      console.log('✅ Tables PostgreSQL créées');
      dbReady = true;
    } catch (err) {
      console.error('❌ Erreur création tables:', err);
      throw err;
    }
  } else {
    console.log('📁 Utilisation de fichiers JSON locaux');
    // Charger les données JSON
    if (fs.existsSync(JSON_FILE)) {
      try {
        questionnairesData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        console.log(`✅ ${questionnairesData.questionnaires.length} questionnaire(s) chargé(s)`);
      } catch (error) {
        console.error('❌ Erreur chargement JSON:', error);
      }
    }
    dbReady = true;
  }
}

// Initialiser la base de données
initDatabase().catch(err => {
  console.error('❌ Erreur fatale initialisation DB:', err);
  process.exit(1);
});

// Fonction pour sauvegarder en JSON
function saveJSON() {
  if (!USE_POSTGRES) {
    fs.writeFileSync(JSON_FILE, JSON.stringify(questionnairesData, null, 2));
  }
}

// Fonction pour attendre que la DB soit prête
async function ensureDbReady() {
  let attempts = 0;
  while (!dbReady && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  if (!dbReady) {
    throw new Error('Base de données non initialisée');
  }
}

// API unifiée
const db = {
  // Créer un questionnaire
  async createQuestionnaire(id, name, qcm) {
    await ensureDbReady();
    if (USE_POSTGRES) {
      await pool.query('UPDATE questionnaires SET is_active = FALSE');
      await pool.query(
        'INSERT INTO questionnaires (id, name, created_at, qcm_data, is_active) VALUES ($1, $2, NOW(), $3, TRUE)',
        [id, name, JSON.stringify(qcm)]
      );
    } else {
      questionnairesData.questionnaires.forEach(q => q.isActive = false);
      questionnairesData.questionnaires.push({
        id,
        name,
        createdAt: new Date().toISOString(),
        qcm,
        responses: [],
        isActive: true
      });
      questionnairesData.activeId = id;
      saveJSON();
    }
  },

  // Récupérer tous les questionnaires
  async getAllQuestionnaires() {
    if (USE_POSTGRES) {
      const result = await pool.query(`
        SELECT 
          q.id, q.name, q.created_at as "createdAt", q.qcm_data as qcm, q.is_active as "isActive",
          COUNT(r.id) as "responsesCount"
        FROM questionnaires q
        LEFT JOIN responses r ON q.id = r.questionnaire_id
        GROUP BY q.id
        ORDER BY q.created_at DESC
      `);
      return result.rows.map(row => ({
        ...row,
        responsesCount: parseInt(row.responsesCount)
      }));
    } else {
      return questionnairesData.questionnaires.map(q => ({
        id: q.id,
        name: q.name,
        createdAt: q.createdAt,
        qcm: q.qcm,
        isActive: q.isActive || q.id === questionnairesData.activeId,
        responsesCount: (q.responses || []).length
      }));
    }
  },

  // Récupérer le questionnaire actif
  async getActiveQuestionnaire() {
    await ensureDbReady();
    if (USE_POSTGRES) {
      const qResult = await pool.query(
        'SELECT id, name, created_at as "createdAt", qcm_data as qcm FROM questionnaires WHERE is_active = TRUE LIMIT 1'
      );
      if (qResult.rows.length === 0) return null;
      
      const q = qResult.rows[0];
      const rResult = await pool.query(
        'SELECT id, timestamp, answers_data as answers, results_data as results FROM responses WHERE questionnaire_id = $1 ORDER BY timestamp DESC',
        [q.id]
      );
      
      return { ...q, id: q.id, responses: rResult.rows };
    } else {
      const activeQ = questionnairesData.questionnaires.find(
        q => q.isActive || q.id === questionnairesData.activeId
      );
      return activeQ || null;
    }
  },

  // Récupérer un questionnaire par ID
  async getQuestionnaireById(id) {
    if (USE_POSTGRES) {
      const qResult = await pool.query(
        'SELECT id, name, created_at as "createdAt", qcm_data as qcm FROM questionnaires WHERE id = $1',
        [id]
      );
      if (qResult.rows.length === 0) return null;
      
      const q = qResult.rows[0];
      const rResult = await pool.query(
        'SELECT id, timestamp, answers_data as answers, results_data as results FROM responses WHERE questionnaire_id = $1 ORDER BY timestamp DESC',
        [id]
      );
      
      return { ...q, responses: rResult.rows };
    } else {
      const q = questionnairesData.questionnaires.find(q => q.id === id);
      return q || null;
    }
  },

  // Activer un questionnaire
  async activateQuestionnaire(id) {
    await ensureDbReady();
    if (USE_POSTGRES) {
      await pool.query('UPDATE questionnaires SET is_active = FALSE');
      const result = await pool.query('UPDATE questionnaires SET is_active = TRUE WHERE id = $1', [id]);
      return result.rowCount > 0;
    } else {
      questionnairesData.questionnaires.forEach(q => q.isActive = false);
      const q = questionnairesData.questionnaires.find(q => q.id === id);
      if (q) {
        q.isActive = true;
        questionnairesData.activeId = id;
        saveJSON();
        return true;
      }
      return false;
    }
  },

  // Supprimer un questionnaire
  async deleteQuestionnaire(id) {
    if (USE_POSTGRES) {
      const result = await pool.query('DELETE FROM questionnaires WHERE id = $1', [id]);
      return result.rowCount > 0;
    } else {
      const index = questionnairesData.questionnaires.findIndex(q => q.id === id);
      if (index !== -1) {
        questionnairesData.questionnaires.splice(index, 1);
        if (questionnairesData.activeId === id) {
          questionnairesData.activeId = null;
        }
        saveJSON();
        return true;
      }
      return false;
    }
  },

  // Ajouter une réponse
  async createResponse(id, questionnaireId, answers, results) {
    await ensureDbReady();
    if (USE_POSTGRES) {
      await pool.query(
        'INSERT INTO responses (id, questionnaire_id, timestamp, answers_data, results_data) VALUES ($1, $2, NOW(), $3, $4)',
        [id, questionnaireId, JSON.stringify(answers), JSON.stringify(results)]
      );
    } else {
      const q = questionnairesData.questionnaires.find(q => q.id === questionnaireId);
      if (q) {
        if (!q.responses) q.responses = [];
        q.responses.push({
          id,
          timestamp: new Date().toISOString(),
          answers,
          results
        });
        saveJSON();
      }
    }
  }
};

module.exports = db;
