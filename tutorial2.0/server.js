// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs'); // Added for file cleanup

// --- Require Models ---
const Course = require('./models/Course'); 
const User = require('./models/User'); 
// CRITICAL FIX: Assuming you have an Enrollment model
const Enrollment = require('./models/Enrollment'); 

const app = express();
// Setting the backend port to 5000 is safer practice than 3000, 
// assuming your frontend is running on 3000. Adjust this if necessary.
app.use(cors());
const port = 5000; 

// --- Middlewares (CRITICAL ORDER) ---

// 1. JSON Body Parser
app.use(express.json()); 

// 2. CORS (Allows frontend on a different port/domain to connect)
// Since the frontend is likely running on 3000, we explicitly allow it.
const corsOptions = {
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// 3. Serve Static Files (Frontend assets - only needed if running FE from here)
app.use(express.static(path.join(__dirname, '')));

// 4. Serve Uploaded Videos 
// Makes files accessible via http://localhost:5000/uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// --- Database Connection (MongoDB) ---

const DB_URI = "mongodb+srv://kingchoco:Iamagoodboy18@cluster0.mpqc8xc.mongodb.net/video_tutorial?appName=Cluster0"; 

mongoose.connect(DB_URI)
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));


// --- Multer Configuration for File Uploads ---

// Ensure the 'uploads/' directory exists!
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 } 
});


// --- API Routes ---

// 1A. POST /api/auth/signup/:userType - Sign-Up
app.post('/api/auth/signup/:userType', async (req, res) => {
    const { name, email, password } = req.body;
    const userRole = req.params.userType.toLowerCase(); 

    if (!name || !email || !password || (userRole !== 'tutor' && userRole !== 'student')) {
        return res.status(400).json({ message: 'Missing required fields or invalid role.' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const user = await User.create({
            name,
            email,
            password, 
            role: userRole,
        });

        console.log(`[AUTH] Successful ${userRole} signup: ${user.email}`);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error("Error during real signup:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// 1B. POST /api/auth/signin/:userType - Sign-In
app.post('/api/auth/signin/:userType', async (req, res) => {
    const { email, password } = req.body;
    const userRole = req.params.userType.toLowerCase();

    try {
        const user = await User.findOne({ email, role: userRole });

        if (user && (await user.matchPassword(password))) { 
            console.log(`[AUTH] Successful ${userRole} sign-in: ${user.email}`);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error("Error during real signin:", error);
        res.status(500).json({ message: 'Server error during sign-in.' });
    }
});

// 2. POST /api/courses/upload - Handles file upload and course creation
app.post('/api/courses/upload', upload.single('videoFile'), async (req, res) => {
    try {
        const { tutorId, title, description, assetType, youtubeUrl, chapters: chaptersJson } = req.body;

        if (!tutorId || !title) {
            if (req.file) { fs.unlinkSync(req.file.path); }
            return res.status(400).json({ message: 'Tutor ID and Title are required.' });
        }

        let newAsset;
        
        // Condition 1: Local file upload
        if (assetType === 'local' && req.file) {
            newAsset = {
                type: 'local',
                url: req.file.filename, // Store filename, access via /uploads/filename
            };
        } 
        // Condition 2: YouTube URL
        else if (assetType === 'youtube' && youtubeUrl && youtubeUrl.startsWith('http')) {
            newAsset = {
                type: 'youtube',
                url: youtubeUrl, 
            };
        } 
        // Validation check if content is missing
        else {
            if (req.file) { fs.unlinkSync(req.file.path); } // Clean up file if validation fails
            return res.status(400).json({ message: 'Invalid asset type or missing content.' });
        }

        // Chapters parsing
        const chapters = chaptersJson ? JSON.parse(chaptersJson) : [];

        const newCourse = new Course({
            tutorId, 
            title, 
            description, 
            asset: newAsset, 
            chapters: chapters
        });
        
        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);

    } catch (error) {
        console.error('Error creating course and uploading video:', error);
        if (req.file) { fs.unlinkSync(req.file.path); }
        res.status(500).json({ message: 'Server error during course creation.' });
    }
});

// 3. GET /api/courses/:id - Fetch a single course
app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('tutorId', 'name'); // Added populate for tutor name
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching course' });
    }
});

// 4. GET /api/courses/all - Fetch all courses (Student Catalog)
app.get('/api/courses/all', async (req, res) => {
    try {
        // Populate tutorId field to include tutor's name for display
        let courses = await Course.find({}).populate('tutorId', 'name'); 
        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses for catalog:", error);
        res.status(500).json({ message: 'Error fetching all courses' });
    }
});

// 5. GET /api/courses - Fetch courses by tutorId (Tutor Course List)
app.get('/api/courses', async (req, res) => {
    const { tutorId } = req.query;
    if (!tutorId) {
        // Return 400 if tutorId is missing for this specific route
        return res.status(400).json({ message: 'Missing tutorId query parameter.' });
    }
    
    try {
        const courses = await Course.find({ tutorId: tutorId });
        res.json(courses);
    } catch (error) {
        console.error("Error fetching tutor courses:", error);
        res.status(500).json({ message: 'Error fetching courses by tutor' });
    }
});

// 6. DELETE /api/courses/:id - Delete a course
app.delete('/api/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        if (course.asset && course.asset.type === 'local' && course.asset.url) {
            const filePath = path.join(__dirname, 'uploads', course.asset.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: 'Server error during course deletion.' });
    }
});

