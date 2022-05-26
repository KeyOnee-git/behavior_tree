import *  as BT from './behaviortree';
import { Stack } from 'stack-typescript';

export namespace KeyOnee.BehaviorTree.Parser {    
    export class Node {
        public token: Tokenizer.Token | null = null;
        public children: Array<Node> = new Array<Node>();
        public parameters: Array<Tokenizer.Token> = new Array<Tokenizer.Token>();
        public parseLength: number = 0;

        private _flattenChildren: Node[] | null = null;
        get flattenChildren(): Node[] | null{
            if (this._flattenChildren == null) {
                let stack = new Stack<Node>();
                let nodes = new Array<Node>();
                stack.push(this);
                while (stack.size > 0) {
                    let node = stack.pop();
                    if (node == null)
                        continue;
                    
                    nodes.push(node);
                    for (let c = node.children.length - 1; c >= 0; --c) {
                        let child = node.children[c];
                        stack.push(child);
                    }
                }
                this._flattenChildren = nodes;
            }

            return this._flattenChildren;
        }

        private _parsedParameters: any[] | null = null;
        get parsedParameters(): any[] | null{
            if (this._parsedParameters == null) {
                let parameters: any[] = [];
                for (let p of this.parameters) {
                    parameters.push(Tokenizer.BTLTokenizer.ParseParameter(p));
                }
                this._parsedParameters = parameters;
            }
            return this._parsedParameters;
        }
    }

    export class BTLParser {
        static Parsing(strBT: string): void {
            console.log(`strBT:${strBT}`);
        }
    }
}

export namespace KeyOnee.BehaviorTree.Tokenizer
{
    export enum TokenType {
        Word,
        Coma,
        Comment,
        Value,
        EOL,
        Indent,
        Fallback,
        Sequence,        
        Parallel,
        Race,
        Random,
        Tree,
        TreeProxy,
        Repeat,
        While,        
        Not,
        Nute,
        Parenthesis_Open,
        Parenthesis_Closed,
    }

    export enum TokenValueType {
        None,
        Boolean,
        Integer,
        Float,
        String,
        Enum,
    }

    export class Token {

        constructor(type: TokenType, start: number, length: number, source: string, line: number, valueType?: TokenValueType) {            
            this.type = type;
            this.substring_start = start;
            this.substring_length = length;
            this._source = source;
            this.line = line;
            this.valueType = valueType || TokenValueType.None;
        }

        public type: TokenType;
        public valueType: TokenValueType;
        public substring_start: number = 0;
        public substring_length: number = 0;
        public line: number = 0;
        
        private _source: string;
        get source(): string {
            return this._source;
        }

        set source(value: string) {
            this._source = value;
            this._parsedParameter = null;
        }

        ToString(): string {
            let str: string = "";

            if (this.type == TokenType.Word)
                str = this.content;
            else if (this.type == TokenType.EOL)
                str = "[EOL]\n";
            else if (this.type == TokenType.Value)
                str = Tokenizer.BTLTokenizer.ParseParameter(this).toString();
            else
                str = `[${TokenType[this.type]}]`;
                
            return str;
        }

        get content(): string {
            let content: string = "";
            if (this.source != null && this.substring_start + this.substring_length <= this.source.length) {
                content = this.source.substring(this.substring_start, this.substring_start + this.substring_length);
            }
            return content;
        }

        private _parsedParameter: any;
        get parsedParameter(): any {
            if (this._parsedParameter == null) {
                let str = this.content.trim();

                switch (this.valueType) {
                    case TokenValueType.Float:
                        this._parsedParameter = Number(str);
                        break;
                    case TokenValueType.Integer:
                        this._parsedParameter = Number(str);
                        break;
                    case TokenValueType.Boolean:
                        this._parsedParameter = str === 'true';
                        break;
                    case TokenValueType.String:
                        this._parsedParameter = str.substring(1, 1 + str.length - 2);
                        break;
                    case TokenValueType.Enum:
                        this._parsedParameter = str; // new EnumParameter
                        break;
                }

                return this._parsedParameter;
            }
        }

        static CleanBlanks(source:string): string {
            let src: string = source;
            src = src.replace("\r\n", "\n");
            src = src.replace("\r", "\n");

            let sb:string = "";
            let isIndenting: boolean = true;
            let spaceCount: number = 0;
            for (let c of src) {
                if (c == '\n') {
                    isIndenting = true;
                    spaceCount = 0;
                    sb += c;
                    continue;
                }

                if (c == ' ') {
                    spaceCount++;
                }
                else {
                    isIndenting = false;
                }
                
                if (isIndenting)
                {
                    if (spaceCount == 2)   
                    {
                        sb += '\t';
                        spaceCount = 0;
                    }
                }
                else
                {
                    sb += c;
                }
            }

            return sb;
        }

