// server.js (Node.js/Express Backend - FINAL)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt'); // For secure password hashing

// --- MongoDB Atlas Connection URI ---
// IMPORTANT: The database name is set to 'video_tutorial'.
// PLEASE REPLACE 'Iamagoodboy18' WITH YOUR ACTUAL MongoDB Atlas password.
const ATLAS_URI = "mongodb+srv://kingchoco:Iamagoodboy18@cluster0.mpqc8xc.mongodb.net/video_tutorial?retryWrites=true&w=majority&appName=Cluster0";

// --- Require Mongoose Models (Assume these files exist in a ./models directory) ---
const Course = require('./models/Course'); 
const User = require('./models/User'); // Used for both Student and Tutor
const Enrollment = require('./models/Enrollment'); 
const Comment = require('./models/Comment'); 

const app = express();
const port = 5000; 

// --- 1. Multer Setup for File Uploads ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Use a safe, unique filename based on the current timestamp + original extension
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    }
});

const upload = multer({ storage: storage });

// 2. CORS (Allows your http://localhost:3000 frontend to connect)
const corsOptions = {
    // 🚨 CRITICAL FIX: Add the actual origin your browser is using (127.0.0.1:5500)
    // We make the origin an array to allow both common frontend ports
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// --- 2. Middlewares ---

// a. JSON Body Parser
app.use(express.json()); 

// b. CORS (Allows your http://localhost:3000 frontend to connect)
const corsOptions = {
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// c. Serve Static Files (Uploads)
app.use('/uploads', express.static(UPLOADS_DIR));


// --- 3. API Routes ---

// --- User/Auth Routes ---

// 1. POST /api/users/signup - Register a new user (Student or Tutor)
app.post('/api/users/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const user = new User({ name, email, password, role });
        // Mongoose pre-save hook in User.js handles password hashing
        await user.save(); 

        // Return the user object without the password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ 
            message: `${role} registered successfully.`,
            user: userResponse
        });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error (email already exists)
            return res.status(409).json({ message: 'Email already in use.' });
        }
        console.error("Signup error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// 2. POST /api/users/signin - Sign in a user (Student or Tutor)
app.post('/api/users/signin', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await User.findOne({ email, role });
        if (!user) {
            return res.status(401).json({ message: `No ${role} found with that email.` });
        }

        // Use the method defined in User.js to compare hashed password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Return the user object without the password
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({ 
            message: `${role} signed in successfully.`,
            user: userResponse
        });

    } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: 'Server error during sign-in.' });
    }
});


// --- Course Routes ---

// 3. POST /api/courses - Create a new course (Tutor only)
// Uses 'upload.single' for optional file upload
app.post('/api/courses', upload.single('localVideoFile'), async (req, res) => {
    try {
        const { tutorId, title, description, chapters: chaptersJson, assetType, videoUrl } = req.body;
        
        // Parse chapters back into an array
        const chapters = chaptersJson ? JSON.parse(chaptersJson) : [];

        let asset;
        if (assetType === 'local' && req.file) {
            asset = { type: 'local', url: req.file.filename };
        } else if (assetType === 'youtube' && videoUrl) {
            asset = { type: 'youtube', url: `https://www.youtube.com/embed/${videoUrl}` };
        } else {
            return res.status(400).json({ message: 'Missing course video asset or file.' });
        }

        const newCourse = new Course({
            tutorId,
            title,
            description,
            asset,
            chapters,
        });

        const savedCourse = await newCourse.save();
        res.status(201).json({ message: 'Course created successfully.', course: savedCourse });

    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ message: 'Server error while creating course.' });
    }
});

// 4. PUT /api/courses/:courseId - Update a course (Tutor only)
app.put('/api/courses/:courseId', upload.single('localVideoFile'), async (req, res) => {
    try {
        const { title, description, chapters: chaptersJson, assetType, videoUrl } = req.body;
        const courseId = req.params.courseId;
        const chapters = chaptersJson ? JSON.parse(chaptersJson) : [];
        const updateFields = { title, description, chapters };

        // Handle asset update logic
        if (assetType === 'local' && req.file) {
            // New local file uploaded
            const oldCourse = await Course.findById(courseId);
            if (oldCourse && oldCourse.asset.type === 'local') {
                // Clean up old file
                const oldFilePath = path.join(UPLOADS_DIR, oldCourse.asset.url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            updateFields.asset = { type: 'local', url: req.file.filename };
        } else if (assetType === 'youtube' && videoUrl) {
            // YouTube URL provided
            updateFields.asset = { type: 'youtube', url: `https://www.youtube.com/embed/${videoUrl}` };
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.json({ message: 'Course updated successfully.', course: updatedCourse });

    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: 'Server error while updating course.' });
    }
});


// 5. DELETE /api/courses/:courseId - Delete a course (Tutor only)
app.delete('/api/courses/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 1. Delete the course document
        await Course.findByIdAndDelete(courseId);

        // 2. Clean up local file asset if it exists
        if (course.asset.type === 'local') {
            const filePath = path.join(UPLOADS_DIR, course.asset.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 3. Remove all related enrollments
        await Enrollment.deleteMany({ courseId: courseId });

        // 4. Remove all related comments
        await Comment.deleteMany({ courseId: courseId });


        res.json({ message: 'Course and all related data deleted successfully.' });

    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: 'Server error while deleting course.' });
    }
});


// 6. GET /api/courses - Fetch all courses (Course Catalog)
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find({})
            .populate('tutorId', 'name') // Only fetch the tutor's name
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: 'Error fetching courses.' });
    }
});

