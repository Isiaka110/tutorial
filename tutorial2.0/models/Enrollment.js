const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    // Reference to the Student who is enrolled
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming your student/tutor model is named 'User'
        required: true,
    },
    // Reference to the Course the student is enrolled in
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course', // Assuming your course model is named 'Course'
        required: true,
    },
    // Progress tracking (used by the frontend)
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    // Timestamp of enrollment
    enrolledAt: {
        type: Date,
        default: Date.now,
    },
}, {
    // Prevents duplicate enrollments for the same student/course pair
    // Note: The index definition must be applied to the schema definition or directly to the model.
    // Defining it in the schema options is a common Mongoose practice.
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add a compound unique index to prevent duplicate enrollment documents
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });


const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;