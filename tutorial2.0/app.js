// app.js (Frontend Code with REAL API Calls - FINAL)

// --- 1. API Configuration ---
const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_ROOT = 'http://localhost:5000'; // Used for fetching local assets

// --- 2. Helper Functions for User Session ---
// app.js (Around line 7)

/** Fetches the logged-in user's MongoDB ID. */
function getLoggedInUserId() {
    const tutor = localStorage.getItem('loggedInTutor');
    const student = localStorage.getItem('loggedInStudent');

    // CRITICAL FIX: Use the MongoDB primary key '_id'
    if (tutor) return JSON.parse(tutor)._id; 
    if (student) return JSON.parse(student)._id; 
    return null;
}
/** Determines if the logged-in user is a 'Tutor' or 'Student'. */
function getLoggedInUserType() {
    if (localStorage.getItem('loggedInTutor')) return 'Tutor';
    if (localStorage.getItem('loggedInStudent')) return 'Student';
    return null;
}

/** Retrieves the full user object (id and name) from local storage. */
function getLoggedInUser() {
    const userType = getLoggedInUserType();
    return userType ? JSON.parse(localStorage.getItem(`loggedIn${userType}`)) : null;
}

/** Clears the user session and reloads the landing page. */
function handleSignOut(e) {
    if (e) e.preventDefault(); 
    localStorage.removeItem('loggedInTutor');
    localStorage.removeItem('loggedInStudent');
    clearContentArea();
    loadLandingPageView();
    // Update navigation to logged-out state
    updateNavVisibility(null, false); 
    hideMobileMenu();
}

// --- 3. UI Helper Functions ---

/** Constructs the full URL for a course asset. */
function getAssetUrl(asset) {
    if (asset.type === 'local') {
        return `${API_BASE_ROOT}/uploads/${asset.url}`;
    }
    return asset.url;
}

/** Truncates text for display in card snippets. */
function truncateText(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

/** Generates star icons HTML based on a rating. */
function renderRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let html = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star text-yellow-400"></i>';
    }

    // Half star
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }

    // Empty stars to complete 5
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star text-gray-400"></i>';
    }

    return html;
}

/** Clears the main content area. */
function clearContentArea() {
    $('#content-area').empty();
}

/** Hides the mobile menu. */
function hideMobileMenu() {
    $('#mobile-menu').removeClass('translate-y-0').addClass('-translate-y-full');
    $('#menu-icon').removeClass('hidden');
    $('#close-icon').addClass('hidden');
}

// CRITICAL FIX (Request 1): Robust function to extract the YouTube video ID
function getYouTubeId(url) {
    if (!url) return null;
    // Regex for standard links, short links, mobile links, and embed links
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|\w+\/|watch\?v=|\/shorts\/|embed\/|v\/)|youtu\.be\/)([^\s&]+)/;
    const match = url.match(regex);
    // Standard YouTube video IDs are 11 characters long
    return (match && match[1] && match[1].length === 11) ? match[1] : null; 
}


// --- 4. UI Helper: Navigation Visibility ---

function updateNavVisibility(userType, isLoggedIn) {
    const user = getLoggedInUser();

    // 4.1. Define Navigation HTML based on roles
    const tutorNavHtml = `
        <a href="#" id="nav-tutor-dashboard" class="text-white hover:text-indigo-200 transition">Dashboard</a>
        <a href="#" id="nav-create-course" class="text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded-full transition">Create Course</a>
        <span class="text-indigo-200">Hi, ${user ? user.name.split(' ')[0] : ''}</span>
        <a href="#" id="nav-sign-out" class="text-white hover:text-indigo-200 transition">Sign Out</a>
    `;

    const studentNavHtml = `
        <a href="#" id="nav-course-catalog" class="text-white hover:text-indigo-200 transition">Catalog</a>
        <a href="#" id="nav-my-courses" class="text-white hover:text-indigo-200 transition">My Courses</a>
        <span class="text-indigo-200">Hi, ${user ? user.name.split(' ')[0] : ''}</span>
        <a href="#" id="nav-sign-out" class="text-white hover:text-indigo-200 transition">Sign Out</a>
    `;

    const loggedOutNavHtml = `
        <a href="#" id="nav-course-catalog" class="text-white hover:text-indigo-200 transition">Catalog</a>
        <a href="#" id="nav-student-auth" class="text-white hover:text-indigo-200 transition">Student Sign In/Up</a>
        <a href="#" id="nav-tutor-auth" class="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition">Tutor Sign In</a>
    `;

    // 4.2. Apply HTML to Desktop and Mobile menus
    let desktopHtml = '', mobileHtml = '';
    
    if (isLoggedIn) {
        if (userType === 'Tutor') {
            desktopHtml = tutorNavHtml;
            mobileHtml = `
                <a href="#" id="mobile-nav-home" class="text-white hover:text-indigo-200 transition">Home</a>
                <a href="#" id="mobile-nav-tutor-dashboard" class="text-white hover:text-indigo-200 transition">Dashboard</a>
                <a href="#" id="mobile-nav-create-course" class="text-white hover:text-indigo-200 transition">Create Course</a>
                <div class="border-t border-indigo-500 my-2"></div>
                <span class="text-indigo-200">Hi, ${user.name.split(' ')[0]}</span>
                <a href="#" id="mobile-nav-sign-out" class="text-white hover:text-indigo-200 transition">Sign Out</a>
            `;
        } else { // Student
            desktopHtml = studentNavHtml;
            mobileHtml = `
                <a href="#" id="mobile-nav-home" class="text-white hover:text-indigo-200 transition">Home</a>
                <a href="#" id="mobile-nav-course-catalog" class="text-white hover:text-indigo-200 transition">Catalog</a>
                <a href="#" id="mobile-nav-my-courses" class="text-white hover:text-indigo-200 transition">My Courses</a>
                <div class="border-t border-indigo-500 my-2"></div>
                <span class="text-indigo-200">Hi, ${user.name.split(' ')[0]}</span>
                <a href="#" id="mobile-nav-sign-out" class="text-white hover:text-indigo-200 transition">Sign Out</a>
            `;
        }
    } else { // Logged out
        desktopHtml = loggedOutNavHtml;
        mobileHtml = `
            <a href="#" id="mobile-nav-home" class="text-white hover:text-indigo-200 transition">Home</a>
            <a href="#" id="mobile-nav-course-catalog" class="text-white hover:text-indigo-200 transition">Catalog</a>
            <a href="#" id="mobile-nav-student-auth" class="text-white hover:text-indigo-200 transition">Student Sign In/Up</a>
            <a href="#" id="mobile-nav-tutor-auth" class="text-white hover:text-indigo-200 transition">Tutor Sign In</a>
        `;
    }

    $('#desktop-menu-links').html(desktopHtml);
    $('#mobile-menu-links').html(mobileHtml);
}


