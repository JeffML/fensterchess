import { FENEX } from "../common/consts.js";
import "../stylesheets/textarea.css";
import { pgnMovesOnly } from "../utils/chessTools.js";
import { sanitizeInput } from "../utils/sanitizeInput.js";

const FenOrPgn = ({ boardState, setBoardState, chess, setLastKnownOpening }) => {
    const {fen, moves} = boardState

    const text = `FEN:\n${fen}\n\nmoves: ${pgnMovesOnly(moves)}`;

    const handleInput = (e) => {
        e.preventDefault();
        let input = e.clipboardData.getData("text");
        input = sanitizeInput(input)
        const stubFen = input.split(" ")[0];

        let moves="", fen="start"

        // FEN?
        if (FENEX.test(stubFen)) {
            try {
                fen = input;
                chess.current.load(fen);  
                fen = chess.current.fen()   //scrubs e.p. falsities
            } catch (ex) {
                alert(ex.toString());
            }
        } else {
            // PGN?
            try {
                chess.current.loadPgn(input);
                moves = chess.current.pgn()     // canonical pgn
                fen = chess.current.fen();
            } catch (ex) {
                alert(ex.toString());
            }
        }
        setBoardState({fen, moves})
        setLastKnownOpening({})
    };


    return (
        <textarea
            id="fenpgn"
            spellCheck="false"
            placeholder={"Paste moves or FEN here"}
            onChange={() => {}}
            onPaste={(e) => handleInput(e)}
            value={text}
        ></textarea>
    );
};

export { FenOrPgn };
