import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import reportWebVitals from "./reportWebVitals.js";
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/link-context";
import policyMap from "./common/localFields.js"

const httpLink = createHttpLink({
    uri: "https://fenster-s.netlify.app/.netlify/functions/server", //production
});

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = process.env.REACT_APP_QUOTE;
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        },
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(
      {
        typePolicies: policyMap
      }
    ),
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    // <React.StrictMode>
    <ApolloProvider {...{ client }}>
        <App />
    </ApolloProvider>
    // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
