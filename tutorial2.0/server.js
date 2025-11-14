// server.js (Node.js/Express Backend with ALL CRITICAL FIXES)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs'); 

// --- MongoDB Atlas Connection URI ---
// IMPORTANT: REPLACE 'Iamagoodboy18' WITH YOUR ACTUAL MongoDB Atlas password.
const ATLAS_URI = "mongodb+srv://kingchoco:Iamagoodboy18@cluster0.mpqc8xc.mongodb.net/video_tutorial?retryWrites=true&w=majority&appName=Cluster0";

// --- Require Mongoose Models ---
// NOTE: These models are assumed to be defined in separate files (e.g., ./models/User.js)
const Course = require('./models/Course'); 
const User = require('./models/User'); 
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

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 500 * 1024 * 1024 // 500 MB limit for file uploads
    }
});

// --- 2. Middlewares ---

// 2.1. JSON Body Parser
app.use(express.json()); 

// 2.2. CORS 
const allowedOrigins = [
    'http://localhost:3000',        
    'http://localhost:5500',        
    'http://127.0.0.1:5500'         
];

const corsOptions = {
    origin: function (origin, callback) {
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

// 3.1. POST /api/users/signup - Registers a new user (Student or Tutor)
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

        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        user = new User({ 
            name, 
            email, 
            password: hashedPassword, // Store the hashed password
            role: validRole
        });

        await user.save();

        // Send back user data excluding the password hash
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ message: 'User created successfully.', user: userResponse });
    } catch (error) {
        console.error('User sign-up error:', error);
        res.status(500).json({ message: 'Server error during sign-up.' });
    }
});

// 3.2. POST /api/users/signin - Authenticates a user
app.post('/api/users/signin', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    try {
        const user = await User.findOne({ email, role: role.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials or role.' });
        }
        
        // Send back user data excluding the password hash
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ message: 'Sign in successful.', user: userResponse });
    } catch (error) {
        console.error('User sign-in error:', error);
        res.status(500).json({ message: 'Server error during sign-in.' });
    }
});

// 3.3. POST /api/courses - Create a new course
app.post('/api/courses', upload.single('assetFile'), async (req, res) => {
    const { title, description, price, category, chapters, assetType, assetUrl, tutorId } = req.body;
    
    // Parse JSON strings
    let chaptersArray;
    try {
        chaptersArray = JSON.parse(chapters);
    } catch (e) {
        return res.status(400).json({ message: 'Chapters data is malformed JSON.' });
    }
    
    if (!title || !description || !price || !category || !assetType || !tutorId || !chaptersArray || chaptersArray.length === 0) {
        // If there was a file, delete it because the upload failed validation
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Missing required course fields (title, description, price, category, assetType, tutorId, or chapters).' });
    }

    // --- Asset Configuration Logic (Local File or YouTube URL) ---
    let asset;
    const validAssetType = assetType.toLowerCase();
    if (validAssetType === 'local') {
        if (!req.file) {
            return res.status(400).json({ message: 'Local file upload selected, but no file was provided.' });
        }
        // CRITICAL FIX: The url is the filename generated by Multer
        asset = { type: 'local', url: req.file.filename };
    } else if (validAssetType === 'youtube') {
        if (!assetUrl) {
             // If there was a file (which there shouldn't be), delete it
             if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'YouTube asset type selected, but asset URL (Video ID) was not provided.' });
        }
        // CRITICAL FIX: Ensure YouTube URL is just the Video ID
        asset = { type: 'youtube', url: assetUrl.trim() }; 
    } else {
         if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Invalid asset type specified. Must be "local" or "youtube".' });
    }

    try {
        const newCourse = new Course({
            title,
            description,
            price: parseFloat(price),
            category,
            tutorId,
            chapters: chaptersArray,
            asset,
            averageRating: 0,
            totalReviews: 0,
            enrollmentCount: 0 // Initialize count
        });

        await newCourse.save();
        res.status(201).json({ message: 'Course created successfully.', course: newCourse });
    } catch (error) {
        console.error('Course creation error:', error);
        // Clean up the uploaded file if the database save fails
        if (req.file) {
             fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error during course creation.' });
    }
});

// 3.4. GET /api/courses/catalog - Fetch all courses (for Student Catalog)
app.get('/api/courses/catalog', async (req, res) => {
    const studentId = req.query.studentId;
    const filter = req.query.filter; // 'all', 'enrolled', 'not-enrolled'

    try {
        let courseQuery = {};
        let enrolledCourseIds = new Set();
        let enrollmentMap = {};

        // 1. If a student is logged in, find their enrollments first
        if (studentId) {
            const enrollments = await Enrollment.find({ studentId }).select('courseId');
            enrollments.forEach(e => enrolledCourseIds.add(e.courseId.toString()));
        }

        // 2. Apply filter based on enrollment status
        if (filter === 'enrolled') {
            courseQuery._id = { $in: Array.from(enrolledCourseIds) };
        } else if (filter === 'not-enrolled') {
            courseQuery._id = { $nin: Array.from(enrolledCourseIds) };
        }

        // 3. Fetch courses
        let courses = await Course.find(courseQuery)
            .populate('tutorId', 'name') // Only fetch the tutor's name
            .sort({ createdAt: -1 });

        // 4. Enrich courses with enrollment status
        courses = courses.map(course => {
            const courseObj = course.toObject();
            const isEnrolled = enrolledCourseIds.has(courseObj._id.toString());
            courseObj.isEnrolled = isEnrolled;
            // The frontend course card needs enrollmentId but it's only available in My Courses view
            return courseObj;
        });

        res.json(courses);
    } catch (error) {
        console.error('Course catalog fetching error:', error);
        res.status(500).json({ message: 'Error fetching course catalog.' });
    }
});

// 3.5. GET /api/courses/:courseId - Fetch single course details
app.get('/api/courses/:courseId', async (req, res) => {
    const courseId = req.params.courseId;
    const userId = req.query.userId;
    const userRole = req.query.userRole; // 'Student' or 'Tutor'

    try {
        const course = await Course.findById(courseId).populate('tutorId', 'name');
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const courseObj = course.toObject();
        let enrollment = null;
        let isEnrolled = false;
        
        // 1. Check Enrollment Status for Student
        if (userId && userRole === 'Student') {
            enrollment = await Enrollment.findOne({ studentId: userId, courseId });
            isEnrolled = !!enrollment;
            courseObj.isEnrolled = isEnrolled;
        } else {
             // Default to not enrolled if user is a Tutor or logged out
            courseObj.isEnrolled = false;
        }

        // 2. Asset Restriction Logic (Preventing non-enrolled students from seeing the local file URL)
        const isLocalAsset = courseObj.asset.type === 'local';
        const isStudent = userRole === 'Student';
        const isRestricted = isLocalAsset && isStudent && !isEnrolled;
        
        if (isRestricted) {
            // CRITICAL FIX: If restricted, send a flag instead of the real URL
            courseObj.asset.url = 'access_denied';
        }

        // 3. Progress Tracking
        if (isEnrolled && enrollment) {
            courseObj.progressPercentage = enrollment.progressPercentage;
            courseObj.enrollmentId = enrollment._id.toString();
        }

        // 4. Enrollment Count (for Tutor view/stats)
        courseObj.enrollmentCount = await Enrollment.countDocuments({ courseId });

        res.json(courseObj);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: 'Error fetching course details.' });
    }
});

// 3.6. GET /api/courses/tutor/:tutorId - Fetch all courses created by a tutor
app.get('/api/courses/tutor/:tutorId', async (req, res) => {
    try {
        const courses = await Course.find({ tutorId: req.params.tutorId })
            .sort({ createdAt: -1 }); // Newest first

        // Note: Tutor dashboard cards only need basic course info, not detailed enrollment/progress data
        res.json(courses);
    } catch (error) {
        console.error('Fetching tutor courses error:', error);
        res.status(500).json({ message: 'Error fetching tutor courses.' });
    }
});

