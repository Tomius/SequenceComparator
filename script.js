let bss = new BestSequenceSearch();
let psc = new ProteaseScoreCalculation();
let proteaseList = [];
let competingProteasesList = [];
let proteaseToConsiderPsc = [];
let aminoAcidsToExclude = [];

//document.getElementById("csvFileBss").addEventListener("change", handleFileSelectBss);
document.getElementById("searchBestSequence").addEventListener("click", searchBestSequence);
document.getElementById("searchAllSequences").addEventListener("click", searchAllSequences);
document.getElementById("StartPsc").addEventListener("click", startPsc);

parseCSV(meropsData);

$("#ProteaseInterest").chosen().change(onProteaseInterestChanged);
$("#CompetingProteases").chosen().change(onCompetingProteasesChanged);
$("#ProteasesToConsiderPsc").chosen().change(onProteasesToConsiderPscChanged);
$("#AminoAcidsToExclude").chosen().change(onAminoAcidsToExcludeChanged);
document.getElementById("AminoAcidsToExclude").value = null;
$('#AminoAcidsToExclude').trigger('chosen:updated');
for (let i = 1; i <= 8; ++i) {
    $(`#AA${i}`).chosen().change(aminoAcidChanged);
}

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

function parseCSV(data) {
    bss.Translate_File(data);
    psc.Translate_File(data);
    updateProteaseDropdown();
    document.getElementById("csvFileLabelBss").innerText = "CSV File Loaded Successfully!";
    document.getElementById("csvLoadFileText").innerText = "Reload CSV File";
}

function updateProteaseDropdown() {
    const proteasesPsc = document.getElementById("ProteasesToConsiderPsc");
    const proteaseInterest = document.getElementById("ProteaseInterest");

    var opt = document.createElement('option');
    opt.value = "";
    opt.innerHTML = "";
    proteaseInterest.appendChild(opt);

    bss.Proteases_List.forEach(protease => {
        opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteasesPsc.appendChild(opt);

        opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteaseInterest.appendChild(opt);
    })
    $('#ProteasesToConsiderPsc').trigger('chosen:updated');
    $('#ProteaseInterest').trigger('chosen:updated');
    const proteasesBss = document.getElementById("CompetingProteases");
    proteasesBss.disabled = true;
    proteasesBss.attributes["data-placeholder"].nodeValue="Please select protease of interest first";
    $('#CompetingProteases').trigger('chosen:updated');
}

function onProteaseInterestChanged(evt, params) {
    const proteasesBss = document.getElementById("CompetingProteases");
    if (params.selected) {
        proteasesBss.innerHTML = "";
        const index = competingProteasesList.indexOf(params.selected);
        if (index !== -1) {
            competingProteasesList.splice(index, 1);
        }

        bss.Proteases_List.forEach(protease => {
            if (protease !== params.selected) {
                var opt = document.createElement('option');
                opt.value = protease;
                opt.innerHTML = protease;
                proteasesBss.appendChild(opt);
            }
        })

        proteasesBss.disabled = false;
        proteasesBss.attributes["data-placeholder"].nodeValue="Begin typing a name to filter...";
        $('#CompetingProteases').val(competingProteasesList).trigger('chosen:updated');
        document.getElementById("ProteasesOfInterestEmptyWarning").style.display = "none";
    } else {
        proteasesBss.disabled = true;
        proteasesBss.attributes["data-placeholder"].nodeValue="Please select protease of interest first";
        $('#CompetingProteases').trigger('chosen:updated');
    }
}

function onCompetingProteasesChanged(evt, params) {
    if (params.selected) {
        competingProteasesList.push(params.selected);
        document.getElementById("CompetingProteasesEmptyWarning").style.display = "none";
    }
    if (params.deselected) {
        const index = competingProteasesList.indexOf(params.deselected);
        if (index > -1) {
          competingProteasesList.splice(index, 1);
        }
    }
}

function onProteasesToConsiderPscChanged(evt, params) {
    if (params.selected) {
        proteaseToConsiderPsc.push(params.selected);
        document.getElementById("ProteasesToConsiderPscEmptyWarning").style.display = "none";
    }
    if (params.deselected) {
        const index = proteaseToConsiderPsc.indexOf(params.deselected);
        if (index > -1) {
          proteaseToConsiderPsc.splice(index, 1);
        }
    }
}

function aminoAcidChanged(evt, params) {
    if (params.selected) {
        document.getElementById("AminoAcidsEmptyWarning").style.display = "none";
    }
}

