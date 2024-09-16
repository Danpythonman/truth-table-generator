const TOKEN_TYPES = {
    VARIABLE: "VARIABLE",
    TRUE: "TRUE",
    FALSE: "FALSE",
    AND: "AND",
    OR: "OR",
    NOT: "NOT",
    IF: "IF",
    IFF: "IFF",
    LEFT_PAREN: "LEFT_PAREN",
    RIGHT_PAREN: "RIGHT_PAREN",
    EOF: "EOF"
};

class LexerError extends Error {
    constructor(msg) {
        super(msg)
    }
}

class ParserError extends Error {
    constructor(msg) {
        super(msg)
    }
}

class EvaluatorError extends Error {
    constructor(msg) {
        super(msg)
    }
}

class Token {

    type;
    lexeme;
    value;

    constructor(type, lexeme, value = null) {
        this.type = type;
        this.lexeme = lexeme;
        this.value = value;
    }

    static eof() {
        return new Token(TOKEN_TYPES.EOF, null);
    }
}

class Lexer {

    source;
    lowerCaseSource;
    tokens;

    start;
    current;
    line;

    constructor(source) {
        this.source = source;
        this.lowerCaseSource = source.toLowerCase();
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 1;
    }

    lexAllTokens() {
        while (this.current < this.source.length) {
            this.start = this.current;
            this.lexNextToken();
        }

        this.tokens.push(Token.eof());

        return this.tokens;
    }

    lexNextToken() {
        let c = this.source[this.current];
        switch (c) {
            case "(":
            case ")":
                this.lexParenthesis();
                return;
            case "&":
            case "^":
            case "∧":
            case "|":
            case "v":
            case "∨":
            case "!":
            case "~":
            case "¬":
            case "→":
            case "↔":
                this.lexSingleCharacterOperator();
                return;
            case "<":
            case "-":
                this.lexDoubleOrTripleCharacterOperator();
                return;
            case " ":
            case "\n":
                this.current++;
                return;
            case "A":
            case "a":
            case "O":
            case "o":
            case "I":
            case "i":
            case "N":
            case "n":
            case "⊤":
            case "T":
            case "t":
            case "⊥":
            case "F":
            case "f":
                this.lexTextOperatorOrLiteralOrVariable();
                return;
            default:
                this.lexVariable();
        }
    }

    lexParenthesis() {
        let c = this.source[this.current];
        if (c == "(") {
            this.tokens.push(new Token(TOKEN_TYPES.LEFT_PAREN, "("));
        } else if (c == ")") {
            this.tokens.push(new Token(TOKEN_TYPES.RIGHT_PAREN, ")"));
        } else {
            throw new LexerError("Unknown parenthesis");
        }
        this.current++;
    }

    lexSingleCharacterOperator() {
        let tokenType;
        let c = this.source[this.current];
        let operator;
        switch (c) {
            case "&":
            case "^":
            case "∧":
                tokenType = TOKEN_TYPES.AND;
                operator = "&";
                break;
            case "|":
            case "v":
            case "∨":
                tokenType = TOKEN_TYPES.OR;
                operator = "|";
                break;
            case "!":
            case "~":
            case "¬":
                tokenType = TOKEN_TYPES.NOT;
                operator = "!";
                break;
            case "→":
                tokenType = TOKEN_TYPES.IF;
                operator = "->";
                break;
            case "↔":
                tokenType = TOKEN_TYPES.IFF;
                operator = "<->";
                break;
            default:
                throw new LexerError("Unkown single character token");
        }
        this.current++;
        this.tokens.push(new Token(tokenType, operator));
    }

    lexDoubleOrTripleCharacterOperator() {
        let c = this.source[this.current];
        switch (c) {
            case "<":
                if (this.current + 2 >= this.source.length) {
                    throw new LexerError(
                        "Unexpected EOF when parsing triple character token"
                    );
                } else {
                    if (this.source[this.current + 1] == "-"
                            && this.source[this.current + 2] == ">") {
                        this.tokens.push(new Token(TOKEN_TYPES.IFF, "<->"));
                        this.current += 3;
                    } else {
                        throw new LexerError("Unexpected token when parsing <->");
                    }
                }
                return;
            case "-":
                if (this.current + 1 >= this.source.length) {
                    throw new LexerError(
                        "Unexpected EOF when parsing double character token"
                    );
                } else {
                    if (this.source[this.current + 1] == ">") {
                        this.tokens.push(new Token(TOKEN_TYPES.IF, "->"));
                        this.current += 2;
                    } else {
                        throw new LexerError("Unexpected token when parsing ->");
                    }
                }
                return;
            default:
                throw new LexerError("Unknown double character token");
        }
    }

