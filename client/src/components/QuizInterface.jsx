import { useState, useEffect } from 'react'
import axios from 'axios'
import { Send, CheckCircle, AlertCircle, Loader } from 'lucide-react'

function QuizInterface({ qcmReady }) {
  const [qcm, setQcm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadQcm()
  }, [qcmReady])

  const loadQcm = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/qcm')
      setQcm(response.data)
    } catch (err) {
      setError('Aucun questionnaire disponible. Veuillez contacter l\'administrateur.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, optionIndex, questionType) => {
    if (questionType === 'multiple') {
      const currentAnswers = answers[questionId] || [];
      const newAnswers = currentAnswers.includes(optionIndex)
        ? currentAnswers.filter(idx => idx !== optionIndex)
        : [...currentAnswers, optionIndex];
      setAnswers({
        ...answers,
        [questionId]: newAnswers
      });
    } else {
      setAnswers({
        ...answers,
        [questionId]: optionIndex
      });
    }
  }

  const handleTextChange = (questionId, text) => {
    setAnswers({
      ...answers,
      [questionId]: text
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post('/api/submit', {
        answers
      })

      setResult(response.data)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi des réponses')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !qcm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Merci pour votre participation!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Vos réponses ont été envoyées avec succès et seront utilisées à des fins statistiques.
          </p>
          <div className="bg-indigo-50 rounded-lg p-6 mb-6">
            <p className="text-lg text-indigo-900 mb-4">
              Vos données ont été enregistrées et transmises par email.
            </p>
            <p className="text-base text-gray-700 italic">
              Je vous remercie sincèrement pour le temps consacré à ce questionnaire et pour votre contribution à cette réflexion professionnelle.
            </p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false)
              setResult(null)
              setAnswers({})
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    )
  }

  if (!qcm) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Aucun questionnaire disponible</h2>
          <p className="text-gray-600">
            {error || 'Veuillez contacter l\'administrateur pour créer un questionnaire.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Intervention post-décès de l'expert-comptable auprès des professions libérales : pratiques, difficultés et besoins</h2>
        
        <div className="mb-8 p-6 bg-blue-50 border-l-4 border-indigo-600 rounded-r-lg">
          <p className="text-gray-700 mb-4">
            Dans le cadre de mon mémoire du Diplôme d'Expertise Comptable, je mène une réflexion sur la structuration d'une mission d'intervention post-décès adaptée aux professions libérales.
          </p>
          <p className="text-gray-700 mb-4">
            Cette étude s'intéresse plus particulièrement à trois enjeux : la continuité minimale de l'activité, la sécurisation des obligations déclaratives, sociales et administratives, ainsi que la maîtrise des risques du cabinet dans un contexte souvent marqué par l'urgence, l'incertitude et une forte dimension humaine.
          </p>
          <p className="text-gray-700">
            Le présent questionnaire a pour objet de recueillir le retour d'expérience et la perception de la profession sur ce type de situation. Les réponses sont anonymes et seront exploitées uniquement dans le cadre de cette étude.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {qcm.questions.map((question, index) => (
            <div key={question.id} className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {index + 1}. {question.question}
              </h3>
              {question.type === 'multiple' && (
                <p className="text-sm text-indigo-600 font-medium mb-3">
                  ✓ Plusieurs réponses possibles
                </p>
              )}
              
              {question.type === 'text' ? (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleTextChange(question.id, e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px]"
                  placeholder="Votre réponse..."
                />
              ) : (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-indigo-50 cursor-pointer transition-colors"
                    >
                      <input
                        type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                        name={question.type === 'multiple' ? undefined : `question-${question.id}`}
                        value={optionIndex}
                        checked={
                          question.type === 'multiple'
                            ? (answers[question.id] || []).includes(optionIndex)
                            : answers[question.id] === optionIndex
                        }
                        onChange={() => handleAnswerChange(question.id, optionIndex, question.type)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Soumettre mes réponses</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default QuizInterface
