// server.js (Node.js/Express Backend - FINAL)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt'); // For password hashing/comparison

// --- MongoDB Atlas Connection URI ---
// IMPORTANT: REPLACE 'Iamagoodboy18' WITH YOUR ACTUAL MongoDB Atlas password.
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
        // Use a unique name for the uploaded file
        cb(null, Date.now() + '-' + file.originalname.replace(/ /g, '_'));
    },
});

const upload = multer({ storage: storage });

// --- 2. Middlewares ---

// 2.1. JSON Body Parser
app.use(express.json()); 

// 2.2. CORS (Allows your http://localhost:3000 frontend to connect)
// CRITICAL FIX: Add the Live Server origin (http://127.0.0.1:5500) and other common dev ports
const allowedOrigins = [
    'http://localhost:3000',        // Common React/Vite/Default port
    'http://localhost:5500',        // Common Live Server port
    'http://127.0.0.1:5500'         // Specific Live Server origin from your error
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// 2.3. Serve Static Files (Uploads)
app.use('/uploads', express.static(UPLOADS_DIR));

// 2.4. Utility function for recalculating ratings
async function recalculateCourseRating(courseId) {
    const ratings = await Comment.find({ courseId: courseId }, 'rating');
    const totalRating = ratings.reduce((sum, c) => sum + c.rating, 0);
    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;
    
    // Update the Course document
    await Course.findByIdAndUpdate(courseId, { 
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: totalReviews
    });
}

// --- 3. API Routes ---

// --- User/Auth Routes ---

// 3.1. POST /api/users/signup - Register a new user (Student or Tutor)
app.post('/api/users/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        if (role !== 'student' && role !== 'tutor') {
            return res.status(400).json({ message: 'Invalid user role specified.' });
        }
        const user = await User.create({ name, email, password, role });
        // The password is automatically hashed by the pre-save middleware in User.js
        res.status(201).json({ 
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            message: `${role} account created successfully!` 
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already in use.' });
        }
        console.error("Signup error:", error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// 3.2. POST /api/users/signin - Authenticate a user
app.post('/api/users/signin', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const user = await User.findOne({ email });
        
        if (user && (await user.matchPassword(password))) {
            // Check if the user's role matches the attempted sign-in role
            if (user.role.toLowerCase() !== role.toLowerCase()) {
                return res.status(401).json({ message: `This account is registered as a ${user.role}. Please sign in with the correct role.` });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: 'Server error during signin.' });
    }
});

// --- Course Routes (Tutor & Student) ---

// 3.3. POST /api/courses - Create a new course (Tutor only)
app.post('/api/courses', upload.single('assetFile'), async (req, res) => {
    try {
        const { tutorId, title, description, assetType, assetUrl, chapters } = req.body;
        
        if (!tutorId || !title || !description) {
            // Attempt to clean up orphaned file if basic data is missing
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Missing required course fields.' });
        }

        let asset;
        if (assetType === 'local') {
            if (!req.file) {
                return res.status(400).json({ message: 'Missing video file for local asset type.' });
            }
            asset = { type: 'local', url: req.file.filename };
        } else if (assetType === 'youtube') {
            if (!assetUrl) {
                return res.status(400).json({ message: 'Missing YouTube URL for YouTube asset type.' });
            }
            asset = { type: 'youtube', url: assetUrl };
        } else {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid asset type.' });
        }

        const chaptersArray = chapters ? JSON.parse(chapters) : [];

        const newCourse = await Course.create({
            tutorId,
            title,
            description,
            asset,
            chapters: chaptersArray,
        });

        res.status(201).json(newCourse);
    } catch (error) {
        console.error("Course creation error:", error);
        if (req.file) fs.unlinkSync(req.file.path); // Cleanup on server error
        res.status(500).json({ message: 'Server error during course creation.' });
    }
});

// 3.4. GET /api/courses - Fetch ALL courses (Course Catalog)
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await Course.find({})
            // Populate the tutor's name for display on the catalog
            .populate('tutorId', 'name'); 
        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: 'Error fetching course catalog.' });
    }
});

// 3.5. GET /api/courses/:id - Fetch a single course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('tutorId', 'name');
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.json(course);
    } catch (error) {
        console.error("Error fetching single course:", error);
        res.status(500).json({ message: 'Error fetching course details.' });
    }
});

