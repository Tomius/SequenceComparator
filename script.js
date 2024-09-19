// Initialize necessary variables
let bss = new BestSequenceSearch();
let proteaseList = [];
let proteaseToConsider = [];

// Listen for file selection
document.getElementById("csvFileBss").addEventListener("change", handleFileSelectBss);
document.getElementById("addProteaseBtnBss").addEventListener("click", addProteaseToConsiderBss);

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
    const proteaseInput = document.getElementById("proteaseToConsiderInputBss");

    // Listen to input changes for autocompletion/suggestions
    proteaseInput.addEventListener("input", function() {
        const inputValue = proteaseInput.value.toLowerCase();
        const filteredProteases = bss.Proteases_List.filter(protease => protease.toLowerCase().includes(inputValue));

        displayDropdownOptions(filteredProteases);
    });
}

// Display dropdown suggestions (autocomplete)
function displayDropdownOptions(proteases) {
    const proteaseResult = document.getElementById("proteaseToConsiderDropdown");
    proteaseResult.innerHTML = '';  // Clear previous results

    proteases.forEach(protease => {
        const option = document.createElement("div");
        option.textContent = protease;
        option.addEventListener("click", () => {
            document.getElementById("proteaseToConsiderInputBss").value = protease;
            proteaseResult.innerHTML = '';  // Clear results after selection
        });
        proteaseResult.appendChild(option);
    });
}

// Add protease to "Protease To Consider"
function addProteaseToConsiderBss() {
    const selectedProtease = document.getElementById("proteaseToConsiderInputBss").value;

    if (selectedProtease && !proteaseToConsider.includes(selectedProtease)) {
        proteaseToConsider.push(selectedProtease);
        updateSelectedProteasesBss();
    }
}

// Update UI with selected proteases
function updateSelectedProteasesBss() {
    const proteaseResult = document.getElementById("proteaseToConsiderSelections");
    proteaseResult.innerHTML = ': ' + proteaseToConsider.join(', ');
}

// Function to launch the best sequence search
document.getElementById("launchSearchBtn").addEventListener("click", launchBestSequenceSearch);

function launchBestSequenceSearch() {
    if (proteaseToConsider.length === 0) {
        alert("Please select at least one protease before launching the search.");
        return;
    }

    const sequence = document.getElementById("sequenceInput").value;
    if (!sequence) {
        alert("Please enter a sequence.");
        return;
    }

    // Assuming you have a function to perform the search
    const bestResults = performBestSequenceSearch(sequence, proteaseToConsider);

    // Display the results
    displaySearchResults(bestResults);
}

// Example function to perform the best sequence search
function performBestSequenceSearch(sequence, proteases) {
    let results = [];
    
    // Here you would implement your search logic
    // For demonstration purposes, let's say we just return the sequence for each protease
    proteases.forEach(protease => {
        const score = calculateScoreForProtease(sequence, protease);
        results.push({ protease, score });
    });

    // Sort results based on score (higher is better)
    results.sort((a, b) => b.score - a.score);

    return results;
}

// Example function to calculate score for a single protease
function calculateScoreForProtease(sequence, protease) {
    const pattern = proteasePatterns[protease];
    if (pattern) {
        const matches = sequence.match(pattern);
        return matches ? matches.length : 0;
    }
    return 0;
}

// Function to display search results
function displaySearchResults(results) {
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = '';  // Clear previous results

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>';
        return;
    }

    results.forEach(result => {
        const resultItem = document.createElement("p");
        resultItem.textContent = `Protease: ${result.protease}, Score: ${result.score}`;
        resultsDiv.appendChild(resultItem);
    });
}


// Assume proteaseToConsider has proteases added by the user
// Also assuming we have cleavage patterns for each protease for scoring

// Event listener for the "Calculate Score" button
document.getElementById("calcScoreBtn").addEventListener("click", calculateScore);

// Example cleavage patterns for proteases
const proteasePatterns = {
    "Protease1": /A/g,  // Cleaves at 'A'
    "Protease2": /C/g,  // Cleaves at 'C'
    "Protease3": /G/g,  // Cleaves at 'G'
    // Add more proteases with corresponding cleavage patterns
};

// Calculate the score based on the sequence and selected proteases
function calculateScore() {
    const sequence = document.getElementById("sequenceInput").value;
    if (!sequence) {
        alert("Please enter a sequence.");
        return;
    }

    if (proteaseToConsider.length === 0) {
        alert("Please select at least one protease.");
        return;
    }

    let totalScore = 0;

    // Loop through each selected protease and calculate score
    proteaseToConsider.forEach(protease => {
        const pattern = proteasePatterns[protease];
        if (pattern) {
            const matches = sequence.match(pattern);
            const count = matches ? matches.length : 0;
            totalScore += count;
        } else {
            console.warn(`No pattern found for ${protease}`);
        }
    });

    // Display the calculated score
    document.getElementById("scoreResult").innerText = `Score: ${totalScore}`;
}

