import { useState } from "react";
import NoteDetailModal from "./NoteDetailModal";

function NoteCard({ note, onClick }) {
  const isLong = (note.text || "").length > 80;
  const preview = isLong ? `${note.text.slice(0, 80).trim()}…` : note.text;
  const authorLabel = note.authorName || "Unsigned";
  const roleLabel = note.authorRole || "legacy";

  return (
    <li
      className="note-card note-card-clickable"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="note-card-header">
        <span className="note-time">{note.time}</span>
        <span className="note-author-pill">
          {authorLabel}
          {note.authorRole && (
            <span className="note-author-pill-role">{roleLabel}</span>
          )}
        </span>
      </div>
      <div className="note-text">{preview}</div>
    </li>
  );
}

function NotesHistory({ notes }) {
  const [activeNote, setActiveNote] = useState(null);
  const list = notes || [];

  return (
    <div className="notes-history">
      <strong>Notes history:</strong>
      {list.length === 0 && <p className="notes-empty">No notes yet.</p>}
      {list.length > 0 && (
        <ul className="notes-list">
          {[...list].reverse().map((n, index) => (
            <NoteCard
              key={n.id || `${n.time}-${index}`}
              note={n}
              onClick={() => setActiveNote(n)}
            />
          ))}
        </ul>
      )}
      {activeNote && (
        <NoteDetailModal
          note={activeNote}
          onClose={() => setActiveNote(null)}
        />
      )}
    </div>
  );
}

export default NotesHistory;