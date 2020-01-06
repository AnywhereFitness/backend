import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../model/User.mjs';
import { registerValidation, loginValidation } from '../validation.mjs';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  // validate data before creating user
  const { error } = registerValidation(req.body);
  if (error) {
    const { details } = error;
    const message = details.map(detail => detail.message).join(',');
    res.status(422).json({ error: message });
  }

  const { firstName, lastName, email, password, role } = req.body;

  try {
    // check if user already exists
    const userExist = await User.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: 'User is already registered' });

    // hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'client'
    });

    const newUser = await user.save();
    res.send({
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Login
router.post('/login', async (req, res) => {
  // validate data before logging in user
  const { error } = loginValidation(req.body);
  if (error) {
    const { details } = error;
    const message = details.map(detail => detail.message).join(',');
    res.status(422).json({ error: message });
  }

  const { email, password } = req.body;

  try {
    // check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User doesn't exist" });

    // check if password is correct
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: 'Invalid Password' });

    //  create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.TOKEN_SECRET
    );
    res.header('authorization', token).send({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

export default router;