// --- 5. View: User Authentication ---

function loadStudentSignInView() {
    // ... HTML for Student Sign In form
    const html = `
        <div class="max-w-md mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-600">
            <h2 class="text-3xl font-bold text-center text-indigo-700 mb-6">Student Sign In</h2>
            <form id="student-signin-form">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="student@example.com" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="********" required>
                </div>
                <div class="flex items-center justify-between">
                    <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition" type="submit">
                        Sign In
                    </button>
                    <a href="#" id="go-to-student-signup" class="inline-block align-baseline font-bold text-sm text-indigo-500 hover:text-indigo-800">
                        Need an account? Sign Up
                    </a>
                </div>
                <div id="signin-message" class="mt-4 text-center"></div>
            </form>
        </div>
    `;
    $('#content-area').html(html);

    // Attach form submission and link handler
    $('#student-signin-form').off('submit').on('submit', (e) => handleSignIn(e, 'student'));
    $('#go-to-student-signup').off('click').on('click', (e) => { e.preventDefault(); loadStudentSignUpView(); });
}

function loadStudentSignUpView() {
    // ... HTML for Student Sign Up form
    const html = `
        <div class="max-w-md mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-600">
            <h2 class="text-3xl font-bold text-center text-indigo-700 mb-6">Student Sign Up</h2>
            <form id="student-signup-form">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Your Name" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="student@example.com" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="********" required>
                </div>
                <div class="flex items-center justify-between">
                    <button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition" type="submit">
                        Sign Up
                    </button>
                    <a href="#" id="go-to-student-signin" class="inline-block align-baseline font-bold text-sm text-indigo-500 hover:text-indigo-800">
                        Already have an account? Sign In
                    </a>
                </div>
                <div id="signup-message" class="mt-4 text-center"></div>
            </form>
        </div>
    `;
    $('#content-area').html(html);

    // Attach form submission and link handler
    $('#student-signup-form').off('submit').on('submit', (e) => handleSignUp(e, 'student'));
    $('#go-to-student-signin').off('click').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); });
}

function loadTutorSignInView() {
    // ... HTML for Tutor Sign In form
    const html = `
        <div class="max-w-md mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-green-600">
            <h2 class="text-3xl font-bold text-center text-green-700 mb-6">Tutor Sign In</h2>
            <form id="tutor-signin-form">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="tutor@example.com" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="********" required>
                </div>
                <div class="flex items-center justify-between">
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition" type="submit">
                        Sign In
                    </button>
                    <a href="#" id="go-to-tutor-signup" class="inline-block align-baseline font-bold text-sm text-green-500 hover:text-green-800">
                        New Tutor? Sign Up
                    </a>
                </div>
                <div id="signin-message" class="mt-4 text-center"></div>
            </form>
        </div>
    `;
    $('#content-area').html(html);

    // Attach form submission and link handler
    $('#tutor-signin-form').off('submit').on('submit', (e) => handleSignIn(e, 'tutor'));
    $('#go-to-tutor-signup').off('click').on('click', (e) => { e.preventDefault(); loadTutorSignUpView(); });
}

function loadTutorSignUpView() {
    // ... HTML for Tutor Sign Up form
    const html = `
        <div class="max-w-md mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-green-600">
            <h2 class="text-3xl font-bold text-center text-green-700 mb-6">Tutor Sign Up</h2>
            <form id="tutor-signup-form">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Your Name" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="tutor@example.com" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">Password</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="********" required>
                </div>
                <div class="flex items-center justify-between">
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition" type="submit">
                        Sign Up
                    </button>
                    <a href="#" id="go-to-tutor-signin" class="inline-block align-baseline font-bold text-sm text-green-500 hover:text-green-800">
                        Already have an account? Sign In
                    </a>
                </div>
                <div id="signup-message" class="mt-4 text-center"></div>
            </form>
        </div>
    `;
    $('#content-area').html(html);

    // Attach form submission and link handler
    $('#tutor-signup-form').off('submit').on('submit', (e) => handleSignUp(e, 'tutor'));
    $('#go-to-tutor-signin').off('click').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); });
}

// --- 6. User Auth API Handlers ---

function handleSignUp(e, role) {
    e.preventDefault();
    const form = $(e.target);
    const name = form.find('#name').val();
    const email = form.find('#email').val();
    const password = form.find('#password').val();
    // Using form.find() is generally safer than relying on a complex ID selector
    const messageArea = form.find('#signup-message'); 

    messageArea.removeClass().html('<span class="text-blue-500">Processing...</span>');

    // CRITICAL FIX: Use $.ajax for explicit JSON content type
    $.ajax({
        url: `${API_BASE_URL}/users/signup`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name, email, password, role }), // Send as JSON string
        
        success: function(data) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text('Account created! Please sign in.');
            // Automatically switch to sign-in view after a delay
            setTimeout(() => {
                if (role === 'student') loadStudentSignInView();
                else loadTutorSignInView();
            }, 1500);
        },
        
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Signup failed. Please try again.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
        }
    });
}

