import { useMemo, useState } from 'react'
import './PhotoGalleryModal.css'

const buildPhotoSrc = (photo) => {
  if (!photo) return ''
  const raw = photo.image_base64 ?? photo.base64 ?? photo.image
  if (!raw) return ''
  if (raw.startsWith('data:')) return raw
  const mime = photo.mime_type || 'image/jpeg'
  return `data:${mime};base64,${raw}`
}

function PhotoGalleryModal({ photos = [], onClose }) {
  const [selected, setSelected] = useState(null)

  const items = useMemo(
    () => photos.map((photo) => ({
      id: photo.Id_photo ?? photo.id_photo ?? photo.id ?? Math.random().toString(36).slice(2),
      src: buildPhotoSrc(photo)
    })).filter((item) => item.src),
    [photos]
  )

  if (!photos || !photos.length) return null

  return (
    <div className="photo-modal-overlay" onClick={onClose}>
      <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="photo-modal-header">
          <h2>Photos du signalement</h2>
          <button className="photo-close" onClick={onClose}>&times;</button>
        </div>

        <div className="photo-grid">
          {items.map((photo) => (
            <button
              type="button"
              key={photo.id}
              className="photo-thumb"
              onClick={() => setSelected(photo)}
            >
              <img src={photo.src} alt="Photo" />
            </button>
          ))}
        </div>

        {selected && (
          <div className="photo-lightbox" onClick={() => setSelected(null)}>
            <div className="photo-lightbox-inner" onClick={(e) => e.stopPropagation()}>
              <button className="photo-close" onClick={() => setSelected(null)}>&times;</button>
              <img src={selected.src} alt="Photo sélectionnée" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoGalleryModal
