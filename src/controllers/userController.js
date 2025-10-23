import mongoose from "mongoose";
import User from "../models/User.js";


export const createUser = async (req, res) => {
  try {
    const newUser = req.body;
    const query = { email: newUser.email };
    const existingUser = await User.findOne(query);

    if (existingUser) {
      const updateDoc = {
        $set: { last_login: new Date().toISOString() },
      };
      await User.updateOne(query, updateDoc);

      return res
        .status(200)
        .send({ message: "User already exists", inserted: false });
    }

    const result = await User.create(newUser);
    res.send(result);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send("Error adding user");
  }
};

export const getUserRole = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).send("Error fetching user role");
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { role } }
    );

    res.send(result);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).send("Error updating user role");
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );

    res.send({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send({ message: "Failed to update profile" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const email = req.query.email || "";
    const regex = new RegExp(email, "i");

    const users = await User.find({ email: { $regex: regex } })
      .limit(10);

    res.send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  }
};
