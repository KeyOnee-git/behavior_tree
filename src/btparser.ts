import *  as BT from './behaviortree';
import { Stack } from 'stack-typescript';

export namespace KeyOnee.BehaviorTree {    
    export class Node {
        public token: Token | null = null;
        public children: Array<Node> = new Array<Node>();
        public parameters: Array<Token> = new Array<Token>();
        public parseLength: number = 0;

        private _flattenChildren: Node[] | null = null;
        get flattenChildren(): Node[]{
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
                    parameters.push(BTLTokenizer.ParseParameter(p));
                }
                this._parsedParameters = parameters;
            }
            return this._parsedParameters;
        }

        ToString(): string {
            let strParams: string = "";
            if (this.parameters.length > 0) {
                strParams += "(";
                for (let i = 0; i < this.parameters.length; i++){
                    let p: Token = this.parameters[i];
                    strParams += p.ToString();
                    if (i + 1 < this.parameters.length)
                        strParams += ", ";                    
                }
                strParams += ")";
            }
            return this.token?.ToString() + strParams;
        }
    }

    export class BTLParser {       
        static indentParents: Stack<Node> = new Stack<Node>();
        static lineParents: Stack<Node> = new Stack<Node>();
        static indents: Stack<number> = new Stack<number>();
        static indent: number = 0;

        static ParseTokens(tokens: Token[]): Node[] {            
            if (tokens == null || tokens.length == 0)
            {
                let msg: string = "Invalid bt script.";
                throw new Error(msg);
            }

            BTLParser.Clear();
            let roots: Array<Node> = new Array<Node>();
            let root: Node | null = null;
            let lastNode: Node | null = null;
            let parenthesis_opened: boolean = false;
            for (let i = 0; i < tokens.length; ++i) {
                let t = tokens[i];
                let node = new Node();
                node.token = t;

                switch (t.type) {
                    case TokenType.Indent:
                        BTLParser.indent++;
                        break;
                    case TokenType.EOL:
                        BTLParser.indent = 0;
                        BTLParser.lineParents = new Stack<Node>();
                        lastNode = null;
                        break;
                    case TokenType.Value:
                        // Nothing.
                        break;
                    case TokenType.Parenthesis_Open:
                        if (!parenthesis_opened) {
                            parenthesis_opened = true;
                        }
                        else {
                            throw new Error(`Unexpected open parenthesis. line:${t.line}`);
                        }
                        break;
                    case TokenType.Parenthesis_Closed:
                        if (parenthesis_opened) {
                            parenthesis_opened = false;
                        }
                        else {
                            throw new Error(`Unexpected closed parenthesis. line:${t.line}`);
                        }

                        if (lastNode == null) {
                            throw new Error("lastNode is null!!");
                        }

                        if (lastNode.token == null) {
                            throw new Error("lastNode.token is null!!");
                        }

                        lastNode.parseLength = t.substring_start - lastNode.token.substring_start + t.substring_length;
                        break;
                    case TokenType.Tree:
                        if (BTLParser.indent == 0 && BTLParser.lineParents.length == 0) {
                            root = node;
                            BTLParser.indentParents = new Stack<Node>();
                            BTLParser.indents = new Stack<number>();
                            roots.push(root);
                            BTLParser.PushParent(node);
                        }
                        else {
                            node.token.type = TokenType.TreeProxy;
                            BTLParser.PushParent(node);
                        }
                        break;
                    case TokenType.Fallback:
                    case TokenType.Sequence:
                    case TokenType.Parallel:
                    case TokenType.Race:
                    case TokenType.While:
                    case TokenType.Repeat:
                    case TokenType.Mute:
                    case TokenType.Not:
                    case TokenType.Random:
                    case TokenType.Word: // push to parent to detect parenting error.
                        BTLParser.PushParent(node);
                        break;
                } // switch

                // Skip blanks
                if (t.type == TokenType.EOL || t.type == TokenType.Indent)
                    continue;
                
                // Ignore comments
                if (t.type == TokenType.Comment)
                    continue;
                
                if (t.type == TokenType.Parenthesis_Open || t.type == TokenType.Parenthesis_Closed || t.type == TokenType.Coma)
                    continue;
                
                if (parenthesis_opened) {
                    if (lastNode != null) {
                        lastNode.parameters.push(t);
                    }
                }
                else {
                    if (t.type == TokenType.Value) {
                        if (lastNode != null) {
                            if (lastNode.token == null) {
                                throw new Error("lastNode.token is null!! 2");
                            }

                            lastNode.parameters.push(t);
                            lastNode.parseLength = t.substring_start - lastNode.token.substring_start + t.substring_length;
                            continue;
                        }
                        else {
                            throw new Error(`Unexpected parameter value. line:${t.line}`);
                        }
                    }

                    // Determine the parent of the current node.
                    let parent: Node;
                    // foreach adsfasdf

                    lastNode = node;
                }
            }

            return roots;
        }

        static PopParentToIndent(indent: number): void {
            while (BTLParser.indents.length > 0 && BTLParser.indents.top >= BTLParser.indent)
            {
                BTLParser.indents.pop();
                BTLParser.indentParents.pop();
            }
        }

        static PushParent(parent: Node): void {
            if (BTLParser.lineParents.length == 0) {
                BTLParser.PopParentToIndent(BTLParser.indent);

                // Push the node on the parent stack
                BTLParser.indentParents.push(parent);
                BTLParser.indents.push(BTLParser.indent);
            }

            if (parent.token == null) {
                throw new Error("parent.token is null");
            }

            switch (parent.token.type) {
                case TokenType.Sequence:
                case TokenType.Fallback:
                case TokenType.Parallel:
                case TokenType.Race:    
                case TokenType.Random:
                case TokenType.While:
                case TokenType.Repeat:
                case TokenType.Mute:
                case TokenType.Not:
                    BTLParser.lineParents.push(parent);
                    break;
            }
        }

        static GetNodes(trees: Node[] | null): Node[] {
            let count: number = 0;
            if (!!trees) {
                for (let tree of trees) {
                    if (!!tree) {
                        if (tree.flattenChildren == null)
                            throw new Error("tree.flattenChildren is null!");
                        
                        count += tree.flattenChildren.length;
                    }
                }
            }

            let nodes: Array<Node> = new Array<Node>(count);
            let i: number = 0;
            if (!!trees) {
                for (let tree of trees) {
                    if (tree != null) {
                        let children = tree.flattenChildren;
                        for (let n of children) {
                            nodes[i] = n;
                            i++;
                        }
                    }
                }
            }

            return nodes;
        }
        static GetProxies(tree: Node | null): Node[] {
            let stack: Stack<Node | null> = new Stack<Node>();
            let nodes: Array<Node> = new Array<Node>();
            stack.push(tree);
            while (stack.length > 0) {
                let node = stack.pop();
                if (!node)
                    continue;
                
                if (node.token == null) {
                    throw new Error('node.token is null');
                }
                
                if (node.token.type == TokenType.TreeProxy)
                    nodes.push(node);
                
                for (let c = node.children.length - 1; c >= 0; --c) {
                    let child = node.children[c];
                    stack.push(child);
                }
            }
            return nodes;
        }

        static GetProxiesOfTrees(trees: Node[] | null): Node[] {
            let nodes: Node[] = new Array<Node>();
            if (!!trees) {
                for (let b of trees) {
                    nodes.concat(BTLParser.GetProxies(b));
                }
            }
            return nodes;
        }

        static CheckProxies(roots: Node[], rootSets: Node[][]): void {
            BTLParser.CheckProxyDefinitions(roots, rootSets);
            BTLParser.CheckCircularDefinition(roots, rootSets);
        }
        static CheckTreeNames(trees: Node[], treeSets: Node[][]): void {
            if (!trees || !treeSets) {
                return;
            }

            for (let r = 0; r < trees.length; r++) {
                let tree = trees[trees.length - r - 1];
                let treeName = BTLParser.GetTreeName(tree);

                for (let k = 0; k < treeSets.length; k++) {
                    let i = treeSets.length - k - 1;
                    if (!treeSets[i])
                        continue;
                    
                    for (let l = 0; l < treeSets[i].length; l++) {
                        let j = treeSets[i].length - l - 1;

                        let other = treeSets[i][j];
                        if (tree == other) {
                            console.log(`[OK:CheckTreeNames] tree == other`); // 그냥 여기 타는지 로그 보고 싶어서 넣어둠. 타는거 확인하면 지우기.
                            continue; 
                        }
                            
                        let otherName = BTLParser.GetTreeName(other);
                        if (otherName == treeName) {
                            throw new Error(`Tree "${treeName}" is already defined.`);
                        }
                    }
                }
            }
        }
        static CheckMains(trees: Node[], treeSets: Node[][]): void {
            if (!trees || !treeSets)
                return;
            
            for (let r = 0; r < trees.length; r++) {
                let mainCount = 0;
                let tree = trees[trees.length - r - 1];
                let treeName = BTLParser.GetTreeName(tree);

                if (treeName.toLowerCase() != 'root')
                    continue;
                
                mainCount++;

                for (let k = 0; k < treeSets.length; k++) {
                    let i = treeSets.length - k - 1;
                    if (!treeSets[i])
                        continue;
                    
                    for (let l = 0; l < treeSets[i].length; l++) {
                        let j = treeSets[i].length - l - 1;

                        let other = treeSets[i][j];
                        if (tree == other) {
                            console.log(`[OK:CheckMains] tree == other`); // 그냥 여기 타는지 로그 보고 싶어서 넣어둠. 타는거 확인하면 지우기.
                            continue; 
                        }

                        let otherName = BTLParser.GetTreeName(other);
                        if (otherName.toLowerCase() == 'root')
                        {
                            throw new Error(`Tree "${treeName}" is already defined`);
                        }
                    }
                }
            }
        }

        private static ResolveProxy(proxyName: string, rootSets: Node[][]): Node | null {
            let proxy: Node | null = null;
            for (let set of rootSets) {
                if (!!set) {
                    for (let bh of set) {
                        if (!!bh) {
                            let name: string = BTLParser.GetTreeName(bh);
                            if (name == proxyName)
                            {
                                proxy = bh;
                                break;
                            }
                        }
                    }
                }

                if (proxy != null)
                    break;
            }

            return proxy;
        }

        static CheckProxyDefinitions(trees: Node[], treeSets: Node[][]): void {
            // Check whether all sub trees are defined
            let proxies = BTLParser.GetProxiesOfTrees(trees);
            for (let proxy of proxies) {
                let isDefined = false;
                let proxyName = BTLParser.GetTreeName(proxy);

                let resolved = BTLParser.ResolveProxy(proxyName, treeSets);
                isDefined = resolved != null;

                if (!isDefined) {
                    throw new Error(`Tree "${proxyName}" is not defined`);
                }
            }
        }
        static CheckCircularDefinition(roots: Node[], rootSets: Node[][]): void {
            if (!roots)
                return;
            
            for (let i = 0; i < roots.length; i++) {
                let root = roots[i];
                BTLParser.CheckCircularDefinitionRoot(root, rootSets);
            }
        }
        static CheckCircularDefinitionRoot(root: Node, rootSets: Node[][]): void {
            let stack = new Stack<Node | null>();
            let depths = new Stack<number>();
            let path = new Stack<Node | null>();

            if (root != null) {
                stack.push(root);
                depths.push(0);
            }

            while (stack.length > 0) {
                let tree = stack.pop();
                let depth = depths.pop();

                while (path.length > depth)
                    path.pop();
                
                path.push(tree);

                let proxies = BTLParser.GetProxies(tree);
                for (let proxy of proxies) {
                    // resolve
                    let proxyName = proxy.parameters[0].ToString().trim();
                    let subTree = BTLParser.ResolveProxy(proxyName, rootSets);

                    if (BTLParser.StackContains(path, subTree) == false) {
                        stack.push(subTree);
                        depths.push(depth + 1);
                    }
                    else {
                        if (subTree == null)
                            throw new Error('subTree is null!!'); // 여기는 subTree null이 올수 없음.

                        path.push(subTree);

                        let treeName = BTLParser.GetTreeName(subTree);
                        let msg = `Tree "${treeName}" is circularly defined. Circular tree definition is invalid.`;

                        let callPath = '';
                        let pathArray = path.toArray();
                        for (let i = 0; i < pathArray.length; i++) {
                            let j = pathArray.length - i - 1;

                            let n = pathArray[j];
                            if (!n) {
                                throw new Error('n is null!!'); // Never null!!
                            }
                            let name = BTLParser.GetTreeName(n);
                            callPath += `/${name}`;                            
                        }
                        msg += `call path: "${callPath}"`;

                        if (!subTree.token)
                            throw new Error(`${msg}`);
                        
                        throw new Error(`${msg} line:${subTree.token.line}`)
                    }
                }
            }
        }

        static GetTreeName(tree: Node): string {
            return BTLTokenizer.ParseParameter(tree.parameters[0]).toString();            
        }

        static CheckTree(root: Node): void {
            let nodes = root.flattenChildren;
            for (let n of nodes) {
                if (!n.token)
                    throw new Error(`null token`);
                
                let t = n.token;
                
                switch (t.type) {
                    case TokenType.Word:
                        // Action has no child
                        if (n.children.length != 0) {
                            throw new Error(`Task node has ${n.children.length} children. None is expected`);
                        }
                        break;
                    case TokenType.While:
                        if (n.children.length != 2) {
                            throw new Error(`While node has ${n.children.length} children. 2 are expected`);
                        }
                        break;
                    case TokenType.Parallel:
                        // Paralllel node must have one child and it must be a task.
                        if (n.children.length == 0) {
                            throw new Error(`Parallel node has no child. One or more is expected`);
                        }
                        break;
                    case TokenType.Tree:
                        if (n.parameters.length != 1) {
                            throw new Error(`Tree naming error. Tree name is expected as parameter of type string.`);
                        }

                        // Root node must have one or more child and it must be a task.
                        if (n.children.length == 0) {
                            throw new Error(`Tree node has no child. One is expected`);
                        }

                        // Root node must have one child and it must be a task.
                        if (n.children.length > 1) {
                            throw new Error(`Tree node has too many children. Only One is expected`);
                        }
                        break;
                    case TokenType.TreeProxy:
                        if (n.parameters.length != 1) {
                            throw new Error(`Tree naming error. Tree name is expected as parameter of type string.`);
                        }

                        // Root node must have on child and it must be a task.
                        if (n.children.length > 0) {
                            throw new Error(`Tree reference has children. None is expected.`);
                        }
                        break;
                    case TokenType.Fallback:
                        // Fallback node must have one child and it must be a task.
                        if (n.children.length == 0) {
                            throw new Error(`Fallback node has no child. One or more is expected.`);
                        }
                        break;
                }
            }
        }

        static ToString(tree: Node): string
        {
            let strout: string = "";
            // ASCII Tree
            let fifo = new Stack<Node>();
            let indents = new Stack<number>();
            let i = 0;
            fifo.push(tree);
            indents.push(i);

            while (fifo.length > 0)
            {
                let node = fifo.pop();
                let indent = indents.pop();
                let line = "";
                for (let t = 0; t < indent; ++t) {
                    line += "-";
                }
                line += node.ToString();
                strout += line + '\n';
                for (let c = node.children.length - 1; c >= 0; --c) {
                    let child = node.children[c];
                    fifo.push(child);
                    indents.push(indent + 1);
                }
            }
            
            return strout;
        }
        
        static Clear(): void {
            BTLParser.indentParents = new Stack<Node>();
            BTLParser.lineParents = new Stack<Node>();
            BTLParser.indents = new Stack<number>();
            BTLParser.indent = 0;
        }

        static StackContains(stack: Stack<Node | null>, node: Node | null): boolean {
            if (node == null)
                return false;

            for (let n of stack) {
                if (n === node) {
                    return true;
                }
            }

            return false;
        }
    }
}

export namespace KeyOnee.BehaviorTree
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
        Mute,
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
                str = "[EOL]";  //str = "[EOL]\n";
            else if (this.type == TokenType.Value)
                str = BTLTokenizer.ParseParameter(this).toString();
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
                            case "parallel": token = new Token(TokenType.Parallel, start, len, src, line); break;
                            case "race": token = new Token(TokenType.Race, start, len, src, line); break;
                            case "while": token = new Token(TokenType.While, start, len, src, line); break;
                            case "repeat": token = new Token(TokenType.Repeat, start, len, src, line); break;
                            case "random": token = new Token(TokenType.Random, start, len, src, line); break;
                            case "not": token = new Token(TokenType.Not, start, len, src, line); break;
                            case "mute": token = new Token(TokenType.Mute, start, len, src, line); break;

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

let res = KeyOnee.BehaviorTree.Token.Tokenize(BT.SIMPLE_BT);
for (let token of res) {
    console.log(`${token.ToString()}(${KeyOnee.BehaviorTree.TokenType[token.type]})`);
}