    lexTextOperatorOrLiteralOrVariable() {
        let c = this.source[this.current];
        if (c == "A" || c == "a") {
            if (this.current + 2 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "n"
                    && this.lowerCaseSource[this.current + 2] == "d") {
                this.tokens.push(new Token(TOKEN_TYPES.AND, "&"));
                this.current += 3;
                return;
            }
        } else if (c == "O" || c == "o") {
            if (this.current + 1 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "r") {
                this.tokens.push(new Token(TOKEN_TYPES.OR, "|"));
                this.current += 2;
                return;
            }
        } else if (c == "N" || c == "n") {
            if (this.current + 2 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "o"
                    && this.lowerCaseSource[this.current + 2] == "t") {
                this.tokens.push(new Token(TOKEN_TYPES.NOT, "!"));
                this.current += 3;
                return;
            }
        } else if (c == "I" || c == "i") {
            if (this.current + 2 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "f"
                    && this.lowerCaseSource[this.current + 2] == "f") {
                this.tokens.push(new Token(TOKEN_TYPES.IFF, "<->"));
                this.current += 3;
                return;
            } else if (this.current + 1 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "f") {
                this.tokens.push(new Token(TOKEN_TYPES.IF, "->"));
                this.current += 2;
                return;
            }
        } else if (c == "⊤" || c == "T" || c == "t") {
            if (this.source[this.current] == "⊤") {
                this.tokens.push(new Token(TOKEN_TYPES.TRUE, "true"));
                this.current++;
                return;
            } else if (this.current + 3 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "r"
                    && this.lowerCaseSource[this.current + 2] == "u"
                    && this.lowerCaseSource[this.current + 3] == "e") {
                this.tokens.push(new Token(TOKEN_TYPES.TRUE, "true"));
                this.current += 4;
                return;
            }
        } else if (c == "⊥" || c == "F" || c == "f") {
            if (this.source[this.current] == "⊥") {
                this.tokens.push(new Token(TOKEN_TYPES.FALSE, "false"));
                this.current++;
                return;
            } else if (this.current + 4 < this.source.length
                    && this.lowerCaseSource[this.current + 1] == "a"
                    && this.lowerCaseSource[this.current + 2] == "l"
                    && this.lowerCaseSource[this.current + 3] == "s"
                    && this.lowerCaseSource[this.current + 4] == "e") {
                this.tokens.push(new Token(TOKEN_TYPES.FALSE, "false"));
                this.current += 5;
                return;
            }
        }
        this.lexVariable();
    }

    lexVariable() {
        let firstCharacter = this.source[this.current];
        if (firstCharacter.toLowerCase() == firstCharacter.toUpperCase()) {
            throw new LexerError("Variable started with non-letter");
        }
        this.current++;
        let variableName = firstCharacter;
        while (this.current < this.source.length) {
            let c = this.source[this.current];
            if (c >= "0" && c <= "9") {
                variableName += c;
                this.current++;
            } else {
                break;
            }
        }
        this.tokens.push(new Token(TOKEN_TYPES.VARIABLE, variableName));
    }
}

class Expr {
    accept(visitor) {
        return visitor.visit(this);
    }
}

class BinaryExpr extends Expr {
    left;
    operator;
    right;

    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    accept(visitor) {
        return visitor.visit(this);
    }
}

class UnaryExpr extends Expr {
    operator;
    right;

    constructor(operator, right) {
        super();
        this.operator = operator;
        this.right = right;
    }

    accept(visitor) {
        return visitor.visit(this);
    }
}

class LiteralTrueExpr extends Expr {
    accept(visitor) {
        return visitor.visit(this);
    }
}

class LiteralFalseExpr extends Expr {
    accept(visitor) {
        return visitor.visit(this);
    }
}

class VariableExpr extends Expr {
    variableName;

    constructor(variableName) {
        super();
        this.variableName = variableName;
    }

    accept(visitor) {
        return visitor.visit(this);
    }
}

class GroupingExpr extends Expr {
    expr;

    constructor(expr) {
        super();
        this.expr = expr;
    }

    accept(visitor) {
        return visitor.visit(this);
    }
}

class PrinterVisitor {
    print(expr) {
        console.log(expr.accept(this));
    }

