// Shape used by AdvancedFilters and consumers. Keeping it in one place so
// every view stores filters under the same keys, and `filtersToParams` can
// translate them uniformly.

export function emptyFilters() {
  return {
    q: '',
    activities: [], areas: [], orientations: [], seasons: [], langs: [],
    waypointTypes: [], routeTypes: [], configurations: [], glacierGear: [],
    rockTypes: [], climbingOutdoorTypes: [], climbingIndoorTypes: [],
    climbingStyles: [],
    articleCategories: [], articleTypes: [],
    xreportEventTypes: [],
    frequentation: [], glacierRating: [], avalancheSigns: [],
    publicTransport: false,
    elevationMin: null, elevationMax: null,
    heightDiffUpMin: null, heightDiffUpMax: null,
    heightDiffDownMin: null, heightDiffDownMax: null,
    heightDiffAccessMin: null, heightDiffAccessMax: null,
    heightDiffDifficultiesMin: null, heightDiffDifficultiesMax: null,
    routeLengthMin: null, routeLengthMax: null,
    durationMin: null, durationMax: null,
    nbParticipantsMin: null, nbParticipantsMax: null,
    nbImpactedMin: null, nbImpactedMax: null,
    qualityMin: null,
    dateStart: null, dateEnd: null,
    globalRatingMin: null, globalRatingMax: null,
    engagementRatingMin: null, engagementRatingMax: null,
    riskRatingMin: null, riskRatingMax: null,
    equipmentRatingMin: null, equipmentRatingMax: null,
    expositionRockRatingMin: null, expositionRockRatingMax: null,
    rockFreeRatingMin: null, rockFreeRatingMax: null,
    rockRequiredRatingMin: null, rockRequiredRatingMax: null,
    aidRatingMin: null, aidRatingMax: null,
    skiRatingMin: null, skiRatingMax: null,
    skiExpositionMin: null, skiExpositionMax: null,
    labandeSkiRatingMin: null, labandeSkiRatingMax: null,
    labandeGlobalRatingMin: null, labandeGlobalRatingMax: null,
    iceRatingMin: null, iceRatingMax: null,
    mixedRatingMin: null, mixedRatingMax: null,
    viaFerrataRatingMin: null, viaFerrataRatingMax: null,
    hikingRatingMin: null, hikingRatingMax: null,
    snowshoeRatingMin: null, snowshoeRatingMax: null,
    mtbUpRatingMin: null, mtbUpRatingMax: null,
    mtbDownRatingMin: null, mtbDownRatingMax: null,
    hikingMtbExpositionMin: null, hikingMtbExpositionMax: null,
    severityMin: null, severityMax: null,
    avalancheLevelMin: null, avalancheLevelMax: null,
    avalancheSlopeMin: null, avalancheSlopeMax: null,
    conditionRatingMin: null, conditionRatingMax: null,
  };
}

// Count of "active" (non-default) filter values — drives the filter button badge.
export function countActiveFilters(f) {
  if (!f) return 0;
  let n = 0;
  const arrayKeys = [
    'activities', 'areas', 'orientations', 'seasons', 'langs',
    'waypointTypes', 'routeTypes', 'configurations', 'glacierGear', 'rockTypes',
    'climbingOutdoorTypes', 'climbingIndoorTypes', 'climbingStyles',
    'articleCategories', 'articleTypes', 'xreportEventTypes',
    'frequentation', 'glacierRating', 'avalancheSigns',
  ];
  for (const k of arrayKeys) if ((f[k] || []).length) n += 1;
  if (f.publicTransport) n += 1;
  if (f.qualityMin) n += 1;
  if (f.dateStart || f.dateEnd) n += 1;
  const rangeKeys = [
    'elevation', 'heightDiffUp', 'heightDiffDown', 'heightDiffAccess', 'heightDiffDifficulties',
    'routeLength', 'duration', 'nbParticipants', 'nbImpacted',
    'globalRating', 'engagementRating', 'riskRating', 'equipmentRating', 'expositionRockRating',
    'rockFreeRating', 'rockRequiredRating', 'aidRating',
    'skiRating', 'skiExposition', 'labandeSkiRating', 'labandeGlobalRating',
    'iceRating', 'mixedRating', 'viaFerrataRating',
    'hikingRating', 'snowshoeRating', 'mtbUpRating', 'mtbDownRating',
    'hikingMtbExposition', 'severity', 'avalancheLevel', 'avalancheSlope',
    'conditionRating',
  ];
  for (const k of rangeKeys) {
    if (f[`${k}Min`] != null || f[`${k}Max`] != null) n += 1;
  }
  return n;
}

