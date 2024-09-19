// Initialize necessary variables
let proteaseList = [];
let proteaseToConsider = [];

// Listen for file selection
document.getElementById("csvFileBss").addEventListener("change", handleFileSelectBss);
document.getElementById("addProteaseBtnBss").addEventListener("click", addProteaseToConsiderBss);

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
    Papa.parse(data, {
        complete: function(results) {
            proteaseList = results.data.map(row => row[0]);  // Assuming first column contains protease data
            updateProteaseDropdownBss();
        },
        header: false
    });

    document.getElementById("csvFileLabelBss").innerText = "CSV File Loaded Successfully!";
}

// Update dropdown with proteases
function updateProteaseDropdownBss() {
    const proteaseInput = document.getElementById("proteaseInputBss");

    // Listen to input changes for autocompletion/suggestions
    proteaseInput.addEventListener("input", function() {
        const inputValue = proteaseInput.value.toLowerCase();
        const filteredProteases = proteaseList.filter(protease => protease.toLowerCase().includes(inputValue));

        displayDropdownOptions(filteredProteases);
    });
}

// Display dropdown suggestions (autocomplete)
function displayDropdownOptions(proteases) {
    const proteaseResult = document.getElementById("proteaseResultBss");
    proteaseResult.innerHTML = '';  // Clear previous results

    proteases.forEach(protease => {
        const option = document.createElement("div");
        option.textContent = protease;
        option.addEventListener("click", () => {
            document.getElementById("proteaseInputBss").value = protease;
            proteaseResult.innerHTML = '';  // Clear results after selection
        });
        proteaseResult.appendChild(option);
    });
}

// Add protease to "Protease To Consider"
function addProteaseToConsiderBss() {
    const selectedProtease = document.getElementById("proteaseInputBss").value;

    if (selectedProtease && !proteaseToConsider.includes(selectedProtease)) {
        proteaseToConsider.push(selectedProtease);
        updateSelectedProteasesBss();
    }
}

// Update UI with selected proteases
function updateSelectedProteasesBss() {
    const proteaseResult = document.getElementById("proteaseResultBss");
    proteaseResult.innerHTML = 'Proteases to consider: ' + proteaseToConsider.join(', ');
}
