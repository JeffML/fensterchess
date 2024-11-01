# About
[Fenster](https://fensterchess.com) is a chess opening database. The client is open source and maintained in this repository. The data server code is closed source, but limited database access is available by request using a GraphQL API. All opening data is derived from the github project <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.

## Tech Stack
Major techs/dependencies are as follows:
* Create React App 
    * Which is apparently [deprecated](https://dev.to/ag2byte/create-react-app-is-officially-dead-h7o#:~:text=React%20developer%20team%20recently%20removed,react%2Dapp%20is%20finally%20gone.). Looking into [Vite](https://vitejs.dev/).
* Netlify (web hosting serice)
* Node
* React
* Apollo GraphQL
* chess.js and kokopu


## Areas to work on
* I'm no CSS maven, so there's probably massive improvements to be made there.
* React memoization to reduce refresh of fetched data
* Tests
    * Jest is configured, but there are no tests at the moment
    * Cypress would be another option
* Fenster uses several open APIs to fetch opening data
    * A master games server with an open API has yet to be found

## Local development
A local client can be spun up using `netlify dev` (once `netlify_cli` [is installed](https://docs.netlify.com/cli/get-started/)). Code changes are automatically reflected in the browser. There is rate limiting in the database for all non-credentialed client origins (aggregate). If the server is no longer responsive to your local test client, it may be because of this. Send an email to <a href="mailto:fensterchess@gmail.com">Fenster</a>, describing what you are trying to do and you can recieve your own private credential.