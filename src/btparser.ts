import *  as BT from './behaviortree';
import { Stack } from 'stack-typescript';

export namespace KeyOnee.BT.Parser {    
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

export namespace KeyOnee.BT.Tokenizer
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
        constructor(type: TokenType,) {
            
        }
    }

    export class BTLTokenizer {

    }
}

KeyOnee.BT.Parser.BTLParser.Parsing(BT.SIMPLE_BT);