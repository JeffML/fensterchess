import { FENEX } from "./common/consts.js";

const FenOrPgn = ({ setFen, text, setText, chess }) => {
    const handleInput = (e) => {
        e.preventDefault();
        let input = e.clipboardData.getData("text");
        const stubFen = input.split(" ")[0].replace('"', '');

        // FEN?
        if (FENEX.test(stubFen)) {
            try {
                let fen = input.replaceAll(/["\n]/g, '');
                chess.current.load(fen);  
                fen = chess.current.fen()   //scrubs e.p. falsities
                setFen(fen);
                setText(fen);
            } catch (ex) {
                alert(ex.toString());
            }
        } else {
            // PGN?
            try {
                chess.current.loadPgn(input);
                setText(input);
                setFen(chess.current.fen());
            } catch (ex) {
                alert(ex.toString());
            }
        }
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