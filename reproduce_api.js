
// using native fetch

async function checkPort(port) {
    const BASE_URL = `http://localhost:${port}/api/claims`;
    console.log(`Checking port ${port}...`);
    try {
        const res = await fetch(BASE_URL);
        if (res.ok) {
            console.log(`Port ${port} is active and returning claims.`);
            return `http://localhost:${port}/api/claims`;
        } else {
            console.log(`Port ${port} returned status ${res.status}`);
        }
    } catch (e) {
        console.log(`Port ${port} unreachable: ${e.code || e.message}`);
    }
    return null;
}

async function run() {
    let baseUrl = await checkPort(3001);
    if (!baseUrl) baseUrl = await checkPort(3000);

    if (!baseUrl) {
        console.error("Could not find active API on port 3000 or 3001.");
        return;
    }

    console.log(`Using API at: ${baseUrl}`);

    console.log("1. Creating a dummy claim...");
    try {
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                holderName: "Test Auto Bot",
                description: "Test delete functionality",
                policyId: "NN-8-2026-0001",
                date: "2026-02-07",
                time: "12:00",
                status: "Deschis"
            })
        });

        if (!createRes.ok) {
            console.error("Failed to create claim:", createRes.status, await createRes.text());
            return;
        }

        const newClaim = await createRes.json();
        const id = newClaim.id;
        console.log("Claim created with ID:", id);

        console.log("\n2. Attempting to DELETE claim:", id);

        const deleteUrl = `${baseUrl}/${id}`;
        console.log("DELETE URL:", deleteUrl);

        const deleteRes = await fetch(deleteUrl, { method: 'DELETE' });

        if (deleteRes.ok) {
            console.log("DELETE SUCCESS! Status:", deleteRes.status);
        } else {
            console.error("DELETE FAILED! Status:", deleteRes.status, await deleteRes.text());
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
