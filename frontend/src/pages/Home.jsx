import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problemeViewService, signalementService } from '../services/api';
import PhotoGalleryModal from '../components/PhotoGalleryModal'
import Map from '../components/Map';
import './Home.css';

function Home() {
  const [problemes, setProblemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signalements, setSignalements] = useState([]);
  const [photoModalState, setPhotoModalState] = useState({ open: false, photos: [] });

  // Coordonnées d'Antananarivo (centre-ville)
  const antananarivoCenter = [-18.8792, 47.5079];
  
  useEffect(() => {
    loadProblemes();
  }, []);

  const loadProblemes = async () => {
    try {
      setLoading(true);
      const [problemePayload, signalementPayload] = await Promise.all([
        problemeViewService.getAllWithDetails(),
        signalementService.getAll()
      ])
      setProblemes(problemePayload?.problemes ?? [])
      setSignalements(signalementPayload ?? [])
    } catch (error) {
      console.error('❌ Erreur chargement problèmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const parsePositionString = (raw) => {
    if (!raw || typeof raw !== 'string') return { lat: null, lng: null }
    const [latRaw, lngRaw] = raw.split(',')
    const lat = latRaw ? parseFloat(latRaw.trim()) : null
    const lng = lngRaw ? parseFloat(lngRaw.trim()) : null
    return {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null
    }
  }

  const openPhotoModalFromMarker = (data) => {
    if (!data) return
    const photos = Array.isArray(data.photos) ? data.photos : []
    if (photos.length) {
      setPhotoModalState({ open: true, photos })
    }
  }
  
  // Transformation des problèmes en marqueurs pour visiteurs (lecture seule)
  const problemMarkers = problemes
    .filter(prob => Number.isFinite(parseFloat(prob.latitude)) && Number.isFinite(parseFloat(prob.longitude)))
    .map(prob => ({
      position: [parseFloat(prob.latitude), parseFloat(prob.longitude)],
      data: prob,
      tooltip: `<div class="map-tooltip">${prob.status}</div>`,
      tooltipPermanent: true,
      popup: `
        <div class="map-popup">
          <h4>Problème Routier</h4>
          <hr class="divider" />
          <div><strong>Status:</strong> ${prob.status}</div>
          ${prob.surface_m2 ? `<div><strong>Surface:</strong> ${prob.surface_m2} m²</div>` : ''}
          ${prob.budget ? `<div><strong>Budget:</strong> ${new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'MGA', minimumFractionDigits: 0}).format(prob.budget)}</div>` : ''}
          ${prob.date_signalement ? `<div><strong>Date:</strong> ${new Date(prob.date_signalement).toLocaleDateString('fr-FR')}</div>` : ''}
          ${prob.commentaire ? `<div><strong>Commentaire:</strong> ${prob.commentaire}</div>` : ''}
          <hr class="divider" />
          <div class="muted">👁️ Mode lecture seule</div>
        </div>
      `
    }));

  const assignedSignalements = new Set(
    problemes
      .map((item) => item?.Id_signalement)
      .filter(Boolean)
  )

  const signalementMarkers = signalements
    .filter((signalement) => !assignedSignalements.has(signalement?.Id_signalement))
    .filter((signalement) => !!signalement?.position_)
    .map((signalement) => {
      const { lat, lng } = parsePositionString(signalement.position_)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return {
        position: [lat, lng],
        data: {
          ...signalement,
          type: 'signalement'
        },
        tooltip: `<div class="map-tooltip">Signalement</div>`,
        tooltipPermanent: true,
        popup: `
          <div class="map-popup">
            <h4>Signalement</h4>
            <hr class="divider" />
            <div><strong>Status:</strong> ${signalement?.status?.libelle ?? 'Nouveau'}</div>
            ${signalement.commentaire ? `<div><strong>Commentaire:</strong> ${signalement.commentaire}</div>` : ''}
            ${signalement.create_at ? `<div><strong>Date:</strong> ${new Date(signalement.create_at).toLocaleDateString('fr-FR')}</div>` : ''}
            <hr class="divider" />
            <div class="muted">👁️ Mode lecture seule</div>
          </div>
        `
      }
    })
    .filter(Boolean)

  const markers = [...problemMarkers, ...signalementMarkers]

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="logo">Section des visiteurs</h1>
          <Link to="/login" className="btn-login">
            Login Manager
          </Link>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <h2 className="hero-title">Bienvenue à Antananarivo</h2>
          <p className="hero-subtitle">
            Explorez la carte interactive de la capitale et visualiser les problemes routier du quotidien.
          </p>
        </section>

        {/* Section Carte Interactive */}
        <section className="map-section">
          <h3 className="section-title">🗺️ Carte des Problèmes Routiers</h3>
          <p className="section-description">
            {loading 
              ? 'Chargement des problèmes routiers...' 
              : `${problemes.length} problème(s) signalé(s) à Antananarivo - Survolez les marqueurs pour plus de détails`
            }
          </p>
          <p className="section-description">
            Double cliquer sur la position pour voir les photo et cliquer sur l’image pour l’agrandir
          </p>
          <Map 
            center={antananarivoCenter} 
            zoom={13} 
            height="600px"
            markers={markers}
            onMarkerDoubleClick={openPhotoModalFromMarker}
          />
        </section>


      </main>

      <footer className="home-footer">
        <p>&copy; 2026 Mon Application. Tous droits réservés.</p>
      </footer>
      {photoModalState.open && (
        <PhotoGalleryModal
          photos={photoModalState.photos}
          onClose={() => setPhotoModalState({ open: false, photos: [] })}
        />
      )}
    </div>
  );
}

export default Home;
