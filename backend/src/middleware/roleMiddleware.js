// backend/src/middleware/roleMiddleware.js

exports.authorize = (roles) => {
  return (req, res, next) => {
    const role = Number(req.user.role ?? req.user.roleId);

    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

// Admin only middleware (role 1)
exports.adminOnly = (req, res, next) => {
  const role = Number(req.user.role ?? req.user.roleId);
  
  if (role !== 1) {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  
  next();
};
