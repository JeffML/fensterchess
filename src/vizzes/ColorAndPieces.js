const ColorAndPieces = ({ colors, piece, setColors, setPiece }) => {

    const handler = ({ value, name, checked }) => {
        if (name === "color") {
            const newColors = checked
                ? colors.concat(value)
                : colors.filter((c) => c !== value);
            setColors(newColors);
        } else if (name === "piece") {
            setPiece(value);
        }
    };

    const ColorCheckBoxes = () => {
        const colorChoices = ["White", "Black"];

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    gap: "1em",
                    fontStyle: "smaller",
                    fontSize: "smaller",
                }}
                className="white"
            >
                {colorChoices.map((c) => {
                    return (
                        <label key={c}>
                            {" "}
                            {c}:{" "}
                            <input
                                type="checkbox"
                                name="color"
                                value={c}
                                defaultChecked={colors.includes(c)}
                                onClick={(e) => handler(e.target)}
                            />
                        </label>
                    );
                })}
            </div>
        );
    };

    const PieceRadios = () => {
        const pieceChoices = ["P", "R", "N", "B", "Q", "K"];
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    gap: "1em",
                    fontStyle: "smaller",
                    fontSize: "smaller",
                }}
                className="white"
            >
                {pieceChoices.map((p) => (
                    <label key={p}>
                        {" "}
                        {p}:{" "}
                        <input
                            type="radio"
                            name="piece"
                            value={p}
                            defaultChecked={
                                p === piece
                            }
                            onClick={(e) => handler(e.target)}
                        />
                    </label>
                ))}
            </div>
        );
    };

    return (
        <div style={{ marginTop: "1em" }}>
            <label
                style={{
                    fontSize: "larger",
                    fontStyle: "bold",
                    color: "mediumturquoise",
                }}
                className="left"
            >
                Color: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <ColorCheckBoxes />
            </label>
            <br />
            <label
                style={{
                    fontSize: "larger",
                    fontStyle: "bold",
                    color: "mediumturquoise",
                }}
            >
                Pieces: &nbsp;&nbsp; <PieceRadios />
            </label>
        </div>
    );
};

export { ColorAndPieces };
