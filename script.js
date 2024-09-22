// Initialize necessary variables
let bss = new BestSequenceSearch();
let proteaseList = [];
let proteaseToConsider = [];

// Listen for file selection
document.getElementById("csvFileBss").addEventListener("change", handleFileSelectBss);
document.getElementById("AddToProteasesToConsider").addEventListener("click", addToProteasesToConsider);
document.getElementById("RemoveFromProteasesToConsider").addEventListener("click", removeFromProteasesToConsider);
document.getElementById("ClearProteasesToConsider").addEventListener("click", clearProteasesToConsider);

parseCSV(meropsData);

// Handle CSV file selection and parsing
function handleFileSelectBss(event) {
    const file = event.target.files[0];
    if (!file) {
        document.getElementById("csvFileLabelBss").innerText = "No file loaded";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        parseCSV(csvData);
    };
    reader.readAsText(file);
}

// Parse CSV using PapaParse or similar library
function parseCSV(data) {
    // Example CSV parsing using PapaParse
    bss.Translate_File(data)  
    updateProteaseDropdownBss();
    document.getElementById("csvFileLabelBss").innerText = "CSV File Loaded Successfully!";
    document.getElementById("csvLoadFileText").innerText = "Reload CSV File"
}

// Update dropdown with proteases
function updateProteaseDropdownBss() {
    const proteaseInput = document.getElementById("ProteasesToConsider");

    bss.Proteases_List.forEach(protease => {
        var opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteaseInput.appendChild(opt);
    })
}


document.getElementById("AddToProteasesToConsider").addEventListener("click", addToProteasesToConsider);
document.getElementById("RemoveFromProteasesToConsider").addEventListener("click", removeFromProteasesToConsider);
document.getElementById("ClearProteasesToConsider").addEventListener("click", clearProteasesToConsider);

// Add protease to "Protease To Consider"
function addToProteasesToConsider() {
    const selectedProtease = document.getElementById("ProteasesToConsider").value;

    if (selectedProtease && !proteaseToConsider.includes(selectedProtease)) {
        proteaseToConsider.push(selectedProtease);
        updateSelectedProteasesBss();
    }
}

function removeFromProteasesToConsider() {
    const selectedProtease = document.getElementById("ProteasesToConsider").value;
    const index = proteaseToConsider.indexOf(selectedProtease);
    if (selectedProtease && index > -1) {
        proteaseToConsider.splice(index, 1);
        updateSelectedProteasesBss();
    }
}

function clearProteasesToConsider() {
    proteaseToConsider = [];
    updateSelectedProteasesBss();
}

function updateProteaseOfInterest() {
    const proteaseInterest = document.getElementById("proteaseInterest");
    value = proteaseInterest.value;
    proteaseInterest.innerHTML = "";
    proteaseToConsider.forEach(protease => {
        var opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteaseInterest.appendChild(opt);
    })
    if (proteaseToConsider.includes(value)) {
        proteaseInterest.value = value;
    }
}

// Update UI with selected proteases
function updateSelectedProteasesBss() {
    const proteaseResult = document.getElementById("proteaseToConsiderSelections");
    if (proteaseToConsider.length == 0) {
        proteaseResult.innerHTML = "&lt;empty&gt;";
    } else { 
        proteaseResult.innerHTML = proteaseToConsider.join(', ');
    }
    updateProteaseOfInterest();
}

// Function to launch the best sequence search
document.getElementById("launchSearchBtn").addEventListener("click", launchBestSequenceSearch);

function launchBestSequenceSearch() {
    const proteaseOfInterest = document.getElementById("proteaseInterest").value;
    finalMinScore = document.getElementById("minPoiScore").value;
    if (finalMinScore == '') 
       finalMinScore = 0;
           
    finalMinSelec = document.getElementById("minPoiSelectivity").value;
    if (finalMinSelec == '')
       finalMinSelec = 0;
    const res = bss.The_Calculation(proteaseToConsider, proteaseOfInterest, finalMinScore, finalMinSelec);
    
    document.getElementById("searchResults").innerHTML = "<hr/><h2>Results<h2>";
    const tbl = document.createElement('table');
    tbl.style.width = '100px';
    tbl.style.border = '1px solid black';

    const rownames = ["Sequence", "Selectivity", "Closest Protease", "Score at the protease of interest"];
    for (let i = 0; i < res.length; i++) {
        const tr = tbl.insertRow();
        var td = tr.insertCell();
        td.appendChild(document.createTextNode(rownames[i]));
        td.style.border = '1px solid black';
        for (let j = 0; j < res[i].length; j++) {
            td = tr.insertCell();
            td.appendChild(document.createTextNode(res[i][j]));
            td.style.border = '1px solid black';
        }
    }
    document.getElementById("searchResults").appendChild(tbl);
}


