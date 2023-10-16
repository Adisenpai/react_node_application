const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require("../db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// API endpoint to signup
router.post("/signup", (req, res) => {
  const sql =
    "INSERT INTO `login` (`fname`, `lname`, `email`, `phoneno`, `password`) VALUES (?)";
  const values = [
    req.body.fname,
    req.body.lname,
    req.body.email,
    req.body.phoneno,
    req.body.password,
  ];
  db.query(sql, [values], (err, data) => {
    if (err) {
      return res.json("Error");
    }
    return res.json(data);
  });
});

// API endpoint to login
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const checkEmailSql = "SELECT * FROM `login` WHERE `email` = ?";
  db.query(checkEmailSql, [email], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (result.length === 0) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    const user = result[0];

    // Compare the entered password with the stored password
    if (user.password === password) {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          phoneno: user.phoneno,
          dob: user.dob,
          address: user.address,
        },
        "your_secret_key",
        { expiresIn: "1h" }
      );
      return res.status(200).json({ message: "Success", token });
    } else {
      return res.status(401).json({ message: "Failed" });
    }
  });
});

// API endpoint to check mail exist or not
router.post("/check-email", (req, res) => {
  const sql = "SELECT COUNT(*) AS count FROM `login` WHERE `email` = ?";
  db.query(sql, [req.body.email], (err, data) => {
    if (err) {
      return res.json("Error");
    }
    const emailExists = data[0].count > 0;
    return res.json({ emailExists });
  });
});

// Seding OTP mail API
router.post("/forgot_email", (req, res) => {
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "3ba39efd2d49ae",
      pass: "e3f06a5e2d1626",
    },
  });
  const token = crypto.randomBytes(20).toString("hex");

  const otp = Math.floor(100000 + Math.random() * 900000);

  const { recipient_email } = req.body;
  const storeOtpQuery =
    "UPDATE login SET token = ?, otp_no = ? WHERE email = ?";
  db.query(storeOtpQuery, [token, otp, recipient_email], (error) => {
    if (error) {
      console.error("Error executing MySQL query:", error);
      return res.json({ message: "An error occurred" });
    }

    const mailOptions = {
      from: "Service@help.com",
      to: recipient_email,
      subject: "PASSWORD RESET",
      html: `<html>
                   <body>
                     <h2>Password Recovery</h2>
                     <p>It Seems you forgot your password. But dont you worry! We got ypur back. Use this OTP to reset your password. OTP is valid for 1 minute</p>
                     <h3>${otp}</h3>
                     <p>To reset your password, click on the following link: http://localhost:3000/reset-password/:${token}</p>
                     <ol>
                     li>Password must contain at least one lowercase letter</li>
                    <li>Password must contain at least one Uppercase letter</li>
                    <li>Password must contain at least one digit </li>
                    <li>Paassword minimum length must be of 6 Characters</li>
                     </ol>
                   </body>
                 </html>`,
    };

    transport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.json("Error in sending the mail");
      } else {
        console.log("Email sent: " + info.response);
        return res.json("Email sent successfully");
      }
    });
  });
});

// Reset Password API
router.post("/reset-password", (req, res) => {
  const token = req.body.token;
  const otp = req.body.otp;
  const newPassword = req.body.newPassword;

  // Check if the token and OTP match and the OTP has not expired
  const checkTokenQuery = "SELECT email, otp_no FROM login WHERE token = ?";
  db.query(checkTokenQuery, [token], (error, results) => {
    if (error) {
      console.error("Error executing MySQL query:", error);
      return res.status(500).json({ message: "An error occurred" });
    }

    if (results.length === 0) {
      console.log(token);
      return res.status(400).json({ message: "Invalid token" });
    }

    const { email, otp_no: storedOtp } = results[0];

    // Check if the OTP matches
    // if (otp !== storedOtp) {
    //   console.log(storedOtp)
    //   return res.status(400).json({ message: "Invalid OTP" });
    // }

    // Update the password in the database
    const updatePasswordQuery =
      "UPDATE login SET password = ?, token = NULL, otp_no = NULL, token = NULL WHERE email = ?";
    db.query(updatePasswordQuery, [newPassword, email], (error) => {
      if (error) {
        console.error("Error executing MySQL query:", error);
        return res.status(500).json({ message: "An error occurred" });
      }
      return res.json({ message: "Password reset successfully" });
    });
  });
});

// Personal information API
router.post("/personalinfo/:id", (req, res) => {
  const id = req.params.id;
  const { dob, middlename, address, departmentId, designationId } = req.body;

  // Assuming you have a table named 'personal_info' in your database
  const sql =
    "UPDATE login set dob = ?, middle_name = ?,  address =?, department_id =?, designation_id=? WHERE id = ?";
  const values = [dob, middlename, address, departmentId, designationId, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving personal information:", err);
      return res
        .status(500)
        .json({ message: "Error saving personal information" });
    }
    return res
      .status(200)
      .json({ message: "Personal information saved successfully" });
  });
});

router.get("/getpersonalinfo/:id", (req, res) => {
  const id = req.params.id;
  const query =
    "SELECT designation_id, middle_name, dob, address, department_id FROM login WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error fetching information", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