    visit(expr) {
        if (expr instanceof BinaryExpr) {
            return `${expr.operator.lexeme} ${expr.left.accept(this)} ${expr.right.accept(this)}`;
        } else if (expr instanceof UnaryExpr) {
            return `${expr.operator.lexeme} ${expr.right.accept(this)}`;
        } else if (expr instanceof LiteralTrueExpr) {
            return "TRUE";
        } else if (expr instanceof LiteralFalseExpr) {
            return "FALSE";
        } else if (expr instanceof VariableExpr) {
            return expr.variableName.lexeme;
        } else if (expr instanceof GroupingExpr) {
            return `(${expr.expr.accept(this)})`;
        } else {
            return "No idea";
        }
    }
}

class EvaluatorVisitor {
    expr;
    vars;

    constructor(expr) {
        this.expr = expr;
        this.vars = {};
        this.findVars(expr);
    }

    findVars(expr) {
        if (expr instanceof BinaryExpr) {
            this.findVars(expr.left);
            this.findVars(expr.right);
        } else if (expr instanceof UnaryExpr) {
            this.findVars(expr.right);
        } else if (expr instanceof LiteralTrueExpr) {
            return;
        } else if (expr instanceof LiteralFalseExpr) {
            return;
        } else if (expr instanceof VariableExpr) {
            this.vars[expr.variableName.lexeme] = false;
        } else if (expr instanceof GroupingExpr) {
            this.findVars(expr.expr);
        } else {
            throw new EvaluatorError("Unknown expr type in findVars");
        }
    }

    evaluate() {
        const n = Math.pow(2, Object.entries(this.vars).length);
        const arr = [];
        for (let i = 0; i < n; i++) {
            arr.push(this.evaluateIteration(i));
        }
        return arr;
    }

    evaluateIteration(iterationNumber) {
        const numberOfVars = Object.entries(this.vars).length;
        const binaryString = iterationNumber.toString(2);
        const paddedBinaryString = "0".repeat(numberOfVars - binaryString.length) + binaryString;

        let i = 0;
        for (const key of Object.keys(this.vars)) {
            this.vars[key] = (paddedBinaryString[i] == "0") ? false : true;
            i++;
        }

        return this.expr.accept(this);
    }

    visit(expr) {
        if (expr instanceof BinaryExpr) {
            if (expr.operator.type == TOKEN_TYPES.AND) {
                return expr.left.accept(this) && expr.right.accept(this);
            } else if (expr.operator.type == TOKEN_TYPES.OR) {
                return expr.left.accept(this) || expr.right.accept(this);
            } else if (expr.operator.type == TOKEN_TYPES.IF) {
                return !expr.left.accept(this) || expr.right.accept(this);
            } else if (expr.operator.type == TOKEN_TYPES.IFF) {
                return expr.left.accept(this) == expr.right.accept(this);
            } else {
                throw new EvaluatorError("Unexpected binary operator");
            }
        } else if (expr instanceof UnaryExpr) {
            if (expr.operator.type == TOKEN_TYPES.NOT) {
                return !expr.right.accept(this);
            } else {
                throw new EvaluatorError("Unexpected unary operator");
            }
        } else if (expr instanceof LiteralTrueExpr) {
            return true;
        } else if (expr instanceof LiteralFalseExpr) {
            return false;
        } else if (expr instanceof VariableExpr) {
            return this.vars[expr.variableName.lexeme];
        } else if (expr instanceof GroupingExpr) {
            return expr.expr.accept(this);
        } else {
            throw new EvaluatorError("Unknown expr type in evaluate");
        }
    }
}

class ToTextVisitor {

    toText(expr) {
        return expr.accept(this);
    }

    visit(expr) {
        if (expr instanceof BinaryExpr) {
            if (expr.operator.type == TOKEN_TYPES.AND) {
                return `${expr.left.accept(this)} ∧ ${expr.right.accept(this)}`;
            } else if (expr.operator.type == TOKEN_TYPES.OR) {
                return `${expr.left.accept(this)} ∨ ${expr.right.accept(this)}`;
            } else if (expr.operator.type == TOKEN_TYPES.IF) {
                return `${expr.left.accept(this)} → ${expr.right.accept(this)}`;
            } else if (expr.operator.type == TOKEN_TYPES.IFF) {
                return `${expr.left.accept(this)} ↔ ${expr.right.accept(this)}`;
            } else {
                throw new EvaluatorError("Unexpected binary operator");
            }
        } else if (expr instanceof UnaryExpr) {
            if (expr.operator.type == TOKEN_TYPES.NOT) {
                return `¬${expr.right.accept(this)}`;
            } else {
                throw new EvaluatorError("Unexpected unary operator");
            }
        } else if (expr instanceof LiteralTrueExpr) {
            return "⊤";
        } else if (expr instanceof LiteralFalseExpr) {
            return "⊥";
        } else if (expr instanceof VariableExpr) {
            return expr.variableName.lexeme;
        } else if (expr instanceof GroupingExpr) {
            return `(${expr.expr.accept(this)})`;
        } else {
            throw new EvaluatorError("Unknown expr type in evaluate");
        }
    }
}

