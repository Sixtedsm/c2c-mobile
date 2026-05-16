// Central taxonomy mirrored from the C2C platform backend.
// Sourced from c2corg_common/attributes.py. Keep aligned with upstream so
// query params we send to the API are accepted as-is.

export const ACTIVITIES = [
  { key: 'skitouring', label: 'Ski de rando', color: 'act-ski' },
  { key: 'snow_ice_mixed', label: 'Neige/glace/mixte', color: 'act-mountain' },
  { key: 'mountain_climbing', label: 'Alpinisme', color: 'act-mountain' },
  { key: 'rock_climbing', label: 'Escalade', color: 'act-rock' },
  { key: 'ice_climbing', label: 'Cascade de glace', color: 'act-ice' },
  { key: 'hiking', label: 'Randonnée', color: 'act-hiking' },
  { key: 'snowshoeing', label: 'Raquettes', color: 'act-snowshoe' },
  { key: 'paragliding', label: 'Parapente', color: 'act-paragliding' },
  { key: 'mountain_biking', label: 'VTT', color: 'act-mtb' },
  { key: 'via_ferrata', label: 'Via ferrata', color: 'act-ferrata' },
  { key: 'slacklining', label: 'Slackline', color: 'act-rock' },
];

export const WAYPOINT_TYPES = [
  { key: 'summit', label: 'Sommet' },
  { key: 'pass', label: 'Col' },
  { key: 'lake', label: 'Lac' },
  { key: 'waterfall', label: 'Cascade' },
  { key: 'locality', label: 'Localité' },
  { key: 'bisse', label: 'Bisse' },
  { key: 'canyon', label: 'Canyon' },
  { key: 'access', label: 'Accès' },
  { key: 'climbing_outdoor', label: 'Site d’escalade' },
  { key: 'climbing_indoor', label: 'Salle d’escalade' },
  { key: 'hut', label: 'Refuge' },
  { key: 'gite', label: 'Gîte' },
  { key: 'shelter', label: 'Abri' },
  { key: 'bivouac', label: 'Bivouac' },
  { key: 'camp_site', label: 'Camping' },
  { key: 'base_camp', label: 'Camp de base' },
  { key: 'local_product', label: 'Produit local' },
  { key: 'paragliding_takeoff', label: 'Décollage parapente' },
  { key: 'paragliding_landing', label: 'Atterrissage parapente' },
  { key: 'cave', label: 'Grotte' },
  { key: 'waterpoint', label: 'Point d’eau' },
  { key: 'weather_station', label: 'Station météo' },
  { key: 'webcam', label: 'Webcam' },
  { key: 'virtual', label: 'Virtuel' },
  { key: 'slackline_spot', label: 'Spot slackline' },
  { key: 'misc', label: 'Divers' },
];

export const ROUTE_TYPES = [
  { key: 'return_same_way', label: 'Aller-retour' },
  { key: 'loop', label: 'Boucle' },
  { key: 'loop_hut', label: 'Boucle avec refuge' },
  { key: 'traverse', label: 'Traversée' },
  { key: 'raid', label: 'Raid' },
  { key: 'expedition', label: 'Expédition' },
];

export const ROUTE_CONFIGURATIONS = [
  { key: 'edge', label: 'Arête' },
  { key: 'pillar', label: 'Pilier' },
  { key: 'face', label: 'Face' },
  { key: 'corridor', label: 'Couloir' },
  { key: 'goulotte', label: 'Goulotte' },
  { key: 'glacier', label: 'Glacier' },
];

export const CLIMBING_OUTDOOR_TYPES = [
  { key: 'single', label: 'Une longueur' },
  { key: 'multi', label: 'Grande voie' },
  { key: 'bloc', label: 'Bloc' },
  { key: 'psicobloc', label: 'Psicobloc' },
];

export const CLIMBING_INDOOR_TYPES = [
  { key: 'pitch', label: 'Voie' },
  { key: 'bloc', label: 'Bloc' },
];

export const CLIMBING_STYLES = [
  { key: 'slab', label: 'Dalle' },
  { key: 'vertical', label: 'Vertical' },
  { key: 'overhang', label: 'Dévers' },
  { key: 'roof', label: 'Toit' },
  { key: 'small_pillar', label: 'Petit pilier' },
  { key: 'crack_dihedral', label: 'Fissure / dièdre' },
];

export const ROCK_TYPES = [
  { key: 'basalte', label: 'Basalte' },
  { key: 'calcaire', label: 'Calcaire' },
  { key: 'conglomerat', label: 'Conglomérat' },
  { key: 'craie', label: 'Craie' },
  { key: 'gneiss', label: 'Gneiss' },
  { key: 'gres', label: 'Grès' },
  { key: 'granit', label: 'Granit' },
  { key: 'migmatite', label: 'Migmatite' },
  { key: 'mollasse_calcaire', label: 'Mollasse calcaire' },
  { key: 'pouding', label: 'Pouding' },
  { key: 'quartzite', label: 'Quartzite' },
  { key: 'rhyolite', label: 'Rhyolite' },
  { key: 'schiste', label: 'Schiste' },
  { key: 'trachyte', label: 'Trachyte' },
  { key: 'artificial', label: 'Artificiel' },
];

