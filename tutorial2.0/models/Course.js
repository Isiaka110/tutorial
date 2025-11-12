// models/Course.js

const mongoose = require('mongoose');

// Define the Asset Sub-Schema
const assetSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['local', 'youtube'], // Restrict to valid types
        required: true,
    },
    url: {
        type: String, // Filename for local, full URL for YouTube
        required: true,
    },
}, { _id: false });

const chapterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    }
}, { _id: true }); // Allows chapters to have their own IDs

const courseSchema = new mongoose.Schema({
    // CRITICAL: Reference to the User model (assuming User model is named 'User')
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', 
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    asset: {
        type: assetSchema, // Use the sub-schema for the main course asset
        required: true,
    },
    chapters: [chapterSchema], // Array of chapters
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;