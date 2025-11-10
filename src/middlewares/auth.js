const jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: (req, res, next) => {
    try {
      const bearer = req.headers.authorization;
      if (!bearer) {
        return res.status(401).json({ error: "Token missing" });
      }

      const token = bearer.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Token missing" });
      }

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Simpan payload token ke request
      req.user = decoded;
      // console.log("SUKSESSS!!"); 
      
      next();
    } catch (err) {
      console.error("verifyToken error:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }
  }
};
