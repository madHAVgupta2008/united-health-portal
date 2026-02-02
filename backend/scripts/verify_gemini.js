import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to read from .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Go up two levels from scripts/verify_gemini.js to .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log('--- Gemini API Verification ---');
console.log(`API Key found: ${API_KEY ? 'YES' : 'NO'}`);

if (!API_KEY) {
    console.error('Error: VITE_GEMINI_API_KEY not found in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function verify() {
    try {
        console.log('Attempting to generate content...');
        const result = await model.generateContent('Say "Hello World" if you can hear me.');
        const response = await result.response;
        const text = response.text();
        console.log('Success! Response:', text);
    } catch (error) {
        console.log('!!! VERIFICATION FAILED !!!');
        console.log('Error Name:', error.name);
        console.log('Error Message:', error.message);
        if (error.message.includes('400')) console.log('HINT: Key invalid or Region blocked.');
        if (error.message.includes('401')) console.log('HINT: Key missing or invalid.');
        if (error.message.includes('403')) console.log('HINT: Quota exceeded.');
        if (error.message.includes('404')) console.log('HINT: Model not found.');
    }
}

verify();
