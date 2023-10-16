const express = require("express");
const router = express.Router();
const db = require("../db");

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// education information API
router.post("/educationalinfo", (req, res) => {
  const { id, collage_name, education, start_date, end_date } = req.body;

  const sql =
    "INSERT INTO educational_info set id = ?, clg_name = ?, `education` = ?, start_date = ?, end_date = ?";
  const values = [id, collage_name, education, start_date, end_date];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving Eucational information", err);
      return res
        .status(500)
        .json({ message: "Error saving Educational information" });
    }
    return res
      .status(200)
      .json({ message: "Educational information saved succesfully" });
  });
});

// API endpoint to get specific users education
router.get("/user_education_list", (req, res) => {
  const { id } = req.query;
  db.query(
    "SELECT `id`, `ei_id`, `clg_name`, `education`, `start_date`, `end_date` FROM `educational_info` WHERE id = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Error fetching education data of user:", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        const formattedEducationList = results.map((educationItem) => {
          return {
            ei_id: educationItem.ei_id,
            id: educationItem.id,
            clg_name: educationItem.clg_name,
            education: educationItem.education,
            start_date: formatDate(educationItem.start_date), // Format start_date
            end_date: formatDate(educationItem.end_date), // Format end_date
          };
        });
        res.status(200).json(formattedEducationList);
      }
    }
  );
});

// API endpoint to delete user specific educational entry
router.post("/deleteeducationentry", (req, res) => {
  const { ei_id } = req.body;
  db.query(
    "DELETE FROM `educational_info` WHERE `ei_id` = ?",
    [ei_id],
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
