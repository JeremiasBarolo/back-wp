const SQLService = require('../classes/sqlService');
const sqlService = new SQLService();


const insertMasivo = async (req, res) => {
  try {
    const response = await sqlService.insertMasivo();
    res.json(response);
  } catch (err) {
    res.status(500).json({ action: "insertMasivo", error: err.message });
  }
};




module.exports = {
    insertMasivo
};