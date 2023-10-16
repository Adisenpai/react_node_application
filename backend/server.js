const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const app = express();


const userRoutes = require("./routes/userRoutes");

const blogRoutes = require("./routes/blogRoutes");

const educationform = require("./routes/educationformRoute");

const guardianform = require("./routes/guardianinfoRoutes");

const department = require("./routes/departmentRoutes");

const designation = require("./routes/designationRoutes");


app.use(cors());
app.use(express.json());

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Databse connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "signin",
});

app.use("/users", userRoutes);

app.use("/blogs", blogRoutes);

app.use("/education", educationform);

app.use("/guardian", guardianform);

app.use("/department", department);

app.use("/designation", designation);

// Userlisting API
app.get("/users", (req, res) => {
  const { name, lname, email, department, page = 1, limit = 10 } = req.query;

  // Calculate the offset based on the page and limit
  const offset = (page - 1) * limit;

  // Construct the SQL query based on filters and pagination
  let query =
    "SELECT l.id, l.fname, l.lname, l.email, l.phoneno, d.name, dsg.designation_name FROM login l inner join department d on l.department_id = d.dept_id inner join designation dsg on l.designation_id = dsg.designation_id";
  let countQuery = "SELECT COUNT(*) AS total FROM login";
  const params = [];

  if (name) {
    query += " WHERE fname LIKE ?";
    countQuery += " WHERE fname LIKE ?";
    params.push(`%${name}%`);
  }

  if (lname) {
    query += name ? " AND" : " WHERE";
    query += " lname LIKE ?";
    countQuery += name ? " AND" : " WHERE";
    countQuery += " lname LIKE ?";
    params.push(`%${lname}%`);
  }

  if (email) {
    query += (name || lname) ? " AND" : " WHERE";
    query += " email LIKE ?";
    countQuery += (name || lname) ? " AND" : " WHERE";
    countQuery += " email LIKE ?";
    params.push(`%${email}%`);
  }

  if (department) {
    query += (name || lname || email) ? " AND" : " WHERE";
    query += " department_id LIKE ?";
    countQuery += (name || lname || email) ? " AND" : " WHERE";
    countQuery += " department_id LIKE ?";
    params.push(`%${department}%`);
  }

  // Append the pagination and limit to the query
  query += " LIMIT ?, ?";
  params.push(offset, parseInt(limit, 10));

  // Execute the query to fetch paginated user data
  db.query(query, params, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Execute the count query to fetch the total count of users
      db.query(countQuery, params.slice(0, -2), (countError, countResult) => {
        if (countError) {
          console.error(countError);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          const totalCount = countResult[0].total;
          const totalPages = Math.ceil(totalCount / limit);
          const response = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages,
            totalCount,
            data: results,
          };
          res.status(200).json(response);
        }
      });
    }
  });
});



// changepassword API
app.post("/changepassword", (req, res) => {
  const { id, oldpassword, newpassword } = req.body;

  // Check if the user exists in the database
  const getUserQuery = "SELECT id, password FROM login WHERE id = ?";
  db.query(getUserQuery, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Database error." });
    }
    const user = results[0];

    // Check if the old password matches
    if (user.password !== oldpassword) {
      return res.status(400).json({ message: "Old password does not match." });
    }

    // Update the password
    const updatePasswordQuery = "UPDATE login SET password = ? WHERE id = ?";
    db.query(updatePasswordQuery, [newpassword, id], (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Database error." });
      }

      // Return a success response
      res.status(200).json({ message: "Password updated successfully." });
    });
  });
});

// sociallink API
app.post("/sociallink", (req, res) => {
  const { id, platform, link } = req.body;
  const sql = "INSERT INTO socialmedia (platform, link, id) VALUES (?, ?, ?)";
  const values = [platform, link, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving information", err);
      return res.status(500).json({ message: "Error saving information" });
    }
    return res.status(200).json({ message: "Information saved successfully" });
  });
});

// API endpoint to get specific users guardian
app.get("/user_socialmedia_list", (req, res) => {
  const { id } = req.query;
  db.query(
    "SELECT `id`, `sm_id`, `platform`, `link` FROM `socialmedia` WHERE id = ?",
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

// API endpoint to delete user specific social link entry
app.post("/deletesociallinkentry", (req, res) => {
  const { sm_id } = req.body;
  db.query(
    "DELETE FROM `socialmedia` WHERE `sm_id` = ?",
    [sm_id],
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


app.get("/blogslisting", (req, res) => {
  const { name, category, page = 1, limit = 10 } = req.query;

  // Calculate the offset based on the page and limit
  const offset = (page - 1) * limit;

  // Construct the SQL query based on filters and pagination
  let query =
    "SELECT `p_id`, `l`.`fname`, `l`.`lname`, `p_title`, `p_desc`, `p_date`,`b`.`blog_cat_name`, `u_id` FROM `posts` JOIN login l ON l.id = u_id JOIN blogcategory b ON b.blog_cat_id = p_category";
  let countQuery = "SELECT COUNT(*) AS total FROM posts";
  const params = [];

  if (name) {
    query += " WHERE l.fname LIKE ?";
    countQuery += " JOIN login l ON l.id = u_id WHERE l. fname LIKE ?";
    params.push(`%${name}%`);
  }

  if (category) {
    query += name ? " AND" : " WHERE";
    query += " p_category LIKE ?";
    countQuery += name ? " AND" : " WHERE";
    countQuery += " p_category LIKE ?";
    params.push(`%${category}%`);
  }

  // Append the pagination and limit to the query
  query += " LIMIT ?, ?";
  params.push(offset, parseInt(limit, 10));

  // Execute the query to fetch paginated user data
  db.query(query, params, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Execute the count query to fetch the total count of users
      db.query(countQuery, params.slice(0, -2), (countError, countResult) => {
        if (countError) {
          console.error(countError);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          const totalCount = countResult[0].total;
          const totalPages = Math.ceil(totalCount / limit);
          const response = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages,
            totalCount,
            data: results,
          };
          res.status(200).json(response);
        }
      });
    }
  });
});

// API to get department listing
app.get("/category_list", (req, res) => {
  db.query("SELECT * FROM blogcategory", (error, results) => {
    if (error) {
      console.error("Error fetching blogcategory:", error);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(results);
    }
  });
});


app.post("/change_category_status", (req, res) => {
  const { blog_cat_id } = req.body;
  const updateQuery = `
  UPDATE blogcategory
  SET category_status = CASE WHEN category_status = 'Active' THEN 'Inactive' ELSE 'Active' END
  WHERE blog_cat_id = ?;
`;
  db.query(updateQuery, [blog_cat_id], (error, results) => {
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


app.get("/user_personalinfo_list", (req, res) => {
  const { id } = req.query;
  db.query(
    "SELECT l.id, l.fname, l.middle_name, l.lname, l.address, l.phoneno, l.dob, d.name, dsg.designation_name FROM login l inner join department d on l.department_id = d.dept_id inner join designation dsg on l.designation_id = dsg.designation_id WHERE id = ?",
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


app.listen(8081, () => {
  console.log("listening");
});
