let bss = new BestSequenceSearch();
let psc = new ProteaseScoreCalculation();
let proteaseList = [];
let proteaseToConsiderBss = [];
let proteaseToConsiderPsc = [];
let aminoAcidsToExclude = [];

//document.getElementById("csvFileBss").addEventListener("change", handleFileSelectBss);
document.getElementById("searchBestSequence").addEventListener("click", searchBestSequence);
document.getElementById("searchAllSequences").addEventListener("click", searchAllSequences);
document.getElementById("StartPsc").addEventListener("click", startPsc);

parseCSV(meropsData);

$(".chosen-select").chosen();
$("#ProteasesToConsiderBss").chosen().change(onProteasesToConsiderBssChanged);
$("#ProteasesToConsiderPsc").chosen().change(onProteasesToConsiderPscChanged);
$("#AminoAcidsToExclude").chosen().change(onAminoAcidsToExcludeChanged);
document.getElementById("AminoAcidsToExclude").value = null;
$('#AminoAcidsToExclude').trigger('chosen:updated');

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
    document.getElementById("csvLoadFileText").innerText = "Reload CSV File"
}

function updateProteaseDropdown() {
    const proteasesBss = document.getElementById("ProteasesToConsiderBss");
    const proteasesPsc = document.getElementById("ProteasesToConsiderPsc");

    bss.Proteases_List.forEach(protease => {
        var opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteasesBss.appendChild(opt);

        opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteasesPsc.appendChild(opt);
    })
    $('#ProteasesToConsiderBss').trigger('chosen:updated');
    $('#ProteasesToConsiderPsc').trigger('chosen:updated');
}

