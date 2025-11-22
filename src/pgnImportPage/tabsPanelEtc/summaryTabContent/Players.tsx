import { useState } from "react";
import type { PgnSummary, Player } from "../../PgnTabsPanelContainer";

interface PlayersProps {
  pgnSumm: PgnSummary;
}

export const Players = ({ pgnSumm }: PlayersProps) => {
  const { players } = pgnSumm;
  const [method, setMethod] = useState<"name" | "ELO" | "title">("name");

  const sort = (a: Player, b: Player) => {
    const titleSort = [
      "GM",
      "WGM",
      "IM",
      "WIM",
      "FM",
      "WFM",
      "CM",
      "WCM",
      "NM",
      "",
    ];

    if (method === "name") return a.name.localeCompare(b.name);
    if (method === "ELO") {
      const bElo = typeof b.elo === "number" ? b.elo : parseInt(b.elo ?? "0");
      const aElo = typeof a.elo === "number" ? a.elo : parseInt(a.elo ?? "0");
      return bElo - aElo;
    }
    if (method === "title") {
      return (
        titleSort.indexOf(a.title ?? "") - titleSort.indexOf(b.title ?? "")
      );
    }
    return 0;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMethod(e.target.value as "name" | "ELO" | "title");

  return (
    <>
      <div id="players" className="players">
        Sort by:{" "}
        <label style={{ marginLeft: "1em" }}>
          <input
            type="radio"
            name="sortBy"
            value="name"
            defaultChecked={true}
            onChange={onChange}
          />
          Player name
        </label>
        <label style={{ display: "inline", marginLeft: "1em" }}>
          <input type="radio" name="sortBy" value="ELO" onChange={onChange} />
          Player ELO
        </label>
        <label style={{ display: "inline", marginLeft: "1em" }}>
          <input type="radio" name="sortBy" value="title" onChange={onChange} />
          Player Title
        </label>
      </div>
      <div className="column scrollableY">
        {Object.values(players)
          .sort(sort)
          .map(({ name, elo, title }, i) => (
            <div
              className="left white player"
              key={name}
              style={{
                backgroundColor: i % 2 ? "slategray" : "inherit",
              }}
            >
              <span className="left">{title}</span>
              <span className="left">{name}</span>
              <span>{elo}</span>
            </div>
          ))}
      </div>
    </>
  );
};
