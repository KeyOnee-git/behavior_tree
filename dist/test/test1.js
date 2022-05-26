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
var BT = __importStar(require("../behaviortree"));
var action = BT.MakeTask('GAction', GomdorTask);
action.Reset();
action.Tick();
function GomdorTask() {
    console.log("GomdorTask");
    return BT.Status.Succeeded;
}
var parameters = [];
parameters.push('abc');
parameters.push(1);
parameters.push(3);
parameters.push('cdedfg');
for (var i in parameters) {
    console.log("in => i: " + i + " : " + parameters[i]);
}
for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
    var i = parameters_1[_i];
    console.log("of => i: " + i);
}
//# sourceMappingURL=test1.js.map