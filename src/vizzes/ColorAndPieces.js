const ColorAndPieces = ({ isWhite, pieces, setIsWhite, setPieces }) => {
    const ColorCheckBoxes = () => {
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
                <label>
                    {" "}
                    White:{" "}
                    <input
                        type="checkbox"
                        name="color"
                        value="white"
                        defaultChecked={isWhite || isWhite === undefined}
                    />
                </label>
                <label>
                    {" "}
                    Black:{" "}
                    <input
                        type="checkbox"
                        name="color"
                        value="black"
                        defaultChecked={!isWhite || isWhite === undefined}
                    />
                </label>
            </div>
        );
    };

    const PieceCheckBoxes = () => {
        const pieceChoices = ["P", "R", "N", "B", "Q", "K",]
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
                {pieceChoices.map(piece => 
                <label style={{}}>
                {" "}
                {piece}:{" "}
                <input
                    type="checkbox"
                    name="piece"
                    value={piece}
                    defaultChecked={pieces.includes(piece) || pieces.length === 0}
                />
            </label>
                )}
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
            >
                Color: <ColorCheckBoxes />
            </label>
            <br />
            <label
                style={{
                    fontSize: "larger",
                    fontStyle: "bold",
                    color: "mediumturquoise",
                }}
            >
                Pieces: <PieceCheckBoxes />
            </label>
        </div>
    );
};

export { ColorAndPieces };
