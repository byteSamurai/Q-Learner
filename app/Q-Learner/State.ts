import {Action} from "./Action";

export class State {
    name:string;
    actions:Map<string,Action>;
    actionsList:Array<Action>;

    constructor(name:string) {
        this.name = name;
        this.actions = new Map<string,Action>();
        this.actionsList = Array<Action>();
    }

    public addAction(nextState:State, reward:number) {
        var action = new Action(nextState,reward);
        this.actionsList.push(action);
        this.actions.set(action.name,action);
    };

    public randomAction() {
        return this.actionsList[~~(this.actionsList.length * Math.random())];
    };
}
