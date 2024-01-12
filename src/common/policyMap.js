import { opening2 } from "./localStore.js";

function hasClientDirective(field) {
    return (
        field.directives &&
        field.directives.some((directive) => directive.name.value === "client")
    );
}

const makePolicy = (data) => {
    const readMethod = (fieldName) => {
        return {
            read(cachedValue, args) {
                const { isReference, variables, field } = args;
                if (!isReference(field) && hasClientDirective(field)) {
                    const variableString = Object.values(variables).join();
                    const dataForFen = data[variableString] || data["unknown"];
                    return dataForFen[fieldName];
                } else {
                    return cachedValue;
                }
            },
        };
    };
    return readMethod;
};

const Opening2 = makePolicy(opening2);

const policyMap = {
    Opening2: {
        fields: {
            eco: Opening2("eco"),
            name: Opening2("name"),
            moves: Opening2("moves"),
            next: Opening2("next"),
            from: Opening2("from"),
            aliases: Opening2("aliases"),
            score: Opening2("score"),
        },
    },
};

// authlink token for Apollo GraphQL context
const token = process.env.REACT_APP_QUOTE;
const isNonAuthClient = window.location.href.includes("localhost") && !token;
const client = isNonAuthClient ? "@client" : "";

export { policyMap as default, token, client };
