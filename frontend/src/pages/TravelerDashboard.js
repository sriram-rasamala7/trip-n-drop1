// src/pages/TravelerDashboard.js
import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import LocationInput from '../components/LocationInput';

const normalizeLocation = (place) => {
  if (!place) return null;
  const lat =
    typeof place?.geometry?.location?.lat === 'function'
      ? place.geometry.location.lat()
      : place?.geometry?.location?.lat ?? place?.coordinates?.lat ?? place?.lat;
  const lng =
    typeof place?.geometry?.location?.lng === 'function'
      ? place.geometry.location.lng()
      : place?.geometry?.location?.lng ?? place?.coordinates?.lng ?? place?.lng;

  if (lat == null || lng == null) return null;

  return {
    address: place.formatted_address || place.description || place.address || '',
    coordinates: {
      lat: Number(lat),
      lng: Number(lng),
    },
  };
};

const TravelerDashboard = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [showCheckOrders, setShowCheckOrders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpInput, setOtpInput] = useState({});
  const [journeyData, setJourneyData] = useState({
    startLocation: null,
    endLocation: null,
    vehicleType: 'geared motorbike',
  });

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      const response = await deliveryAPI.getMyJobs();
      setMyJobs(response.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const handleJourneySelect = (type, place) => {
    const loc = normalizeLocation(place);
    if (!loc) {
      setError('Could not read coordinates. Please select from suggestions.');
      return;
    }
    setJourneyData((prev) => ({ ...prev, [type]: loc }));
  };

  const handleCheckOrders = async () => {
    setError('');
    if (!journeyData.startLocation || !journeyData.endLocation) {
      setError('Select both start and end locations for your journey.');
      return;
    }

    // Build payload and enforce numeric coordinates (this is the snippet you asked about)
    const payload = {
      journeyStart: { ...journeyData.startLocation },
      journeyEnd: { ...journeyData.endLocation },
      vehicleType: journeyData.vehicleType,
    };
    try {
      payload.journeyStart.coordinates.lat = Number(payload.journeyStart.coordinates.lat);
      payload.journeyStart.coordinates.lng = Number(payload.journeyStart.coordinates.lng);
      payload.journeyEnd.coordinates.lat = Number(payload.journeyEnd.coordinates.lat);
      payload.journeyEnd.coordinates.lng = Number(payload.journeyEnd.coordinates.lng);
    } catch {
      setError('Invalid journey coordinates. Please reselect locations.');
      return;
    }

    const ok =
      typeof payload.journeyStart.coordinates.lat === 'number' &&
      typeof payload.journeyStart.coordinates.lng === 'number' &&
      typeof payload.journeyEnd.coordinates.lat === 'number' &&
      typeof payload.journeyEnd.coordinates.lng === 'number' &&
      !Number.isNaN(payload.journeyStart.coordinates.lat) &&
      !Number.isNaN(payload.journeyStart.coordinates.lng) &&
      !Number.isNaN(payload.journeyEnd.coordinates.lat) &&
      !Number.isNaN(payload.journeyEnd.coordinates.lng);

    if (!ok) {
      setError('Invalid journey coordinates. Please reselect locations.');
      return;
    }

    setLoading(true);
    try {
      const res = await deliveryAPI.checkOrders(payload);
      setAvailableOrders(res.data || []);
      setShowCheckOrders(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch available orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (deliveryId) => {
    setLoading(true);
    setError('');
    try {
      await deliveryAPI.acceptDelivery(deliveryId);
      await fetchMyJobs();
      setShowCheckOrders(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (deliveryId) => {
    setLoading(true);
    setError('');
    try {
      await deliveryAPI.startDelivery(deliveryId);
      await fetchMyJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (deliveryId) => {
    const otp = otpInput[deliveryId];
    if (!otp || String(otp).length !== 6) {
      setError('Enter the 6-digit OTP to complete delivery.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await deliveryAPI.completeDelivery(deliveryId, { otp });
      await fetchMyJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Traveler Dashboard</h1>
        <div className="text-sm opacity-80">
          Logged in as: {user?.name} ({user?.role})
        </div>
      </header>

      {/* Journey planner */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Start location</label>
          <LocationInput
            placeholder="Search start address"
            onSelect={(place) => handleJourneySelect('startLocation', place)}
          />
          {journeyData.startLocation?.address && (
            <p className="text-xs opacity-80">Selected: {journeyData.startLocation.address}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">End location</label>
          <LocationInput
            placeholder="Search end address"
            onSelect={(place) => handleJourneySelect('endLocation', place)}
          />
          {journeyData.endLocation?.address && (
            <p className="text-xs opacity-80">Selected: {journeyData.endLocation.address}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Vehicle type</label>
          <select
            className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2"
            value={journeyData.vehicleType}
            onChange={(e) =>
              setJourneyData((p) => ({ ...p, vehicleType: e.target.value }))
            }
          >
            <option value="geared motorbike">Geared motorbike</option>
            <option value="scooter">Scooter</option>
            <option value="car">Car</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500"
            onClick={handleCheckOrders}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check matching orders'}
          </button>
        </div>
      </section>

      {/* Live journey preview map */}
      <section className="rounded border border-slate-800 p-3">
        <MapView
          pickup={journeyData.startLocation?.coordinates}
          delivery={journeyData.endLocation?.coordinates}
          height={340}
        />
      </section>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Available orders */}
      {showCheckOrders && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Available Orders</h2>
          {availableOrders.length === 0 ? (
            <div className="text-sm opacity-80">No matching orders found.</div>
          ) : (
            <ul className="space-y-3">
              {availableOrders.map((o) => (
                <li key={o._id} className="rounded border border-slate-800 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm">
                        From: {o.pickupLocation?.address}
                      </div>
                      <div className="text-sm">
                        To: {o.deliveryLocation?.address}
                      </div>
                      <div className="text-xs opacity-70">
                        Size: {o.packageSize} • Status: {o.status}
                      </div>
                    </div>
                    <button
                      className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => handleAccept(o._id)}
                      disabled={loading}
                    >
                      Accept
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* My Jobs */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">My Jobs</h2>
        {myJobs.length === 0 ? (
          <div className="text-sm opacity-80">No jobs yet.</div>
        ) : (
          <ul className="space-y-3">
            {myJobs.map((job) => (
              <li key={job._id} className="rounded border border-slate-800 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">
                      From: {job.pickupLocation?.address}
                    </div>
                    <div className="text-sm">
                      To: {job.deliveryLocation?.address}
                    </div>
                    <div className="text-xs opacity-70">
                      Status: {job.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {job.status === 'accepted' && (
                      <button
                        className="px-3 py-2 rounded bg-sky-600 hover:bg-sky-500"
                        onClick={() => handleStart(job._id)}
                        disabled={loading}
                      >
                        Start
                      </button>
                    )}
                    {job.status === 'in-transit' && (
                      <>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Enter OTP"
                          className="w-28 rounded bg-slate-800 border border-slate-700 px-2 py-2 text-sm"
                          value={otpInput[job._id] || ''}
                          onChange={(e) =>
                            setOtpInput((p) => ({ ...p, [job._id]: e.target.value.replace(/\\D/g, '').slice(0, 6) }))
                          }
                        />
                        <button
                          className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => handleComplete(job._id)}
                          disabled={loading}
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Job route preview */}
                <MapView
                  pickup={job.pickupLocation?.coordinates}
                  delivery={job.deliveryLocation?.coordinates}
                  height={220}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TravelerDashboard;
