var proteaseSeparatorChar = " | ";

class BestSequenceSearch {
    constructor() {
        this.MEROPS_Proteases_List = [];
        this.MEROPS_All_AA = ['Gly','Pro','Ala','Val','Leu','Ile','Met','Phe','Tyr','Trp','Ser','Thr','Cys','Asn','Gln','Asp','Glu','Lys','Arg','His'].sort();
        this.MEROPS_Normalised_Values = [];
        this.MEROPS_Raw_Values = [];
        this.Proteases_List = [];
        this.Index_POI = '';
        this.Index_PTC = [];
        this.Final_Result = [];
        this.Ratio_By_AA_And_Position = [];
        this.Final_Result_LOOP = [];
        this.MaxNormalisedScore = [];
        this.MEROPS_Normalised_Values_Per_AA = [];
    }

    Translate_File(csvContent) {
        const Raw_CSV = csvContent.split('\n').map(line => line.split(';'));
        this.MEROPS_Raw_Values = [Raw_CSV.slice(2, 22).sort().map(row => row.slice(1))];
        this.MEROPS_Proteases_List = [Raw_CSV[0].join(proteaseSeparatorChar)];

        for (let a = 0; a < Math.floor(Raw_CSV.length / 22) - 1; a++) {
            const Loop1_Values = [Raw_CSV.slice(22 * (a + 1) + 2, 22 * (a + 2)).sort().map(row => row.slice(1))];
            this.MEROPS_Raw_Values = this.MEROPS_Raw_Values.concat(Loop1_Values);

            const Loop2_Proteases = Raw_CSV[22 * (a + 1)].join(proteaseSeparatorChar);
            this.MEROPS_Proteases_List.push(Loop2_Proteases);
        }

        this.MEROPS_Raw_Values = this.MEROPS_Raw_Values.map(array1 => array1.map(array2 => array2.map(val => Number(val))));

        const sum_axis_1 = this.MEROPS_Raw_Values.map(array => {
            var res = []; 
            for(var i = 0; i < array[0].length; ++i) { 
                var sum = 0; 
                for(var j = 0; j < array.length; ++j) { 
                    sum += array[j][i]; 
                }; 
                res.push(sum)
            }; 
            return res;
        });

        let maxValue = 0;
        this.MEROPS_Normalised_Values = this.MEROPS_Raw_Values.map((array, i) => {
            var res = [];
            for(var j = 0; j < array.length; ++j) {
                res.push([]) 
                for(var k = 0; k < array[j].length; ++k) { 
                    let value = sum_axis_1[i][k] != 0 ? (array[j][k] * 100) / sum_axis_1[i][k] : 0;
                    res[j].push(value);
                    if (value > maxValue) {
                        maxValue = value;
                    }
                }; 
            };
            return res; 
        });
        this.MaxNormalisedScore = Math.round(maxValue);

        for (let k = 0; k < 8; k++) {
            this.MEROPS_Normalised_Values_Per_AA[k] = this.MEROPS_Normalised_Values.map(row => row.map(pos => pos[k]));
        }


        this.Proteases_List = [...this.MEROPS_Proteases_List];
    }

    Indexation(PTC, POI) {
        this.Index_PTC = PTC.map(p => this.MEROPS_Proteases_List.indexOf(p));
        this.Index_POI = this.MEROPS_Proteases_List.indexOf(POI);
    }

    The_Calculation(PTC, POI, MinScore, MinSelec, AAExclude) {
        this.Indexation(PTC, POI);

        this.IndexAAExclude = AAExclude.map(aa => this.MEROPS_All_AA.indexOf(aa));
        this.Ratio_By_AA_And_Position = Array.from({ length: 20 }, () => Array(8).fill(0));
        let Max_By_Position = Array(8).fill(0);
        let Value_At_The_Protease_Of_Interest = Array(8).fill(0);
        let AA_By_Position = Array(8).fill('');
        let Closest_Protease_by_Position = Array(8).fill('');
        this.Final_Result = Array.from({ length: 4 }, () => Array(8).fill(''));

        for (let k = 0; k < 8; k++) {
            const Values_By_AA = this.MEROPS_Normalised_Values_Per_AA[k];
            let Max_By_AA = Array(20).fill(0);

            for (let i = 0; i < 20; i++) {
                if (this.IndexAAExclude.includes(i)) {
                    continue;
                }
                if (Values_By_AA[this.Index_POI][i] >= MinScore) {
                    for (let j = 0; j < this.MEROPS_Proteases_List.length; j++) {
                        if (j !== this.Index_POI && this.Index_PTC.includes(j)) {
                            if (Values_By_AA[j][i] > Max_By_AA[i]) {
                                Max_By_AA[i] = Values_By_AA[j][i];
                                var Closest_Protease_By_AA = this.MEROPS_Proteases_List[j];
                            }
                        }
                    }
                    this.Ratio_By_AA_And_Position[i][k] = Max_By_AA[i] !== 0 
                        ? +(Values_By_AA[this.Index_POI][i] * 100 / Max_By_AA[i]).toFixed(2)
                        : 0;

                    if (this.Ratio_By_AA_And_Position[i][k] > MinSelec) {
                        if (this.Ratio_By_AA_And_Position[i][k] > Max_By_Position[k]) {
                            Max_By_Position[k] = this.Ratio_By_AA_And_Position[i][k];
                            AA_By_Position[k] = this.MEROPS_All_AA[i];
                            Closest_Protease_by_Position[k] = Closest_Protease_By_AA;
                            Value_At_The_Protease_Of_Interest[k] = Values_By_AA[this.Index_POI][i];
                        }
                    }
                }
            }
        }

        this.Final_Result[0] = AA_By_Position;
        this.Final_Result[1] = Max_By_Position.map(val => val.toFixed(2));
        this.Final_Result[2] = Closest_Protease_by_Position;
        this.Final_Result[3] = Value_At_The_Protease_Of_Interest.map(val => val.toFixed(2));

        return this.Final_Result;
    }

