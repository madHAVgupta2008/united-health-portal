import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = "AIzaSyBQjVtdAM7JHPRT2bxplrRrm92vkID1-9I";
const genAI = new GoogleGenerativeAI(API_KEY);

const candidates = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
];

async function check() {
    console.log("Starting Probe with NEW KEY...");

    for (const modelName of candidates) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello');
            const response = await result.response;
            console.log(`SUCCESS! Model ${modelName} works.`);
            return;
        } catch (e) {
            console.log(`FAILED: ${modelName}`);
            console.log(`Error: ${e.message}`);
        }
    }
    console.log("\nAll candidates failed.");
}

check();
