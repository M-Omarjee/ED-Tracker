function PatientTable({ patients, onRowClick }) {
    return (
      <div className="table-card">
        <h2>Patients in department</h2>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Presenting complaint</th>
              <th>Time in dept</th>
              <th>Triage</th>
              <th>NEWS</th>
              <th>Referral</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} onClick={() => onRowClick(p.id)}>
                <td>{p.name}</td>
                <td>{p.presentingComplaint}</td>
                <td>{p.timeInDept}</td>
                <td>
                  <span
                    className={`triage-dot triage-${p.triage.toLowerCase()}`}
                  />
                  {p.triage}
                </td>
                <td>{p.newsScore}</td>
                <td>{p.referral}</td>
                <td>{p.status}</td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
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