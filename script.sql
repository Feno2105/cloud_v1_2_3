-- Roles
CREATE TABLE IF NOT EXISTS "role" (
  Id_role SERIAL PRIMARY KEY,
  libelle VARCHAR(150),
  niveau VARCHAR(50),
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Entreprises
CREATE TABLE IF NOT EXISTS entreprise (
  Id_entreprise SERIAL PRIMARY KEY,
  nom VARCHAR(100),
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Status
CREATE TABLE IF NOT EXISTS status (
  Id_status SERIAL PRIMARY KEY,
  libelle VARCHAR(50),
  niveau INTEGER,
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  avancement NUMERIC(15,2)
);

-- Probleme
CREATE TABLE IF NOT EXISTS probleme (
  Id_probleme SERIAL PRIMARY KEY,
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  budget NUMERIC(15,2),
  surface NUMERIC(15,2),
  Id_entreprise INTEGER NOT NULL,
  CONSTRAINT fk_probleme_entreprise FOREIGN KEY (Id_entreprise)
    REFERENCES entreprise (Id_entreprise)
);

-- Photo (store metadata / URL)
CREATE TABLE IF NOT EXISTS photo (
  Id_photo SERIAL PRIMARY KEY,
  lien VARCHAR(2048),
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Utilisateur
CREATE TABLE IF NOT EXISTS utilisateur (
  Id_utilisateur SERIAL PRIMARY KEY,
  email VARCHAR(150),
  mdp VARCHAR(150),
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  fire_user_id VARCHAR(255),
  Id_role INTEGER NOT NULL,
  CONSTRAINT fk_utilisateur_role FOREIGN KEY (Id_role)
    REFERENCES "role" (Id_role)
);

-- Signalement
CREATE TABLE IF NOT EXISTS signalement (
  Id_signalement SERIAL PRIMARY KEY,
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  position_ TEXT,
  commentaire VARCHAR(200),
  is_deleted BOOLEAN DEFAULT FALSE,
  Id_status INTEGER NOT NULL,
  Id_utilisateur INTEGER NOT NULL,
  CONSTRAINT fk_signalement_status FOREIGN KEY (Id_status)
    REFERENCES status (Id_status),
  CONSTRAINT fk_signalement_utilisateur FOREIGN KEY (Id_utilisateur)
    REFERENCES utilisateur (Id_utilisateur)
);

-- Historique d'avancement
CREATE TABLE IF NOT EXISTS historique_avancement (
  Id_historique_avancement SERIAL PRIMARY KEY,
  create_at TIMESTAMP,
  nouveau_status VARCHAR(50),
  Id_signalement INTEGER NOT NULL,
  CONSTRAINT fk_hist_avancement_signalement FOREIGN KEY (Id_signalement)
    REFERENCES signalement (Id_signalement)
);

-- Normalized join table between photo and signalement
-- Use this when a photo may be associated with one or more signalements,
-- and a signalement may have one or more photos.
CREATE TABLE IF NOT EXISTS photo_signalement (
  Id_photo_signalement SERIAL PRIMARY KEY,
  Id_photo INTEGER NOT NULL,
  Id_signalement INTEGER NOT NULL,
  create_at TIMESTAMP,
  update_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_ps_photo FOREIGN KEY (Id_photo)
    REFERENCES photo (Id_photo) ON DELETE CASCADE,
  CONSTRAINT fk_ps_signalement FOREIGN KEY (Id_signalement)
    REFERENCES signalement (Id_signalement) ON DELETE CASCADE,
  CONSTRAINT uq_ps_photo_signalement UNIQUE (Id_photo, Id_signalement)
);

-- Signale_probleme (association probleme <-> signalement)
CREATE TABLE IF NOT EXISTS signale_probleme (
  Id_signalement INTEGER,
  Id_probleme INTEGER,
  PRIMARY KEY (Id_signalement, Id_probleme),
  CONSTRAINT fk_signale_probleme_signalement FOREIGN KEY (Id_signalement)
    REFERENCES signalement (Id_signalement),
  CONSTRAINT fk_signale_probleme_probleme FOREIGN KEY (Id_probleme)
    REFERENCES probleme (Id_probleme)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_photo_lien ON photo (lien);
CREATE INDEX IF NOT EXISTS idx_photo_signalement_signalement ON photo_signalement (Id_signalement);
CREATE INDEX IF NOT EXISTS idx_photo_signalement_photo ON photo_signalement (Id_photo);

-- End of schema