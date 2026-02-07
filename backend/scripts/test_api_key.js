import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function check() {
    try {
        console.log("Checking API Key...");
        const res = await fetch(url);
        if (!res.ok) {
            const txt = await res.text();
            console.log("Error Status:", res.status);
            console.log("Error Body:", txt);
            return;
        }
        const data = await res.json();
        if (data.models) {
            console.log("Total Models:", data.models.length);
            const names = data.models.map(m => m.name);
            console.log(names.join('\n'));
        } else {
            console.log("No models returned?", JSON.stringify(data));
        }
    } catch (e) {
        console.log("Fetch Error:", e.message);
    }
}
check();
