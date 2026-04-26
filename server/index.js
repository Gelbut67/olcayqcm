const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const QUESTIONNAIRES_FILE = path.join(__dirname, 'questionnaires-data.json');

// Structure: { questionnaires: [{id, name, active, createdAt, qcm, responses}], activeId }
let questionnairesData = {
  questionnaires: [],
  activeId: null
};

// Charger tous les questionnaires au démarrage
if (fs.existsSync(QUESTIONNAIRES_FILE)) {
  try {
    const data = fs.readFileSync(QUESTIONNAIRES_FILE, 'utf8');
    questionnairesData = JSON.parse(data);
    console.log(`${questionnairesData.questionnaires.length} questionnaire(s) chargé(s)`);
    if (questionnairesData.activeId) {
      console.log(`Questionnaire actif: ${questionnairesData.activeId}`);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des questionnaires:', error);
  }
}

// Fonction pour sauvegarder les questionnaires
function saveQuestionnaires() {
  try {
    fs.writeFileSync(QUESTIONNAIRES_FILE, JSON.stringify(questionnairesData, null, 2));
    console.log('Questionnaires sauvegardés');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
  }
}

// Fonction pour obtenir le questionnaire actif
function getActiveQuestionnaire() {
  if (!questionnairesData.activeId) return null;
  return questionnairesData.questionnaires.find(q => q.id === questionnairesData.activeId);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Word sont acceptés!'), false);
    }
  }
});

function parseWordToQCM(text) {
  console.log('=== DEBUT DU PARSING ===');
  console.log('Texte brut longueur:', text.length);
  const lines = text.split('\n').filter(line => line.trim() !== '');
  console.log('Nombre de lignes:', lines.length);
  const questions = [];
  let currentQuestion = null;

  for (let line of lines) {
    const originalLine = line;
    line = line.trim();
    
    if (line.length > 0) {
      console.log('Ligne:', JSON.stringify(line.substring(0, 100)));
    
    if (line.match(/^\d+[\.\)]/)) {
      if (currentQuestion) {
        if (currentQuestion.options.length === 0) {
          currentQuestion.type = 'text';
        }
        console.log('Question complète:', currentQuestion.question, '- Options:', currentQuestion.options.length, '- Type:', currentQuestion.type);
        questions.push(currentQuestion);
      }
      
      const questionText = line.replace(/^\d+[\.\)]/, '').trim();
      const isMultiple = questionText.toLowerCase().includes('plusieurs réponses') || 
                        questionText.toLowerCase().includes('plusieurs choix') ||
                        questionText.toLowerCase().includes('(plusieurs');
      
      currentQuestion = {
        id: questions.length + 1,
        question: questionText,
        options: [],
        type: isMultiple ? 'multiple' : 'single'
      };
      console.log('Nouvelle question détectée:', questionText.substring(0, 50));
    }
    else if (line.toLowerCase().includes('plusieurs réponses') || 
             line.toLowerCase().includes('plusieurs choix') ||
             line.toLowerCase().includes('(plusieurs')) {
      if (currentQuestion && currentQuestion.type === 'single') {
        currentQuestion.type = 'multiple';
        console.log('Question convertie en choix multiple');
      }
    }
    else if (currentQuestion && 
             !line.match(/^\d+[\.\)]/) && 
             !line.toLowerCase().includes('réponse') &&
             !line.toLowerCase().includes('questionnaire') &&
             !line.toLowerCase().includes('merci') &&
             !line.toLowerCase().includes('intervention') &&
             !line.toLowerCase().includes('texte d\'introduction') &&
             line.length > 3 &&
             line.length < 200) {
      
      const optionText = line
        .replace(/^[•\-\*·○●][\s\t]+/, '')
        .replace(/^[a-z][\.\)][\s\t]+/i, '')
        .trim();
      
      if (optionText.length > 0 && 
          !optionText.match(/^\d+[\.\)]/) &&
          !optionText.toLowerCase().startsWith('(plusieurs')) {
        console.log('Option ajoutée:', optionText);
        currentQuestion.options.push(optionText);
      }
    }
    else if (line.toLowerCase().includes('réponse libre') || line.toLowerCase().includes('texte libre')) {
      if (currentQuestion) {
        currentQuestion.type = 'text';
      }
    }
  }
  }
  
  if (currentQuestion) {
    if (currentQuestion.options.length === 0) {
      currentQuestion.type = 'text';
    }
    console.log('Dernière question:', currentQuestion.question, '- Options:', currentQuestion.options.length);
    questions.push(currentQuestion);
  }

  console.log('=== FIN DU PARSING ===');
  console.log('Total questions:', questions.length);
  questions.forEach((q, i) => {
    console.log(`Q${i+1}: ${q.options.length} options, type: ${q.type}`);
  });

  return {
    title: 'Questionnaire',
    questions: questions
  };
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const { questionnaireName } = req.body;
    if (!questionnaireName || questionnaireName.trim() === '') {
      return res.status(400).json({ error: 'Le nom du questionnaire est requis' });
    }

    const result = await mammoth.extractRawText({ path: req.file.path });
    const qcm = parseWordToQCM(result.value);
    
    // Créer un nouveau questionnaire
    const newQuestionnaire = {
      id: Date.now().toString(),
      name: questionnaireName.trim(),
      createdAt: new Date().toISOString(),
      qcm: qcm,
      responses: []
    };

    // Ajouter le questionnaire à la liste
    questionnairesData.questionnaires.push(newQuestionnaire);
    
    // Définir comme actif
    questionnairesData.activeId = newQuestionnaire.id;
    
    // Sauvegarder
    saveQuestionnaires();

    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: 'Questionnaire créé avec succès',
      questionsCount: qcm.questions.length,
      questionnaireId: newQuestionnaire.id
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du fichier' });
  }
});

