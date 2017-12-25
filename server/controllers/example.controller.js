/**
 * Load user and append to req.
 */
function example1(req, res) {
  return res.json({ success: true });
}

/**
 * Example 2
 * @returns {User}
 */
function example2(req, res) {
  return res.json({ success: true });
}

export default { example1, example2 };
