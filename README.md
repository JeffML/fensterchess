# About
[Fenster](https://fensterchess.com) is a chess opening database. The client is open source and maintained in this repository. There is an associated server project, which acts as a proxy for some third-party data requests. Most opening data is pulled directly from the github project <a href="https://github.com/hayatbiralem/eco.json">eco.json</a>.

## Tech Stack
Major techs/dependencies are as follows:
* Vite 
* Netlify (web hosting service)
* Node
* React
* chess.js and kokopu


## Areas to work on
* There's always room for CSS improvements.
* Tests
    * Version 3.1.0 marked a switch from CRA to Vite
        * This means Vitest can be used for a testing framework
* Fenster uses several open APIs to fetch opening data
    * A master games server with an open API has yet to be found

A local client can be spun up using `yarn start`.  Code changes are automatically reflected in the browser. If encountering problems, send an email to <a href="mailto:fensterchess@gmail.com">Fenster</a>, describing what you are trying to do and you can recieve your own private credential. You can also [raise an issue](https://github.com/JeffML/fensterchess/issues) in GitHub.