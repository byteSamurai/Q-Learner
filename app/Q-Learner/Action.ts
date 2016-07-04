import {State} from "./State";

export class Action {
    name:string;
    nextState:State;
    reward:number;

    constructor(nextState:State, reward:number) {
        this.name = "to_" + nextState.name;
        this.nextState = nextState;
        this.reward = reward
    }
}