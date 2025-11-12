// app.js (Frontend Code with REAL API Calls)

// --- 1. API Configuration (FIXED) ---
// CRITICAL FIX: Assuming your Express backend is running on port 5000 (as recommended)
const API_BASE_URL = 'http://localhost:5000/api';
// Assumes Express serves static uploads from a route like /uploads
const API_BASE_ROOT = 'http://localhost:5000';

// --- 2. Helper Functions for User Session ---

function getLoggedInUserId() {
    const tutor = localStorage.getItem('loggedInTutor');
    const student = localStorage.getItem('loggedInStudent');

    if (tutor) return JSON.parse(tutor).id;
    if (student) return JSON.parse(student).id;
    return null;
}

function getLoggedInUserType() {
    if (localStorage.getItem('loggedInTutor')) return 'Tutor';
    if (localStorage.getItem('loggedInStudent')) return 'Student';
    return null;
}

function getLoggedInUser() {
    const userType = getLoggedInUserType();
    return userType ? JSON.parse(localStorage.getItem(`loggedIn${userType}`)) : null;
}

// --- 3. UI Helper: Navigation Visibility ---

function updateNavVisibility(userType, isLoggedIn) {
    const user = getLoggedInUser();

    const tutorDashboardNavHtml = `
        <a href="#" id="tutor-dashboard-link" class="text-white hover:text-indigo-200 transition font-medium">Dashboard</a>
        <span class="text-white text-sm opacity-70" id="nav-welcome-message">Hello, ${user ? user.name.split(' ')[0] : 'Tutor'}!</span>
        <a href="#" id="nav-sign-out" data-user-type="Tutor" class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition">Sign Out</a>
    `;

    const studentDashboardNavHtml = `
        <a href="#" id="student-tutorials-link" class="text-white hover:text-indigo-200 transition font-medium">My Courses</a>
        <span class="text-white text-sm opacity-70" id="nav-welcome-message">Welcome, ${user ? user.name.split(' ')[0] : 'Student'}!</span>
        <a href="#" id="nav-sign-out" data-user-type="Student" class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition">Sign Out</a>
    `;

    // Reset all navigation sections
    $('#student-nav').empty().show();
    $('#tutor-auth-nav').empty().show();
    $('#tutor-dashboard-nav').empty().hide();
    $('#mobile-menu').empty();

    if (isLoggedIn) {
        // Logged In State
        $('#tutor-auth-nav').hide(); // Hide general tutor/student login options

        if (userType === 'Tutor') {
            // Student links become "Browse Catalog"
            $('#student-nav').html('<a href="#" id="view-tutorials-link" class="text-white hover:text-indigo-200 transition font-medium">Browse Catalog</a>');
            // Show Tutor Dashboard links
            $('#tutor-dashboard-nav').html(tutorDashboardNavHtml).show();

            // Mobile Menu for Tutor
            $('#mobile-menu').append(
                `<a href="#" id="tutor-dashboard-link-mobile" class="block text-white font-semibold py-2">Tutor Dashboard</a>
                 <a href="#" id="view-tutorials-link-mobile" class="block text-white py-2">Browse Catalog</a>
                 <a href="#" id="nav-sign-out-mobile" data-user-type="Tutor" class="block bg-red-500 text-white px-3 py-1 rounded-md text-center hover:bg-red-600 transition mt-4">Sign Out (${user.name})</a>`
            );
            $('#tutor-dashboard-link-mobile').on('click', (e) => { e.preventDefault(); loadTutorDashboardView(); $('#mobile-menu').addClass('hidden'); });
            $('#view-tutorials-link-mobile').on('click', (e) => { e.preventDefault(); loadStudentCourseCatalog(); $('#mobile-menu').addClass('hidden'); });
            $('#nav-sign-out-mobile').on('click', (e) => { e.preventDefault(); handleSignOut('Tutor'); $('#mobile-menu').addClass('hidden'); });

        } else if (userType === 'Student') {
            // Show Student Logged In links (My Courses & Sign Out)
            $('#student-nav').html(studentDashboardNavHtml).show();
            // Still show Tutor Login option
            $('#tutor-auth-nav').html('<span class="text-indigo-300">|</span> <a href="#" id="tutor-sign-in" class="text-white hover:text-indigo-200 transition font-medium">Tutor Login</a>').show();

            // Mobile Menu for Student
            $('#mobile-menu').append(
                `<a href="#" id="student-tutorials-link-mobile" class="block text-white font-semibold py-2">My Courses</a>
                 <a href="#" id="view-tutorials-link-mobile" class="block text-white py-2">Browse Catalog</a>
                 <a href="#" id="tutor-sign-in-mobile" class="block text-white py-2 border-t border-indigo-600 mt-2 pt-2">Tutor Login</a>
                 <a href="#" id="nav-sign-out-mobile" data-user-type="Student" class="block bg-red-500 text-white px-3 py-1 rounded-md text-center hover:bg-red-600 transition mt-4">Sign Out (${user.name})</a>`
            );
            $('#student-tutorials-link-mobile').on('click', (e) => { e.preventDefault(); loadStudentCoursesView(); $('#mobile-menu').addClass('hidden'); });
            $('#view-tutorials-link-mobile').on('click', (e) => { e.preventDefault(); loadStudentCourseCatalog(); $('#mobile-menu').addClass('hidden'); });
            $('#tutor-sign-in-mobile').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); $('#mobile-menu').addClass('hidden'); });
            $('#nav-sign-out-mobile').on('click', (e) => { e.preventDefault(); handleSignOut('Student'); $('#mobile-menu').addClass('hidden'); });

        }
    } else {
        // Logged Out State (Public View)
        $('#student-nav').html(`
            <a href="#" id="view-tutorials-link" class="text-white hover:text-indigo-200 transition font-medium">Browse Catalog</a>
            <span class="text-indigo-300">|</span>
            <a href="#" id="student-sign-in" class="text-white hover:text-indigo-200 transition">Student Login</a>
            <a href="#" id="student-sign-up" class="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600 transition">Student Sign Up</a>
        `).show();

        $('#tutor-auth-nav').html(`
            <span class="text-indigo-300">|</span>
            <a href="#" id="tutor-sign-in" class="text-white hover:text-indigo-200 transition font-medium">Tutor Login</a>
            <a href="#" id="tutor-sign-up" class="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition">Tutor Sign Up</a>
        `).show();

        // Mobile Menu for Public
        $('#mobile-menu').append(
            `<a href="#" id="view-tutorials-link-mobile" class="block text-white font-semibold py-2">Browse Catalog</a>
             <a href="#" id="student-sign-in-mobile" class="block text-white py-2">Student Login</a>
             <a href="#" id="student-sign-up-mobile" class="block bg-indigo-500 text-white px-3 py-1 rounded-md text-center hover:bg-indigo-600 transition mt-2">Student Sign Up</a>
             <a href="#" id="tutor-sign-in-mobile" class="block text-white py-2 border-t border-indigo-600 mt-2 pt-2">Tutor Login</a>
             <a href="#" id="tutor-sign-up-mobile" class="block bg-green-500 text-white px-3 py-1 rounded-md text-center hover:bg-green-600 transition mt-2">Tutor Sign Up</a>`
        );
        $('#view-tutorials-link-mobile').on('click', (e) => { e.preventDefault(); loadStudentCourseCatalog(); $('#mobile-menu').addClass('hidden'); });
        $('#student-sign-in-mobile').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); $('#mobile-menu').addClass('hidden'); });
        $('#student-sign-up-mobile').on('click', (e) => { e.preventDefault(); loadStudentSignUpView(); $('#mobile-menu').addClass('hidden'); });
        $('#tutor-sign-in-mobile').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); $('#mobile-menu').addClass('hidden'); });
        $('#tutor-sign-up-mobile').on('click', (e) => { e.preventDefault(); loadTutorSignUpView(); $('#mobile-menu').addClass('hidden'); });
    }
    // Re-attach global handlers since navigation links were replaced
    attachNavHandlers();
}


