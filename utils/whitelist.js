/**
 * path로 부터 project의 apiKey를 획득한다.
 *
 * @param {string|undefined} path
 * @returns {string};
 */
exports.getApiKeyFromPath = function (path) {
  const result = path.match(/^\/projects\/(.*)$/);
  if (!result) return undefined;
  const apiKey = result[1];
  return apiKey;
};
