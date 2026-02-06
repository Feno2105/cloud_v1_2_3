# Ionic App (mapk2)

## 🔑 Variables d’environnement (Cloudinary)

Crée un fichier `.env` à partir de `.env.example` puis renseigne les valeurs Cloudinary.

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

## 📸 Fonctionnalité photos

- **Galerie** : sélection multiple via la galerie (native sur mobile, input file sur web).
- **Caméra** : prise de photo native (1 photo à la fois, possible d’en ajouter plusieurs en répétant l’action).
- **Upload** : les images sont envoyées à Cloudinary avant l’enregistrement du signalement dans Firestore (champ `photos`).

## ▶️ Démarrage rapide

1. Installer les dépendances.
2. Lancer le dev server.

## ✅ Notes

- Sur mobile, après avoir ajouté le plugin Capacitor, exécute `npx cap sync`.
- Les photos sont stockées dans Cloudinary et les URLs sont enregistrées dans Firestore.
- Android: vérifie que les permissions caméra/galerie sont dans `android/app/src/main/AndroidManifest.xml`.