// --- 4. Authentication Handlers ---

/**
 * Handles both Student and Tutor Sign-In.
 */
function handleSignIn(userType, email, password) {
    $.ajax({
        url: `${API_BASE_URL}/auth/signin/${userType.toLowerCase()}`,
        type: 'POST',
        data: JSON.stringify({ email: email, password: password }),
        contentType: 'application/json',
        success: function (user) {
            // 1. SESSION MANAGEMENT 
            // Assuming backend returns user object with _id and name
            localStorage.removeItem(userType === 'Tutor' ? 'loggedInStudent' : 'loggedInTutor');
            localStorage.setItem(`loggedIn${userType}`, JSON.stringify({ id: user._id, name: user.name }));

            // 2. UI UPDATE & REDIRECT
            alert(`${userType} sign-in successful! Welcome, ${user.name}.`);
            updateNavVisibility(userType, true);

            if (userType === 'Tutor') loadTutorDashboardView();
            else loadStudentCoursesView();
        },
        error: function (jqXHR) {
            console.error(`${userType} Sign-In Failed:`, jqXHR.responseJSON);
            alert(`Login failed: ${jqXHR.responseJSON ? jqXHR.responseJSON.message : 'Server error.'}`);
        }
    });
}

/**
 * Handles both Student and Tutor Sign-Up.
 */
