// quick-queue/backend/src/controllers/serviceTypeController.js

const ServiceType = require("../models/ServiceType");

// Get all service types (for organizers and users)
exports.getAllServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find({ isActive: true }).sort({ name: 1 });
    res.json(serviceTypes);
  } catch (error) {
    console.error("Error fetching service types:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all service types including inactive (for admin)
exports.getAllServiceTypesAdmin = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find().sort({ createdAt: -1 });
    res.json(serviceTypes);
  } catch (error) {
    console.error("Error fetching service types:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new service type (admin only)
exports.createServiceType = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    // Check if service type already exists
    const existingType = await ServiceType.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingType) {
      return res.status(400).json({ message: "Service type already exists" });
    }

    const serviceType = new ServiceType({
      name: name.trim(),
      description: description || "",
      icon: icon || "building",
    });

    await serviceType.save();
    res.status(201).json({ message: "Service type created successfully", serviceType });
  } catch (error) {
    console.error("Error creating service type:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update service type (admin only)
exports.updateServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const serviceType = await ServiceType.findById(id);
    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" });
    }

    // Check if new name conflicts with existing type
    if (name && name !== serviceType.name) {
      const existingType = await ServiceType.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingType) {
        return res.status(400).json({ message: "Service type name already exists" });
      }
    }

    if (name) serviceType.name = name.trim();
    if (description !== undefined) serviceType.description = description;
    if (icon) serviceType.icon = icon;
    if (isActive !== undefined) serviceType.isActive = isActive;

    await serviceType.save();
    res.json({ message: "Service type updated successfully", serviceType });
  } catch (error) {
    console.error("Error updating service type:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete service type (admin only)
exports.deleteServiceType = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceType = await ServiceType.findByIdAndDelete(id);
    if (!serviceType) {
      return res.status(404).json({ message: "Service type not found" });
    }

    res.json({ message: "Service type deleted successfully" });
  } catch (error) {
    console.error("Error deleting service type:", error);
    res.status(500).json({ message: "Server error" });
  }
};
