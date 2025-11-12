// app.js (Complete Frontend Code with Local Storage Database Simulation)

// ===============================================
// LOCAL STORAGE DATABASE SIMULATION
// ===============================================

// Global variable for managing unique IDs
let nextCourseId = 1;
let nextCommentId = 1;

function initializeDatabase() {
    // 1. Core "Tables" Initialization
    // Check if the keys exist, if not, initialize them as empty arrays.
    
    // USERS: Initialize with empty student and tutor lists
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify({ tutors: [], students: [] }));
    } else {
         // Re-parse and check for users structure integrity if key exists
        const users = JSON.parse(localStorage.getItem('users'));
        if (!users.tutors) users.tutors = [];
        if (!users.students) users.students = [];
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // COURSES: START EMPTY - ONLY TUTOR-CREATED COURSES ALLOWED
    if (!localStorage.getItem('courses') || JSON.parse(localStorage.getItem('courses')).length === 0) {
        localStorage.setItem('courses', JSON.stringify([]));
        nextCourseId = 1; 
    } else {
         // Update nextCourseId based on existing courses
        const existingCourses = JSON.parse(localStorage.getItem('courses'));
        if (existingCourses.length > 0) {
             nextCourseId = Math.max(...existingCourses.map(c => c.id)) + 1;
        } else {
             nextCourseId = 1;
        }
    }
    
    // COURSE ASSETS (Video/Subtitle Metadata)
    if (!localStorage.getItem('courseAssets')) localStorage.setItem('courseAssets', JSON.stringify([]));
    
    // 2. Enrollment and Progress
    if (!localStorage.getItem('studentEnrollments')) localStorage.setItem('studentEnrollments', JSON.stringify([]));
    if (!localStorage.getItem('studentProgress')) localStorage.setItem('studentProgress', JSON.stringify([]));
    
    // 3. NEW: Comments "Table"
    if (!localStorage.getItem('comments')) localStorage.setItem('comments', JSON.stringify([]));
    
    // Update nextCommentId based on existing comments
    const existingComments = JSON.parse(localStorage.getItem('comments'));
    if (existingComments.length > 0) {
        nextCommentId = Math.max(...existingComments.map(c => c.id)) + 1;
    } else {
        nextCommentId = 1;
    }
}

// Helper to get ALL course data (merging course, assets, tutor info)
function getFullCourseData(courseId, studentId = null) {
    const courses = JSON.parse(localStorage.getItem('courses'));
    const assets = JSON.parse(localStorage.getItem('courseAssets'));
    const users = JSON.parse(localStorage.getItem('users'));
    const students = JSON.parse(localStorage.getItem('studentEnrollments'));
    const progress = JSON.parse(localStorage.getItem('studentProgress'));
    const tutors = users.tutors;

    let targetCourses = courseId ? courses.filter(c => c.id === courseId) : courses;
    
    const fullCourses = targetCourses.map(course => {
        const asset = assets.find(a => a.courseId === course.id) || {};
        const tutor = tutors.find(t => t.id === course.tutorId) || { name: 'Unknown Tutor' };
        
        let isEnrolled = false;
        let savedProgress = 0;
        
        if (studentId) {
            isEnrolled = students.some(e => e.studentId === studentId && e.courseId === course.id);
            const prog = progress.find(p => p.studentId === studentId && p.courseId === course.id);
            savedProgress = prog ? prog.progressTime : 0;
        }

        return {
            ...course,
            tutorName: tutor.name,
            videoUrl: asset.videoUrl || '',
            subtitleUrl: asset.subtitleUrl || '',
            isEnrolled: isEnrolled,
            savedProgress: savedProgress,
        };
    });

    return courseId ? fullCourses[0] : fullCourses;
}

// Helper to get courses for a specific tutor
function getCoursesByTutor(tutorId) {
    const fullCourses = getFullCourseData();
    return fullCourses.filter(course => course.tutorId === tutorId);
}

// Helper to save new course data
function saveNewCourse(courseData, assetData) {
    const courses = JSON.parse(localStorage.getItem('courses'));
    const assets = JSON.parse(localStorage.getItem('courseAssets'));
    
    // Assign new unique ID
    const newCourseId = nextCourseId++; 
    
    // Create new course object
    const newCourse = {
        id: newCourseId,
        tutorId: courseData.tutorId,
        title: courseData.title,
        description: courseData.description,
        chapters: courseData.chapters,
        tags: courseData.tags || ['uncategorized'],
        enrollmentCount: 0 
    };
    
    // Create new asset object
    const newAsset = {
        courseId: newCourseId,
        videoUrl: assetData.videoUrl,
        subtitleUrl: assetData.subtitleUrl,
    };
    
    courses.push(newCourse);
    assets.push(newAsset);

    localStorage.setItem('courses', JSON.stringify(courses));
    localStorage.setItem('courseAssets', JSON.stringify(assets));

    return newCourse;
}

// NEW: Helper to delete course and all associated data
function deleteCourse(courseId) {
    const courses = JSON.parse(localStorage.getItem('courses')).filter(c => c.id !== courseId);
    const assets = JSON.parse(localStorage.getItem('courseAssets')).filter(a => a.courseId !== courseId);
    const enrollments = JSON.parse(localStorage.getItem('studentEnrollments')).filter(e => e.courseId !== courseId);
    const progress = JSON.parse(localStorage.getItem('studentProgress')).filter(p => p.courseId !== courseId);
    const comments = JSON.parse(localStorage.getItem('comments')).filter(c => c.courseId !== courseId);

    localStorage.setItem('courses', JSON.stringify(courses));
    localStorage.setItem('courseAssets', JSON.stringify(assets));
    localStorage.setItem('studentEnrollments', JSON.stringify(enrollments));
    localStorage.setItem('studentProgress', JSON.stringify(progress));
    localStorage.setItem('comments', JSON.stringify(comments));

    console.log(`Course ID ${courseId} and all associated data deleted.`);
}

// ===============================================
// CORE NAVIGATION & UTILITIES
// ===============================================

function updateNavVisibility(userType, isLoggedIn) {
    // 1. Reset all visibility
    $('#student-nav').hide();
    $('#tutor-auth-nav').hide();
    $('#tutor-dashboard-nav').empty().hide();

    if (isLoggedIn) {
        if (userType === 'Tutor') {
            const tutor = JSON.parse(localStorage.getItem('loggedInTutor'));
            $('#tutor-dashboard-nav').html(`
                <a href="#" id="tutor-dashboard-link" class="text-white hover:text-indigo-200 transition font-medium">Dashboard</a>
                <span class="text-white">|</span>
                <span class="text-white">Hi, ${tutor.name}</span>
                <button id="nav-sign-out" data-user-type="Tutor" class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition">Sign Out</button>
            `).show();
        } else if (userType === 'Student') {
            const student = JSON.parse(localStorage.getItem('loggedInStudent'));
             $('#tutor-dashboard-nav').html(`
                <a href="#" id="student-tutorials-link" class="text-white hover:text-indigo-200 transition font-medium">My Courses</a>
                <span class="text-white">|</span>
                <span class="text-white">Hi, ${student.name}</span>
                <button id="nav-sign-out" data-user-type="Student" class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition">Sign Out</button>
            `).show();
        }
    } else {
        $('#student-nav').show();
        $('#tutor-auth-nav').show();
    }

    // This should be the last line in the function:
    updateMobileMenuLinks();
}

// Combined Sign Out Handler
$('body').off('click', '#nav-sign-out').on('click', '#nav-sign-out', function(e) {
    e.preventDefault();
    const userType = $(this).data('user-type');
    
    if (userType === 'Tutor') {
        localStorage.removeItem('loggedInTutor');
    } else if (userType === 'Student') {
        localStorage.removeItem('loggedInStudent');
    }
    
    alert("You have been signed out.");
    updateNavVisibility('', false);
    loadStudentSignInView(); 
});


