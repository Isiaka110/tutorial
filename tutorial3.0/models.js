// models.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- 1. User Schema ---
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Student', 'Tutor'], 
        required: true 
    }
});

// --- 2. Course Schema ---
const CourseSchema = new Schema({
    tutor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    video_path: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

// --- 3. Comment Schema (NEW) ---
const CommentSchema = new Schema({
    // Reference to the course ID being commented on
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    // Reference to the user who posted the comment
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Storing the user's name directly for display simplicity
    userName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});


const User = mongoose.model('User', UserSchema);
const Course = mongoose.model('Course', CourseSchema);
const Comment = mongoose.model('Comment', CommentSchema); // <<< NEW: Export the Comment model

module.exports = { User, Course, Comment };