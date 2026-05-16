<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const props = defineProps({
  // Cooked C2C document (any type). We only read .geometry.geom.
  doc: { type: Object, required: true },
  // When the panel becomes visible. MapLibre needs resize() once shown.
  active: { type: Boolean, default: true },
});

const mapEl = ref(null);
let map = null;
let geolocate = null;

const STYLE = {
  version: 8,
  sources: {
    otm: {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA), <a href="https://openstreetmap.org">OSM</a> contributors',
    },
  },
  layers: [{ id: 'otm', type: 'raster', source: 'otm' }],
};

// EPSG:3857 → EPSG:4326. C2C ships geometries in spherical Mercator.
function mercToLngLat([x, y]) {
  const lon = (x * 180) / 20037508.34;
  const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return [lon, lat];
}

function projectGeom(geom) {
  if (!geom) return null;
  if (geom.type === 'Point') {
    return { type: 'Point', coordinates: mercToLngLat(geom.coordinates) };
  }
  if (geom.type === 'LineString') {
    return { type: 'LineString', coordinates: geom.coordinates.map(mercToLngLat) };
  }
  if (geom.type === 'MultiLineString') {
    return {
      type: 'MultiLineString',
      coordinates: geom.coordinates.map((line) => line.map(mercToLngLat)),
    };
  }
  if (geom.type === 'MultiPoint') {
    return {
      type: 'MultiPoint',
      coordinates: geom.coordinates.map(mercToLngLat),
    };
  }
  return null;
}

function parseGeom() {
  const raw = props.doc?.geometry?.geom ?? props.doc?.geometry?.geom_detail;
  if (!raw) return null;
  try {
    return projectGeom(JSON.parse(raw));
  } catch {
    return null;
  }
}

function geomBounds(geom) {
  const bounds = new maplibregl.LngLatBounds();
  const visit = (coords) => {
    if (typeof coords[0] === 'number') {
      bounds.extend(coords);
    } else {
      coords.forEach(visit);
    }
  };
  visit(geom.coordinates);
  return bounds;
}

function render() {
  const geom = parseGeom();
  if (!map || !geom) return;

  // Trace layer for routes/outings.
  if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
    const data = { type: 'Feature', geometry: geom, properties: {} };
    if (map.getSource('trace')) {
      map.getSource('trace').setData(data);
    } else {
      map.addSource('trace', { type: 'geojson', data });
      map.addLayer({
        id: 'trace-line',
        type: 'line',
        source: 'trace',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ff9933',
          'line-width': 4,
          'line-opacity': 0.9,
        },
      });
    }
  }

  // Point pin for waypoints or trace endpoints.
  if (geom.type === 'Point' || geom.type === 'MultiPoint') {
    const data = { type: 'Feature', geometry: geom, properties: {} };
    if (map.getSource('point')) {
      map.getSource('point').setData(data);
    } else {
      map.addSource('point', { type: 'geojson', data });
      map.addLayer({
        id: 'point-circle',
        type: 'circle',
        source: 'point',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff9933',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
    }
  }

  try {
    map.fitBounds(geomBounds(geom), { padding: 40, maxZoom: 15, duration: 0 });
  } catch {
    // empty geometry
  }
}

onMounted(() => {
  map = new maplibregl.Map({
    container: mapEl.value,
    style: STYLE,
    center: [6.865, 45.832],
    zoom: 7,
    attributionControl: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
  geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  });
  map.addControl(geolocate, 'top-right');
  map.on('load', render);
});

// Re-fit/redraw when the doc changes (e.g. navigating between topos).
watch(() => props.doc?.document_id, () => {
  if (map?.isStyleLoaded()) render();
});

// When the panel goes from hidden to visible inside a flex/scroll container,
// MapLibre needs to recompute its canvas size to render correctly.
watch(() => props.active, (v) => {
  if (v && map) {
    // Next tick: layout has applied.
    requestAnimationFrame(() => map.resize());
  }
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

function locate() {
  if (geolocate) geolocate.trigger();
}
</script>

<template>
  <div class="relative h-[60vh] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
    <div ref="mapEl" class="absolute inset-0" />
    <button
      class="absolute bottom-3 right-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-card-hover hover:bg-brand-600 active:scale-95"
      aria-label="Me localiser"
      @click="locate"
    >
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="9" /><line x1="12" y1="1" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="23" /><line x1="1" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="23" y2="12" />
      </svg>
    </button>
  </div>
</template>