function onProteasesToConsiderBssChanged(evt, params) {
    if (params.selected) {
        proteaseToConsiderBss.push(params.selected);
        document.getElementById("ProteasesToConsiderBssEmptyWarning").style.display = "none";
    }
    if (params.deselected) {
        const index = proteaseToConsiderBss.indexOf(params.deselected);
        if (index > -1) {
          proteaseToConsiderBss.splice(index, 1);
        }
    }
    const proteaseInterest = document.getElementById("ProteaseInterest");
    let oldValue = proteaseInterest.value;
    proteaseInterest.innerHTML = "";
    proteaseToConsiderBss.forEach(protease => {
        var opt = document.createElement('option');
        opt.value = protease;
        opt.innerHTML = protease;
        proteaseInterest.appendChild(opt);
    })
    if (proteaseToConsiderBss.includes(oldValue)) {
        proteaseInterest.value = oldValue;
    }
    $('#ProteaseInterest').trigger('chosen:updated');
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

function searchBestSequence() {
    if (proteaseToConsiderBss.length === 0) {
        document.getElementById("ProteasesToConsiderBssEmptyWarning").style.display = "block";
        return;
    }

    const proteaseOfInterest = document.getElementById("ProteaseInterest").value;
    finalMinScore = document.getElementById("minPoiScore").value;
    if (finalMinScore == '') 
       finalMinScore = 0;
           
    finalMinSelec = document.getElementById("minPoiSelectivity").value;
    if (finalMinSelec == '')
       finalMinSelec = 0;
    const res = bss.The_Calculation(proteaseToConsiderBss, proteaseOfInterest, finalMinScore, finalMinSelec, aminoAcidsToExclude);
    
    document.getElementById("searchResults").innerHTML = "<hr/><h2>Results<h2>";
    
    div = document.createElement('div');
    h3 = document.createElement('h3');
    h3.appendChild(document.createTextNode("Best sequence"));
    div.appendChild(h3);

    var tbl = document.createElement('table');
    tbl.style.width = '1000px';
    tbl.classList.add("withBorder");

    const rownames = ["Sequence", "Selectivity", "Closest Protease", "Score at the protease of interest"];
    for (let i = 0; i < res.length; i++) {
        var tr = tbl.insertRow();
        var td = i == 0 ? document.createElement("th") : tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(document.createTextNode(rownames[i]));
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
    h3.appendChild(document.createTextNode("Score per amino acid"));
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
    if (proteaseToConsiderBss.length === 0) {
        document.getElementById("ProteasesToConsiderBssEmptyWarning").style.display = "block";
        return;
    }

    const proteaseOfInterest = document.getElementById("ProteaseInterest").value;
    finalMinScore = document.getElementById("minPoiScore").value;
    if (finalMinScore == '') 
       finalMinScore = 0;
           
    finalMinSelec = document.getElementById("minPoiSelectivity").value;
    if (finalMinSelec == '')
       finalMinSelec = 0;

    document.getElementById("searchResults").innerHTML = "<hr/><h2>Results<h2>";

    const res = bss.Multiple_Calculations(proteaseToConsiderBss, proteaseOfInterest, finalMinScore, finalMinSelec, aminoAcidsToExclude);

    if (res.combinations.length > 200) {
        div = document.createElement('div');
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
        document.getElementById("searchResults").appendChild(div);
    }

    var div = document.createElement('div');
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
    var rownames = ["Sequence", "Score"];
    for (let j = 0; j < res.AA_Changed[0].length; j++) {
        for (let i = 0; i < res.AA_Changed.length; i++) {
            var tr = tbl.insertRow();
            var td = tr.insertCell();
            td.classList.add("withBorder");
            td.appendChild(document.createTextNode(rownames[i]));
            for (let k = 0; k < res.AA_Changed[i][j].length; k++) {
                td = tr.insertCell();
                td.classList.add("withBorder");
                td.appendChild(document.createTextNode(res.AA_Changed[i][j][k]));
            }
        }
    }
    document.getElementById("searchResults").appendChild(div);

    div = document.createElement('div');
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
    rownames = ["Sequence", "Selectivity", "Closest Protease", "Score at the protease of interest"];
    for (let i = 0; i < res.Final_Result_LOOP.length; i++) {
        var tr = tbl.insertRow();
        var td = tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(document.createTextNode(rownames[i%rownames.length]));
        for (let j = 0; j < res.Final_Result_LOOP[i].length; j++) {
            let td = tr.insertCell();
            td.classList.add("withBorder");
            let data = i%rownames.length == 2 ? res.Final_Result_LOOP[i][j].split(proteaseSeparatorChar)[0] : res.Final_Result_LOOP[i][j];
            td.appendChild(document.createTextNode(data));
        }
    }
    document.getElementById("searchResults").appendChild(div);

    div = document.createElement('div');
    h3 = document.createElement('h3');
    h3.appendChild(document.createTextNode("Possible combinations"));
    div.appendChild(h3);
    tbl = document.createElement('table');
    tbl.style.width = '900px';
    tbl.classList.add("withBorder");
    div.appendChild(tbl);
    
    colnames = ["Id", "P4", "P3", "P2", "P1", "P1'", "P2'", "P3'", "P4'", "Score"];
    var tr = tbl.insertRow();
    colnames.forEach(value => {
        let th = document.createElement("th");
        th.classList.add("withBorder");
        th.appendChild(document.createTextNode(value));
        tr.appendChild(th);
    })
    for (let i = 0; i < res.combinations.length; i++) {
        var tr = tbl.insertRow();
        for (let j = 0; j < res.combinations[i].length; j++) {
            let td = tr.insertCell();
            td.classList.add("withBorder");
            td.appendChild(document.createTextNode(res.combinations[i][j]));
        }
    }
    document.getElementById("searchResults").appendChild(div);
    document.getElementById("searchResults").scrollIntoView();
}

function startPsc() {
    if (proteaseToConsiderPsc.length === 0) {
        document.getElementById("ProteasesToConsiderPscEmptyWarning").style.display = "block";
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

    const rownames = ["", "Highest Score", "Closest Protease", "Lowest Score", "Farthest Protease"];
    let rowsToDisplay = proteaseToConsiderPsc.length == 1 ? 1 : psc.Final_Result.length;
    for (let i = 0; i < rowsToDisplay; i++) {
        var tr = tbl.insertRow();
        var td = i == 0 ? document.createElement("th") : tr.insertCell();
        td.classList.add("withBorder");
        td.appendChild(document.createTextNode(rownames[i]));
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
