import { Stack } from 'stack-typescript';
Main();

function Main() {
    // # TestCode Under..

    //TestStack();
    //TestError();
    TestStackExtension();
}

function TestStackExtension() {
    console.log('# TestStackExtension');
    let stack = new Stack<number>();

    stack.push(1);
    stack.push(2);
    stack.push(3);
    stack.push(4);

    for (let i of stack) {
        console.log(`i(${i})`);
    }

    for (let i of stack) {
        console.log(`i(${i})`);
    }
}

function TestError() {
    let a = 1;
    console.log(`a:${a}`);
    console.log(`a:${a}`);
    throw new Error(`Error Occured!!`);
    console.log('asbd');
    console.log('aaa');
}

function TestStack() {
    let stack: Stack<number> = new Stack<number>();

    stack.push(1);
    stack.push(2);
    stack.push(3);
    
    for (let i = 0; i < 5; i++) {
        let node = stack.pop();
        console.log(`pop[${i}](${node})`);
    }
}