// ===============================================
// 1. TUTOR AUTHENTICATION VIEWS & HANDLERS
// ===============================================

function loadTutorSignUpView() {
    const signUpHtml = `
        <div class="max-w-md mx-auto">
            <h2 class="text-3xl font-semibold text-gray-800 mb-6 text-center">Tutor Registration</h2>
            <form id="tutor-signup-form" class="space-y-4 p-6 bg-white rounded-lg shadow-lg">
                <div><label for="signup-name" class="block text-sm font-medium text-gray-700">Full Name</label><input type="text" id="signup-name" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></div>
                <div><label for="signup-email" class="block text-sm font-medium text-gray-700">Email Address</label><input type="email" id="signup-email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></div>
                <div><label for="signup-password" class="block text-sm font-medium text-gray-700">Password</label><input type="password" id="signup-password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></div>
                <button type="submit" class="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">Register as a Tutor</button>
                <p class="text-center text-sm mt-4">Already have an account? <a href="#" id="switch-to-sign-in" class="font-medium text-indigo-600 hover:text-indigo-500">Sign In</a></p>
            </form>
            <div id="auth-message" class="mt-4 p-3 hidden rounded-md text-sm font-medium"></div>
        </div>
    `;
    $('#content-area').html(signUpHtml);
    setupSignUpHandler();
}

function loadTutorSignInView() {
    const signInHtml = `
        <div class="max-w-md mx-auto">
            <h2 class="text-3xl font-semibold text-gray-800 mb-6 text-center">Tutor Login</h2>
            <form id="tutor-signin-form" class="space-y-4 p-6 bg-white rounded-lg shadow-lg">
                <div><label for="signin-email" class="block text-sm font-medium text-gray-700">Email Address</label><input type="email" id="signin-email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></div>
                <div><label for="signin-password" class="block text-sm font-medium text-gray-700">Password</label><input type="password" id="signin-password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></div>
                <button type="submit" class="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition">Sign In to Dashboard</button>
                <p class="text-center text-sm mt-4">Don't have an account? <a href="#" id="switch-to-sign-up" class="font-medium text-indigo-600 hover:text-indigo-500">Sign Up</a></p>
            </form>
            <div id="auth-message" class="mt-4 p-3 hidden rounded-md text-sm font-medium"></div>
        </div>
    `;
    $('#content-area').html(signInHtml);
    setupSignInHandler();
    
    $('#content-area').off('click', '#switch-to-sign-up').on('click', '#switch-to-sign-up', function(e) {
        e.preventDefault();
        loadTutorSignUpView();
    });
}

function setupSignUpHandler() {
    $('#tutor-signup-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        const name = $('#signup-name').val();
        const email = $('#signup-email').val();
        const password = $('#signup-password').val();
        const authMessage = $('#auth-message'); 

        authMessage.hide();

        // --- Mock Server Call: Save to Local Storage ---
        const users = JSON.parse(localStorage.getItem('users'));
        const newId = users.tutors.length > 0 ? Math.max(...users.tutors.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, name: name, email: email, password: password };

        if (users.tutors.some(u => u.email === email)) {
            alert('Sign Up Failed: A tutor with this email already exists.');
            return;
        }

        users.tutors.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        // --- End Mock Server Call ---
        
        alert(`Tutor ${name} registered successfully!`); 
        loadTutorSignInView(); 
    });
    
    $('#content-area').off('click', '#switch-to-sign-in').on('click', '#switch-to-sign-in', function(e) {
        e.preventDefault();
        loadTutorSignInView();
    });
}

function setupSignInHandler() {
    $('#tutor-signin-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#signin-email').val();
        const password = $('#signin-password').val();
        const messageDiv = $('#auth-message');
        
        messageDiv.removeClass().addClass('mt-4 p-3 rounded-md text-sm font-medium hidden');
        
        // --- Mock Server Call: Check credentials ---
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.tutors.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('loggedInTutor', JSON.stringify(user));
            messageDiv.removeClass('hidden').addClass('bg-green-100 text-green-700').text(`Welcome back, ${user.name}! Redirecting to Dashboard...`);
            updateNavVisibility('Tutor', true);
            setTimeout(loadTutorDashboardView, 1500); 
        } else {
            messageDiv.removeClass('hidden').addClass('bg-red-100 text-red-700').text('Login failed. Invalid email or password.');
        }
        // --- End Mock Server Call ---
    });
}

// ===============================================
// 2. TUTOR DASHBOARD & COURSE MANAGEMENT
// ===============================================
function loadTutorDashboardView() {
    const loggedInTutor = JSON.parse(localStorage.getItem('loggedInTutor'));
    
    if (!loggedInTutor) {
        loadTutorSignInView();
        return;
    }
    
    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">👋 Welcome to your Dashboard, ${loggedInTutor.name}!</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-stats-container">
            
            <div id="course-count-card" class="bg-indigo-600 text-white p-6 rounded-lg shadow-xl">
                <p class="text-sm uppercase opacity-80">Total Courses Published</p>
                <p class="text-4xl font-extrabold mt-1">...</p>
                <p class="text-sm mt-3"><a href="#" id="view-my-courses" class="underline hover:text-indigo-200">View/Manage Courses</a></p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-xl border-t-4 border-green-500">
                <p class="text-xl font-semibold text-gray-800 mb-3">Quick Action</p>
                <button id="add-new-course" class="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                    + Add New Course Video
                </button>
            </div>

        </div>
    `);
    
    fetchTutorCourseCount(loggedInTutor.id);
    setupDashboardHandlers();
}

// Fetches count directly from Local Storage
function fetchTutorCourseCount(tutorId) {
    const courses = JSON.parse(localStorage.getItem('courses'));
    const count = courses.filter(c => c.tutorId === tutorId).length;
    $('#course-count-card .text-4xl').text(count); 
}

function setupDashboardHandlers() {
    $('#add-new-course').off('click').on('click', function() {
        loadCourseUploadView();
    });
    
    $('#view-my-courses').off('click').on('click', function(e) { 
        e.preventDefault(); 
        loadTutorCoursesView();
    });
    
    $('body').off('click', '#tutor-dashboard-link').on('click', '#tutor-dashboard-link', function(e) {
        e.preventDefault();
        loadTutorDashboardView();
    });
}

function setupTutorCourseListHandlers() {
    // UPDATED: Handle Course Deletion
    $('#content-area').off('click', '.delete-course-btn').on('click', '.delete-course-btn', function(e) {
        e.preventDefault();
        const courseId = parseInt($(this).data('course-id'));
        const courseTitle = $(this).data('course-title');

        if (confirm(`Are you sure you want to PERMANENTLY delete the course: "${courseTitle}"? This cannot be undone.`)) {
            deleteCourse(courseId);
            loadTutorCoursesView(); // Reload the course list
            fetchTutorCourseCount(JSON.parse(localStorage.getItem('loggedInTutor')).id); // Update count
        }
    });
}

// UPDATED: Fetches courses directly from Local Storage
function loadTutorCoursesView() {
    const tutor = JSON.parse(localStorage.getItem('loggedInTutor'));
    
    if (!tutor) {
        loadTutorSignInView();
        return;
    }
    
    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">📝 My Published Courses</h2>
        <div id="tutor-course-list" class="space-y-4">
            <p class="text-gray-500">Loading your courses...</p>
        </div>
        <button onclick="loadTutorDashboardView()" class="mt-6 bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition">Back to Dashboard</button>
    `);
    
    // Fetch and render the courses using the Local Storage Helper
    const courses = getCoursesByTutor(tutor.id);
    const listContainer = $('#tutor-course-list');
    listContainer.empty();

    if (courses.length === 0) {
        listContainer.html('<p class="text-gray-500 p-4 border rounded-md">You have not published any courses yet. <a href="#" id="add-from-list" class="font-semibold text-indigo-600">Add one now!</a></p>');
        $('#add-from-list').on('click', function(e) {
            e.preventDefault();
            loadCourseUploadView();
        });
        return;
    }

    const coursesHtml = courses.map(course => `
        <div class="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div>
                <p class="text-lg font-semibold text-gray-900">${course.title}</p>
                <p class="text-sm text-gray-500">${course.description.substring(0, 70)}...</p>
            </div>
            <div class="flex items-center space-x-4">
                <span class="text-sm font-medium text-green-600">${course.enrollmentCount} Enrolled</span>
                <button data-course-id="${course.id}" data-course-title="${course.title}" class="delete-course-btn bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition">Delete Course</button>
            </div>
        </div>
    `).join('');

    listContainer.html(coursesHtml);
    setupTutorCourseListHandlers();
}