        static Tokenize(source: string): Token[] {
            let src: string = this.CleanBlanks(source);

            let tokens: Array<Token> = new Array<Token>();
            let start: number = 0;
            let token: Token | null = null;
            let line: number = 1;
            for (let i = 0; i < src.length; ++i){
                let len:number = i - start;
                let c: string = src[i];

                if (c === '"')
                {
                    do {
                        ++i;
                        if (i < src.length)
                        {
                            len = i - start;
                            c = src[i];
                        }
                    } while (c != '"' && i < src.length && c != '\n');

                    if (c === '\n') {
                        token = new Token(TokenType.EOL, start, len, src, line);
                        throw new Error(`Expected double-quotes before end-of-lines. line(${token.line})`);
                    }
                }
                let EOF: boolean = !(i + 1 < src.length);
                if (EOF)
                    ++len;
                
                let word: string = src.substring(start, start + len);
                
                // # Inline comments
                if (word.endsWith("//"))
                {
                    do {
                        if (i < src.length) {
                            len = i - start;
                            c = src[i];
                            if (c != '\n')
                                ++i;
                        } 
                    } while (i < src.length && c != '\n');

                    if (c != '\n')
                        ++len;
                    
                    token = new Token(TokenType.Comment, start, len, src, line);
                    tokens.push(token);
                    start = i;

                    if (c == '\n')
                        i--;
                    
                    token = null;
                    continue;
                }

                // # block comments
                if (word.endsWith("/*"))
                {
                    let hasHitEOC: boolean = false; // EOC = End of Comment '*/'
                    do {
                        ++i;
                        
                        if (i < src.length) {
                            c = src[i];
                            if (c == '\n')
                                ++line;
                        }

                        len = i - start;
                        word = src.substring(start, start + len);

                        if (word.length > 2) {
                            hasHitEOC = word.endsWith("*/");
                        }
                    } while (i < src.length && !hasHitEOC);

                    token = new Token(TokenType.Comment, start, len, src, line);

                    if (!hasHitEOC)
                    {
                        throw new Error(`End-of-file found. Expected '*/'. line(${token.line})`);
                    }
                    tokens.push(token);
                    token = null;
                    start = i;
                    continue;
                }

                // # keywords
                if (len > 0 && (c === '\t' || c === '\n' || c === ' ' || c === '(' || c === ')' || c === ',' || EOF)) {
                    let lastChar: string = word[word.length - 1];

                    if (word.length > 0 && (lastChar === '\n' || lastChar === ')')) {
                        --len;
                        word = src.substring(start, start + len);
                    }

                    let lc_word: string = word.trim().toLowerCase();

                    if (lc_word.trim() != "") {
                        switch (lc_word) {
                            case "tree": token = new Token(TokenType.Tree, start, len, src, line); break;
                            case "fallback": token = new Token(TokenType.Fallback, start, len, src, line); break;
                            case "sequence": token = new Token(TokenType.Sequence, start, len, src, line); break;
                            // ToDO Case:

                            default: {
                                let tokenType = Token.GetValueType(word);
                                if (tokenType != TokenValueType.None)
                                    token = new Token(TokenType.Value, start, len, src, line, tokenType);
                                else
                                    token = new Token(TokenType.Word, start, len, src, line);
                            } break;
                        }

                        if (token != null) {
                            tokens.push(token);
                            token = null;
                        }
                        start = i;
                    }
                }

                if (token == null) {
                    len = i - start + 1;

                    switch (c) {
                        case '\t': token = new Token(TokenType.Indent, start, len, src, line); break;
                        case '\n': token = new Token(TokenType.EOL, start, len, src, line); ++line; break;
                        case ' ': token = null; start = i; break;
                        case ',': token = new Token(TokenType.Coma, start, len, src, line); break;
                        case '(': token = new Token(TokenType.Parenthesis_Open, start, len, src, line); break;
                        case ')': token = new Token(TokenType.Parenthesis_Closed, start, len, src, line); break;
                    }
                }

                if (c == ' ' || c == '\t' || c == '\n') {
                    start = i;
                }

                if (token != null) {
                    tokens.push(token);
                    token = null;
                    start = i + 1;
                }
            }

            return tokens;
        }

        static GetValueType(content: string): TokenValueType {
            let valueType: TokenValueType = TokenValueType.None;
            let str: string = content.trim();

            let f: number = 0;
            let i: number = 0;
            
            if (str == "true" || str == "false") valueType = TokenValueType.Boolean;
            else if ((str.indexOf(".") !== -1) && (isNaN(Number(str)) == false)) valueType = TokenValueType.Float;
            else if ((isNaN(Number(str)) == false)) valueType = TokenValueType.Integer;
            else if (str.startsWith("\"") && str.endsWith("\"")) valueType = TokenValueType.String;
            else if (str.indexOf(".") !== -1/*&& enumRegex.Match(str).Success*/) valueType = TokenValueType.Enum;

            return valueType;
        }
    }

    export class BTLTokenizer {
        static ParseParameter(token: Token): any {
            let o: any = null;
            o = token.parsedParameter;
            return o;
        }
    }
}

//KeyOnee.BT.Parser.BTLParser.Parsing(BT.SIMPLE_BT);
let res = KeyOnee.BehaviorTree.Tokenizer.Token.Tokenize(BT.SIMPLE_BT);
for (let n of res) {
    console.log(n.ToString());
}