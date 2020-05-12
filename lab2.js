"use strict";


function checkBracket(formula) {
    let open = formula.split('(').length - 1;
    let closed = formula.split(')').length - 1;
    return open == closed;
}

function checkBinaryOperationsBracket(formula) {
    let formulaCopy = formula;

    while (formulaCopy.match(/([|&~]|->)/g) || !formulaCopy.match(/^[=()]+$/g)) {
        let prevCopy = formulaCopy;
        formulaCopy = formulaCopy.replace(/\(![A-Z01]\)/g, '=');
        formulaCopy = formulaCopy.replace(/\([A-Z01]([|&~]|->)[A-Z01]\)/g, '=');

        if (formulaCopy === prevCopy) {
            return false;
        }
    }
    return formulaCopy === '=';
}

function checkSyntax(formula) {
    return formula.match(/^[A-Z01]$/) ||
        (!formula.match(/\)\(/) &&
        !formula.match(/[A-Z01]([^|&~]|(?!->))[A-Z01]/) &&
        !formula.match(/[^(]![A-Z01]/) && !formula.match(/![A-Z01][^)]/) &&
        !formula.match(/\([A-Z01]\)/) &&
        checkBracket(formula) &&
        checkBinaryOperationsBracket(formula));
}

function checkFormula(formula) {
    return formula.match(/^([A-Z()|&!~10]|->)*$/g) && checkSyntax(formula);
}

function getAtoms(formula) { 
    let atoms = [...new Set(formula.split(/[^A-Z]/).filter(value => value !== ''))];
    return atoms;
}

function getValueForAtoms(atoms) {
    let sets = [];
    for (let row = 0; row < Math.pow(2, atoms.length); row++) {
        sets.push([]);
        let binaryNumber = Array.from(row.toString(2));
        if (binaryNumber.length < atoms.length) {
            sets[row] = Array.from('0'.repeat(atoms.length - binaryNumber.length));
            binaryNumber.forEach(digit => {
                sets[row].push(digit);                
            });
        } else {
            sets[row] = binaryNumber;
        }
    }
    return sets;
}

function tableValue(value, formula, atoms) {
    let result = [];
    value.forEach((value, index) => {
        result.push(value);
        let newFormula = formula;
        atoms.forEach((aValue, index) => {
            var rgx = new RegExp(aValue, "g");
            newFormula = newFormula.replace(rgx, value[index]);
        })
        while (newFormula.match(/[!|&~]|->/)) {
            newFormula = newFormula.replace(/\(?!0\)?/g, '1');
            newFormula = newFormula.replace(/\(?!1\)?/g, '0');
            newFormula = newFormula.replace(/(\([10]\|1\))|(\(1\|[10]\))/g, '1');
            newFormula = newFormula.replace(/(\(0\|0\))/g, '0');
            newFormula = newFormula.replace(/(\([10]\&0\))|(\(0\&[10]\))/g, '0');
            newFormula = newFormula.replace(/(\(1\&1\))/g, '1');
            newFormula = newFormula.replace(/\(1->0\)/g, '0');
            newFormula = newFormula.replace(/\([10]->[10]\)/g, '1');
            newFormula = newFormula.replace(/\(0~0\)|\(1~1\)/g, '1');
            newFormula = newFormula.replace(/\(([10])~[10]\)/g, '0');
        }
        result[index].push(newFormula);
    })
    return result;
}


function createTable(formula) {
    let atoms = getAtoms(formula);
    let valueForAtoms = getValueForAtoms(atoms);
    let tValue = tableValue(valueForAtoms, formula, atoms);
    let table = document.getElementById("table");
    table.innerHTML = atoms.toString().replace(/,/g, ' | ') + ' | f<br>';
    tValue.forEach((value, index, array) => {
        table.innerHTML += value.toString().replace(/,/g, ' | ') + '<br>';
    })
    return checkNeutralFormula(tValue);
}

function checkNeutralFormula(tableValue) {
    var result = [];
    tableValue.forEach((value) => {
        result.push(value[value.length - 1]);
    });
    if (result.includes("1") && result.includes("0")) {
        return "Нейтральная функция";
    } else {
        return "Функция не является нейтральной";
    }
}

function buttonCheckFunction() {
    var inputFunction = document.getElementById("function").value;
    if (!checkFormula(inputFunction)) {
        document.getElementById("result").innerHTML = "Данное выражение не является функцией логики";
    } else {
        document.getElementById("result").innerHTML = createTable(inputFunction);
    }
}

var variables = [ 'A', 'B', 'C', 'D' ];

function buttonGenFunction() {
    let args = randomInt(3);
    let groups = randomInt(Math.pow(2, args));
    document.getElementById("function").value = genFunc(args, groups);
}

function randomInt(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function genFunc(args, groups) {
    let func = '';
    for (var i = 0; i < groups; i++) { 
        let argsInGroup = args - randomInt(args) + 2;
        let group = '';
        if (groups !== 1 && i < groups - 1) {
            func += '(';
        }
        for (var j = 0; j < argsInGroup; j++) {
            if (argsInGroup !== 1 && j < argsInGroup - 1) {
                group += '(';
            }

            let isNegative = (Math.random() >= 0.5);
            group += (isNegative ? '(!' : '') + variables[j] + (isNegative ? ')' : '');
            if (j < argsInGroup - 1) {
                let random  = Math.random();
                group += ((random >= 0.2) ? '|' : (random >= 0.1 ? '&' : (random >= 0.05 ? '~' : '->')));
            }
        }
        for (j = 0; j < argsInGroup - 1; j++) {
            if (argsInGroup !== 1) {
                group += ')';
            }
        }
        func += group;
        if (i < groups - 1) {
            let random  = Math.random();
            func += ((random >= 0.3) ? '|' : (random >= 0.2 ? '&' : (random >= 0.1 ? '~' : '->')));
        }
    }
    for (j = 0; j < groups - 1; j++) {
        if (groups !== 1) {
            func += ')';
        }
    }

    return func;
}