type TickAction = () => Status;

export enum Status {
    Ready,
    Running,
    Succeeded,
    Failed,
}

export enum NodeKinds {
    //INVALID = 'invalid',

    TASK = 'task',

    TREE = 'tree',

    FALLBACK = 'fallback',
    SEQUENCE = 'sequence',
    PARALLEL = 'parallel',
    RACE = 'race',

    WHILE = 'while',
    REPEAT = 'repeat',
    RANDOM = 'random',

    NOT = 'not',
    MUTE = 'mute',
}

export abstract class BTNode {
    protected _name:string = "";
    protected _kind:NodeKinds = NodeKinds.TASK;    
    protected _status: Status = Status.Failed;
    protected _prevStatus: Status = Status.Ready;
    private _parent: BTNode = this;
    private _children: BTNode[] | [];

    // # Not yet
    protected _tick : number = -1;

    constructor(name:string, kind: NodeKinds, children: BTNode[]) {
        this._name = name;
        this._kind = kind;
        this._children = children || [];
    }

    public Tick(): Status {
        return this.Status;
    }

    public Reset() : void {
        if(this.Status != Status.Ready) {
            this.Status = Status.Ready;

            this.DoReset();
        }
    }

    public abstract DoReset() : void;

    //#region Getter
    get Name(): string {
        return this._name;
    }
    get Kind():NodeKinds {
        return this._kind;
    }
    get Status():Status {
        return this._status;
    }
    get Children(): BTNode[] {
        return this.Children;
    }
    get Parent(): BTNode {
        return this._parent;
    }
    //#endregion

    //#region Setter
    set Status(val:Status) {
        this._status = val;
    }
    set Parent(val:BTNode) {
        this._parent = val;
    }
    //#endregion
}

export abstract class BTCompositeNode extends BTNode {

    constructor(name:string, kind:NodeKinds, children:BTNode[]){
        super(name, kind, children);
    }

    public DoReset(): void {
        let children = this.Children;
        children.forEach(btnode => {
            btnode.Reset();
        });
    }
}


export function MakeTree(name:string, children:BTNode[]) : BTTree {
    return new BTTree(name, children);
}
export class BTTree extends BTNode {
    protected _child:BTNode | null = null;

    constructor(name:string, children: BTNode[] ) {
        super(name, NodeKinds.TREE, children);

        if(children.length > 0){
            this._child = children[0];
        }
    }

    public DoReset(): void {
        this._child?.Reset();
    }
}


export function MakeFallback(children: BTNode[]) : BTFallback {
    return new BTFallback(children || []);
}
export class BTFallback extends BTCompositeNode {
   
    constructor(children: BTNode[]) {
        super('fallback', NodeKinds.FALLBACK, children);
    }

    public override Tick(): Status {
        this.Status = Status.Running;
        for(let i=0; i< this.Children.length; i++) {
            let s = this.Children[i].Tick();
            this.Status = s;
            if(s == Status.Running || s == Status.Succeeded) {
                return this.Status;
            }
        }
        this.Status = Status.Failed;
        return this.Status;        
    }

    public override DoReset(): void {
        // Do Something;
    }
}

export function MakeSequence(children: BTNode[]) : BTSequence {
    return new BTSequence(children || []);
}
export class BTSequence extends BTNode {
    constructor(children: BTNode[]) {
        super('sequence', NodeKinds.SEQUENCE, children);
    }

    public override Tick(): Status {
        this.Status = Status.Running;
        for(let i=0; i< this.Children.length; i++){
            let s = this.Children[i].Tick();
            this.Status = s;
            if(s == Status.Running || s == Status.Failed){
                return this.Status;
            }
        }
        this.Status = Status.Succeeded;
        return this.Status;
    }

    public override DoReset(): void {
        // Do Something;
    }
}

export function MakeTask(name:string, onTickFunction: TickAction) : BTTask {
    return new BTTask(name, onTickFunction);
}
export class BTTask extends BTNode {
    protected _onTickAction:(TickAction | null) = null;

    constructor(name: string, onTickFunc: TickAction) {
        super(name, NodeKinds.TASK, []);
        this._onTickAction = onTickFunc;
    }

    public override Tick(): Status {
        this.Status = Status.Running;
        if(this._onTickAction) {
            return this._onTickAction();
        }
        return this.Status;
    }

    public override DoReset(): void {
        // Do Something;
    }
}

export class BTProgram {
    static _Current: BTProgram;
    _currentNode: BTNode | null = null;
    
    _treeSets:BTTree[][] | null = null;

    constructor() {
        BTProgram._Current = this;
    }

    static BuildProgram(strBT:string) : BTProgram{
        let program: BTProgram = new BTProgram();

        return program;
    }
}

console.log('Developing... KeyOnee...');

export const SIMPLE_BT = `
tree("root")
    fallback
        sequence
            MoveTowardPlayer("abc", 1.0, 12, 3.14)
            KillSelf()
            Fail
        sequence
            Succeed
`;