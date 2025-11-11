const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware Setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Helper function (In a real app, use bcrypt for hashing!)
function hashPassword(password) {
    return password; 
}

// --- Database Initialization (SQLite) ---
const db = new sqlite3.Database(path.join(__dirname, 'tutorhub.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // 1. Tutors Table
        db.run(`CREATE TABLE IF NOT EXISTS Tutors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating Tutors table:", err.message); });

        // 2. Courses Table - video_url now stores prefixed URL (e.g., 'youtube:ID' or 'local:path')
        db.run(`CREATE TABLE IF NOT EXISTS Courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutor_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            video_url TEXT,
            subtitle_url TEXT,
            chapters TEXT, -- JSON array
            FOREIGN KEY(tutor_id) REFERENCES Tutors(id)
        )`, (err) => { if (err) console.error("Error creating Courses table:", err.message); });

        // 3. Students Table
        db.run(`CREATE TABLE IF NOT EXISTS Students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (err) => { if (err) console.error("Error creating Students table:", err.message); });

        // 4. StudentCourses (Enrollments) Table
        db.run(`CREATE TABLE IF NOT EXISTS StudentCourses (
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            enrollment_date DATE DEFAULT CURRENT_TIMESTAMP,
            current_progress REAL DEFAULT 0.0, -- Stores video playback time in seconds
            PRIMARY KEY (student_id, course_id),
            FOREIGN KEY(student_id) REFERENCES Students(id),
            FOREIGN KEY(course_id) REFERENCES Courses(id)
        )`, (err) => { 
            if (err) { console.error("Error creating StudentCourses table:", err.message); } 
            else { console.log("All necessary tables ready."); }
        });
    }
});


// --- Helper Function ---
function processCourseData(course, isEnrolled = false, savedProgress = 0.0) {
    return {
        id: course.id,
        title: course.title,
        description: course.description ? course.description.substring(0, 100) + '...' : 'No description provided.',
        tutorName: course.tutor_name,
        enrollmentCount: course.enrollmentCount || 0,
        // Assuming tags are simple words starting with # in the description
        tags: (course.description || '').split(/\s+/).filter(word => word.startsWith('#')).map(tag => tag.substring(1).replace(/[^a-zA-Z0-9]/g, '')), 
        isEnrolled: isEnrolled,
        savedProgress: parseFloat(savedProgress) || 0.0 // Ensure it's a number
    };
}


// --- API Endpoints (Routes) ---

// ===============================================
// TUTOR API ENDPOINTS
// ===============================================

app.post('/api/tutor/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields.' });
    const hashedPassword = hashPassword(password);
    
    db.run(`INSERT INTO Tutors (name, email, password) VALUES (?, ?, ?)`, 
        [name, email, hashedPassword], 
        function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Tutor with this email already exists.' });
            return res.status(500).json({ error: 'Server error during registration.' });
        }
        res.status(201).json({ message: 'Registration successful. Please sign in.', tutorId: this.lastID });
    });
});

app.post('/api/tutor/signin', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password.' });
    const hashedPassword = hashPassword(password);
    
    db.get(`SELECT id, name, email FROM Tutors WHERE email = ? AND password = ?`, 
        [email, hashedPassword], 
        (err, row) => {
        if (err) return res.status(500).json({ error: 'Server error during login.' });
        if (row) {
            res.json({ message: 'Sign in successful!', tutor: { id: row.id, name: row.name, email: row.email } });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    });
});

