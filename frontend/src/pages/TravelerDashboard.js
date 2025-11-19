import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DeliveryCard from '../components/DeliveryCard';
import LocationInput from '../components/LocationInput';

const TravelerDashboard = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [showCheckOrders, setShowCheckOrders] = useState(false);
  const [loading, setLoading] = useState(false);
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
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleCheckOrders = async () => {
    if (!journeyData.startLocation || !journeyData.endLocation) {
      alert('Please select both start and end locations');
      return;
    }

    setLoading(true);
    try {
      const response = await deliveryAPI.checkOrders({
        journeyStart: journeyData.startLocation,
        journeyEnd: journeyData.endLocation,
        vehicleType: journeyData.vehicleType,
      });
      setAvailableOrders(response.data);
      setShowCheckOrders(true);
    } catch (error) {
      console.error('Error checking orders:', error);
      alert('Failed to check orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (delivery) => {
    try {
      const response = await deliveryAPI.acceptDelivery(delivery._id);
      alert(`Order accepted! OTP: ${response.data.otp}`);
      setAvailableOrders(availableOrders.filter(d => d._id !== delivery._id));
      fetchMyJobs();
    } catch (error) {
      alert('Failed to accept order');
    }
  };

  const handleStartDelivery = async (delivery) => {
    try {
      await deliveryAPI.startDelivery(delivery._id);
      alert('Delivery started!');
      fetchMyJobs();
    } catch (error) {
      alert('Failed to start delivery');
    }
  };

  const handleCompleteDelivery = async (delivery) => {
    const otp = otpInput[delivery._id];
    if (!otp) {
      alert('Please enter OTP');
      return;
    }

    try {
      await deliveryAPI.completeDelivery(delivery._id, otp);
      alert('Delivery completed successfully! Payment marked as complete.');
      setOtpInput({ ...otpInput, [delivery._id]: '' });
      fetchMyJobs();
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Traveler Dashboard</h1>
          <p className="text-gray-600">UPI ID: {user?.upiId}</p>
        </div>

        {/* Journey Setup */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Set Your Journey</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <LocationInput
              label="Journey Start Location"
              placeholder="Where are you starting from?"
              onLocationSelect={(location) => 
                setJourneyData({ ...journeyData, startLocation: location })
              }
            />
            
            <LocationInput
              label="Journey End Location"
              placeholder="Where are you going?"
              onLocationSelect={(location) => 
                setJourneyData({ ...journeyData, endLocation: location })
              }
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type
            </label>
            <select
              value={journeyData.vehicleType}
              onChange={(e) => setJourneyData({ ...journeyData, vehicleType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="geared motorbike">🏍️ Geared Motorbike (Small packages)</option>
              <option value="scooter">🛵 Scooter (Medium packages)</option>
              <option value="car">🚗 Car (Large packages)</option>
            </select>
          </div>

          <button
            onClick={handleCheckOrders}
            disabled={loading}
            className="w-full bg-secondary text-white py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Checking...' : '🔍 Check for Available Orders'}
          </button>
        </div>

        {/* Available Orders */}
        {showCheckOrders && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Available Orders ({availableOrders.length})
            </h2>
            
            {availableOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No orders found on your route. Try a different route or check back later.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableOrders.map((order) => (
                  <DeliveryCard
                    key={order._id}
                    delivery={order}
                    onAction={handleAcceptOrder}
                    actionLabel="Accept Order"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Active Jobs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            My Deliveries ({myJobs.length})
          </h2>
          
          {myJobs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No active deliveries. Check for orders to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myJobs.map((job) => (
                <div key={job._id}>
                  <DeliveryCard
                    delivery={job}
                    showOTP={job.status === 'accepted' || job.status === 'in-transit'}
                  />
                  
                  {job.status === 'accepted' && (
                    <button
                      onClick={() => handleStartDelivery(job)}
                      className="w-full mt-3 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                      Start Delivery
                    </button>
                  )}
                  
                  {job.status === 'in-transit' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Enter OTP from receiver"
                        value={otpInput[job._id] || ''}
                        onChange={(e) => setOtpInput({ ...otpInput, [job._id]: e.target.value })}
                        maxLength="6"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                      />
                      <button
                        onClick={() => handleCompleteDelivery(job)}
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                      >
                        Complete Delivery
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelerDashboard;
