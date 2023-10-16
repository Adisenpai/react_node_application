const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create an absolute path for the destination folder
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({ storage });

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// API endpoint to get all posts
router.get("/get_all_blogs", (req, res) => {
  db.query(
    "SELECT `p_id`, `p_title`, `p_desc`, `p_img`, `p_date`, `p_status`, `u_id`, l.fname, l.lname, b.blog_cat_name FROM posts p JOIN login l ON l.id = p.u_id JOIN blogcategory b ON b.blog_cat_id=p_category WHERE p_status = 'Active'",
    (error, results) => {
      if (error) {
        console.error("Error fetching all the posts", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        const sendpostdata = results.map((postdata) => {
          return {
            p_id: postdata.p_id,
            p_title: postdata.p_title,
            p_desc: postdata.p_desc,
            p_img: postdata.p_img,
            p_date: formatDate(postdata.p_date),
            blog_cat_name: postdata.blog_cat_name,
            p_status: postdata.p_status,
            u_id: postdata.u_id,
            fname: postdata.fname,
            lname: postdata.lname,
          };
        });
        res.status(200).json(sendpostdata);
      }
    }
  );
});

// API endpoint get a specific post
router.get("/get_blog/:p_id", (req, res) => {
  const p_id = req.params.p_id;

  db.query(
    "SELECT `p_id`, `p_title`, `p_desc`, `p_img`, `p_date`, `p_status`, `u_id`, l.fname, l.lname, b.blog_cat_name FROM posts p JOIN login l ON l.id = p.u_id JOIN blogcategory b ON b.blog_cat_id=p_category WHERE p_id = ?",
    [p_id],
    (error, results) => {
      if (error) {
        console.error("Error fetching the post", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (results.length === 0) {
          res.status(404).json({ error: "Blog post not found" });
        } else {
          const sendpostdata = results.map((postdata) => {
            return {
              p_id: postdata.p_id,
              p_title: postdata.p_title,
              p_desc: postdata.p_desc,
              p_img: postdata.p_img,
              p_date: formatDate(postdata.p_date),
              blog_cat_name: postdata.blog_cat_name,
              p_status: postdata.p_status,
              u_id: postdata.u_id,
              fname: postdata.fname,
              lname: postdata.lname,
            };
          });
          res.status(200).json(sendpostdata[0]);
        }
      }
    }
  );
});

// delete the specific post
router.post("/delete_blog", (req, res) => {
  const { p_id } = req.body;
  db.query("DELETE FROM `posts` WHERE `p_id` = ?", [p_id], (error, result) => {
    if (error) {
      console.error("Error deleting Post", error);
      return res
        .status(500)
        .json({ message: "Error occurred while deleting Post" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Post not found." });
    }
    return res.status(200).json({ message: "Success" });
  });
});

// upload picture API
router.post('/uploads', upload.single('file'), function (req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    return res.status(200).json(file.filename);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});


router.use('/retrive', express.static(path.join(__dirname, '../uploads')));

// Update a specific post
router.put("/update_specific_blog/:postId", (req, res) => {
  const postId = req.params.postId; // Corrected the parameter name to match the route
  const query =
    "UPDATE `posts` SET p_title = ?, p_desc = ?, p_img = ?, p_category = ?, p_status = ? WHERE u_id = ? AND p_id = ?";
  const values = [
    req.body.title,
    req.body.value,
    req.body.img,
    req.body.category,
    req.body.newStatus,
    req.body.id,
  ];
  
  db.query(query, [...values, postId], (err, data) => {
    if (err) {
      console.error("Error updating post:", err);
      return res.status(500).json({ error: "An error occurred while updating the post." });
    }

    if (data.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found or not authorized to update." });
    }

    return res.json("Post has been updated successfully");
  });
});

// API endpoint to add a blog
router.post("/add_blog", (req, res) => {
  const query =
    "INSERT INTO `posts`(`p_title`, `p_desc`, `p_img`, `p_date`, `p_category`, `p_status`, `u_id`) VALUES (?, ?, ?, ?, ?, ?, ?)";
  const values = [
    req.body.title,
    req.body.value,
    req.body.img,
    req.body.date,
    req.body.category,
    req.body.newStatus,
    req.body.id,
  ];
  db.query(query, values, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json("Post has been created");
  });
});

router.post("/blogcategory_add", (req, res) => {
  const { name, status } = req.body;
  db.query(
    "SELECT * FROM blogcategory WHERE blog_cat_name = ?",
    [name],
    (selectError, selectResults) => {
      if (selectError) {
        console.error("Error checking category existence:", selectError);
        res.status(500).json({ error: "Internal server error" });
      } else {
        if (selectResults.length > 0) {
          res.status(409).json({ error: "Category already exists" });
        } else {
          db.query(
            "INSERT INTO blogcategory (blog_cat_name, category_status) VALUES (?, ?)",
            [name, status],
            (insertError, insertResults) => {
              if (insertError) {
                console.error("Error adding Category:", insertError);
                res
                  .status(500)
                  .json({ error: "Internal server error" });
              } else {
                res
                  .status(200)
                  .json({message:"Success"});
              }
            }
          );
        }
      }
    }
  );
});

router.get("/activeblogcategory", (req, res) => {
  db.query(
    "SELECT  blog_cat_id, blog_cat_name FROM blogcategory WHERE category_status = 'Active'",
    (error, results) => {
      if (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(results);
      }
    }
  );
});


module.exports = router;