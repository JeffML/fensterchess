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

interface OpeningsResponse {
  openings: {
    A: Opening[];
    B: Opening[];
    C: Opening[];
    D: Opening[];
    E: Opening[];
  };
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

  // Filter openings by search term
  const filterOpenings = (openings: Opening[]): Opening[] => {
    if (!searchTerm) return openings;
    const term = searchTerm.toLowerCase();
    return openings.filter(
      (o) =>
        o.name.toLowerCase().includes(term) ||
        o.eco.toLowerCase().includes(term)
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
            const openings = openingsData?.openings[cat] || [];
            const filtered = filterOpenings(openings);
            const isExpanded = expandedCategories.has(cat);
            const selectedInCategory = filtered.filter((o) =>
              selectedOpenings.has(o.name)
            ).length;

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
                    {isExpanded ? "▼" : "▶"} ECO {cat} ({filtered.length}{" "}
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
                      paddingLeft: "1em",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {filtered.map((opening) => (
                      <div
                        key={opening.name}
                        onClick={() => toggleOpening(opening.name)}
                        style={{
                          cursor: "pointer",
                          padding: "0.3em 0.5em",
                          backgroundColor: selectedOpenings.has(opening.name)
                            ? "#4a7c59"
                            : "transparent",
                          borderRadius: "4px",
                          marginTop: "0.2em",
                          fontSize: "0.9em",
                          color: selectedOpenings.has(opening.name)
                            ? "#fff"
                            : "#ccc",
                        }}
                      >
                        <span style={{ color: "#888", marginRight: "0.5em" }}>
                          {opening.eco}
                        </span>
                        {opening.name}
                        <span style={{ color: "#888", marginLeft: "0.5em" }}>
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
          <div style={{ color: "#fff", padding: "1em" }}>Loading masters...</div>
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
                  <span style={{ color: "#888" }}>{master.gameCount} games</span>
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
                  {page * 25 + 1}-
                  {Math.min((page + 1) * 25, mastersData.total)} of{" "}
                  {mastersData.total}
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
