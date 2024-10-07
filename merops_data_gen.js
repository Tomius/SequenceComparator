class AsyncSemaphore {
  constructor(workersCount) {
    if (workersCount <= 0) throw new Error("workersCount must be positive");
    this.workersCount = workersCount;
    this._available = workersCount;
    this._upcoming = [];
    this._heads = [];
    this._refreshComplete();
  }

  async withLock(f) {
    await this._acquire();
    return this._execWithRelease(f);
  }

  async withLockRunAndForget(f) {
    await this._acquire();
    // Ignoring returned promise on purpose!
    this._execWithRelease(f);
  }

  async awaitTerminate() {
    if (this._available < this.workersCount) {
      return this._completePr;
    }
  }

  async _execWithRelease(f) {
    try {
      return await f();
    } finally {
      this._release();
    }
  }

  _queue() {
    if (!this._heads.length) {
      this._heads = this._upcoming.reverse();
      this._upcoming = [];
    }
    return this._heads;
  }

  _acquire() {
    if (this._available > 0) {
      this._available -= 1;
      return undefined;
    } else {
      let fn = () => {/***/};
      const p = new Promise(ref => { fn = ref });
      this._upcoming.push(fn);
      return p;
    }
  }

  _release() {
    const queue = this._queue();
    if (queue.length) {
      const fn = queue.pop();
      if (fn) fn();
    } else {
      this._available += 1;

      if (this._available >= this.workersCount) {
        const fn = this._completeFn;
        this._refreshComplete();
        fn();
      }
    }
  }

  _refreshComplete() {
    let fn = () => {/***/};
    this._completePr = new Promise(r => { fn = r });
    this._completeFn = fn;
  }
}


const throttler = new AsyncSemaphore(32);
const MaxRetryCount = 10;
var failedToQuery = 0;

function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

async function fetchRetry(...args) {
  let count = MaxRetryCount;
  while(count > 0) {
    try {
    	let response = await throttler.withLock(() => fetch(...args));
    	if (response.status >= 200 && response.status < 300) {
			return response;
		} else {
			console.error(`Non success response code ${response.status}`);
		}
    } catch(error) {
      console.error(error);
    }

    await sleep(200)

    count -= 1;
  }

  failedToQuery = failedToQuery + 1;
  document.getElementById('FailedToQuery').innerText = failedToQuery;
  console.error(`Too many retries for fetch(${args.join(",")})`);
}

let meropsDiscoveryLink = "https://www.ebi.ac.uk/merops/cgi-bin/name_index?id=P;action="

let pages = []
for(let x = 'A'; x <= 'Z'; x=String.fromCharCode(x.charCodeAt(0)+1)) {
	pages.push(x);
}
pages.push('1');
document.getElementById('ProteaseListMax').innerText = pages.length;

let proteaseDict = {};
let proteaseListCurrent = 0;

let proteaseListPromises = pages.map(page => {
	const url = 'https://corsproxy.io/?' + encodeURIComponent(meropsDiscoveryLink + page);
	return fetchRetry(url, {mode: 'cors'})
	.then(response => {
		if (response.status >= 200 && response.status < 300) {
			return response.text()
		} else {
			throw new Error(`Non success response code ${response.status}`);
		}
	})
    .then(html => {
    	proteaseListCurrent += 1;
    	document.getElementById('ProteaseListCurrent').innerText = proteaseListCurrent;

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
			    let mainName = cols[1].innerText;
			    let link = cols[2].childNodes[0].getAttribute('href');
			    if (proteaseDict[mainName] === undefined) {
			    	proteaseDict[mainName] = 
			    	{
			    		"link": "https://www.ebi.ac.uk" + link,
			    		"names": [name]
			    	}
			    } else {
			    	proteaseDict[mainName].names.push(name);
			    }
			}
		}
    });
});

Promise.all(proteaseListPromises).then(x => {
	console.log("Done querying the list of proteases");
	let proteaseDataMax = 0;
	let proteaseDataCurrent = 0;
	let dataFound = 0;
	let dataMissing = 0;
	for (let mainName in proteaseDict) {
	    if (Object.prototype.hasOwnProperty.call(proteaseDict, mainName)) {
	    	proteaseDataMax += 1;
	    }
	}
	document.getElementById('ProteaseDataMax').innerText = proteaseDataMax;
	
	// Variable to store the final csv data
	let csv_data = [];
	let promises = []
	for (let mainNameVar in proteaseDict) {
		const mainName = mainNameVar;
	    if (Object.prototype.hasOwnProperty.call(proteaseDict, mainName)) {
	        const url = 'https://corsproxy.io/?' + encodeURIComponent(proteaseDict[mainName].link);
			promises.push(
				fetchRetry(url, {mode: 'cors', signal: AbortSignal.timeout(60000) })
				.then(response => {
					if (response.status >= 200 && response.status < 300) {
						return response.text()
					} else {
						throw new Error(`Non success response code ${response.status}`);
					}
				})
			    .then(html => {
			    	proteaseDataCurrent += 1;
    				document.getElementById('ProteaseDataCurrent').innerText = proteaseDataCurrent;

			    	let parsed = jQuery.parseHTML(html);
					const table = $(parsed).find('table[summary="matrix"]')[0];
					if (table) {
						dataFound = dataFound + 1;
						document.getElementById('DataFound').innerText = dataFound;
						// Variable to store the final csv data
						csv_data.push(proteaseDict[mainName].names.join(","));

						// Get each row data
						let rows = table.getElementsByTagName('tr');
						for (let i = 0; i < rows.length; i++) {

						    // Get each column data
						    let cols = rows[i].querySelectorAll('td,th');

						    // Stores each csv row data
						    let csvrow = [];
						    for (let j = 0; j < cols.length; j++) {

						        // Get the text data of each cell of
						        // a row and push it to csvrow
						        csvrow.push(cols[j].innerHTML);
						    }

						    // Combine each column value with comma
						    csv_data.push(csvrow.join(","));
						}
						console.log(csv_data);
					} else {
						dataMissing = dataMissing + 1;
						document.getElementById('DataMissing').innerText = dataMissing;
						console.log(`No table found on ${proteaseDict[mainName].link}`);
					}
			  	})
		  	);
	    }
	}

	Promise.all(promises).then(x => {
		console.log("Done fetching all the data - generating csv now");

		// Combine each row data with new line character
		csv_data = csv_data.join('\n');

		CSVFile = new Blob([csv_data], { type: "text/csv" });

		// Create to temporary link to initiate
		// download process
		let temp_link = document.createElement('a');

		// Download csv file
		temp_link.download = "merops_data.csv";
		let url = window.URL.createObjectURL(CSVFile);
		temp_link.href = url;

		// This link should not be displayed
		temp_link.style.display = "none";
		document.body.appendChild(temp_link);

		// Automatically click the link to trigger download 
		temp_link.click();
		document.body.removeChild(temp_link);
	});
});