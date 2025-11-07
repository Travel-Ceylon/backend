import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded?.id;
    req.role = decoded?.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
