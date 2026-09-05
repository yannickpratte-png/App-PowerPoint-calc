# Calculs Électriques

Petite application web (PWA) de calculs d'ingénierie électrique, conçue pour être installée sur l'écran d'accueil d'un iPad et utilisée hors-ligne.

## Fonctionnalités

- **Ohm & Puissance** — roue de calcul V / I / R / P : entre deux valeurs connues, les deux autres se calculent automatiquement.
- **Triphasé** — puissance active/apparente/réactive à partir de V, I et FP (monophasé ou triphasé), et calcul inverse du courant à partir de P, V et FP.
- **Chute de tension** — chute de tension et tension à la charge selon le calibre (AWG/kcmil), le matériau (cuivre/aluminium), la longueur et le courant.
- **Facteur de puissance** — kVAR de correction requis pour passer d'un FP actuel à un FP désiré.

## Installer sur iPad

1. Héberger ce dossier sur un serveur web accessible depuis l'iPad (voir ci-dessous), ou publier les fichiers sur un hébergement statique (GitHub Pages, Netlify, etc.).
2. Ouvrir l'URL dans **Safari** sur l'iPad.
3. Toucher le bouton **Partager** (icône carrée avec flèche vers le haut).
4. Choisir **Sur l'écran d'accueil**.
5. L'app s'installe comme une app native (icône, plein écran, fonctionne hors-ligne après le premier chargement).

### Tester localement

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://<adresse-ip-de-l-ordinateur>:8080` depuis Safari sur l'iPad (même réseau Wi-Fi).

### Héberger gratuitement (accessible de partout)

Le plus simple : activer **GitHub Pages** sur ce dépôt (Settings → Pages → Deploy from branch), ce qui donne une URL type `https://<utilisateur>.github.io/App-PowerPoint-calc/` installable directement depuis l'iPad, sans serveur à maintenir.

## Notes techniques

- Aucune dépendance externe, aucun build requis — HTML/CSS/JS pur.
- Fonctionne hors-ligne via un service worker (`sw.js`) qui met en cache les fichiers de l'app.
- Les valeurs de résistance des conducteurs (chute de tension) sont basées sur un tableau standard (type NEC Chapitre 9, Tableau 8, conducteur non revêtu) — à valider avec le code électrique applicable pour tout usage réel.
