
import {Field} from "./Field/Field";
import {QLearner} from "./Q-Learner/QLearner";
import {State} from "./Q-Learner/State";

var field:Field, ql:QLearner;
var startField = "B2"
var targetField = "I9"
/**
 * Phase 1
 */
$(()=> {
    console.log("Phase 1 gestartet");
    field = new Field(9, $(".border"));
    field.build();
    field.setMouse(startField);
    field.setCheese(targetField);
});

/**
 * Phase 2
 */
var lernphase:any;
$(document).on("phase-2-started", ()=> {
    var alpha:number=parseFloat($("#alpha").val() as string);
    console.log("Phase 2 gestartet mit alpha "+alpha);
    ql = new QLearner(alpha);
    ql=field.setupLearner(ql);


    lernphase = setInterval(function () {
        ql.setState(ql.randomState().name);
        ql.step();
        field.setMouse(ql.currentState.name);
        field.updateKnowledge(ql.rewards);
    }, 50);
});

/**
 * Phase 3
 */
$(document).on("phase-3-started", ()=> {
    console.log("Phase 3 gestartet");
    clearInterval(lernphase);
    var startState:State;
    //set to start
    startState=ql.states.get(startField);
    ql.setState(startState.name);
    field.setMouse(startState.name);

    lernphase = setInterval(function () {
        //Reset in target prosition
        if(ql.currentState.name==field.cheesePosition){
            ql.setState(startState.name);
            field.setMouse(ql.currentState.name);
            return;
        }

        ql.runOnce();
        field.setMouse(ql.currentState.name);

    }, 200);
});

/**
 * Lernen
 */
$(document).on("increase-learning",()=>{
    ql.learn(10000);
});



