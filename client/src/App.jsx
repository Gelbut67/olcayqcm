import { useState } from 'react'
import AdminPanel from './components/AdminPanel'
import QuizInterface from './components/QuizInterface'
import { FileText, Lock } from 'lucide-react'

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [qcmReady, setQcmReady] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const ADMIN_PASSWORD = 'adminolcay2026'
  
  const handleAdminAccess = () => {
    if (isAdmin) {
      setIsAdmin(false)
      setShowPasswordPrompt(false)
      setPassword('')
      setPasswordError('')
    } else {
      setShowPasswordPrompt(true)
    }
  }
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setShowPasswordPrompt(false)
      setPassword('')
      setPasswordError('')
    } else {
      setPasswordError('Mot de passe incorrect')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Questionnaire Statistique</h1>
                <p className="text-sm text-gray-600">Olcay YASAR</p>
              </div>
            </div>
            <button
              onClick={handleAdminAccess}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isAdmin && <Lock className="w-4 h-4" />}
              <span>{isAdmin ? 'Mode Utilisateur' : 'Mode Admin'}</span>
            </button>
          </div>
        </div>
      </nav>

      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-8 h-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Accès Administrateur</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Entrez le mot de passe"
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Valider
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordPrompt(false)
                    setPassword('')
                    setPasswordError('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAdmin ? (
          <AdminPanel onQcmCreated={() => setQcmReady(true)} />
        ) : (
          <QuizInterface qcmReady={qcmReady} />
        )}
      </main>

      <footer className="bg-white mt-12 py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2026 Questionnaire Olcay YASAR</p>
        </div>
      </footer>
    </div>
  )
}

export default App
