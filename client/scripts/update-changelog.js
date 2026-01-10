import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
const JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/changelog.json');

// Récupérer le message du dernier commit (passé par GitHub Actions)
const commitMessage = process.argv[2];

if (!commitMessage) {
    console.log("❌ Pas de message de commit !");
    process.exit(1);
}

// "L'IA" de classification (Regex simple mais puissante)
let type = "autre";
let icon = "🔧";
let cleanMessage = commitMessage;

if (commitMessage.startsWith("feat:")) {
    type = "feature";
    icon = "🚀";
    cleanMessage = commitMessage.replace("feat:", "").trim();
} else if (commitMessage.startsWith("fix:")) {
    type = "fix";
    icon = "🐛";
    cleanMessage = commitMessage.replace("fix:", "").trim();
} else if (commitMessage.startsWith("style:")) {
    type = "style";
    icon = "🎨";
    cleanMessage = commitMessage.replace("style:", "").trim();
} else if (commitMessage.startsWith("perf:")) {
    type = "perf";
    icon = "⚡";
    cleanMessage = commitMessage.replace("perf:", "").trim();
} else {
    console.log("ℹ️ Ce n'est pas un commit de changelog (ignore).");
    process.exit(0); // On ne fait rien si ce n'est pas un commit important
}

// Lire le fichier actuel
const changelog = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Logique de versionning (On incrémente juste le dernier chiffre pour faire simple)
const lastVersion = changelog[0].version.split(' ')[0]; // ex: "2.0.0"
const parts = lastVersion.split('.');
const newVersion = `${parts[0]}.${parts[1]}.${parseInt(parts[2]) + 1}`;

// Est-ce qu'on a déjà une entrée pour aujourd'hui ?
if (changelog[0].date === today) {
    // Oui -> On ajoute juste la ligne à la liste existante
    changelog[0].features.unshift(`${icon} ${cleanMessage}`);
    console.log("✅ Ajouté à la version d'aujourd'hui.");
} else {
    // Non -> On crée une nouvelle entrée
    const newEntry = {
        version: `${newVersion} - Mise à jour Auto`,
        date: today,
        features: [`${icon} ${cleanMessage}`]
    };
    changelog.unshift(newEntry); // Ajoute en haut de la liste
    console.log(`✅ Nouvelle version créée : ${newVersion}`);
}

// Sauvegarde
fs.writeFileSync(JSON_PATH, JSON.stringify(changelog, null, 2));