function loadCourseUploadView() {
    const uploadHtml = `
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Create New Course / Video Tutorial</h2>
        <form id="course-upload-form" class="space-y-6">
            <div class="p-6 bg-gray-50 rounded-lg shadow-inner">
                <h3 class="text-xl font-semibold text-indigo-700 mb-4">1. Course Details</h3>
                <div><label for="course-title" class="block text-sm font-medium text-gray-700">Course Title</label><input type="text" id="course-title" required class="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500"></div>
                <div><label for="course-desc" class="block text-sm font-medium text-gray-700">Description</label><textarea id="course-desc" rows="3" required class="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500"></textarea></div>
            </div>
            
            <div class="p-6 bg-gray-50 rounded-lg shadow-inner">
                <h3 class="text-xl font-semibold text-indigo-700 mb-4">2. Video Source & Accessibility</h3>
                
                <div class="flex space-x-6 mb-4">
                    <label class="inline-flex items-center">
                        <input type="radio" name="video-source-type" value="local" checked class="form-radio text-indigo-600" id="source-local">
                        <span class="ml-2">Local Video File</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" name="video-source-type" value="youtube" class="form-radio text-indigo-600" id="source-youtube">
                        <span class="ml-2">YouTube Embed</span>
                    </label>
                </div>

                <div id="video-source-inputs">
                    <div id="input-local">
                        <div><label for="video-file-input" class="block text-sm font-medium text-gray-700">Select Video File (.mp4)</label>
                            <input type="file" id="video-file-input" accept="video/mp4" required class="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500">
                            <p class="text-xs text-gray-500 mt-1 text-red-600 font-semibold">NOTE: Students will need to select this SAME file to play it locally.</p>
                        </div>
                    </div>
                    <div id="input-youtube" class="hidden">
                        <div><label for="youtube-id-input" class="block text-sm font-medium text-gray-700">YouTube Video ID (e.g., dQw4w9WgXcQ)</label><input type="text" id="youtube-id-input" class="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500"><p class="text-xs text-gray-500 mt-1">Only the ID is required (the part after v=).</p></div>
                    </div>
                </div>

                <div class="mt-4"><label for="subtitle-file-input" class="block text-sm font-medium text-gray-700">Subtitle File (.vtt or .srt)</label>
                    <input type="file" id="subtitle-file-input" accept=".vtt,.srt" class="mt-1 block w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 focus:border-indigo-500">
                    <p class="text-xs text-gray-500 mt-1">Optional. Subtitle file will also be needed by the student locally.</p>
                </div>
            </div>
            
            <div class="p-6 bg-gray-50 rounded-lg shadow-inner">
                <h3 class="text-xl font-semibold text-indigo-700 mb-4">3. Tutorial Partitions (Chapters)</h3>
                <div id="chapter-list-editor" class="space-y-3 mb-4">
                    <div class="flex space-x-2">
                        <input type="text" placeholder="Chapter Title (e.g., Introduction)" class="flex-grow border border-gray-300 rounded-md p-2 text-sm chapter-title-input">
                        <input type="text" placeholder="Timestamp (e.g., 0:00)" class="w-24 border border-gray-300 rounded-md p-2 text-sm chapter-timestamp-input">
                    </div>
                </div>
                <button type="button" id="add-chapter-btn" class="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center">
                    <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Add Chapter
                </button>
            </div>
            <button type="submit" class="w-full py-3 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 font-semibold transition">Publish Course</button>
        </form>
    `;
    $('#content-area').html(uploadHtml);
    setupCourseUploadHandlers();
}

// Saves course/asset data directly to Local Storage
function setupCourseUploadHandlers() {
    $('#add-chapter-btn').off('click').on('click', function() {
        const chapterHtml = `
            <div class="flex space-x-2 mt-2 items-center">
                <input type="text" placeholder="Chapter Title" class="flex-grow border border-gray-300 rounded-md p-2 text-sm chapter-title-input">
                <input type="text" placeholder="Timestamp (0:00)" class="w-24 border border-gray-300 rounded-md p-2 text-sm chapter-timestamp-input">
                <button type="button" class="remove-chapter-btn text-red-500 hover:text-red-700 p-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `;
        $('#chapter-list-editor').append(chapterHtml);
    });

    $('#content-area').off('click', '.remove-chapter-btn').on('click', '.remove-chapter-btn', function() {
        $(this).parent().remove();
    });
    
    // Video Source Switcher Logic
    $('input[name="video-source-type"]').off('change').on('change', function() {
        const type = $(this).val();
        $('#input-local, #input-youtube').addClass('hidden');
        $(`#input-${type}`).removeClass('hidden');
        
        // Update required status
        $('#video-file-input, #youtube-id-input').prop('required', false).val('');
        if (type === 'local') {
            $('#video-file-input').prop('required', true);
        } else if (type === 'youtube') {
            $('#youtube-id-input').prop('required', true);
        }
    }).trigger('change');

    $('#course-upload-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        const tutor = JSON.parse(localStorage.getItem('loggedInTutor'));
        if (!tutor) {
            alert('Please sign in as a tutor to upload a course.');
            loadTutorSignInView();
            return;
        }

        const chapters = [];
        $('#chapter-list-editor').find('.flex').each(function() { 
            const title = $(this).find('.chapter-title-input').val();
            const timestamp = $(this).find('.chapter-timestamp-input').val();
            if (title && timestamp) {
                chapters.push({ title: title, timestamp: timestamp });
            }
        });
        
        const sourceType = $('input[name="video-source-type"]:checked').val();
        let videoUrl = '';
        let subtitleUrl = '';
        
        if (sourceType === 'local') {
            const fileInput = $('#video-file-input')[0];
            if (!fileInput.files.length) {
                 alert('Please select a video file.');
                 return;
            }
            const file = fileInput.files[0];
            videoUrl = 'local:' + JSON.stringify({ name: file.name, size: file.size, type: file.type });
            
            const subtitleFile = $('#subtitle-file-input')[0];
            if (subtitleFile.files.length) {
                 const subFile = subtitleFile.files[0];
                 subtitleUrl = 'local:' + JSON.stringify({ name: subFile.name, size: subFile.size, type: subFile.type });
            }
            
        } else if (sourceType === 'youtube') {
            const youtubeId = $('#youtube-id-input').val().trim();
            if (!youtubeId) {
                alert('Please enter a YouTube video ID.');
                return;
            }
            videoUrl = 'youtube:' + youtubeId;
            const subtitleFile = $('#subtitle-file-input')[0];
            if (subtitleFile.files.length) {
                 const subFile = subtitleFile.files[0];
                 subtitleUrl = 'local:' + JSON.stringify({ name: subFile.name, size: subFile.size, type: subFile.type });
            }
        }


        const courseData = {
            tutorId: tutor.id, 
            title: $('#course-title').val(),
            description: $('#course-desc').val(),
            chapters: chapters
        };
        
        const assetData = {
            videoUrl: videoUrl,
            subtitleUrl: subtitleUrl
        };
        
        // --- LOCAL STORAGE PERSISTENCE ---
        try {
            const newCourse = saveNewCourse(courseData, assetData);
            alert(`Course "${newCourse.title}" (ID: ${newCourse.id}) published successfully!`);
            loadTutorDashboardView();
        } catch (e) {
            console.error("Local Storage Save Error:", e);
            alert(`Publishing Failed: Error saving data to browser storage.`);
        }
        // --- END LOCAL STORAGE PERSISTENCE ---
    });
}


