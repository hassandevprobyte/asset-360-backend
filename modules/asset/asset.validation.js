const Boom = require("@hapi/boom");

// Repositories
const assetRepository = require("./asset.repository");

// Constants
const message = require("../../constants/MESSAGE");

exports.throwErrorIfAssetDoesNotExist = async (assetId) => {
  const asset = await assetRepository.getAssetById(assetId);

  if (!asset) {
    throw Boom.notFound(message.error.asset.notFound);
  }

  return asset;
};
