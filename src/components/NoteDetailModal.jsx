function NoteDetailModal({ note, onClose }) {
    if (!note) return null;
  
    // Format full timestamp if available, else fall back to time-of-day
    const fullTimestamp = note.createdAt
      ? new Date(note.createdAt).toLocaleString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : note.time;
  
    const isLegacy = !note.authorName;
  
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-card"
          style={{ maxWidth: 640 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="detail-header">
            <h2>Clinical note</h2>
            <button onClick={onClose}>Close</button>
          </div>
  
          <div className="note-meta">
            <div className="note-meta-row">
              <span className="note-meta-label">Recorded</span>
              <span className="note-meta-value">{fullTimestamp}</span>
            </div>
            {isLegacy ? (
              <div className="note-meta-row">
                <span className="note-meta-label">Author</span>
                <span className="note-meta-value note-meta-legacy">
                  Unsigned (legacy entry)
                </span>
              </div>
            ) : (
              <>
                <div className="note-meta-row">
                  <span className="note-meta-label">Author</span>
                  <span className="note-meta-value">{note.authorName}</span>
                </div>
                <div className="note-meta-row">
                  <span className="note-meta-label">Role</span>
                  <span className="note-meta-value">{note.authorRole}</span>
                </div>
                <div className="note-meta-row">
                  <span className="note-meta-label">Username</span>
                  <span className="note-meta-value note-meta-username">
                    @{note.authorUsername}
                  </span>
                </div>
              </>
            )}
          </div>
  
          <div className="note-body">
            <div className="note-body-label">Entry</div>
            <div className="note-body-text">{note.text}</div>
          </div>
  
          <div className="note-locked-banner">
            🔒 This entry is locked. Once submitted, clinical notes cannot
            be edited or deleted.
          </div>
        </div>
      </div>
    );
  }
  
  export default NoteDetailModal;