function handleSignUp(userType, name, email, password) {
    $.ajax({
        url: `${API_BASE_URL}/auth/signup/${userType.toLowerCase()}`,
        type: 'POST',
        data: JSON.stringify({ name: name, email: email, password: password }),
        contentType: 'application/json',
        success: function () {
            alert(`${userType} sign-up successful! Please log in.`);

            // REDIRECT TO LOGIN VIEW AFTER SIGNUP
            if (userType === 'Tutor') loadTutorSignInView();
            else loadStudentSignInView();
        },
        error: function (jqXHR) {
            console.error(`${userType} Sign-Up Failed:`, jqXHR.responseJSON);
            alert(`Registration failed: ${jqXHR.responseJSON ? jqXHR.responseJSON.message : 'Server error.'}`);
        }
    });
}

// Handles Sign-Out
function handleSignOut(userType) {
    localStorage.removeItem(`loggedIn${userType}`);

    updateNavVisibility('', false);
    loadStudentCourseCatalog(); // Default landing page after signout
    alert('You have been signed out.');
}


// --- 5. Course CRUD Handlers (API Logic) ---

/**
 * Handles the submission of the new course form, including file upload.
 * NOTE: This requires a backend (Express/Multer) setup to handle file upload.
 */
function handleTutorCourseCreation() {
    const loggedInTutor = getLoggedInUser();
    if (!loggedInTutor || !loggedInTutor.id) {
        alert("Tutor must be logged in to create a course.");
        loadTutorSignInView();
        return;
    }

    // 1. Gather Data (Using FormData for files)
    const formData = new FormData($('#new-course-form')[0]);
    formData.append('tutorId', loggedInTutor.id);

    // Handle Chapters (requires custom aggregation since they are dynamic inputs)
    const chapters = [];
    $('#chapter-list-editor').find('.chapter-row').each(function () {
        const title = $(this).find('.chapter-title-input').val();
        const timestamp = $(this).find('.chapter-timestamp-input').val();
        if (title && timestamp) {
            chapters.push({ title: title, timestamp: timestamp });
        }
    });
    // Send chapters as a JSON string, which the backend will parse
    formData.set('chapters', JSON.stringify(chapters));

    // Handle Asset Type selection (CRITICAL FIX AREA)
    const assetType = $('input[name="assetType"]:checked').val();
    formData.set('assetType', assetType); // Ensure assetType is set correctly

    if (assetType === 'youtube') {
        // FIX: Remove the file field if YouTube is selected
        formData.delete('videoFile'); 
        
        // Ensure the YouTube field is present and not empty
        const url = $('input[name="youtubeUrl"]').val();
        if (!url) {
            alert("Please provide a YouTube URL.");
            return;
        }
        // The 'youtubeUrl' field exists in the form data with the full URL.
    } else { // assetType === 'local'
        // FIX: Remove the YouTube URL field if local file is selected
        formData.delete('youtubeUrl'); 

        // Ensure a file is selected
        if ($('input[name="videoFile"]').prop('required') && $('input[name="videoFile"]')[0].files.length === 0) {
            alert("Please select a video file for local upload.");
            return;
        }
    }

    // 2. Send Data to the Express Backend (API Call)
    $.ajax({
        url: `${API_BASE_URL}/courses/upload`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        beforeSend: function () {
            $('#new-course-form button[type="submit"]').prop('disabled', true).text('Uploading...');
        },
        success: function (response) {
            console.log("Course created successfully:", response);
            alert(`Course "${response.title}" created successfully!`);

            $('#new-course-form')[0].reset();
            loadTutorDashboardView();
        },
        error: function (jqXHR) {
            console.error("Course creation failed:", jqXHR.responseJSON);
            alert(`Error creating course: ${jqXHR.responseJSON ? jqXHR.responseJSON.message : 'Server error. Check console.'}`);
        },
        complete: function () {
            $('#new-course-form button[type="submit"]').prop('disabled', false).text('Publish Course');
        }
    });
}

// Helper function to delete a course
function deleteCourseApi(courseId) {
    if (!confirm('Are you sure you want to permanently delete this course?')) return;

    $.ajax({
        url: `${API_BASE_URL}/courses/${courseId}`,
        type: 'DELETE',
        success: function () {
            alert('Course deleted successfully.');
            loadTutorCoursesView();
            loadTutorDashboardView(); // Refresh dashboard stats
        },
        error: function (jqXHR) {
            console.error("Delete failed:", jqXHR.responseJSON);
            alert(`Error deleting course: ${jqXHR.responseJSON ? jqXHR.responseJSON.message : 'Server error.'}`);
        }
    });
}

// --- 6. Enrollment Handlers ---

