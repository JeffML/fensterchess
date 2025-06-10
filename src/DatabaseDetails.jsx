import "./App.css";
import { useQuery, gql } from "@apollo/client";

export const GET_DATABASE_DETAILS = gql`
    query GetDatabaseDetails($dbName: String!) {
        getDbDetails(dbName: $dbName) {
            docCount
            compactRunning
            sizes {
                active
                external
                file
            }
        }
    }
`;

export const DatabaseDetails = ({ currDb }) => {
    const { loading, error, data } = useQuery(GET_DATABASE_DETAILS, {
        variables: { dbName: currDb },
        skip: currDb === null,
    });

    let Details = null;
    if (currDb) {
        if (loading) Details = <p>Loading ...</p>;
        if (error) Details = <p>Error : {error.toString()}</p>;
        if (data) {
            const {
                getDbDetails: {
                    docCount, compactRunning, sizes: { active, external, file },
                },
            } = data;
            Details = (
                <div style={{ color: "white" }}>
                    <ul style={{ textAlign: "left" }}>
                        <li>Documents: {docCount}</li>
                        <li>Compaction: {compactRunning.toString()}</li>
                        <li>Active Size: {active}</li>
                        <li>External Size: {external}</li>
                        <li>File Size: {file}</li>
                    </ul>
                </div>
            );
        }
    }
    return (
        <>
            <div
                className="column"
                style={{ alignItems: "center", color: "white" }}
            >
                <u>Database Details</u>
                {Details}
            </div>
        </>
    );
};
