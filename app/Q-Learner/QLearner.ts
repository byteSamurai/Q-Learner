import {State} from "./State";
import {Action} from "./Action";

export class QLearner {
    get states():Map<string, State> {
        return this._states;
    }

    get currentState():State {
        return this._currentState;
    }

    get rewards():Map<State, Map<Action, number>> {
        return this._rewards;
    }

    // state => <Action,reward>
    private _rewards:Map<State,Map<Action,number>> = new Map<State,Map<Action,number>>();
    private _states:Map<string,State> = new Map<string,State>();
    private _statesList:Array<State> = [];
    private _currentState:State = null;
    private _gamma:number = 0.8;


    constructor(gamma:number) {
        this._gamma = gamma;
    }

    /**
     * Add transition
     * @param from
     * @param to
     * @param reward
     */
    add(from:State, to:State, reward:number):void {
        if (!this._states.has(from.name)) {
            this.addState(from);
        }
        if (!this._states.has(to.name)) {
            this.addState(to);
        }
        this._states.get(from.name).addAction(to, reward);
    };

    /**
     * add new state
     * @param state
     * @returns {State}
     */
    addState(state:State):State {
        this._states.set(state.name, state);
        this._statesList.push(state);
        return state;
    };

    /**
     * Sets current state
     * @param name {string}
     * @returns {State}
     */
    setState(name:string):State {
        this._currentState = this._states.get(name);
        return this._currentState;
    };


    /**
     * Gets a random State
     * @returns {State}
     */
    randomState():State {
        return this._statesList[~~(this._statesList.length * Math.random())];
    };

    /**
     * Q_max(s,a)
     * @param state
     * @returns {number}
     */
    optimalFutureValue(state:State):number {
        if (!this._rewards.has(state)) {
            return 0;
        }
        var stateRewards = this._rewards.get(state);

        if (stateRewards == undefined) {
            return;
        }
        var max = 0;
        stateRewards.forEach((reward:number)=> {
            max = Math.max(max, reward || 0);
        });

        return max;
    };

    /**
     * Agent makes a step
     * @returns {void}
     */
    step():void {

        //this.logReward();

        if (!this._currentState) {
            this._currentState = this.randomState();
        }

        var action = this._currentState.randomAction();
        if (!action) {
            return null;
        }

        if (!this._rewards.has(this._currentState)) {
            this._rewards.set(this._currentState, new Map<Action,number>());
        }

        //setze neue Belohnung
        var newReward = ~~((action.reward || 0) + this._gamma * this.optimalFutureValue(action.nextState));
        var rewardsOfState = this._rewards.get(this._currentState);
        rewardsOfState.set(action, newReward);
        this._rewards.set(this._currentState, rewardsOfState);

        this._currentState = this._states.get(action.nextState.name);
    }

    /**
     * Logs learned rewards to console.log
     */
    logReward() {
        var msg = "";
        this._rewards.forEach((v, k)=> {
            msg += k.name + " ";
            v.forEach((r, a)=> {
                msg += a.name + "=" + r + "\t";
            });
            msg += "\n";
        });
        console.log(msg);
    }

    /**
     * Exploration
     * @param steps
     */
    learn(steps:number):void {
        steps = Math.max(1, steps || 0);
        while (steps--) {
            this._currentState = this.randomState();
            this.step();
        }
    };


    /**
     * Get best action
     * @param state
     * @returns Action
     */
    bestAction(state:State):Action {
        if (!this._rewards.has(state)) {
            this._rewards.set(state, new Map<Action,number>())
        }
        var stateRewards = this._rewards.get(state);
        var bestAction:Action = null;

        stateRewards.forEach((reward:number, action:Action)=> {
            if (!bestAction) {
                bestAction = action;
            } else if ((stateRewards.get(action) == stateRewards.get(bestAction)) && (Math.random() > 0.5)) {
                bestAction = action;
            } else if (stateRewards.get(action) > stateRewards.get(bestAction)) {
                bestAction = action;
            }
        });
        return bestAction;
    };

    /**
     * Is action known
     * @param state
     * @param action
     * @returns {boolean}
     */
    knowsAction(state:State, action:Action):boolean {
        return this._rewards.get(state).has(action);
    };


    /**
     * Execute a certain action
     * @param action
     * @returns {State}
     */
    applyAction(action:Action):State {
        this._currentState = this._states.get(action.nextState.name);
        return this._currentState;
    };

    /**
     * Do a action based on knowledge
     * @returns {State}
     */
    runOnce():State {
        var best = this.bestAction(this._currentState);
        var action = this._states.get(this._currentState.name).actions.get(best.name);
        if (action) {
            this._currentState = this._states.get(action.nextState.name);
        }
        return this._currentState;
    };
}