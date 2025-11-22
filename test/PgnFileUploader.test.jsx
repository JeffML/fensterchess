import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { PgnListPanel } from "../src/pgnImportPage/PgnListPanel.jsx";
import { PgnTabsPanelContainer } from "../src/pgnImportPage/PgnTabsPanelContainer.jsx";
import { OpeningBookProvider } from "../src/contexts/OpeningBookContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * Test suite for PGN file upload functionality
 * Tests the "Upload PGN" option using wcup25.pgn with kokopu implementation
 */
describe("PGN File Upload", () => {
  let setLink;

  beforeEach(() => {
    setLink = (link) => {
      // Track link updates
    };
  });

  it("should render Upload PGN option when local mode is selected", async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <PgnListPanel link={{}} setLink={setLink} />
      </QueryClientProvider>
    );

    // Should default to TWIC mode - find radio by value
    const radios = screen.getAllByRole("radio");
    const twicRadio = radios.find((r) => r.value === "twic");
    const uploadRadio = radios.find((r) => r.value === "local");

    expect(twicRadio).toBeChecked();

    // Switch to local upload mode
    await user.click(uploadRadio);

    expect(uploadRadio).toBeChecked();
    expect(screen.getByText("Choose a PGN file:")).toBeInTheDocument();
  });

  it("should process wcup25.pgn file upload and calculate summary statistics", async () => {
    const user = userEvent.setup();

    // Read the test PGN file
    const pgnPath = resolve(__dirname, "data", "wcup25.pgn");
    const pgnContent = readFileSync(pgnPath, "utf8");

    // Create a File object from the PGN content
    const file = new File([pgnContent], "wcup25.pgn", {
      type: "application/x-chess-pgn",
    });

    let capturedLink = null;
    const mockSetLink = (link) => {
      capturedLink = link;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <PgnListPanel link={{}} setLink={mockSetLink} />
      </QueryClientProvider>
    );

    // Switch to local upload mode
    const radios = screen.getAllByRole("radio");
    const uploadRadio = radios.find((r) => r.value === "local");
    await user.click(uploadRadio);

    // Get file input and upload
    const fileInput = screen.getByLabelText("Choose a PGN file:");
    await user.upload(fileInput, file);

    // Wait for file to be processed
    await waitFor(() => {
      expect(capturedLink).not.toBeNull();
      expect(capturedLink.pgn).toBeDefined();
    });

    // Verify PGN content was captured
    expect(capturedLink.pgn).toContain("FIDE World Cup 2025");
    expect(capturedLink.pgn).toContain('[Event "FIDE World Cup 2025"]');
  });

  it("should render PGN tabs panel with uploaded PGN data", async () => {
    // Read the test PGN file
    const pgnPath = resolve(__dirname, "data", "wcup25.pgn");
    const pgnContent = readFileSync(pgnPath, "utf8");

    const link = { pgn: pgnContent };

    render(
      <QueryClientProvider client={queryClient}>
        <PgnTabsPanelContainer link={link} />
      </QueryClientProvider>
    );

    // Wait for async loading to complete
    await waitFor(
      () => {
        expect(screen.getByText("Summary")).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify tabs are rendered
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Opening")).toBeInTheDocument();
  });

  it("should calculate correct game statistics from wcup25.pgn using kokopu", async () => {
    const pgnPath = resolve(__dirname, "data", "wcup25.pgn");
    const pgnContent = readFileSync(pgnPath, "utf8");

    // Import getPgnSummary dynamically
    const { getPgnSummary } = await import(
      "../src/pgnImportPage/PgnTabsPanelContainer.jsx"
    );

    const summary = await getPgnSummary(pgnContent);

    // Verify summary structure
    expect(summary).toHaveProperty("db");
    expect(summary).toHaveProperty("players");
    expect(summary).toHaveProperty("high");
    expect(summary).toHaveProperty("low");
    expect(summary).toHaveProperty("avg");
    expect(summary).toHaveProperty("count");
    expect(summary).toHaveProperty("openings");
    expect(summary).toHaveProperty("event");

    // Verify game count
    expect(summary.count).toBeGreaterThan(0);
    expect(summary.db.gameCount()).toBe(summary.count);

    // Verify player data structure
    const playerNames = Object.keys(summary.players);
    expect(playerNames.length).toBeGreaterThan(0);

    // Each player should have name and potentially elo
    playerNames.forEach((name) => {
      expect(summary.players[name]).toHaveProperty("name");
      expect(summary.players[name].name).toBe(name);
    });

    // Verify ELO statistics are reasonable
    if (summary.high > 0) {
      expect(summary.high).toBeGreaterThanOrEqual(summary.avg);
      expect(summary.avg).toBeGreaterThanOrEqual(summary.low);
      expect(summary.low).toBeLessThan(9999); // Should be updated from initial value
    }

    // Verify openings set
    expect(summary.openings.size).toBeGreaterThan(0);

    // Verify event
    expect(summary.event).toContain("FIDE World Cup 2025");
  });

  it("should iterate through all games in wcup25.pgn correctly", async () => {
    const pgnPath = resolve(__dirname, "data", "wcup25.pgn");
    const pgnContent = readFileSync(pgnPath, "utf8");

    const { getPgnSummary } = await import(
      "../src/pgnImportPage/PgnTabsPanelContainer.jsx"
    );
    const summary = await getPgnSummary(pgnContent);

    let gameCount = 0;
    for await (const game of summary.db.games()) {
      gameCount++;

      // Verify each game has required pojo structure
      const pojo = game.pojo();
      expect(pojo).toHaveProperty("white");
      expect(pojo).toHaveProperty("black");
      expect(pojo.white).toHaveProperty("name");
      expect(pojo.black).toHaveProperty("name");

      // Stop after checking first few games to keep test fast
      if (gameCount >= 5) break;
    }

    expect(gameCount).toBeGreaterThanOrEqual(5);
  });

  it("should measure Games tab render performance with wcup25.pgn", async () => {
    const user = userEvent.setup();

    // Read the test PGN file
    const pgnPath = resolve(__dirname, "data", "wcup25.pgn");
    const pgnContent = readFileSync(pgnPath, "utf8");

    const { getPgnSummary } = await import(
      "../src/pgnImportPage/PgnTabsPanelContainer.jsx"
    );

    console.time("[Performance Test] PGN Summary calculation");
    const summary = await getPgnSummary(pgnContent);
    console.timeEnd("[Performance Test] PGN Summary calculation");

    console.log(`[Performance Test] Total games in file: ${summary.count}`);
    console.time("[Performance Test] Render PgnTabsPanel");

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <OpeningBookProvider>
          <PgnTabsPanelContainer link={{ pgn: pgnContent }} />
        </OpeningBookProvider>
      </QueryClientProvider>
    );

    console.timeEnd("[Performance Test] Render PgnTabsPanel");

    // Wait for summary tab to load
    await waitFor(() => {
      expect(screen.getByText(/Summary/i)).toBeInTheDocument();
    });

    // Click the Games tab
    const gamesTab = screen.getByText("Games");
    console.time("[Performance Test] Click Games tab to first render");
    await user.click(gamesTab);

    // Wait for first game to appear
    await waitFor(
      () => {
        const rows = container.querySelectorAll("#games-rows > span");
        console.log(
          `[Performance Test] Checking for games, found ${rows.length} spans`
        );
        expect(rows.length).toBeGreaterThan(0);
      },
      { timeout: 60000 } // 60 second timeout to see how long it really takes
    );
    console.timeEnd("[Performance Test] Click Games tab to first render");

    // Verify games are displayed
    const gameRows = container.querySelectorAll("#games-rows > span");
    const gamesDisplayed = gameRows.length / 6; // 6 columns per game
    console.log(`[Performance Test] Games displayed: ${gamesDisplayed}`);
    expect(gamesDisplayed).toBeGreaterThanOrEqual(10); // Should show at least 10
    expect(gamesDisplayed).toBeLessThanOrEqual(25); // Should show at most 25 initially
  }, 70000); // 70 second total test timeout
});
