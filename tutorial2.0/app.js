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

// function handleSignUp(e, role) {
//     e.preventDefault();
//     const form = $(e.target);
//     const name = form.find('#name').val();
//     const email = form.find('#email').val();
//     const password = form.find('#password').val();
//     const messageArea = form.find(`#${role}-signup-form #signup-message`);

//     messageArea.removeClass().html('<span class="text-blue-500">Processing...</span>');

//     $.post(`${API_BASE_URL}/users/signup`, { name, email, password, role })
//         .done(function(data) {
//             messageArea.removeClass().addClass('text-green-600 font-bold').text('Account created! Please sign in.');
//             // Automatically switch to sign-in view after a delay
//             setTimeout(() => {
//                 if (role === 'student') loadStudentSignInView();
//                 else loadTutorSignInView();
//             }, 1500);
//         })
//         .fail(function(xhr) {
//             const error = xhr.responseJSON ? xhr.responseJSON.message : 'Signup failed. Please try again.';
//             messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
//         });
// }

// function handleSignIn(e, role) {
//     e.preventDefault();
//     const form = $(e.target);
//     const email = form.find('#email').val();
//     const password = form.find('#password').val();
//     const messageArea = form.find(`#${role}-signin-form #signin-message`);

//     messageArea.removeClass().html('<span class="text-blue-500">Processing...</span>');

//     $.post(`${API_BASE_URL}/users/signin`, { email, password, role })
//         .done(function(data) {
//             // Save user data to localStorage
//             localStorage.setItem(`loggedIn${data.role}`, JSON.stringify(data));
//             messageArea.removeClass().addClass('text-green-600 font-bold').text(`Welcome, ${data.name.split(' ')[0]}!`);
            
//             // Update UI and load dashboard
//             updateNavVisibility(data.role, true);
//             setTimeout(() => {
//                 clearContentArea();
//                 if (data.role === 'tutor') loadTutorDashboardView();
//                 else loadStudentCoursesView();
//             }, 1000);
//         })
//         .fail(function(xhr) {
//             const error = xhr.responseJSON ? xhr.responseJSON.message : 'Sign-in failed. Check your email and password.';
//             messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
//         });
// }
// app.js (Updated functions)

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
                        Publish Content &rarr;
                    </a>
                </div>
                
            </div>
        </section>
    `;
    $('#content-area').html(html);
    attachLandingPageHandlers();
}

function loadStudentCourseCatalog() {
    clearContentArea();
    $('#content-area').html('<h2 class="text-4xl font-bold text-gray-800 mb-6 border-b pb-2">Course Catalog</h2><div id="catalog-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">Loading courses...</div>');

    $.get(`${API_BASE_URL}/courses`)
        .done(function(courses) {
            const $catalog = $('#catalog-list');
            $catalog.empty();
            if (courses.length === 0) {
                $catalog.html('<p class="text-gray-500 col-span-full">No courses available in the catalog yet.</p>');
                return;
            }

            courses.forEach(course => {
                const card = `
                    <div class="course-card bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer" data-id="${course._id}">
                        <div class="p-5">
                            <h3 class="text-xl font-bold text-indigo-700 mb-2">${course.title}</h3>
                            <p class="text-sm text-gray-500 mb-3">Tutor: ${course.tutorId.name}</p>
                            <p class="text-gray-600 text-sm mb-4">${truncateText(course.description, 100)}</p>
                            <div class="flex items-center mb-4">
                                ${renderRating(course.averageRating)}
                                <span class="text-sm text-gray-600 ml-2">(${course.totalReviews} reviews)</span>
                            </div>
                            <div class="text-right">
                                <a href="#" class="inline-block bg-indigo-500 text-white text-sm px-4 py-2 rounded-full hover:bg-indigo-600 transition">View Course</a>
                            </div>
                        </div>
                    </div>
                `;
                $catalog.append(card);
            });
            // Attach view course detail handler
            $('#catalog-list').off('click', '.course-card').on('click', '.course-card', function() {
                loadCourseDetailsView($(this).data('id'));
            });
        })
        .fail(function() {
            $('#catalog-list').html('<p class="text-red-500 col-span-full">Failed to load courses. Please check the backend server.</p>');
        });
}

function loadStudentCoursesView() {
    clearContentArea();
    const studentId = getLoggedInUserId();
    if (!studentId) {
        // Fallback for security
        clearContentArea();
        loadStudentSignInView();
        return;
    }

    $('#content-area').html('<h2 class="text-4xl font-bold text-gray-800 mb-6 border-b pb-2">My Enrolled Courses</h2><div id="enrolled-list" class="space-y-6">Loading your courses...</div>');

    $.get(`${API_BASE_URL}/enrollments/${studentId}`)
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
                    <div class="enrollment-card bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center transition duration-300 hover:shadow-xl cursor-pointer" 
                         data-course-id="${course._id}" data-enrollment-id="${enrollment._id}">
                        
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
                            <a href="#" class="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-full hover:bg-indigo-700 transition">Continue Learning</a>
                        </div>
                    </div>
                `;
                $enrolledList.append(card);
            });
            // Attach view course detail handler
            $('#enrolled-list').off('click', '.enrollment-card').on('click', '.enrollment-card', function() {
                loadCourseDetailsView($(this).data('course-id'), $(this).data('enrollment-id'));
            });

        })
        .fail(function() {
            $('#enrolled-list').html('<p class="text-red-500">Failed to load enrolled courses.</p>');
        });
}


