/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/es6-shim/es6-shim.d.ts" />


import {State} from "../Q-Learner/State";
import {Action} from "../Q-Learner/Action";
import {QLearner} from "../Q-Learner/QLearner";


const ROW_ELEM = $('<div class="row"></div>');
const CELL_ELEM = $('<span class="cell"></span>');
const MOUSE_ELEM = $('<i class="mouse"></i>');
const ALPHABETH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CELL_SIZE = 62;
const DEFAULT_REWARD=1000;

export class Field {
    private _mousePosition:string = "";
    private _cheesePosition:string = "";
    private _dimension:number;
    private _board:JQuery;
    private _rows:Map<number,JQuery> = new Map<number,JQuery>();
    private _cells:Map<string,JQuery> = new Map<string,JQuery>();
    private _states:Map<string,State> = new Map<string,State>();


    get mousePosition():string {
        return this._mousePosition;
    }

    get cheesePosition():string {
        return this._cheesePosition;
    }


    constructor(dimension:number = 4, board:JQuery) {
        this._dimension = dimension;
        if (board.length < 1) {
            throw new Error("board is not given");
        }
        this._board = board;
    }


    /**
     * Build map
     */
    public build() {
        this.setRows();
        this.setCells();
        this.setEventshandler();
    }

    /**
     * Controls Eventhandlers
     */
    private setEventshandler() {
        this._cells.forEach((e:JQuery)=> {
            e.on("click", (e:JQueryEventObject)=> {
                $(e.target).toggleClass("block")
            })
        });

        $("#increase-learning").on("click", ()=> {
            $(document).trigger("increase-learning");
        });

        $("#start-phase-2").on("click", ()=> {
            $(".phase-1,.phase-3").hide();
            $(".phase-2").show();

            this._cells.forEach((e:JQuery)=> {
                e.off("click");
            });

            $(document).trigger("phase-2-started");
        });

        $("#start-phase-3").on("click", ()=> {
            $(".phase-1,.phase-2").hide();
            $(".phase-3").show();
            $(document).trigger("phase-3-started");
        });

        $("#restart").on("click", ()=> {
            window.location.reload();
        });
    }

    /**
     * Insert rows in map
     */
    private setRows() {
        // +1 für Bezeichnungen
        for (let i = 1; i <= (this._dimension + 1); i++) {
            let row = ROW_ELEM.clone();
            row.css("width", (this._dimension + 1) * CELL_SIZE);
            this._rows.set(i, row);
            this._board.append(row);
        }
    }

    /**
     * Insert cells in map
     */
    private setCells() {
        var labelRowFilled = false;
        this._rows.forEach((e:JQuery, j:number)=> {
            if (!labelRowFilled) {
                //Blank
                e.append('<label class="cell"></label>');
                for (let i = 0; i < this._dimension; i++) {
                    e.append('<label class="cell">' + ALPHABETH.charAt(i) + '</label>');
                }
                labelRowFilled = true;
            } else {
                var rowNr = j + -1;
                e.append('<label class="cell">' + rowNr + '</label>');

                for (let i = 0; i < this._dimension; i++) {
                    let col = CELL_ELEM.clone();
                    let id = ALPHABETH.charAt(i) + rowNr;
                    col.prop("id", id);
                    this._cells.set(id, col);
                    e.append(col);
                }
            }
        });
    }

    /**
     * sets Maus position
     * @param position
     */
    public setMouse(position:string):void{
        this._mousePosition = position;
        this._cells.get(position).append(MOUSE_ELEM);
    }

    /**
     * set target/cheese in map
     */
    public setCheese(position:string):void{
        //entferne alten Käse
        if (this._cheesePosition !== "") {
            this._cells.get(this._cheesePosition).removeClass("target")
        }

        this._cheesePosition = position;
        this._cells.get(position)
            .addClass("target")
    }