// 7. GET /api/courses/tutor/:tutorId - Fetch courses by Tutor ID (Tutor Dashboard)
app.get('/api/courses/tutor/:tutorId', async (req, res) => {
    try {
        const courses = await Course.find({ tutorId: req.params.tutorId })
            .sort({ createdAt: -1 }); 
        res.json(courses);
    } catch (error) {
        console.error("Error fetching tutor courses:", error);
        res.status(500).json({ message: 'Error fetching tutor courses.' });
    }
});

// 8. GET /api/courses/:courseId - Fetch a single course
app.get('/api/courses/:courseId', async (req, res) => {
    try {
        // Find the course and populate the tutor's name
        const course = await Course.findById(req.params.courseId)
            .populate('tutorId', 'name'); 

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Count enrollments (manual calculation)
        const enrollmentCount = await Enrollment.countDocuments({ courseId: req.params.courseId });
        
        // Return the course object with the enrollment count added
        const courseResponse = course.toObject();
        courseResponse.enrollmentCount = enrollmentCount;

        res.json(courseResponse);

    } catch (error) {
        console.error("Error fetching single course:", error);
        res.status(500).json({ message: 'Error fetching course details.' });
    }
});


// --- Enrollment Routes ---

// 9. POST /api/enrollments - Enroll a student in a course
app.post('/api/enrollments', async (req, res) => {
    const { studentId, courseId } = req.body;

    try {
        // Check for existing enrollment (prevent duplicates)
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(409).json({ message: 'You are already enrolled in this course.' });
        }

        const newEnrollment = new Enrollment({ studentId, courseId });
        await newEnrollment.save();
        
        const course = await Course.findById(courseId, 'title');

        res.status(201).json({ 
            message: `Successfully enrolled in ${course ? course.title : 'the course'}.`,
            enrollment: newEnrollment,
        });

    } catch (error) {
        // Handle Mongoose unique index error if it somehow bypasses the manual check
        if (error.code === 11000) {
             return res.status(409).json({ message: 'You are already enrolled in this course.' });
        }
        console.error("Error during enrollment:", error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
});

// 10. GET /api/enrollments/:studentId - Fetch enrolled courses for a student (My Courses View)
app.get('/api/enrollments/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            // Populate course details and the course's tutor details
            .populate({
                path: 'courseId',
                populate: {
                    path: 'tutorId',
                    select: 'name' // Only need the name of the tutor
                }
            });

        res.json(enrollments);
    } catch (error) {
        console.error("Error fetching student enrollments:", error);
        res.status(500).json({ message: 'Error fetching enrolled courses.' });
    }
});

// 11. PATCH /api/enrollments/:enrollmentId/progress - Update a student's progress
app.patch('/api/enrollments/:enrollmentId/progress', async (req, res) => {
    try {
        const { progressPercentage } = req.body;

        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
            req.params.enrollmentId,
            { progressPercentage },
            { new: true, runValidators: true }
        );

        if (!updatedEnrollment) {
            return res.status(404).json({ message: 'Enrollment not found.' });
        }

        res.json({ message: 'Progress updated successfully.', enrollment: updatedEnrollment });

    } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ message: 'Server error while updating progress.' });
    }
});


// --- Comment/Review Routes ---

// 12. POST /api/comments - Create a new comment/review (Student only)
app.post('/api/comments', async (req, res) => {
    const { courseId, studentId, text, rating } = req.body;

    try {
        // 1. Check if the student is enrolled in the course
        const isEnrolled = await Enrollment.findOne({ studentId, courseId });
        if (!isEnrolled) {
            return res.status(403).json({ message: 'You must be enrolled to leave a review.' });
        }

        // 2. Prevent a student from leaving multiple reviews
        const existingComment = await Comment.findOne({ courseId, studentId });
        if (existingComment) {
             return res.status(409).json({ message: 'You have already reviewed this course.' });
        }

        // 3. Create the new comment
        const newComment = new Comment({ courseId, studentId, text, rating });
        await newComment.save();
        
        // 4. Recalculate average rating on the Course model
        const ratings = await Comment.find({ courseId }, 'rating');
        const totalRating = ratings.reduce((sum, c) => sum + c.rating, 0);
        const totalReviews = ratings.length;
        // Calculate average and round to one decimal place
        const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0; 
        
        // 5. Update the Course document
        await Course.findByIdAndUpdate(courseId, { 
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: totalReviews
        });

        res.status(201).json({ message: 'Review submitted successfully.', comment: newComment });

    } catch (error) {
        console.error("Error submitting comment:", error);
        res.status(500).json({ message: 'Server error while submitting comment.' });
    }
});

// 13. GET /api/comments/:courseId - Fetch all comments for a course
app.get('/api/comments/:courseId', async (req, res) => {
    try {
        const comments = await Comment.find({ courseId: req.params.courseId })
            // Populate studentId to get the reviewer's name
            .populate('studentId', 'name') 
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: 'Error fetching comments for course.' });
    }
});

// 14. DELETE /api/comments/:commentId - Delete a comment (Used by Tutor)
app.delete('/api/comments/:commentId', async (req, res) => {
    try {
        const comment = await Comment.findByIdAndDelete(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        
        // Recalculate average rating on the Course model after deletion
        const ratings = await Comment.find({ courseId: comment.courseId }, 'rating');
        const totalRating = ratings.reduce((sum, c) => sum + c.rating, 0);
        const totalReviews = ratings.length;
        const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;
        
        // Update the Course document
        await Course.findByIdAndUpdate(comment.courseId, { 
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: totalReviews
        });

        res.json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: 'Server error while deleting comment.' });
    }
});


// --- 4. MongoDB Atlas Connection and Server Start ---

mongoose.connect(ATLAS_URI)
    .then(() => {
        console.log('MongoDB Atlas connected successfully...');
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });