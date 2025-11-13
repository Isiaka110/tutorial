// server.js (Node.js/Express Backend with ALL FIXES APPLIED)

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

const upload = multer({ storage: storage });

// --- 2. Middlewares ---

// 2.1. JSON Body Parser
app.use(express.json()); 

// 2.2. CORS (Allows your frontend to connect)
const allowedOrigins = [
    'http://localhost:3000',        // Common React/Vite/Default port
    'http://localhost:5500',        // Common Live Server port
    'http://127.0.0.1:5500'         // Specific Live Server origin
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            // return callback(new Error(msg), false); // Commented out to prevent crash if origin is slightly different
            return callback(null, true); // Temporarily allow for dev flexibility
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

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide name, email, password, and role.' });
    }
    const validRole = role.toLowerCase();
    if (validRole !== 'tutor' && validRole !== 'student') {
        return res.status(400).json({ message: 'Invalid role specified. Must be "Student" or "Tutor".' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: `A user with email ${email} already exists.` });
        }

        user = new User({
            name,
            email,
            password, 
            role: validRole
        });

        const newUser = await user.save();

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
        console.error('Sign Up Error:', error); 
        if (error.code === 11000) {
             return res.status(400).json({ message: 'That email is already registered.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});


// 3.2. POST /api/users/signin - Authenticate a user
app.post('/api/users/signin', async (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }
    const queryRole = role.toLowerCase();

    try {
        const user = await User.findOne({ email, role: queryRole });
        if (user && (await user.matchPassword(password))) {
            const userResponse = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            };
            res.json({ message: 'Sign in successful', user: userResponse });
        } else {
            res.status(401).json({ message: 'Invalid credentials or user role.' });
        }
    } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: 'Server error during sign-in.' });
    }
});


// --- Course Routes (Tutor) ---

/** POST /api/courses - Create a new course (Tutor) */
// The 'upload.single('assetFile')' middleware handles the video file upload.
app.post('/api/courses', upload.single('assetFile'), async (req, res) => {
    try {
        // Extract fields from body/file
        const { tutorId, title, description, assetType, assetUrl, chapters } = req.body;
        
        // Input validation
        if (!tutorId || !title || !description || !assetType) {
            // Clean up orphaned file if basic data is missing
            if (req.file) fs.unlinkSync(req.file.path); 
            return res.status(400).json({ message: 'Missing required course fields (tutorId, title, description, assetType).' });
        }

        let asset;
        if (assetType === 'local') {
            if (!req.file) {
                return res.status(400).json({ message: 'Missing video file for local asset type.' });
            }
            // Use the filename generated by Multer
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
        
        // Parse chapters JSON string back into an array
        const chaptersArray = chapters ? JSON.parse(chapters) : [];

        // Create the new course document
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
        if (req.file) fs.unlinkSync(req.file.path); 
        res.status(500).json({ message: 'Server error during course creation.' });
    }
});


// 3.4. GET /api/courses - Fetch ALL courses (Course Catalog) with optional enrollment filter
app.get('/api/courses', async (req, res) => {
    const { studentId, filter } = req.query; // Get studentId and filter from query params
    
    try {
        let courses = await Course.find()
            .populate('tutorId', 'name') // Populate tutor name
            .lean(); // Use lean for performance and modification

        // Apply filtering logic if a student is logged in and a filter is provided
        if (studentId && (filter === 'enrolled' || filter === 'not-enrolled')) {
            // 1. Fetch all enrollments for the student
            const enrollments = await Enrollment.find({ studentId }).select('courseId _id').lean();
            const enrollmentMap = new Map();
            enrollments.forEach(e => {
                enrollmentMap.set(e.courseId.toString(), e._id.toString());
            });

            // 2. Filter courses and tag enrollment status
            courses = courses.filter(course => {
                const isEnrolled = enrollmentMap.has(course._id.toString());
                
                // Add enrollment status to the course object (useful for frontend rendering)
                course.enrollmentStatus = { 
                    isEnrolled: isEnrolled,
                    enrollmentId: isEnrolled ? enrollmentMap.get(course._id.toString()) : null
                };

                if (filter === 'enrolled') {
                    return isEnrolled;
                }
                if (filter === 'not-enrolled') {
                    return !isEnrolled;
                }
                return true; 
            });
        }
        
        res.json(courses);
    } catch (error) {
        console.error("Error fetching course catalog:", error);
        res.status(500).json({ message: 'Server error while fetching courses.' });
    }
});


// 3.5. GET /api/courses/:courseId - Fetch single course details
app.get('/api/courses/:courseId', async (req, res) => {
    try {
        // Find course and populate tutor name
        const course = await Course.findById(req.params.courseId)
            .populate('tutorId', 'name')
            .lean(); // Use .lean() to add the enrollmentCount property

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        
        // Calculate and attach enrollment count
        const enrollmentCount = await Enrollment.countDocuments({ courseId: req.params.courseId });
        course.enrollmentCount = enrollmentCount; 

        res.json(course);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: 'Server error while fetching course details.' });
    }
});

