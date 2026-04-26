import { useState } from 'react'
import axios from 'axios'
import { Upload, CheckCircle, AlertCircle, FileText, BarChart3, List } from 'lucide-react'
import StatsPanel from './StatsPanel'
import QuestionnairesManager from './QuestionnairesManager'

function AdminPanel({ onQcmCreated }) {
  const [activeTab, setActiveTab] = useState('questionnaires')
  const [file, setFile] = useState(null)
  const [questionnaireName, setQuestionnaireName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier')
      return
    }
    
    if (!questionnaireName.trim()) {
      setError('Veuillez donner un nom au questionnaire')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('questionnaireName', questionnaireName)

    setUploading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessage(`Questionnaire créé avec succès! ${response.data.questionsCount} questions chargées.`)
      setFile(null)
      setQuestionnaireName('')
      setActiveTab('questionnaires')
      onQcmCreated()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('questionnaires')}
            className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'questionnaires'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <List className="w-5 h-5" />
            <span>Mes Questionnaires</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>Nouveau Questionnaire</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'stats'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques</span>
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="p-8">
          {activeTab === 'questionnaires' ? (
            <QuestionnairesManager />
          ) : activeTab === 'upload' ? (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-10 h-10 text-indigo-600" />
                <h2 className="text-3xl font-bold text-gray-900">Upload du Questionnaire</h2>
              </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Format du fichier Word:</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Votre fichier Word doit suivre ce format:</p>
            <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
{`1. Quelle est votre fonction?
• Expert-comptable
• Collaborateur
• Autre

2. Quelles difficultés rencontrez-vous? (plusieurs réponses possibles)
• Manque de temps
• Manque de formation
• Coordination difficile

3. Vos suggestions?
Réponse libre`}
            </pre>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Types de questions supportés:</strong><br/>
              • Choix unique (•, -, a), b), etc.)<br/>
              • Choix multiple (indiquer "plusieurs réponses possibles")<br/>
              • Texte libre (indiquer "Réponse libre" ou laisser sans options)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du questionnaire
            </label>
            <input
              type="text"
              value={questionnaireName}
              onChange={(e) => setQuestionnaireName(e.target.value)}
              placeholder="Ex: Enquête satisfaction 2026"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un fichier Word (.docx)
            </label>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                cursor-pointer"
            />
          </div>

          {file && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>{uploading ? 'Upload en cours...' : 'Créer le questionnaire'}</span>
          </button>

          {message && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
            </div>
          ) : (
            <StatsPanel />
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
