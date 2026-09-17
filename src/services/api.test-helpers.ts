// Thin re-export shim so tests can exercise normalization logic without
// depending on api.ts's internal structure. If api.ts grows non-testable
// side effects at import time, move the pure functions here and have
// api.ts import from this module instead.
export { cvssToSeverity, normalizeNvdCve } from './api';
