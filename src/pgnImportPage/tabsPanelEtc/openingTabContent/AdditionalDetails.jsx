import { gql, useQuery } from '@apollo/client';
import { useContext } from "react";
import StackedBarChart from "../../../common/StackedBarChart";
import { SelectedSitesContext } from '../../../contexts/SelectedSitesContext';

const GET_OPENING_ADDITIONAL = gql`
    query getOpeningAdditional($fen: String!, $sites: [String]!) {
        getOpeningAdditional(fen: $fen, sites: $sites) {
            alsoKnownAs
            wins {
                w
                b
                d
            }
        }
    }
`;
export const AdditionalDetails = ({ fen }) => {
    const wins2pctgs = ({ w, b, d }) => {
        let games = w + b + d;
        const pctg = (n) => Math.round((n / games) * 100);

        if (games) {
            return {
                games,
                w: pctg(w),
                b: pctg(b),
                d: pctg(d),
            };
        } else return { w: 0, b: 0, d: 0 };
    };

    const sites = useContext(SelectedSitesContext).selectedSites;

    const { loading, data } = useQuery(GET_OPENING_ADDITIONAL, {
        variables: { fen, sites },
        skip: fen === 'start' || sites.length === 0,
    });

    if (loading)
        return (
            <div id="additionalDetailsLoading" className='additional-details-loading'>
                <strong style={{ marginRight: '1em', color: '#FFCE44' }}>
                    Loading...
                </strong>
            </div>
        );

    if (data) {
        const { alsoKnownAs, wins } = data.getOpeningAdditional;

        const siteData = sites.map((site, i) => {
            const { games, w, b, d } = wins2pctgs(wins[i]);

            return (
                <div
                    id="AdditionalDetails"
                    key={site}
                    className='additional-details'
                >
                    <span>&nbsp;</span>
                    <span>&nbsp;</span>
                    <strong style={{ marginRight: '1em' }}>{site}:</strong>{' '}
                    <span>{alsoKnownAs[i]}</span>
                    <div style={{ marginRight: '3em' }}>
                        <span style={{ marginLeft: '1em', marginRight: '1em' }}>
                            games:
                        </span>{' '}
                        {games ?? 0}
                    </div>
                    <span>
                        {games && (
                            <>
                                {' '}
                                w/d/l: &nbsp;&nbsp;
                                <StackedBarChart
                                    {...{
                                        pctgs: { w, b, d },
                                        style: { display: 'inline-grid' },
                                    }}
                                />{' '}
                            </>
                        )}
                    </span>
                </div>
            );
        });

        return siteData;
    }
};