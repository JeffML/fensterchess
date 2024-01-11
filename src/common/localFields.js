const Opening2 = (fieldName) => {
    const data = {
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1": {
            eco: "B00M",
            moves: "1. e4",
            name: "King's Pawn Game",
            next: [
                {
                    name: "King's Pawn Game",
                    moves: "1. e4 e5",
                    score: 0.43,
                    eco: "C20",
                },
            ],
            from: [],
            aliases: ["King's Pawn", "King's Pawn"],
            score: 0.44,
        },
        "unknown": {
            eco: "F00",
            moves: "1. i4",
            name: "No Pawn Game",
            next: [

            ],
            from: [],
            aliases: [],
            score: -99.0,
        },
    };

    function hasClientDirective(field) {
        return (
            field.directives &&
            field.directives.some(
                (directive) => directive.name.value === "client"
            )
        );
    }

    return {
        read(cachedValue, args) {
            const { isReference, variables, field } = args;
            // const field = readField(fieldName);
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
// const isNonAuthClient = window.location.href.includes("localhost"); // && !token;
// const client = isNonAuthClient ? "@client" : "";
const client = "@client";

export { policyMap as default, token, client };
