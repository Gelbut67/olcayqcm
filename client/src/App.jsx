import { useState } from 'react'
import AdminPanel from './components/AdminPanel'
import QuizInterface from './components/QuizInterface'
import { FileText } from 'lucide-react'

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [qcmReady, setQcmReady] = useState(false)

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
              onClick={() => setIsAdmin(!isAdmin)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isAdmin ? 'Mode Utilisateur' : 'Mode Admin'}
            </button>
          </div>
        </div>
      </nav>

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
