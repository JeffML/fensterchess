import "./App.css";
import { VERSION } from "./common/consts";
import "./stylesheets/about.css";
import { IntroSection } from "./guidePage/IntroSection";
import { SearchSection } from "./guidePage/SearchSection";
import { PgnSection } from "./guidePage/PgnSection";
import { VisualizationsSection } from "./guidePage/VisualizationsSection";
import { QuestionsSection } from "./guidePage/QuestionsSection";

interface TocSubItem {
  id: string;
  label: string;
}

interface TocItem {
  id: string;
  label: string;
  subs?: TocSubItem[];
}

const toc: TocItem[] = [
  {
    id: "search",
    label: "The Search Page",
    subs: [
      { id: "search-position", label: "Search by Position" },
      { id: "search-name", label: "Search by Name" },
      { id: "theory", label: "Theory" },
      { id: "external-info", label: "External Info" },
      { id: "roots", label: "Roots" },
      { id: "similar", label: "Similar openings" },
    ],
  },
  { id: "pgn", label: "The PGN Import Page" },
  {
    id: "visualizations",
    label: "Visualizations",
    subs: [
      { id: "fromto", label: "From-To squares" },
      { id: "eco-categories", label: "ECO categories and codes" },
      { id: "active-squares", label: "Most active squares" },
      { id: "destination-squares", label: "Destination squares" },
    ],
  },
  { id: "questions", label: "Questions? Bugs? Feature requests?" },
];

function TocSidebar() {
  // Use a green accent for TOC links for visibility on dark backgrounds
  const accent = "#6fcf97"; // soft green, matches site accent
  return (
    <nav
      className="guide-toc"
      style={{
        position: "sticky",
        top: 20,
        alignSelf: "flex-start",
        minWidth: 220,
        maxWidth: 260,
        marginRight: 32,
      }}
    >
      <h2
        style={{
          fontSize: "1.1em",
          marginBottom: 8,
          color: accent,
          borderBottom: `2px solid ${accent}`,
          paddingBottom: 2,
        }}
      >
        Guide Contents
      </h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {toc.map((section) => (
          <li key={section.id} style={{ marginBottom: 8 }}>
            <a
              href={`#${section.id}`}
              style={{ color: accent, textDecoration: "none", fontWeight: 600 }}
            >
              {section.label}
            </a>
            {section.subs && (
              <ul style={{ listStyle: "none", paddingLeft: 16, marginTop: 4 }}>
                {section.subs.map((sub) => (
                  <li key={sub.id} style={{ marginBottom: 4 }}>
                    <a
                      href={`#${sub.id}`}
                      style={{
                        color: "#b6f5c3",
                        textDecoration: "none",
                        fontWeight: 400,
                      }}
                    >
                      {sub.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

const GuidePage = () => (
  <div style={{ display: "flex", alignItems: "flex-start" }}>
    <TocSidebar />
    <main style={{ flex: 1 }}>
      <div className="font-cinzel white left version">version {VERSION}</div>
      <div className="about">
        <IntroSection />
        <SearchSection />
        <PgnSection />
        <VisualizationsSection />
        <QuestionsSection />
      </div>
    </main>
  </div>
);

export default GuidePage;
