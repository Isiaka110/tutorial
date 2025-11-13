// app.js (Frontend Code with ALL FIXES APPLIED)

// --- 1. API Configuration ---
const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_ROOT = 'http://localhost:5000'; // Used for fetching local assets

// --- 2. Helper Functions for User Session ---
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
    // FIX: Ensure this state matches the initial state
    $('#mobile-menu').removeClass('translate-y-0').addClass('-translate-y-full');
    $('#menu-icon').removeClass('hidden');
    $('#close-icon').addClass('hidden');
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
                    <a href="#" id="student-sign-in-from-landing" class="w-full inline-block bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700 transition shadow-lg"> Start Learning &rarr; </a>
                </div>

                <div class="p-8 bg-green-50 rounded-xl shadow-2xl max-w-sm border-t-4 border-green-600 hover:shadow-3xl transition duration-300">
                    <h3 class="text-2xl font-bold text-green-700 mb-4"><i class="fas fa-chalkboard-teacher"></i> I'm a Tutor</h3>
                    <p class="text-gray-700 mb-6">Publish your custom video tutorials using local files or YouTube embeds, and manage your content.</p>
                    <a href="#" id="tutor-sign-in-from-landing" class="w-full inline-block bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition shadow-lg"> Start Teaching &rarr; </a>
                </div>
            </div>
            
            <div class="mt-12 text-center">
                <p class="text-lg text-gray-500">Or, <a href="#" id="browse-catalog-landing" class="font-bold text-indigo-600 hover:text-indigo-800">browse the full course catalog</a> now.</p>
            </div>
        </section>
    `;
    $('#content-area').html(html);
    attachLandingPageHandlers();
}

/** Renders a single course card for the catalog view. */
function renderCourseCard(course, isEnrolled) {
    const assetIcon = course.asset.type === 'youtube' 
        ? '<i class="fab fa-youtube text-red-600"></i> YouTube' 
        : '<i class="fas fa-file-video text-gray-600"></i> Local File';
        
    const enrollmentBadge = isEnrolled 
        ? '<span class="text-xs font-semibold inline-block py-1 px-3 rounded-full text-white bg-green-500 uppercase last:mr-0 mr-1 mt-1">Enrolled</span>'
        : '';

    return `
        <div class="course-card bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 cursor-pointer p-5 border-t-4 border-indigo-500" data-course-id="${course._id}" data-enrollment-id="${course.enrollmentId || ''}">
            <h3 class="text-xl font-bold text-indigo-700 mb-2">${course.title}</h3>
            <p class="text-sm text-gray-600 mb-3">By: ${course.tutorId ? course.tutorId.name : 'Unknown'}</p>
            <div class="flex items-center mb-3">
                ${renderRating(course.averageRating)}
                <span class="text-sm text-gray-500 ml-2">(${course.totalReviews} reviews)</span>
            </div>
            <p class="text-gray-700 text-sm mb-3">${truncateText(course.description)}</p>
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span>${assetIcon}</span>
                ${enrollmentBadge}
            </div>
        </div>
    `;
}

/** Loads the Course Catalog with filtering for logged-in students. */
function loadStudentCourseCatalog() {
    clearContentArea();
    const studentId = getLoggedInUserId();
    const isStudent = getLoggedInUserType() === 'Student';
    
    // Filter controls are added only if a student is logged in
    const filterHtml = isStudent ? `
        <div class="mb-6 flex items-center space-x-4">
            <label for="course-filter" class="text-lg font-semibold text-gray-700">Filter Courses:</label>
            <select id="course-filter" class="p-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                <option value="all">All Courses</option>
                <option value="enrolled">My Enrolled Courses</option>
                <option value="not-enrolled" selected>Available Courses (Not Enrolled)</option>
            </select>
        </div>
    ` : '';

    $('#content-area').html(`
        <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-extrabold text-indigo-800 mb-8 border-b pb-2">Course Catalog</h2>
            ${filterHtml}
            <div id="course-catalog-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-gray-500">Loading courses...</p>
            </div>
        </div>
    `);
    
    // Function to fetch and render courses based on the current filter
    const fetchCourses = (filter = 'all') => {
        const $catalogList = $('#course-catalog-list');
        $catalogList.html('<p class="text-blue-500"><i class="fas fa-spinner fa-spin"></i> Loading courses...</p>');

        // Construct the URL with query parameters for the backend
        let url = `${API_BASE_URL}/courses`;
        // Non-logged in users (or All filter) simply hit /api/courses
        if (isStudent && filter !== 'all') {
            url += `?studentId=${studentId}&filter=${filter}`; 
        }

        $.get(url)
            .done(function(courses) {
                $catalogList.empty();
                if (courses.length === 0) {
                    let message = 'No courses found.';
                    $catalogList.html(`<p class="text-gray-500">${message}</p>`);
                    return;
                }
                
                courses.forEach(course => {
                    // Check if the course is explicitly marked as enrolled by the backend filter
                    const isEnrolled = isStudent && course.enrollmentStatus && course.enrollmentStatus.isEnrolled;
                    // Note: Enrollment ID is attached by the backend for enrolled courses via enrollmentStatus.enrollmentId
                    $catalogList.append(renderCourseCard(course, isEnrolled)); 
                });
                
                // Attach click handler for course cards
                $catalogList.off('click', '.course-card').on('click', '.course-card', function() {
                    const courseId = $(this).data('course-id');
                    // Enrollment ID can be null for non-enrolled courses, which is handled in data-enrollment-id
                    const enrollmentId = $(this).data('enrollment-id') || null; 
                    loadCourseDetailsView(courseId, enrollmentId, false);
                });
            })
            .fail(function() {
                $catalogList.html('<p class="text-red-500">Failed to load course catalog.</p>');
            });
    };

    // Attach filter change handler (if student is logged in)
    if (isStudent) {
        $('#course-filter').off('change').on('change', function() {
            fetchCourses($(this).val());
        });
        // Initial load for logged-in students: show 'not-enrolled' (available courses)
        fetchCourses('not-enrolled'); 
    } else {
        // Initial load for non-logged-in users: show 'all'
        fetchCourses('all'); 
    }
}


function loadStudentCoursesView() {
    clearContentArea();
    const studentId = getLoggedInUserId();
    if (!studentId) {
        loadStudentSignInView();
        return;
    }

    $('#content-area').html(`
        <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-extrabold text-gray-800 mb-6 border-b pb-2">My Enrolled Courses</h2>
            <div id="enrolled-list" class="space-y-6">
                Loading your courses...
            </div>
        </div>
    `);

    // FIX #2: Correct the API endpoint to match the backend route /api/enrollments/student/:studentId
    $.get(`${API_BASE_URL}/enrollments/student/${studentId}`)
        .done(function(enrollments) {
            const $enrolledList = $('#enrolled-list');
            $enrolledList.empty();
            
            if (enrollments.length === 0) {
                $enrolledList.html('<p class="text-gray-500">You are not enrolled in any courses yet. <a href="#" id="go-to-catalog" class="text-indigo-600 hover:text-indigo-800 font-semibold">Browse the Catalog</a> to start learning!</p>');
                // Attach Catalog link handler
                $('#go-to-catalog').off('click').on('click', (e) => { e.preventDefault(); loadStudentCourseCatalog(); });
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
                            <button class="view-course-btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition">
                                Continue Learning
                            </button>
                        </div>
                    </div>
                `;
                $enrolledList.append(card);
            });

            // Attach click handler for enrolled course cards
            $enrolledList.off('click', '.enrollment-card').on('click', '.enrollment-card', function() {
                const courseId = $(this).data('course-id');
                const enrollmentId = $(this).data('enrollment-id');
                loadCourseDetailsView(courseId, enrollmentId, false); // Student view
            });
        })
        .fail(function() {
            $('#enrolled-list').html('<p class="text-red-500">Failed to load your enrolled courses.</p>');
        });
}


// --- 8. Tutor Views ---

function loadTutorDashboardView() {
    clearContentArea();
    const tutor = getLoggedInUser();
    if (!tutor || tutor.role !== 'tutor') {
        loadTutorSignInView();
        return;
    }

    $('#content-area').html(`
        <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-extrabold text-green-700 mb-8 border-b pb-2">Tutor Dashboard: ${tutor.name}</h2>
            
            <div class="mb-8">
                <button id="add-course-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition shadow-lg">
                    <i class="fas fa-plus-circle mr-2"></i> Create New Course
                </button>
            </div>

            <h3 class="text-2xl font-bold text-gray-800 mb-4">Your Published Courses</h3>
            <div id="tutor-courses-list" class="space-y-6">
                Loading courses...
            </div>
        </div>
    `);

    // Attach "Create New Course" button handler
    $('#add-course-btn').off('click').on('click', loadCourseCreationView);

    // Fetch the tutor's published courses
    $.get(`${API_BASE_URL}/courses/tutor/${tutor._id}`)
        .done(function(courses) {
            const $courseList = $('#tutor-courses-list');
            $courseList.empty();

            if (courses.length === 0) {
                $courseList.html('<p class="text-gray-500">You have not published any courses yet.</p>');
                return;
            }

            courses.forEach(course => {
                const card = `
                    <div class="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center transition duration-300 hover:shadow-xl">
                        <div class="flex-grow">
                            <h3 class="text-xl font-bold text-green-700 mb-1">${course.title}</h3>
                            <p class="text-sm text-gray-500 mb-2">${truncateText(course.description, 80)}</p>
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-yellow-500">${renderRating(course.averageRating)}</span>
                                <span class="text-sm text-gray-600">(${course.totalReviews} reviews)</span>
                            </div>
                        </div>
                        <div class="mt-4 md:mt-0 md:ml-6 flex space-x-3">
                            <button class="view-course-btn bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full transition" data-id="${course._id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="delete-course-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition" data-id="${course._id}">
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
                    <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-32" id="description" required></textarea>
                </div>
                
                <h3 class="text-xl font-semibold text-gray-700 mb-3 border-b pb-1">Video Asset</h3>
                <div class="mb-4">
                    <label class="block text-gray-700 font-bold mb-2" for="asset-type">Asset Type</label>
                    <select class="shadow border rounded w-full py-2 px-3 text-gray-700" id="asset-type" required>
                        <option value="">Select Asset Type</option>
                        <option value="local">Local Video Upload</option>
                        <option value="youtube">YouTube URL</option>
                    </select>
                </div>
                
                <div id="local-upload-field" class="mb-4 hidden">
                    <label class="block text-gray-700 font-bold mb-2" for="asset-file">Video File (.mp4, etc.)</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="asset-file" type="file" accept="video/*">
                </div>
                
                <div id="youtube-url-field" class="mb-4 hidden">
                    <label class="block text-gray-700 font-bold mb-2" for="asset-url">YouTube Video URL</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="asset-url" type="url" placeholder="https://www.youtube.com/watch?v=...">
                </div>

                <h3 class="text-xl font-semibold text-gray-700 mb-3 mt-6 border-b pb-1">Chapters</h3>
                <div id="chapters-container">
                    <div class="chapter-item flex space-x-2 mt-3">
                        <input type="text" class="chapter-title shadow border rounded w-1/2 py-2 px-3 text-gray-700" placeholder="Chapter Title">
                        <input type="text" class="chapter-description shadow border rounded w-1/2 py-2 px-3 text-gray-700" placeholder="Description (Optional)">
                    </div>
                </div>
                <button type="button" id="add-chapter-btn" class="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded transition">
                    <i class="fas fa-plus-circle mr-1"></i> Add Chapter
                </button>
                
                <div class="flex items-center justify-center mt-8">
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition" type="submit">
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

/** Implements the missing handleCourseCreation logic using FormData for file uploads. */
function handleCourseCreation(e) { 
    e.preventDefault(); 
    const tutorId = getLoggedInUserId(); 
    const form = $(e.target); 
    const messageArea = form.find('#creation-message'); 
    messageArea.removeClass().html('<span class="text-blue-500"><i class="fas fa-spinner fa-spin"></i> Creating course...</span>'); 

    const title = form.find('#title').val();
    const description = form.find('#description').val();
    const assetType = form.find('#asset-type').val();
    const assetUrl = form.find('#asset-url').val();
    // Get the file object directly from the input element
    const assetFile = form.find('#asset-file')[0].files[0];
    
    // Collect chapters
    const chapters = [];
    form.find('.chapter-item').each(function() {
        chapters.push({
            title: $(this).find('.chapter-title').val(),
            description: $(this).find('.chapter-description').val() || ''
        });
    });

    // Use FormData for file upload/mixed data submission
    const formData = new FormData();
    formData.append('tutorId', tutorId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('assetType', assetType);
    // Chapters must be sent as a JSON string for Multer/Express to process
    formData.append('chapters', JSON.stringify(chapters)); 

    if (assetType === 'local') {
        if (!assetFile) {
             messageArea.removeClass().addClass('text-red-600 font-bold').text('Please select a video file for local upload.');
             return;
        }
        // Key 'assetFile' must match the field name used in the backend's Multer middleware
        formData.append('assetFile', assetFile); 
    } else if (assetType === 'youtube') {
        if (!assetUrl) {
             messageArea.removeClass().addClass('text-red-600 font-bold').text('Please provide a YouTube URL.');
             return;
        }
        formData.append('assetUrl', assetUrl);
    } else {
        if (assetType !== '') { // Only clean up if an asset was selected but invalid
             if (assetFile) fs.unlinkSync(assetFile.path); // Not possible on frontend but for safety
        }
         messageArea.removeClass().addClass('text-red-600 font-bold').text('Invalid asset type selected.');
         return;
    }

    // API Call using jQuery's AJAX for FormData/File Upload
    $.ajax({
        url: `${API_BASE_URL}/courses`,
        type: 'POST',
        data: formData,
        // Important: Tell jQuery not to process the data or set the content type
        processData: false, 
        contentType: false, 
        success: function(newCourse) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text(`Course "${newCourse.title}" created successfully!`);
            // Reload the Tutor Dashboard after success
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


// --- 9. Course Details View (Shared) ---

function loadCourseDetailsView(courseId, enrollmentId, isTutorView) {
    clearContentArea();
    const studentId = getLoggedInUserId();
    
    // Initial loading state
    $('#content-area').html(`<div id="course-details-loading" class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-center text-lg"><i class="fas fa-spinner fa-spin mr-2"></i> Loading course details...</div>`);

    // Fetch course details
    $.get(`${API_BASE_URL}/courses/${courseId}`)
        .done(function(course) {
            // Determine if the student is currently enrolled (even if coming from catalog view)
            // If the course object returned by the backend includes a specific enrollmentId 
            // from the catalog route, use it. Otherwise, rely on the passed enrollmentId.
            const finalEnrollmentId = enrollmentId || (course.enrollmentStatus ? course.enrollmentStatus.enrollmentId : null);
            
            // 1. Render Video Player
            let videoHtml = '';
            if (course.asset.type === 'local') {
                // If a local file, we use the local asset URL
                videoHtml = `<video id="course-video-player" controls class="w-full rounded-xl shadow-lg" src="${getAssetUrl(course.asset)}"></video>`;
            } else if (course.asset.type === 'youtube') {
                // Simple regex to extract video ID from various YouTube URLs
                const videoIdMatch = course.asset.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|\w+\/|watch\?v=))([^&]+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                if (videoId) {
                    // Embed YouTube iframe
                    videoHtml = `<div class="aspect-w-16 aspect-h-9"><iframe id="course-video-player-youtube" class="w-full h-full rounded-xl shadow-lg" src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
                } else {
                    videoHtml = `<p class="text-red-500">Invalid YouTube URL provided.</p>`;
                }
            }

            // 2. Render Main Course Structure
            const detailHtml = `
                <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        <div class="lg:col-span-2 space-y-8">
                            
                            <div class="video-player-container bg-white p-4 rounded-xl shadow-2xl">
                                ${videoHtml}
                            </div>

                            <div class="course-header bg-white p-6 rounded-xl shadow-lg">
                                <h1 class="text-4xl font-extrabold text-gray-800 mb-2">${course.title}</h1>
                                <p class="text-lg text-gray-600 mb-4">By: <span class="font-semibold text-indigo-600">${course.tutorId.name}</span></p>
                                
                                <div class="flex items-center space-x-4 mb-4">
                                    <span class="text-lg font-bold text-yellow-500">
                                        ${course.averageRating.toFixed(1)}
                                    </span>
                                    <div>
                                        ${renderRating(course.averageRating)}
                                    </div>
                                    <span class="text-gray-500">(${course.totalReviews || 0} reviews)</span>
                                </div>
                                
                                <p class="text-gray-700">${course.description}</p>
                                
                                <div id="enrollment-action-area" class="mt-6 border-t pt-4">
                                    ${finalEnrollmentId || isTutorView ? '' : `<button id="enroll-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full transition shadow-lg">Enroll Now</button>`}
                                </div>
                            </div>

                            <div class="comments-section bg-white p-6 rounded-xl shadow-lg">
                                <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Reviews & Comments</h3>
                                ${finalEnrollmentId && !isTutorView ? loadCommentForm(courseId) : 
                                    (isTutorView ? '' : `<p class="text-gray-500">Enroll to post a review and track your progress.</p>`)}
                                <div id="comments-list" class="mt-6 space-y-4">
                                    <p class="text-gray-500">Loading comments...</p>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-1 space-y-8">
                            
                            <div class="course-stats bg-white p-6 rounded-xl shadow-lg">
                                <h3 class="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Course Statistics</h3>
                                <p class="text-gray-700 mb-2"><i class="fas fa-users text-indigo-500 mr-2"></i> 
                                    <span class="font-semibold" id="enrollment-count">${course.enrollmentCount || 0}</span> students enrolled
                                </p>
                                <p class="text-gray-700 mb-2"><i class="fas fa-video text-indigo-500 mr-2"></i> ${course.chapters.length} chapters</p>
                                <p class="text-gray-700 mb-2"><i class="fas fa-star text-indigo-500 mr-2"></i> ${course.totalReviews || 0} reviews</p>
                                ${isTutorView ? `<p class="text-gray-700 text-sm mt-3 border-t pt-3">Tutor View: Progress tracking is disabled.</p>` : ''}
                            </div>
                            
                            <div class="chapter-list-nav bg-white p-6 rounded-xl shadow-lg">
                                <h3 class="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Course Content</h3>
                                <nav id="chapter-list-nav" class="space-y-1">
                                    ${course.chapters.map((chapter, index) => `
                                        <a href="#" class="chapter-link block p-3 rounded-lg text-gray-700 hover:bg-indigo-50 transition" data-index="${index}">
                                            <span class="font-bold">${index + 1}. ${chapter.title}</span>
                                            <p class="text-sm text-gray-500">${truncateText(chapter.description, 40)}</p>
                                        </a>
                                    `).join('')}
                                </nav>
                            </div>

                        </div>
                    </div>
                </div>
            `;
            
            $('#content-area').html(detailHtml);

            // Load conditional areas
            if (finalEnrollmentId) {
                // Load progress area if student is enrolled
                loadEnrollmentActionArea(courseId, finalEnrollmentId, course.title);
            }
            if (finalEnrollmentId || isTutorView) {
                // Load comments/reviews if student is enrolled or user is the tutor
                loadComments(courseId, isTutorView);
            }

            // Attach Enrollment Button handler
            if (!finalEnrollmentId && !isTutorView && studentId) {
                // Enrollment button is visible only if NOT enrolled, NOT tutor, and student is logged in
                $('#enroll-btn').off('click').on('click', (e) => handleEnrollment(e, studentId, courseId, course.title));
            } else if (!studentId) {
                // Change enroll button to Sign In prompt for non-logged-in users
                 $('#enrollment-action-area').html(`<p class="text-gray-500">
                    <a href="#" id="signin-prompt" class="font-bold text-indigo-600 hover:text-indigo-800">Sign in as a student</a> to enroll and begin learning.
                </p>`);
                $('#signin-prompt').off('click').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); });
            }
            
            // Setup Chapter Navigation/Player Interaction
            // FIX: Pass courseId and enrollmentId for video progress tracking
            setupPlayerHandlers(course.chapters, courseId, finalEnrollmentId); 
        })
        .fail(function() {
            $('#course-details-loading').html('<p class="text-red-500 text-center">Failed to load course details. Course may not exist.</p>');
        });
}

/** New function to handle video synchronization and throttled API updates. */
function updateVideoProgress(courseId, enrollmentId) {
    const videoPlayer = document.getElementById('course-video-player');
    const $progressSlider = $('#progress-slider');
    const $currentProgressText = $('#current-progress');

    if (!videoPlayer || !enrollmentId || isNaN(videoPlayer.duration)) return;

    // Attach event listener for time updates
    $(videoPlayer).off('timeupdate.progress').on('timeupdate.progress', function() {
        const duration = videoPlayer.duration;
        const currentTime = videoPlayer.currentTime;

        if (isNaN(duration) || duration <= 0) return;

        // Calculate progress percentage
        const currentProgress = Math.min(100, Math.floor((currentTime / duration) * 100));
        
        // Update local UI only if the user isn't currently dragging the slider
        if ($progressSlider.data('is-dragging') !== true) {
             $progressSlider.val(currentProgress);
             $currentProgressText.text(currentProgress);
        }

        // Throttling: Send update to server only if progress has significantly increased (e.g., every 5%)
        // The last sent progress is stored as data on the slider element
        const lastSentProgress = parseInt($progressSlider.data('last-sent-progress')) || 0;
        
        if (currentProgress > lastSentProgress + 5 && currentProgress <= 100) {
            $progressSlider.data('last-sent-progress', currentProgress); 

            $.ajax({
                url: `${API_BASE_URL}/enrollments/${enrollmentId}`,
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({ progressPercentage: currentProgress }),
                error: function() {
                    console.error('Failed to auto-update progress.');
                }
            });
        }
    });
    
    // Manual dragging handlers for the slider
    $progressSlider.off('mousedown touchstart').on('mousedown touchstart', function() {
        $(this).data('is-dragging', true);
    });
    
    // When dragging stops, trigger the manual update button logic
    $progressSlider.off('mouseup touchend').on('mouseup touchend', function() {
        $(this).data('is-dragging', false);
        // We trigger the manual button logic which handles the API call and UI state
        $('#update-progress-btn').trigger('click'); 
    });
    
    // Slider Change Handler (for visual feedback while dragging)
    $progressSlider.off('input.visual').on('input.visual', function() { 
        $currentProgressText.text($(this).val());
    });

    // Handle manual update button click (e.g., "Mark as Complete")
    $('#update-progress-btn').off('click.manual').on('click.manual', function() {
        const newProgress = parseInt($progressSlider.val());
        const isComplete = newProgress === 100;
        
        $(this).prop('disabled', true).text('Updating...');

        $.ajax({
            url: `${API_BASE_URL}/enrollments/${enrollmentId}`,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ progressPercentage: newProgress }),
            success: function(updatedEnrollment) {
                $('#update-progress-btn').prop('disabled', false).html(isComplete ? '<i class="fas fa-check-circle mr-1"></i> Course Complete!' : 'Update Progress');
                // Update the last sent progress marker after manual sync
                $progressSlider.data('last-sent-progress', updatedEnrollment.progressPercentage);
            },
            error: function() {
                $('#update-progress-btn').prop('disabled', false).text('Update Progress');
                alert('Failed to update progress.');
            }
        });
    });
}


/** Updates signature to support video progress tracking. */
function setupPlayerHandlers(chapters, courseId, enrollmentId) {
    // Attach click handler to all chapter links using delegation (keep existing logic)
    $('#chapter-list-nav').off('click', '.chapter-link').on('click', '.chapter-link', function(e) {
        e.preventDefault();
        const chapterIndex = $(this).data('index');
        const chapter = chapters[chapterIndex];
        
        $('.chapter-link').removeClass('bg-indigo-100 font-semibold').addClass('hover:bg-indigo-50');
        $(this).addClass('bg-indigo-100 font-semibold').removeClass('hover:bg-indigo-50');
        
        const videoPlayer = document.getElementById('course-video-player');
        if (videoPlayer) {
            alert(`Simulating start of chapter ${chapterIndex + 1}: ${chapter.title}\nIn a complete app, the video would seek to the correct timestamp.`);
        }
    }); 
    
    // CRITICAL FIX: Initialize progress tracking if student is enrolled
    if (enrollmentId) {
        const videoPlayer = document.getElementById('course-video-player');
        if (videoPlayer) {
            // Start tracking only when the video has loaded metadata (duration is available)
            $(videoPlayer).off('loadedmetadata.progress').on('loadedmetadata.progress', function() {
                updateVideoProgress(courseId, enrollmentId);
            });
            // If metadata is already loaded (e.g., cached playback)
            if (videoPlayer.readyState >= 2) { 
                updateVideoProgress(courseId, enrollmentId);
            }
        }
    }
}


// --- 10. Student Enrollment & Progress ---

function handleEnrollment(e, studentId, courseId, courseTitle) {
    e.preventDefault();
    const $btn = $('#enroll-btn');
    $btn.prop('disabled', true).text('Enrolling...');

    $.ajax({
        url: `${API_BASE_URL}/enrollments`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ studentId, courseId }),
        success: function(newEnrollment) {
            alert(`Successfully enrolled in "${courseTitle}"!`);
            // Reload the view with the new enrollment ID to update UI (hides Enroll button, shows progress)
            loadCourseDetailsView(courseId, newEnrollment._id, false); 
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Enrollment failed.';
            alert('Error: ' + error);
            $btn.prop('disabled', false).text('Enroll Now');
            // If the error is 'already enrolled', we should probably force a reload to the progress view
            if (error.includes('already enrolled')) {
                // Safest to send the user back to their courses list to avoid endless re-attempts
                loadStudentCoursesView();
            }
        }
    });
}

function handleUnenrollment(e, enrollmentId, courseId) {
    e.preventDefault();
    if (!confirm('Are you sure you want to unenroll from this course? Your progress will be reset.')) {
        return;
    }
    const $btn = $('#unenroll-btn');
    $btn.prop('disabled', true).text('Unenrolling...');

    $.ajax({
        url: `${API_BASE_URL}/enrollments/${enrollmentId}`,
        type: 'DELETE',
        success: function() {
            alert('Unenrolled successfully.');
            // Reload the view without an enrollment ID to show the "Enroll Now" button
            loadCourseDetailsView(courseId, null, false);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Unenrollment failed.';
            alert('Error: ' + error);
            $btn.prop('disabled', false).text('Unenroll');
        }
    });
}

/** Modified loadEnrollmentActionArea to use handlers from updateVideoProgress. */
function loadEnrollmentActionArea(courseId, enrollmentId, courseTitle) {
    const $actionArea = $('#enrollment-action-area');
    
    $actionArea.html(`
        <h4 class="text-lg font-bold text-gray-700 mb-2">My Progress</h4>
        <div class="flex items-center justify-between mb-3">
            <div class="text-lg font-semibold text-indigo-600">
                Current Progress: <span id="current-progress" class="font-extrabold">0</span>%
            </div>
            <button id="update-progress-btn" class="bg-indigo-500 hover:bg-indigo-600 text-white text-xs py-1 px-3 rounded-full transition"> 
                Update Progress
            </button>
        </div>
        <input type="range" min="0" max="100" value="0" id="progress-slider" class="w-full mt-2" />
        <button id="unenroll-btn" class="mt-4 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-full transition text-sm">
            <i class="fas fa-times-circle mr-1"></i> Unenroll
        </button>
    `);

    // Fetch current progress (keep this)
    $.get(`${API_BASE_URL}/enrollments/student/${getLoggedInUserId()}`) // Fetch all enrollments
        .done(function(enrollments) {
            const currentEnrollment = enrollments.find(e => e._id === enrollmentId);
            const progress = currentEnrollment ? currentEnrollment.progressPercentage : 0;
            $('#current-progress').text(progress);
            $('#progress-slider').val(progress);
            // Initialize the last sent progress data attribute for throttling
            $('#progress-slider').data('last-sent-progress', progress); 
            
            // Update button text if already complete
            if (progress === 100) {
                 $('#update-progress-btn').html('<i class="fas fa-check-circle mr-1"></i> Course Complete!');
            }
        });

    // Attach Unenroll button handler
    $('#unenroll-btn').off('click').on('click', (e) => handleUnenrollment(e, enrollmentId, courseId));

    // NOTE: Progress slider and update button handlers are attached inside setupPlayerHandlers 
    // via updateVideoProgress to ensure they are active ONLY when a video is loaded.
}


// --- 11. Comments/Reviews ---

function loadCommentForm(courseId) {
    // Only return the form HTML; the submission handler is separate
     return `
        <div id="new-comment-form">
            <h4 class="text-xl font-semibold text-gray-700 mb-3">Leave a Review</h4>
            <form id="comment-post-form">
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
                <textarea id="comment-text" class="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" rows="3" placeholder="Write your comment here..." required></textarea>
                <div class="flex justify-end mt-3">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition">
                        Post Comment
                    </button>
                </div>
                <div id="comment-message" class="mt-3 text-center"></div>
            </form>
        </div>
    `;
}

/** Corrected handlePostComment to use explicit JSON content type. */
function handlePostComment(e, courseId) {
    e.preventDefault();
    const studentId = getLoggedInUserId();
    const form = $(e.target);
    // Ensure rating is parsed as an integer
    const rating = parseInt(form.find('#rating-input').val());
    const text = form.find('#comment-text').val();
    const messageArea = form.find('#comment-message');

    if (!studentId) {
        messageArea.text('Please sign in to post a comment.').addClass('text-red-500');
        return;
    }
    if (!text || isNaN(rating)) {
        messageArea.text('Please provide a rating and comment text.').addClass('text-red-500');
        return;
    }

    messageArea.removeClass().html('<span class="text-blue-500">Posting comment...</span>');

    const commentData = {
        studentId, 
        courseId,
        rating,
        text
    };

    $.ajax({
        url: `${API_BASE_URL}/comments`,
        method: 'POST', 
        contentType: 'application/json', // CRITICAL: Explicitly set Content-Type to JSON
        data: JSON.stringify(commentData), // CRITICAL: Stringify the payload
        success: function(newComment) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text('Comment posted and rating updated!');
            form[0].reset(); 
            // Reload comments list
            loadComments(courseId, false);
            // Reload course details to refresh the average rating and review count
            const enrollmentId = $('#enrollment-action-area').find('#unenroll-btn').length ? $('#enrollment-action-area').parent().parent().parent().find('.enrollment-card').data('enrollment-id') : null;
            loadCourseDetailsView(courseId, enrollmentId, false);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Server error while posting/updating comment. Please check data types and required fields.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text('Error: ' + error);
        }
    });
}

function loadComments(courseId, isTutorView) {
    const $commentsList = $('#comments-list');
    $commentsList.html('<p class="text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading comments...</p>');

    // Attach form submission handler (Must be done after the form HTML is rendered)
    $('#comment-post-form').off('submit').on('submit', (e) => handlePostComment(e, courseId));

    $.get(`${API_BASE_URL}/comments/${courseId}`)
        .done(function(comments) {
            $commentsList.empty();
            if (comments.length === 0) {
                $commentsList.html('<p class="text-gray-500">No reviews yet. Be the first!</p>');
                return;
            }

            comments.forEach(comment => {
                const deleteButton = isTutorView ? `
                    <button class="delete-comment-btn text-red-500 hover:text-red-700 ml-4 transition">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : '';
                
                const commentHtml = `
                    <div class="comment-item border-b pb-4 last:border-b-0" data-id="${comment._id}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <span class="font-bold text-gray-800">${comment.studentId.name}</span>
                                <span class="text-sm text-gray-500 ml-3">${new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            ${deleteButton}
                        </div>
                        <div class="my-2">
                            ${renderRating(comment.rating)}
                        </div>
                        <p class="text-gray-700">${comment.text}</p>
                    </div>
                `;
                $commentsList.append(commentHtml);
            });

            // Attach Tutor delete handler if necessary
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


// --- 12. Document Ready (Initialization & Mobile Fix) ---
$(document).ready(function () {
    // 1. Initial State Check
    const userType = getLoggedInUserType();
    const isLoggedIn = !!userType;

    // 2. Load Initial View
    if (isLoggedIn) {
        if (userType === 'Tutor') {
            loadTutorDashboardView();
        } else {
            loadStudentCoursesView();
        }
    } else {
        loadLandingPageView();
    }

    // 3. Update Nav UI
    updateNavVisibility(userType, isLoggedIn);
    
    // 4. FIX #3: Mobile Menu Toggle Handlers for Responsiveness
    // Show Menu (using Hamburger Icon)
    $('#menu-icon').off('click').on('click', function() {
        $('#mobile-menu').removeClass('-translate-y-full').addClass('translate-y-0');
        $('#menu-icon').addClass('hidden');
        $('#close-icon').removeClass('hidden');
    });

    // Hide Menu (using Close Icon)
    $('#close-icon').off('click').on('click', function() {
        hideMobileMenu();
    });

    // 5. Global Navigation Handlers
    const $desktopNav = $('#desktop-menu-links');
    const $mobileNav = $('#mobile-menu-links');

    // Home/Landing
    $desktopNav.add($mobileNav).off('click', '#nav-home, #mobile-nav-home').on('click', '#nav-home, #mobile-nav-home', (e) => {
        e.preventDefault();
        loadLandingPageView();
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

    // Course Catalog
    $desktopNav.add($mobileNav).off('click', '#nav-course-catalog, #mobile-nav-course-catalog').on('click', '#nav-course-catalog, #mobile-nav-course-catalog', (e) => {
        e.preventDefault();
        loadStudentCourseCatalog();
        hideMobileMenu();
    });

    // Student My Courses
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
    $('#student-sign-in-from-landing, #browse-catalog-landing').off('click').on('click', (e) => {
        e.preventDefault();
        const targetId = $(e.target).attr('id');
        if (targetId === 'student-sign-in-from-landing') {
            loadStudentSignInView();
        } else {
            loadStudentCourseCatalog();
        }
    });
    
    $('#tutor-sign-in-from-landing').off('click').on('click', (e) => {
        e.preventDefault();
        loadTutorSignInView();
    });
}