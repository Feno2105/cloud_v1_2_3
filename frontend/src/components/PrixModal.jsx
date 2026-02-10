import { useEffect, useState } from 'react'
import { prixService } from '../services/api'
import './PrixModal.css'

function PrixModal({ onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    valeur: '',
    date_fin: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrix()
  }, [])

  const loadPrix = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await prixService.getAll()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('❌ Erreur chargement prix:', err)
      setError('Impossible de charger les prix')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        valeur: parseFloat(formData.valeur),
        date_fin: formData.date_fin ? `${formData.date_fin} 23:59:59` : null
      }
      await prixService.create(payload)
      setFormData({ valeur: '', date_fin: '' })
      await loadPrix()
    } catch (err) {
      console.error('❌ Erreur création prix:', err)
      setError(err.response?.data?.message || 'Erreur lors de la création du prix')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content prix-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestion des prix</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="prix-content">
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form className="prix-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Prix au m² (MGA)</label>
              <input
                type="number"
                name="valeur"
                value={formData.valeur}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label>Date fin</label>
              <input
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>

          <div className="prix-list">
            <div className="prix-list-header">
              <h3>Historique des prix</h3>
              <button type="button" className="btn-secondary" onClick={loadPrix} disabled={loading}>
                Actualiser
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Chargement des prix...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">💸</span>
                <p>Aucun prix enregistré</p>
              </div>
            ) : (
              <table className="prix-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Valeur (MGA)</th>
                    <th>Date fin</th>
                    <th>Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.Id_prix ?? item.id}>
                      <td>#{item.Id_prix ?? item.id}</td>
                      <td>{Number(item.valeur || 0).toLocaleString('fr-FR')}</td>
                      <td>{item.date_fin ? new Date(item.date_fin).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>{item.create_at ? new Date(item.create_at).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrixModal
