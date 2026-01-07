import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  // Accept token from cookie or Authorization header (Bearer)
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
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
