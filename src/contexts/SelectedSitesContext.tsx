import { createContext, useState, ReactNode } from "react";

let selectedSites: string[] = localStorage.sites
  ? JSON.parse(localStorage.sites)
  : [];

interface SelectedSitesState {
  selectedSites: string[];
  add: (site: string) => void;
  remove: (site: string) => void;
  get: () => string[];
}

const SelectedSitesContext = createContext<SelectedSitesState>({
  selectedSites,
  add: () => {},
  remove: () => {},
  get: () => [],
});

interface SelectedSitesContextProviderProps {
  children: ReactNode;
}

const SelectedSitesContextProvider = ({
  children,
}: SelectedSitesContextProviderProps) => {
  const add = (site: string) => {
    selectedSites = [...selectedSites, site];
    localStorage.sites = JSON.stringify(selectedSites);
    setState({ ...state, selectedSites });
  };

  const remove = (site: string) => {
    selectedSites = selectedSites.filter((s) => s !== site);
    localStorage.sites = JSON.stringify(selectedSites);
    setState({
      ...state,
      selectedSites,
    });
  };

  const get = (): string[] => selectedSites;

  const initState: SelectedSitesState = {
    selectedSites,
    add,
    remove,
    get,
  };

  const [state, setState] = useState<SelectedSitesState>(initState);

  return (
    <SelectedSitesContext.Provider value={state}>
      {children}
    </SelectedSitesContext.Provider>
  );
};

export { SelectedSitesContext, SelectedSitesContextProvider };
