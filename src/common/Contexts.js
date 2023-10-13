import { createContext, useState } from "react";

let selectedSites = [];

const SelectedSitesContext = createContext({
    selectedSites,
    setSelectedSites: () => {},
});

const SelectedSitesContextProvider = ({ children }) => {
    const add = (site) => {
        selectedSites = [...selectedSites, site];
        setState({ ...state, selectedSites });
    };

    const remove = (site) => {
        selectedSites = selectedSites.filter((s) => s !== site);
        setState({
            ...state,
            selectedSites,
        });
    };

    const initState = {
        selectedSites,
        add,
        remove,
    };

    const [state, setState] = useState(initState);

    return (
        <SelectedSitesContext.Provider value={state}>
            {children}
        </SelectedSitesContext.Provider>
    );
};

export { SelectedSitesContext, SelectedSitesContextProvider };
