"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyOnee = void 0;
var BT = __importStar(require("./behaviortree"));
var stack_typescript_1 = require("stack-typescript");
var KeyOnee;
(function (KeyOnee) {
    var BT;
    (function (BT) {
        var Parser;
        (function (Parser) {
            var Node = /** @class */ (function () {
                function Node() {
                    this.token = null;
                    this.children = new Array();
                    this.parameters = new Array();
                    this.parseLength = 0;
                    this._flattenChildren = null;
                    this._parsedParameters = null;
                }
                Object.defineProperty(Node.prototype, "flattenChildren", {
                    get: function () {
                        if (this._flattenChildren == null) {
                            var stack = new stack_typescript_1.Stack();
                            var nodes = new Array();
                            stack.push(this);
                            while (stack.size > 0) {
                                var node = stack.pop();
                                if (node == null)
                                    continue;
                                nodes.push(node);
                                for (var c = node.children.length - 1; c >= 0; --c) {
                                    var child = node.children[c];
                                    stack.push(child);
                                }
                            }
                            this._flattenChildren = nodes;
                        }
                        return this._flattenChildren;
                    },
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(Node.prototype, "parsedParameters", {
                    get: function () {
                        if (this._parsedParameters == null) {
                            var parameters = [];
                        }
                        return this._parsedParameters;
                    },
                    enumerable: false,
                    configurable: true
                });
                return Node;
            }());
            Parser.Node = Node;
            var BTLParser = /** @class */ (function () {
                function BTLParser() {
                }
                BTLParser.Parsing = function (strBT) {
                    console.log("strBT:" + strBT);
                };
                return BTLParser;
            }());
            Parser.BTLParser = BTLParser;
        })(Parser = BT.Parser || (BT.Parser = {}));
    })(BT = KeyOnee.BT || (KeyOnee.BT = {}));
})(KeyOnee = exports.KeyOnee || (exports.KeyOnee = {}));
(function (KeyOnee) {
    var BT;
    (function (BT) {
        var Tokenizer;
        (function (Tokenizer) {
            var TokenType;
            (function (TokenType) {
                TokenType[TokenType["Word"] = 0] = "Word";
                TokenType[TokenType["Coma"] = 1] = "Coma";
                TokenType[TokenType["Comment"] = 2] = "Comment";
                TokenType[TokenType["Value"] = 3] = "Value";
                TokenType[TokenType["EOL"] = 4] = "EOL";
                TokenType[TokenType["Indent"] = 5] = "Indent";
                TokenType[TokenType["Fallback"] = 6] = "Fallback";
                TokenType[TokenType["Sequence"] = 7] = "Sequence";
                TokenType[TokenType["Parallel"] = 8] = "Parallel";
                TokenType[TokenType["Race"] = 9] = "Race";
                TokenType[TokenType["Random"] = 10] = "Random";
                TokenType[TokenType["Tree"] = 11] = "Tree";
                TokenType[TokenType["TreeProxy"] = 12] = "TreeProxy";
                TokenType[TokenType["Repeat"] = 13] = "Repeat";
                TokenType[TokenType["While"] = 14] = "While";
                TokenType[TokenType["Not"] = 15] = "Not";
                TokenType[TokenType["Nute"] = 16] = "Nute";
                TokenType[TokenType["Parenthesis_Open"] = 17] = "Parenthesis_Open";
                TokenType[TokenType["Parenthesis_Closed"] = 18] = "Parenthesis_Closed";
            })(TokenType = Tokenizer.TokenType || (Tokenizer.TokenType = {}));
            var TokenValueType;
            (function (TokenValueType) {
                TokenValueType[TokenValueType["None"] = 0] = "None";
                TokenValueType[TokenValueType["Boolean"] = 1] = "Boolean";
                TokenValueType[TokenValueType["Integer"] = 2] = "Integer";
                TokenValueType[TokenValueType["Float"] = 3] = "Float";
                TokenValueType[TokenValueType["String"] = 4] = "String";
                TokenValueType[TokenValueType["Enum"] = 5] = "Enum";
            })(TokenValueType = Tokenizer.TokenValueType || (Tokenizer.TokenValueType = {}));
            var Token = /** @class */ (function () {
                function Token() {
                }
                return Token;
            }());
            Tokenizer.Token = Token;
        })(Tokenizer = BT.Tokenizer || (BT.Tokenizer = {}));
    })(BT = KeyOnee.BT || (KeyOnee.BT = {}));
})(KeyOnee = exports.KeyOnee || (exports.KeyOnee = {}));
KeyOnee.BT.Parser.BTLParser.Parsing(BT.SIMPLE_BT);
//# sourceMappingURL=btparser.js.map