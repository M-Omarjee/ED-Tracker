import { formatDuration, timeInDeptMs, timeToClinician } from "../lib/time";

function PatientTable({ patients, nowTick, onRowClick }) {
  return (
    <div className="table-card">
      <h2>Patients in department</h2>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Presenting complaint</th>
            <th>Time in dept</th>
            <th>Clinician</th>
            <th>Triage</th>
            <th>NEWS</th>
            <th>Referral</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => {
            const inDept = formatDuration(timeInDeptMs(p, nowTick));
            const ttc = timeToClinician(p, nowTick);
            return (
              <tr key={p.id} onClick={() => onRowClick(p.id)}>
                <td>{p.name}</td>
                <td>{p.presentingComplaint}</td>
                <td className="cell-time">{inDept}</td>
                <td>
                  {ttc.seen ? (
                    <span className="seen-pill" title="Doctor has reviewed">
                      ✓ Seen{" "}
                      <span className="seen-pill-time">
                        ({formatDuration(ttc.ms)})
                      </span>
                    </span>
                  ) : (
                    <span className="ttc-waiting" title="Awaiting doctor">
                      Waiting {formatDuration(ttc.ms)}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`triage-badge triage-badge-${p.triage.toLowerCase()}`}
                  >
                    {p.triage}
                  </span>
                </td>
                <td>{p.newsScore}</td>
                <td>{p.referral}</td>
                <td>{p.status}</td>
              </tr>
            );
          })}
          {patients.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No patients – all seen!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PatientTable;