function onAminoAcidsToExcludeChanged(evt, params) {
    if (params.selected) {
        aminoAcidsToExclude.push(params.selected);
    }
    if (params.deselected) {
        const index = aminoAcidsToExclude.indexOf(params.deselected);
        if (index > -1) {
          aminoAcidsToExclude.splice(index, 1);
        }
    }
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div;
}

function searchBestSequence() {
    const proteaseOfInterest = document.getElementById("ProteaseInterest").value;
    if (!proteaseOfInterest) {
        document.getElementById("ProteasesOfInterestEmptyWarning").style.display = "block";
        return;
    }
    if (competingProteasesList.length === 0) {
        document.getElementById("CompetingProteasesEmptyWarning").style.display = "block";
        return;
    }
    finalMinScore = document.getElementById("minPoiScore").value;
    if (finalMinScore == '') 
       finalMinScore = 0;
           
    finalMinSelec = document.getElementById("minPoiSelectivity").value;
    if (finalMinSelec == '')
       finalMinSelec = 0;
    const res = bss.The_Calculation(competingProteasesList.concat([proteaseOfInterest]), proteaseOfInterest, finalMinScore, finalMinSelec, aminoAcidsToExclude);
    
    document.getElementById("searchResults").innerHTML = "<hr/><h2>Results<h2>";
    
    div = document.createElement('div');
    h3 = document.createElement('h3');
    h3.appendChild(document.createTextNode("Best sequence"));
    div.appendChild(h3);

    var tbl = document.createElement('table');
    tbl.style.width = '1000px';
    tbl.classList.add("withBorder");

    const rownames = ["Sequence", "Selectivity", "Closest Protease", "S<sub>norma, POI</sub>"];
    for (let i = 0; i < res.length; i++) {
        var tr = tbl.insertRow();
        var td = i == 0 ? document.createElement("th") : tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(createElementFromHTML(rownames[i]));
        if (i == 0) {
            tr.appendChild(td);
        }
        for (let j = 0; j < res[i].length; j++) {
            td = i == 0 ? document.createElement("th") : tr.insertCell();
            td.classList.add("withBorder");
            let data = i == 2 ? res[i][j].split(proteaseSeparatorChar)[0] : res[i][j];
            td.appendChild(document.createTextNode(data));
            if (i == 0) {
                tr.appendChild(td);
            }
        }
    }
    div.appendChild(tbl);

    h3 = document.createElement('h3');
    h3.appendChild(document.createTextNode("Selectivity per amino acid"));
    div.appendChild(h3);

    var tbl = document.createElement('table');
    tbl.style.width = '1000px';
    tbl.classList.add("withBorder");

    const colnames = ["", "P4", "P3", "P2", "P1", "P1'", "P2'", "P3'", "P4'"];
    var tr = tbl.insertRow();
    colnames.forEach(value => {
        let th = document.createElement("th");
        th.classList.add("withBorder");
        th.appendChild(document.createTextNode(value));
        tr.appendChild(th);
    })
    for (let i = 0; i < bss.Ratio_By_AA_And_Position.length; i++) {
        if (bss.IndexAAExclude.includes(i)) {
            continue;
        }
        var tr = tbl.insertRow();
        var td = tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(document.createTextNode(bss.MEROPS_All_AA[i]));
        for (let j = 0; j < bss.Ratio_By_AA_And_Position[i].length; j++) {
            td = tr.insertCell();
            td.classList.add("withBorder");
            td.appendChild(document.createTextNode(bss.Ratio_By_AA_And_Position[i][j]));
        }
    }
    div.appendChild(tbl)
    document.getElementById("searchResults").appendChild(div);
    document.getElementById("searchResults").scrollIntoView();
}

