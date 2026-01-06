import jwt from "jsonwebtoken";

export const generateToken = (id, role) => {
  const payloadId = typeof id === "string" ? id : String(id);
  return jwt.sign(
    {
      id: payloadId,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
