import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import MenuBar from "../src/MenuBar";
import { modes } from "../src/common/consts";
import { SelectedSitesContextProvider } from "../src/contexts/SelectedSitesContext";

describe("MenuBar", () => {
  it("should render all menu items", () => {
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    expect(screen.getByText("Search Openings")).toBeInTheDocument();
    expect(screen.getByText("PGN Import")).toBeInTheDocument();
    expect(screen.getByText("Visualizations")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Include Info From:")).toBeInTheDocument();
  });

  it("should highlight the currently selected mode", () => {
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    const searchItem = screen.getByText("Search Openings").parentElement;
    expect(searchItem).toHaveClass("selected");
  });

  it("should call setMode when a menu item is clicked", async () => {
    const user = userEvent.setup();
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    const pgnImportItem = screen.getByText("PGN Import");
    await user.click(pgnImportItem);

    expect(mockSetMode).toHaveBeenCalledWith(modes.pgnAnalyze);
  });

  it("should switch selected state when changing modes", () => {
    const mockSetMode = vi.fn();

    const { rerender } = render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    let searchItem = screen.getByText("Search Openings").parentElement;
    let aboutItem = screen.getByText("About").parentElement;

    expect(searchItem).toHaveClass("selected");
    expect(aboutItem).not.toHaveClass("selected");

    // Rerender with different mode
    rerender(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.about} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    searchItem = screen.getByText("Search Openings").parentElement;
    aboutItem = screen.getByText("About").parentElement;

    expect(searchItem).not.toHaveClass("selected");
    expect(aboutItem).toHaveClass("selected");
  });

  it("should render FICS and lichess site checkboxes", () => {
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    const ficsCheckbox = screen.getByLabelText("FICS");
    const lichessCheckbox = screen.getByLabelText("lichess");

    expect(ficsCheckbox).toBeInTheDocument();
    expect(lichessCheckbox).toBeInTheDocument();
    expect(ficsCheckbox).toBeInstanceOf(HTMLInputElement);
    expect(lichessCheckbox).toBeInstanceOf(HTMLInputElement);
  });

  it("should render site checkboxes as unchecked by default in tests", () => {
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    const ficsCheckbox = screen.getByLabelText("FICS") as HTMLInputElement;
    const lichessCheckbox = screen.getByLabelText(
      "lichess"
    ) as HTMLInputElement;

    // In test environment without localStorage data, checkboxes start unchecked
    expect(ficsCheckbox.checked).toBe(false);
    expect(lichessCheckbox.checked).toBe(false);
  });

  it("should toggle site selection when clicking checkboxes", async () => {
    const user = userEvent.setup();
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    const lichessCheckbox = screen.getByLabelText(
      "lichess"
    ) as HTMLInputElement;
    expect(lichessCheckbox.checked).toBe(false);

    await user.click(lichessCheckbox);
    expect(lichessCheckbox.checked).toBe(true);

    await user.click(lichessCheckbox);
    expect(lichessCheckbox.checked).toBe(false);
  });

  it("should open site URL in new tab when clicking site label", async () => {
    const user = userEvent.setup();
    const mockSetMode = vi.fn();
    const mockWindowOpen = vi.fn();

    // Mock window.open
    const originalOpen = window.open;
    window.open = mockWindowOpen;

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    const ficsLabel = screen.getByText("FICS");
    await user.click(ficsLabel);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      "https://www.freechess.org/",
      "_blank"
    );

    // Restore window.open
    window.open = originalOpen;
  });

  it("should render all mode options for navigation", async () => {
    const user = userEvent.setup();
    const mockSetMode = vi.fn();

    render(
      <SelectedSitesContextProvider>
        <MenuBar mode={modes.search} setMode={mockSetMode} />
      </SelectedSitesContextProvider>
    );

    // Click each menu item and verify setMode is called with correct mode
    await user.click(screen.getByText("Search Openings"));
    expect(mockSetMode).toHaveBeenCalledWith(modes.search);

    await user.click(screen.getByText("PGN Import"));
    expect(mockSetMode).toHaveBeenCalledWith(modes.pgnAnalyze);

    await user.click(screen.getByText("Visualizations"));
    expect(mockSetMode).toHaveBeenCalledWith(modes.visualization);

    await user.click(screen.getByText("About"));
    expect(mockSetMode).toHaveBeenCalledWith(modes.about);

    expect(mockSetMode).toHaveBeenCalledTimes(4);
  });
});