function searchAllSequences() {
    const proteaseOfInterest = document.getElementById("ProteaseInterest").value;
    if (!proteaseOfInterest) {
        document.getElementById("ProteasesOfInterestEmptyWarning").style.display = "block";
        return;
    }
    if (competingProteasesList.length === 0) {
        document.getElementById("CompetingProteasesEmptyWarning").style.display = "block";
        return;
    }
    finalMinScore = document.getElementById("minPoiScore").value;
    if (finalMinScore == '') 
       finalMinScore = 0;
           
    finalMinSelec = document.getElementById("minPoiSelectivity").value;
    if (finalMinSelec == '')
       finalMinSelec = 0;

    document.getElementById("searchResults").innerHTML = "<hr/><h2>Results<h2>";

    const res = bss.Multiple_Calculations(competingProteasesList.concat([proteaseOfInterest]), proteaseOfInterest, finalMinScore, finalMinSelec, aminoAcidsToExclude);
    var div = document.createElement('div');

    if (res.combinations.length > 200) {
        let p = document.createElement('p');
        p.appendChild(document.createTextNode("It seems that you have generated a library of " + res.combinations.length + " sequences."));
        div.appendChild(p);
        p = document.createElement('p');
        p.appendChild(document.createTextNode("If you wish to reduce its size, you can try to:"));
        div.appendChild(p);
        let ul = document.createElement('ul');
        let li = document.createElement('li');
        li.appendChild(document.createTextNode("Increase the number of proteases to consider,"));
        ul.appendChild(li);
        li = document.createElement('li');
        li.appendChild(document.createTextNode("Increase the minimal amino acid selectivity of your protease of interest,"));
        ul.appendChild(li);
        li = document.createElement('li');
        li.appendChild(document.createTextNode("Increase the minimal amino acid score of your protease of interest,"));
        ul.appendChild(li);
        li = document.createElement('li');
        li.appendChild(document.createTextNode("Exclude amino acids from the calculation."));
        ul.appendChild(li);
        div.appendChild(ul);
    }

    var h3 = document.createElement('h3');
    h3.appendChild(document.createTextNode("Summary of results"));
    div.appendChild(h3);
    var tbl = document.createElement('table');
    div.appendChild(tbl);
    tbl.style.width = '1000px';
    tbl.classList.add("withBorder");

    var colnames = ["", "P4", "P3", "P2", "P1", "P1'", "P2'", "P3'", "P4'"];
    var tr = tbl.insertRow();
    colnames.forEach(value => {
        let th = document.createElement("th");
        th.classList.add("withBorder");
        th.appendChild(document.createTextNode(value));
        tr.appendChild(th);
    })
    var rownames = ["Sequence", "S<sub>norma, POI</sub>"];
    for (let j = 0; j < res.AA_Changed[0].length; j++) {
        for (let i = 0; i < res.AA_Changed.length; i++) {
            var tr = tbl.insertRow();
            var td = tr.insertCell();
            td.classList.add("withBorder");
            td.appendChild(createElementFromHTML(rownames[i]));
            for (let k = 0; k < res.AA_Changed[i][j].length; k++) {
                td = tr.insertCell();
                td.classList.add("withBorder");
                td.appendChild(document.createTextNode(res.AA_Changed[i][j][k]));
            }
        }
    }

    h3 = document.createElement('h3');
    h3.appendChild(document.createTextNode("Detailed results"));
    div.appendChild(h3);
    tbl = document.createElement('table');
    tbl.style.width = '900px';
    tbl.classList.add("withBorder");
    div.appendChild(tbl);

    var tr = tbl.insertRow();
    colnames.forEach(value => {
        let th = document.createElement("th");
        th.classList.add("withBorder");
        th.appendChild(document.createTextNode(value));
        tr.appendChild(th);
    })
    rownames = ["Sequence", "Selectivity", "Closest Protease", "S<sub>norma, POI</sub>"];
    for (let i = 0; i < res.Final_Result_LOOP.length; i++) {
        var tr = tbl.insertRow();
        var td = tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(createElementFromHTML(rownames[i%rownames.length]));
        for (let j = 0; j < res.Final_Result_LOOP[i].length; j++) {
            let td = tr.insertCell();
            td.classList.add("withBorder");
            let data = i%rownames.length == 2 ? res.Final_Result_LOOP[i][j].split(proteaseSeparatorChar)[0] : res.Final_Result_LOOP[i][j];
            td.appendChild(document.createTextNode(data));
        }
    }

    function displayPossibleCombinations(limitToFirst200) {
        let details = document.createElement('details');
        let summary = document.createElement('summary');
        h3 = document.createElement('h3');
        h3.appendChild(document.createTextNode(limitToFirst200 ? "First 200 possible combinations" : "Possible combinations"));
        summary.appendChild(h3);
        details.appendChild(summary);
        tbl = document.createElement('table');
        tbl.style.width = '900px';
        tbl.classList.add("withBorder");

        colnames = ["Id", "P4", "P3", "P2", "P1", "P1'", "P2'", "P3'", "P4'", "S<sub>seq</sub>"];
        var tr = tbl.insertRow();
        colnames.forEach(value => {
            let th = document.createElement("th");
            th.classList.add("withBorder");
            th.appendChild(createElementFromHTML(value));
            tr.appendChild(th);
        })
        const numRows = limitToFirst200 ? Math.min(res.combinations.length, 200) : res.combinations.length;
        for (let i = 0; i < numRows; i++) {
            var tr = tbl.insertRow();
            let td = tr.insertCell();
            td.classList.add("withBorder");
            td.appendChild(document.createTextNode(i+1));
            for (let j = 0; j < res.combinations[i].length; j++) {
                let td = tr.insertCell();
                td.classList.add("withBorder");
                td.appendChild(document.createTextNode(res.combinations[i][j]));
            }
        }
        details.appendChild(tbl);
        details.open = true;
        div.appendChild(details);
        return details;
    }

    if (res.combinations.length <= 200) {
        displayPossibleCombinations(false);
    } else {
        let details = displayPossibleCombinations(true);
        let button = document.createElement('button');
        button.style.fontSize = "24px";
        button.appendChild(document.createTextNode(`Display all ${res.combinations.length} possible combinations`));
        button.onclick = () => {
            div.removeChild(details);
            div.removeChild(button);
            displayPossibleCombinations(false);
        }
        div.appendChild(button);
    }

    document.getElementById("searchResults").appendChild(div);
    document.getElementById("searchResults").scrollIntoView();
}

