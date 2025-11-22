export const dateStringShort = (millis?: number): string => {
    const time = millis ?? Date.now();
    const localeTime = new Date(time).toLocaleString('en-US', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return localeTime;
};