export const GLACIER_GEAR_TYPES = [
  { key: 'no', label: 'Aucun' },
  { key: 'glacier_safety_gear', label: 'Sécu glacier' },
  { key: 'crampons_spring', label: 'Crampons (printemps)' },
  { key: 'crampons_req', label: 'Crampons requis' },
  { key: 'glacier_crampons', label: 'Crampons glaciaires' },
];

export const ORIENTATIONS = [
  { key: 'N', label: 'N' },
  { key: 'NE', label: 'NE' },
  { key: 'E', label: 'E' },
  { key: 'SE', label: 'SE' },
  { key: 'S', label: 'S' },
  { key: 'SW', label: 'SO' },
  { key: 'W', label: 'O' },
  { key: 'NW', label: 'NO' },
];

// Ordinal rating scales — index = numeric difficulty, used by min/max selectors.
export const GLOBAL_RATINGS = [
  'F', 'F+', 'PD-', 'PD', 'PD+',
  'AD-', 'AD', 'AD+',
  'D-', 'D', 'D+',
  'TD-', 'TD', 'TD+',
  'ED-', 'ED', 'ED+',
  'ED4', 'ED5', 'ED6', 'ED7',
];
export const ENGAGEMENT_RATINGS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
export const RISK_RATINGS = ['X1', 'X2', 'X3', 'X4', 'X5'];
export const EQUIPMENT_RATINGS = ['P1', 'P1+', 'P2', 'P2+', 'P3', 'P3+', 'P4', 'P4+'];
export const EXPOSITION_ROCK_RATINGS = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];

export const SKI_RATINGS = [
  '1.1', '1.2', '1.3',
  '2.1', '2.2', '2.3',
  '3.1', '3.2', '3.3',
  '4.1', '4.2', '4.3',
  '5.1', '5.2', '5.3', '5.4', '5.5', '5.6',
];
export const LABANDE_SKI_RATINGS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];

export const ROCK_FREE_RATINGS = [
  '2', '3a', '3b', '3c',
  '4a', '4b', '4c',
  '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+', '9c',
];

export const ICE_RATINGS = ['1', '2', '3', '3+', '4', '4+', '5', '5+', '6', '6+', '7', '7+'];
export const MIXED_RATINGS = ['M1', 'M2', 'M3', 'M3+', 'M4', 'M4+', 'M5', 'M5+', 'M6', 'M6+', 'M7', 'M7+', 'M8', 'M8+', 'M9', 'M9+', 'M10', 'M10+', 'M11', 'M11+', 'M12', 'M12+'];
export const AID_RATINGS = ['A0', 'A1', 'A2', 'A2+', 'A3', 'A3+', 'A4', 'A4+', 'A5'];
export const VIA_FERRATA_RATINGS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
export const HIKING_RATINGS = ['T1', 'T2', 'T3', 'T4', 'T5'];
export const SNOWSHOE_RATINGS = ['R1', 'R2', 'R3', 'R4', 'R5'];
export const MTB_UP_RATINGS = ['M1', 'M2', 'M3', 'M4', 'M5'];
export const MTB_DOWN_RATINGS = ['V1', 'V2', 'V3', 'V4', 'V5'];

export const DURATION_TYPES = ['1j', '2j', '3j', '4j', '5j', '6j', '7j', '8j', '9j', '10j', '10j+'];
export const DURATION_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '10+'];

export const QUALITY_TYPES = [
  { key: 'empty', label: 'Vide' },
  { key: 'draft', label: 'Ébauche' },
  { key: 'medium', label: 'Moyenne' },
  { key: 'fine', label: 'Bien' },
  { key: 'great', label: 'Excellente' },
];

export const CONDITION_RATINGS = [
  { key: 'excellent', label: 'Excellentes' },
  { key: 'good', label: 'Bonnes' },
  { key: 'average', label: 'Moyennes' },
  { key: 'poor', label: 'Mauvaises' },
  { key: 'awful', label: 'Très mauvaises' },
];
export const FREQUENTATION_TYPES = [
  { key: 'quiet', label: 'Peu de monde' },
  { key: 'some', label: 'Quelques cordées' },
  { key: 'crowded', label: 'Beaucoup de monde' },
  { key: 'overcrowded', label: 'Surfréquentée' },
];

export const GLACIER_RATINGS = [
  { key: 'easy', label: 'Facile' },
  { key: 'possible', label: 'Possible' },
  { key: 'difficult', label: 'Difficile' },
  { key: 'impossible', label: 'Impossible' },
];

export const AVALANCHE_SIGNS = [
  { key: 'no', label: 'Aucun' },
  { key: 'danger_sign', label: 'Signes de danger' },
  { key: 'recent_avalanche', label: 'Avalanche récente' },
  { key: 'natural_avalanche', label: 'Avalanche naturelle' },
  { key: 'accidental_avalanche', label: 'Avalanche accidentelle' },
];

