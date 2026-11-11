export function AppHeader() {
  return (
    <header className="topbar">
      <a className="brand" href="#top">
        <span className="brand-mark">O</span>
        <span>
          OpenSlot<span className="brand-dot">.</span>
        </span>
      </a>
      <div className="topbar-meta">
        <span className="live-dot" /> Community clinic demo {" "}
        <span className="divider" /> Synthetic records
      </div>
    </header>
  );
}
