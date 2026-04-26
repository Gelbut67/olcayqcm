import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart3, Users, AlertCircle, Loader } from 'lucide-react'

function StatsPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/stats')
      setStats(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Erreur</h2>
          </div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats || stats.totalResponses === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune réponse</h2>
          <p className="text-gray-600">Le questionnaire n'a pas encore reçu de réponses.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-10 h-10 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">Statistiques du Questionnaire</h2>
          </div>
          <div className="bg-indigo-100 px-6 py-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-900">{stats.totalResponses}</span>
              <span className="text-gray-600">réponse{stats.totalResponses > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {stats.questions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 pb-8 last:border-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {index + 1}. {question.question}
              </h3>

              {question.type === 'text' ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Réponses textuelles ({question.textResponses.length}):
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {question.textResponses.map((response, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-700">{response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {question.options.map((option, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{option.text}</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {option.count} ({option.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${option.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={loadStats}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Actualiser les statistiques
          </button>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel
