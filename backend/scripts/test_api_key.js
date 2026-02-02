const API_KEY = "AIzaSyBQjVtdAM7JHPRT2bxplrRrm92vkID1-9I";
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
