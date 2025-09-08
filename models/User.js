import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    email:  { type: String, required: true, unique: true, lowercase: true },
    password:{ type: String, required: true, minlength: 6 },
    phone:  { type: String, required: true },
    company:{ type: String, required: true },
    designation:{ type: String, required: true }
  },
  { timestamps: true }
);

// Hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = function (plainPwd) {
  return bcrypt.compare(plainPwd, this.password);
};

export default mongoose.model('User', userSchema);
