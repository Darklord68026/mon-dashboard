/// <reference types="node" />

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. LE PLAN DU JOURNAL (Interface)
// On définit à quoi ressemble une entrée dans ton fichier changelog.json
interface ChangelogEntry {
    version: string;
    date: string;
    features: string[];
}

// Configuration
const JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/changelog.json');

// Récupérer le message du dernier commit
const commitMessage = process.argv[2];

if (!commitMessage) {
    console.log("❌ Pas de message de commit !");
    process.exit(1);
}

// "L'IA" de classification
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
    process.exit(0);
}

// Lire le fichier actuel
// 2. L'AFFIRMATION (Type Assertion)
// On dit à TS : "Ceci est une liste de ChangelogEntry"
// Sans ça, il penserait que c'est 'any' et on n'aurait pas d'autocomplétion.
const fileContent = fs.readFileSync(JSON_PATH, 'utf-8');
const changelog = JSON.parse(fileContent) as ChangelogEntry[];

const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Logique de versionning
// Petite sécurité : on vérifie qu'il y a bien au moins une entrée avant de lire [0]
if (changelog.length === 0) {
    // Cas où le fichier est vide, on initialise
    changelog.push({ version: "1.0.0", date: today, features: [] });
}

const lastVersion = changelog[0].version.split(' ')[0]; // ex: "2.0.0"
const parts = lastVersion.split('.');
// On s'assure que parseInt renvoie un nombre, TS est content car parts est string[]
const newVersion = `${parts[0]}.${parts[1]}.${parseInt(parts[2]) + 1}`;

// Est-ce qu'on a déjà une entrée pour aujourd'hui ?
if (changelog[0].date === today) {
    // Oui -> On ajoute juste la ligne
    changelog[0].features.unshift(`${icon} ${cleanMessage}`);
    console.log("✅ Ajouté à la version d'aujourd'hui.");
} else {
    // Non -> On crée une nouvelle entrée
    // TS vérifie ici que newEntry respecte bien l'interface ChangelogEntry !
    const newEntry: ChangelogEntry = {
        version: `${newVersion} - Mise à jour Auto`,
        date: today,
        features: [`${icon} ${cleanMessage}`]
    };
    changelog.unshift(newEntry);
    console.log(`✅ Nouvelle version créée : ${newVersion}`);
}

// Sauvegarde
fs.writeFileSync(JSON_PATH, JSON.stringify(changelog, null, 2));