// 3.6. GET /api/courses/tutor/:tutorId - Fetch courses by Tutor ID (Tutor Dashboard)
app.get('/api/courses/tutor/:tutorId', async (req, res) => {
    try {
        const courses = await Course.find({ tutorId: req.params.tutorId });
        res.json(courses);
    } catch (error) {
        console.error("Error fetching tutor courses:", error);
        res.status(500).json({ message: 'Error fetching tutor dashboard courses.' });
    }
});

// 3.7. DELETE /api/courses/:id - Delete a course (Tutor only)
app.delete('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // CRITICAL: Cleanup associated data
        // 1. Delete the local video file if it exists
        if (course.asset.type === 'local') {
            const filePath = path.join(UPLOADS_DIR, course.asset.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        // 2. Delete all related Enrollments
        await Enrollment.deleteMany({ courseId: course._id });
        // 3. Delete all related Comments
        await Comment.deleteMany({ courseId: course._id });

        res.json({ message: 'Course and all related data deleted successfully.' });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: 'Server error while deleting course.' });
    }
});

// --- Enrollment Routes (Student) ---

// 3.8. POST /api/enrollments - Enroll a student in a course
app.post('/api/enrollments', async (req, res) => {
    const { studentId, courseId } = req.body;
    try {
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Already enrolled in this course.' });
        }
        
        const newEnrollment = new Enrollment({ studentId, courseId });
        await newEnrollment.save();
        
        // Increment the enrollmentCount on the Course model
        const course = await Course.findByIdAndUpdate(
            courseId, 
            { $inc: { enrollmentCount: 1 } },
            { new: true }
        );

        res.status(201).json({ 
            message: 'Enrollment successful.',
            enrollment: newEnrollment,
            courseTitle: course ? course.title : 'Course'
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Already enrolled in this course (Unique index violation).' });
        }
        console.error("Error during enrollment:", error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
});

// 3.9. GET /api/enrollments/:studentId - Fetch enrolled courses for a student (My Courses View)
app.get('/api/enrollments/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            // Populate course details and the course's tutor details
            .populate({
                path: 'courseId',
                select: 'title description averageRating asset', // Select necessary course fields
                populate: {
                    path: 'tutorId',
                    select: 'name' // Only need the name of the tutor
                }
            });

        if (enrollments.length === 0) {
            return res.json([]);
        }
        res.json(enrollments);
    } catch (error) {
        console.error("Error fetching student enrollments:", error);
        res.status(500).json({ message: 'Error fetching enrolled courses.' });
    }
});

// 3.10. PATCH /api/enrollments/:enrollmentId - Update course progress (Student)
app.patch('/api/enrollments/:enrollmentId', async (req, res) => {
    const { progressPercentage } = req.body;
    try {
        const enrollment = await Enrollment.findByIdAndUpdate(
            req.params.enrollmentId, 
            { progressPercentage }, 
            { new: true } // Return the updated document
        );

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found.' });
        }

        res.json(enrollment);
    } catch (error) {
        console.error("Error updating enrollment progress:", error);
        res.status(500).json({ message: 'Server error while updating progress.' });
    }
});

// --- Comment/Review Routes (Student & Tutor) ---

// 3.11. POST /api/comments - Post a new comment/review (Student only)
app.post('/api/comments', async (req, res) => {
    const { courseId, studentId, text, rating } = req.body;
    try {
        if (!courseId || !studentId || !text) {
            return res.status(400).json({ message: 'Missing required fields for comment.' });
        }

        const newComment = await Comment.create({ courseId, studentId, text, rating });
        
        // CRITICAL: Recalculate average rating after a new comment is added
        await recalculateCourseRating(courseId);

        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: 'Server error while creating comment.' });
    }
});

// 3.12. GET /api/comments/:courseId - Fetch all comments for a course
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

// 3.13. DELETE /api/comments/:commentId - Delete a comment (Used by Tutor)
app.delete('/api/comments/:commentId', async (req, res) => {
    try {
        const comment = await Comment.findByIdAndDelete(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        
        // CRITICAL: Recalculate average rating on the Course model after deletion
        await recalculateCourseRating(comment.courseId);

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
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });