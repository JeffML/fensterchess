const ColorAndPieces = ({ colors, pieces, setColors, setPieces }) => {

    const handler = ({ value, name, checked }) => {
        if (name === "color") {
            const newColors = checked
                ? colors.push(value) && colors
                : colors.filter((c) => c !== value);
            setColors(newColors);
        } else if (name === "piece") {
            const newPieces = checked
                ? pieces.push(value) && pieces
                : pieces.filter((p) => p !== value);
            setPieces(newPieces);
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

    const PieceCheckBoxes = () => {
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
                {pieceChoices.map((piece) => (
                    <label key={piece}>
                        {" "}
                        {piece}:{" "}
                        <input
                            type="checkbox"
                            name="piece"
                            value={piece}
                            defaultChecked={
                                pieces.includes(piece)
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
                Pieces: &nbsp;&nbsp; <PieceCheckBoxes />
            </label>
        </div>
    );
};

export { ColorAndPieces };