function handleEnrollment(courseId) {
    const student = getLoggedInUser();
    if (!student || getLoggedInUserType() !== 'Student') {
        alert("Please log in as a student to enroll.");
        loadStudentSignInView();
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/enrollments/enroll`,
        type: 'POST',
        data: JSON.stringify({ studentId: student.id, courseId: courseId }),
        contentType: 'application/json',
        success: function (response) {
            alert(`Successfully enrolled in "${response.courseTitle}"!`);
            loadStudentCoursesView();
        },
        error: function (jqXHR) {
            console.error("Enrollment failed:", jqXHR.responseJSON);
            alert(`Enrollment failed: ${jqXHR.responseJSON ? jqXHR.responseJSON.message : 'Server error.'}`);
        }
    });
}

/**
 * Fetches course data and loads the player view.
 */
function fetchAndLoadCoursePlayer(courseId) {
    $('#content-area').html('<div class="text-center p-20"><p class="text-xl text-gray-500">Loading course content...</p></div>');

    $.get(`${API_BASE_URL}/courses/${courseId}`, function (course) {
        if (!course) {
            $('#content-area').html('<div class="p-6 text-red-600">Course content not found.</div>');
            return;
        }

        // Assuming your backend returns a single asset object nested in course.asset
        const courseAsset = course.asset;
        let videoHtml = '';
        let mediaUrl;
        const assetUrl = courseAsset ? courseAsset.url : null;
        const assetType = courseAsset ? courseAsset.type : 'none';

        if (assetType === 'youtube' && assetUrl) {
            // Assume the backend stores the *ID* or the *URL*. If it's a URL, extract the ID:
            const videoIdMatch = assetUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|\w+\/|watch\?v=|\/embed\/))([^\s&?#]+)/) || assetUrl.match(/(?:youtu\.be\/)([^\s&?#]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : assetUrl;
            
            mediaUrl = `https://www.youtube.com/embed/${videoId}`;
            videoHtml = `
                <div class="aspect-w-16 aspect-h-9">
                    <iframe src="${mediaUrl}" allowfullscreen class="w-full h-full rounded-lg shadow-xl" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                </div>
            `;
        } else if (assetType === 'local' && assetUrl) {
            // CRITICAL FIX: The correct path is just /uploads/filename, 
            // as configured in the Express static route in server.js.
            mediaUrl = `${API_BASE_ROOT}/uploads/${assetUrl}`; 
            videoHtml = `
                <video controls id="video-player" src="${mediaUrl}" class="w-full h-full rounded-lg shadow-xl" controlsList="nodownload"></video>
            `;
        } else {
            videoHtml = '<div class="p-4 text-orange-600 border border-orange-300 rounded">No video content found for this course.</div>';
        }

        let chaptersList = '';
        if (course.chapters && course.chapters.length > 0) {
            chaptersList = `
                <h3 class="text-2xl font-semibold mt-8 mb-4">Course Chapters</h3>
                <ul class="list-disc list-inside space-y-2 text-gray-700">
                    ${course.chapters.map(ch => `<li><span class="font-medium">${ch.title}</span> (at ${ch.timestamp})</li>`).join('')}
                </ul>
            `;
        }

        $('#content-area').html(`
            <div class="bg-white p-6 rounded-lg shadow-xl">
                <h2 class="text-3xl font-bold mb-4">${course.title}</h2>
                <p class="text-gray-600 mb-6">${course.description}</p>
                <div class="mb-8">${videoHtml}</div>
                ${chaptersList}
            </div>
        `);

        // Autoplay video on supported browsers if the video tag is present
        if (assetType === 'local' && assetUrl) {
            document.getElementById('video-player').play();
        }

    }).fail(function (jqXHR) {
        console.error("Failed to fetch course:", jqXHR);
        $('#content-area').html('<div class="p-6 text-red-600">Error connecting to server or fetching course data.</div>');
    });
}


// --- 7. View Rendering Functions ---

// --- Authentication Views (Tutor & Student) ---

function loadAuthForm(userType, isSignIn) {
    const formType = isSignIn ? 'Sign In' : 'Sign Up';
    const otherForm = isSignIn ? 'Sign Up' : 'Sign In';
    const color = userType === 'Tutor' ? 'green' : 'indigo';

    return `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto border-t-4 border-${color}-600">
            <h2 class="text-2xl font-bold mb-4">${userType} ${formType}</h2>
            <form id="${userType.toLowerCase()}-auth-form" class="space-y-4">
                ${isSignIn ? '' : '<div><label class="block text-gray-700">Name</label><input type="text" id="user-name" class="w-full p-2 border border-gray-300 rounded" required></div>'}
                <div><label class="block text-gray-700">Email</label><input type="email" id="user-email" class="w-full p-2 border border-gray-300 rounded" required></div>
                <div><label class="block text-gray-700">Password</label><input type="password" id="user-password" class="w-full p-2 border border-gray-300 rounded" required></div>
                <button type="submit" class="w-full bg-${color}-600 text-white p-2 rounded hover:opacity-90">${formType}</button>
            </form>
            <p class="mt-4 text-center text-sm">
                ${isSignIn ? "Don't have an account?" : "Already have an account?"} 
                <a href="#" id="go-to-other-form" class="text-${color}-600 hover:underline">${otherForm}</a>
            </p>
        </div>
    `;
}

