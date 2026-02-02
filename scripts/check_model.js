const API_KEY = "AIzaSyBQjVtdAM7JHPRT2bxplrRrm92vkID1-9I";
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
