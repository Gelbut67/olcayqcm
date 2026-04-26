import { useState, useEffect } from 'react'
import axios from 'axios'
import { List, CheckCircle, Trash2, Power, AlertCircle, Loader, Calendar, FileText } from 'lucide-react'

function QuestionnairesManager() {
  const [questionnaires, setQuestionnaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    loadQuestionnaires()
  }, [])

  const loadQuestionnaires = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/questionnaires')
      setQuestionnaires(response.data.questionnaires)
      setActiveId(response.data.activeId)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (id) => {
    try {
      await axios.post(`/api/questionnaires/${id}/activate`)
      loadQuestionnaires()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'activation')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce questionnaire et toutes ses réponses ?')) {
      return
    }
    
    try {
      await axios.delete(`/api/questionnaires/${id}`)
      loadQuestionnaires()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 text-red-600 p-4 bg-red-50 rounded-lg">
        <AlertCircle className="w-6 h-6" />
        <p>{error}</p>
      </div>
    )
  }

  if (questionnaires.length === 0) {
    return (
      <div className="text-center py-12">
        <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun questionnaire</h3>
        <p className="text-gray-600">Créez votre premier questionnaire dans l'onglet "Upload"</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <List className="w-10 h-10 text-indigo-600" />
        <h2 className="text-3xl font-bold text-gray-900">Mes Questionnaires</h2>
      </div>

      <div className="space-y-4">
        {questionnaires.map((q) => (
          <div
            key={q.id}
            className={`border rounded-lg p-6 transition-all ${
              q.isActive
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 bg-white hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{q.name}</h3>
                  {q.isActive && (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      <span>Actif</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(q.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{q.questionsCount} questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <List className="w-4 h-4" />
                    <span>{q.responsesCount} réponses</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!q.isActive && (
                  <button
                    onClick={() => handleActivate(q.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Activer ce questionnaire"
                  >
                    <Power className="w-4 h-4" />
                    <span>Activer</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(q.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer ce questionnaire"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Le questionnaire actif est celui qui est visible par les utilisateurs. 
          Vous pouvez activer un autre questionnaire à tout moment.
        </p>
      </div>
    </div>
  )
}

export default QuestionnairesManager
