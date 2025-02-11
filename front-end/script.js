// 🔹 Base URL of the API
const API_BASE_URL = "http://localhost:9115/api"; 

// 🔹 Function to fetch toll station pass statistics
function fetchPassStats() {
    const stationID = document.getElementById("stationID").value;
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;
    
    if (!stationID || !dateFrom || !dateTo) {
        alert("⚠️ Συμπληρώστε όλα τα πεδία!");
        return;
    }

    axios.get(`${API_BASE_URL}/tollStationPasses/${stationID}/${dateFrom}/${dateTo}`)
        .then(response => {
            document.getElementById("passStatsResult").innerHTML = `
                <h3>📊 Αποτελέσματα:</h3>
                <p>Αριθμός διελεύσεων: <strong>${response.data.nPasses}</strong></p>
                <p>Συνολικό κόστος: <strong>${response.data.passList.reduce((sum, pass) => sum + pass.passCharge, 0).toFixed(2)}€</strong></p>
            `;
        })
        .catch(error => console.error("🚨 Σφάλμα:", error));
}

// 🔹 Function to fetch expenses report
function fetchExpensesReport() {
    const tollOpID = document.getElementById("tollOpID").value;
    const tagOpID = document.getElementById("tagOpID").value;
    const dateFrom = document.getElementById("expenseDateFrom").value;
    const dateTo = document.getElementById("expenseDateTo").value;

    if (!tollOpID || !tagOpID || !dateFrom || !dateTo) {
        alert("⚠️ Συμπληρώστε όλα τα πεδία!");
        return;
    }

    axios.get(`${API_BASE_URL}/passesCost/${tollOpID}/${tagOpID}/${dateFrom}/${dateTo}`)
        .then(response => {
            document.getElementById("expensesResult").innerHTML = `
                <h3>📑 Αναφορά Εξόδων:</h3>
                <p>Αριθμός διελεύσεων: <strong>${response.data.nPasses}</strong></p>
                <p>Συνολικό οφειλόμενο ποσό: <strong>${response.data.passesCost.toFixed(2)}€</strong></p>
            `;
        })
        .catch(error => console.error("🚨 Σφάλμα:", error));
}