// --- 8. Tutor Views ---

function loadTutorDashboardView() {
    clearContentArea();
    const tutorId = getLoggedInUserId();
    if (!tutorId) {
        clearContentArea();
        loadTutorSignInView();
        return;
    }

    const html = `
        <h2 class="text-4xl font-bold text-gray-800 mb-6 border-b pb-2">Tutor Dashboard</h2>
        <button id="dashboard-create-course" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition mb-6">
            <i class="fas fa-plus-circle mr-2"></i>Create New Course
        </button>
        <div id="tutor-courses-list" class="space-y-6">Loading your published courses...</div>
    `;
    $('#content-area').html(html);

    // Attach create course button handler
    $('#dashboard-create-course').off('click').on('click', loadCourseCreationView);

    $.get(`${API_BASE_URL}/courses/tutor/${tutorId}`)
        .done(function(courses) {
            const $courseList = $('#tutor-courses-list');
            $courseList.empty();
            if (courses.length === 0) {
                $courseList.html('<p class="text-gray-500">You have not published any courses yet.</p>');
                return;
            }

            courses.forEach(course => {
                const card = `
                    <div class="course-dashboard-card bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center">
                        <div class="flex-grow">
                            <h3 class="text-xl font-bold text-indigo-700 mb-1">${course.title}</h3>
                            <p class="text-sm text-gray-500 mb-2">ID: ${course._id}</p>
                            <div class="flex items-center">
                                <span class="text-sm font-semibold text-gray-700 mr-4">
                                    <i class="fas fa-users text-indigo-500 mr-1"></i> Enrollments: ${course.enrollmentCount || 0}
                                </span>
                                <span class="text-sm font-semibold text-gray-700">
                                    ${renderRating(course.averageRating)}
                                    (${course.totalReviews} reviews)
                                </span>
                            </div>
                        </div>
                        <div class="mt-4 md:mt-0 md:ml-6 space-x-2">
                            <button class="view-course-btn bg-indigo-500 text-white text-sm px-4 py-2 rounded transition hover:bg-indigo-600" data-id="${course._id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="delete-course-btn bg-red-500 text-white text-sm px-4 py-2 rounded transition hover:bg-red-600" data-id="${course._id}">
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

                <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 class="text-xl font-semibold text-gray-700 mb-3">Video Asset</h3>
                    <div class="mb-3">
                        <label class="block text-gray-700 font-bold mb-2">Asset Type</label>
                        <select id="asset-type" class="shadow border rounded w-full py-2 px-3 text-gray-700" required>
                            <option value="">Select Video Source</option>
                            <option value="local">Local Upload (MP4, etc.)</option>
                            <option value="youtube">YouTube Embed Link</option>
                        </select>
                    </div>

                    <div id="local-upload-field" class="hidden mb-3">
                        <label class="block text-gray-700 font-bold mb-2" for="asset-file">Upload Video File (Max 100MB)</label>
                        <input class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none" id="asset-file" type="file" accept="video/*">
                    </div>

                    <div id="youtube-url-field" class="hidden mb-3">
                        <label class="block text-gray-700 font-bold mb-2" for="asset-url">YouTube URL</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="asset-url" type="url" placeholder="https://www.youtube.com/watch?v=VIDEO_ID">
                    </div>
                </div>

                <div class="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 class="text-xl font-semibold text-gray-700 mb-3">Course Chapters (Optional)</h3>
                    <div id="chapters-container" class="space-y-3">
                        <div class="chapter-item flex space-x-2">
                            <input type="text" class="chapter-title shadow border rounded w-1/2 py-2 px-3 text-gray-700" placeholder="Chapter Title">
                            <input type="text" class="chapter-description shadow border rounded w-1/2 py-2 px-3 text-gray-700" placeholder="Description (e.g., Key concepts)">
                        </div>
                    </div>
                    <button type="button" id="add-chapter-btn" class="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold py-1 px-3 rounded transition">
                        Add Chapter
                    </button>
                </div>

                <div class="flex items-center justify-between">
                    <button class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition" type="submit">
                        <i class="fas fa-upload mr-2"></i>Publish Course
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

function handleCourseCreation(e) {
    e.preventDefault();
    const tutorId = getLoggedInUserId();
    const form = $(e.target);
    const messageArea = form.find('#creation-message');

    messageArea.removeClass().html('<span class="text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Publishing course...</span>');

    const assetType = form.find('#asset-type').val();
    const assetFile = form.find('#asset-file')[0].files[0];
    const assetUrl = form.find('#asset-url').val();

    // 1. Gather Chapter Data
    const chapters = [];
    form.find('.chapter-item').each(function() {
        const title = $(this).find('.chapter-title').val().trim();
        const description = $(this).find('.chapter-description').val().trim();
        if (title) { // Only add non-empty chapters
            chapters.push({ title, description });
        }
    });

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append('tutorId', tutorId);
    formData.append('title', form.find('#title').val());
    formData.append('description', form.find('#description').val());
    formData.append('assetType', assetType);
    formData.append('chapters', JSON.stringify(chapters)); // Send chapters as JSON string

    if (assetType === 'local' && assetFile) {
        formData.append('assetFile', assetFile);
    } else if (assetType === 'youtube' && assetUrl) {
        formData.append('assetUrl', assetUrl);
    }

    // 3. Send AJAX request
    $.ajax({
        url: `${API_BASE_URL}/courses`,
        type: 'POST',
        data: formData,
        contentType: false, // Important for FormData with file uploads
        processData: false, // Important for FormData with file uploads
        success: function(course) {
            messageArea.removeClass().addClass('text-green-600 font-bold').html('<i class="fas fa-check-circle mr-2"></i>Course published successfully!');
            // Redirect to dashboard or course view
            setTimeout(() => {
                loadTutorDashboardView();
            }, 1500);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Course creation failed. Server error.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text('Error: ' + error);
        }
    });
}


// --- 9. Course Details View (Shared) ---

function loadCourseDetailsView(courseId, enrollmentId = null, isTutorView = false) {
    clearContentArea();
    $('#content-area').html('<div id="course-details-loading" class="text-center py-10"><i class="fas fa-circle-notch fa-spin text-indigo-600 text-3xl"></i><p class="mt-2 text-gray-600">Loading course details...</p></div>');

    const isStudent = getLoggedInUserType() === 'Student';

    $.get(`${API_BASE_URL}/courses/${courseId}`)
        .done(function(course) {
            const $contentArea = $('#content-area');
            $contentArea.empty();

            // 1. Render Video Player
            let videoHtml = '';
            if (course.asset.type === 'local') {
                videoHtml = `<video id="course-video-player" controls class="w-full rounded-xl shadow-lg" src="${getAssetUrl(course.asset)}"></video>`;
            } else if (course.asset.type === 'youtube') {
                // Simple regex to extract video ID from various YouTube URLs
                const videoIdMatch = course.asset.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|\w+\/|watch\?v=))([^&]+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;
                if (videoId) {
                    videoHtml = `<div class="aspect-w-16 aspect-h-9"><iframe id="course-video-player-youtube" class="w-full h-full rounded-xl shadow-lg" src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
                } else {
                    videoHtml = `<p class="text-red-500">Invalid YouTube URL provided.</p>`;
                }
            }

            // 2. Render Main Course Structure
            const detailHtml = `
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
                                    <span class="text-sm text-gray-500 ml-1">(${course.totalReviews} reviews)</span>
                                </div>
                                <span class="text-sm text-gray-500 ml-4"><i class="fas fa-users mr-1"></i><span id="enrollment-count">${course.enrollmentCount || 0}</span> Enrolled</span>
                            </div>

                            <p class="text-gray-700">${course.description}</p>
                            
                            ${!isTutorView && isStudent ? `<div class="mt-6" id="enrollment-action-area"></div>` : ''}

                        </div>

                        <div class="comments-section bg-white p-6 rounded-xl shadow-lg">
                            <h3 class="text-2xl font-bold text-gray-800 mb-4">Student Reviews</h3>
                            ${!isTutorView && isStudent && enrollmentId ? `<form id="new-comment-form" class="mb-6"></form>` : ''}
                            <div id="comments-list">Loading comments...</div>
                        </div>

                    </div>

                    <div class="lg:col-span-1">
                        <div class="bg-white p-6 rounded-xl shadow-2xl sticky top-20">
                            <h3 class="text-2xl font-bold text-indigo-700 mb-4">Course Content</h3>
                            ${!isTutorView && enrollmentId ? `<div id="progress-area" class="mb-4 p-3 bg-indigo-50 rounded-lg"></div>` : ''}
                            <div id="chapter-list-nav" class="space-y-2">
                                ${course.chapters.length > 0 ? '' : '<p class="text-gray-500">No chapters defined for this course.</p>'}
                            </div>
                            ${isTutorView ? '<div class="mt-6 text-center"><button id="tutor-delete-btn" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition w-full"><i class="fas fa-trash-alt mr-2"></i>Delete Course</button></div>' : ''}
                        </div>
                    </div>

                </div>
            `;
            $contentArea.html(detailHtml);

            // 3. Render Chapters and Attach Handlers
            const $chapterList = $('#chapter-list-nav');
            $chapterList.empty();
            course.chapters.forEach((chapter, index) => {
                const chapterLink = `
                    <a href="#" class="chapter-link block p-3 rounded-lg hover:bg-indigo-50 transition" 
                       data-index="${index}" 
                       data-course-id="${course._id}">
                        <span class="font-semibold text-gray-800">${index + 1}. ${chapter.title}</span>
                        <p class="text-sm text-gray-500">${chapter.description}</p>
                    </a>
                `;
                $chapterList.append(chapterLink);
            });
            
            // 4. Load Dynamic Sections
            if (isStudent && !isTutorView) {
                // Student view logic
                loadEnrollmentActionArea(courseId, enrollmentId, course.title);
                if (enrollmentId) {
                    loadCommentForm(courseId, enrollmentId);
                    loadProgressArea(enrollmentId);
                }
            } else if (isTutorView) {
                // Tutor view logic
                $('#tutor-delete-btn').off('click').on('click', () => handleCourseDeletion(courseId));
            }
            
            // Always load comments for both Student (if enrolled) and Tutor
            if (enrollmentId || isTutorView) {
                loadComments(courseId, isTutorView);
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

    if (enrollmentId) {
        $actionArea.html(`
            <button id="unenroll-btn" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-full transition">
                <i class="fas fa-undo-alt mr-2"></i>Unenroll
            </button>
            <span class="text-green-600 font-semibold ml-4">You are currently enrolled in this course.</span>
        `);
        // Unenroll handler (placeholder - typically complex as it affects DB stats)
        $('#unenroll-btn').off('click').on('click', function() {
            alert('Unenrollment logic is a complex feature. For this app, please proceed with learning!');
        });
    } else {
        $actionArea.html(`
            <button id="enroll-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition">
                <i class="fas fa-graduation-cap mr-2"></i>Enroll Now
            </button>
        `);
        // Enroll handler
        $('#enroll-btn').off('click').on('click', function() {
            $.post(`${API_BASE_URL}/enrollments`, { studentId, courseId })
                .done(function(data) {
                    alert(`Successfully enrolled in "${data.courseTitle}"!`);
                    // Reload the details view with the new enrollment ID
                    loadCourseDetailsView(courseId, data.enrollment._id);
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.message : 'Enrollment failed.';
                    alert('Error: ' + error);
                });
        });
    }
}

function loadProgressArea(enrollmentId) {
    const $progressArea = $('#progress-area');
    
    // Placeholder to show progress and provide a manual update
    $progressArea.html(`
        <div class="flex justify-between items-center">
            <h4 class="font-bold text-indigo-700">Your Progress: <span id="current-progress">...</span>%</h4>
            <button id="update-progress-btn" class="bg-indigo-500 hover:bg-indigo-600 text-white text-xs py-1 px-3 rounded-full transition">
                Mark as Complete
            </button>
        </div>
        <input type="range" min="0" max="100" value="0" id="progress-slider" class="w-full mt-2" />
    `);

    // Fetch current progress
    $.get(`${API_BASE_URL}/enrollments/${getLoggedInUserId()}`)
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
            error: function() {
                alert('Failed to update progress.');
            }
        });
    });
}


