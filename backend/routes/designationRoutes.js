const express = require("express");
const router = express.Router();
const db = require("../db");

// API endpoint to add a new designation
router.post("/designations_add", (req, res) => {
    const { departmentId, designation, status } = req.body;

    // Check if the designation already exists for the specified department
    db.query(
        "SELECT * FROM designation WHERE dept_id = ? AND designation_name = ?",
        [departmentId, designation],
        (selectError, selectResults) => {
            if (selectError) {
                console.error("Error checking designation existence:", selectError);
                res.status(500).json({ error: "Internal server error" });
            } else {
                if (selectResults.length > 0) {
                    // Designation already exists for the department
                    res
                        .status(409)
                        .json({ error: "Designation already exists for the department" });
                } else {
                    // Designation does not exist, proceed with the INSERT operation
                    db.query(
                        "INSERT INTO designation (dept_id, designation_name, status) VALUES (?, ?, ?)",
                        [departmentId, designation, status],
                        (insertError, insertResults) => {
                            if (insertError) {
                                console.error("Error adding designation:", insertError);
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

// API endpoint to get all designations
router.get("/designations_list", (req, res) => {
    db.query(
        "SELECT d.name, dsg.designation_id, dsg.designation_name, dsg.status FROM designation dsg inner join department d on dsg.dept_id = d.dept_id",
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

// API endpoint to get active departments
router.get("/activedesignations", (req, res) => {
    const { departmentId } = req.query;
    query =
        "SELECT designation_id, designation_name FROM designation WHERE status = ? AND dept_id = ?";
    db.query(query, ["Active", departmentId], (error, results) => {
        if (error) {
            console.error("Error fetching designations:", error);
            console.log(departmentId);
            res.status(500).json({ error: "Internal server error" });
        } else {
            res.json(results);
        }
    });
});

// API endpoint to change the status
router.post("/change_designation_status", (req, res) => {
    const { designation_id } = req.body;
    const updateQuery = `
    UPDATE designation
    SET status = CASE WHEN status = 'Active' THEN 'Inactive' ELSE 'Active' END
    WHERE designation_id = ?;
  `;
    db.query(updateQuery, [designation_id], (error, results) => {
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