// 3.7. GET /api/enrollments/student/:studentId - Fetch all enrolled courses for a student
app.get('/api/enrollments/student/:studentId', async (req, res) => {
    try {
        // Find all enrollment documents for the student and populate the related course
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            .populate({
                path: 'courseId',
                select: '-chapters', // Do not send chapter details
                populate: {
                    path: 'tutorId',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        // Transform the result to be a list of courses with progress data
        const enrolledCourses = enrollments.map(e => ({
            ...e.courseId.toObject(),
            progressPercentage: e.progressPercentage,
            enrollmentId: e._id.toString()
        }));

        res.json(enrolledCourses);
    } catch (error) {
        console.error('Fetching enrolled courses error:', error);
        res.status(500).json({ message: 'Error fetching enrolled courses.' });
    }
});

// --------------------------------------------------------
// --- CRITICAL FIXES AND NEW FUNCTIONALITY ROUTES BELOW ---
// --------------------------------------------------------

// 3.8. POST /api/enrollments - Enroll a student in a course (FIXED: Was causing 500 error)
app.post('/api/enrollments', async (req, res) => {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
        return res.status(400).json({ message: 'Missing studentId or courseId.' });
    }

    try {
        // 1. Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(409).json({ 
                message: 'Student is already enrolled in this course.', 
                enrollmentId: existingEnrollment._id.toString() 
            });
        }

        // 2. Create new enrollment
        const newEnrollment = new Enrollment({
            studentId,
            courseId,
            progressPercentage: 0,
            lastAccessed: new Date()
        });
        await newEnrollment.save();

        // 3. Update enrollment count on the Course
        await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

        res.status(201).json({ 
            message: 'Successfully enrolled.', 
            enrollmentId: newEnrollment._id.toString(),
            courseId: newEnrollment.courseId.toString()
        });
    } catch (error) {
        console.error('Error processing enrollment:', error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
});


// 3.9. DELETE /api/courses/:courseId - Delete a course (NEW: Tutor Dashboard Delete)
app.delete('/api/courses/:courseId', async (req, res) => {
    const courseId = req.params.courseId;

    try {
        // 1. Find the course to be deleted
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 2. If it's a local file, delete the file from the disk
        if (course.asset.type === 'local') {
            const filePath = path.join(UPLOADS_DIR, course.asset.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Synchronously delete file
            }
        }

        // 3. Delete the Course document
        await Course.findByIdAndDelete(courseId);

        // 4. Delete all related Enrollments
        await Enrollment.deleteMany({ courseId });

        // 5. Delete all related Comments/Reviews
        await Comment.deleteMany({ courseId });

        res.json({ message: 'Course, associated file, enrollments, and comments deleted successfully.' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Server error while deleting course.' });
    }
});

// 3.10. PATCH /api/enrollments/progress/:enrollmentId - Update course progress
app.patch('/api/enrollments/progress/:enrollmentId', async (req, res) => {
    const { progressPercentage } = req.body;
    
    // Simple validation
    if (typeof progressPercentage !== 'number' || progressPercentage < 0 || progressPercentage > 100) {
        return res.status(400).json({ message: 'Invalid progress percentage.' });
    }

    try {
        const enrollment = await Enrollment.findByIdAndUpdate(
            req.params.enrollmentId,
            { progressPercentage, lastAccessed: new Date() },
            { new: true } // Return the updated document
        );

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found.' });
        }

        res.json({ message: 'Progress updated successfully.', progress: enrollment.progressPercentage });
    } catch (error) {
        console.error('Progress update error:', error);
        res.status(500).json({ message: 'Server error during progress update.' });
    }
});

// 3.11. POST /api/comments - Post a new comment/review for a course
app.post('/api/comments', async (req, res) => {
    const { courseId, studentId, rating, text } = req.body;

    if (!courseId || !studentId || typeof rating !== 'number' || !text) {
        return res.status(400).json({ message: 'Missing required fields for comment.' });
    }

    try {
        // CRITICAL FIX: Security Check - ONLY allow comments from ENROLLED students
        const isEnrolled = await Enrollment.exists({ studentId, courseId });
        if (!isEnrolled) {
            return res.status(403).json({ message: 'You must be enrolled in this course to leave a review.' });
        }

        // Check if student has already reviewed this course
        const existingComment = await Comment.findOne({ courseId, studentId });
        if (existingComment) {
            return res.status(409).json({ message: 'You have already posted a review for this course.' });
        }

        const newComment = new Comment({
            courseId,
            studentId,
            rating,
            text
        });

        await newComment.save();
        
        // Populate the studentId field to return the name
        await newComment.populate('studentId', 'name');

        // Recalculate course rating
        await recalculateCourseRating(courseId);

        res.status(201).json({ message: 'Comment posted successfully.', comment: newComment });
    } catch (error) {
        console.error('Comment post error:', error);
        res.status(500).json({ message: 'Server error during comment post.' });
    }
});

// 3.12. GET /api/comments/:courseId - Fetch comments for a course
app.get('/api/comments/:courseId', async (req, res) => {
    try {
        const comments = await Comment.find({ courseId: req.params.courseId })
            .populate('studentId', 'name') // Only fetch the student's name
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
        
        // Recalculate rating after deletion
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
        process.exit(1); // Exit process if connection fails
    });