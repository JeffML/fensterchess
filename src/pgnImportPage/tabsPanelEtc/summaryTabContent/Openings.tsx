import { Fragment } from "react/jsx-runtime";
import { sleep } from "../../../utils/sleep";
import { blueBoldStyle } from "../PgnSummaryTab";

interface OpeningsProps {
  openings: Set<string>;
  setFlash: (value: boolean) => void;
  filter: string[];
  setFilter: React.Dispatch<React.SetStateAction<string[]>>;
}

export const Openings = ({
  openings,
  setFlash,
  filter,
  setFilter,
}: OpeningsProps) => {
  const sleepTime = 300;

  const handler = async ({ target }: React.MouseEvent<HTMLInputElement>) => {
    const checkbox = target as HTMLInputElement;
    setFlash(true);
    await sleep(sleepTime);
    setFlash(false);
    await sleep(sleepTime);
    setFlash(true);
    await sleep(sleepTime);
    setFlash(false);
    await sleep(sleepTime);
    setFlash(true);
    await sleep(sleepTime);
    setFlash(false);

    if (checkbox.checked) setFilter((prev) => [...prev, checkbox.value]);
    else setFilter((prev) => prev.filter((f) => f !== checkbox.value));
  };

  return (
    <div className="scrollableY white openings-grid">
      <span
        className="font-cinzel left"
        style={{ ...blueBoldStyle, gridColumn: "span 2" }}
      >
        Openings
        <span style={{ fontSize: "smaller", paddingTop: "2px" }}>
          &nbsp;(from PGN)
        </span>
      </span>
      {Array.from(openings)
        .sort((a, b) => a.localeCompare(b))
        .map((o, i) => (
          <Fragment key={o + i}>
            <input
              type="checkbox"
              value={o}
              onClick={handler}
              defaultChecked={filter.includes(o)}
            ></input>
            <span key={o + i} className="left">
              {o ?? "(no name)"}
            </span>
          </Fragment>
        ))}
    </div>
  );
};
