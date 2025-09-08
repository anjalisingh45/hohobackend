import User from '../models/User.js';
import jwt from 'jsonwebtoken';


const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, company, designation } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, phone, company, designation });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { 
        id: user._id,
        name,
        email,
        phone,
        company,
        designation
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email,
        phone: user.phone,
        company: user.company,
        designation: user.designation
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