app.get('/api/qcm', (req, res) => {
  const activeQ = getActiveQuestionnaire();
  if (!activeQ) {
    return res.status(404).json({ error: 'Aucun questionnaire disponible' });
  }

  const qcmForUser = {
    title: activeQ.qcm.title,
    questions: activeQ.qcm.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      type: q.type
    }))
  };

  res.json(qcmForUser);
});

app.get('/api/stats', (req, res) => {
  const { questionnaireId } = req.query;
  
  let questionnaire;
  if (questionnaireId) {
    questionnaire = questionnairesData.questionnaires.find(q => q.id === questionnaireId);
  } else {
    questionnaire = getActiveQuestionnaire();
  }
  
  if (!questionnaire) {
    return res.status(404).json({ error: 'Aucun questionnaire disponible' });
  }

  const responses = questionnaire.responses || [];

  // Calculer les statistiques pour chaque question
  const stats = questionnaire.qcm.questions.map(question => {
    const questionStats = {
      id: question.id,
      question: question.question,
      type: question.type,
      totalResponses: responses.length,
      optionCounts: {}
    };

    if (question.type === 'text') {
      // Pour les questions texte, on liste toutes les réponses
      questionStats.textResponses = responses.map(r => {
        const answer = r.answers[question.id];
        return answer || 'Non répondu';
      });
    } else {
      // Pour les questions à choix, compter les réponses par option
      question.options.forEach((option, index) => {
        questionStats.optionCounts[index] = 0;
      });

      responses.forEach(response => {
        const answer = response.answers[question.id];
        if (answer !== undefined && answer !== null) {
          if (question.type === 'multiple' && Array.isArray(answer)) {
            // Choix multiple
            answer.forEach(idx => {
              if (questionStats.optionCounts[idx] !== undefined) {
                questionStats.optionCounts[idx]++;
              }
            });
          } else if (question.type === 'single') {
            // Choix unique
            if (questionStats.optionCounts[answer] !== undefined) {
              questionStats.optionCounts[answer]++;
            }
          }
        }
      });

      // Convertir en tableau avec les noms des options
      questionStats.options = question.options.map((option, index) => ({
        text: option,
        count: questionStats.optionCounts[index] || 0,
        percentage: responses.length > 0 
          ? ((questionStats.optionCounts[index] || 0) / responses.length * 100).toFixed(1)
          : 0
      }));
    }

    return questionStats;
  });

  res.json({
    totalResponses: responses.length,
    questions: stats
  });
});

