// Master Games Browser Component
// Allows browsing master games organized by opening

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Opening {
  name: string;
  fen: string;
  eco: string;
  gameCount: number;
}

interface EcoCodeGroup {
  eco: string;
  rootName: string;
  rootFen?: string;
  rootOpening: Opening | null; // The root opening if it exists in master games
  children: Opening[]; // Other openings with same ECO code
  totalGames: number;
}

interface OpeningsResponse {
  openings: {
    A: EcoCodeGroup[];
    B: EcoCodeGroup[];
    C: EcoCodeGroup[];
    D: EcoCodeGroup[];
    E: EcoCodeGroup[];
  };
  totalEcoCodes: number;
  totalOpenings: number;
}

interface Master {
  playerName: string;
  gameCount: number;
}

interface MastersResponse {
  masters: Master[];
  total: number;
  page: number;
  pageSize: number;
  totalGames: number;
}

// Fetch all openings grouped by ECO
async function fetchOpenings(): Promise<OpeningsResponse> {
  const response = await fetch("/.netlify/functions/getMasterGameOpenings", {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Fetch masters for selected openings
async function fetchMasters(
  openingNames: string[],
  page: number,
  sortBy: string,
  sortOrder: string
): Promise<MastersResponse> {
  const params = new URLSearchParams({
    openings: openingNames.join(","),
    page: page.toString(),
    pageSize: "25",
    sortBy,
    sortOrder,
  });

  const response = await fetch(
    `/.netlify/functions/getMastersByOpenings?${params}`,
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_API_SECRET_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

interface MasterGamesBrowserProps {
  onSelectMaster: (player: string, openings: string[]) => void;
}

export const MasterGamesBrowser = ({
  onSelectMaster,
}: MasterGamesBrowserProps) => {
  // Opening selection state
  const [selectedOpenings, setSelectedOpenings] = useState<Set<string>>(
    new Set()
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["B"]) // Start with B expanded (most common)
  );
  const [expandedEcoCodes, setExpandedEcoCodes] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Master list state
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"name" | "gameCount">("gameCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);

  // Fetch openings
  const {
    data: openingsData,
    isPending: openingsLoading,
    isError: openingsError,
    error: openingsErrorMsg,
  } = useQuery({
    queryKey: ["masterGameOpenings"],
    queryFn: fetchOpenings,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Fetch masters when openings are selected
  const {
    data: mastersData,
    isPending: mastersLoading,
    isError: mastersError,
  } = useQuery({
    queryKey: [
      "mastersByOpenings",
      Array.from(selectedOpenings),
      page,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchMasters(Array.from(selectedOpenings), page, sortBy, sortOrder),
    enabled: selectedOpenings.size > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Toggle ECO code expansion
  const toggleEcoCode = (eco: string) => {
    setExpandedEcoCodes((prev) => {
      const next = new Set(prev);
      if (next.has(eco)) {
        next.delete(eco);
      } else {
        next.add(eco);
      }
      return next;
    });
  };

  // Toggle opening selection
  const toggleOpening = (name: string) => {
    setSelectedOpenings((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    setPage(0); // Reset pagination when selection changes
    setSelectedMaster(null);
  };

  // Handle master click
  const handleMasterClick = (playerName: string) => {
    setSelectedMaster(playerName);
    onSelectMaster(playerName, Array.from(selectedOpenings));
  };

  // Filter ECO code groups by search term
  const filterEcoGroups = (groups: EcoCodeGroup[]): EcoCodeGroup[] => {
    if (!groups) return [];
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();

    return groups
      .map((group) => {
        // Filter children that match
        const matchingChildren = (group.children || []).filter(
          (o) =>
            o.name.toLowerCase().includes(term) ||
            o.eco.toLowerCase().includes(term)
        );

        // Check if root matches
        const rootMatches =
          group.rootOpening &&
          (group.rootOpening.name.toLowerCase().includes(term) ||
            group.eco.toLowerCase().includes(term));

        // Check if the group header matches
        const headerMatches =
          group.eco.toLowerCase().includes(term) ||
          group.rootName.toLowerCase().includes(term);

        return {
          ...group,
          children: matchingChildren,
          // Keep root if it matches or header matches
          rootOpening: rootMatches || headerMatches ? group.rootOpening : null,
        };
      })
      .filter(
        (group) =>
          group.rootOpening !== null ||
          group.children.length > 0 ||
          group.eco.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.rootName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  if (openingsError) {
    return (
      <div className="white" style={{ padding: "1em" }}>
        Error loading openings: {openingsErrorMsg?.message}
      </div>
    );
  }

  if (openingsLoading) {
    return (
      <div className="white" style={{ padding: "1em" }}>
        Loading master game openings...
      </div>
    );
  }

  const categories = ["A", "B", "C", "D", "E"] as const;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1em",
        height: "400px",
      }}
    >
      {/* Right Panel - Opening Browser */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          borderRadius: "4px",
          padding: "0.5em",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "0.5em" }}>
          <input
            type="text"
            placeholder="Search openings by name or ECO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5em",
              borderRadius: "4px",
              border: "1px solid #444",
              backgroundColor: "#1a1a1a",
              color: "#fff",
            }}
          />
        </div>

        <div style={{ overflow: "auto", flex: 1 }}>
          {categories.map((cat) => {
            const ecoGroups = openingsData?.openings?.[cat] || [];
            const filtered = filterEcoGroups(ecoGroups);
            const isExpanded = expandedCategories.has(cat);

            // Count selected openings in this category
            let selectedInCategory = 0;
            for (const group of filtered) {
              if (
                group.rootOpening &&
                selectedOpenings.has(group.rootOpening.name)
              ) {
                selectedInCategory++;
              }
              selectedInCategory += (group.children || []).filter((o) =>
                selectedOpenings.has(o.name)
              ).length;
            }

            // Count total openings
            const totalOpenings = filtered.reduce(
              (sum, g) =>
                sum + (g.rootOpening ? 1 : 0) + (g.children?.length || 0),
              0
            );

            return (
              <div key={cat} style={{ marginBottom: "0.25em" }}>
                <div
                  onClick={() => toggleCategory(cat)}
                  style={{
                    cursor: "pointer",
                    padding: "0.5em",
                    backgroundColor: "#3a3a3a",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  <span>
                    {isExpanded ? "▼" : "▶"} ECO {cat} ({totalOpenings}{" "}
                    openings)
                  </span>
                  {selectedInCategory > 0 && (
                    <span
                      style={{
                        backgroundColor: "#4a7c59",
                        padding: "0.1em 0.5em",
                        borderRadius: "10px",
                        fontSize: "0.8em",
                      }}
                    >
                      {selectedInCategory} selected
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div
                    style={{
                      paddingLeft: "0.5em",
                      maxHeight: "300px",
                      overflow: "auto",
                    }}
                  >
                    {filtered.map((group) => {
                      const isEcoExpanded = expandedEcoCodes.has(group.eco);
                      const hasChildren =
                        group.children && group.children.length > 0;
                      const allOpenings = [
                        ...(group.rootOpening ? [group.rootOpening] : []),
                        ...(group.children || []),
                      ];
                      const selectedInEco = allOpenings.filter((o) =>
                        selectedOpenings.has(o.name)
                      ).length;

                      return (
                        <div key={group.eco} style={{ marginTop: "0.3em" }}>
                          {/* ECO Code Row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0.3em 0.5em",
                              backgroundColor: "#333",
                              borderRadius: "4px",
                            }}
                          >
                            {/* Expander - only show if there are children */}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasChildren) toggleEcoCode(group.eco);
                              }}
                              style={{
                                cursor: hasChildren ? "pointer" : "default",
                                color: hasChildren ? "#888" : "#444",
                                marginRight: "0.5em",
                                fontSize: "0.85em",
                                width: "1em",
                              }}
                            >
                              {hasChildren ? (isEcoExpanded ? "▼" : "▶") : " "}
                            </span>

                            {/* Checkbox for root opening */}
                            {group.rootOpening ? (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleOpening(group.rootOpening!.name);
                                }}
                                style={{
                                  cursor: "pointer",
                                  marginRight: "0.5em",
                                  color: selectedOpenings.has(
                                    group.rootOpening.name
                                  )
                                    ? "#4a7c59"
                                    : "#666",
                                }}
                              >
                                {selectedOpenings.has(group.rootOpening.name)
                                  ? "☑"
                                  : "☐"}
                              </span>
                            ) : (
                              <span
                                style={{ marginRight: "0.5em", color: "#444" }}
                              >
                                ☐
                              </span>
                            )}

                            {/* ECO code */}
                            <span
                              style={{
                                color: "#6a9",
                                fontWeight: "bold",
                                marginRight: "0.5em",
                              }}
                            >
                              {group.eco}
                            </span>

                            {/* Root name */}
                            <span
                              style={{
                                color: group.rootOpening ? "#ccc" : "#888",
                                flex: 1,
                                cursor: group.rootOpening
                                  ? "pointer"
                                  : "default",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (group.rootOpening) {
                                  toggleOpening(group.rootOpening.name);
                                }
                              }}
                            >
                              {group.rootName}
                            </span>

                            {/* Game count */}
                            <span
                              style={{
                                color: "#888",
                                fontSize: "0.85em",
                                marginLeft: "0.5em",
                              }}
                            >
                              ({group.totalGames})
                            </span>

                            {/* Selected badge */}
                            {selectedInEco > 0 && (
                              <span
                                style={{
                                  backgroundColor: "#4a7c59",
                                  padding: "0.1em 0.4em",
                                  borderRadius: "8px",
                                  fontSize: "0.75em",
                                  marginLeft: "0.5em",
                                  color: "#fff",
                                }}
                              >
                                {selectedInEco}
                              </span>
                            )}
                          </div>

                          {/* Children (when expanded) */}
                          {isEcoExpanded && hasChildren && (
                            <div style={{ paddingLeft: "2em" }}>
                              {group.children.map((opening) => (
                                <div
                                  key={opening.name}
                                  onClick={() => toggleOpening(opening.name)}
                                  style={{
                                    cursor: "pointer",
                                    padding: "0.25em 0.5em",
                                    backgroundColor: selectedOpenings.has(
                                      opening.name
                                    )
                                      ? "#4a7c59"
                                      : "transparent",
                                    borderRadius: "4px",
                                    marginTop: "0.15em",
                                    fontSize: "0.85em",
                                    color: selectedOpenings.has(opening.name)
                                      ? "#fff"
                                      : "#aaa",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <span
                                    style={{
                                      marginRight: "0.5em",
                                      color: selectedOpenings.has(opening.name)
                                        ? "#fff"
                                        : "#666",
                                    }}
                                  >
                                    {selectedOpenings.has(opening.name)
                                      ? "☑"
                                      : "☐"}
                                  </span>
                                  <span style={{ flex: 1 }}>
                                    {opening.name}
                                  </span>
                                  <span
                                    style={{ color: "#888", fontSize: "0.9em" }}
                                  >
                                    ({opening.gameCount})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            borderTop: "1px solid #444",
            paddingTop: "0.5em",
            marginTop: "0.5em",
            fontSize: "0.85em",
            color: "#aaa",
          }}
        >
          {selectedOpenings.size} opening{selectedOpenings.size !== 1 && "s"}{" "}
          selected
          {selectedOpenings.size > 0 && (
            <button
              onClick={() => {
                setSelectedOpenings(new Set());
                setSelectedMaster(null);
              }}
              style={{
                marginLeft: "1em",
                padding: "0.2em 0.5em",
                backgroundColor: "#555",
                border: "none",
                borderRadius: "4px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Left Panel - Master List */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          borderRadius: "4px",
          padding: "0.5em",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {selectedOpenings.size === 0 ? (
          <div
            style={{
              color: "#888",
              padding: "2em",
              textAlign: "center",
            }}
          >
            Select openings from the list to see masters who played them
          </div>
        ) : mastersLoading ? (
          <div style={{ color: "#fff", padding: "1em" }}>
            Loading masters...
          </div>
        ) : mastersError ? (
          <div style={{ color: "#ff6b6b", padding: "1em" }}>
            Error loading masters
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div
              style={{
                display: "flex",
                gap: "1em",
                marginBottom: "0.5em",
                fontSize: "0.85em",
              }}
            >
              <span style={{ color: "#888" }}>Sort by:</span>
              <label style={{ color: "#fff", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="sortBy"
                  checked={sortBy === "name"}
                  onChange={() => {
                    setSortBy("name");
                    setSortOrder("asc");
                  }}
                />{" "}
                Name
              </label>
              <label style={{ color: "#fff", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="sortBy"
                  checked={sortBy === "gameCount"}
                  onChange={() => {
                    setSortBy("gameCount");
                    setSortOrder("desc");
                  }}
                />{" "}
                Game Count
              </label>
            </div>

            {/* Masters list */}
            <div style={{ overflow: "auto", flex: 1 }}>
              {mastersData?.masters.map((master) => (
                <div
                  key={master.playerName}
                  onClick={() => handleMasterClick(master.playerName)}
                  style={{
                    cursor: "pointer",
                    padding: "0.5em",
                    backgroundColor:
                      selectedMaster === master.playerName
                        ? "#4a7c59"
                        : "transparent",
                    borderRadius: "4px",
                    marginBottom: "0.2em",
                    display: "flex",
                    justifyContent: "space-between",
                    color:
                      selectedMaster === master.playerName ? "#fff" : "#ccc",
                  }}
                >
                  <span>{master.playerName}</span>
                  <span style={{ color: "#888" }}>
                    {master.gameCount} games
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {mastersData && mastersData.total > 25 && (
              <div
                style={{
                  borderTop: "1px solid #444",
                  paddingTop: "0.5em",
                  marginTop: "0.5em",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.85em",
                  color: "#aaa",
                }}
              >
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  style={{
                    padding: "0.3em 0.8em",
                    backgroundColor: page === 0 ? "#333" : "#555",
                    border: "none",
                    borderRadius: "4px",
                    color: page === 0 ? "#666" : "#fff",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Prev
                </button>
                <span>
                  {page * 25 + 1}-{Math.min((page + 1) * 25, mastersData.total)}{" "}
                  of {mastersData.total}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 25 >= mastersData.total}
                  style={{
                    padding: "0.3em 0.8em",
                    backgroundColor:
                      (page + 1) * 25 >= mastersData.total ? "#333" : "#555",
                    border: "none",
                    borderRadius: "4px",
                    color:
                      (page + 1) * 25 >= mastersData.total ? "#666" : "#fff",
                    cursor:
                      (page + 1) * 25 >= mastersData.total
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Summary */}
            <div
              style={{
                fontSize: "0.85em",
                color: "#888",
                marginTop: "0.5em",
              }}
            >
              {mastersData?.total} masters • {mastersData?.totalGames} games
            </div>
          </>
        )}
      </div>
    </div>
  );
};
