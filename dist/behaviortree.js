"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTProgram = exports.BTTask = exports.MakeTask = exports.BTSequence = exports.MakeSequence = exports.BTFallback = exports.MakeFallback = exports.BTTree = exports.MakeTree = exports.BTCompositeNode = exports.BTNode = exports.NodeKinds = exports.Status = void 0;
var Status;
(function (Status) {
    Status[Status["Ready"] = 0] = "Ready";
    Status[Status["Running"] = 1] = "Running";
    Status[Status["Succeeded"] = 2] = "Succeeded";
    Status[Status["Failed"] = 3] = "Failed";
})(Status = exports.Status || (exports.Status = {}));
var NodeKinds;
(function (NodeKinds) {
    //INVALID = 'invalid',
    NodeKinds["TASK"] = "task";
    NodeKinds["TREE"] = "tree";
    NodeKinds["FALLBACK"] = "fallback";
    NodeKinds["SEQUENCE"] = "sequence";
    NodeKinds["PARALLEL"] = "parallel";
    NodeKinds["RACE"] = "race";
    NodeKinds["WHILE"] = "while";
    NodeKinds["REPEAT"] = "repeat";
    NodeKinds["RANDOM"] = "random";
    NodeKinds["NOT"] = "not";
    NodeKinds["MUTE"] = "mute";
})(NodeKinds = exports.NodeKinds || (exports.NodeKinds = {}));
var BTNode = /** @class */ (function () {
    function BTNode(name, kind, children) {
        this._name = "";
        this._kind = NodeKinds.TASK;
        this._status = Status.Failed;
        this._prevStatus = Status.Ready;
        this._parent = this;
        // # Not yet
        this._tick = -1;
        this._name = name;
        this._kind = kind;
        this._children = children || [];
    }
    BTNode.prototype.Tick = function () {
        return this.Status;
    };
    BTNode.prototype.Reset = function () {
        if (this.Status != Status.Ready) {
            this.Status = Status.Ready;
            this.DoReset();
        }
    };
    Object.defineProperty(BTNode.prototype, "Name", {
        //#region Getter
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BTNode.prototype, "Kind", {
        get: function () {
            return this._kind;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BTNode.prototype, "Status", {
        get: function () {
            return this._status;
        },
        //#endregion
        //#region Setter
        set: function (val) {
            this._status = val;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BTNode.prototype, "Children", {
        get: function () {
            return this.Children;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(BTNode.prototype, "Parent", {
        get: function () {
            return this._parent;
        },
        set: function (val) {
            this._parent = val;
        },
        enumerable: false,
        configurable: true
    });
    return BTNode;
}());
exports.BTNode = BTNode;
var BTCompositeNode = /** @class */ (function (_super) {
    __extends(BTCompositeNode, _super);
    function BTCompositeNode(name, kind, children) {
        return _super.call(this, name, kind, children) || this;
    }
    BTCompositeNode.prototype.DoReset = function () {
        var children = this.Children;
        children.forEach(function (btnode) {
            btnode.Reset();
        });
    };
    return BTCompositeNode;
}(BTNode));
exports.BTCompositeNode = BTCompositeNode;
function MakeTree(name, children) {
    return new BTTree(name, children);
}
exports.MakeTree = MakeTree;
var BTTree = /** @class */ (function (_super) {
    __extends(BTTree, _super);
    function BTTree(name, children) {
        var _this = _super.call(this, name, NodeKinds.TREE, children) || this;
        _this._child = null;
        if (children.length > 0) {
            _this._child = children[0];
        }
        return _this;
    }
    BTTree.prototype.DoReset = function () {
        var _a;
        (_a = this._child) === null || _a === void 0 ? void 0 : _a.Reset();
    };
    return BTTree;
}(BTNode));
exports.BTTree = BTTree;
function MakeFallback(children) {
    return new BTFallback(children || []);
}
exports.MakeFallback = MakeFallback;
var BTFallback = /** @class */ (function (_super) {
    __extends(BTFallback, _super);
    function BTFallback(children) {
        return _super.call(this, 'fallback', NodeKinds.FALLBACK, children) || this;
    }
    BTFallback.prototype.Tick = function () {
        this.Status = Status.Running;
        for (var i = 0; i < this.Children.length; i++) {
            var s = this.Children[i].Tick();
            this.Status = s;
            if (s == Status.Running || s == Status.Succeeded) {
                return this.Status;
            }
        }
        this.Status = Status.Failed;
        return this.Status;
    };
    BTFallback.prototype.DoReset = function () {
        // Do Something;
    };
    return BTFallback;
}(BTCompositeNode));
exports.BTFallback = BTFallback;
function MakeSequence(children) {
    return new BTSequence(children || []);
}
exports.MakeSequence = MakeSequence;
var BTSequence = /** @class */ (function (_super) {
    __extends(BTSequence, _super);
    function BTSequence(children) {
        return _super.call(this, 'sequence', NodeKinds.SEQUENCE, children) || this;
    }
    BTSequence.prototype.Tick = function () {
        this.Status = Status.Running;
        for (var i = 0; i < this.Children.length; i++) {
            var s = this.Children[i].Tick();
            this.Status = s;
            if (s == Status.Running || s == Status.Failed) {
                return this.Status;
            }
        }
        this.Status = Status.Succeeded;
        return this.Status;
    };
    BTSequence.prototype.DoReset = function () {
        // Do Something;
    };
    return BTSequence;
}(BTNode));
exports.BTSequence = BTSequence;
function MakeTask(name, onTickFunction) {
    return new BTTask(name, onTickFunction);
}
exports.MakeTask = MakeTask;
var BTTask = /** @class */ (function (_super) {
    __extends(BTTask, _super);
    function BTTask(name, onTickFunc) {
        var _this = _super.call(this, name, NodeKinds.TASK, []) || this;
        _this._onTickAction = null;
        _this._onTickAction = onTickFunc;
        return _this;
    }
    BTTask.prototype.Tick = function () {
        this.Status = Status.Running;
        if (this._onTickAction) {
            return this._onTickAction();
        }
        return this.Status;
    };
    BTTask.prototype.DoReset = function () {
        // Do Something;
    };
    return BTTask;
}(BTNode));
exports.BTTask = BTTask;
var BTProgram = /** @class */ (function () {
    function BTProgram() {
        this._currentNode = null;
        this._treeSets = null;
        BTProgram._Current = this;
    }
    BTProgram.BuildProgram = function () {
        var program = new BTProgram();
    };
    return BTProgram;
}());
exports.BTProgram = BTProgram;
console.log('Developing... KeyOnee...');
//# sourceMappingURL=behaviortree.js.map