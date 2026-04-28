/**
 * NEWS2 calculator (Royal College of Physicians, July 2017 spec).
 *
 * Supports both Scale 1 (default adult scale, target SpO2 >=96%) and
 * Scale 2 (for documented hypercapnic respiratory failure, target SpO2
 * 88-92%). Scale 2 must be selected explicitly per patient because it
 * requires a clinical decision and documented diagnosis (e.g. severe
 * COPD with chronic T2RF). Defaulting to Scale 2 incorrectly causes
 * under-scoring in a hypoxic patient.
 *
 * Reference: https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2
 */

function scoreRR(rr) {
    const v = Number(rr);
    if (!Number.isFinite(v)) return null;
    if (v <= 8) return 3;
    if (v <= 11) return 1;
    if (v <= 20) return 0;
    if (v <= 24) return 2;
    return 3;
  }
  
  function scoreSpO2Scale1(spo2) {
    const v = Number(spo2);
    if (!Number.isFinite(v)) return null;
    if (v <= 91) return 3;
    if (v <= 93) return 2;
    if (v <= 95) return 1;
    return 0;
  }
  
  /**
   * Scale 2 SpO2 scoring (RCP NEWS2 Scale 2 chart).
   * Behaviour depends on whether the patient is on supplemental oxygen.
   *
   * On air (or "Air"):
   *   <=83 -> 3, 84-85 -> 2, 86-87 -> 1, 88-92 -> 0, 93+ -> 0
   *
   * On supplemental oxygen:
   *   <=83 -> 3, 84-85 -> 2, 86-87 -> 1, 88-92 -> 0, 93-94 -> 1,
   *   95-96 -> 2, >=97 -> 3
   */
  function scoreSpO2Scale2(spo2, o2) {
    const v = Number(spo2);
    if (!Number.isFinite(v)) return null;
    const onOxygen = isOnOxygen(o2);
  
    if (v <= 83) return 3;
    if (v <= 85) return 2;
    if (v <= 87) return 1;
    if (v <= 92) return 0;
  
    // 93+
    if (!onOxygen) return 0;
    if (v <= 94) return 1;
    if (v <= 96) return 2;
    return 3;
  }
  
  function isOnOxygen(o2) {
    if (!o2) return false;
    const lower = String(o2).trim().toLowerCase();
    if (lower === "" || lower === "air") return false;
    return true;
  }
  
  function scoreOxygen(o2) {
    if (o2 === undefined || o2 === null) return null;
    // Anything other than "air" / blank scores 2 (supplemental oxygen)
    return isOnOxygen(o2) ? 2 : 0;
  }
  
  function scoreTemp(temp) {
    const v = Number(temp);
    if (!Number.isFinite(v)) return null;
    if (v <= 35.0) return 3;
    if (v <= 36.0) return 1;
    if (v <= 38.0) return 0;
    if (v <= 39.0) return 1;
    return 2;
  }
  
  function scoreSBP(sbp) {
    const v = Number(sbp);
    if (!Number.isFinite(v)) return null;
    if (v <= 90) return 3;
    if (v <= 100) return 2;
    if (v <= 110) return 1;
    if (v <= 219) return 0;
    return 3;
  }
  
  function scoreHR(hr) {
    const v = Number(hr);
    if (!Number.isFinite(v)) return null;
    if (v <= 40) return 3;
    if (v <= 50) return 1;
    if (v <= 90) return 0;
    if (v <= 110) return 1;
    if (v <= 130) return 2;
    return 3;
  }
  
  function scoreAVPU(avpu) {
    if (!avpu) return null;
    const v = String(avpu).trim().toUpperCase();
    if (v === "A") return 0;
    if (v === "V" || v === "P" || v === "U") return 3;
    return null;
  }
  
  /**
   * Calculate NEWS2 from an observation object and a chosen SpO2 scale.
   *
   * @param {object} obs - { rr, spo2, o2, temp, sbp, hr, avpu }
   * @param {string} scale - "scale1" (default) or "scale2"
   * @returns {object} { total, breakdown, complete, scale }
   */
  export function calculateNews2(obs = {}, scale = "scale1") {
    const spo2Score =
      scale === "scale2"
        ? scoreSpO2Scale2(obs.spo2, obs.o2)
        : scoreSpO2Scale1(obs.spo2);
  
    const breakdown = {
      rr: scoreRR(obs.rr),
      spo2: spo2Score,
      o2: scoreOxygen(obs.o2),
      temp: scoreTemp(obs.temp),
      sbp: scoreSBP(obs.sbp),
      hr: scoreHR(obs.hr),
      avpu: scoreAVPU(obs.avpu),
    };
  
    const values = Object.values(breakdown);
    const present = values.filter((v) => v !== null);
  
    if (present.length === 0) {
      return { total: null, breakdown, complete: false, scale };
    }
  
    const total = present.reduce((sum, v) => sum + v, 0);
    const complete = values.every((v) => v !== null);
  
    return { total, breakdown, complete, scale };
  }
  
  /**
   * Map a NEWS2 total to a clinical risk band.
   * 0-2: low, 3-4: low-medium, 5-6: medium, 7+: high.
   */
  export function newsRiskBand(total) {
    if (total === null || total === undefined) return "unknown";
    if (total <= 2) return "low";
    if (total <= 4) return "low-medium";
    if (total <= 6) return "medium";
    return "high";
  }