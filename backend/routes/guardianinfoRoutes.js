const express = require("express");
const router = express.Router();
const db = require("../db");

// guardianinfo API
router.post("/guardianinfo", (req, res) => {
  const { id, relation, name, phoneno, address } = req.body;
  const sql =
    "INSERT INTO guardian_info set id = ?, relation = ?, name = ?, phoneno = ?, address = ?";
  const values = [id, relation, name, phoneno, address];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving Guardian information", err);
      return res
        .status(500)
        .json({ message: "Error saving Guardian information" });
    }
    return res
      .status(200)
      .json({ message: "Guardian information saved succesfully" });
  });
});

// API endpoint to get specific users guardian
router.get("/user_guardian_list", (req, res) => {
  const { id } = req.query;
  db.query(
    "SELECT `id`, `gi_id`, `relation`, `name`, `phoneno`, `address` FROM `guardian_info` WHERE id = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error fetching education data of user:", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.status(200).json(results);
      }
    }
  );
});

// API endpoint to delete user specific guardian entry
router.post("/deleteguardianentry", (req, res) => {
  const { gi_id } = req.body;
  db.query(
    "DELETE FROM `guardian_info` WHERE `gi_id` = ?",
    [gi_id],
    (error, result) => {
      if (error) {
        console.error("Error deleting education entry:", error);
        return res
          .status(500)
          .json({ message: "Error occurred while deleting entry." });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Education entry not found." });
      }
      return res.status(200).json({ message: "Success" });
    }
  );
});


module.exports = router;