// 7. GET /api/dashboard/tutor/:tutorId - Fetch Tutor Dashboard Stats 
app.get('/api/dashboard/tutor/:tutorId', async (req, res) => {
    const { tutorId } = req.params;

    try {
        const courseCount = await Course.countDocuments({ tutorId });
        const tutorCourses = await Course.find({ tutorId }, 'enrollmentCount'); 
        
        let totalEnrollments = 0;
        tutorCourses.forEach(course => {
            totalEnrollments += course.enrollmentCount || 0; 
        });

        res.json({
            courseCount,
            totalEnrollments
        });

    } catch (error) {
        console.error("Error fetching tutor dashboard stats:", error);
        res.status(500).json({ message: 'Server error fetching dashboard statistics.' });
    }
});

// --- NEW ENROLLMENT ROUTES ADDED ---

// 8. POST /api/enrollments/enroll - Enroll a student in a course
// This is called by the handleEnrollment function in app.js
app.post('/api/enrollments/enroll', async (req, res) => {
    const { studentId, courseId } = req.body;
    
    if (!studentId || !courseId) {
        return res.status(400).json({ message: 'Student ID and Course ID are required for enrollment.' });
    }

    try {
        const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
        if (existingEnrollment) {
            return res.status(409).json({ message: 'Student is already enrolled in this course.' });
        }

        const newEnrollment = new Enrollment({
            studentId,
            courseId,
            progressPercentage: 0, // Start at 0%
            enrolledAt: new Date()
        });

        await newEnrollment.save();
        
        // Optionally update the Course enrollmentCount
        const course = await Course.findByIdAndUpdate(
            courseId, 
            { $inc: { enrollmentCount: 1 } },
            { new: true, select: 'title' } // Get the updated course title
        );

        res.status(201).json({ 
            message: 'Enrollment successful.',
            enrollment: newEnrollment,
            courseTitle: course ? course.title : 'Course'
        });

    } catch (error) {
        console.error("Error during enrollment:", error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
});

// 9. GET /api/enrollments/:studentId - Fetch enrolled courses for a student
// This is the missing route called by loadStudentCoursesView in app.js
app.get('/api/enrollments/:studentId', async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ studentId: req.params.studentId })
            // CRITICAL: Populate course details and the course's tutor details
            .populate({
                path: 'courseId',
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

// --- Start Server ---
app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
    console.log(`CORS enabled for http://localhost:3000`);
});