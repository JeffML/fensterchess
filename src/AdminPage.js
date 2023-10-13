import "./App.css";
import { useQuery, gql } from "@apollo/client";
import { useState } from "react";
import modes from "./utils/modes.js";
import { ExitButton } from "./common/buttons.js";
// import TestComponent, {TestComponent2} from "./TestComponent.js";
import Constellation from "./Constellation.js";

const GET_DATABASES = gql`
    query GetDatabases {
        getAllDbs
    }
`;

const GET_DATABASE_DETAILS = gql`
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

const DatabaseDetails = ({ currDb }) => {
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
                    docCount,
                    compactRunning,
                    sizes: { active, external, file },
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

const Databases = () => {
    const [currDb, setCurrDb] = useState(null);

    const { loading, error, data } = useQuery(GET_DATABASES);
    if (loading) return <p>Loading ...</p>;
    if (error) return <p>Error : {error.toString()}</p>;

    return (
        <div className="row">
            <div className="column" style={{ alignItems: "center" }}>
                <select
                    style={{ width: "fit-content" }}
                    name="dbs"
                    defaultValue=""
                    onChange={(e) => setCurrDb(e.target.value)}
                >
                    <option key="0" value="" disabled={true}>
                        Choose a database...
                    </option>
                    {data.getAllDbs.map((db) => (
                        <option key={db} value={db}>
                            {db}
                        </option>
                    ))}
                </select>
            </div>
            <DatabaseDetails {...{ currDb }} />
        </div>
    );
};

const AdminPage = ({ setMode }) => {
    return (
        <>
            <div className="row centered">
                <Constellation /> { /* {fen, type} */}
            </div>
            <div className="row">
                <div className="column centered">
                    <ExitButton {...{ onClick: () => setMode(modes.main) }} />
                </div>
            </div>
            <Databases />
        </>
    );
};

export default AdminPage;
