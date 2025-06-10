import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/link-context';
import { token, serverUri } from './common/consts.js';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';

// Note: serverUri can be changed by env var REACT_APP_SERVER (see consts.js)
const httpLink = createHttpLink({
    uri: serverUri,
});

const authLink = setContext((_, { headers }) => {
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

const queryClient = new QueryClient()

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    // <React.StrictMode>
    <ApolloProvider {...{ client }}>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </ApolloProvider>
    // </React.StrictMode>
);