app.post('/api/tutor/course', (req, res) => {
    const { tutorId, title, description, videoUrl, subtitleUrl, chapters } = req.body;
    
    if (!tutorId || !title || !description || !videoUrl) return res.status(400).json({ error: 'Missing core course details or video URL.' });

    const chaptersJsonString = JSON.stringify(chapters);
    
    db.run(`INSERT INTO Courses (tutor_id, title, description, video_url, subtitle_url, chapters) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tutorId, title, description, videoUrl, subtitleUrl, chaptersJsonString],
            function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Server error: Could not publish course.' });
        }
        res.status(201).json({ message: 'Course published successfully!', courseId: this.lastID });
    });
});

app.get('/api/tutor/courses/count/:tutorId', (req, res) => {
    const tutorId = parseInt(req.params.tutorId);
    
    db.get(`SELECT COUNT(id) AS count FROM Courses WHERE tutor_id = ?`, 
        [tutorId], 
        (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to count courses.' });
        }
        res.json({ count: row.count });
    });
});

// NEW ROUTE: Fetch all courses published by a specific tutor
app.get('/api/tutor/courses/:tutorId', (req, res) => {
    const tutorId = parseInt(req.params.tutorId);

    if (!tutorId) {
        return res.status(400).json({ error: 'Missing tutorId.' });
    }

    const sql = `
        SELECT 
            C.id, C.title, C.description,
            (SELECT COUNT(student_id) FROM StudentCourses WHERE course_id = C.id) AS enrollmentCount
        FROM Courses C
        WHERE C.tutor_id = ?
        ORDER BY C.id DESC;
    `;

    db.all(sql, [tutorId], (err, courses) => {
        if (err) {
            console.error("Tutor Courses SQL Error:", err.message);
            return res.status(500).json({ error: 'Failed to fetch tutor courses.', detail: err.message });
        }
        res.json(courses);
    });
});

// ===============================================
// STUDENT API ENDPOINTS
// ===============================================

app.post('/api/student/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields.' });

    const hashedPassword = hashPassword(password);
    
    db.run(`INSERT INTO Students (name, email, password) VALUES (?, ?, ?)`, 
            [name, email, hashedPassword], 
            function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Student with this email already exists.' });
            return res.status(500).json({ error: 'Server error during student registration.' });
        }
        res.status(201).json({ message: 'Student registration successful. Please sign in.', studentId: this.lastID });
    });
});

app.post('/api/student/signin', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = hashPassword(password);

    db.get(`SELECT id, name, email FROM Students WHERE email = ? AND password = ?`, 
            [email, hashedPassword], 
            (err, row) => {
        if (err) return res.status(500).json({ error: 'Server error during student login.' });
        if (row) {
            res.json({ message: 'Sign in successful!', student: { id: row.id, name: row.name, email: row.email } });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    });
});


// GET /api/courses - Fetches ALL available courses (Catalog View)
app.get('/api/courses', (req, res) => {
    const studentId = parseInt(req.query.studentId);
    
    // SQL to fetch all courses, Tutor name, and enrollment count
    const sql = `
        SELECT 
            C.id, C.title, C.description, C.chapters,
            T.name AS tutor_name,
            COUNT(SC_All.student_id) AS enrollmentCount
        FROM Courses C
        JOIN Tutors T ON C.tutor_id = T.id
        LEFT JOIN StudentCourses SC_All ON C.id = SC_All.course_id
        GROUP BY C.id
        ORDER BY C.id DESC;
    `;

    db.all(sql, [], (err, courses) => {
        if (err) {
            console.error("Catalog SQL Error:", err.message);
            return res.status(500).json({ error: 'Failed to fetch courses.' });
        }

        const courseIds = courses.map(c => c.id);
        
        if (studentId && courseIds.length > 0) {
            const placeholders = courseIds.map(() => '?').join(',');
            
            // Query to find which courses the current student is enrolled in (Enrollment Check)
            db.all(`SELECT course_id, current_progress FROM StudentCourses WHERE student_id = ? AND course_id IN (${placeholders})`, 
                [studentId, ...courseIds], 
                (err, enrollments) => {
                
                if (err) {
                    console.error("Enrollment check error:", err.message);
                    const enrichedCourses = courses.map(course => processCourseData(course));
                    return res.json(enrichedCourses);
                }

                // Map enrolled courses by ID for quick lookup
                const enrolledData = new Map(); 
                enrollments.forEach(e => {
                    enrolledData.set(e.course_id, e.current_progress);
                });
                
                // Process and enrich all courses
                const enrichedCourses = courses.map(course => {
                    const isEnrolled = enrolledData.has(course.id);
                    const savedProgress = isEnrolled ? enrolledData.get(course.id) : 0.0;
                    
                    return processCourseData(course, isEnrolled, savedProgress);
                });
                
                res.json(enrichedCourses);
            });
        } else {
            // No student logged in, return courses without enrollment status
            const enrichedCourses = courses.map(course => processCourseData(course));
            res.json(enrichedCourses);
        }
    });
});


// GET /api/student/mycourses - Fetches ONLY the student's enrolled courses (My Courses View)
app.get('/api/student/mycourses', (req, res) => {
    const studentId = parseInt(req.query.studentId);

    if (!studentId) {
        return res.status(400).json({ error: 'Missing studentId for My Courses lookup.' });
    }

    const sql = `
        SELECT 
            C.id, C.title, C.description, C.chapters,
            T.name AS tutor_name,
            SC_Current.current_progress,
            (SELECT COUNT(*) FROM StudentCourses SC_Count WHERE SC_Count.course_id = C.id) AS enrollmentCount
        FROM StudentCourses SC_Current
        JOIN Courses C ON SC_Current.course_id = C.id
        JOIN Tutors T ON C.tutor_id = T.id
        WHERE SC_Current.student_id = ?
        ORDER BY SC_Current.enrollment_date DESC;
    `;

    db.all(sql, [studentId], (err, courses) => {
        if (err) {
            console.error("My Courses SQL Error:", err.message);
            return res.status(500).json({ error: 'Failed to fetch enrolled courses.', detail: err.message });
        }

        const enrichedCourses = courses.map(course => 
            processCourseData(course, true, course.current_progress)
        );

        res.json(enrichedCourses);
    });
});


app.post('/api/student/enroll', (req, res) => {
    const { studentId, courseId } = req.body;
    
    db.get(`SELECT * FROM StudentCourses WHERE student_id = ? AND course_id = ?`, 
        [studentId, courseId], 
        (err, row) => {
        
        if (err) return res.status(500).json({ error: 'Server error during enrollment check.' });

        if (row) {
            return res.status(400).json({ message: 'Already enrolled in this course.' });
        }

        db.run(`INSERT INTO StudentCourses (student_id, course_id) VALUES (?, ?)`, 
            [studentId, courseId], 
            (insertErr) => {
            
            if (insertErr) {
                console.error(insertErr.message);
                return res.status(500).json({ error: 'Failed to enroll in course.' });
            }
            res.json({ message: 'Successfully registered for the course!' });
        });
    });
});


app.get('/api/course/:id', (req, res) => {
    const courseId = req.params.id;
    const studentId = req.query.studentId; 

    db.get(`SELECT 
                C.id, C.title, C.description, C.chapters, C.video_url, C.subtitle_url,
                T.name AS tutor_name
            FROM Courses C
            JOIN Tutors T ON C.tutor_id = T.id
            WHERE C.id = ?`, 
            [courseId], 
            (err, course) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch course details.' });
        if (!course) return res.status(404).json({ error: 'Course not found.' });

        const chapters = JSON.parse(course.chapters || '[]');
        
        const courseData = {
            id: course.id,
            title: course.title,
            description: course.description,
            tutorName: course.tutor_name,
            videoUrl: course.video_url, // This is the prefixed URL
            subtitleUrl: course.subtitle_url,
            chapters: chapters,
            savedProgress: 0.0 
        };

        if (studentId) {
            db.get(`SELECT current_progress FROM StudentCourses WHERE student_id = ? AND course_id = ?`, 
                [studentId, courseId], 
                (progressErr, progressRow) => {
                
                if (progressErr) {
                    console.error("Error fetching progress:", progressErr.message);
                } else if (progressRow) {
                    courseData.savedProgress = parseFloat(progressRow.current_progress) || 0.0;
                }
                
                res.json(courseData);
            });
        } else {
            res.json(courseData);
        }
    });
});


app.post('/api/student/progress', (req, res) => {
    const { studentId, courseId, progressTime } = req.body;

    if (!studentId || !courseId || progressTime === undefined || progressTime === null) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    db.run(
        `UPDATE StudentCourses SET current_progress = ? WHERE student_id = ? AND course_id = ?`,
        [parseFloat(progressTime), studentId, courseId],
        function(err) {
            if (err) {
                console.error("Error saving progress:", err.message);
                return res.status(500).json({ error: 'Failed to save progress.' });
            }
            if (this.changes === 0) {
                 db.run(`INSERT INTO StudentCourses (student_id, course_id, current_progress) VALUES (?, ?, ?)`,
                     [studentId, courseId, parseFloat(progressTime)],
                     (insertErr) => {
                         if (insertErr) {
                             console.error("Error inserting missing enrollment:", insertErr.message);
                             return res.status(500).json({ error: 'Enrollment not found and failed to create record.' });
                         }
                         return res.status(204).send(); 
                     });
                 return;
            }
            res.status(204).send(); 
        }
    );
});


// Start the Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Access the frontend via: http://localhost:${PORT}/index.html`);
});
// 
// 
// // server.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');

