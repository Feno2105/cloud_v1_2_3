import { useEffect, useMemo, useState } from 'react'
import { historiqueAvancementService } from '../services/api'
import './HistoriqueAvancementModal.css'

const normalizeLabel = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

function HistoriqueAvancementModal({ onClose }) {
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterSignalement, setFilterSignalement] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchHistorique()
  }, [])

  const fetchHistorique = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await historiqueAvancementService.getAll()
      setHistorique(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('❌ Erreur chargement historique:', err)
      setError('Impossible de charger l\'historique')
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = useMemo(() => {
    const unique = new Set(
      historique
        .map((item) => normalizeLabel(item?.nouveau_status))
        .filter(Boolean)
    )
    return ['ALL', ...Array.from(unique)]
  }, [historique])

  const filteredHistorique = useMemo(() => {
    return historique.filter((item) => {
      const statusLabel = normalizeLabel(item?.nouveau_status)
      const statusOk = filterStatus === 'ALL' || statusLabel === filterStatus
      const signalementId = String(item?.Id_signalement ?? '')
      const signalementOk = !filterSignalement || signalementId.includes(filterSignalement.trim())
      const searchOk = !searchText ||
        `${item?.nouveau_status ?? ''} ${signalementId}`
          .toLowerCase()
          .includes(searchText.toLowerCase())
      const dateValue = item?.create_at ? new Date(item.create_at) : null
      const fromOk = !dateFrom || (dateValue && dateValue >= new Date(dateFrom))
      const toOk = !dateTo || (dateValue && dateValue <= new Date(dateTo))
      return statusOk && signalementOk && searchOk && fromOk && toOk
    })
  }, [historique, filterStatus, filterSignalement, searchText, dateFrom, dateTo])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content historique-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Historique d'avancement</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="historique-filters">
          <div className="filter-item">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <label>ID Signalement</label>
            <input
              type="text"
              placeholder="#"
              value={filterSignalement}
              onChange={(e) => setFilterSignalement(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="statut, id..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <label>Date début</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Date fin</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="historique-content">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Chargement de l'historique...</p>
            </div>
          ) : filteredHistorique.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🕘</span>
              <p>Aucun historique trouvé</p>
            </div>
          ) : (
            <div className="historique-table-wrapper">
              <table className="historique-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Signalement</th>
                    <th>Nouveau statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistorique.map((item) => (
                    <tr key={item.Id_historique_avancement}>
                      <td>#{item.Id_historique_avancement}</td>
                      <td>#{item.Id_signalement}</td>
                      <td>{item.nouveau_status}</td>
                      <td>
                        {item.create_at
                          ? new Date(item.create_at).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Fermer
          </button>
          <button className="btn-primary" onClick={fetchHistorique}>
            🔄 Actualiser
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistoriqueAvancementModal
