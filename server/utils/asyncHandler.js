// server/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
    // On passe bien (req, res, next) dans le bon ordre
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;