// const app = express();
// const PORT = 3000;

// // Middleware Setup
// // 1. Parse incoming request bodies in a middleware before your handlers
// app.use(bodyParser.json());
// // 2. Serve static files (our HTML, JS, CSS) from the root directory
// app.use(express.static(path.join(__dirname)));

// // --- Database Initialization (SQLite) ---
// const db = new sqlite3.Database(path.join(__dirname, 'tutorhub.db'), (err) => {
//     if (err) {
//         console.error('Error opening database:', err.message);
//     } else {
//         console.log('Connected to the SQLite database.');
//         // Create Tutors table if it doesn't exist
//         db.run(`CREATE TABLE IF NOT EXISTS Tutors (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             name TEXT NOT NULL,
//             email TEXT UNIQUE NOT NULL,
//             password TEXT NOT NULL,
//             bio TEXT,
//             uploaded_courses TEXT -- Store JSON string of course IDs/data
//         )`, (err) => {
//             if (err) {
//                 console.error("Error creating Tutors table:", err.message);
//             } else {
//                 console.log("Tutors table ready.");
//             }
//         });
//     }
// });

// // --- API Endpoints (Routes) ---

// // Test Route
// app.get('/api/status', (req, res) => {
//     res.json({ message: 'TutorHub API is running!' });
// });

// // Start the Server
// app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
//     console.log(`Access the frontend via: http://localhost:${PORT}/index.html`);
// });

// // server.js (Adding these routes below the existing code)

// // Helper function (In a real app, use bcrypt for hashing!)
// function hashPassword(password) {
//     // PROTOTYPE: Simple return, but shows where hashing happens.
//     return password; 
// }

// // POST /api/tutor/signup
// app.post('/api/tutor/signup', (req, res) => {
//     const { name, email, password } = req.body;
    
//     if (!name || !email || !password) {
//         return res.status(400).json({ error: 'Missing required fields.' });
//     }

//     const hashedPassword = hashPassword(password);
    
//     // Insert new tutor into the database
//     db.run(`INSERT INTO Tutors (name, email, password) VALUES (?, ?, ?)`, 
//            [name, email, hashedPassword], 
//            function(err) {
//         if (err) {
//             // Check for unique constraint error
//             if (err.message.includes('UNIQUE constraint failed')) {
//                 return res.status(409).json({ error: 'Tutor with this email already exists.' });
//             }
//             console.error(err.message);
//             return res.status(500).json({ error: 'Server error during registration.' });
//         }
//         // Success
//         res.status(201).json({ 
//             message: 'Registration successful. Please sign in.', 
//             tutorId: this.lastID 
//         });
//     });
// });

// // POST /api/tutor/signin
// app.post('/api/tutor/signin', (req, res) => {
//     const { email, password } = req.body;
    
//     if (!email || !password) {
//         return res.status(400).json({ error: 'Missing email or password.' });
//     }

//     const hashedPassword = hashPassword(password); // Match the hashing used in signup