// ===============================================
// 3. STUDENT AUTHENTICATION & CATALOG
// ===============================================

function loadStudentSignUpView() {
    const html = `
        <div class="max-w-md mx-auto">
            <h2 class="text-3xl font-semibold text-gray-800 mb-6 text-center">Student Registration</h2>
            <form id="student-signup-form" class="space-y-4 p-6 bg-white rounded-lg shadow-lg">
                <div><label for="s-signup-name" class="block text-sm font-medium text-gray-700">Full Name</label><input type="text" id="s-signup-name" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"></div>
                <div><label for="s-signup-email" class="block text-sm font-medium text-gray-700">Email Address</label><input type="email" id="s-signup-email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"></div>
                <div><label for="s-signup-password" class="block text-sm font-medium text-gray-700">Password</label><input type="password" id="s-signup-password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"></div>
                <button type="submit" class="w-full py-3 px-4 rounded-md text-white bg-green-600 hover:bg-green-700 transition">Register as a Student</button>
            </form>
            <p class="text-center text-sm mt-4">Already registered? <a href="#" id="switch-to-student-sign-in" class="font-medium text-indigo-600 hover:text-indigo-500">Login here</a></p>
            <div id="student-auth-message" class="mt-4 p-3 hidden rounded-md text-sm font-medium"></div>
        </div>
    `;
    $('#content-area').html(html);
    setupStudentAuthHandlers();
}

function loadStudentSignInView() {
    const html = `
        <div class="max-w-md mx-auto">
            <h2 class="text-3xl font-semibold text-gray-800 mb-6 text-center">Student Login</h2>
            <form id="student-signin-form" class="space-y-4 p-6 bg-white rounded-lg shadow-lg">
                <div><label for="s-signin-email" class="block text-sm font-medium text-gray-700">Email Address</label><input type="email" id="s-signin-email" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"></div>
                <div><label for="s-signin-password" class="block text-sm font-medium text-gray-700">Password</label><input type="password" id="s-signin-password" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"></div>
                <button type="submit" class="w-full py-3 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition">Sign In to Dashboard</button>
            </form>
            <p class="text-center text-sm mt-4">New user? <a href="#" id="switch-to-student-sign-up" class="font-medium text-indigo-600 hover:text-indigo-500">Register here</a></p>
            <div id="student-auth-message" class="mt-4 p-3 hidden rounded-md text-sm font-medium"></div>
        </div>
    `;
    $('#content-area').html(html);
    setupStudentAuthHandlers();
}

function setupStudentAuthHandlers() {
    const messageDiv = $('#student-auth-message');

    $('#content-area').off('click', '#switch-to-student-sign-in').on('click', '#switch-to-student-sign-in', function(e) {
        e.preventDefault();
        loadStudentSignInView();
    });
    $('#content-area').off('click', '#switch-to-student-sign-up').on('click', '#switch-to-student-sign-up', function(e) {
        e.preventDefault();
        loadStudentSignUpView();
    });

    $('#student-signup-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        const name = $('#s-signup-name').val();
        const email = $('#s-signup-email').val();
        const password = $('#s-signup-password').val();

        // --- Mock Server Call: Save to Local Storage ---
        const users = JSON.parse(localStorage.getItem('users'));
        const newId = users.students.length > 0 ? Math.max(...users.students.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, name: name, email: email, password: password };

        if (users.students.some(u => u.email === email)) {
            alert('Registration Failed: A student with this email already exists.');
            return;
        }

        users.students.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        // --- End Mock Server Call ---
        
        alert(`Student ${name} registered successfully!`);
        loadStudentSignInView();
    });

    $('#student-signin-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        const email = $('#s-signin-email').val();
        const password = $('#s-signin-password').val();
        
        messageDiv.removeClass().addClass('mt-4 p-3 rounded-md text-sm font-medium hidden');

        // --- Mock Server Call: Check credentials ---
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.students.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('loggedInStudent', JSON.stringify(user));
            messageDiv.removeClass('hidden').addClass('bg-green-100 text-green-700').text(`Welcome back, ${user.name}! Loading courses...`);
            updateNavVisibility('Student', true); 
            setTimeout(loadStudentCourseCatalog, 1500); 
        } else {
            messageDiv.removeClass('hidden').addClass('bg-red-100 text-red-700').text('Login failed. Invalid email or password.');
        }
        // --- End Mock Server Call ---
    });
}

// ===============================================
// 4. SEARCH, FILTER, AND CARD HELPERS
// ===============================================
function createCourseCard(course, actionButton) {
    const tagsHtml = course.tags.map(tag => 
        `<span class="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full mr-2">#${tag}</span>`
    ).join('');
    
    let progressDisplay = '';
    if (course.isEnrolled) {
        const progressMinutes = (parseFloat(course.savedProgress || 0) / 60).toFixed(0); 
        progressDisplay = `<p class="text-sm font-semibold text-gray-700 mt-2">Progress: **${progressMinutes} minutes viewed**</p>`;
    }
    
    return `
        <div class="bg-white border-t-4 border-indigo-500 rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div class="p-6 flex-grow">
                <h3 class="text-xl font-bold text-gray-900 mb-2">${course.title}</h3>
                <p class="text-sm text-gray-600 mb-4">Tutor: **${course.tutorName}**</p>
                <p class="text-gray-700 text-sm mb-4">${course.description}</p>
                <div class="mb-4">${tagsHtml}</div>
                ${progressDisplay}
            </div>
            <div class="p-6 bg-gray-50 border-t flex justify-between items-center">
                <div>
                    <p class="text-xs text-gray-500 uppercase">Enrolled</p>
                    <p class="text-lg font-bold text-green-600" data-course-id="${course.id}" id="count-${course.id}">${course.enrollmentCount}</p>
                </div>
                ${actionButton}
            </div>
        </div>
    `;
}

function applyFiltersAndSearch(courses, searchTerm, filter) {
    let filtered = courses;
    const searchLower = searchTerm.toLowerCase();

    if (searchLower) {
        filtered = filtered.filter(course => 
            course.title.toLowerCase().includes(searchLower) ||
            course.tutorName.toLowerCase().includes(searchLower) ||
            course.description.toLowerCase().includes(searchLower)
        );
    }
    
    if (filter === 'not-enrolled') {
        filtered = filtered.filter(course => !course.isEnrolled);
    } else if (filter === 'enrolled') {
        filtered = filtered.filter(course => course.isEnrolled);
    } 
    
    if (filter === 'not-started' || filter === 'in-progress') {
        filtered = filtered.filter(course => {
            const progress = parseFloat(course.savedProgress || 0);
            if (filter === 'not-started') return progress < 10; 
            if (filter === 'in-progress') return progress >= 10; 
            return true;
        });
    }

    return filtered;
}

// ===============================================
// 5. STUDENT COURSE VIEWS & HANDLERS
// ===============================================

