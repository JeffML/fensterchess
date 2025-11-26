import { useContext, MouseEvent } from "react";
import { sites, siteUrls } from "./common/consts";
import { SelectedSitesContext } from "./contexts/SelectedSitesContext";

const siteTab = (_: MouseEvent, s: keyof typeof siteUrls) => {
  window.open(siteUrls[s], "_blank");
};

const Sites2 = () => {
  const selectedSites = useContext(SelectedSitesContext);

  return (
    <div>
      {sites.map((s) => (
        <div key={s} style={{ display: "inline" }}>
          <input
            id={s}
            type="checkbox"
            value={s}
            defaultChecked={selectedSites.get().includes(s)}
            onClick={({ target }) => {
              if ((target as HTMLInputElement).checked)
                selectedSites.add((target as HTMLInputElement).value);
              else selectedSites.remove((target as HTMLInputElement).value);
            }}
          ></input>
          <label
            htmlFor={s}
            style={{
              color: "limegreen",
              textDecoration: "underline",
              padding: "0.3em",
              paddingRight: "0.8em",
            }}
            onClick={(e) => siteTab(e, s)}
          >
            {s}
          </label>
        </div>
      ))}
    </div>
  );
};

export { Sites2 as default };
