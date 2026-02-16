export const ExternalInfoSection = () => (
  <>
    <h3 id="external-info">External Info</h3>
    <p>
      The External Info tab displays game data from external sources and
      Fenster's master games database. Use the selector on the upper right to
      include information from FICS or lichess.
      <img
        src="resources/ExternalInfo.png"
        className="image"
        alt="external site data"
      />
    </p>
    <p>
      When an external site like lichess is selected, the tab shows aggregate
      game information from that site. For example, lichess might show 464 games
      in its database for a given position. External sites may use different
      opening names than Fenster, as opening names are not standardized.
    </p>
    <p>
      The External Info tab also displays master games from Fenster's database
      of tens of thousands of high-level games (2400+ rated players). Games are
      grouped by opening variation and show top players who have played each
      position.
      <img
        src="resources/MasterGamesPosition.png"
        className="image"
        alt="Master Games matching position on the board"
      />
    </p>
    <p>
      Click any variation to see individual games, which can be loaded onto the
      board for analysis.
      <img
        src="resources/MasterGamesOpening.png"
        className="image"
        alt="Master Games for selected opening"
      />
    </p>
  </>
);