    /**
     * Marks knowledge in map
     * @param rewards
     */
    public updateKnowledge(rewards:Map<State, Map<Action, number>>):void{
        var allStates:Map<string, number> = new Map<string,number>();
        var maxReward:number = 0;
        var hue:number = 226;

        rewards.forEach((actions:Map<Action, number>)=> {
            actions.forEach((reward:number, a:Action)=> {
                allStates.set(a.nextState.name, reward);
                maxReward = Math.max(maxReward, reward);
            });
        });


        allStates.forEach((reward:number, state:string)=> {
            let sat = reward / maxReward * 100;
            let bright = 95 - sat * 0.8;
            this._cells.get(state).css("background-color", "hsl(" + hue + "," + sat + "%," + bright + "%)");
        });

    }

    /**
     * Transfers map setup to the qlearner
     * @param ql
     * @returns {QLearner}
     */
    setupLearner(ql:QLearner):QLearner {
        this._cells.forEach((elem:JQuery, name:string)=> {
            if (elem.hasClass("block")) {
                return;
            }
            interface IDirections {
                left:boolean ,
                right:boolean,
                top:boolean,
                bottom:boolean,
                [key:string]:boolean
            }


            var directions:IDirections = {
                left: true,
                right: true,
                top: true,
                bottom: true
            };

            //Prüfe Ränder
            if (name[0] == "A") {
                directions.left = false;
            }
            if (name[0] == ALPHABETH.charAt(this._dimension - 1)) {
                directions.right = false;
            }
            if (name[1] == "1") {
                directions.top = false;
            }
            if (name[1] == this._dimension.toString()) {
                directions.bottom = false;
            }

            //Prüfe umgebende Blöcke
            if (directions.left) {
                var cell = this._cells.get(Field.getNeighborCellName(name, "left"));
                if (cell.hasClass("block")) {
                    directions.left = false;
                }
            }
            if (directions.right) {
                var cell = this._cells.get(Field.getNeighborCellName(name, "right"));
                if (cell.hasClass("block")) {
                    directions.right = false;
                }
            }
            if (directions.top) {
                var cell = this._cells.get(Field.getNeighborCellName(name, "top"));
                if (cell.hasClass("block")) {
                    directions.top = false;
                }
            }
            if (directions.bottom) {
                var cell = this._cells.get(Field.getNeighborCellName(name, "bottom"));
                if (cell.hasClass("block")) {
                    directions.bottom = false;
                }
            }

            var fromState:State;
            if (this._states.has(name)) {
                fromState = this._states.get(name);
            } else {
                fromState = new State(name);
                this._states.set(name, fromState);
            }


            for (let direction in directions) {
                if (directions[direction] == true) {
                    var neigbourCellName = Field.getNeighborCellName(name, direction);

                    //toState
                    var toState:State;
                    if (this._states.has(neigbourCellName)) {
                        toState = this._states.get(neigbourCellName);
                    } else {
                        toState = new State(neigbourCellName);
                        this._states.set(neigbourCellName, toState);
                    }

                    var reward:number;
                    if (toState.name == this._cheesePosition) {
                        reward = DEFAULT_REWARD;
                    } else {
                        reward = 0;
                    }
                    ql.add(fromState, toState, reward);
                }
            }

        });

        return ql;
    }

    /**
     * Get ID / name of nearby cells
     * @param referenceCellName
     * @param direction
     * @returns {string}
     */
    private static getNeighborCellName(referenceCellName:string, direction:string):string {

        switch (direction) {
            case "left":
                var oldRow:number = ALPHABETH.indexOf(referenceCellName[0]);
                var newChar = ALPHABETH.charAt(oldRow - 1);
                return newChar + referenceCellName[1];
            case "right":
                var oldRow:number = ALPHABETH.indexOf(referenceCellName[0]);
                var newChar = ALPHABETH.charAt(oldRow + 1);
                return newChar + referenceCellName[1];
            case "top":
                var oldCol:number = parseInt(referenceCellName[1]);
                return referenceCellName[0] + (oldCol - 1);
            case "bottom":
            default:
                var oldCol:number = parseInt(referenceCellName[1]);
                return referenceCellName[0] + (oldCol + 1);
        }

    }
}