function loadStudentCourseCatalog() {
    const student = JSON.parse(localStorage.getItem('loggedInStudent'));
    
    if (!student) {
        loadStudentSignInView();
        return;
    }

    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">📚 Course Catalog</h2>
        <div class="mb-6 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 md:space-x-4">
            <input type="text" id="course-search-catalog" placeholder="Search catalog by title, tutor or tags..." 
                   class="flex-grow w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            <select id="course-filter-catalog" class="w-full md:w-auto border border-gray-300 rounded-md shadow-sm p-2">
                <option value="all">All Courses</option>
                <option value="not-enrolled">Not Enrolled</option>
                <option value="enrolled">Already Enrolled</option>
            </select>
        </div>
        <div id="course-list" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <p class="text-gray-500 md:col-span-3">Loading available courses...</p>
        </div>
        <div id="catalog-message" class="mt-4 p-3 hidden rounded-md text-sm font-medium"></div>
    `);

    $('#course-search-catalog, #course-filter-catalog').on('input change', function() {
        const searchTerm = $('#course-search-catalog').val();
        const filter = $('#course-filter-catalog').val();
        renderCatalog(student.id, searchTerm, filter);
    });
    
    renderCatalog(student.id);
}

// Fetches all courses and renders
function renderCatalog(studentId, searchTerm = '', filter = 'all') {
    // --- LOCAL STORAGE DATA FETCH ---
    const allCourses = getFullCourseData(null, studentId);
    // --- END LOCAL STORAGE DATA FETCH ---

    let filteredCourses = applyFiltersAndSearch(allCourses, searchTerm, filter);

    const courseList = $('#course-list');
    courseList.empty();

    if (filteredCourses.length === 0) {
        courseList.html('<p class="md:col-span-3 text-center text-gray-500 p-8 border-dashed border-2 rounded-lg">No courses are available in the catalog. Please check back later, or ask a tutor to publish a new course!</p>');
        return;
    }

    filteredCourses.forEach(course => {
        let actionButton;
        
        if (course.isEnrolled) {
            actionButton = `
                <button data-course-id="${course.id}" 
                        class="view-course-btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                    View Course ▶️
                </button>
            `;
        } else {
            actionButton = `
                <button data-course-id="${course.id}" 
                        class="enroll-btn bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                    Register Now
                </button>
            `;
        }
        
        const cardHtml = createCourseCard(course, actionButton);
        courseList.append(cardHtml);
    });
    
    setupEnrollHandler();
    setupViewCourseHandler();
}

function loadStudentMyCoursesView() {
    const student = JSON.parse(localStorage.getItem('loggedInStudent'));
    
    if (!student) {
        loadStudentSignInView();
        return;
    }

    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">🎓 My Enrolled Courses</h2>
        <div class="mb-6 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 md:space-x-4">
            <input type="text" id="course-search-my" placeholder="Search my courses by title or tutor..." 
                   class="flex-grow w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500">
            <select id="course-filter-my" class="w-full md:w-auto border border-gray-300 rounded-md shadow-sm p-2">
                <option value="all">All Courses</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started</option>
                <option value="completed" disabled>Completed (Future)</option>
            </select>
        </div>
        <div id="my-course-list" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <p class="text-gray-500 md:col-span-3">Loading your courses...</p>
        </div>
    `);

    $('#course-search-my, #course-filter-my').on('input change', function() {
        const searchTerm = $('#course-search-my').val();
        const filter = $('#course-filter-my').val();
        renderMyCourses(student.id, searchTerm, filter);
    });

    renderMyCourses(student.id);
}

// Fetches enrolled courses and renders
function renderMyCourses(studentId, searchTerm = '', filter = 'all') {
    // --- LOCAL STORAGE DATA FETCH ---
    const allCourses = getFullCourseData(null, studentId);
    const myCourses = allCourses.filter(c => c.isEnrolled);
    // --- END LOCAL STORAGE DATA FETCH ---

    let filteredCourses = applyFiltersAndSearch(myCourses, searchTerm, filter);

    const courseList = $('#my-course-list');
    courseList.empty();

    if (filteredCourses.length === 0) {
        courseList.html('<p class="md:col-span-3 text-center text-gray-500">You are not currently enrolled in any courses that match your filter. Check the <a href="#" id="view-tutorials" class="font-medium text-indigo-600 hover:text-indigo-500">Course Catalog</a>.</p>');
        return;
    }

    filteredCourses.forEach(course => {
        const actionButton = `
            <button data-course-id="${course.id}" 
                    class="view-course-btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                View Course ▶️
            </button>
        `;
        
        const cardHtml = createCourseCard(course, actionButton);
        courseList.append(cardHtml);
    });
    
    setupViewCourseHandler();
}

// Enrollment now updates Local Storage directly
function setupEnrollHandler() {
    const student = JSON.parse(localStorage.getItem('loggedInStudent'));
    if (!student) return; 

    $('#course-list').off('click', '.enroll-btn').on('click', '.enroll-btn', function() {
        const courseId = parseInt($(this).data('course-id'));
        const button = $(this);
        const cardFooter = button.parent();
        const countElement = $(`#count-${courseId}`);
        
        button.text('Processing...').prop('disabled', true);

        // --- LOCAL STORAGE ENROLLMENT ---
        const enrollments = JSON.parse(localStorage.getItem('studentEnrollments'));
        const courses = JSON.parse(localStorage.getItem('courses'));
        
        if (enrollments.some(e => e.studentId === student.id && e.courseId === courseId)) {
            alert("Already enrolled!");
            button.text('Register Now').prop('disabled', false);
            return;
        }

        // Add enrollment record
        enrollments.push({ studentId: student.id, courseId: courseId, enrollmentDate: new Date().toISOString() });
        localStorage.setItem('studentEnrollments', JSON.stringify(enrollments));
        
        // Update course enrollment count
        const courseToUpdate = courses.find(c => c.id === courseId);
        if (courseToUpdate) {
            courseToUpdate.enrollmentCount = (courseToUpdate.enrollmentCount || 0) + 1;
            localStorage.setItem('courses', JSON.stringify(courses));
        }
        // --- END LOCAL STORAGE ENROLLMENT ---

        $('#catalog-message').removeClass('hidden bg-red-100 text-red-700').addClass('bg-green-100 text-green-700').text("Enrollment successful!").show();
        
        // Update UI
        let currentCount = parseInt(countElement.text()) || 0;
        countElement.text(currentCount + 1);
        
        const newButtonHtml = `
            <button data-course-id="${courseId}" 
                    class="view-course-btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                View Course 🎉
            </button>
        `;
        button.remove();
        cardFooter.append(newButtonHtml);
        
        setupViewCourseHandler(); 

        setTimeout(() => {
            loadCoursePlayerView(courseId);
        }, 1000); 
    });
}

function setupViewCourseHandler() {
    $('#course-list, #my-course-list').off('click', '.view-course-btn').on('click', '.view-course-btn', function(e) {
        e.preventDefault();
        const courseId = parseInt($(this).data('course-id'));
        loadCoursePlayerView(courseId);
    });
    
     $('body').off('click', '#student-tutorials-link').on('click', '#student-tutorials-link', function(e) { 
        e.preventDefault(); 
        loadStudentMyCoursesView(); 
    });
    
     $('body').off('click', '#view-tutorials').on('click', '#view-tutorials', function(e) { 
        e.preventDefault(); 
        loadStudentCourseCatalog(); 
    });
}


