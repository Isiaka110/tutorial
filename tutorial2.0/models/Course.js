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



// Define the Chapter Sub-Schema

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

    // Reference to the User model (Tutor)

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

    // --- Rating fields (calculated) ---

    averageRating: {

        type: Number,

        default: 0,

        min: 0,

        max: 5,

    },

    totalReviews: {

        type: Number,

        default: 0,

    },

    // --- Enrollment Count field (calculated) ---

    // Note: Enrollment count is often calculated live or stored on the Enrollment model.

    // However, including it here simplifies API calls for course lists.

    enrollmentCount: {

        type: Number,

        default: 0,

    },

    createdAt: {

        type: Date,

        default: Date.now,

    },

});



const Course = mongoose.model('Course', courseSchema);



module.exports = Course;