function handleSignIn(e, role) {
    e.preventDefault();
    const form = $(e.target);
    const email = form.find('#email').val();
    const password = form.find('#password').val();
    // Using form.find() is generally safer than relying on a complex ID selector
    const messageArea = form.find('#signin-message'); 

    messageArea.removeClass().html('<span class="text-blue-500">Processing...</span>');

    // CRITICAL FIX: Use $.ajax for explicit JSON content type
    $.ajax({
        url: `${API_BASE_URL}/users/signin`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password, role }), // Send as JSON string
        
        success: function(response) {
            // CRITICAL FIX: Get the user object from the nested 'user' field in the response
            const user = response.user;
            // The helper functions use a capitalized user type ('Tutor' or 'Student')
            const userType = user.role.charAt(0).toUpperCase() + user.role.slice(1); 

            // Save user data to localStorage
            localStorage.setItem(`loggedIn${userType}`, JSON.stringify(user));
            
            messageArea.removeClass().addClass('text-green-600 font-bold').text(`Welcome, ${user.name.split(' ')[0]}!`);
            
            // Update UI and load dashboard
            updateNavVisibility(userType, true);
            setTimeout(() => {
                clearContentArea();
                if (user.role === 'tutor') loadTutorDashboardView();
                else loadStudentCoursesView();
            }, 1000);
        },
        
        error: function(xhr) {
            // Handle error response from server (e.g., 401 Unauthorized)
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Sign-in failed. Check your email and password.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
        }
    });
}

// --- 7. Student Views ---

function loadLandingPageView() {
    // Re-render the default content from index.html (only used when navigating "Home" while logged out)
    const html = `
        <section class="text-center py-20 bg-white rounded-xl shadow-2xl">
            <h2 class="text-5xl font-extrabold text-indigo-800 mb-4">Your Platform for Video Tutorials</h2>
            <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Learn new skills from experts or share your knowledge with the world.
            </p>

            <div class="flex flex-col md:flex-row justify-center gap-10">
                
                <div class="p-8 bg-indigo-50 rounded-xl shadow-2xl max-w-sm border-t-4 border-indigo-600 hover:shadow-3xl transition duration-300">
                    <h3 class="text-2xl font-bold text-indigo-700 mb-4"><i class="fas fa-user-graduate"></i> I'm a Student</h3>
                    <p class="text-gray-700 mb-6">Access a growing catalog of video courses, track your progress, and engage in discussions.</p>
                    <a href="#" id="student-sign-in-from-landing" 
                        class="w-full inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700 transition shadow-lg">
                        Start Learning &rarr;
                    </a>
                </div>
                
                <div class="p-8 bg-green-50 rounded-xl shadow-2xl max-w-sm border-t-4 border-green-600 hover:shadow-3xl transition duration-300">
                    <h3 class="text-2xl font-bold text-green-700 mb-4"><i class="fas fa-chalkboard-teacher"></i> I'm a Tutor</h3>
                    <p class="text-gray-700 mb-6">Publish your custom video tutorials using local files or YouTube embeds, and manage your content.</p>
                    <a href="#" id="tutor-sign-in-from-landing" 
                        class="w-full inline-block bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition shadow-lg">
                        Become an Instructor &rarr;
                    </a>
                </div>

            </div>
            
            <div class="mt-12 text-center">
                <p class="text-gray-600">
                    Or simply <a href="#" id="browse-catalog-from-landing" class="text-indigo-600 font-semibold hover:text-indigo-800">Browse the Course Catalog</a>
                </p>
            </div>
            
        </section>
    `;
    $('#content-area').html(html);
    attachLandingPageHandlers();
}

function loadStudentCourseCatalog() {
    clearContentArea();
    $('#content-area').html('<div class="max-w-7xl mx-auto my-10 px-4"><h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">All Courses</h2><div id="course-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">Loading courses...</div></div>');

    $.get(`${API_BASE_URL}/courses`)
        .done(function(courses) {
            const $courseList = $('#course-list');
            $courseList.empty();

            if (courses.length === 0) {
                $courseList.html('<p class="text-gray-500 col-span-full text-center">No courses have been published yet.</p>');
                return;
            }

            courses.forEach(course => {
                const card = `
                    <div class="course-card bg-white rounded-xl shadow-lg p-6 flex flex-col transition duration-300 hover:shadow-2xl cursor-pointer" data-course-id="${course._id}">
                        <h3 class="text-xl font-bold text-indigo-700 mb-2">${course.title}</h3>
                        <p class="text-sm text-gray-500 mb-3">Tutor: ${course.tutorId.name}</p>
                        <p class="text-gray-700 mb-4 flex-grow">${truncateText(course.description, 100)}</p>
                        
                        <div class="flex items-center justify-between mt-auto">
                            <div class="flex items-center">
                                ${renderRating(course.averageRating)}
                                <span class="text-sm text-gray-600 ml-2">(${course.totalReviews} reviews)</span>
                            </div>
                            <span class="text-sm text-gray-600">${course.enrolledStudents} enrolled</span>
                        </div>
                        <button class="view-course-btn mt-4 w-full bg-indigo-500 text-white py-2 rounded-full font-semibold hover:bg-indigo-600 transition" data-id="${course._id}">
                            View Course
                        </button>
                    </div>
                `;
                $courseList.append(card);
            });

            // Attach handler to view course details
            $courseList.off('click', '.view-course-btn').on('click', '.view-course-btn', function() {
                loadCourseDetailsView($(this).data('id'));
            });
        })
        .fail(function() {
            $('#course-list').html('<p class="text-red-500 col-span-full text-center">Failed to load courses from the catalog.</p>');
        });
}

function loadStudentCoursesView() {
    const studentId = getLoggedInUserId();
    if (!studentId || getLoggedInUserType() !== 'Student') {
        alert('Please sign in as a student to view your courses.');
        loadStudentSignInView();
        return;
    }

    clearContentArea();
    $('#content-area').html('<div class="max-w-6xl mx-auto my-10 px-4"><h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">My Enrolled Courses</h2><div id="enrolled-list" class="space-y-6">Loading your courses...</div>');

    $.get(`${API_BASE_URL}/enrollments/${studentId}`)
        .done(function(enrollments) {
            const $enrolledList = $('#enrolled-list');
            $enrolledList.empty();

            if (enrollments.length === 0) {
                $enrolledList.html('<p class="text-gray-500">You are not enrolled in any courses yet. <a href="#" id="go-to-catalog" class="text-indigo-600 hover:text-indigo-800 font-semibold">Browse the Catalog</a> to start learning!</p>');
                // Attach Catalog link handler
                $('#go-to-catalog').off('click').on('click', (e) => { 
                    e.preventDefault(); 
                    loadStudentCourseCatalog(); 
                });
                return;
            }

            enrollments.forEach(enrollment => {
                const course = enrollment.courseId;
                const progress = enrollment.progressPercentage;

                const card = `
                    <div class="enrollment-card bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center transition duration-300 hover:shadow-xl cursor-pointer" data-course-id="${course._id}" data-enrollment-id="${enrollment._id}">
                        <div class="flex-grow">
                            <h3 class="text-xl font-bold text-indigo-700">${course.title}</h3>
                            <p class="text-sm text-gray-500 mb-3">Tutor: ${course.tutorId.name}</p>
                            <div class="flex items-center mb-4">
                                ${renderRating(course.averageRating)}
                                <span class="text-sm text-gray-600 ml-2">(${course.totalReviews} reviews)</span>
                            </div>
                        </div>
                        <div class="w-full md:w-1/3 mt-4 md:mt-0 md:ml-6">
                            <div class="text-sm font-semibold text-gray-700 mb-1">Progress: ${progress}%</div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="mt-4 md:mt-0 md:ml-6">
                            <a href="#" class="inline-block bg-indigo-600 text-white py-2 px-4 rounded-full font-semibold hover:bg-indigo-700 transition view-course-btn" data-id="${course._id}" data-enrollment-id="${enrollment._id}">
                                Continue Learning
                            </a>
                        </div>
                    </div>
                `;
                $enrolledList.append(card);
            });

            // Attach handler to view course details
            $enrolledList.off('click', '.view-course-btn').on('click', '.view-course-btn', function(e) {
                e.preventDefault();
                const courseId = $(this).data('id');
                const enrollmentId = $(this).data('enrollment-id');
                loadCourseDetailsView(courseId, enrollmentId);
            });
            // Also allow clicking anywhere on the card to open it
            $enrolledList.off('click', '.enrollment-card').on('click', '.enrollment-card', function(e) {
                // Prevent event from bubbling up if we clicked the button inside
                if ($(e.target).is('.view-course-btn')) return; 
                const courseId = $(this).data('course-id');
                const enrollmentId = $(this).data('enrollment-id');
                loadCourseDetailsView(courseId, enrollmentId);
            });
        })
        .fail(function() {
            $('#enrolled-list').html('<p class="text-red-500">Failed to load your enrolled courses.</p>');
        });
}

// --- 8. Tutor Views ---

function loadTutorDashboardView() {
    const tutorId = getLoggedInUserId();
    if (!tutorId || getLoggedInUserType() !== 'Tutor') {
        alert('Please sign in as a tutor to access this dashboard.');
        loadTutorSignInView();
        return;
    }

    clearContentArea();
    $('#content-area').html(`
        <div class="max-w-6xl mx-auto my-10 px-4">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Tutor Dashboard</h2>
            <button id="add-new-course-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition mb-6">
                <i class="fas fa-plus mr-2"></i>Create New Course
            </button>
            <div id="tutor-courses-list" class="space-y-6">Loading your courses...</div>
        </div>
    `);

    // Attach handler for create new course button
    $('#add-new-course-btn').off('click').on('click', loadCourseCreationView);

    $.get(`${API_BASE_URL}/tutors/${tutorId}/courses`)
        .done(function(courses) {
            const $courseList = $('#tutor-courses-list');
            $courseList.empty();

            if (courses.length === 0) {
                $courseList.html('<p class="text-gray-500">You have not published any courses yet. Click "Create New Course" to get started!</p>');
                return;
            }

            courses.forEach(course => {
                const card = `
                    <div class="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center transition duration-300 hover:shadow-xl">
                        <div class="flex-grow">
                            <h3 class="text-xl font-bold text-green-700">${course.title}</h3>
                            <div class="flex items-center my-2">
                                ${renderRating(course.averageRating)}
                                <span class="text-sm text-gray-600 ml-2">(${course.totalReviews} reviews)</span>
                            </div>
                            <p class="text-sm text-gray-600">${course.enrolledStudents} Students Enrolled</p>
                        </div>
                        <div class="mt-4 md:mt-0 md:ml-6 flex space-x-2">
                            <button class="view-course-btn bg-indigo-500 text-white py-2 px-4 rounded-full font-semibold transition hover:bg-indigo-600" data-id="${course._id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="delete-course-btn bg-red-500 text-white py-2 px-4 rounded-full font-semibold transition hover:bg-red-600" data-id="${course._id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                $courseList.append(card);
            });

            // Attach handlers for the dashboard
            $courseList.off('click', '.view-course-btn').on('click', '.view-course-btn', function() {
                loadCourseDetailsView($(this).data('id'), null, true); // Tutor view
            });
            $courseList.off('click', '.delete-course-btn').on('click', '.delete-course-btn', function() {
                handleCourseDeletion($(this).data('id'));
            });
        })
        .fail(function() {
            $('#tutor-courses-list').html('<p class="text-red-500">Failed to load your published courses.</p>');
        });
}

function handleCourseDeletion(courseId) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/courses/${courseId}`,
        type: 'DELETE',
        success: function() {
            alert('Course deleted successfully.');
            loadTutorDashboardView(); // Reload the dashboard
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Deletion failed.';
            alert('Error: ' + error);
        }
    });
}

function loadCourseCreationView() {
    clearContentArea();
    const html = `
        <div class="max-w-3xl mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-green-600">
            <h2 class="text-3xl font-bold text-center text-green-700 mb-6">Create New Course</h2>
            <form id="course-creation-form">
                <div class="mb-4">
                    <label class="block text-gray-700 font-bold mb-2" for="title">Course Title</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="title" type="text" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 font-bold mb-2" for="description">Description</label>
                    <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="description" rows="4" required></textarea>
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 font-bold mb-2" for="asset-type">Video Asset Type</label>
                    <select class="shadow border rounded w-full py-2 px-3 text-gray-700" id="asset-type" required>
                        <option value="">-- Select Type --</option>
                        <option value="youtube">YouTube URL</option>
                        <option value="local">Local File Upload</option>
                    </select>
                </div>
                
                <div id="youtube-url-field" class="hidden mb-4">
                    <label class="block text-gray-700 font-bold mb-2" for="asset-url">YouTube URL</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="asset-url" type="url" placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ">
                </div>
                
                <div id="local-upload-field" class="hidden mb-4">
                    <label class="block text-gray-700 font-bold mb-2" for="asset-file">Upload Local Video</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="asset-file" type="file" accept="video/*">
                    <p class="text-sm text-gray-500 mt-1">Maximum file size: 500 MB.</p>
                </div>
                
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-gray-700 mb-3 border-b pb-2">Course Chapters (Optional)</h3>
                    <div id="chapters-container">
                        </div>
                    <button type="button" id="add-chapter-btn" class="mt-3 bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-sm font-semibold hover:bg-indigo-200 transition">
                        <i class="fas fa-plus-circle mr-1"></i> Add Chapter
                    </button>
                </div>

                <div class="flex items-center justify-center">
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition shadow-lg" type="submit">
                        <i class="fas fa-upload mr-2"></i> Publish Course 
                    </button>
                </div>
                <div id="creation-message" class="mt-4 text-center"></div>
            </form>
        </div>
    `;
    $('#content-area').html(html);

    // Dynamic field visibility based on selection
    $('#asset-type').off('change').on('change', function() {
        const type = $(this).val();
        $('#local-upload-field, #youtube-url-field').addClass('hidden');
        // Clear and remove required attribute from fields
        $('#asset-file').prop('required', false).val('');
        $('#asset-url').prop('required', false).val('');

        if (type === 'local') {
            $('#local-upload-field').removeClass('hidden');
            $('#asset-file').prop('required', true);
        } else if (type === 'youtube') {
            $('#youtube-url-field').removeClass('hidden');
            $('#asset-url').prop('required', true);
        }
    });

    // Add chapter button handler
    $('#add-chapter-btn').off('click').on('click', function() {
        const chapterHtml = `
            <div class="chapter-item flex space-x-2 mt-3">
                <input type="text" class="chapter-title shadow border rounded w-1/2 py-2 px-3 text-gray-700" placeholder="Chapter Title">
                <input type="text" class="chapter-description shadow border rounded w-1/2 py-2 px-3 text-gray-700" placeholder="Description">
                <button type="button" class="remove-chapter-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>
        `;
        $('#chapters-container').append(chapterHtml);
    });

    // Remove chapter button handler (delegated)
    $('#chapters-container').off('click', '.remove-chapter-btn').on('click', '.remove-chapter-btn', function() {
        $(this).closest('.chapter-item').remove();
    });

    // Form submission handler
    $('#course-creation-form').off('submit').on('submit', handleCourseCreation);
}

function handleCourseCreation(e) {
    e.preventDefault();
    const tutorId = getLoggedInUserId();
    const form = $(e.target);
    const messageArea = form.find('#creation-message');
    
    messageArea.removeClass().html('<span class="text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Publishing course...</span>');

    const assetType = form.find('#asset-type').val();
    const assetFile = form.find('#asset-file')[0].files[0];
    const assetUrl = form.find('#asset-url').val();
    
    // Validate YouTube URL with the new helper
    if (assetType === 'youtube' && getYouTubeId(assetUrl) === null) {
        messageArea.removeClass().addClass('text-red-600 font-bold').text('Invalid YouTube URL provided.');
        return;
    }

    const formData = new FormData();
    formData.append('tutorId', tutorId);
    formData.append('title', form.find('#title').val());
    formData.append('description', form.find('#description').val());
    formData.append('assetType', assetType);
    
    if (assetType === 'local') {
        if (assetFile) formData.append('video', assetFile);
    } else if (assetType === 'youtube') {
        formData.append('assetUrl', assetUrl);
    }

    // Collect chapters
    const chapters = [];
    form.find('.chapter-item').each(function() {
        const title = $(this).find('.chapter-title').val();
        const description = $(this).find('.chapter-description').val();
        if (title.trim()) { // Only save chapters with a title
            chapters.push({ title, description });
        }
    });
    formData.append('chapters', JSON.stringify(chapters)); // Send as JSON string

    // API Call to create course (using FormData)
    $.ajax({
        url: `${API_BASE_URL}/courses`,
        type: 'POST',
        data: formData,
        processData: false, // Don't process the data, let FormData handle it
        contentType: false, // Don't set content type, let jQuery/browser set it
        
        success: function(course) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text(`Course "${course.title}" published successfully!`);
            // Automatically switch to dashboard after a delay
            setTimeout(() => {
                loadTutorDashboardView();
            }, 1500);
        },
        
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Course creation failed due to a server error.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text('Error: ' + error);
        }
    });
}

// --- 9. Course Details View ---

/**
 * Loads the detailed view for a single course.
 * @param {string} courseId - The MongoDB ID of the course.
 * @param {string} [enrollmentId=null] - The MongoDB ID of the student's enrollment, if enrolled.
 * @param {boolean} [isTutorView=false] - Whether the view is accessed from the Tutor Dashboard.
 */
function loadCourseDetailsView(courseId, enrollmentId = null, isTutorView = false) {
    clearContentArea();
    $('#content-area').html('<div id="course-details-loading" class="max-w-7xl mx-auto my-10 px-4 text-center text-lg text-indigo-600"><i class="fas fa-spinner fa-spin mr-2"></i>Loading course details...</div>');

    $.get(`${API_BASE_URL}/courses/${courseId}`)
        .done(function(course) {
            // 1. Render Video Player 
            let videoHtml = '';
            if (course.asset.type === 'local') {
                videoHtml = `<video id="course-video-player" controls class="w-full rounded-xl shadow-lg" src="${getAssetUrl(course.asset)}"></video>`;
            } else if (course.asset.type === 'youtube') {
                // CRITICAL FIX (Request 1): Use robust helper function
                const videoId = getYouTubeId(course.asset.url); 
                
                if (videoId) {
                    videoHtml = `<div class="aspect-w-16 aspect-h-9"><iframe id="course-video-player-youtube" class="w-full h-full rounded-xl shadow-lg" src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                } else {
                    // CRITICAL FIX (Request 1): Better UI for error
                    videoHtml = `<p class="text-red-500 font-semibold p-4 bg-red-100 rounded-lg">Error: Invalid YouTube URL provided. Please check the link or contact the tutor.</p>`;
                }
            }

            // 2. Render Main Course Structure (Standard UI - Request 1)
            const detailHtml = `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto my-10 px-4">
                    <div class="lg:col-span-2 space-y-8">
                        <div class="video-player-container bg-gray-900 p-2 rounded-xl shadow-2xl">
                            ${videoHtml}
                        </div>
                        
                        <div class="course-header bg-white p-6 rounded-xl shadow-lg">
                            <h1 class="text-4xl font-extrabold text-gray-800 mb-2">${course.title}</h1>
                            <p class="text-lg text-gray-600 mb-4">By: <span class="font-semibold text-indigo-600">${course.tutorId.name}</span></p>
                            
                            <div class="flex items-center space-x-4 mb-4">
                                <span class="text-lg font-bold text-yellow-500"> ${course.averageRating.toFixed(1)} </span>
                                <div>
                                    ${renderRating(course.averageRating)}
                                    <span class="text-sm text-gray-500">(${course.totalReviews} reviews)</span>
                                </div>
                                <span class="text-sm text-gray-500 ml-4">${course.enrolledStudents} students enrolled</span>
                            </div>

                            <p class="text-gray-700 whitespace-pre-wrap">${course.description}</p>
                        </div>
                        
                        <div class="reviews-section bg-white p-6 rounded-xl shadow-lg">
                            <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Student Reviews</h3>
                            <div id="new-comment-form">
                                </div>
                            <div id="comments-list" class="mt-6 space-y-4">
                                </div>
                        </div>
                    </div>
                    
                    <div class="lg:col-span-1 space-y-8">
                        
                        <div id="enrollment-action-area" class="bg-indigo-50 p-6 rounded-xl shadow-xl border-t-4 border-indigo-600">
                            </div>

                        <div class="chapters-list bg-white p-6 rounded-xl shadow-lg">
                            <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Course Chapters (${course.chapters.length})</h3>
                            <div id="chapter-list-nav" class="space-y-2">
                                ${course.chapters.map((chapter, index) => `
                                    <a href="#" class="chapter-link block p-3 rounded-lg hover:bg-indigo-50 transition" data-index="${index}">
                                        <span class="font-semibold text-indigo-700">Chapter ${index + 1}: ${chapter.title}</span>
                                        <p class="text-sm text-gray-600 mt-1">${chapter.description}</p>
                                    </a>
                                `).join('')}
                            </div>
                            ${course.chapters.length === 0 ? '<p class="text-gray-500 text-sm">No chapters defined.</p>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            $('#content-area').html(detailHtml);

            // 3. Load Dynamic Content (Enrollment, Comments)
            if (isTutorView) {
                // Tutor View: Show enrollment count and comments
                $('#enrollment-action-area').html(`
                    <h3 class="text-xl font-bold text-indigo-700 mb-2">Tutor View</h3>
                    <p class="text-gray-700">Total Students: <span class="font-bold text-2xl" id="enrollment-count">${course.enrolledStudents}</span></p>
                `);
            } else {
                // Student View: Load Enrollment/Action Area
                loadEnrollmentActionArea(courseId, enrollmentId, course.title);
            }
            
            // Load Comments/Reviews
            if (enrollmentId || isTutorView) { 
                loadComments(courseId, isTutorView);
            } else {
                // If not enrolled and not tutor, show a message instead of comments
                 $('#comments-list').html('<p class="text-gray-500">Comments are visible only to enrolled students.</p>');
                 $('#new-comment-form').html('');
            }

            // Fetch Enrollment Count
            // Note: This data is already in the course object from the populated route, but this is a fallback/check
            // $('#enrollment-count').text(course.enrollmentCount || 0);

            // Setup Chapter Navigation/Player Interaction
            setupPlayerHandlers(course.chapters);

        })
        .fail(function() {
            $('#course-details-loading').html('<p class="text-red-500 text-center">Failed to load course details. Course may not exist.</p>');
        });
}

function setupPlayerHandlers(chapters) {
    // Attach click handler to all chapter links using delegation
    $('#chapter-list-nav').off('click', '.chapter-link').on('click', '.chapter-link', function(e) {
        e.preventDefault();
        const chapterIndex = $(this).data('index');
        const chapter = chapters[chapterIndex];

        // This would typically involve seeking the video to the chapter's start time.
        // Since the current chapter model only has title/description,
        // we'll simulate the action and highlight the active chapter.
        $('.chapter-link').removeClass('bg-indigo-100 font-semibold').addClass('hover:bg-indigo-50');
        $(this).addClass('bg-indigo-100 font-semibold').removeClass('hover:bg-indigo-50');

        const videoPlayer = document.getElementById('course-video-player');
        if (videoPlayer) {
            // Placeholder: In a real app, 'chapter' would have a 'timestamp' property.
            // videoPlayer.currentTime = chapter.timestampInSeconds;
            // videoPlayer.play();
            alert(`Simulating start of chapter ${chapterIndex + 1}: ${chapter.title}\nIn a complete app, the video would seek to the correct timestamp.`);
        }
    });

    // Optional: Auto-update progress based on video playback (complex, typically done on a dedicated platform)
}

// --- 10. Student Enrollment & Progress --- 

function loadEnrollmentActionArea(courseId, enrollmentId, courseTitle) {
    const $actionArea = $('#enrollment-action-area');
    const studentId = getLoggedInUserId();
    const userType = getLoggedInUserType();
    
    // CRITICAL FIX (Request 2): Access Control for Enrollment
    if (userType !== 'Student') { 
        $actionArea.html(`
            <h3 class="text-xl font-bold text-red-700 mb-2"><i class="fas fa-lock mr-2"></i>Access Restricted</h3>
            <p class="text-gray-700 mb-4">You must be logged in as a student to enroll in this course.</p>
            <button id="enroll-or-login-btn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition shadow-lg">
                Sign In / Sign Up
            </button>
        `);
        // Attach click handler to redirect to student sign-in
        $('#enroll-or-login-btn').off('click').on('click', (e) => { 
            e.preventDefault(); 
            loadStudentSignInView(); 
        });
        return;
    }


    if (enrollmentId) {
        // --- LOGIC FOR ENROLLED STUDENTS ---
        $actionArea.html(`
            <h3 class="text-xl font-bold text-indigo-700 mb-2">You are Enrolled!</h3>
            <div class="flex justify-between items-center">
                <p class="text-gray-700 font-semibold">Current Progress: <span id="current-progress" class="text-2xl text-indigo-600">0</span>%</p>
                <button id="update-progress-btn" class="bg-indigo-500 hover:bg-indigo-600 text-white text-xs py-1 px-3 rounded-full transition"> Mark as Complete </button>
            </div>
            <input type="range" min="0" max="100" value="0" id="progress-slider" class="w-full mt-2" />
            <button id="unenroll-btn" class="mt-4 w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-full transition"> 
                <i class="fas fa-undo-alt mr-2"></i>Unenroll 
            </button>
        `);

        // Fetch current progress
        $.get(`${API_BASE_URL}/enrollments/${studentId}`)
            .done(function(enrollments) {
                const currentEnrollment = enrollments.find(e => e._id === enrollmentId);
                const progress = currentEnrollment ? currentEnrollment.progressPercentage : 0;
                $('#current-progress').text(progress);
                $('#progress-slider').val(progress);
            });

        // Slider Change Handler
        $('#progress-slider').off('input').on('input', function() {
            $('#current-progress').text($(this).val());
        });

        // Manual Update Button Handler
        $('#update-progress-btn').off('click').on('click', function() {
            const newProgress = parseInt($('#progress-slider').val());
            $.ajax({
                url: `${API_BASE_URL}/enrollments/${enrollmentId}`,
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ progressPercentage: newProgress }),
                success: function(updatedEnrollment) {
                    alert(`Progress updated to ${updatedEnrollment.progressPercentage}%!`);
                },
                error: function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to update progress.';
                    alert('Error: ' + error);
                }
            });
        });

        // Unenroll Button Handler
        $('#unenroll-btn').off('click').on('click', function() {
            if (!confirm(`Are you sure you want to unenroll from "${courseTitle}"?`)) {
                return;
            }
            $.ajax({
                url: `${API_BASE_URL}/enrollments/${enrollmentId}`,
                type: 'DELETE',
                success: function() {
                    alert('Successfully unenrolled.');
                    loadStudentCourseCatalog(); // Go back to the catalog
                },
                error: function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.message : 'Unenrollment failed.';
                    alert('Error: ' + error);
                }
            });
        });


    } else {
        // --- LOGIC FOR NON-ENROLLED STUDENTS ---
        $actionArea.html(`
            <h3 class="text-xl font-bold text-indigo-700 mb-2">Ready to start learning?</h3>
            <p class="text-gray-700 mb-4">Click below to enroll in this course instantly.</p>
            <button id="enroll-btn" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition shadow-lg">
                <i class="fas fa-plus-circle mr-2"></i> Enroll Now
            </button>
        `);

        $('#enroll-btn').off('click').on('click', function() {
            if (!confirm(`Do you want to enroll in the course: "${courseTitle}"?`)) {
                return;
            }

            $.ajax({
                url: `${API_BASE_URL}/enrollments`,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ studentId: studentId, courseId: courseId }),

                success: function(newEnrollment) {
                    alert(`Successfully enrolled in "${courseTitle}"!`);
                    // Reload details view with the new enrollment ID
                    loadCourseDetailsView(courseId, newEnrollment._id); 
                },

                error: function(xhr) {
                    // CRITICAL FIX (Request 3): Handle potential server enrollment error
                    const error = xhr.responseJSON ? xhr.responseJSON.message : 'Error: Server error during enrollment. Please check the server console for details.';
                    alert(error);
                }
            });
        });
    }
}

// --- 11. Comments/Reviews --- 

function loadCommentForm(courseId) {
    const studentId = getLoggedInUserId();
    const $formArea = $('#new-comment-form');

    // Check if user is enrolled before showing the form (This check is also done by the server)
    $.get(`${API_BASE_URL}/enrollments/${studentId}`)
        .done(function(enrollments) {
            const isEnrolled = enrollments.some(e => e.courseId._id === courseId);
            
            if (!isEnrolled) {
                $formArea.html('<p class="text-gray-500">You must be enrolled in this course to leave a review.</p>');
                return;
            }

            $formArea.html(`
                <h4 class="text-xl font-semibold text-gray-700 mb-3">Leave a Review</h4>
                <form id="comment-form">
                    <div class="mb-3 flex items-center space-x-2">
                        <label class="font-medium text-gray-700">Rating:</label>
                        <select id="rating-input" class="p-2 border rounded">
                            <option value="5">5 Stars - Excellent</option>
                            <option value="4">4 Stars - Very Good</option>
                            <option value="3">3 Stars - Good</option>
                            <option value="2">2 Stars - Fair</option>
                            <option value="1">1 Star - Poor</option>
                        </select>
                    </div>
                    <textarea id="comment-text-input" class="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" rows="3" placeholder="Write your review here..." required></textarea>
                    <div class="mt-3 flex justify-end">
                        <button type="submit" class="bg-indigo-600 text-white py-2 px-4 rounded-full font-semibold hover:bg-indigo-700 transition">
                            Submit Review
                        </button>
                    </div>
                    <div id="comment-message" class="mt-2 text-right text-sm"></div>
                </form>
            `);
            
            // Handle form submission
            $('#comment-form').off('submit').on('submit', function(e) {
                e.preventDefault();
                handleCommentSubmission(courseId, studentId);
            });
        })
        .fail(function() {
            $formArea.html('<p class="text-red-500">Could not verify enrollment status to load review form.</p>');
        });

}

function handleCommentSubmission(courseId, studentId) {
    const rating = parseInt($('#rating-input').val());
    const commentText = $('#comment-text-input').val();
    const $messageArea = $('#comment-message');

    $messageArea.html('<span class="text-blue-500">Submitting...</span>');

    $.ajax({
        url: `${API_BASE_URL}/comments`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            studentId: studentId, 
            courseId: courseId, 
            rating: rating, 
            comment: commentText 
        }),

        success: function(newComment) {
            $messageArea.html('<span class="text-green-600">Review submitted successfully!</span>');
            // Reload comments list and course details (to update rating)
            loadComments(courseId);
            loadCourseDetailsView(courseId);
        },

        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to submit comment.';
            $messageArea.html(`<span class="text-red-600">Error: ${error}</span>`);
        }
    });
}

/**
 * Loads and displays the comments for a course.
 * @param {string} courseId - The MongoDB ID of the course.
 * @param {boolean} [isTutorView=false] - If true, displays a delete button for the tutor.
 */
