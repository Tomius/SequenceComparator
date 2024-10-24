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

String.prototype.removeNewLinesAndTabsInsideQuotes = function () {
	var tmp = this.split('');
	let isInsideQuote = false;
	let escapeNextChar = false;
	for (let i = 0; i < tmp.length; i++) {
	  if (tmp[i] === "'" && !escapeNextChar) {
	  	isInsideQuote = !isInsideQuote;
	  } else if ((tmp[i] === "\n" || tmp[i] === "\r" || tmp[i] === "\t") && isInsideQuote) {
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
	.removeNewLinesAndTabsInsideQuotes()
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
})
.then(x => {
		const Raw_CSV = meropsDataFromTheWebsite.split('\n').map(line => line.split(';'));

	  for (let a = 0; a < Math.floor(Raw_CSV.length / 22); a++) {
	  		let id = Raw_CSV[22 * a];
	  		if (resultMatrix[id] === undefined) {
	  			console.error(`Did not find ${id} in resultMatrix`);
	  			continue;
	  		}
	      const values = Raw_CSV.slice(22 * a + 2, 22 * (a + 1));
	      for (let aaIdx = 0; aaIdx < 20; ++aaIdx) {
	      	let aa = values[aaIdx][0];
		      for (let i = 0; i < 8; ++i) {
		      	let websiteValue = values[aaIdx][i+1];
		      	if (resultMatrix[id][i] === undefined) {
		      		resultMatrix[id][i] = {};
		      	}
		      	if (resultMatrix[id][i][aa] === undefined) {
		      		resultMatrix[id][i][aa] = 0;
		      	}
		      	let sqlValue = resultMatrix[id][i][aa];
		      	if (sqlValue > websiteValue) {
		      		alert(`Sql value ${sqlValue} is greater than website value ${websiteValue} for (${id}, ${aa}, idx=${i})`);
		      	}
		      	resultMatrix[id][i][aa] = Math.max(websiteValue, sqlValue);
		      }
		    }
	  }
	}
);

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

function lowerCaseCompare(a, b) {
  if (a.toLowerCase() < b.toLowerCase()) {
    return -1;
  }
  if (a.toLowerCase() > b.toLowerCase()) {
    return 1;
  }
  return 0;
}

function mainNameCompare(a, b) {
  if (a.mainName.toLowerCase() < b.mainName.toLowerCase()) {
    return -1;
  }
  if (a.mainName.toLowerCase() > b.mainName.toLowerCase()) {
    return 1;
  }
  return 0;
}

Promise.all(promisesToAwait).then(x => {
	let proteaseData = [];
	for (let proteaseId in resultMatrix) {
    if (Object.prototype.hasOwnProperty.call(resultMatrix, proteaseId)) {
    	if (proteaseDict[proteaseId] !== undefined) {
    		let proteaseInfo = proteaseDict[proteaseId]
    		let alternativeNames = proteaseInfo.names.filter(x => x !== proteaseInfo.mainName).sort(lowerCaseCompare);
    		let listOfNames = 
    			alternativeNames.length === 0 ?
    			`${proteaseInfo.mainName};${proteaseId}` :
    			`${proteaseInfo.mainName};${proteaseId};${alternativeNames.join(";")}`;
    		proteaseData.push({ 
    			"id": proteaseId,
    			"mainName": proteaseInfo.mainName,
    			"names": listOfNames
    		})
    	}
    }
  };

  proteaseData = proteaseData.sort(mainNameCompare);
   
  let csv_data = [];
 	proteaseData.forEach(proteaseInfo => { 
 		let sumReferences = 0;
		for (let i = 0; i < 8; ++i) {
			aminoAcidsToConsider.forEach(aa => {
				if (resultMatrix[proteaseInfo.id][i] && resultMatrix[proteaseInfo.id][i][aa]) {
					sumReferences += Number(resultMatrix[proteaseInfo.id][i][aa])
				}
			});
		}
		if (sumReferences < 64) {
			return;
		}

		csv_data.push(proteaseInfo.names);
		csv_data.push("Amino acid;P4;P3;P2;P1;P1';P2';P3';P4'");
		
		aminoAcidsToConsider.forEach(aa => {
			line = [aa]
			for (let i = 0; i < 8; ++i) {
				if (resultMatrix[proteaseInfo.id][i] === undefined || 
					resultMatrix[proteaseInfo.id][i][aa] === undefined) {
					line.push(0)
				} else {
					line.push(resultMatrix[proteaseInfo.id][i][aa])
				}
			}
			csv_data.push(line.join(";"))
		});
	});

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