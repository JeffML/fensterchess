import { useContext } from "react";
import { sites, siteUrls } from "./common/consts.js";
import { SelectedSitesContext } from "./common/SelectedSitesContext.js";

const siteTab = (_, s) => {
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
                        defaultChecked = {selectedSites.get().includes(s)}
                        onClick={({ target }) => {
                            if (target.checked) selectedSites.add(target.value);
                            else selectedSites.remove(target.value);
                        }}
                    ></input>
                    <label
                        htmlFor={s}
                        style={{
                            color: "limegreen",
                            textDecoration: "underline",
                            padding: "0.7em",
                            paddingRight: "1.5em",
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
