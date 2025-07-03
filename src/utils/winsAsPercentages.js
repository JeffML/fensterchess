
export const winsAsPercentages = ({ w, b, d }) => {
    let games = w + b + d;
    const pctg = (n) => Math.round((n / games) * 100);

    if (games) {
        return {
            w: pctg(w),
            b: pctg(b),
            d: pctg(d),
        };
    } else return { w: 0, b: 0, d: 0 };
};