//     // Find the tutor by email and check password
//     db.get(`SELECT id, name, email, password FROM Tutors WHERE email = ? AND password = ?`, 
//            [email, hashedPassword], 
//            (err, row) => {
//         if (err) {
//             console.error(err.message);
//             return res.status(500).json({ error: 'Server error during login.' });
//         }
        
//         if (row) {
//             // Success! In a real app, you would generate a JWT token here.
//             res.json({ 
//                 message: 'Sign in successful!', 
//                 tutor: { id: row.id, name: row.name, email: row.email }
//             });
//         } else {
//             // Failure
//             res.status(401).json({ error: 'Invalid email or password.' });
//         }
//     });
// });

// // server.js (Inside the db.run callback where the Tutors table is created)

// // ... after Tutors table is created successfully ...

// db.run(`CREATE TABLE IF NOT EXISTS Courses (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     tutor_id INTEGER NOT NULL,
//     title TEXT NOT NULL,
//     description TEXT,
//     video_url TEXT,
//     subtitle_url TEXT,
//     chapters TEXT, -- Store JSON array of chapter objects
//     FOREIGN KEY(tutor_id) REFERENCES Tutors(id)
// )`, (err) => {
//     if (err) {
//         console.error("Error creating Courses table:", err.message);
//     } else {
//         console.log("Courses table ready.");
//     }
// });

// // server.js (Add this route)

// // POST /api/tutor/course
// app.post('/api/tutor/course', (req, res) => {
//     const { tutorId, title, description, videoUrl, subtitleUrl, chapters } = req.body;
    
//     if (!tutorId || !title || !description) {
//         return res.status(400).json({ error: 'Missing core course details.' });
//     }

//     // Convert the chapters array (JSON) into a string for SQLite storage
//     const chaptersJsonString = JSON.stringify(chapters);
    
//     db.run(`INSERT INTO Courses (tutor_id, title, description, video_url, subtitle_url, chapters) 
//             VALUES (?, ?, ?, ?, ?, ?)`,
//            [tutorId, title, description, videoUrl, subtitleUrl, chaptersJsonString],
//            function(err) {
//         if (err) {
//             console.error(err.message);
//             return res.status(500).json({ error: 'Server error: Could not publish course.' });
//         }
        
//         // Success
//         res.status(201).json({ 
//             message: 'Course published successfully!', 
//             courseId: this.lastID 
//         });
//     });
// });

// // server.js (Inside the db.run callback where tables are created)

// db.run(`CREATE TABLE IF NOT EXISTS Students (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT NOT NULL,
//     email TEXT UNIQUE NOT NULL,
//     password TEXT NOT NULL,
//     enrolled_courses TEXT -- Store JSON array of course IDs the student is enrolled in
// )`, (err) => {
//     if (err) {
//         console.error("Error creating Students table:", err.message);
//     } else {
//         console.log("Students table ready.");
//     }
// });

// // server.js (Add these routes below the existing Tutor routes)

// // POST /api/student/signup
// app.post('/api/student/signup', (req, res) => {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//         return res.status(400).json({ error: 'Missing required fields.' });
//     }

//     const hashedPassword = hashPassword(password);
    
//     db.run(`INSERT INTO Students (name, email, password, enrolled_courses) VALUES (?, ?, ?, ?)`, 
//            [name, email, hashedPassword, JSON.stringify([])], 
//            function(err) {
//         if (err) {
//             if (err.message.includes('UNIQUE')) {
//                 return res.status(409).json({ error: 'Student with this email already exists.' });
//             }
//             return res.status(500).json({ error: 'Server error during student registration.' });
//         }
//         res.status(201).json({ 
//             message: 'Student registration successful. Please sign in.', 
//             studentId: this.lastID 
//         });
//     });
// });

// // POST /api/student/signin
// app.post('/api/student/signin', (req, res) => {
//     const { email, password } = req.body;
//     const hashedPassword = hashPassword(password);

//     db.get(`SELECT id, name, email FROM Students WHERE email = ? AND password = ?`, 
//            [email, hashedPassword], 
//            (err, row) => {
//         if (err) {
//             return res.status(500).json({ error: 'Server error during student login.' });
//         }
        