// loadCoursePlayerView 
function loadCoursePlayerView(courseId) {
    const student = JSON.parse(localStorage.getItem('loggedInStudent'));

    if (!student) {
        alert("Please sign in as a student to view course content.");
        loadStudentSignInView();
        return;
    }
    
    // Initial loading state
    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Course Player</h2>
        <p class="text-gray-500">Loading course content...</p>
    `);

    // --- LOCAL STORAGE DATA FETCH ---
    const course = getFullCourseData(courseId, student.id);
    // --- END LOCAL STORAGE DATA FETCH ---

    if (!course) {
        $('#content-area').html('<p class="text-red-500">Error: Course not found.</p>');
        return;
    }
    
    // Chapters
    const courseDetails = JSON.parse(localStorage.getItem('courses')).find(c => c.id === courseId);
    const chapters = courseDetails.chapters || [];
    
    const chaptersHtml = chapters.map((chapter, index) => `
        <a href="#" data-timestamp="${chapter.timestamp}" class="chapter-link block p-3 border-b border-gray-100 hover:bg-indigo-50 transition">
            <p class="text-sm font-semibold text-gray-800">Chapter ${index + 1}: ${chapter.title}</p>
            <p class="text-xs text-indigo-600">${chapter.timestamp} - <span class="text-gray-500 italic">Click to jump</span></p>
        </a>
    `).join('');
    
    let videoPlayerContent = '';
    const [sourceType, sourcePayload] = course.videoUrl.split(':');
    
    // --- YOUTUBE SOURCE ---
    if (sourceType === 'youtube' && sourcePayload) {
        const startSeconds = Math.floor(course.savedProgress);
        const embedUrl = `https://www.youtube.com/embed/${sourcePayload}?enablejsapi=1&start=${startSeconds}&rel=0`;
        
        videoPlayerContent = `
            <iframe id="youtube-player" 
                    width="100%" 
                    height="400" 
                    src="${embedUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen class="rounded-lg">
            </iframe>
            <div id="video-source-note" class="p-2 bg-yellow-100 text-yellow-800 text-sm rounded-b-lg text-center font-semibold">
                Viewing external content via YouTube. Progress tracking is currently **disabled** for external embeds in this demo.
            </div>
        `;
    
    // --- LOCAL FILE SOURCE (Real-Life Simulation) ---
    } else if (sourceType === 'local' && sourcePayload) {
        
        let subtitleMetadata = null;
        if (course.subtitleUrl && course.subtitleUrl.startsWith('local:')) {
            subtitleMetadata = JSON.parse(course.subtitleUrl.substring(6));
        }

        // --- PROMPT FOR LOCAL FILE SELECTION (ASYNC STEP) ---
        const fileMetadata = JSON.parse(sourcePayload);
        const fileInputPromise = new Promise((resolve) => {
            const initialPlayerHtml = `
                <h2 class="text-3xl font-bold text-gray-800 mb-2">${course.title}</h2>
                <p class="text-lg text-indigo-700 mb-6">Taught by: **${course.tutorName}**</p>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <div class="w-full bg-black rounded-lg shadow-xl mb-6">
                            <div id="local-file-prompt-container" class="bg-gray-100 p-8 rounded-lg text-center shadow-inner">
                                <h3 class="text-xl font-bold text-gray-800 mb-3">Local Video File Required</h3>
                                <p class="text-red-600 mb-4 font-semibold">Please select the video file: **${fileMetadata.name}** (${(fileMetadata.size / 1024 / 1024).toFixed(2)} MB)</p>
                                <input type="file" id="local-video-file-select" accept="${fileMetadata.type}" class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none">
                                ${subtitleMetadata ? 
                                    `<p class="text-green-600 mb-2 mt-4 font-semibold">Optional: Select subtitle file: **${subtitleMetadata.name}**</p>
                                    <input type="file" id="local-subtitle-file-select" accept=".vtt,.srt" class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none">` 
                                    : ''}
                                <button id="load-local-file-btn" class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition" disabled>Load Video</button>
                            </div>
                        </div>
                        
                        <div class="mt-8 p-6 bg-white rounded-lg shadow-md border-t-4 border-indigo-500">
                            <h3 class="text-2xl font-semibold text-gray-800 mb-3">Course Description</h3>
                            <p class="text-gray-700 whitespace-pre-wrap">${course.description}</p>
                            
                            <h3 class="text-2xl font-semibold text-gray-800 mt-8 mb-4">Discussion Board</h3>
                            <div id="comments-section">Loading comments...</div>
                            <form id="comment-form" class="mt-4 pt-4 border-t border-gray-200">
                                <textarea id="comment-text" class="w-full p-3 border border-gray-300 rounded-md" rows="3" placeholder="Drop a comment or question..."></textarea>
                                <button type="submit" class="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Post Comment</button>
                            </form>
                        </div>
                    </div>

                    <div class="lg:col-span-1">
                        <div class="bg-white rounded-lg shadow-xl overflow-hidden sticky top-4">
                            <div class="p-4 bg-indigo-700 text-white font-semibold">
                                Course Content / Chapters
                            </div>
                            <div id="chapter-list-nav" class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                ${chaptersHtml}
                                ${chapters.length === 0 ? '<p class="p-4 text-center text-gray-500">No chapters defined.</p>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('#content-area').html(initialPlayerHtml);

            // Re-render comments here, as the content area is now updated
            renderComments(courseId);
            setupCommentHandler(courseId, student.id);
            
            const videoSelect = $('#local-video-file-select');
            const subtitleSelect = $('#local-subtitle-file-select');
            const loadBtn = $('#load-local-file-btn');
            
            videoSelect.on('change', () => {
                loadBtn.prop('disabled', videoSelect[0].files.length === 0);
            });
            
            loadBtn.on('click', () => {
                if (videoSelect[0].files.length) {
                    const videoFile = videoSelect[0].files[0];
                    const subFile = subtitleSelect.length && subtitleSelect[0].files.length ? subtitleSelect[0].files[0] : null;
                    resolve({ videoFile, subFile });
                }
            });
        });
        
        // This is where the function waits for the user to click "Load Video"
        (async function() {
            const { videoFile, subFile } = await fileInputPromise;
            
            // --- CREATE LOCAL URL & PLAYER ---
            let fileUrl = URL.createObjectURL(videoFile);
            let subtitleTrack = '';
            
            if (subFile) {
                const subUrl = URL.createObjectURL(subFile);
                subtitleTrack = `<track kind="captions" src="${subUrl}" srclang="en" label="English" default>`;
            }
            
            // Now, create the actual video player HTML
            videoPlayerContent = `
                <video id="course-video-player" controls preload="metadata" class="w-full rounded-lg" poster="placeholder_poster.jpg">
                    <source src="${fileUrl}" type="${videoFile.type}">
                    ${subtitleTrack}
                    Your browser does not support the video tag.
                </video>
                <div id="video-source-note" class="p-2 bg-green-100 text-green-800 text-sm rounded-b-lg text-center font-semibold">
                    Local file loaded successfully: **${videoFile.name}**. Progress tracking is **ENABLED**.
                </div>
            `;

            const playerWrapper = $('#local-file-prompt-container').parent();
            if (playerWrapper.length) {
                playerWrapper.html(videoPlayerContent);
            }
            
            // Re-setup handlers now that the video element is on the page
            setupPlayerHandlers(courseId, course.savedProgress, sourceType); 
        })();
        
        // We exit here because the player setup is handled in the async function
        return; 
        
    } else {
         videoPlayerContent = `<div class="p-10 text-center bg-gray-100 text-red-500 rounded-lg">Error: Invalid video source configured.</div>`;
    }
    
    // This part runs for YouTube and any error state 
    const finalHtml = `
        <h2 class="text-3xl font-bold text-gray-800 mb-2">${course.title}</h2>
        <p class="text-lg text-indigo-700 mb-6">Taught by: **${course.tutorName}**</p>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <div class="w-full bg-black rounded-lg shadow-xl mb-6">${videoPlayerContent}</div>
                <div class="mt-8 p-6 bg-white rounded-lg shadow-md border-t-4 border-indigo-500">
                    <h3 class="text-2xl font-semibold text-gray-800 mb-3">Course Description</h3>
                    <p class="text-gray-700 whitespace-pre-wrap">${course.description}</p>

                    <h3 class="text-2xl font-semibold text-gray-800 mt-8 mb-4">Discussion Board</h3>
                    <div id="comments-section">Loading comments...</div>
                    <form id="comment-form" class="mt-4 pt-4 border-t border-gray-200">
                        <textarea id="comment-text" class="w-full p-3 border border-gray-300 rounded-md" rows="3" placeholder="Drop a comment or question..."></textarea>
                        <button type="submit" class="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Post Comment</button>
                    </form>
                </div>
            </div>
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow-xl overflow-hidden sticky top-4">
                    <div class="p-4 bg-indigo-700 text-white font-semibold">Course Content / Chapters</div>
                    <div id="chapter-list-nav" class="divide-y divide-gray-200 max-h-96 overflow-y-auto">${chaptersHtml}</div>
                </div>
            </div>
        </div>`;
        
    $('#content-area').html(finalHtml);
    setupPlayerHandlers(courseId, course.savedProgress, sourceType); 
    renderComments(courseId);
    setupCommentHandler(courseId, student.id);
}


