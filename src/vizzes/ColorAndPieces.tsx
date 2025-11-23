interface ColorAndPiecesProps {
  colors: string[];
  piece: string;
  setColors: (colors: string[]) => void;
  setPiece: (piece: string) => void;
}

interface HandlerTarget {
  value: string;
  name: string;
  checked: boolean;
}

const ColorAndPieces = ({
  colors,
  piece,
  setColors,
  setPiece,
}: ColorAndPiecesProps) => {
  const handler = ({ value, name, checked }: HandlerTarget) => {
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
      <div id="colorChoices" className="white choices">
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
                onClick={(e) => handler(e.target as HTMLInputElement)}
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
      <div className="white choices">
        {pieceChoices.map((p) => (
          <label key={p}>
            {" "}
            {p}:{" "}
            <input
              type="radio"
              name="piece"
              value={p}
              defaultChecked={p === piece}
              onClick={(e) => handler(e.target as HTMLInputElement)}
            />
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="radios">
      <label className="left">
        Color: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <ColorCheckBoxes />
      </label>
      <br />
      <label>
        Pieces: &nbsp;&nbsp; <PieceRadios />
      </label>
    </div>
  );
};

export { ColorAndPieces };
