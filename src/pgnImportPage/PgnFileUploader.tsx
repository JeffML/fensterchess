interface PgnLink {
  url?: string;
  pgn?: string;
}

interface PgnFileUploaderProps {
  setLink: (link: PgnLink) => void;
}

export const PgnFileUploader = ({ setLink }: PgnFileUploaderProps) => {
  const handler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const listener = () => {
      setLink({ pgn: reader.result as string });
    };
    reader.addEventListener("load", listener);
    reader.readAsText(file);
  };

  return (
    <div className="row white centered">
      <div className="row centered">
        <label htmlFor="pgn">Choose a PGN file:</label>
        <br />
      </div>{" "}
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