    Multiple_Calculations(PTC, POI, inputMinScore, inputMinSelec, AAExclude) {
        this.Final_Result_LOOP = this.The_Calculation(PTC, POI, inputMinScore, inputMinSelec, AAExclude);

        let AA_Changed = Array.from({ length: 2 }, () => Array(1).fill(Array(8).fill('')));
        AA_Changed[0][0] = this.Final_Result_LOOP[0];
        AA_Changed[1][0] = this.Final_Result_LOOP[3];

        for (let MinScore = inputMinScore; MinScore < this.MaxNormalisedScore; MinScore++) {
            this.The_Calculation(PTC, POI, MinScore, inputMinSelec, AAExclude);

            if (this.Final_Result[1].some(val => val != 0.0)) {
                if (this.Final_Result[0].some((val, i) => val !== this.Final_Result_LOOP[this.Final_Result_LOOP.length - 4][i])) {
                    const index_change = this.Final_Result[0].map((val, i) => val !== this.Final_Result_LOOP[this.Final_Result_LOOP.length - 4][i] ? i : null).filter(i => i !== null);
                    for (let i of index_change) {
                        if (this.Final_Result[0][i] !== '') {
                            const first_empty_row = AA_Changed[0].findIndex(row => row[i] === '');
                            if (first_empty_row >= 0) {
                                AA_Changed[0][first_empty_row][i] = this.Final_Result[0][i];
                                AA_Changed[1][first_empty_row][i] = this.Final_Result[3][i];
                            } else {
                                const new_row = [Array(8).fill(''), Array(8).fill('')];
                                new_row[0][i] = this.Final_Result[0][i];
                                new_row[1][i] = this.Final_Result[3][i];
                                AA_Changed[0].push(new_row[0])
                                AA_Changed[1].push(new_row[1])
                            }
                        }
                    }
                    this.Final_Result_LOOP = this.Final_Result_LOOP.concat(this.Final_Result);
                }
            }
        }

        let combinations = []

        for (let a = 0; a < AA_Changed[0].length; a++) {
            for (let b = 0; b < AA_Changed[0].length; b++) {
                for (let c = 0; c < AA_Changed[0].length; c++) {
                    for (let d = 0; d < AA_Changed[0].length; d++) {
                        for (let e = 0; e < AA_Changed[0].length; e++) {
                            for (let f = 0; f < AA_Changed[0].length; f++) {
                                for (let g = 0; g < AA_Changed[0].length; g++) {
                                    for (let h = 0; h < AA_Changed[0].length; h++) {
                                        let new_sequence = [AA_Changed[0][a][0], AA_Changed[0][b][1], AA_Changed[0][c][2], AA_Changed[0][d][3], AA_Changed[0][e][4], AA_Changed[0][f][5], AA_Changed[0][g][6], AA_Changed[0][h][7]];
                                        if (new_sequence.every(val => val !== '')) {
                                            const mean_sequence = +((Number(AA_Changed[1][a][0]) + Number(AA_Changed[1][b][1]) + Number(AA_Changed[1][c][2]) + Number(AA_Changed[1][d][3]) + Number(AA_Changed[1][e][4]) + Number(AA_Changed[1][f][5]) + Number(AA_Changed[1][g][6]) + Number(AA_Changed[1][h][7])) / 8).toFixed(2);
                                            combinations.push([new_sequence, mean_sequence].flat());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        function compare(a, b) {
          if (a[8] < b[8]) {
            return -1;
          }
          if (a[8] > b[8]) {
            return 1;
          }
          return 0;
        }

        combinations = combinations.sort(compare);

        return {
            "AA_Changed": AA_Changed,
            "combinations": combinations,
            "Final_Result_LOOP": this.Final_Result_LOOP
        };
    }
}
