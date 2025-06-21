const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  //1. Get header
  const authHeader = req.headers.authorization;
  //2. Check if header exists
  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    //3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //4. Add user from payload
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    console.error("JWT error:", err);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = protect;