//         if (row) {
//             res.json({ 
//                 message: 'Sign in successful!', 
//                 student: { id: row.id, name: row.name, email: row.email }
//             });
//         } else {
//             res.status(401).json({ error: 'Invalid email or password.' });
//         }
//     });
// });

// // GET /api/courses - Fetches all available courses with tutor name and enrollment count (SIMULATED)
// app.get('/api/courses', (req, res) => {
//     // 1. Fetch all courses
//     db.all(`SELECT 
//                 C.id, C.title, C.description, C.chapters, C.tutor_id,
//                 T.name AS tutor_name
//             FROM Courses C
//             JOIN Tutors T ON C.tutor_id = T.id`, 
//             (err, courses) => {
//         if (err) {
//             console.error(err.message);
//             return res.status(500).json({ error: 'Failed to fetch courses.' });
//         }

//         // 2. Enhance courses with simulated enrollment and tags
//         const enrichedCourses = courses.map(course => ({
//             id: course.id,
//             title: course.title,
//             description: course.description.substring(0, 100) + '...',
//             tutorName: course.tutor_name,
//             // SIMULATION: Tags and Popularity are simulated for the prototype
//             tags: ['#NodeJS', '#Express', '#Database', '#FullStack'],
//             enrollmentCount: 5 + course.id * 3, // Simulate popularity based on ID
//         }));
        
//         res.json(enrichedCourses);
//     });
// });

// // POST /api/student/enroll - Endpoint to handle course registration
// app.post('/api/student/enroll', (req, res) => {
//     const { studentId, courseId } = req.body;
    
//     // In a real app, you'd check for double enrollment, charge money, etc.
//     // PROTOTYPE: Simply update the enrolled_courses JSON string for the student.
//     db.get(`SELECT enrolled_courses FROM Students WHERE id = ?`, [studentId], (err, row) => {
//         if (err || !row) {
//             return res.status(404).json({ error: 'Student not found.' });
//         }

//         const enrolled = JSON.parse(row.enrolled_courses || '[]');
//         if (enrolled.includes(courseId)) {
//             return res.status(400).json({ message: 'Already enrolled in this course.' });
//         }

//         enrolled.push(courseId);
        
//         db.run(`UPDATE Students SET enrolled_courses = ? WHERE id = ?`, 
//                [JSON.stringify(enrolled), studentId], 
//                (updateErr) => {
//             if (updateErr) {
//                 console.error(updateErr.message);
//                 return res.status(500).json({ error: 'Failed to enroll in course.' });
//             }
//             res.json({ message: 'Successfully registered for the course!' });
//         });
//     });
// });

// // server.js (Add this new route)

// // GET /api/course/:id - Fetches full details for a single course
// app.get('/api/course/:id', (req, res) => {
//     const courseId = req.params.id;

//     db.get(`SELECT 
//                 C.id, C.title, C.description, C.chapters, C.video_url, C.subtitle_url,
//                 T.name AS tutor_name
//             FROM Courses C
//             JOIN Tutors T ON C.tutor_id = T.id
//             WHERE C.id = ?`, 
//             [courseId], 
//             (err, course) => {
//         if (err) {
//             console.error(err.message);
//             return res.status(500).json({ error: 'Failed to fetch course details.' });
//         }
//         if (!course) {
//             return res.status(404).json({ error: 'Course not found.' });
//         }

//         // Parse chapters back into a usable array
//         const chapters = JSON.parse(course.chapters || '[]');
        
//         // Return the full course object
//         res.json({
//             id: course.id,
//             title: course.title,
//             description: course.description,
//             tutorName: course.tutor_name,
//             videoUrl: course.video_url,
//             subtitleUrl: course.subtitle_url,
//             chapters: chapters
//         });
//     });
// });

// // app.js (Add this function)

// function loadCoursePlayerView(courseId) {
//     const student = JSON.parse(localStorage.getItem('loggedInStudent'));

//     if (!student) {
//         alert("Please sign in as a student to view course content.");
//         loadStudentSignInView();
//         return;
//     }
    