// setupPlayerHandlers 
function setupPlayerHandlers(courseId, savedProgress, sourceType) {
    const student = JSON.parse(localStorage.getItem('loggedInStudent'));

    if (!student || sourceType !== 'local') {
        if (sourceType === 'youtube') {
             console.log("YouTube video loaded via iframe. Progress tracking skipped.");
        }
        return; 
    }
    
    const videoPlayer = document.getElementById('course-video-player');
    if (!videoPlayer) return; 

    function timestampToSeconds(timestamp) {
        const parts = timestamp.split(':').map(Number);
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    }

    // --- Core Progress Saving Function ---
    let progressInterval = null;
    let isSaving = false;
    const SAVE_INTERVAL_SECONDS = 10;

    function saveCurrentProgress() {
        if (isSaving || videoPlayer.paused || videoPlayer.ended || videoPlayer.readyState < 2) return; 

        isSaving = true;
        const progressTime = videoPlayer.currentTime;
        
        // --- LOCAL STORAGE PROGRESS UPDATE ---
        const progressRecords = JSON.parse(localStorage.getItem('studentProgress'));
        const existingRecordIndex = progressRecords.findIndex(p => p.studentId === student.id && p.courseId === courseId);

        const newRecord = { studentId: student.id, courseId: courseId, progressTime: progressTime };
        
        if (existingRecordIndex > -1) {
            progressRecords[existingRecordIndex] = newRecord;
        } else {
            progressRecords.push(newRecord);
        }

        localStorage.setItem('studentProgress', JSON.stringify(progressRecords));
        // --- END LOCAL STORAGE PROGRESS UPDATE ---

        isSaving = false;
    }

    // --- 1. Load Saved Progress ---
    videoPlayer.addEventListener('loadedmetadata', function() {
        if (savedProgress > 0 && savedProgress < videoPlayer.duration) {
             videoPlayer.currentTime = savedProgress; 
             console.log(`Video sought to saved time: ${savedProgress.toFixed(1)}s`);
        }
    });

    // --- 2. Progress Interval Handlers ---
    videoPlayer.addEventListener('play', function() {
        if (progressInterval) clearInterval(progressInterval); 
        progressInterval = setInterval(saveCurrentProgress, SAVE_INTERVAL_SECONDS * 1000);
    });

    videoPlayer.addEventListener('pause', function() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
            saveCurrentProgress(); 
        }
    });

    videoPlayer.addEventListener('ended', function() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
            saveCurrentProgress();
        }
    });

    // --- 3. Chapter Seek Handler ---
    $('#chapter-list-nav').off('click', '.chapter-link').on('click', '.chapter-link', function(e) {
        e.preventDefault();
        
        const timestamp = $(this).data('timestamp');
        const seekTime = timestampToSeconds(timestamp);
        
        if (videoPlayer) {
            videoPlayer.currentTime = seekTime;
            videoPlayer.play();
        }
        
        $('.chapter-link').removeClass('bg-indigo-100');
        $(this).addClass('bg-indigo-100');
    });
    
    // Cleanup Object URLs when leaving the page
    $(window).on('beforeunload', function() {
        if (videoPlayer && videoPlayer.src.startsWith('blob:')) {
            URL.revokeObjectURL(videoPlayer.src);
        }
    });
}

// ===============================================
// 6. NEW: COMMENTING SYSTEM LOGIC
// ===============================================

