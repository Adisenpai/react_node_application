const express = require("express");
const router = express.Router();
const db = require("../db");



// API endpoint to change the status
router.post("/change_department_status", (req, res) => {
    const { dept_id } = req.body;
    const updateQuery = `
    UPDATE department
    SET status = CASE WHEN status = 'Active' THEN 'Inactive' ELSE 'Active' END
    WHERE dept_id = ?;
  `;
    db.query(updateQuery, [dept_id], (error, results) => {
        if (error) {
            console.error("Error updating the Status", error);
            return res
                .status(500)
                .json({ message: "Error occcured while updating the status." });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Status was not Changed" });
        }
        return res.status(200).json({ message: "Success" });
    });
});

// API to get department listing
router.get("/departments_list", (req, res) => {
    db.query("SELECT * FROM department", (error, results) => {
        if (error) {
            console.error("Error fetching departments:", error);
            res.status(500).json({ error: "Internal server error" });
        } else {
            res.json(results);
        }
    });
});

// API endpoint to add a new department
router.post("/departments_add", (req, res) => {
    const { name, status } = req.body;
    db.query(
        "SELECT * FROM department WHERE name = ?",
        [name],
        (selectError, selectResults) => {
            if (selectError) {
                console.error("Error checking department existence:", selectError);
                res.status(500).json({ error: "Internal server error" });
            } else {
                if (selectResults.length > 0) {
                    res.status(409).json({ error: "Department already exists" });
                } else {
                    db.query(
                        "INSERT INTO department (name, status) VALUES (?, ?)",
                        [name, status],
                        (insertError, insertResults) => {
                            if (insertError) {
                                console.error("Error adding department:", insertError);
                                res.status(500).json({ error: "Internal server error" });
                            } else {
                                res.sendStatus(200);
                            }
                        }
                    );
                }
            }
        }
    );
});

// API endpoint to get active departments
router.get("/activedepartments", (req, res) => {
    db.query(
        "SELECT dept_id, name FROM department WHERE status = 'Active'",
        (error, results) => {
            if (error) {
                console.error("Error fetching departments:", error);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(results);
            }
        }
    );
});

// API endpoint to change the status
router.post("/change_department_status", (req, res) => {
    const { dept_id } = req.body;
    const updateQuery = `
    UPDATE department
    SET status = CASE WHEN status = 'Active' THEN 'Inactive' ELSE 'Active' END
    WHERE dept_id = ?;
  `;
    db.query(updateQuery, [dept_id], (error, results) => {
        if (error) {
            console.error("Error updating the Status", error);
            return res
                .status(500)
                .json({ message: "Error occcured while updating the status." });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Status was not Changed" });
        }
        return res.status(200).json({ message: "Success" });
    });
});

module.exports = router;