import { useState, useEffect } from 'react';
import api from '../api/axios.js';

export function useLocationPicker(initialGovernorate = null, initialZone = null) {
  const [governorates, setGovernorates] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(initialGovernorate);
  const [selectedZone, setSelectedZone] = useState(initialZone);
  const [zonesLoading, setZonesLoading] = useState(false);

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
  }, [selectedGovernorate]);

  const handleGovernorateChange = (newGovernorate) => {
    setSelectedGovernorate(newGovernorate);
    setSelectedZone(null);
  };

  return {
    governorates,
    zones,
    zonesLoading,
    selectedGovernorate,
    selectedZone,
    setSelectedGovernorate: handleGovernorateChange,
    setSelectedZone,
  };
}