//     // Initial loading state
//     $('#content-area').html(`
//         <h2 class="text-3xl font-bold text-gray-800 mb-6">Course Player</h2>
//         <p class="text-gray-500">Loading course content...</p>
//     `);

//     $.ajax({
//         url: `/api/course/${courseId}`,
//         type: 'GET',
//         success: function(course) {
//             console.log("Course loaded:", course);
            
//             const chaptersHtml = course.chapters.map((chapter, index) => `
//                 <a href="#" data-timestamp="${chapter.timestamp}" class="chapter-link block p-3 border-b border-gray-100 hover:bg-indigo-50 transition">
//                     <p class="text-sm font-semibold text-gray-800">Chapter ${index + 1}: ${chapter.title}</p>
//                     <p class="text-xs text-indigo-600">${chapter.timestamp}</p>
//                 </a>
//             `).join('');

//             const playerHtml = `
//                 <h2 class="text-3xl font-bold text-gray-800 mb-2">${course.title}</h2>
//                 <p class="text-lg text-indigo-700 mb-6">Taught by: **${course.tutorName}**</p>

//                 <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
//                     <div class="lg:col-span-2">
//                         <div class="w-full bg-black rounded-lg shadow-xl mb-6">
//                             <video id="course-video-player" controls preload="metadata" class="w-full rounded-lg" poster="placeholder_poster.jpg">
//                                 <source src="${course.videoUrl}" type="video/mp4">
//                                 <track kind="captions" src="${course.subtitleUrl}" srclang="en" label="English">
//                                 Your browser does not support the video tag.
//                             </video>
//                         </div>
                        
//                         <div class="mt-8 p-6 bg-white rounded-lg shadow-md border-t-4 border-indigo-500">
//                             <h3 class="text-2xl font-semibold text-gray-800 mb-3">Course Description</h3>
//                             <p class="text-gray-700 whitespace-pre-wrap">${course.description}</p>
//                         </div>
//                     </div>

//                     <div class="lg:col-span-1">
//                         <div class="bg-white rounded-lg shadow-xl overflow-hidden sticky top-4">
//                             <div class="p-4 bg-indigo-700 text-white font-semibold">
//                                 Course Content / Chapters
//                             </div>
//                             <div id="chapter-list-nav" class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
//                                 ${chaptersHtml}
//                                 ${course.chapters.length === 0 ? '<p class="p-4 text-center text-gray-500">No chapters defined.</p>' : ''}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             `;
//             $('#content-area').html(playerHtml);
//             setupPlayerHandlers();
//         },
//         error: function() {
//             $('#content-area').html('<p class="text-red-500">Error loading course details.</p>');
//         }
//     });
// }


// // app.js (Add this function)

// function setupPlayerHandlers() {
//     const videoPlayer = document.getElementById('course-video-player');
    
//     // Convert a timestamp string (e.g., "1:35") into seconds
//     function timestampToSeconds(timestamp) {
//         const parts = timestamp.split(':').map(Number);
//         if (parts.length === 2) {
//             return parts[0] * 60 + parts[1]; // Minutes and Seconds
//         } else if (parts.length === 3) {
//             return parts[0] * 3600 + parts[1] * 60 + parts[2]; // Hours, Minutes, Seconds
//         }
//         return 0; // Default to start if format is unexpected
//     }

//     // Attach click handler to all chapter links using delegation
//     $('#chapter-list-nav').on('click', '.chapter-link', function(e) {
//         e.preventDefault();
        
//         const timestamp = $(this).data('timestamp');
//         const seekTime = timestampToSeconds(timestamp);
        
//         if (videoPlayer) {
//             videoPlayer.currentTime = seekTime;
//             videoPlayer.play(); // Auto-play after seeking
//         }
        
//         // Optional: Highlight the active chapter link
//         $('.chapter-link').removeClass('bg-indigo-100');
//         $(this).addClass('bg-indigo-100');
//     });
// }




// // Export the database instance for use in other route files (future scaling)
// module.exports = db;