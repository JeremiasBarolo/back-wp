const { sqlService } = require('../classes/sqlService');



const insertMasivo = async (req, res) => {
  try {
    const response = await sqlService.insertMasivo();
    res.json(response);
  } catch (err) {
    res.status(500).json({ action: "insertMasivo", error: err.message });
  }
};

const TESTCONNECTION = async (req, res) => {
  try {
    const response = await sqlService.testConnection();
    res.json(response);
  } catch (err) {
    res.status(500).json({ action: "insertMasivo", error: err.message });
  }
};




module.exports = {
    insertMasivo,
    TESTCONNECTION
};