app.post('/api/submit', async (req, res) => {
  try {
    const { answers } = req.body;

    const activeQ = getActiveQuestionnaire();
    if (!activeQ) {
      return res.status(404).json({ error: 'Aucun questionnaire disponible' });
    }

    const results = activeQ.qcm.questions.map(q => {
      const userAnswer = answers[q.id];
      let formattedAnswer = 'Non répondu';
      
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
        if (q.type === 'text') {
          formattedAnswer = userAnswer;
        } else if (q.type === 'multiple') {
          if (Array.isArray(userAnswer) && userAnswer.length > 0) {
            formattedAnswer = userAnswer.map(idx => q.options[idx]).join(', ');
          }
        } else {
          formattedAnswer = q.options[userAnswer];
        }
      }
      
      return {
        question: q.question,
        userAnswer: formattedAnswer
      };
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const responseId = Date.now();
    
    // Sauvegarder la réponse dans le fichier
    const responseData = {
      id: responseId,
      timestamp: new Date().toISOString(),
      answers: answers,
      results: results
    };
    
    // Ajouter la réponse au questionnaire actif
    activeQ.responses.push(responseData);
    
    // Sauvegarder tous les questionnaires
    saveQuestionnaires();
    
    const emailContent = `
      <h2>Nouvelle réponse au questionnaire</h2>
      <p><strong>Réponse #:</strong> ${responseId}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <hr>
      <h3>Réponses:</h3>
      ${results.map((r, i) => `
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #4f46e5; border-radius: 5px;">
          <p style="margin: 0 0 10px 0;"><strong>Question ${i + 1}:</strong> ${r.question}</p>
          <p style="margin: 0; color: #4f46e5; font-weight: 500;"><strong>Réponse:</strong> ${r.userAnswer}</p>
        </div>
      `).join('')}
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `Réponse questionnaire #${responseId}`,
      html: emailContent
    });

    res.json({ 
      success: true, 
      message: 'Réponses envoyées avec succès'
    });
  } catch (error) {
    console.error('Erreur complète:', error);
    console.error('Message d\'erreur:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi des réponses',
      details: error.message 
    });
  }
});

// Lister tous les questionnaires
app.get('/api/questionnaires', (req, res) => {
  const questionnaires = questionnairesData.questionnaires.map(q => ({
    id: q.id,
    name: q.name,
    createdAt: q.createdAt,
    questionsCount: q.qcm.questions.length,
    responsesCount: q.responses.length,
    isActive: q.id === questionnairesData.activeId
  }));
  
  res.json({
    questionnaires,
    activeId: questionnairesData.activeId
  });
});

// Activer un questionnaire
app.post('/api/questionnaires/:id/activate', (req, res) => {
  const { id } = req.params;
  const questionnaire = questionnairesData.questionnaires.find(q => q.id === id);
  
  if (!questionnaire) {
    return res.status(404).json({ error: 'Questionnaire non trouvé' });
  }
  
  questionnairesData.activeId = id;
  saveQuestionnaires();
  
  res.json({ success: true, message: 'Questionnaire activé' });
});

// Supprimer un questionnaire
app.delete('/api/questionnaires/:id', (req, res) => {
  const { id } = req.params;
  const index = questionnairesData.questionnaires.findIndex(q => q.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Questionnaire non trouvé' });
  }
  
  // Si c'est le questionnaire actif, le désactiver
  if (questionnairesData.activeId === id) {
    questionnairesData.activeId = null;
  }
  
  questionnairesData.questionnaires.splice(index, 1);
  saveQuestionnaires();
  
  res.json({ success: true, message: 'Questionnaire supprimé' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
