export const PgnFileUploader = ({ setLink }) => {
    const handler = (e) => {
        const listener = (e) => {
            setLink({ pgn: reader.result });
        };
        const reader = new FileReader();
        reader.addEventListener('load', listener);
        reader.readAsText(e.target.files[0]);
    };

    return (
        <div className="row white centered">
            <div className="row centered">
                <label htmlFor="pgn">Choose a PGN file:</label>
                <br />
            </div>{' '}
            <div className="row centered">
                <input
                    type="file"
                    id="pgn"
                    name="pgnFile"
                    accept=".pgn"
                    onChange={handler}
                />
            </div>
        </div>
    );
};