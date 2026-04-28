function TopBar({ onAddPatient, onResetDemo }) {
    return (
      <header className="top-bar">
        <h1>ED Tracker</h1>
        <div className="top-bar-actions">
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
        </div>
      </header>
    );
  }
  
  export default TopBar;