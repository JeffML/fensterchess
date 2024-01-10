const Opening2 = (field) => {
    const data = {
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1": {
            eco: "B00",
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
    };

    return {
        read(_, { variables }) {
            const variableString = Object.values(variables).join();
            const dataForFen = data[variableString];
            return dataForFen[field];
        },
    };
};


const policyMap = {
    Opening2: {
        fields: {
            name: Opening2("name"),
            next: Opening2("next")
        },
    },
};

// authlink token for Apollo GraphQL context
const token = process.env.REACT_APP_QUOTE;
const isNonAuthClient = window.location.href.includes("localhost"); // && !token;
const client = isNonAuthClient ? "@client" : "";


export { policyMap as default, token, client };