// --- 11. Comments/Reviews ---

function loadCommentForm(courseId) {
    const studentId = getLoggedInUserId();
    const $formArea = $('#new-comment-form');

    $formArea.html(`
        <h4 class="text-xl font-semibold text-gray-700 mb-3">Leave a Review</h4>
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
        <div class="flex justify-end mt-3">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition">
                Submit Review
            </button>
        </div>
        <div id="comment-message" class="mt-2 text-right text-sm"></div>
    `);

    $formArea.off('submit').on('submit', function(e) {
        e.preventDefault();
        const text = $formArea.find('#comment-text-input').val();
        const rating = parseInt($formArea.find('#rating-input').val());
        const $message = $formArea.find('#comment-message');

        $message.html('<span class="text-blue-500">Submitting...</span>');

        $.post(`${API_BASE_URL}/comments`, { courseId, studentId, text, rating })
            .done(function() {
                $message.html('<span class="text-green-600">Review submitted!</span>');
                $formArea.find('#comment-text-input').val('');
                loadComments(courseId, false); // Reload comments list
                // Optionally reload course details to update rating display
                // loadCourseDetailsView(courseId, enrollmentId); 
            })
            .fail(function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to submit comment.';
                $message.html('<span class="text-red-600">' + error + '</span>');
            });
    });
}

