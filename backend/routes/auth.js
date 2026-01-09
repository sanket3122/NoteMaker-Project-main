const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const fetchUser = require('../middleware/fetchUser');

// ✅ Better: env first, fallback for local
const JWT_SECRET = process.env.JWT_SECRET || "SanketBendale";

//ROUTE 1: create a user using: Post "/api/auth/createUser" . Doesnt require auth.
router.post(
  '/createUser',
  body('email', 'Use valid email').isEmail(),
  body('password', 'password contains more than 5 character').isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    // if there are error return bad request.
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //Check weather the user is exist or not..
    try {
      let success = false;

      let user = await User.findOne({ email: req.body.email });
      if (user) {
        success = false;
        return res.status(400).json({ success, error: "Sorry user with this email is already exist" });
      }

      // Adding hash,salt
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      //create new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      // .then(user => res.json(user)).catch(err => console.log(err),
      //  res.json({"Nice": "Nice"})

      const data = {
        user: {
          id: user.id
        }
      };

      const authToken = jwt.sign(data, JWT_SECRET);
      //console.log(jwtData);

      success = true;
      res.send({ success, authToken });
    } catch (error) {
      console.error(error.message);
      // ✅ correct status usage
      return res.status(500).send("Some error occur");
    }
  }
);

//ROUTE 2 : User login: Post "/api/auth/login" .No login require
router.post(
  '/login',
  body('email', 'Use valid email').isEmail(),
  body('password', 'password contains more than 5 character').isLength({ min: 5 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    //user login
    try {
      let success = false;

      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success, error: "Please enter valid credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ success, error: "Please enter valid credentials" });
      }

      const data = {
        user: {
          id: user.id
        }
      };

      const authToken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.send({ success, authToken });
    } catch (error) {
      console.error(error.message);
      // ✅ correct status usage
      return res.status(500).send("Some Internal error occur");
    }
  }
);

//ROUTE 3 : Get credentials of logged user: Post "/api/auth/getuser". login is required
router.post('/getuser', fetchUser, async (req, res) => {
  try {
    // ✅ you were missing declaration
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Some Internal error occur");
  }
});

module.exports = router;
