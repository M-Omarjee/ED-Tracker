function TopBar({ currentUser, onAddPatient, onResetDemo, onLogout }) {
    return (
      <header className="top-bar">
        <h1>ED Tracker</h1>
        <div className="top-bar-actions">
          {currentUser && (
            <div className="user-chip" title={`Signed in as ${currentUser.name}`}>
              <div className="user-chip-name">{currentUser.name}</div>
              <div className="user-chip-role">{currentUser.role}</div>
            </div>
          )}
          <button
            className="ghost-btn"
            onClick={onResetDemo}
            title="Reset patient list to the original demo data"
          >
            Reset demo
          </button>
          <button className="primary-btn" onClick={onAddPatient}>
            Add Patient
          </button>
          {currentUser && (
            <button
              className="ghost-btn"
              onClick={onLogout}
              title="Sign out"
            >
              Logout
            </button>
          )}
        </div>
      </header>
    );
  }
  
  export default TopBar;