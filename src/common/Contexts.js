import { createContext, useState } from "react";

let selectedSites = localStorage.sites? JSON.parse(localStorage.sites) : [];

const SelectedSitesContext = createContext({
    selectedSites,
    setSelectedSites: () => {},
});

const SelectedSitesContextProvider = ({ children }) => {
    const add = (site) => {
        selectedSites = [...selectedSites, site];
        localStorage.sites = JSON.stringify(selectedSites)
        setState({ ...state, selectedSites });
    };

    const remove = (site) => {
        selectedSites = selectedSites.filter((s) => s !== site);
        localStorage.sites = JSON.stringify(selectedSites)
        setState({
            ...state,
            selectedSites,
        });
    };

    const get = () => selectedSites

    const initState = {
        selectedSites,
        add,
        remove,
        get
    };

    const [state, setState] = useState(initState);

    return (
        <SelectedSitesContext.Provider value={state}>
            {children}
        </SelectedSitesContext.Provider>
    );
};

export { SelectedSitesContext, SelectedSitesContextProvider };