function loadComments(courseId, isTutorView) {
    const $commentsList = $('#comments-list');
    $commentsList.html('<div class="text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading comments...</div>');

    $.get(`${API_BASE_URL}/comments/${courseId}`)
        .done(function(comments) {
            $commentsList.empty();
            if (comments.length === 0) {
                $commentsList.html('<p class="text-gray-500">Be the first to leave a review!</p>');
                return;
            }

            comments.forEach(comment => {
                const commentHtml = `
                    <div class="comment-item border-b pb-4 mb-4" data-id="${comment._id}" data-course-id="${comment.courseId}">
                        <div class="flex justify-between items-center mb-1">
                            <h5 class="font-bold text-gray-800">${comment.studentId.name}</h5>
                            ${isTutorView ? `<button class="delete-comment-btn text-red-500 hover:text-red-700 text-sm"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
                        </div>
                        <div class="mb-2">
                            ${renderRating(comment.rating)}
                        </div>
                        <p class="text-gray-700 mb-1">${comment.text}</p>
                        <p class="text-xs text-gray-400">Posted: ${new Date(comment.createdAt).toLocaleDateString()}</p>
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

    // 3. Decide which view to load
    if (isLoggedIn) {
        // If logged in, load the dashboard/my courses
        clearContentArea();
        if (userType === 'Tutor') loadTutorDashboardView();
        else loadStudentCoursesView();
    } else {
        // If logged out: The landing page is already in index.html, just attach handlers
        attachLandingPageHandlers();
        // Clear the default landing content and load the catalog if the main section is empty (e.g., if navigating directly)
        // We'll trust the index.html content to be present and only attach handlers.
    }

    // 4. Mobile menu toggle
    $('#mobile-menu-toggle').on('click', function () {
        const $menu = $('#mobile-menu');
        if ($menu.hasClass('-translate-y-full')) {
            $menu.removeClass('-translate-y-full').addClass('translate-y-0');
            $('#menu-icon').addClass('hidden');
            $('#close-icon').removeClass('hidden');
        } else {
            $menu.removeClass('translate-y-0').addClass('-translate-y-full');
            $('#menu-icon').removeClass('hidden');
            $('#close-icon').addClass('hidden');
        }
    });
    
    // 5. Global Navigation Link Handlers (Delegated for dynamically loaded links)
    const $desktopNav = $('#desktop-menu-links');
    const $mobileNav = $('#mobile-menu-links');

    // Home link
    $('#home-nav-link, #mobile-nav-home').off('click').on('click', (e) => { 
        e.preventDefault();
        const loggedInUserType = getLoggedInUserType();
        if (loggedInUserType === 'Tutor') loadTutorDashboardView();
        else if (loggedInUserType === 'Student') loadStudentCoursesView();
        else loadLandingPageView(); 
        hideMobileMenu();
    });

    // Student Sign In/Up
    $desktopNav.add($mobileNav).off('click', '#nav-student-auth, #mobile-nav-student-auth').on('click', '#nav-student-auth, #mobile-nav-student-auth', (e) => { 
        e.preventDefault(); 
        clearContentArea(); 
        loadStudentSignInView();
        hideMobileMenu();
    });

    // Tutor Sign In/Up
    $desktopNav.add($mobileNav).off('click', '#nav-tutor-auth, #mobile-nav-tutor-auth').on('click', '#nav-tutor-auth, #mobile-nav-tutor-auth', (e) => { 
        e.preventDefault(); 
        clearContentArea(); 
        loadTutorSignInView();
        hideMobileMenu();
    });

    // Course Catalog
    $desktopNav.add($mobileNav).off('click', '#nav-course-catalog, #mobile-nav-course-catalog').on('click', '#nav-course-catalog, #mobile-nav-course-catalog', (e) => { 
        e.preventDefault(); 
        loadStudentCourseCatalog(); 
        hideMobileMenu();
    });
    
    // My Courses
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
        clearContentArea(); 
        loadStudentSignInView(); 
    });

    $('#tutor-sign-in-from-landing').off('click').on('click', (e) => { 
        e.preventDefault(); 
        clearContentArea(); 
        loadTutorSignInView(); 
    });
}