import *  as BT from '../behaviortree';

let action = BT.MakeTask('GAction', GomdorTask);
action.Reset();
action.Tick();

function GomdorTask() : BT.Status
{
    console.log(`GomdorTask`);
    return BT.Status.Succeeded;
}

let parameters: any[] = [];
parameters.push('abc');
parameters.push(1);
parameters.push(3);
parameters.push('cdedfg');
for (let i in parameters) {
    console.log(`in => i: ${i} : ${parameters[i]}`);
}

for (let i of parameters) {
    console.log(`of => i: ${i}`);
}