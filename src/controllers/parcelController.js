import Parcel from "../models/Parcel.js";

export const getParcels = async (req, res) => {
  try {
    const { email, payment_status, delivery_status } = req.query;
    let query = {};

    if (email) query.created_by = email;
    if (payment_status) query.payment_status = payment_status;
    if (delivery_status) query.delivery_status = delivery_status;

    const parcels = await Parcel.find(query)
      .sort({ createdAt: -1 }); 

    res.send(parcels);
  } catch (error) {
    console.error("Error fetching parcels:", error);
    res.status(500).send("Error fetching parcels");
  }
};


export const getParcelById = async (req, res) => {
  try {
    const { id } = req.params;

    const parcel = await Parcel.findById(id);

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.status(200).json(parcel);
  } catch (error) {
    console.error("Error fetching parcel:", error);
    res.status(500).json({ message: "Error fetching parcel" });
  }
};

export const assignParcelToRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { riderId, riderName, riderEmail } = req.body;

    // Update parcel using Mongoose
    const result = await Parcel.findByIdAndUpdate(
      id,
      {
        $set: {
          delivery_status: "rider_assigned",
          assigned_rider_id: riderId,
          assigned_rider_name: riderName,
          assigned_rider_email: riderEmail,
        },
      },
      { new: true } // returns updated parcel
    );

    if (!result) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.status(200).json({
      success: true,
      message: "Parcel assigned to rider successfully",
      parcel: result,
    });
  } catch (error) {
    console.error("Error assigning parcel:", error);
    res.status(500).json({ message: "Error assigning parcel" });
  }
};

export const updateParcelStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status, rider_email } = req.body;

    const updatedDoc = { delivery_status };

    if (delivery_status === "in_transit") {
      updatedDoc.picked_at = new Date().toISOString();
    } else if (delivery_status === "delivered") {
      updatedDoc.delivered_at = new Date().toISOString();
    }

    const parcelUpdate = await Parcel.findOneAndUpdate(
      { _id: id, assigned_rider_email: rider_email },
      { $set: updatedDoc },
      { new: true }
    );

    if (!parcelUpdate) {
      return res
        .status(404)
        .json({ message: "Parcel not found or rider mismatch" });
    }

    res.status(200).json({
      success: true,
      message: "Parcel status updated successfully",
      parcel: parcelUpdate,
    });
  } catch (err) {
    console.error("Error updating parcel status:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const cashoutParcel = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Parcel.findByIdAndUpdate(
      id,
      {
        $set: {
          cashout_status: "cashed_out",
          cashed_out_at: new Date(),
        },
      },
      { new: true } // return updated parcel
    );

    if (!result) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.status(200).json({
      success: true,
      message: "Parcel cashed out successfully",
      parcel: result,
    });
  } catch (error) {
    console.error("Error cashing out parcel:", error);
    res.status(500).json({ message: "Error cashing out parcel" });
  }
};

export const createParcel = async (req, res) => {
  try {
    const newParcel = req.body;
    const result = await Parcel.create(newParcel);

    res.status(201).json({
      success: true,
      message: "Parcel created successfully",
      parcel: result,
    });
  } catch (error) {
    console.error("Error adding parcel:", error);
    res.status(500).json({ message: "Error adding parcel" });
  }
};

export const deleteParcel = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Parcel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    res.status(200).json({
      success: true,
      message: "Parcel deleted successfully",
      parcel: result,
    });
  } catch (error) {
    console.error("Error deleting parcel:", error);
    res.status(500).json({ message: "Error deleting parcel" });
  }
};

export const getRiderPendingParcels = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Rider email is required" });
    }

    const parcels = await Parcel.find({
      assigned_rider_email: email,
      delivery_status: { $in: ["rider_assigned", "in_transit"] },
    }).sort({ creation_date: 1 });

    res.status(200).json(parcels);
  } catch (err) {
    console.error("Error fetching pending parcels for rider:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRiderCompletedParcels = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Rider email is required" });
    }

    const completedParcels = await Parcel.find({
      assigned_rider_email: email,
      delivery_status: { $in: ["delivered", "service_center_delivered"] },
    });

    res.status(200).json(completedParcels);
  } catch (err) {
    console.error("Error fetching completed parcels:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