function loadComments(courseId, isTutorView = false) {
    const $commentsList = $('#comments-list');
    $commentsList.html('<p class="text-indigo-500 text-center"><i class="fas fa-spinner fa-spin"></i> Loading comments...</p>');
    
    // Also load the comment form if the user is a student and not in tutor view
    if (getLoggedInUserType() === 'Student' && !isTutorView) {
        loadCommentForm(courseId);
    } else if (isTutorView) {
        // Tutors can't post comments, so clear the form area
        $('#new-comment-form').html('<p class="text-gray-500">Tutors cannot leave a review on their own course.</p>');
    }

    $.get(`${API_BASE_URL}/comments/${courseId}`)
        .done(function(comments) {
            $commentsList.empty();

            if (comments.length === 0) {
                $commentsList.html('<p class="text-gray-500 text-center">Be the first to leave a review!</p>');
                return;
            }

            comments.forEach(comment => {
                const commentHtml = `
                    <div class="comment-item bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm" data-id="${comment._id}">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-3">
                                <span class="font-bold text-gray-800">${comment.studentId.name}</span>
                                <span class="text-sm text-gray-500">on ${new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div class="flex items-center space-x-1">
                                ${renderRating(comment.rating)}
                                ${isTutorView ? `<button class="delete-comment-btn text-red-500 hover:text-red-700 ml-3 text-sm"><i class="fas fa-trash"></i> Delete</button>` : ''}
                            </div>
                        </div>
                        <p class="text-gray-700 whitespace-pre-wrap">${comment.comment}</p>
                    </div>
                `;
                $commentsList.append(commentHtml);
            });

            // Attach Tutor delete handler
            if (isTutorView) {
                $commentsList.off('click', '.delete-comment-btn').on('click', '.delete-comment-btn', function() {
                    const commentId = $(this).closest('.comment-item').data('id');
                    handleCommentDeletion(commentId, courseId);
                });
            }
        })
        .fail(function() {
            $commentsList.html('<p class="text-red-500">Failed to load comments.</p>');
        });
}

function handleCommentDeletion(commentId, courseId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/comments/${commentId}`,
        type: 'DELETE',
        success: function() {
            alert('Comment deleted successfully.');
            loadComments(courseId, true); // Reload comments list
            // Reload course details to update rating display
            loadCourseDetailsView(courseId, null, true);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Deletion failed.';
            alert('Error: ' + error);
        }
    });
}

// --- 12. Document Ready (Initialization) ---

$(document).ready(function () {
    // 1. Initial State Check
    const userType = getLoggedInUserType();
    const isLoggedIn = !!userType;

    // 2. Load Navigation and Initial View
    updateNavVisibility(userType, isLoggedIn);
    if (isLoggedIn) {
        if (userType === 'Tutor') loadTutorDashboardView();
        else loadStudentCoursesView();
    } else {
        loadLandingPageView();
    }

    // 3. Attach Global Event Handlers for Navigation
    const $desktopNav = $('#desktop-menu-links');
    const $mobileNav = $('#mobile-menu-links');

    // Home / Logo
    $('#logo-link').off('click').on('click', (e) => { 
        e.preventDefault(); 
        clearContentArea();
        loadLandingPageView();
    });
    $desktopNav.add($mobileNav).off('click', '#mobile-nav-home').on('click', '#mobile-nav-home', (e) => { 
        e.preventDefault(); 
        clearContentArea();
        loadLandingPageView();
        hideMobileMenu();
    });

    // Catalog
    $desktopNav.add($mobileNav).off('click', '#nav-course-catalog, #mobile-nav-course-catalog').on('click', '#nav-course-catalog, #mobile-nav-course-catalog', (e) => { 
        e.preventDefault(); 
        loadStudentCourseCatalog(); 
        hideMobileMenu();
    });

    // Student Auth
    $desktopNav.add($mobileNav).off('click', '#nav-student-auth, #mobile-nav-student-auth').on('click', '#nav-student-auth, #mobile-nav-student-auth', (e) => { 
        e.preventDefault(); 
        loadStudentSignInView(); 
        hideMobileMenu();
    });

    // Tutor Auth
    $desktopNav.add($mobileNav).off('click', '#nav-tutor-auth, #mobile-nav-tutor-auth').on('click', '#nav-tutor-auth, #mobile-nav-tutor-auth', (e) => { 
        e.preventDefault(); 
        loadTutorSignInView(); 
        hideMobileMenu();
    });

    // My Courses (Student)
    $desktopNav.add($mobileNav).off('click', '#nav-my-courses, #mobile-nav-my-courses').on('click', '#nav-my-courses, #mobile-nav-my-courses', (e) => { 
        e.preventDefault(); 
        loadStudentCoursesView(); 
        hideMobileMenu();
    });

    // Tutor Dashboard
    $desktopNav.add($mobileNav).off('click', '#nav-tutor-dashboard, #mobile-nav-tutor-dashboard').on('click', '#nav-tutor-dashboard, #mobile-nav-tutor-dashboard', (e) => { 
        e.preventDefault(); 
        loadTutorDashboardView(); 
        hideMobileMenu();
    });

    // Tutor Create Course
    $desktopNav.add($mobileNav).off('click', '#nav-create-course, #mobile-nav-create-course').on('click', '#nav-create-course, #mobile-nav-create-course', (e) => { 
        e.preventDefault(); 
        loadCourseCreationView(); 
        hideMobileMenu();
    });

    // Sign Out
    $desktopNav.add($mobileNav).off('click', '#nav-sign-out, #mobile-nav-sign-out').on('click', '#nav-sign-out, #mobile-nav-sign-out', handleSignOut);
});

// --- 13. Landing Page Handlers (Attached only on initial load if logged out) ---
function attachLandingPageHandlers() {
     // Landing Page button handlers
    $('#student-sign-in-from-landing').off('click').on('click', (e) => {
        e.preventDefault();
        loadStudentSignInView();
    });
    $('#tutor-sign-in-from-landing').off('click').on('click', (e) => {
        e.preventDefault();
        loadTutorSignInView();
    });
    $('#browse-catalog-from-landing').off('click').on('click', (e) => {
        e.preventDefault();
        loadStudentCourseCatalog();
    });
}