# Jeux Retro

Collection de jeux d arcade retro, chacun recree en HTML/CSS/JavaScript pur
(sans dependance), avec une page d accueil facon borne d arcade.

## Lancer

Ouvre `index.html` dans un navigateur, puis choisis un jeu.
Chaque jeu est aussi jouable via son propre `index.html`.

## Les jeux (par annee)

- 1972 - Pong (Pong/)
- 1976 - Serpent / Snake (snake/)
- 1978 - Space Invaders (space-invaders/)
- 1980 - Pac-Man (Pacman/)
- 1981 - Defender (Defender/)
- 1981 - Donkey Kong (DonkeyKong/)
- 1981 - Centipede (Centipede/)
- 1982 - Pitfall (Pitfall/)
- 1982 - Dig Dug (DigDug/)

## Musique

La gestion de la musique est centralisee dans `music/` :
- music/player.js : lecteur autonome inclus dans chaque jeu (barre de controle,
  selection, aleatoire, suivant/precedent, volume, dossier local) avec reprise
  d un jeu a l autre.
- music/playlist.js : liste de lecture par defaut.

Les fichiers audio ne sont pas inclus dans le depot. Utilise le bouton dossier
de la barre de musique pour charger ton propre dossier de morceaux.

## Commandes generales

- Fleches : deplacement
- Espace : action / tir / saut / demarrer
- P : pause

---

Genere avec Claude Code (https://claude.com/claude-code)