function loadTutorSignInView() {
    $('#content-area').html(loadAuthForm('Tutor', true));
    $('#tutor-auth-form').on('submit', (e) => {
        e.preventDefault();
        handleSignIn('Tutor', $('#user-email').val(), $('#user-password').val());
    });
    $('#go-to-other-form').on('click', (e) => { e.preventDefault(); loadTutorSignUpView(); });
}

function loadTutorSignUpView() {
    $('#content-area').html(loadAuthForm('Tutor', false));
    $('#tutor-auth-form').on('submit', (e) => {
        e.preventDefault();
        handleSignUp('Tutor', $('#user-name').val(), $('#user-email').val(), $('#user-password').val());
    });
    $('#go-to-other-form').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); });
}

function loadStudentSignInView() {
    $('#content-area').html(loadAuthForm('Student', true));
    $('#student-auth-form').on('submit', (e) => {
        e.preventDefault();
        handleSignIn('Student', $('#user-email').val(), $('#user-password').val());
    });
    $('#go-to-other-form').on('click', (e) => { e.preventDefault(); loadStudentSignUpView(); });
}

function loadStudentSignUpView() {
    $('#content-area').html(loadAuthForm('Student', false));
    $('#student-auth-form').on('submit', (e) => {
        e.preventDefault();
        handleSignUp('Student', $('#user-name').val(), $('#user-email').val(), $('#user-password').val());
    });
    $('#go-to-other-form').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); });
}


// --- Tutor Dashboard (API Logic Implemented) ---

function loadTutorDashboardView() {
    const tutor = getLoggedInUser();

    if (!tutor || getLoggedInUserType() !== 'Tutor') {
        loadTutorSignInView();
        return;
    }

    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">👋 Welcome to your Dashboard, ${tutor.name}!</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-stats-container">
            
            <div id="course-count-card" class="bg-indigo-600 text-white p-6 rounded-lg shadow-xl">
                <p class="text-sm uppercase opacity-80">Total Courses Published</p>
                <p class="text-4xl font-extrabold mt-1">...</p>
                <p class="text-sm mt-3"><a href="#" id="view-my-courses" class="underline hover:text-indigo-200">View/Manage Courses</a></p>
            </div>
            
             <div id="enrollment-count-card" class="bg-green-600 text-white p-6 rounded-lg shadow-xl">
                <p class="text-sm uppercase opacity-80">Total Student Enrollments</p>
                <p class="text-4xl font-extrabold mt-1">...</p>
                <p class="text-sm mt-3">Across all your courses</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-xl border-t-4 border-green-500">
                <p class="text-xl font-semibold text-gray-800 mb-3">Quick Action</p>
                <button id="add-new-course" class="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition">
                    + Add New Course Video
                </button>
            </div>

        </div>
    `);

    // API Call to fetch dashboard stats
    $.get(`${API_BASE_URL}/dashboard/tutor/${tutor.id}`, function (stats) {
        // Assuming the backend returns { courseCount, totalEnrollments }
        $('#course-count-card .text-4xl').text(stats.courseCount || 0);
        $('#enrollment-count-card .text-4xl').text(stats.totalEnrollments || 0);
    }).fail(() => {
        $('#course-count-card .text-4xl').text('Error');
        $('#enrollment-count-card .text-4xl').text('Error');
    });

    setupTutorDashboardHandlers();
}

function setupTutorDashboardHandlers() {
    $('#add-new-course').off('click').on('click', loadCourseUploadView);
    $('#view-my-courses').off('click').on('click', (e) => {
        e.preventDefault();
        loadTutorCoursesView();
    });
}

function loadTutorCoursesView() {
    const tutor = getLoggedInUser();
    if (!tutor) { loadTutorSignInView(); return; }

    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">📝 My Published Courses</h2>
        <div id="tutor-course-list" class="space-y-4">
            <p class="text-gray-500">Loading your courses...</p>
        </div>
        <button onclick="loadTutorDashboardView()" class="mt-6 bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition">Back to Dashboard</button>
    `);

    // API Call to get courses for the tutor
    $.get(`${API_BASE_URL}/courses?tutorId=${tutor.id}`, function (courses) {
        const listContainer = $('#tutor-course-list');
        listContainer.empty();

        if (courses.length === 0) {
            listContainer.html('<p class="text-gray-500 p-4 border rounded-md">You have not published any courses yet. <a href="#" id="add-from-list" class="font-semibold text-indigo-600">Add one now!</a></p>');
            $('#add-from-list').on('click', (e) => { e.preventDefault(); loadCourseUploadView(); });
            return;
        }

        const coursesHtml = courses.map(course => `
            <div class="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div>
                    <p class="text-lg font-semibold text-gray-900">${course.title}</p>
                    <p class="text-sm text-gray-500">${course.description ? course.description.substring(0, 70) : ''}...</p>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm font-medium text-green-600">${course.enrollmentCount || 0} Enrolled</span>
                    <button data-course-id="${course._id}" data-course-title="${course.title}" class="delete-course-btn bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition">Delete Course</button>
                </div>
            </div>
        `).join('');

        listContainer.html(coursesHtml);

        // Attach deletion handler
        $('#content-area').off('click', '.delete-course-btn').on('click', '.delete-course-btn', function (e) {
            e.preventDefault();
            deleteCourseApi($(this).data('course-id'));
        });
    }).fail(() => {
        // FIX: Improved error message for failed load
        $('#tutor-course-list').html('<p class="text-red-500">Failed to load courses from the API. Check network and server logs.</p>');
    });
}

