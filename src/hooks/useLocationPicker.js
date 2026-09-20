import { useState, useEffect, useRef } from 'react';
import api from '../api/axios.js';

export function useLocationPicker() {
  const [governorates, setGovernorates] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedGovernorate, setSelectedGovernorateState] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zonesLoading, setZonesLoading] = useState(false);

  const skipZoneResetRef = useRef(false);

  useEffect(() => {
    api.get('/governorates').then((res) => setGovernorates(res.data.governorates)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedGovernorate) {
      setZones([]);
      return;
    }
    setZonesLoading(true);
    api
      .get('/delivery-zones', { params: { governorateId: selectedGovernorate._id } })
      .then((res) => setZones(res.data.zones))
      .finally(() => setZonesLoading(false));

    if (skipZoneResetRef.current) {
      skipZoneResetRef.current = false;
    } else {
      setSelectedZone(null);
    }
  }, [selectedGovernorate]);

  const setSelectedGovernorate = (newGovernorate) => {
    setSelectedGovernorateState(newGovernorate);
  };

  const presetLocation = (governorate, zone) => {
    skipZoneResetRef.current = true;
    setSelectedGovernorateState(governorate);
    setSelectedZone(zone);
  };

  return {
    governorates,
    zones,
    zonesLoading,
    selectedGovernorate,
    selectedZone,
    setSelectedGovernorate,
    setSelectedZone,
    presetLocation,
  };
}