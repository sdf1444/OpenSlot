type AppHeaderProps = {
  username: string | null;
  loading: boolean;
  onLogout: () => void;
};

export function AppHeader({ username, loading, onLogout }: AppHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <span className="brand-mark">O</span>
        <span>
          OpenSlot<span className="brand-dot">.</span>
        </span>
      </a>
      <div className="topbar-meta">
        <span className="live-dot" /> Community clinic demo{" "}
        <span className="divider" /> Synthetic records
      </div>
      <div className="auth-controls">
        {username ? (
          <>
            <span className="coordinator-name">{username}</span>
            <button
              className="button button-outline auth-button"
              onClick={onLogout}
            >
              Log out
            </button>
          </>
        ) : loading ? (
          <button className="button button-outline auth-button" disabled>
            Checking…
          </button>
        ) : (
          <a className="button button-outline auth-button" href="/login">
            Log in
          </a>
        )}
      </div>
    </header>
  );
}
