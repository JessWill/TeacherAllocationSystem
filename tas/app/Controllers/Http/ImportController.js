'use strict'

const Excel = require('exceljs');
const Helpers = use('Helpers')
const Academic = use("App/Models/Academic");
const Unit = use("App/Models/Unit");
const Allocation = use("App/Models/Allocation");
const Database = use('Database')

class UnitImport {
        constructor(code, name,  year, semester) {
            this.code = code
            this.name = name
            this.year = year
            this.semester = semester
        }
}

class AcademicImport {
    constructor(name, year, load, allocations) {
        this.name = name
        this.year = year
        this.load = load
        this.allocations = []
        if (allocations !== undefined) {
            this.allocations = allocations
        }
    }
    addAllocation(UnitImport, load) {
        this.allocations.push({UnitImport, load})
    }
    async save() {
        const ac = new Academic()
        ac.name = this.name
        ac.year = this.year
        ac.school = "Information Technology"
        ac.load = this.load
        await ac.save()
        if (this.allocations.length > 0) {
            this.allocations.forEach( ({UnitImport, load}) => {
                if (UnitImport.semester == "1 & 2") {
                    const al = new Allocation()
                    al.id = ac.id
                    al.unit_code = UnitImport.code
                    al.unit_year = UnitImport.year
                    al.unit_semester = 1
                    al.load = load
                    al.save()
                    const al2 = new Allocation()
                    al2.id = ac.id
                    al2.unit_code = UnitImport.code
                    al2.unit_year = UnitImport.year
                    al2.unit_semester = 2
                    al2.load = load
                    al2.save()
                } else {
                    const al = new Allocation()
                    al.id = ac.id
                    al.unit_code = UnitImport.code
                    al.unit_year = UnitImport.year
                    al.unit_semester = UnitImport.semester
                    al.load = load
                    al.save()
                }
            })
        }
    }
}

class ImportController {
    async uploadFile({request, response, view}) {
        const Alloc = request.file('Allocation', {
            size: '10mb'
        })
      
        await Alloc.move(Helpers.tmpPath('uploads'), {
            name: `uploadedData.xlsm`,
            overwrite: true
        })
       
        
        if (!Alloc.moved()) {
            return Alloc.error()
        }
        this.ReadWorksheet()
    }



