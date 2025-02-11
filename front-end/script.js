// 🔹 Base URL of the API
const API_BASE_URL = "https://localhost:9115/api"; 

// 🔹 Function to fetch toll station pass statistics
function fetchPassStats() {
    const stationID = document.getElementById("stationID").value;
    const dateFromInput = document.getElementById("dateFrom").value;
    const dateToInput = document.getElementById("dateTo").value;
    
    if (!stationID || !dateFromInput || !dateToInput) {
        console.log('empty request');
        alert("⚠️ Συμπληρώστε όλα τα πεδία!");
        return;
    }

    // Convert dates from YYYY-MM-DD to YYYYMMDD
    const dateFrom = dateFromInput.replace(/-/g, '');
    const dateTo = dateToInput.replace(/-/g, '');


    console.log(stationID, dateFrom, dateTo);

    axios.get(`${API_BASE_URL}/tollStationPasses/${stationID}/${dateFrom}/${dateTo}`)
        .then(response => {
            console.log(stationID, dateFrom, dateTo);
            document.getElementById("passStatsResult").innerHTML = `
                <h3>📊 Αποτελέσματα:</h3>
                <p>Αριθμός διελεύσεων από τον σταθμό ${stationID} μεταξύ ${dateFromInput} και ${dateToInput}: <strong>${response.data.nPasses}</strong></p>
                <p>Συνολικό κέρδος σταθμού ${stationID} μεταξύ ${dateFromInput} και ${dateToInput}: <strong>${response.data.passList.reduce((sum, pass) => sum + pass.passCharge, 0).toFixed(2)}€</strong></p>
            `;
        })
        .catch(alert("🚨 Προέκυψε σφάλμα! 'Ελεγξε πως έχει συμπληρώσει σωστά όλα τα πεδία"));
}

// 🔹 Function to fetch expenses report
function fetchExpensesReport() {
    const tollOpID = document.getElementById("tollOpID").value;
    const dateFromInput = document.getElementById("expenseDateFrom").value;
    const dateToInput = document.getElementById("expenseDateTo").value;

    if (!tollOpID || !dateFromInput || !dateToInput) {
        alert("⚠️ Συμπληρώστε όλα τα πεδία!");
        return;
    }

    // Convert dates from YYYY-MM-DD to YYYYMMDD
    const dateFrom = dateFromInput.replace(/-/g, '');
    const dateTo = dateToInput.replace(/-/g, '');

    axios.get(`${API_BASE_URL}/chargesBy/${tollOpID}/${dateFrom}/${dateTo}`)
        .then(response => {
            document.getElementById("expensesResult").innerHTML = `
                <h3>📑 Αναφορά Εξόδων:</h3>
                <p>Αριθμός διελεύσεων στους σταθμούς μου από άλλους μεταξύ ${dateFromInput} και ${dateToInput}: <strong>${response.data.vOpList.reduce((sum, pass) => sum + pass.nPasses, 0).toFixed(0)}</strong></p>
                <p>Συνολικό ποσό που μου οφείλουν οι υπόλοιποι πάροχοι μεταξύ ${dateFromInput} και ${dateToInput}: <strong>${response.data.vOpList.reduce((sum, pass) => sum + pass.passesCost, 0).toFixed(2)}€</strong></p>
            `;
        })
        .catch(alert("🚨 Προέκυψε σφάλμα! 'Ελεγξε πως έχει συμπληρώσει σωστά όλα τα πεδία"));
}