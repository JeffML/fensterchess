# About
[Fenster](https://fensterchess.com) is a chess opening database. The client is open source and maintained in this repository. The data server code is closed source, but limited database access is available by request using a GraphQL API. Most opening data is pulled directly from the github project <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.

## Tech Stack
Major techs/dependencies are as follows:
* Vite 
* Netlify (web hosting service)
* Node
* React
* Apollo GraphQL
    * *this is going away, eventually*
* chess.js and kokopu


## Areas to work on
* I'm no CSS maven, so there's probably massive improvements to be made there.
* React memoization to reduce refresh of fetched data
* Tests
    * Version 3.1.0 marked a switch from CRA to Vite
        * This means Vitest can be used for a testing framework
* Fenster uses several open APIs to fetch opening data
    * A master games server with an open API has yet to be found

## Local development
*(I'm in the process of removing the database dependency.)*

A local client can be spun up using `yarn start`.  Code changes are automatically reflected in the browser. There is rate limiting in the database for all non-credentialed client origins (aggregate). If the server is no longer responsive to your local test client, it may be because of this. Send an email to <a href="mailto:fensterchess@gmail.com">Fenster</a>, describing what you are trying to do and you can recieve your own private credential.