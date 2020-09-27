/* SCI (Small Clojure Interpreter) support. */

const path = require('path');
const max = require('max-api');
const { evalString, toJS } = require('@borkdude/sci');
const moment = require('moment');

var bindings = {maxAPI: max,
                post: max.post};

var lastStatement = null;        /* Remember statement; "bang" repeats. */

function evaluate(tokens, keep) {
    var s;

    if (tokens) {
        s = tokens.join(" ");   /* Clojure code fragment as single string. */
    } else {
        s = lastStatement;
    }

    if (keep) {
        lastStatement = s;
    }
    
    if (s) {
        return evalString(s, {classes: {allow: "all"},
                              bindings: bindings});
    } else {
        return null;
    }
}

function emit(cljValue) {
    const v = toJS(cljValue);

    /* Arrays and JS structures will work if they don't contain anything too
       complicated: JS structures get converted into Max dictionaries.

       Watch out for JS promises; they look like JS objects so get emitted
       as dictionaries, but aren't useful.

       Also, avoid "def" and "defn" forms since they won't do what you expect -
       they'll also emerge as internal dictionaries. Use the specific "DEFINE"
       form to add to the bindings. */

    max.outlet(v);
}

function execute(args) {
    try {
        const v = evaluate(args, true);
        if (v) { emit(v); }
    } catch (err) {
        max.post(err.message);
    }
}

const handlers = {
    // "DEFINE myVar (range 20)": evaluate some Clojure, bind it here to a variable.
    DEFINE: (varName, ...args) => {
        try {
            const v = evaluate(args, false);
            if (v) { bindings[varName] = v; }
        } catch (err) {
            max.post(err.message);
        }
    },

    [max.MESSAGE_TYPES.BANG]: () => {
        execute(null, false);
    },

    [max.MESSAGE_TYPES.ALL]: (handled, ...args) => {
        if (!handled) {
            execute(args, true);
        }
    }
};

max.addHandlers(handlers);

max.post(`loaded ${path.basename(__filename)} at ${moment()}`);
