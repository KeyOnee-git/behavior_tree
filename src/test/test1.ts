import *  as BT from '../behaviortree';

let action = BT.MakeTask('GAction', GomdorTask);
action.Reset();
action.Tick();

function GomdorTask() : BT.Status
{
    console.log(`GomdorTask`);
    return BT.Status.Succeeded;
}