/**
 * Renders the Course Upload/Creation Form.
 */
function loadCourseUploadView() {
    const tutor = getLoggedInUser();
    if (!tutor) { loadTutorSignInView(); return; }

    // Chapter helper function (dynamic input handling)
    function createChapterInput(title = '', timestamp = '') {
        return `
            <div class="flex space-x-2 items-center mb-2 p-2 bg-gray-50 rounded chapter-row">
                <input type="text" placeholder="Chapter Title (e.g., Intro to Arrays)" value="${title}" class="chapter-title-input p-2 border border-gray-300 rounded w-1/2">
                <input type="text" placeholder="Timestamp (e.g., 00:01:30)" value="${timestamp}" class="chapter-timestamp-input p-2 border border-gray-300 rounded w-1/3">
                <button type="button" class="remove-chapter-btn text-red-500 hover:text-red-700 p-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `;
    }

    $('#content-area').html(`
        <h2 class="text-3xl font-bold text-gray-800 mb-6">📹 Publish a New Course</h2>
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-3xl mx-auto border-t-4 border-green-600">
            <form id="new-course-form" enctype="multipart/form-data" class="space-y-4">
                
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Course Title</label>
                    <input type="text" name="title" class="w-full p-3 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500" required>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-medium mb-1">Short Description</label>
                    <textarea name="description" rows="3" class="w-full p-3 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500" required></textarea>
                </div>
                
                <div class="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <label class="block text-gray-700 font-medium text-lg">Course Video Content</label>
                    
                    <div class="flex items-center space-x-4">
                        <label for="asset-type-local" class="flex items-center">
                            <input type="radio" id="asset-type-local" name="assetType" value="local" checked class="form-radio text-green-600">
                            <span class="ml-2 text-gray-700">Upload Video File</span>
                        </label>
                        <label for="asset-type-youtube" class="flex items-center">
                            <input type="radio" id="asset-type-youtube" name="assetType" value="youtube" class="form-radio text-green-600">
                            <span class="ml-2 text-gray-700">YouTube Video Link</span>
                        </label>
                    </div>

                    <div id="local-upload-field" class="space-y-2">
                        <label class="block text-gray-700 font-medium mb-1">Video File (MP4, MOV, etc.)</label>
                        <input type="file" name="videoFile" accept="video/*" class="w-full p-2 border border-gray-300 rounded" required>
                    </div>
                    
                    <div id="youtube-link-field" class="hidden space-y-2">
                        <label class="block text-gray-700 font-medium mb-1">YouTube Video ID or URL</label>
                        <input type="text" name="youtubeUrl" placeholder="e.g., dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ" class="w-full p-3 border border-gray-300 rounded">
                        <p class="text-xs text-gray-500">Note: Use the Video ID or the full link. We will extract the ID.</p>
                    </div>

                    <div class="space-y-2 pt-4 border-t border-gray-200 mt-4">
                        <label class="block text-gray-700 font-medium mb-1">Subtitle URL (.vtt or .srt) (Optional)</label>
                        <input type="url" name="subtitleUrl" placeholder="Paste subtitle URL here (e.g., /subtitles/mycourse.vtt)" class="w-full p-3 border border-gray-300 rounded">
                    </div>
                    </div>

                <div class="border p-4 rounded-lg space-y-3">
                    <h3 class="text-xl font-semibold text-gray-800">Video Chapters (Optional)</h3>
                    <div id="chapter-list-editor" class="space-y-2">
                        </div>
                    <button type="button" id="add-chapter-btn" class="text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Add Chapter
                    </button>
                </div>

                <button type="submit" class="w-full bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700 transition shadow-lg">
                    Publish Course
                </button>
            </form>
        </div>
    `);

    // 2. Attach Dynamic Handlers
    // Asset Type Toggle
    $('input[name="assetType"]').on('change', function () {
        if ($(this).val() === 'local') {
            $('#local-upload-field').show().find('input').prop('required', true);
            $('#youtube-link-field').hide().find('input').prop('required', false).val(''); // Clear URL when switching
        } else {
            $('#local-upload-field').hide().find('input').prop('required', false).val(''); // Clear file when switching
            $('#youtube-link-field').show().find('input').prop('required', true);
        }
    });

    // Chapter Management
    $('#add-chapter-btn').on('click', function () {
        $('#chapter-list-editor').append(createChapterInput());
    });

    // Use delegation for removing chapters
    $('#chapter-list-editor').off('click', '.remove-chapter-btn').on('click', '.remove-chapter-btn', function () {
        $(this).closest('.chapter-row').remove();
    });

    // Form Submission
    $('#new-course-form').off('submit').on('submit', function (e) {
        e.preventDefault();
        handleTutorCourseCreation();
    });
}


