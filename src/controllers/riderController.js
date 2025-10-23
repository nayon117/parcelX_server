import Rider from "../models/Rider.js";
import User from "../models/User.js";

export const createRider = async (req, res) => {
  try {
    const newRider = req.body;
    const result = await Rider.create(newRider);

    res.status(201).json({
      success: true,
      message: "Rider created successfully",
      rider: result,
    });
  } catch (error) {
    console.error("Error adding rider:", error);
    res.status(500).json({ message: "Error adding rider" });
  }
};

export const getPendingRiders = async (req, res) => {
  try {
    const pendingRiders = await Rider.find({ status: "pending" });
    res.status(200).json(pendingRiders);
  } catch (error) {
    console.error("Error fetching pending riders:", error);
    res.status(500).json({ message: "Error fetching pending riders" });
  }
};

export const getApprovedRiders = async (req, res) => {
  try {
    const approvedRiders = await Rider.find({ status: "approved" });
    res.status(200).json(approvedRiders);
  } catch (error) {
    console.error("Error fetching approved riders:", error);
    res.status(500).json({ message: "Error fetching approved riders" });
  }
};

export const getAvailableRiders = async (req, res) => {
  try {
    const { district } = req.query;

    if (!district) {
      return res.status(400).json({ message: "District is required" });
    }

    const riders = await Rider.find({ district });
    res.status(200).json(riders);
  } catch (err) {
    console.error("Error fetching available riders:", err);
    res.status(500).json({ message: "Failed to load riders" });
  }
};

export const updateRiderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email } = req.body;

    const riderUpdate = await Rider.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!riderUpdate) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // If approved, update user role
    if (status === "approved" && email) {
      await User.findOneAndUpdate(
        { email },
        { $set: { role: "rider" } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Rider status updated successfully",
      rider: riderUpdate,
    });
  } catch (error) {
    console.error("Error updating rider status:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};


