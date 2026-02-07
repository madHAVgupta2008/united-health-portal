import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY is not set in .env file.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash"
];

async function test() {
    console.log("Testing models with API Key...");

    for (const modelName of models) {
        process.stdout.write(`Testing model: ${modelName} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCCESS! Response: ${text.trim().substring(0, 50)}...`);
            return;
        } catch (error) {
            console.log(`❌ FAILED`);
            // console.log("Error details:", error.message);
        }
    }

    console.log("\nAll models failed.");
}

test();