function renderComments(courseId) {
    const allComments = JSON.parse(localStorage.getItem('comments'));
    const courseComments = allComments.filter(c => c.courseId === courseId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const users = JSON.parse(localStorage.getItem('users'));
    const allTutors = users.tutors;
    const course = JSON.parse(localStorage.getItem('courses')).find(c => c.id === courseId);
    
    const commentsSection = $('#comments-section');
    commentsSection.empty();

    if (courseComments.length === 0) {
        commentsSection.html('<p class="text-gray-500 italic">Be the first to leave a comment!</p>');
        return;
    }
    
    const commentsHtml = courseComments.map(comment => {
        let commenterDisplay = `Student ID: **${comment.userId}**`;
        let tag = 'bg-gray-100';

        // Check if the commenter is the tutor for this course
        if (comment.userType === 'Tutor') {
            const tutor = allTutors.find(t => t.id === comment.userId);
            if (tutor && tutor.id === course.tutorId) {
                commenterDisplay = `Tutor: **${tutor.name}**`;
                tag = 'bg-indigo-100 border-l-4 border-indigo-500';
            }
        }
        
        const timestamp = new Date(comment.timestamp).toLocaleString();

        return `
            <div class="p-4 mb-3 rounded-lg shadow-sm text-sm ${tag}">
                <p class="text-gray-800 whitespace-pre-wrap">${comment.text}</p>
                <p class="text-xs text-gray-500 mt-2">Posted by: ${commenterDisplay} on ${timestamp}</p>
            </div>
        `;
    }).join('');

    commentsSection.html(commentsHtml);
}

function setupCommentHandler(courseId, studentId) {
    $('#comment-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        const commentTextarea = $('#comment-text');
        const text = commentTextarea.val().trim();
        
        if (!text) {
            alert('Comment cannot be empty.');
            return;
        }
        
        const loggedInTutor = JSON.parse(localStorage.getItem('loggedInTutor'));
        const userType = loggedInTutor ? 'Tutor' : 'Student';
        const userId = loggedInTutor ? loggedInTutor.id : studentId;
        
        // --- LOCAL STORAGE COMMENT SAVE ---
        const allComments = JSON.parse(localStorage.getItem('comments'));
        const newComment = {
            id: nextCommentId++,
            courseId: courseId,
            userId: userId,
            userType: userType,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        allComments.push(newComment);
        localStorage.setItem('comments', JSON.stringify(allComments));
        // --- END LOCAL STORAGE COMMENT SAVE ---

        commentTextarea.val(''); // Clear the textarea
        renderComments(courseId); // Reload comments to show the new one
    });
}

// Function to load the main landing page content
function loadLandingPageView() {
    const landingHtml = `
        <section class="text-center py-16 md:py-24 bg-white rounded-xl shadow-2xl border-t-8 border-indigo-600">
            <h2 class="text-5xl font-extrabold text-gray-900 mb-4">Welcome to <span class="text-indigo-600">TutorHub</span></h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Your platform for seamless online tutorial management. Whether you're here to learn or to share your expertise, TutorHub connects students with custom-built video content.
            </p>
            <div class="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                
                <div class="p-6 bg-indigo-50 rounded-lg shadow-md max-w-sm">
                    <h3 class="text-2xl font-bold text-indigo-700 mb-2">I'm a Student 🎓</h3>
                    <p class="text-gray-700 mb-4">Access a growing catalog of video courses, track your progress, and engage in discussions.</p>
                    <a href="#" id="student-sign-in-from-landing" 
                       class="w-full inline-block bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition shadow-lg">
                       Start Learning
                    </a>
                </div>
                
                <div class="p-6 bg-green-50 rounded-lg shadow-md max-w-sm">
                    <h3 class="text-2xl font-bold text-green-700 mb-2">I'm a Tutor 🧑‍🏫</h3>
                    <p class="text-gray-700 mb-4">Publish your custom video tutorials using local files or YouTube embeds, and manage your content.</p>
                    <a href="#" id="tutor-sign-in-from-landing" 
                       class="w-full inline-block bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition shadow-lg">
                       Publish Content
                    </a>
                </div>
                
            </div>
        </section>
    `;
    $('#content-area').html(landingHtml);
    
    // Set up click handlers for the new buttons on the landing page
    $('#student-sign-in-from-landing').off('click').on('click', function(e) {
        e.preventDefault();
        loadStudentSignInView();
    });

    
    $('#tutor-sign-in-from-landing').off('click').on('click', function(e) {
        e.preventDefault();
        loadTutorSignInView();
    });
}


// Function to dynamically update the mobile menu content
function updateMobileMenuLinks() {
    const mobileMenuContent = $('#mobile-menu > div');
    const loggedInTutor = localStorage.getItem('loggedInTutor');
    const loggedInStudent = localStorage.getItem('loggedInStudent');
    
    mobileMenuContent.empty();
    
    // Helper function for consistent link styling
    const linkClasses = 'block text-lg font-semibold text-white p-3 rounded-md hover:bg-indigo-700 transition w-full text-left';

    // Logged In Tutor View
    if (loggedInTutor) {
        const tutor = JSON.parse(loggedInTutor);
        mobileMenuContent.append(`<p class="text-gray-300 pt-2 pb-1">Logged in as: **${tutor.name}**</p>`);
        mobileMenuContent.append(`<a href="#" id="tutor-dashboard-link-mobile" class="${linkClasses}">Tutor Dashboard</a>`);
        mobileMenuContent.append(`<button id="nav-sign-out-mobile" data-user-type="Tutor" class="w-full text-left bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition font-semibold">Sign Out</button>`);
    } 
    // Logged In Student View
    else if (loggedInStudent) {
        const student = JSON.parse(loggedInStudent);
        mobileMenuContent.append(`<p class="text-gray-300 pt-2 pb-1">Logged in as: **${student.name}**</p>`);
        mobileMenuContent.append(`<a href="#" id="student-tutorials-link-mobile" class="${linkClasses}">My Enrolled Courses</a>`);
        mobileMenuContent.append(`<a href="#" id="view-tutorials-mobile" class="${linkClasses}">Course Catalog</a>`);
        mobileMenuContent.append(`<button id="nav-sign-out-mobile" data-user-type="Student" class="w-full text-left bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition font-semibold">Sign Out</button>`);
    } 
    // Logged Out View
    else {
        mobileMenuContent.append(`<a href="#" id="view-tutorials-mobile" class="${linkClasses}">View Course Catalog</a>`);
        mobileMenuContent.append(`<a href="#" id="student-sign-in-mobile" class="${linkClasses}">Student Login</a>`);
        mobileMenuContent.append(`<a href="#" id="student-sign-up-mobile" class="bg-indigo-500 ${linkClasses}">Student Sign Up</a>`);
        mobileMenuContent.append(`<a href="#" id="tutor-sign-in-mobile" class="${linkClasses}">Tutor Login</a>`);
        mobileMenuContent.append(`<a href="#" id="tutor-sign-up-mobile" class="bg-green-500 ${linkClasses}">Tutor Sign Up</a>`);
    }

    // Attach mobile-specific click handlers
    mobileMenuContent.find('a, button').on('click', function(e) {
        e.preventDefault();
        
        // Hide menu after click
        $('#mobile-menu-toggle').trigger('click'); 

        // Trigger the corresponding function based on ID
        const id = $(this).attr('id');
        if (id.includes('home')) loadLandingPageView();
        else if (id.includes('tutor-dashboard-link')) loadTutorDashboardView();
        else if (id.includes('student-tutorials-link')) loadStudentMyCoursesView();
        else if (id.includes('view-tutorials') || id.includes('catalog')) loadStudentCourseCatalog();
        else if (id.includes('student-sign-in')) loadStudentSignInView();
        else if (id.includes('student-sign-up')) loadStudentSignUpView();
        else if (id.includes('tutor-sign-in')) loadTutorSignInView();
        else if (id.includes('tutor-sign-up')) loadTutorSignUpView();
        else if (id.includes('nav-sign-out')) $('#nav-sign-out').trigger('click');
    });
}


// ===============================================
// 7. MAIN ENTRY POINT
// ===============================================

$(document).ready(function() {
    // Initialize the simulated database
    initializeDatabase();

    // Add this handler inside your $(document).ready(function() { ... }); block:
$('#home-nav-link').on('click', function(e) {
    e.preventDefault();
    const loggedInTutor = localStorage.getItem('loggedInTutor');
    const loggedInStudent = localStorage.getItem('loggedInStudent');
    
    // Only load landing page if no one is logged in
    if (!loggedInTutor && !loggedInStudent) {
        loadLandingPageView();
    }
});

// ... inside $(document).ready(function() { ... });

    // --- Footer Link Handlers ---
    $('#home-footer-link').on('click', function(e) { e.preventDefault(); loadLandingPageView(); });
    $('#catalog-footer-link').on('click', function(e) { e.preventDefault(); loadStudentCourseCatalog(); });
    $('#tutor-login-footer-link').on('click', function(e) { e.preventDefault(); loadTutorSignInView(); });
    
// ... continue with existing ready function logic ...


        // --- MOBILE MENU TOGGLE HANDLER ---
$('#mobile-menu-toggle').on('click', function() {
    const mobileMenu = $('#mobile-menu');
    const isHidden = mobileMenu.hasClass('hidden');
    
    if (isHidden) {
        // Show menu
        mobileMenu.removeClass('hidden');
        $('#menu-icon').addClass('hidden');
        $('#close-icon').removeClass('hidden');
    } else {
        // Hide menu
        mobileMenu.addClass('hidden');
        $('#menu-icon').removeClass('hidden');
        $('#close-icon').addClass('hidden');
    }
    
    // Rerender mobile menu links to match the current logged-in state
    updateMobileMenuLinks(); 
});
    
    // --- Attaching Navigation Click Handlers ---
    $('#tutor-sign-in').on('click', function(e) { e.preventDefault(); loadTutorSignInView(); });
    $('#tutor-sign-up').on('click', function(e) { e.preventDefault(); loadTutorSignUpView(); });
    $('#student-sign-in').on('click', function(e) { e.preventDefault(); loadStudentSignInView(); });
    $('#student-sign-up').on('click', function(e) { e.preventDefault(); loadStudentSignUpView(); });

    $('body').off('click', '#student-tutorials-link').on('click', '#student-tutorials-link', function(e) { 
        e.preventDefault(); 
        loadStudentMyCoursesView(); 
    });
    
    $('body').off('click', '#view-tutorials').on('click', '#view-tutorials', function(e) { 
        e.preventDefault(); 
        loadStudentCourseCatalog(); 
    });


    // --- Check Initial State and Load View ---
 // ... existing code ...

 // ... existing code ...

    // --- Check Initial State and Load View ---
    const loggedInTutor = localStorage.getItem('loggedInTutor');
    const loggedInStudent = localStorage.getItem('loggedInStudent');
    
    if (loggedInTutor) {
        updateNavVisibility('Tutor', true);
        loadTutorDashboardView();
        return; 
    } 
    
    if (loggedInStudent) {
        updateNavVisibility('Student', true);
        loadStudentCourseCatalog();
        return; 
    } 
    
    // If no one is logged in, load the introductory landing page
    updateNavVisibility('', false);
    loadLandingPageView(); // <--- New Call
});