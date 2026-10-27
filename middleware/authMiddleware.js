const Boom = require("@hapi/boom");

// Utilities
const authenticateUser = require("../utils/authenticateUser");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.cookies?.accessToken;

    if (!authHeader) {
      throw Boom.unauthorized("Access token is required");
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw Boom.unauthorized("Invalid authorization header");
    }

    req.user = await authenticateUser(token);

    next();
  } catch (error) {
    return next(error || Boom.unauthorized("Invalid or expired access token"));
  }
};

module.exports = authenticate;