export const MONTHS = [
  { key: 'jan', label: 'Janv.' },
  { key: 'feb', label: 'Févr.' },
  { key: 'mar', label: 'Mars' },
  { key: 'apr', label: 'Avril' },
  { key: 'may', label: 'Mai' },
  { key: 'jun', label: 'Juin' },
  { key: 'jul', label: 'Juil.' },
  { key: 'aug', label: 'Août' },
  { key: 'sep', label: 'Sept.' },
  { key: 'oct', label: 'Oct.' },
  { key: 'nov', label: 'Nov.' },
  { key: 'dec', label: 'Déc.' },
];

export const ACCESS_TIMES = ['1min', '5min', '10min', '15min', '20min', '30min', '45min', '1h', '1h30', '2h', '2h30', '3h', '3h+'];

export const ARTICLE_CATEGORIES = [
  { key: 'mountain_environment', label: 'Environnement' },
  { key: 'gear', label: 'Matériel' },
  { key: 'technical', label: 'Technique' },
  { key: 'topoguide_supplements', label: 'Compléments topo' },
  { key: 'soft_mobility', label: 'Mobilité douce' },
  { key: 'expeditions', label: 'Expéditions' },
  { key: 'stories', label: 'Récits' },
  { key: 'c2c_meetings', label: 'Rencontres C2C' },
  { key: 'tags', label: 'Tags' },
  { key: 'site_info', label: 'Infos site' },
  { key: 'association', label: 'Association' },
];

export const ARTICLE_TYPES = [
  { key: 'collab', label: 'Collaboratif' },
  { key: 'personal', label: 'Personnel' },
];

export const XREPORT_EVENT_TYPES = [
  { key: 'avalanche', label: 'Avalanche' },
  { key: 'stone_ice_fall', label: 'Chute de pierres / glace' },
  { key: 'ice_cornice_collapse', label: 'Effondrement corniche / glace' },
  { key: 'person_fall', label: 'Chute de personne' },
  { key: 'crevasse_fall', label: 'Chute en crevasse' },
  { key: 'physical_failure', label: 'Défaillance physique' },
  { key: 'injury_without_fall', label: 'Blessure sans chute' },
  { key: 'blocked_person', label: 'Personne bloquée' },
  { key: 'weather_event', label: 'Événement météo' },
  { key: 'safety_operation', label: 'Opération de secours' },
  { key: 'critical_situation', label: 'Situation critique' },
  { key: 'other', label: 'Autre' },
];

export const XREPORT_SEVERITIES = [
  { key: 'severity_no', label: 'Pas de séquelle' },
  { key: '1d_to_3d', label: '1 à 3 jours' },
  { key: '4d_to_1m', label: '4 jours – 1 mois' },
  { key: '1m_to_3m', label: '1 à 3 mois' },
  { key: 'more_than_3m', label: '> 3 mois' },
];

export const AVALANCHE_LEVELS = [
  { key: 'level_1', label: '1 - Faible' },
  { key: 'level_2', label: '2 - Limité' },
  { key: 'level_3', label: '3 - Marqué' },
  { key: 'level_4', label: '4 - Fort' },
  { key: 'level_5', label: '5 - Très fort' },
  { key: 'level_na', label: 'Non communiqué' },
];

export const AVALANCHE_SLOPES = [
  { key: 'slope_lt_30', label: '< 30°' },
  { key: 'slope_30_35', label: '30 – 35°' },
  { key: 'slope_35_40', label: '35 – 40°' },
  { key: 'slope_40_45', label: '40 – 45°' },
  { key: 'slope_gt_45', label: '> 45°' },
];

export const LANGUAGES = [
  { key: 'fr', label: 'Français' },
  { key: 'it', label: 'Italiano' },
  { key: 'de', label: 'Deutsch' },
  { key: 'en', label: 'English' },
  { key: 'es', label: 'Español' },
  { key: 'ca', label: 'Català' },
  { key: 'eu', label: 'Euskara' },
];

// Activity ↔ relevant rating scales — used by AdvancedFilters to show only
// the rating selectors that make sense for the selected activities.
export const ACTIVITY_RATINGS = {
  rock_climbing: ['global', 'engagement', 'risk', 'equipment', 'rock_free', 'rock_required', 'aid', 'exposition_rock'],
  mountain_climbing: ['global', 'engagement', 'risk', 'equipment', 'rock_free', 'rock_required', 'ice', 'mixed', 'aid', 'exposition_rock'],
  snow_ice_mixed: ['global', 'engagement', 'risk', 'ice', 'mixed', 'exposition_rock'],
  ice_climbing: ['global', 'engagement', 'risk', 'ice'],
  skitouring: ['ski', 'labande_ski', 'ski_exposition', 'global_labande', 'engagement'],
  hiking: ['hiking'],
  snowshoeing: ['snowshoe'],
  via_ferrata: ['via_ferrata'],
  paragliding: [],
  mountain_biking: ['mtb_up', 'mtb_down'],
  slacklining: [],
};

export function activityMeta(key) {
  return ACTIVITIES.find((a) => a.key === key) || null;
}
export function activityLabel(key) {
  return activityMeta(key)?.label || key;
}
