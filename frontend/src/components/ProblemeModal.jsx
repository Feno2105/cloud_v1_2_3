import { useState, useEffect } from 'react';
import { problemeService, signalementService, entrepriseService, statusService } from '../services/api';
import PhotoGalleryModal from './PhotoGalleryModal'
import './ProblemeModal.css';

function ProblemeModal({ probleme, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    Id_status: '',
    surface: '',
    Id_entreprise: ''
  });
  const [entreprises, setEntreprises] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => {
    if (probleme) {
      setFormData({
        Id_status: probleme.Id_status || '',
        surface: probleme.surface ?? probleme.surface_m2 ?? '',
        Id_entreprise: probleme.Id_entreprise || ''
      });
      loadEntreprises();
      loadStatuses();
    }
  }, [probleme]);

  const loadEntreprises = async () => {
    try {
      const data = await entrepriseService.getAll();
      setEntreprises(data);
    } catch (error) {
      console.error('❌ Erreur chargement entreprises:', error);
    }
  };

  const loadStatuses = async () => {
    try {
      const data = await statusService.getAll();
      setStatuses(data);
    } catch (error) {
      console.error('❌ Erreur chargement status:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Préparer les données à envoyer (uniquement les champs modifiés)
      const updateData = {};
      if (formData.surface) updateData.surface = parseFloat(formData.surface);
      if (formData.Id_entreprise) updateData.Id_entreprise = parseInt(formData.Id_entreprise);

      await problemeService.update(probleme.Id_probleme, updateData);

      if (formData.Id_status && probleme.Id_signalement) {
        await signalementService.update(probleme.Id_signalement, {
          Id_status: parseInt(formData.Id_status)
        });
      }
      
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (!probleme) return null;

  const photos = Array.isArray(probleme.photos) ? probleme.photos : []

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2> Détails du Problème Routier</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="probleme-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <h3>📍 Localisation</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Latitude:</strong>
                <span>{probleme.latitude ?? '-'}</span>
              </div>
              <div className="info-item">
                <strong>Longitude:</strong>
                <span>{probleme.longitude ?? '-'}</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>🖼️ Photos</h3>
            {photos.length ? (
              <div className="photo-inline">
                <button type="button" className="btn-secondary" onClick={() => setShowPhotos(true)}>
                  Voir les photos ({photos.length})
                </button>
              </div>
            ) : (
              <p className="muted">Aucune photo disponible.</p>
            )}
          </div>

          <div className="form-section">
            <h3>⚙️ Informations</h3>
            
            <div className="form-group">
              <label htmlFor="Id_status">Status *</label>
              <select
                id="Id_status"
                name="Id_status"
                value={formData.Id_status}
                onChange={handleChange}
                required
              >
                <option value="">-- Sélectionner un status --</option>
                {statuses.map(status => (
                  <option key={status.Id_status} value={status.Id_status}>
                    {status.libelle}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Budget (MGA)</label>
              <input
                type="number"
                value={probleme.budget ?? ''}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="surface">Surface (m²)</label>
              <input
                type="number"
                id="surface"
                name="surface"
                value={formData.surface}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Ex: 25.50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="Id_entreprise">Entreprise</label>
              <select
                id="Id_entreprise"
                name="Id_entreprise"
                value={formData.Id_entreprise}
                onChange={handleChange}
              >
                <option value="">Aucune entreprise</option>
                {entreprises.map(entreprise => (
                  <option key={entreprise.Id_entreprise} value={entreprise.Id_entreprise}>
                    {entreprise.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>📅 Dates</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Créé le:</strong>
                <span>{probleme.created_at ? new Date(probleme.created_at).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
              <div className="info-item">
                <strong>Modifié le:</strong>
                <span>{probleme.updated_at ? new Date(probleme.updated_at).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
      {showPhotos && (
        <PhotoGalleryModal
          photos={photos}
          onClose={() => setShowPhotos(false)}
        />
      )}
    </div>
  );
}

export default ProblemeModal;
