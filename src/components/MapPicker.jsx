import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { Box, Button } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import 'leaflet/dist/leaflet.css';

// middle of Jordan, zoomed out to show the whole country
const JORDAN_CENTER = [31.3, 36.4];
const JORDAN_ZOOM = 7;

function ClickHandler({ onChange }) {
  useMapEvents({
    click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

// a map inside a dialog is measured while the dialog is still animating open, which leaves
// grey tiles — re-measure once the animation is done
function FixSizeAndFollow({ value }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    // only re-center when the pin moves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  return null;
}

// Reusable map: click to drop a pin. `value` is { lat, lng } or null.
function MapPicker({ value, onChange, height = 380, onLocateError }) {
  const handleLocate = () => {
    if (!navigator.geolocation) {
      onLocateError?.('المتصفح ما بيدعم تحديد الموقع');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => onLocateError?.('تعذّر الوصول لموقعك، تأكد من السماح بالموقع أو حط الدبوس يدوي'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Box>
      <Button size="small" startIcon={<MyLocationIcon />} onClick={handleLocate} sx={{ mb: 1 }}>
        استخدم موقعي الحالي
      </Button>
      <Box sx={{ height, borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0', direction: 'ltr' }}>
        <MapContainer
          center={value ? [value.lat, value.lng] : JORDAN_CENTER}
          zoom={value ? 13 : JORDAN_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <FixSizeAndFollow value={value} />
          {value && (
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={10}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#0F766E', fillOpacity: 1 }}
            />
          )}
        </MapContainer>
      </Box>
    </Box>
  );
}

export default MapPicker;