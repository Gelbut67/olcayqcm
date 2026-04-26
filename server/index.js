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

const QCM_FILE = path.join(__dirname, 'qcm-data.json');

// Charger le questionnaire sauvegardé au démarrage
let currentQCM = null;
if (fs.existsSync(QCM_FILE)) {
  try {
    const data = fs.readFileSync(QCM_FILE, 'utf8');
    currentQCM = JSON.parse(data);
    console.log('Questionnaire chargé depuis le fichier');
  } catch (error) {
    console.error('Erreur lors du chargement du questionnaire:', error);
  }
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

    const result = await mammoth.extractRawText({ path: req.file.path });
    const qcm = parseWordToQCM(result.value);
    
    currentQCM = qcm;

    // Sauvegarder le questionnaire dans un fichier
    try {
      fs.writeFileSync(QCM_FILE, JSON.stringify(qcm, null, 2));
      console.log('Questionnaire sauvegardé dans le fichier');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }

    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      message: 'Fichier uploadé et traité avec succès',
      questionsCount: qcm.questions.length
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du fichier' });
  }
});

app.get('/api/qcm', (req, res) => {
  if (!currentQCM) {
    return res.status(404).json({ error: 'Aucun questionnaire disponible' });
  }

  const qcmForUser = {
    title: currentQCM.title,
    questions: currentQCM.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      type: q.type
    }))
  };

  res.json(qcmForUser);
});

app.post('/api/submit', async (req, res) => {
  try {
    const { answers } = req.body;

    if (!currentQCM) {
      return res.status(404).json({ error: 'Aucun questionnaire disponible' });
    }

    const results = currentQCM.questions.map(q => {
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
