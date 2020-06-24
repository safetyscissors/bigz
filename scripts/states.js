define(function() {
    const STATES = {
        IDLE: 0,
        INIT: 1,
        RUNNING: 2,
        END: 3,
    };
    let state;
    let stateChanged = false;

    function updateState(newStateIndex) {
        stateChanged = true;
        state = newStateIndex;
    }

    return {
        init() {
            state = STATES.IDLE;
        },
        getStateName() {return Object.keys(STATES).find(key => STATES[key] === state)},
        getState() {return state},
        tick() {},
        hasStateChanged() { if (stateChanged) {stateChanged = false; return true;}},
        idle() {updateState(STATES.IDLE)},
        init() {updateState(STATES.INIT)},
        run() {updateState(STATES.RUNNING)},
        end() {updateState(STATES.END)},
        isIdle() {return state === STATES.IDLE},
        isInit() {return state === STATES.INIT},
        isRunning() {return state === STATES.RUNNING},
        isEnd() {return state === STATES.END},
    }
});