class Parser {

    tokens;
    current;
    justConsumed;

    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
    }

    /**
     * program -> expression EOF
     */
    parse() {
        return this.parseExpression();
    }

    /**
     *
     * expression -> iff
     */
    parseExpression() {
        return this.parseIff();
    }

    /**
     * iff -> if ( "<->" if )*
     */
    parseIff() {
        let expr = this.parseIf();
        let left = expr;
        while (this.tokens[this.current].type == TOKEN_TYPES.IFF) {
            let operator = this.consume();
            let right = this.parseIf();
            expr = new BinaryExpr(left, operator, right);
            left = expr;
        }
        return expr;
    }

    /**
     * if -> or ( "->" or )*
     */
    parseIf() {
        let expr = this.parseOr();
        let left = expr;
        while (this.tokens[this.current].type == TOKEN_TYPES.IF) {
            let operator = this.consume();
            let right = this.parseOr();
            expr = new BinaryExpr(left, operator, right);
            left = expr;
        }
        return expr;
    }

    /**
     * or -> and ( "|" and )*
     */
    parseOr() {
        let expr = this.parseAnd();
        let left = expr;
        while (this.tokens[this.current].type == TOKEN_TYPES.OR) {
            let operator = this.consume();
            let right = this.parseAnd();
            expr = new BinaryExpr(left, operator, right);
            left = expr;
        }
        return expr;
    }

    /**
     * and -> not ( "&" not )*
     */
    parseAnd() {
        let expr = this.parseNot();
        let left = expr;
        while (this.tokens[this.current].type == TOKEN_TYPES.AND) {
            let operator = this.consume();
            let right = this.parseNot();
            expr = new BinaryExpr(left, operator, right);
            left = expr;
        }
        return expr;
    }

    /**
     * not -> ( "!" not ) | primary
     */
    parseNot() {
        if (this.tokens[this.current].type == TOKEN_TYPES.NOT) {
            let operator = this.consume();
            let expr = this.parseNot();
            return new UnaryExpr(operator, expr);
        }

        return this.parsePrimary();
    }

    /**
     * primary -> TRUE | FALSE | VARIABLE | "(" expression ")"
     */
    parsePrimary() {
        if (this.tokens[this.current].type == TOKEN_TYPES.TRUE) {
            const expr = new LiteralTrueExpr();
            this.consume();
            return expr;
        }
        if (this.tokens[this.current].type == TOKEN_TYPES.FALSE) {
            const expr = new LiteralFalseExpr();
            this.consume();
            return expr;
        }
        if (this.tokens[this.current].type == TOKEN_TYPES.VARIABLE) {
            const expr = new VariableExpr(this.tokens[this.current]);
            this.consume();
            return expr;
        }
        if (this.tokens[this.current].type == TOKEN_TYPES.LEFT_PAREN) {
            this.consume();
            let expr = this.parseExpression();
            if (this.tokens[this.current].type != TOKEN_TYPES.RIGHT_PAREN) {
                throw new ParserError("Missing right paren");
            }
            this.consume();
            return new GroupingExpr(expr);
        }
        throw new ParserError("No rule found for expression");
    }

    consume() {
        let token = this.peek();
        this.current++;
        this.justConsumed = token;
        return token;
    }

    peek() {
        return this.tokens[this.current];
    }
}

function main() {
    // let s = "P | C | (B -> E1) AND true";
    const s = "!B";
    let lexer = new Lexer(s);
    console.log(s);
    const tokens = lexer.lexAllTokens();
    console.log(tokens);
    let parser = new Parser(tokens);
    let expr = parser.parse();
    console.log("========= EXPR ==========");
    console.log(expr);
    let visitor = new PrinterVisitor();
    console.log("========= PRINT ==========");
    visitor.print(expr);
    let evaluator = new EvaluatorVisitor(expr);
    const arr = evaluator.evaluate();
    console.log(arr);
}

main();