// 3.6. GET /api/courses/tutor/:tutorId - Fetch all courses by a specific tutor
app.get('/api/courses/tutor/:tutorId', async (req, res) => {
    try {
        const courses = await Course.find({ tutorId: req.params.tutorId })
            .populate('tutorId', 'name')
            .sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        console.error("Error fetching tutor courses:", error);
        res.status(500).json({ message: 'Server error while fetching tutor courses.' });
    }
});

// 3.7. DELETE /api/courses/:courseId - Delete a course and all related data
app.delete('/api/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 1. Delete the local file if it exists
        if (course.asset.type === 'local' && course.asset.url) {
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
        if (!studentId || !courseId) {
            return res.status(400).json({ message: 'Missing studentId or courseId for enrollment.' });
        }
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            // This 400 response is correct for preventing duplicate enrollments.
            return res.status(400).json({ message: 'You are already enrolled in this course.' });
        }

        const newEnrollment = new Enrollment({ studentId, courseId, progressPercentage: 0 });
        await newEnrollment.save();
        
        // Return the full enrollment object for the frontend to use the _id
        res.status(201).json(newEnrollment);
    } catch (error) {
        console.error("Enrollment creation error:", error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
});

// 3.9. GET /api/enrollments/student/:studentId - Fetch all enrollments for a student (Correct Route)
app.get('/api/enrollments/student/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            .populate({
                path: 'courseId',
                select: 'title description averageRating totalReviews tutorId',
                populate: {
                    path: 'tutorId',
                    select: 'name'
                }
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
        // Ensure progress is a valid number between 0 and 100
        const sanitizedProgress = Math.min(100, Math.max(0, parseInt(progressPercentage)));

        const enrollment = await Enrollment.findByIdAndUpdate(
            req.params.enrollmentId,
            { progressPercentage: sanitizedProgress },
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

// 3.11. DELETE /api/enrollments/:enrollmentId - Unenroll a student from a course
app.delete('/api/enrollments/:enrollmentId', async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndDelete(req.params.enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found.' });
        }
        res.json({ message: 'Unenrolled successfully.' });
    } catch (error) {
        console.error("Error unenrolling:", error);
        res.status(500).json({ message: 'Server error while unenrolling.' });
    }
});


// --- Comment/Review Routes ---

/** POST /api/comments - Create a new comment/review (Student) */
app.post('/api/comments', async (req, res) => {
    const { studentId, courseId, rating, text } = req.body;

    try {
        // Validation
        if (!studentId || !courseId || !rating || !text) {
            return res.status(400).json({ message: 'Missing required fields: studentId, courseId, rating, text.' });
        }
        
        // CRITICAL FIX: Prevent duplicate reviews from the same student on the same course
        const existingComment = await Comment.findOne({ studentId, courseId });
        if (existingComment) {
            // Return 400 (Bad Request) on duplicate review
            return res.status(400).json({ message: 'You have already posted a review for this course.' });
        }
        
        // Create the comment
        const newComment = await Comment.create({ studentId, courseId, rating, text });

        // Update the Course's average rating and total reviews
        await recalculateCourseRating(courseId); 

        // Populate studentId for the response to contain the reviewer's name
        const populatedComment = await newComment.populate('studentId', 'name');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error("Comment creation error:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed. Check data types for rating/fields.' });
        }
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
            console.log(`Server is running on port: ${port}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });