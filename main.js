
const truthTable = document.getElementById("truth-table");
const errorParagraph = document.getElementById("error-message");

function clearTruthTable() {
    truthTable.innerHTML = "";
    truthTable.style.display = "none";
}

function constructTruthTable(truthTableArray, vars, formulaString) {
    clearTruthTable();
    truthTable.style.display = "table";

    const thead = document.createElement("thead");
    truthTable.appendChild(thead);

    const tbody = document.createElement("tbody");
    truthTable.appendChild(tbody);

    for (variableName of vars) {
        const th = document.createElement("th");
        th.innerText = variableName;
        thead.appendChild(th);
    }
    const th = document.createElement("th");
    th.innerText = formulaString;
    thead.appendChild(th);

    const numberOfVars = vars.length;
    for (let i = 0; i < truthTableArray.length; i++) {
        const binaryString = i.toString(2);
        const paddedBinaryString = "0".repeat(numberOfVars - binaryString.length) + binaryString;

        const tr = tbody.insertRow();
        for (let j = 0; j < numberOfVars; j++) {
            const td = tr.insertCell(j);
            td.innerText = (paddedBinaryString[j] == false) ? "F" : "T";
        }
        const td = tr.insertCell(-1);
        if (truthTableArray[i]) {
            td.innerText = "T";
            td.classList.add("trueValue");
        } else {
            td.innerText = "F";
            td.classList.add("falseValue");
        }
    }
}

function evalFormula(s) {
    try {
        errorParagraph.innerText = "";
        errorParagraph.style.display = "none";

        const lexer = new Lexer(s);
        const tokens = lexer.lexAllTokens();
        const parser = new Parser(tokens);
        const expr = parser.parse();
        const evaluator = new EvaluatorVisitor(expr);
        const truthTableArray = evaluator.evaluate();
        const toTextEvaluator = new ToTextVisitor();
        const toText = toTextEvaluator.toText(expr);

        constructTruthTable(truthTableArray, Object.keys(evaluator.vars), toText);
    } catch (e) {
        clearTruthTable();
        if (e instanceof LexerError) {
            errorParagraph.innerText = `Lexer error: ${e.message}`;
        } else if (e instanceof ParserError) {
            errorParagraph.innerText = `Parser error: ${e.message}`;
        } else if (e instanceof EvaluatorError) {
            errorParagraph.innerText = `Evaluator error: ${e.message}`;
        } else {
            errorParagraph.innerText = "Unknown error";
        }
        errorParagraph.style.display = "block";
    }
}

const formulaInput = document.getElementById("formula-input");
formulaInput.addEventListener("input", () => {
    if (formulaInput.value == "") {
        clearTruthTable();
        errorParagraph.style.display = "none";
    } else {
        evalFormula(formulaInput.value);
    }
});

window.addEventListener("load", () => {
    clearTruthTable();
});
