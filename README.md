# Projets XML - ClubInfoTech

Ce projet est un mini-projet de TP XML / XQuery / Web développé dans le cadre du module **Données Semi-structurées** à l'Université de Skikda (Département d'Informatique).

## 👥 Membres de l'équipe
* **Latreche Khalil (G4)**
* **Belhay Mohammed Fadi (G1)**
* **Saker Houssem (G4)**

## 🛠️ Technologies utilisées
* **XML** (Base de données)
* **XSD** (Schéma de validation automatique)
* **XQuery & XQuery Update** (Interrogation et mise à jour)
* **BaseX** (Moteur de base de données XML native)
* **Node.js (Express & EJS)** (Interface Web Dynamique et interactive)

## 📁 Structure du Projet
* `club.xml` : Base de données XML principale contenant les catégories, membres, concours, participants et scores.
* `club.xsd` : Schéma de validation XML.
* `requetes.xq` : Les 5 requêtes XQuery demandées dans le TP (Q1 à Q5).
* `updates.xq` : Les 3 opérations de mise à jour (XQuery Update).
* `web/` : Application web Express pour afficher les résultats, leaderboard et formulaires d'inscription interactifs.

## 🚀 Lancement Rapide (Local)
1. Assurez-vous d'avoir [Node.js](https://nodejs.org/) et [BaseX](https://basex.org/) installés.
2. Ouvrez le dossier `web/` et installez les dépendances :
   ```bash
   cd web
   npm install
   ```
3. Lancez le serveur Node.js :
   ```bash
   npm run dev
   ```
4. Ouvrez votre navigateur sur `http://localhost:3000`.
