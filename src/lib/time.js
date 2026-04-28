/**
 * Format a duration (milliseconds) as h:mm or m:ss.
 * Used by the live timers in PatientTable / PatientDetail.
 */
export function formatDuration(ms) {
    if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}`;
    }
    // Under an hour: show as 0:mm so it's still h:mm shape, not m:ss
    return `0:${String(minutes).padStart(2, "0")}`;
  }
  
  /**
   * Compute time-in-dept for a patient at a given "now" tick.
   * If the patient has a dischargedAt, freeze the duration there.
   */
  export function timeInDeptMs(patient, now) {
    if (!patient || !patient.arrivalAt) return null;
    const arrival = new Date(patient.arrivalAt).getTime();
    if (Number.isNaN(arrival)) return null;
    const end = patient.dischargedAt
      ? new Date(patient.dischargedAt).getTime()
      : now;
    return end - arrival;
  }
  
  /**
   * Compute time-to-clinician for a patient at a given "now" tick.
   * Stops once clinicianSeenAt is set; otherwise ticks live.
   * Returns { ms, seen } so the UI can show a pill when seen.
   */
  export function timeToClinician(patient, now) {
    if (!patient || !patient.arrivalAt) return { ms: null, seen: false };
    const arrival = new Date(patient.arrivalAt).getTime();
    if (Number.isNaN(arrival)) return { ms: null, seen: false };
    if (patient.clinicianSeenAt) {
      const seenAt = new Date(patient.clinicianSeenAt).getTime();
      return { ms: seenAt - arrival, seen: true };
    }
    return { ms: now - arrival, seen: false };
  }