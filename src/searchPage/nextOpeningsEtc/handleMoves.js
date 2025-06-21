// open a new tab with this move list
export const handleMoves = (moves) => {
    const domain = window.location.origin;
    const newBrowserTab = domain + `?moves=${moves}`;
    window.open(newBrowserTab, "_blank");
};
