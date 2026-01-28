# Laboratoire d'Idéation Augmenté (AI)

Une application d'intelligence stratégique utilisant l'API Google Gemini 3 Pro pour challenger des idées de business à travers trois personnalités d'experts (Visionnaire, Avocat du Diable, Coach Lean).

## 🚀 Installation Locale

1.  Cloner le projet.
2.  Installer les dépendances :
    ```bash
    npm install
    ```
3.  Configurer la clé API :
    *   Créez un fichier `.env` à la racine.
    *   Ajoutez : `API_KEY=votre_clé_gemini_ici`
4.  Lancer le serveur de développement :
    ```bash
    npm run dev
    ```

## 🌐 Déploiement (Vercel)

Ce projet est optimisé pour être déployé sur Vercel.

1.  Poussez ce code sur un repository GitHub.
2.  Importez le projet dans Vercel.
3.  **IMPORTANT :** Dans les paramètres de déploiement Vercel, ajoutez une variable d'environnement :
    *   Nom : `API_KEY`
    *   Valeur : `Votre clé API Gemini`

## 🛠 Technologies

*   **Frontend :** React 19, Vite, TypeScript
*   **Styling :** Tailwind CSS
*   **AI :** Google Gemini API (Modèles `gemini-3-pro-preview` et `gemini-3-flash-preview`)
*   **Markdown :** react-markdown, remark-gfm

## ⚠️ Note de Sécurité

Cette application est une "Single Page Application" (SPA). La clé API est utilisée côté client. Pour un projet de démonstration ou personnel, c'est acceptable si vous limitez l'usage de votre clé dans la console Google Cloud. Pour une application publique commerciale, il est recommandé de déplacer les appels API vers un backend (Serverless Functions).
