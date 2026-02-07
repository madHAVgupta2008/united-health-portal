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

const modelName = "gemini-1.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}?key=${API_KEY}`;

async function check() {
    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log(`Model ${modelName} EXISTS!`);
        } else {
            console.log(`Model ${modelName} NOT FOUND or ERROR. Status: ${res.status}`);
            const txt = await res.text();
            console.log(txt);
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();