    async ReadWorksheet() {

        const workbook = new Excel.Workbook();
        await workbook.xlsx.readFile("tmp/uploads/uploadedData.xlsm");
        
        
        const year = 2021 //change this to be dynamic later --------------------------------------
        
        //should flush <year> entries in the database here
        //might need to only delete when replacing as some values may not be present when importing
        await Database.table('allocations')
        .where('unit_year', year)
        .delete();

        await Database.table('units')
        .where('year', year)
        .delete();
        await Database.table('academics')
        .where('year', year)
        .delete();
        
        const sheet = workbook.worksheets[0];

        
        const academicsCol = sheet.getColumn('A');


        const unitsCodeRow = sheet.getRow(1)
        const unitsNameRow = sheet.getRow(2)
        const unitsSemRow = sheet.getRow(3)
        const unitsLoadRow = sheet.getRow(6)

        let academicsList = []

        for (let i = 8; i < academicsCol.values.length-3; i++) {
            const row = sheet.getRow(i+1)
            const name = row.getCell('A').value
            const load = row.getCell('D').value
            let allocs = []
            row.eachCell((cell, colNumber) => {
                if (colNumber > 7) {
                    let unitImport = new UnitImport(unitsCodeRow.getCell(colNumber).text, unitsNameRow.getCell(colNumber).text, year, unitsSemRow.getCell(colNumber).value)
                    allocs.push({UnitImport: unitImport, load: cell.value})
                }
            })
            const ac = new AcademicImport(name, year, load, allocs)
            academicsList.push(ac)
        }

        let units = []

        for (let colNumber = 8; colNumber < unitsCodeRow.values.length; colNumber++) {
            if (unitsCodeRow.getCell(colNumber).text === "") {
                break;
            }
            if (unitsSemRow.getCell(colNumber).value == "1 & 2") {
                units.push({code: unitsCodeRow.getCell(colNumber).text, name: unitsNameRow.getCell(colNumber).text, year: year, semester: 1, load: unitsLoadRow.getCell(colNumber).result})
                units.push({code: unitsCodeRow.getCell(colNumber).text, name: unitsNameRow.getCell(colNumber).text, year: year, semester: 2, load: unitsLoadRow.getCell(colNumber).result})
            } else {
                units.push({code: unitsCodeRow.getCell(colNumber).text, name: unitsNameRow.getCell(colNumber).text, year: year, semester: unitsSemRow.getCell(colNumber).value, load: unitsLoadRow.getCell(colNumber).result})
            }
            
        }

        units.forEach( async ({code, name, year, semester, load}) => {
            const unit = new Unit()
            unit.id = code
            unit.name = name
            unit.year = year
            unit.semester = semester
            unit.assignedLoad = load
            await unit.save()
        })

        console.log(units)
        academicsList.forEach((academicImport) => {
            academicImport.save()
        })





        // //console.log(academicsCol.values)
        // //https://github.com/exceljs/exceljs#columns
        // var academicsNames = []
        // academicsCol.eachCell(function(cell, rowNumber) {
        //     if (rowNumber > 8) {
        //         academicsNames.push({rowNumber: rowNumber, acName: cell.text})
        //     }
        // });

        // academicsNames.splice(-3)
        // console.log(academicsNames)

        // academicsNames.forEach( async ({rowNumber, acName}) => {
        //     const trx = await Database.beginTransaction()
        //     const academic = new Academic()
        //     academic.name = acName;
        //     academic.school = "Information Technology";
        //     academic.year = year;
        //     await academic.save(trx)
        //     await trx.commit()
        // })

        // var unitsCodes = sheet.getRow(1).values;
        // var unitsNames = sheet.getRow(2).values;
        // var unitsSems = sheet.getRow(3).values;
        // for (let i = 8; i < unitsCodes.length; i++) {
        //     if (unitsCodes[i] == null) {
        //         break;
        //     }
        //     if (unitsSems[i] == "1 & 2") {
        //         const trx = await Database.beginTransaction()
        //         const unit = new Unit()
        //         unit.name = unitsNames[i];
        //         unit.id = unitsCodes[i];
        //         unit.semester = 1;
        //         unit.year = year;
        //         await unit.save(trx)
        //         const unit2 = new Unit()
        //         unit2.name = unitsNames[i];
        //         unit2.id = unitsCodes[i];
        //         unit2.semester = 2;
        //         unit2.year = year;
        //         await unit2.save(trx)
        //         await trx.commit()
        //     }
        //     else {
        //         const trx = await Database.beginTransaction()
        //         const unit = new Unit()
        //         unit.name = unitsNames[i];
        //         unit.id = unitsCodes[i];
        //         unit.semester = parseInt(unitsSems[i]);
        //         unit.year = year;
        //         await unit.save(trx)
        //         await trx.commit()

        //         for (let j = 0; j < academicsNames.length; j++) {
        //             const academics_ids_names = await Academic.pair('id', 'name')
        //             let id = 1
        //             Object.keys(academics_ids_names).forEach( (key) => {
        //                 if (academics_ids_names[key] == academicsNames[j].acName) {
        //                     id = key
        //                 }
        //             })
        //             console.log(id)
        //             console.log(unitsCodes[i])
        //             console.log(year)
        //             console.log(parseInt(unitsSems[i]))
        //             console.log(sheet.getCell(i,j+9).text)
        //             if (!(sheet.getCell(i,j+9).text == "" || sheet.getCell(i,j+9).text == null)) {
        //                 const allocation = new Allocation()
        //                 allocation.id = id
        //                 allocation.unit_code = unitsCodes[i];
        //                 allocation.unit_year = year
        //                 allocation.unit_semester = parseInt(unitsSems[i])
        //                 allocation.load = sheet.getCell(i,j+9).text
        //                 await allocation.save()

        //             }
        //             // const load = new Load()
        //             // load.id = id
        //             // load.year = year
        //             // load.load = sheet.getCell(i,j+9).text
        //             // load.save()
        //         }
        //     }
        // }

        return
    }
}

module.exports = ImportController