// Mapping between our filter keys and the C2C API query params. Mirrors the
// v6_ui filter templates so the API receives exactly what the website sends.
const RANGE_PARAM = {
  elevation: 'rmaxa',                         // routes elevation_max
  heightDiffUp: 'hdif',
  heightDiffDown: 'ddif',
  heightDiffAccess: 'rappr',
  heightDiffDifficulties: 'dhei',
  routeLength: 'rlen',
  duration: 'time',
  nbParticipants: 'xpar',
  nbImpacted: 'ximp',
  globalRating: 'grat',
  engagementRating: 'erat',
  riskRating: 'orrat',
  equipmentRating: 'prat',
  expositionRockRating: 'rexpo',
  rockFreeRating: 'frat',
  rockRequiredRating: 'rrat',
  aidRating: 'arat',
  skiRating: 'trat',
  skiExposition: 'sexpo',
  labandeSkiRating: 'srat',
  labandeGlobalRating: 'lrat',
  iceRating: 'irat',
  mixedRating: 'mrat',
  viaFerrataRating: 'krat',
  hikingRating: 'hrat',
  snowshoeRating: 'wrat',
  mtbUpRating: 'mbur',
  mtbDownRating: 'mbdr',
  hikingMtbExposition: 'hexpo',
  severity: 'xsev',
  avalancheLevel: 'xavlev',
  avalancheSlope: 'xavslo',
  conditionRating: 'ocond',
};

const ARRAY_PARAM = {
  activities: 'act',
  orientations: 'fac',
  seasons: 'period',
  langs: 'l',
  waypointTypes: 'wtyp',
  routeTypes: 'rtyp',
  configurations: 'conf',
  glacierGear: 'glac',
  rockTypes: 'rock',
  climbingOutdoorTypes: 'crtyp',
  climbingIndoorTypes: 'gtyp',
  climbingStyles: 'tcsty',
  articleCategories: 'acat',
  articleTypes: 'atyp',
  xreportEventTypes: 'xtyp',
  frequentation: 'ofreq',
  glacierRating: 'oglac',
  avalancheSigns: 'avdate',
};

// Some params are document-type specific overrides (e.g. elevation key differs
// between routes/waypoints/outings). The view passes its own override map.
export function filtersToParams(filters, overrides = {}) {
  const params = {};
  if (!filters) return params;

  if (filters.q?.trim()) params.q = filters.q.trim();

  for (const [key, param] of Object.entries(ARRAY_PARAM)) {
    const list = filters[key] || [];
    if (list.length) {
      const finalParam = overrides[key] || param;
      params[finalParam] = list.join(',');
    }
  }

  if ((filters.areas || []).length) {
    params.a = filters.areas.map((a) => a.document_id).join(',');
  }

  for (const [key, param] of Object.entries(RANGE_PARAM)) {
    const min = filters[`${key}Min`];
    const max = filters[`${key}Max`];
    if (min != null || max != null) {
      const finalParam = overrides[key] || param;
      params[finalParam] = `${min ?? ''},${max ?? ''}`;
    }
  }

  if (filters.publicTransport) params.owpt = true;
  if (filters.qualityMin) params.qa = filters.qualityMin;
  if (filters.dateStart) params.date = `${filters.dateStart}${filters.dateEnd ? `,${filters.dateEnd}` : ''}`;
  else if (filters.dateEnd) params.date = `,${filters.dateEnd}`;

  return params;
}

// Per-doc-type overrides — the "elevation" filter maps to different params
// depending on the listing endpoint.
export const PARAM_OVERRIDES = {
  outing: { elevation: 'oalt', heightDiffUp: 'odif' },
  waypoint: { elevation: 'walt' },
  xreport: { elevation: 'xalt' },
  // route uses defaults defined in RANGE_PARAM (rmaxa, hdif, ddif, …)
};
