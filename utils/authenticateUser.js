const jwt = require("jsonwebtoken");
const Boom = require("@hapi/boom");

// Validations
const accessValidation = require("../modules/access/access.validation");

// Utilities
const resolveEffectiveAccess = require("./resolveEffectiveAccess");
const getSigningKey = require("./getSigningKey");

module.exports = async (token) => {
  if (!token) {
    throw Boom.unauthorized("Access token is required");
  }

  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        algorithms: ["RS256"],
        issuer: "https://auth360.com",
        audience: "https://auth360.com",
      },
      (error, decodedToken) => {
        if (error) {
          return reject(error);
        }

        resolve(decodedToken);
      },
    );
  });

  const data = await accessValidation.throwErrorIfAccessUserDoesNotExist(decoded.sub?.id);

  const effectiveAccess = resolveEffectiveAccess(data.roles);

  return {
    ...decoded.sub,
    effectivePermissions: effectiveAccess.effectivePermissions,
    effectiveScope: effectiveAccess.effectiveScope,
    indexPath: effectiveAccess.indexPath,
  };
};
