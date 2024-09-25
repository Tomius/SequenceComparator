class ProteaseScoreCalculation {
    constructor() {
        this.MEROPS_Proteases_List = [];
        this.MEROPS_All_AA = ['Gly', 'Pro', 'Ala', 'Val', 'Leu', 'Ile', 'Met', 'Phe', 'Tyr', 'Trp', 'Ser', 'Thr', 'Cys', 'Asn', 'Gln', 'Asp', 'Glu', 'Lys', 'Arg', 'His'];
        this.MEROPS_Raw_Values = [];
        this.MEROPS_Normalised_Values = [];
        this.Proteases_List = [];
        this.Index_PTC = [];
        this.Index_STC = [];
        this.Final_Result = [];
        this.Values_By_Protease_And_Position = [];
        this.Mean_By_Proteases = [];
        this.Final_Protease = '';
        this.Final_Protease_Mean = 0;
    }

    Translate_File(csvContent) {
        const Raw_CSV = csvContent.split('\n').map(line => line.split(';'));
        this.MEROPS_Raw_Values = Raw_CSV.slice(2, 22).map(row => row.slice(1));
        this.MEROPS_Proteases_List = [Raw_CSV[0][0]];

        for (let a = 0; a < Math.floor(Raw_CSV.length / 22) - 1; a++) {
            const Loop1_Values = Raw_CSV.slice(22 * (a + 1) + 2, 22 * (a + 2)).map(row => row.slice(1));
            this.MEROPS_Raw_Values.push(...Loop1_Values);

            const Loop2_Proteases = Raw_CSV[22 * (a + 1)][0];
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

        this.MEROPS_Normalised_Values = this.MEROPS_Raw_Values.map((array, i) => {
            var res = [];
            for(var j = 0; j < array.length; ++j) {
                res.push([]) 
                for(var k = 0; k < array[j].length; ++k) { 
                    res[j].push(sum_axis_1[i][k] != 0 ? (array[j][k] * 100) / sum_axis_1[i][k] : 0); 
                }; 
            };
            return res; 
        });

        this.Proteases_List = [...this.MEROPS_Proteases_List];
        this.AA_List = [...this.MEROPS_MEROPS_All_AAProteases_List];
    }

    Indexation(PTC, STC) {
        this.Index_PTC = PTC.map(p => this.MEROPS_Proteases_List.indexOf(p));
        this.Index_STC = STC.map(p => this.MEROPS_All_AA.indexOf(p));
    }

    The_Calculation(PTC, STC, ValueFC) {
        this.Indexation(PTC, STC);
        
        this.Final_Result = Array.from({ length: 3 }, () => new Array(9).fill(''));
        this.Values_By_Protease_And_Position = Array.from({ length: this.Index_PTC.length }, () => new Array(8).fill(0));

        if (ValueFC === 'C') {
            let Max_By_Position = new Array(8).fill(0);
            let Closest_Protease_By_Position = new Array(8).fill('');

            for (let k = 0; k < 8; k++) {
                let Values_By_Proteases_At_Given_Position = this.MEROPS_Normalised_Values.map(row => row[this.Index_STC[k]][k]);

                let Increment = 0;
                for (let j = 0; j < this.MEROPS_Proteases_List.length; j++) {
                    if (this.Index_PTC.includes(j)) {
                        this.Values_By_Protease_And_Position[Increment][k] = Math.round(Values_By_Proteases_At_Given_Position[j] * 100) / 100;
                        Increment += 1;
                        if (Values_By_Proteases_At_Given_Position[j] > Max_By_Position[k]) {
                            Max_By_Position[k] = Values_By_Proteases_At_Given_Position[j];
                            Closest_Protease_By_Position[k] = this.MEROPS_Proteases_List[j];
                        }
                    }
                }
            }

            let Sum_By_Proteases = this.Values_By_Protease_And_Position.map(row => row.reduce((a, b) => a + b, 0));
            this.Mean_By_Proteases = Sum_By_Proteases.map(sum => sum / 8);
            let Closest_Protease_Mean = Math.max(...this.Mean_By_Proteases);
            let Closest_Protease = PTC[this.Mean_By_Proteases.indexOf(Closest_Protease_Mean)];

            this.Final_Result[0] = STC.slice(0, 8);
            this.Final_Result[1] = Max_By_Position.map(val => Math.round(val * 100) / 100).slice(0, 8);
            this.Final_Result[2] = Closest_Protease_By_Position.slice(0, 8);
            this.Final_Protease = Closest_Protease;
            this.Final_Protease_Mean = Closest_Protease_Mean;
            this.Final_Result[0][8] = "Closest Protease ↓";
            this.Final_Result[1][8] = Closest_Protease_Mean;
            this.Final_Result[2][8] = Closest_Protease;
            console.log("The closest protease is", this.Final_Protease, "with mean =", this.Final_Protease_Mean);
        } else {
            let Min_By_Position = new Array(8).fill(100);
            let Farthest_Protease_By_Position = new Array(8).fill('');

            for (let k = 0; k < 8; k++) {
                let Values_By_Proteases_At_Given_Position = this.MEROPS_Normalised_Values.map(row => row[this.Index_STC[k]][k]);

                let Increment = 0;
                for (let j = 0; j < this.MEROPS_Proteases_List.length; j++) {
                    if (this.Index_PTC.includes(j)) {
                        this.Values_By_Protease_And_Position[Increment][k] = Math.round(Values_By_Proteases_At_Given_Position[j] * 100) / 100;
                        Increment += 1;
                        if (Values_By_Proteases_At_Given_Position[j] < Min_By_Position[k]) {
                            Min_By_Position[k] = Values_By_Proteases_At_Given_Position[j];
                            Farthest_Protease_By_Position[k] = this.MEROPS_Proteases_List[j];
                        }
                    }
                }
            }

            let Sum_By_Proteases = this.Values_By_Protease_And_Position.map(row => row.reduce((a, b) => a + b, 0));
            this.Mean_By_Proteases = Sum_By_Proteases.map(sum => sum / 8);
            let Farthest_Protease_Mean = Math.min(...this.Mean_By_Proteases);
            let Farthest_Protease = PTC[this.Mean_By_Proteases.indexOf(Farthest_Protease_Mean)];

            this.Final_Result[0] = STC.slice(0, 8);
            this.Final_Result[1] = Min_By_Position.map(val => Math.round(val * 100) / 100).slice(0, 8);
            this.Final_Result[2] = Farthest_Protease_By_Position.slice(0, 8);
            this.Final_Protease = Farthest_Protease;
            this.Final_Protease_Mean = Farthest_Protease_Mean;
            this.Final_Result[0][8] = "Farthest Protease ↓";
            this.Final_Result[1][8] = Farthest_Protease_Mean;
            this.Final_Result[2][8] = Farthest_Protease;
            console.log("The farthest protease is", this.Final_Protease, "with mean =", this.Final_Protease_Mean);
        }
    }
}
