// server.js (Node.js/Express Backend - FINAL)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs'); // For password hashing/comparison

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

// CRITICAL FIX (Request 1): Add limits for file size (500MB)
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 500 * 1024 * 1024 // 500 MB 
    }
});

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

// 3.1. POST /api/users/signup - Registers a new user (Student or Tutor)
app.post('/api/users/signup', async (req, res) => {
    const { name, email, password, role } = req.body;

    // 1. Basic Validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide name, email, password, and role.' });
    }

    // Role validation to match Mongoose enum ['tutor', 'student']
    const validRole = role.toLowerCase();
    if (validRole !== 'tutor' && validRole !== 'student') {
        return res.status(400).json({ message: 'Invalid role specified. Must be "Student" or "Tutor".' });
    }

    try {
        // 2. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: `A user with email ${email} already exists.` });
        }

        // 3. Create a new user (password hashing is handled by User.js pre-save middleware)
        user = new User({
            name,
            email,
            password, // Mongoose pre-save hook handles hashing
            role: validRole
        });

        const newUser = await user.save();

        // 4. Return success response (Do not return the password)
        res.status(201).json({
            message: 'User registered successfully. Please sign in.',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        // Log the full error to the console for debugging
        console.error('Sign Up Error:', error); 
        
        // Handle MongoDB duplicate key error (code 11000 for unique email constraint)
        if (error.code === 11000) {
             return res.status(400).json({ message: 'That email is already registered.' });
        }
        
        // Return a generic 500 for other server-side failures
        res.status(500).json({ message: 'Server error during registration.' });
    }
});


// 3.2. POST /api/users/signin - Authenticate a user
app.post('/api/users/signin', async (req, res) => {
    const { email, password, role } = req.body;

    // Basic input validation
    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }
    
    // Ensure role is lowercase to match the model's enum ['tutor', 'student']
    const queryRole = role.toLowerCase();

    try {
        // 1. Find the user by email AND role
        const user = await User.findOne({ email, role: queryRole });

        if (user && (await user.matchPassword(password))) {
            // Success: Password matches.
            // Return only safe/necessary user data
            const userResponse = {
                _id: user._id, // MongoDB ID
                name: user.name,
                email: user.email,
                role: user.role
            };
            return res.json({ message: 'Authentication successful.', user: userResponse });
        } else {
            // Failure: User not found or password mismatch
            return res.status(401).json({ message: 'Invalid credentials or incorrect role selected.' });
        }

    } catch (error) {
        console.error('Sign In Error:', error);
        res.status(500).json({ message: 'Server error during sign-in.' });
    }
});

// --- Course Routes (Tutor & Student) ---

// 3.3. POST /api/courses - Create a new course
app.post('/api/courses', upload.single('video'), async (req, res) => {
    const { tutorId, title, description, assetType, assetUrl, chapters } = req.body;

    try {
        // Basic validation and file cleanup on failure
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
            // Simple validation check for URL structure
            if (!assetUrl.includes('youtube.com') && !assetUrl.includes('youtu.be')) {
                 return res.status(400).json({ message: 'Invalid YouTube URL provided.' });
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
            averageRating: 0,
            totalReviews: 0,
            enrolledStudents: 0
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
            .populate('tutorId', 'name') 
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: 'Error fetching course catalog.' });
    }
});

// 3.5. GET /api/courses/:courseId - Fetch single course details
app.get('/api/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            // Populate the tutor's name
            .populate('tutorId', 'name'); 

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        res.json(course);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: 'Error fetching course details.' });
    }
});

// 3.6. GET /api/tutors/:tutorId/courses - Fetch courses published by a specific tutor
app.get('/api/tutors/:tutorId/courses', async (req, res) => {
    try {
        const courses = await Course.find({ tutorId: req.params.tutorId })
            .sort({ createdAt: -1 });
        
        res.json(courses);
    } catch (error) {
        console.error("Error fetching tutor courses:", error);
        res.status(500).json({ message: 'Error fetching tutor courses.' });
    }
});