function startPsc() {
    let hasAminoAcidSelected = false;
    let hasError = false;
    for (let i = 1; i <= 8; i++) {
        if (document.getElementById(`AA${i}`).value !== '') {
            hasAminoAcidSelected = true;
        }
    }
    if (!hasAminoAcidSelected) {
        document.getElementById("AminoAcidsEmptyWarning").style.display = "block";
        hasError = true;
    }
    if (proteaseToConsiderPsc.length === 0) {
        document.getElementById("ProteasesToConsiderPscEmptyWarning").style.display = "block";
        hasError = true;
    }
    if (hasError) {
        return;
    }

    let stc = [];
    for (let i = 1; i <= 8; i++) {
        stc.push(document.getElementById("AA" + i).value);
    }
    psc.The_Calculation(proteaseToConsiderPsc, stc, 'C');

    document.getElementById("searchResults").innerHTML = "<hr/><h2>Results<h2>";
    var tbl = document.createElement('table');
    tbl.style.width = '1000px';
    tbl.classList.add("withBorder");

    colnames = ["", "P4", "P3", "P2", "P1", "P1'", "P2'", "P3'", "P4'", "Mean"];
    var tr = tbl.insertRow();
    colnames.forEach(value => {
        let th = document.createElement("th");
        th.classList.add("withBorder");
        th.appendChild(document.createTextNode(value));
        tr.appendChild(th);
    })
    const rownames = ["Sequence", "Highest S<sub>norma</sub>", "Closest Protease", "Lowest S<sub>norma</sub>", "Farthest Protease"];
    let rowsToDisplay = proteaseToConsiderPsc.length == 1 ? 1 : psc.Final_Result.length;
    for (let i = 0; i < rowsToDisplay; i++) {
        var tr = tbl.insertRow();
        var td = i == 0 ? document.createElement("th") : tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(createElementFromHTML(rownames[i]));
        if (i == 0) {
            tr.appendChild(td);
        }
        for (let j = 0; j < psc.Final_Result[i].length; j++) {
            let td = i == 0 ? document.createElement("th") : tr.insertCell();
            td.classList.add("withBorder");
            let data = i == 2 || i == 4 ? psc.Final_Result[i][j].split(proteaseSeparatorChar)[0] : psc.Final_Result[i][j];
            td.appendChild(document.createTextNode(data));
            if (i == 0) {
                tr.appendChild(td);
            }
        }
    }

     for (let i = 0; i < proteaseToConsiderPsc.length; i++) {
        var tr = tbl.insertRow();
        var td = tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(document.createTextNode(proteaseToConsiderPsc[i].split(proteaseSeparatorChar)[0]));
        for (let j = 0; j < psc.Values_By_Protease_And_Position[i].length; j++) {
            td = tr.insertCell();
            td.classList.add("withBorder");
            td.appendChild(document.createTextNode(psc.Values_By_Protease_And_Position[i][j]));
        }
        var td = tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(document.createTextNode(psc.Mean_By_Proteases[i]));
    }
    document.getElementById("searchResults").appendChild(tbl);
    document.getElementById("searchResults").scrollIntoView();
}
