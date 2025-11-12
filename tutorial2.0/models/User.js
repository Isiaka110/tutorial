// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    // Differentiate between Tutor and Student roles
    role: { type: String, required: true, enum: ['tutor', 'student'] }, 
    createdAt: { type: Date, default: Date.now }
});

// --- CRITICAL: Password Hashing Middleware ---
// This runs BEFORE saving the user to the database
UserSchema.pre('save', async function(next) {
    // Only hash if the password has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// --- Method to compare passwords on sign-in ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);