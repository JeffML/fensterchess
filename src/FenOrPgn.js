import { FENEX } from "./common/consts.js";
import "./stylesheets/textarea.css";

const FenOrPgn = ({ boardState, setBoardState, chess }) => {
    const {fen, moves} = boardState

    const text = `FEN:\n${fen}\n\nmoves: ${moves}`;

    const handleInput = (e) => {
        e.preventDefault();
        let input = e.clipboardData.getData("text");
        const stubFen = input.trim().split(" ")[0].replace('"', '');

        let moves="", fen="start"

        // FEN?
        if (FENEX.test(stubFen)) {
            try {
                fen = input.trim().replaceAll(/["\n]/g, '');
                chess.current.load(fen);  
                fen = chess.current.fen()   //scrubs e.p. falsities
            } catch (ex) {
                alert(ex.toString());
            }
        } else {
            // PGN?
            try {
                chess.current.loadPgn(input.replaceAll('"', ''));
                moves = chess.current.pgn()     // canonical pgn
                fen = chess.current.fen();
            } catch (ex) {
                alert(ex.toString());
            }
        }
        setBoardState({fen, moves})
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

export {FenOrPgn}