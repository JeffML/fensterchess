import { useQuery , gql} from "@apollo/client";
import { useState } from "react";
import { DatabaseDetails } from "./DatabaseDetails.js";

export const GET_DATABASES = gql`
    query GetDatabases {
        getAllDbs
    }
`;

export const Databases = () => {
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
