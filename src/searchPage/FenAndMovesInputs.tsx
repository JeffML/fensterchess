import {
  ClipboardEvent,
  MutableRefObject,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { FENEX, POSITION_ONLY_FEN_REGEX } from "../common/consts";
import "../stylesheets/textarea.css";
import { pgnMovesOnly } from "../utils/chessTools";
import { sanitizeInput } from "../utils/sanitizeInput.js";
import { BoardState, Opening, OpeningBook, PositionBook } from "../types";
import { ChessPGN } from "@chess-pgn/chess-pgn";

type SearchMode = "position" | "name";

/**
 * Component to display moves with opening variation highlighted in bold
 */
const MoveDisplay = ({
  moves,
  openingPlyCount,
}: {
  moves: string;
  openingPlyCount?: number;
}) => {
  if (!moves) {
    return <span style={{ color: "#888" }}>Paste moves or PGN here</span>;
  }

  // If no opening ply count, just display all moves normally
  if (!openingPlyCount) {
    return <>{moves}</>;
  }

  // Find where opening ends by counting SAN moves
  const sanMoveRegex = /[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?|O-O(-O)?[+#]?/g;
  let plyCount = 0;
  let splitIndex = moves.length;

  for (const match of moves.matchAll(sanMoveRegex)) {
    plyCount++;
    if (plyCount === openingPlyCount) {
      splitIndex = match.index! + match[0].length;
      break;
    }
  }

  const openingPart = moves.substring(0, splitIndex);
  const restPart = moves.substring(splitIndex);

  return (
    <>
      <span style={{ fontWeight: "bold" }}>{openingPart}</span>
      <span>{restPart}</span>
    </>
  );
};

const OPENING_ALIASES: Record<string, string[]> = {
  petrov: ["petroff", "petrov defense", "petroff defense"],
  petroff: ["petrov", "petrov defense", "petroff defense"],
  caro: ["caro-kann", "carokann"],
  kann: ["caro-kann", "carokann"],
  ruy: ["ruy lopez", "spanish"],
  spanish: ["ruy lopez", "ruy"],
  kings: ["king"],
  scotch: ["scottish"],
};

function filterOpenings(
  searchTerm: string,
  openingBook: OpeningBook | undefined
): Array<[string, Opening]> {
  if (!searchTerm.trim() || !openingBook) return [];

  // Normalize search term
  const normalized = searchTerm
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[-,]/g, " ") // Replace punctuation with space
    .trim();

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const results = Object.entries(openingBook).filter(([_fen, opening]) => {
    const name = opening.name
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[-,]/g, " ");

    // All original words must appear (or their aliases)
    return words.every((word) => {
      const variants = OPENING_ALIASES[word] || [];
      return [word, ...variants].some((variant) => name.includes(variant));
    });
  });

  // Deduplicate by name, keeping only the shortest move sequence
  const nameMap = new Map<string, [string, Opening]>();

  for (const [fen, opening] of results) {
    const existing = nameMap.get(opening.name);
    if (!existing || opening.moves.length < existing[1].moves.length) {
      nameMap.set(opening.name, [fen, opening]);
    }
  }

  return Array.from(nameMap.values()).slice(0, 20); // Limit results
}

interface FenAndMovesInputsProps {
  boardState: BoardState;
  setBoardState: (state: BoardState) => void;
  chess: MutableRefObject<ChessPGN>;
  setLastKnownOpening: (opening: Partial<Opening>) => void;
  openingBook: OpeningBook | undefined;
  positionBook: PositionBook | undefined;
}

const FenAndMovesInputs = ({
  boardState,
  setBoardState,
  chess,
  setLastKnownOpening,
  openingBook,
  positionBook,
}: FenAndMovesInputsProps) => {
  const { fen, moves } = boardState;
  const [searchMode, setSearchMode] = useState<SearchMode>("position");
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const handleFenPaste = (
    e: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    let input = e.clipboardData.getData("text");
    input = sanitizeInput(input);

    const isPositionOnly = POSITION_ONLY_FEN_REGEX.test(input);
    const stubFen = input.split(" ")[0];

    // Validate FEN position part
    if (!FENEX.test(stubFen)) {
      alert("Invalid FEN format");
      return;
    }

    // If position-only FEN, try to look it up in opening book
    if (isPositionOnly) {
      if (!openingBook || !positionBook) {
        alert("Opening database not loaded yet. Please wait and try again.");
        return;
      }

      // Look up the position in the position book
      const posEntry = positionBook[stubFen];
      if (!posEntry || posEntry.length === 0) {
        alert(
          "Position not found in opening database. Please enter a full FEN or a position from the opening book."
        );
        return;
      }

      // Get the first matching opening FEN
      const openingFen = posEntry[0];
      const opening = openingBook[openingFen];

      if (!opening) {
        alert("Position not found in opening database.");
        return;
      }

      // Success! Load the opening's moves and update state
      try {
        chess.current.loadPgn(opening.moves);
        const resultingFen = chess.current.fen();
        const validatedMoves = chess.current.pgn();
        setBoardState({ fen: resultingFen, moves: validatedMoves });
        setLastKnownOpening(opening);
      } catch (ex) {
        alert(`Error loading opening: ${(ex as Error).message}`);
      }
      return;
    }

    // Full FEN provided - validate and load it
    try {
      chess.current.load(input);
      const validatedFen = chess.current.fen();
      setBoardState({ fen: validatedFen, moves: "" });
      setLastKnownOpening({});
    } catch (ex) {
      alert((ex as Error).toString());
    }
  };

  const handleMovesPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    let input = e.clipboardData.getData("text");
    input = sanitizeInput(input);

    // Validate PGN/moves
    try {
      chess.current.loadPgn(input);
      const validatedMoves = chess.current.pgn(); // canonical pgn
      const resultingFen = chess.current.fen();
      setBoardState({ fen: resultingFen, moves: validatedMoves });
      setLastKnownOpening({});
    } catch (ex) {
      alert((ex as Error).toString());
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(nameSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameSearchTerm]);

  // Filter openings based on debounced search term
  const filteredOpenings = useMemo(
    () => filterOpenings(debouncedSearchTerm, openingBook),
    [debouncedSearchTerm, openingBook]
  );

  const handleOpeningClick = useCallback(
    (opening: Opening) => {
      try {
        chess.current.reset();
        chess.current.loadPgn(opening.moves);
        const resultingFen = chess.current.fen();
        const validatedMoves = chess.current.pgn();
        setBoardState({ fen: resultingFen, moves: validatedMoves });
        setLastKnownOpening(opening);
        setNameSearchTerm(""); // Clear search after selection
        setSearchMode("position"); // Switch to position tab to show FEN and moves
      } catch (ex) {
        alert(`Error loading opening: ${(ex as Error).message}`);
      }
    },
    [chess, setBoardState, setLastKnownOpening]
  );

  const fenDisplay =
    fen === "start"
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : fen;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
        marginTop: "-10px",
      }}
    >
      {/* Tab Controls */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-bg-menu-item)",
          marginBottom: "4px",
        }}
      >
        <button
          onClick={() => setSearchMode("position")}
          style={{
            padding: "6px 16px",
            border: "none",
            borderBottom:
              searchMode === "position"
                ? "3px solid var(--color-accent-green)"
                : "3px solid transparent",
            backgroundColor:
              searchMode === "position"
                ? "var(--color-bg-menu-item)"
                : "transparent",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            color:
              searchMode === "position"
                ? "var(--color-link)"
                : "var(--color-text-muted)",
            transition: "all 0.2s ease",
          }}
        >
          {searchMode === "position" ? "▶ " : ""}By Position
        </button>
        <button
          onClick={() => setSearchMode("name")}
          style={{
            padding: "6px 16px",
            border: "none",
            borderBottom:
              searchMode === "name"
                ? "3px solid var(--color-accent-green)"
                : "3px solid transparent",
            backgroundColor:
              searchMode === "name"
                ? "var(--color-bg-menu-item)"
                : "transparent",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            color:
              searchMode === "name"
                ? "var(--color-link)"
                : "var(--color-text-muted)",
            transition: "all 0.2s ease",
          }}
        >
          {searchMode === "name" ? "▶ " : ""}By Name
        </button>
      </div>

      {searchMode === "position" ? (
        <>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "2px",
                fontSize: "11px",
              }}
            >
              Position (FEN) - Paste here:
            </label>
            <div
              contentEditable
              suppressContentEditableWarning
              spellCheck="false"
              onPaste={handleFenPaste}
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                width: "100%",
                minHeight: "20px",
                padding: "4px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                backgroundColor: "#fff",
                color: "#000",
                overflowWrap: "break-word",
                cursor: "text",
              }}
            >
              {fenDisplay}
            </div>
          </div>

          <div>
            <label
              htmlFor="moves-input"
              style={{
                display: "block",
                marginBottom: "2px",
                fontSize: "11px",
              }}
            >
              Move Sequence:
            </label>
            <div
              id="moves-input"
              onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
                handleMovesPaste(e as unknown as ClipboardEvent<HTMLTextAreaElement>);
              }}
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                width: "100%",
                minHeight: "55px",
                padding: "4px",
                backgroundColor: "#fff",
                color: "#000",
                border: "1px solid #ccc",
                borderRadius: "3px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <MoveDisplay
                moves={pgnMovesOnly(moves)}
                openingPlyCount={boardState.openingPlyCount}
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <label
            htmlFor="name-input"
            style={{ display: "block", marginBottom: "2px", fontSize: "11px" }}
          >
            Opening Name:
          </label>
          <input
            id="name-input"
            type="text"
            spellCheck="false"
            placeholder="Type opening name to search..."
            value={nameSearchTerm}
            onChange={(e) => setNameSearchTerm(e.target.value)}
            style={{
              fontFamily: "sans-serif",
              fontSize: "12px",
              width: "100%",
              padding: "6px",
              border: "1px solid #ccc",
              borderRadius: "3px",
            }}
          />
          {filteredOpenings.length > 0 && (
            <div
              style={{
                marginTop: "4px",
                border: "1px solid #ccc",
                borderRadius: "3px",
                maxHeight: "300px",
                overflowY: "auto",
                backgroundColor: "#fff",
              }}
            >
              {filteredOpenings.map(([fen, opening]) => (
                <div
                  key={fen}
                  onClick={() => handleOpeningClick(opening)}
                  style={{
                    padding: "4px 8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                    fontSize: "12px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                >
                  <div style={{ fontWeight: "500", color: "#000" }}>
                    {opening.name}
                  </div>
                </div>
              ))}
            </div>
          )}
          {debouncedSearchTerm && filteredOpenings.length === 0 && (
            <div
              style={{
                marginTop: "4px",
                padding: "8px",
                fontSize: "12px",
                color: "#666",
                fontStyle: "italic",
              }}
            >
              No openings found matching "{debouncedSearchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { FenAndMovesInputs };