// --- Student Catalog & Enrolled Courses (API Logic Implemented) ---

function loadStudentCourseCatalog() {
    const student = getLoggedInUser();
    const studentId = student ? student.id : null;

    $('#content-area').html(`
        <h2 class="text-3xl font-bold mb-6 text-gray-800">📚 Course Catalog</h2>
        <div id="course-catalog-list" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <p class="text-gray-500 col-span-3">Fetching available courses...</p>
        </div>
    `);

    // API Call to get all courses (if logged in, append studentId to check enrollment status)
    $.get(`${API_BASE_URL}/courses/all${studentId ? `?studentId=${studentId}` : ''}`, function (courses) {
        const listContainer = $('#course-catalog-list');
        listContainer.empty();

        if (courses.length === 0) {
            listContainer.html('<p class="text-gray-600 col-span-3">No courses available yet. Check back soon!</p>');
            return;
        }

        courses.forEach(course => {
            // Note: isEnrolled flag comes from the backend if studentId was passed
            const isEnrolled = course.isEnrolled || false;
            const buttonText = isEnrolled ? 'View Course' : (studentId ? 'Enroll Now' : 'Login to Enroll');
            const buttonClass = isEnrolled ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700';

            listContainer.append(`
                <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition course-card" data-id="${course._id}">
                    <h3 class="text-xl font-semibold text-indigo-700">${course.title}</h3>
                    <p class="text-gray-600 text-sm mt-1">Tutor: ${course.tutor ? course.tutor.name : 'N/A'}</p>
                    <p class="text-gray-600 text-sm mt-1">${course.description ? course.description.substring(0, 100) : 'No description'}...</p>
                    <p class="text-xs text-gray-500 mt-2">${course.enrollmentCount || 0} students enrolled</p>
                    <button class="action-btn mt-3 text-white px-3 py-1 text-sm rounded ${buttonClass}" 
                        data-id="${course._id}" data-action="${isEnrolled ? 'view' : (studentId ? 'enroll' : 'login')}">${buttonText}</button>
                </div>
            `);
        });

        // Attach handlers
        listContainer.off('click', '.action-btn').on('click', '.action-btn', function () {
            const courseId = $(this).data('id');
            const action = $(this).data('action');

            if (action === 'enroll') {
                handleEnrollment(courseId);
            } else if (action === 'view') {
                fetchAndLoadCoursePlayer(courseId);
            } else if (action === 'login') {
                loadStudentSignInView();
            }
        });
    }).fail(() => {
        $('#course-catalog-list').html('<p class="text-red-500 col-span-3">Failed to load courses from the API.</p>');
    });
}