// 3.7. DELETE /api/courses/:courseId - Delete a course (Tutor)
app.delete('/api/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 1. Delete associated local video file if it exists
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
    try {
        const { studentId, courseId } = req.body;

        // 1. Basic validation check
        if (!studentId || !courseId) {
            return res.status(400).json({ message: 'Missing studentId or courseId for enrollment.' });
        }

        // 2. Check for existing enrollment (prevents duplicate error)
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already enrolled in this course.' });
        }

        // 3. Create and save the new enrollment
        const newEnrollment = new Enrollment({
            studentId,
            courseId,
            progressPercentage: 0 // Default progress
        });
        await newEnrollment.save();

        // 4. Increment enrolledStudents count on the Course model
        // CRITICAL FIX (Request 3): Ensure safe update and return a success message
        await Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudents: 1 } }); 

        res.status(201).json(newEnrollment); // Return the newly created enrollment object

    } catch (error) {
        console.error('Enrollment error:', error);
        // CRITICAL FIX (Request 3): Specific error message for the frontend
        res.status(500).json({ message: 'Server error during enrollment. Please try again later.' });
    }
});

// 3.9. GET /api/enrollments/:studentId - Fetch all courses a student is enrolled in
app.get('/api/enrollments/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            // Populate the full Course object and the Tutor's name within the course
            .populate({
                path: 'courseId',
                populate: { path: 'tutorId', select: 'name' } 
            })
            .sort({ createdAt: -1 });

        res.json(enrollments);
    } catch (error) {
        console.error("Error fetching enrolled courses:", error);
        res.status(500).json({ message: 'Error fetching enrolled courses.' });
    }
});

// 3.10. PATCH /api/enrollments/:enrollmentId - Update course progress (Student)
app.patch('/api/enrollments/:enrollmentId', async (req, res) => {
    const { progressPercentage } = req.body;

    try {
        // Input validation for progress
        if (typeof progressPercentage !== 'number' || progressPercentage < 0 || progressPercentage > 100) {
            return res.status(400).json({ message: 'Progress percentage must be a number between 0 and 100.' });
        }

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

// 3.11. DELETE /api/enrollments/:enrollmentId - Remove a student from a course (Unenroll)
app.delete('/api/enrollments/:enrollmentId', async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndDelete(req.params.enrollmentId);

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found.' });
        }

        // Decrement enrolledStudents count on the Course model
        await Course.findByIdAndUpdate(enrollment.courseId, { $inc: { enrolledStudents: -1 } });

        res.json({ message: 'Unenrolled successfully.' });
    } catch (error) {
        console.error("Error during unenrollment:", error);
        res.status(500).json({ message: 'Server error during unenrollment.' });
    }
});


// --- Comment/Review Routes (Student & Tutor) ---

// 3.12. POST /api/comments - Add a new comment/review
app.post('/api/comments', async (req, res) => {
    try {
        const { studentId, courseId, rating, comment } = req.body;

        if (!studentId || !courseId || !rating || !comment) {
             return res.status(400).json({ message: 'Missing required comment fields (studentId, courseId, rating, comment).' });
        }

        // Check if the student is enrolled in the course
        const isEnrolled = await Enrollment.findOne({ studentId, courseId });
        if (!isEnrolled) {
            return res.status(403).json({ message: 'You must be enrolled in the course to leave a review.' });
        }
        
        // Prevent duplicate reviews from the same student on the same course
        const existingComment = await Comment.findOne({ studentId, courseId });
        if (existingComment) {
             return res.status(400).json({ message: 'You have already left a review for this course. You can only update your existing review.' });
        }

        const newComment = await Comment.create({ studentId, courseId, rating, comment });
        
        // CRITICAL: Recalculate average rating on the Course model
        await recalculateCourseRating(courseId);

        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ message: 'Server error while posting comment.' });
    }
});

// 3.13. GET /api/comments/:courseId - Fetch all comments for a course
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

// 3.14. DELETE /api/comments/:commentId - Delete a comment (Used by Tutor)
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
            console.log(`Server is running on port: http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });