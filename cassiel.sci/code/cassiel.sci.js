/* SCI (Small Clojure Interpreter) support. */

const path = require('path');
const max = require('max-api');
const { evalString, toJS } = require('@borkdude/sci');
const moment = require('moment');

var bindings = {max: max};

function evaluate(tokens) {
    const code = tokens.join(" ");      // Clojure code fragment as single string.
    const v = evalString(code, {bindings: bindings});

    return v;
}

function emit(cljValue) {
    const v = toJS(cljValue);
    if (Array.isArray(v)) {
        //max.post("ARRAY");
        max.outlet(v);
    } else {
        //max.post("NOT ARRAY");
        max.post(v);
    }
}

const handlers = {
    // "define myVar (range 20)": evaluate some Clojure, bind it here to a variable.
    define: (varName, ...args) => {
        const v = evaluate(args);
        bindings[varName] = v;
    },

    [max.MESSAGE_TYPES.BANG]: () => {
        max.post('bang');
    },

    [max.MESSAGE_TYPES.ALL]: (handled, ...args) => {
        if (!handled) {
            const v = evaluate(args);
            emit(v);
        }
    }
};


max.addHandlers(handlers);


max.post(`loaded ${path.basename(__filename)} at ${moment()}`);
