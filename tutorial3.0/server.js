// server.js

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// ===============================================
// CONFIGURATION (UPDATE THESE)
// ===============================================

// !!! IMPORTANT: Replace with your actual MongoDB Atlas connection string
const MONGO_URI = "mongodb+srv://kingchoco:Iamagoodboy18@cluster0.mpqc8xc.mongodb.net/video_tutorial?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = '0c4d5f72924ef72107721d0013d5317d6ccf16ee803892e2432ef674e4810058'; 
const JWT_COOKIE_NAME = 'auth_token';

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Multer storage setup for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// The key here is that the form input name must match 'videoFile'
const upload = multer({ storage: storage });


// --- MongoDB ATLAS CONNECTION ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));


// --- Mongoose Schemas and Models ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Student', 'Tutor'], required: true },
    createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
    tutor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutorName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    video_path: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Course = mongoose.model('Course', CourseSchema);
const Comment = mongoose.model('Comment', CommentSchema);


// ===============================================
// MIDDLEWARE SETUP
// ===============================================
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '.')));


// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const token = req.cookies[JWT_COOKIE_NAME];
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        // Decoded payload contains { id, role, name }
        req.user = decoded; 
        next();
    });
};

// ===============================================
// API ROUTES
// ===============================================

// 1. Session Check (Primary, checks for token)
app.get('/api/session', (req, res, next) => {
    const token = req.cookies[JWT_COOKIE_NAME];
    
    if (!token) {
        return res.json({ isLoggedIn: false });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.json({ isLoggedIn: false });
        }
        res.json({
            isLoggedIn: true,
            userId: decoded.id,
            userName: decoded.name,
            userRole: decoded.role
        });
    });
});

// 2. Sign Up
app.post('/api/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: `${role} account created successfully. Please sign in.` });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already in use.' });
        }
        console.error("Signup failed:", error);
        res.status(500).json({ message: 'Registration failed. Server error.' });
    }
});

// 3. Login
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const user = await User.findOne({ email, role });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials or role.' });
        }

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role, name: user.name }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.cookie(JWT_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Login successful.',
            user: {
                id: user._id.toString(),
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login failed:", error);
        res.status(500).json({ message: 'Login failed. Server error.' });
    }
});

// 4. Logout
app.post('/api/logout', (req, res) => {
    res.cookie(JWT_COOKIE_NAME, '', { maxAge: 0, httpOnly: true });
    res.json({ message: 'Logged out successfully.' });
});

// 5. Upload New Course (Tutor only)
app.post('/api/courses', authenticateToken, upload.single('videoFile'), async (req, res) => {
    if (req.user.role !== 'Tutor') { return res.status(403).json({ message: 'Access denied.' }); }
    
    const { title, description } = req.body;
    const videoFile = req.file;

    if (!videoFile) { 
        console.error('Upload Error: No video file received or input name mismatch.');
        return res.status(400).json({ message: 'Video file is required. Ensure the input name is "videoFile".' }); 
    }

    try {
        const newCourse = new Course({
            tutor_id: req.user.id,
            tutorName: req.user.name,
            title,
            description,
            video_path: videoFile.filename 
        });
        await newCourse.save();
        res.status(201).json({ message: 'Course uploaded successfully!', course: newCourse });
    } catch (error) {
        console.error('Course upload failed (DB Save Error):', error);
        // Attempt to delete the partially uploaded file
        fs.unlink(videoFile.path, (err) => { 
            if (err) console.error("Error deleting temp file after DB failure:", err); 
        });
        res.status(500).json({ message: 'Failed to save course data to database.' });
    }
});

// 6. Fetch All Courses (Catalog)
app.get('/api/courses', async (req, res) => {
    try {
        // Fetch only courses with the 'tutorName' already stored in the document.
        const courses = await Course.find({}).select('-video_path'); 
        res.json({ courses });
    } catch (error) {
        console.error('Failed to fetch courses:', error);
        res.status(500).json({ message: 'Failed to retrieve course catalog.' });
    }
});

// 7. Fetch Tutor's Courses (Dashboard)
app.get('/api/tutor/courses', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Tutor') { return res.status(403).json({ message: 'Access denied.' }); }
    try {
        const courses = await Course.find({ tutor_id: req.user.id }).select('-video_path');
        res.json({ courses });
    } catch (error) {
        console.error('Failed to fetch tutor courses:', error);
        res.status(500).json({ message: 'Failed to retrieve your courses.' });
    }
});

// 7a. Fetch student's 'My Courses'
app.get('/api/student/my-courses', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Student') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    
    try {
        // Placeholder logic: Fetch first 3 courses
        const courses = await Course.find({})
            .limit(3) 
            .sort({ createdAt: 1 }); 

        const coursesWithDisplayData = courses.map(course => ({
            _id: course._id,
            title: course.title,
            description: course.description,
            tutorName: course.tutorName, 
        }));

        res.json({ courses: coursesWithDisplayData });

    } catch (error) {
        console.error('Student My Courses Error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve student courses.' });
    }
});


// 8. Fetch Course Details (FIXED: Ensure course returns the MongoDB _id)
app.get('/api/course/:id', authenticateToken, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) { return res.status(404).json({ message: 'Course not found.' }); }
        
        // Ensure the MongoDB _id is explicitly returned for the client-side video link
        const courseData = { 
            _id: course._id, // <-- **FIX**
            title: course.title, 
            description: course.description, 
            tutorName: course.tutorName 
        };

        res.json({ course: courseData, accessGranted: true });
    } catch (error) {
        console.error('Fetch Course Details Error:', error);
        res.status(500).json({ message: 'Failed to retrieve course details.' });
    }
});

// 9. Video Streaming (Protected) (FIXED: Added missing file logging)
app.get('/api/video/:id', authenticateToken, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) { return res.status(404).json({ success: false, message: 'Course not found.' }); }
        
        const videoPath = path.join(UPLOAD_DIR, course.video_path);
        
        // **CRITICAL DEBUGGING STEP FOR VIDEO:** Check if the file actually exists
        if (!fs.existsSync(videoPath)) { 
            console.error(`Video Streaming Error: File missing at expected path: ${videoPath}. Course ID: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Video file missing on server.' }); 
        }
        
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = { 
                'Content-Range': `bytes ${start}-${end}/${fileSize}`, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' 
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Video Streaming Error (Server):', error);
        res.status(500).json({ success: false, message: 'Server error while streaming video.' });
    }
});

// 10. Fetch Comments
app.get('/api/comments/:courseId', async (req, res) => {
    try {
        const comments = await Comment.find({ course_id: req.params.courseId }).sort({ createdAt: 1 }).select('userName content createdAt');
        res.json({ comments });
    } catch (error) {
        console.error('Fetch Comments Error:', error);
        res.status(500).json({ message: 'Failed to retrieve comments.' });
    }
});

// 11. Post Comment (Requires authentication) (FIXED: Added detailed error logging)
app.post('/api/comments', authenticateToken, async (req, res) => {
    const { courseId, content } = req.body;
    if (!content || !courseId) { return res.status(400).json({ message: 'Comment content and course ID are required.' }); }
    
    try {
        const newComment = new Comment({ course_id: courseId, user_id: req.user.id, userName: req.user.name, content });
        await newComment.save();
        res.json({ message: 'Comment posted successfully.', comment: newComment });
    } catch (error) {
        // **FIX:** Log the specific database error to the console for debugging
        console.error('Comment Post Error (DB):', error.message);
        res.status(500).json({ message: 'Failed to post comment. Check server console for details.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});