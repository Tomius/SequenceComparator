let url = "https://ftp.ebi.ac.uk/pub/databases/merops/current_release/database_files/Substrate_search.txt";
let aminoAcidsToConsider = ['Gly','Pro','Ala','Val','Leu','Ile','Met','Phe','Tyr','Trp','Ser','Thr','Cys','Asn','Gln','Asp','Glu','Lys','Arg','His'];

const MaxRetryCount = 2;

async function fetchRetry(...args) {
  let count = MaxRetryCount;
  while(count > 0) {
    try {
    	let response = await fetch(...args);
    	if (response.status >= 200 && response.status < 300) {
			return response.text();
		} else {
			console.error(`Non success response code ${response.status}`);
		}
    } catch(error) {
      console.error(error);
    }

    count -= 1;
  }

  throw new Error(`Too many retries for fetch(${args.join(",")})`);
}

String.prototype.removeNewLinesInsideQuotes = function () {
	var tmp = this.split('');
	let isInsideQuote = false;
	let escapeNextChar = false;
	for (let i = 0; i < tmp.length; i++) {
	  if (tmp[i] === "'" && !escapeNextChar) {
	  	isInsideQuote = !isInsideQuote;
	  } else if ((tmp[i] === "\n" || tmp[i] === "\r") && isInsideQuote) {
	  	tmp[i] = " ";
	  } 
	  
	  escapeNextChar = tmp[i] === "\\";
	}
	return tmp.join('');
}

var resultMatrix = {}

let getResultsMatrix = fetchRetry(url)
.then(html => {
	html
	.removeNewLinesInsideQuotes()
	.split('\n')
	.forEach(line => {
		let values = line.split('\t');
		if (values[1] === undefined) {
			return;
		}
		let proteaseId = values[1].replace(/^'(.*)'$/, '$1');
		let aas = values.slice(4, 4+8).map(aa => aa.replace(/^'(.*)'$/, '$1'));
		if (resultMatrix[proteaseId] === undefined) {
			resultMatrix[proteaseId] = [];
		}
		for (let i = 0; i < 8; ++i) {
			if (!aminoAcidsToConsider.includes(aas[i])) {
				continue;
			}
			if (resultMatrix[proteaseId][i] === undefined) {
				resultMatrix[proteaseId][i] = {};
			}
			if (resultMatrix[proteaseId][i][aas[i]] === undefined) {
				resultMatrix[proteaseId][i][aas[i]] = 0;
			}
			resultMatrix[proteaseId][i][aas[i]]++
		}
	})
});

let meropsDiscoveryLink = "https://www.ebi.ac.uk/merops/cgi-bin/name_index?id=P;action="

let pages = []
for(let x = 'A'; x <= 'Z'; x = String.fromCharCode(x.charCodeAt(0)+1)) {
	pages.push(x);
}
pages.push('1');

let proteaseDict = {};

let promisesToAwait = pages.map(page => {
	const url = 'https://corsproxy.io/?' + encodeURIComponent(meropsDiscoveryLink + page);
	return fetchRetry(url)
    .then(html => {
    	let parsed = jQuery.parseHTML(html);
		const table = $(parsed).find('table')[0];
		if (table) {
			let csv_data = [];

			// Get each row data
			let rows = table.getElementsByTagName('tr');
			for (let i = 0; i < rows.length; i++) {

			    // Get each column data
			    let cols = rows[i].querySelectorAll('td');
			    if (cols.length === 0) continue;

			    // Stores each csv row data
			    let name = cols[0].innerText;
			    if (name === "EC ") {
			    	continue;
			    }
			    let mainName = cols[1].innerText;
			    let link = cols[2].childNodes[0].getAttribute('href');
			    let id = link.split("id=")[1].split(";")[0]
			    if (proteaseDict[id] === undefined) {
			    	proteaseDict[id] = 
			    	{
			    		"mainName": mainName,
			    		"names": [name]
			    	}
			    } else {
			    	proteaseDict[id].names.push(name);
			    }
			}
		}
    });
});

promisesToAwait.push(getResultsMatrix);

Promise.all(promisesToAwait).then(x => {
	let csv_data = [];
	for (let proteaseId in resultMatrix) {
	    if (Object.prototype.hasOwnProperty.call(resultMatrix, proteaseId)) {
	    	if (proteaseDict[proteaseId] !== undefined) {
	    		let proteaseInfo = proteaseDict[proteaseId]
	    		let alternativeNames = proteaseInfo.names.filter(x => x !== proteaseInfo.mainName);
	    		if (alternativeNames.length === 0) {
					csv_data.push(proteaseInfo.mainName);
	    		} else {
	    			csv_data.push(`${proteaseInfo.mainName};${alternativeNames.join(";")}`);
	    		}
	    		
	    		csv_data.push("Amino acid;P4;P3;P2;P1;P1';P2';P3';P4'")
	    		aminoAcidsToConsider.forEach(aa => {
	    			line = [aa]
	    			for (let i = 0; i < 8; ++i) {
	    				if (resultMatrix[proteaseId][i] === undefined || 
	    					resultMatrix[proteaseId][i][aa] === undefined) {
	    					line.push(0)
	    				} else {
	    					line.push(resultMatrix[proteaseId][i][aa])
	    				}
	    			}
	    			csv_data.push(line.join(";"))
	    		})
	    	}
	    }
	}
	// Combine each row data with new line character
	csv_data = "var meropsData = `" + csv_data.join('\n') + "`;\n";

	CSVFile = new Blob([csv_data], { type: "text/javascript" });

	// Create to temporary link to initiate
	// download process
	let temp_link = document.createElement('a');

	// Download csv file
	temp_link.download = "merops_data.js";
	let url = window.URL.createObjectURL(CSVFile);
	temp_link.href = url;

	// This link should not be displayed
	temp_link.style.display = "none";
	document.body.appendChild(temp_link);

	// Automatically click the link to trigger download 
	temp_link.click();
	document.body.removeChild(temp_link);
});