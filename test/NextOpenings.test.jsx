import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextOpenings } from "../src/searchPage/nextOpeningsEtc/NextOpenings";
import { SortEnum } from "../src/common/consts";

describe("NextOpenings", () => {
  const mockLegalMoves = [
    {
      name: "Queen's Gambit Declined",
      moves: "1. d4 Nf6 2. c4 e6 3. Nf3 d5",
      eco: "D30",
      theMove: "Nf6",
      nextPly: "Nf6",
    },
    {
      name: "King's Indian Defense",
      moves: "1. d4 Nf6 2. c4 g6",
      eco: "E60",
      theMove: "g6",
      nextPly: "g6",
    },
  ];

  const mockTranspositions = [];
  const mockHandleMovePlayed = vi.fn();

  it("should only display enum constant names in Sort By dropdown", () => {
    render(
      <NextOpenings
        legalMoves={mockLegalMoves}
        transpositions={mockTranspositions}
        handleMovePlayed={mockHandleMovePlayed}
      />
    );

    // Find the Sort By select element
    const select = screen.getByRole("combobox");
    expect(select).toBeTruthy();

    // Get all option elements
    const options = Array.from(select.querySelectorAll("option"));
    
    // Extract the option values and text
    const optionTexts = options.map((opt) => opt.textContent);
    const optionValues = options.map((opt) => opt.value);

    // Verify we have the correct enum constants
    expect(optionTexts).toEqual(["EVALUATION", "NAME", "ECO"]);

    // Verify the values are numeric (1, 2, 4)
    expect(optionValues).toEqual([
      String(SortEnum.EVALUATION),
      String(SortEnum.NAME),
      String(SortEnum.ECO),
    ]);

    // Ensure no numeric strings appear in the text
    optionTexts.forEach((text) => {
      expect(text).not.toMatch(/^\d+$/); // Should not be a pure number
    });
  });

  it("should render Continuations heading when legal moves exist", () => {
    render(
      <NextOpenings
        legalMoves={mockLegalMoves}
        transpositions={mockTranspositions}
        handleMovePlayed={mockHandleMovePlayed}
      />
    );

    expect(screen.getByText("Continuations")).toBeTruthy();
  });

  it("should render Transpositions heading when transpositions exist", () => {
    const mockTranspositionsWithData = [
      {
        name: "Transposed Opening",
        moves: "1. c4 Nf6 2. d4",
        eco: "A10",
      },
    ];

    render(
      <NextOpenings
        legalMoves={mockLegalMoves}
        transpositions={mockTranspositionsWithData}
        handleMovePlayed={mockHandleMovePlayed}
      />
    );

    expect(screen.getByText("Transpositions")).toBeTruthy();
  });

  it("should not render Transpositions when none exist", () => {
    render(
      <NextOpenings
        legalMoves={mockLegalMoves}
        transpositions={[]}
        handleMovePlayed={mockHandleMovePlayed}
      />
    );

    expect(screen.queryByText("Transpositions")).toBeNull();
  });

  it("should display 'No continuations found' when no legal moves", () => {
    render(
      <NextOpenings
        legalMoves={[]}
        transpositions={mockTranspositions}
        handleMovePlayed={mockHandleMovePlayed}
      />
    );

    expect(screen.getByText("No continuations found")).toBeTruthy();
  });
});
