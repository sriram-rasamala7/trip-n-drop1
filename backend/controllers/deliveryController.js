const { isOnRouteFlexible } = require('../utils/distance');

const DeliveryRequest = require('../models/DeliveryRequest');
const Journey = require('../models/Journey');
const { isOnRoute } = require('../utils/distance');
const { generateOTP, verifyOTP } = require('../utils/otp');

// @desc    Create delivery request
// @route   POST /api/deliveries
// @access  Private (Sender only)
const createDelivery = async (req, res) => {
  try {
    const { pickupLocation, deliveryLocation, receiverContact, packageSize } = req.body;

    const delivery = await DeliveryRequest.create({
      sender: req.user._id,
      pickupLocation,
      deliveryLocation,
      receiverContact,
      packageSize
    });

    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all deliveries for sender
// @route   GET /api/deliveries/my-deliveries
// @access  Private (Sender only)
const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await DeliveryRequest.find({ sender: req.user._id })
      .populate('traveler', 'name mobile')
      .sort('-createdAt');
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available deliveries for traveler based on journey
// @route   POST /api/deliveries/check-orders
// @access  Private (Traveler only)
const checkAvailableOrders = async (req, res) => {
  try {
    const { journeyStart, journeyEnd, vehicleType } = req.body;

    // Get all pending deliveries
    const allDeliveries = await DeliveryRequest.find({ 
      status: 'pending'
    }).populate('sender', 'name mobile');

    // Filter deliveries that are on the route
    const matchingDeliveries = allDeliveries.filter(delivery => {
      // Check if vehicle type matches
      if (delivery.vehicleType !== vehicleType) {
        return false;
      }

      // Use flexible route matching (2km radius instead of 1.5km)
      return isOnRouteFlexible(
        delivery.pickupLocation.coordinates,
        delivery.deliveryLocation.coordinates,
        journeyStart.coordinates,
        journeyEnd.coordinates,
        2.0  // Increased radius for more flexibility
      );
    });

    res.json(matchingDeliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept delivery request
// @route   PUT /api/deliveries/:id/accept
// @access  Private (Traveler only)
const acceptDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryRequest.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({ message: 'Delivery is not available' });
    }

    // Generate OTP for delivery verification
    const otp = generateOTP();

    delivery.traveler = req.user._id;
    delivery.status = 'accepted';
    delivery.otp = otp;

    await delivery.save();

    res.json({ 
      message: 'Delivery accepted successfully',
      delivery,
      otp // In production, this should be sent via SMS
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Start delivery
// @route   PUT /api/deliveries/:id/start
// @access  Private (Traveler only)
const startDelivery = async (req, res) => {
  try {
    const delivery = await DeliveryRequest.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.traveler.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (delivery.status !== 'accepted') {
      return res.status(400).json({ message: 'Delivery cannot be started' });
    }

    delivery.status = 'in-transit';
    await delivery.save();

    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete delivery with OTP verification
// @route   PUT /api/deliveries/:id/complete
// @access  Private (Traveler only)
const completeDelivery = async (req, res) => {
  try {
    const { otp } = req.body;
    const delivery = await DeliveryRequest.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.traveler.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (delivery.status !== 'in-transit') {
      return res.status(400).json({ message: 'Delivery is not in transit' });
    }

    // Verify OTP
    if (!verifyOTP(otp, delivery.otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    delivery.status = 'delivered';
    delivery.deliveredAt = Date.now();
    delivery.payment.status = 'completed';
    
    await delivery.save();

    res.json({ 
      message: 'Delivery completed successfully',
      delivery
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get traveler's accepted deliveries
// @route   GET /api/deliveries/my-jobs
// @access  Private (Traveler only)
const getMyJobs = async (req, res) => {
  try {
    const deliveries = await DeliveryRequest.find({ 
      traveler: req.user._id 
    })
    .populate('sender', 'name mobile')
    .sort('-createdAt');
    
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDelivery,
  getMyDeliveries,
  checkAvailableOrders,
  acceptDelivery,
  startDelivery,
  completeDelivery,
  getMyJobs
};