function loadStudentCoursesView() {
    const student = getLoggedInUser();
    if (!student || getLoggedInUserType() !== 'Student') {
        loadStudentSignInView();
        return;
    }

    $('#content-area').html(`
        <h2 class="text-3xl font-bold mb-6 text-gray-800">My Enrolled Courses</h2>
        <div id="enrolled-courses-list" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <p class="text-gray-500 col-span-3">Fetching your enrolled courses...</p>
        </div>
    `);

    // API Call to get enrolled courses for the student
    $.get(`${API_BASE_URL}/enrollments/${student.id}`, function (enrollments) {
        const listContainer = $('#enrolled-courses-list');
        listContainer.empty();

        if (enrollments.length === 0) {
            listContainer.html('<p class="text-gray-600 col-span-3">You are not enrolled in any courses yet. <a href="#" onclick="loadStudentCourseCatalog();" class="text-indigo-600 font-semibold">Browse the catalog to get started.</a></p>');
            return;
        }

        enrollments.forEach(enrollment => {
            const course = enrollment.courseId; // Assuming backend populates the course details here

            listContainer.append(`
                <div class="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition course-card" data-id="${course._id}">
                    <h3 class="text-xl font-semibold text-green-700">${course.title}</h3>
                    <p class="text-gray-600 text-sm mt-1">Tutor: ${course.tutor ? course.tutor.name : 'N/A'}</p>
                    <p class="text-gray-600 text-sm mt-1">Progress: **${enrollment.progressPercentage || 0}%**</p>
                    <button class="view-btn mt-3 bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700" 
                        data-id="${course._id}">Continue Learning</button>
                </div>
            `);
        });

        // Attach view handler
        listContainer.off('click', '.view-btn').on('click', '.view-btn', function () {
            fetchAndLoadCoursePlayer($(this).data('id'));
        });
    }).fail(() => {
        $('#enrolled-courses-list').html('<p class="text-red-500 col-span-3">Failed to load your enrolled courses from the API.</p>');
    });
}


// --- 8. Global Handlers ---

function attachNavHandlers() {
    // Sign Out Handler (works for both desktop and mobile through delegation)
    $('body').off('click', '#nav-sign-out').on('click', '#nav-sign-out', function (e) {
        e.preventDefault();
        handleSignOut($(this).data('user-type'));
    });

    // Global Home Link (Logo/Home Button)
    $('#home-nav-link').off('click').on('click', function (e) {
        e.preventDefault();
        const userType = getLoggedInUserType();
        if (userType === 'Tutor') loadTutorDashboardView();
        else if (userType === 'Student') loadStudentCoursesView();
        else loadStudentCourseCatalog();
    });

    // Student/Public Navigation
    $('body').off('click', '#view-tutorials-link').on('click', '#view-tutorials-link', (e) => { e.preventDefault(); loadStudentCourseCatalog(); });
    $('body').off('click', '#student-tutorials-link').on('click', '#student-tutorials-link', (e) => { e.preventDefault(); loadStudentCoursesView(); });
    $('body').off('click', '#student-sign-in').on('click', '#student-sign-in', (e) => { e.preventDefault(); loadStudentSignInView(); });
    $('body').off('click', '#student-sign-up').on('click', '#student-sign-up', (e) => { e.preventDefault(); loadStudentSignUpView(); });

    // Tutor Navigation
    $('body').off('click', '#tutor-sign-in').on('click', '#tutor-sign-in', (e) => { e.preventDefault(); loadTutorSignInView(); });
    $('body').off('click', '#tutor-sign-up').on('click', '#tutor-sign-up', (e) => { e.preventDefault(); loadTutorSignUpView(); });
    $('body').off('click', '#tutor-dashboard-link').on('click', '#tutor-dashboard-link', (e) => { e.preventDefault(); loadTutorDashboardView(); });

    // Landing Page Handlers
    $('#student-sign-in-from-landing').off('click').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); });
    $('#tutor-sign-in-from-landing').off('click').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); });
}


// --- 9. Document Ready (Initialization) ---
$(document).ready(function () {

    // 1. Initial State Check
    const userType = getLoggedInUserType();
    const isLoggedIn = !!userType;

    // 2. Load Navigation and Initial View
    // This is run first to set up the links based on session
    updateNavVisibility(userType, isLoggedIn);

    // 3. Decide which view to load
    if (isLoggedIn) {
        // If logged in, clear the landing page and load the dashboard/my courses
        if (userType === 'Tutor') loadTutorDashboardView();
        else loadStudentCoursesView();
    } else {
        // If logged out, the initial index.html landing page is already visible
        // We only switch to the catalog view if the user clicks the "Browse Catalog" link
        // However, for consistency, let's load the full catalog if they aren't on the landing page
        const isDefaultLandingPage = $('#content-area section').length > 0;
        if (!isDefaultLandingPage) {
            loadStudentCourseCatalog(); // Fallback in case a direct link was used
        }
    }

    // 4. Mobile menu toggle
    $('#mobile-menu-toggle').on('click', function () {
        $('#mobile-menu').toggleClass('hidden');
        $('#menu-icon').toggleClass('hidden');
        $('#close-icon').toggleClass('hidden');
    });

    // 5. Attach global handlers (already run once in updateNavVisibility, but kept here for clarity/safety)
    attachNavHandlers();
});