// app.js (Frontend Code with ALL CRITICAL FIXES APPLIED)

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

// --- 3. UI Helper Functions (Mobile Responsiveness Fixes) ---

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

/** * CRITICAL FIX: Ensures the mobile menu is properly hidden 
 * by resetting the transform and icon states.
 */
function hideMobileMenu() {
    $('#mobile-menu').removeClass('translate-y-0').addClass('-translate-y-full');
    $('#menu-icon').removeClass('hidden');
    $('#close-icon').addClass('hidden');
}


// --- 4. UI Helper: Navigation Visibility (Mobile Responsive Structure) ---

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

    // 4.2. Apply HTML to Desktop and Mobile menus (Mobile uses block/full-width links)
    let desktopHtml = '', mobileHtml = '';
    
    if (isLoggedIn) {
        if (userType === 'Tutor') {
            desktopHtml = tutorNavHtml;
            mobileHtml = `
                <a href="#" id="mobile-nav-home" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Home</a>
                <a href="#" id="mobile-nav-tutor-dashboard" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Dashboard</a>
                <a href="#" id="mobile-nav-create-course" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Create Course</a>
                <div class="border-t border-indigo-500 my-2"></div>
                <span class="text-indigo-200 block py-2 px-3">Hi, ${user.name.split(' ')[0]}</span>
                <a href="#" id="mobile-nav-sign-out" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Sign Out</a>
            `;
        } else { // Student
            desktopHtml = studentNavHtml;
            mobileHtml = `
                <a href="#" id="mobile-nav-home" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Home</a>
                <a href="#" id="mobile-nav-course-catalog" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Catalog</a>
                <a href="#" id="mobile-nav-my-courses" class="text-white hover:text-indigo-200 block py-2 px-3 transition">My Courses</a>
                <div class="border-t border-indigo-500 my-2"></div>
                <span class="text-indigo-200 block py-2 px-3">Hi, ${user.name.split(' ')[0]}</span>
                <a href="#" id="mobile-nav-sign-out" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Sign Out</a>
            `;
        }
    } else { // Logged out
        desktopHtml = loggedOutNavHtml;
        mobileHtml = `
            <a href="#" id="mobile-nav-home" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Home</a>
            <a href="#" id="mobile-nav-course-catalog" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Catalog</a>
            <a href="#" id="mobile-nav-student-auth" class="text-white hover:text-indigo-200 block py-2 px-3 transition">Student Sign In/Up</a>
            <a href="#" id="mobile-nav-tutor-auth" class="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full block text-center mt-3 transition">Tutor Sign In</a>
        `;
    }

    $('#desktop-menu-links').html(desktopHtml);
    $('#mobile-menu-links').html(mobileHtml);
}


// --- 5. View: User Authentication (Sign In/Up) ---

/** Handles the AJAX call for user sign up (student only for now). */
function handleSignUp(e, role) {
    e.preventDefault();
    const $form = $(e.target);
    const name = $form.find('#name').val().trim();
    const email = $form.find('#email').val().trim();
    const password = $form.find('#password').val();
    const messageArea = $form.find(`#signup-message`);
    
    messageArea.removeClass().text('');

    $.ajax({
        url: `${API_BASE_URL}/users/signup`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name, email, password, role }),
        success: function(response) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text('Sign up successful! Redirecting to sign in...');
            setTimeout(() => {
                clearContentArea();
                if (role === 'student') loadStudentSignInView();
                else loadTutorSignInView();
            }, 1000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Sign-up failed.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
        }
    });
}

/** Handles the AJAX call for user sign in (student or tutor). */
function handleSignIn(e, role) {
    e.preventDefault();
    const $form = $(e.target);
    const email = $form.find('#email').val().trim();
    const password = $form.find('#password').val();
    const messageArea = $form.find(`#signin-message`);

    messageArea.removeClass().text('');

    $.ajax({
        url: `${API_BASE_URL}/users/signin`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password, role }),
        success: function(response) {
            const user = response.user;
            const userType = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            localStorage.setItem(`loggedIn${userType}`, JSON.stringify(user));
            messageArea.removeClass().addClass('text-green-600 font-bold').text(`Welcome, ${user.name.split(' ')[0]}!`);
            updateNavVisibility(userType, true);

            setTimeout(() => {
                clearContentArea();
                if (user.role === 'tutor') loadTutorDashboardView();
                else loadStudentCourseCatalog();
            }, 1000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Sign-in failed. Check your email and password.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
        }
    });
}

function loadStudentSignInView() {
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
    $('#student-signin-form').off('submit').on('submit', (e) => handleSignIn(e, 'student'));
    $('#go-to-student-signup').off('click').on('click', (e) => { e.preventDefault(); loadStudentSignUpView(); });
}

function loadStudentSignUpView() {
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
    $('#student-signup-form').off('submit').on('submit', (e) => handleSignUp(e, 'student'));
    $('#go-to-student-signin').off('click').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); });
}

function loadTutorSignInView() {
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
    $('#tutor-signin-form').off('submit').on('submit', (e) => handleSignIn(e, 'tutor'));
    $('#go-to-tutor-signup').off('click').on('click', (e) => { e.preventDefault(); loadTutorSignUpView(); });
}

function loadTutorSignUpView() {
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
    $('#tutor-signup-form').off('submit').on('submit', (e) => handleSignUp(e, 'tutor'));
    $('#go-to-tutor-signin').off('click').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); });
}

// --- 6. Landing Page View ---
function loadLandingPageView() {
    const html = `
        <div class="text-center my-16 p-6 md:p-12 bg-gray-50 rounded-lg shadow-xl">
            <h1 class="text-4xl md:text-6xl font-extrabold text-indigo-700 mb-4">Learn Anytime, Anywhere</h1>
            <p class="text-xl md:text-2xl text-gray-600 mb-8">Your ultimate destination for video tutorials on code, design, and more.</p>
            <div class="space-y-4 md:space-y-0 md:space-x-4">
                <button id="browse-catalog-landing" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg transition duration-300">
                    Browse Course Catalog
                </button>
                <button id="student-sign-in-from-landing" class="bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-600 font-bold py-3 px-8 rounded-lg shadow-lg text-lg transition duration-300">
                    Student Sign In
                </button>
            </div>
            <p class="mt-8 text-md text-gray-500">Are you an expert? 
                <a href="#" id="tutor-sign-in-from-landing" class="text-green-600 hover:text-green-800 font-bold transition">Sign in as a Tutor</a> to share your knowledge.
            </p>
        </div>
    `;
    $('#content-area').html(html);
    attachLandingPageHandlers();
}


// --- 7. Student Views (Catalog/My Courses - API error handling verified) ---

/** Renders a course as a card in the catalog or my courses view. */
function renderCourseCard(course) {
    const isLocalAsset = course.asset.type === 'local';
    // Use placeholder image if local asset or invalid URL (to fix 404 image errors)
    const assetUrl = getAssetUrl(course.asset);
    const imageUrl = isLocalAsset || course.asset.url === 'access_denied'
        ? 'https://via.placeholder.com/600x400.png?text=Video+Course' // Use a reliable placeholder
        : `https://img.youtube.com/vi/${course.asset.url}/mqdefault.jpg`;
        
    const assetIcon = isLocalAsset 
        ? '<i class="fas fa-file-video mr-1"></i> Local Video' 
        : '<i class="fab fa-youtube mr-1"></i> YouTube';
        
    let enrollmentBadge = '';
    let cardClasses = 'cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition duration-300';
    let cardContent = '';

    if (course.enrollmentId) {
        // My Courses View
        const isComplete = course.progressPercentage === 100;
        const progressColor = isComplete ? 'bg-green-200' : 'bg-indigo-200';
        cardContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-2">${course.title}</h3>
            <p class="text-sm text-gray-600 mb-4">By: ${course.tutorId ? course.tutorId.name : 'Unknown'}</p>
            <div class="mb-4">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-700">Progress:</span>
                    <span id="progress-percent" class="text-lg font-bold ${isComplete ? 'text-green-600' : 'text-indigo-600'}">${course.progressPercentage}%</span>
                </div>
                <div class="w-full ${progressColor} rounded-full h-2.5">
                    <div class="h-2.5 rounded-full ${isComplete ? 'bg-green-700' : 'bg-indigo-700'}" style="width: ${course.progressPercentage}%"></div>
                </div>
            </div>
            <div class="flex items-center text-sm text-gray-500">
                ${renderRating(course.averageRating)} 
                <span class="ml-2">(${course.totalReviews} reviews)</span>
            </div>
        `;
    } else {
        // Catalog View
        enrollmentBadge = course.isEnrolled
            ? '<span class="text-green-600 font-bold"><i class="fas fa-check-circle mr-1"></i> Enrolled</span>'
            : `<span class="text-indigo-600 font-bold">$${(typeof course.price === 'number' ? course.price : 0).toFixed(2)}</span>`;
        
        cardContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-2">${course.title}</h3>
            <p class="text-sm text-gray-600 mb-4">By: ${course.tutorId ? course.tutorId.name : 'Unknown'}</p>
            <div class="flex items-center mb-3">
                ${renderRating(course.averageRating)}
                <span class="text-sm text-gray-500 ml-2">(${course.totalReviews} reviews)</span>
            </div>
            <p class="text-gray-700 text-sm mb-3">${truncateText(course.description)}</p>
            <div class="flex justify-between items-center text-xs text-gray-500">
                <span>${assetIcon}</span>
                ${enrollmentBadge}
            </div>
        `;
    }

    // Common card structure
    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden course-card ${cardClasses}" data-course-id="${course._id}" data-enrollment-id="${course.enrollmentId || ''}">
            <img class="w-full h-48 object-cover" src="${imageUrl}" alt="${course.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/600x400.png?text=Video+Course+Asset';">
            <div class="p-5">
                ${cardContent}
            </div>
        </div>
    `;
}

/** * Loads the Course Catalog. 
 * FIX: Route structure verified for proper server communication and error messaging.
 */ 
function loadStudentCourseCatalog() {
    clearContentArea();
    const studentId = getLoggedInUserId();
    const isStudent = getLoggedInUserType() === 'Student';
    
    // UI Structure including Filter (for logged-in students)
    const filterHtml = isStudent ? `
        <div class="mb-6 flex justify-end">
            <label for="course-filter" class="text-gray-600 font-medium mr-3 self-center">Filter:</label>
            <select id="course-filter" class="border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="all">All Courses</option>
                <option value="enrolled">Enrolled Courses</option>
                <option value="not-enrolled">Not Enrolled</option>
            </select>
        </div>
    ` : '';
    
    const html = `
        <div class="p-6 md:p-10">
            <h2 class="text-4xl font-bold text-gray-800 mb-6 border-b pb-2">Course Catalog</h2>
            ${filterHtml}
            <div id="course-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-center col-span-full text-gray-500">Loading courses...</p>
            </div>
        </div>
    `;
    $('#content-area').html(html);

    const $courseList = $('#course-list');
    
    // Function to fetch courses based on filter
    const fetchCourses = (filter = 'all') => {
        $courseList.html('<p class="text-center col-span-full text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading courses...</p>');
        // Route: /api/courses/catalog
        $.get(`${API_BASE_URL}/courses/catalog`, { studentId, filter })
            .done(function(courses) {
                $courseList.empty();
                if (courses.length === 0) {
                    let msg = 'No courses found.';
                    if (filter === 'enrolled') msg = 'You are not currently enrolled in any courses.';
                    if (filter === 'not-enrolled') msg = 'You are enrolled in all available courses!';
                    $courseList.html(`<p class="text-center col-span-full text-gray-500">${msg}</p>`);
                    return;
                }
                courses.forEach(course => {
                    $courseList.append(renderCourseCard(course));
                });

                // Attach click handler for course details
                $courseList.off('click', '.course-card').on('click', '.course-card', function() {
                    const courseId = $(this).data('course-id');
                    const enrollmentId = $(this).data('enrollment-id') || null;
                    // Passing enrollmentId tells the detail view it's the "My Courses" context
                    loadCourseDetailsView(courseId, enrollmentId); 
                });
            })
            .fail(function(xhr) {
                const errorMsg = xhr.statusText || 'Could not connect to the server. Ensure the backend is running at http://localhost:5000.';
                $courseList.html(`<p class="text-red-500 text-center col-span-full">⚠️ Failed to load course catalog: ${errorMsg}</p>`);
            });
    };
    
    // Initial fetch
    fetchCourses();
    
    // Attach filter change handler
    $('#course-filter').off('change').on('change', function() {
        fetchCourses($(this).val());
    });
}

function loadStudentEnrolledCoursesView() {
    clearContentArea();
    const studentId = getLoggedInUserId();

    if (!studentId) {
        loadStudentSignInView();
        return;
    }

    const html = `
        <div class="p-6 md:p-10">
            <h2 class="text-4xl font-bold text-indigo-700 mb-6 border-b pb-2">My Courses</h2>
            <div id="enrolled-course-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-center col-span-full text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading your courses...</p>
            </div>
        </div>
    `;
    $('#content-area').html(html);
    const $courseList = $('#enrolled-course-list');

    // Route: /api/enrollments/student/:studentId
    $.get(`${API_BASE_URL}/enrollments/student/${studentId}`)
        .done(function(courses) {
            $courseList.empty();
            if (courses.length === 0) {
                $courseList.html('<p class="text-center col-span-full text-gray-500">You are not currently enrolled in any courses. Browse the <a href="#" id="go-to-catalog-from-mycourses" class="text-indigo-600 hover:text-indigo-800 font-bold">Catalog</a> to find your next one!</p>');
                $('#go-to-catalog-from-mycourses').off('click').on('click', (e) => { e.preventDefault(); loadStudentCourseCatalog(); });
                return;
            }
            courses.forEach(course => {
                $courseList.append(renderCourseCard(course));
            });

            // Attach click handler for course details
            $courseList.off('click', '.course-card').on('click', '.course-card', function() {
                const courseId = $(this).data('course-id');
                const enrollmentId = $(this).data('enrollment-id') || null;
                loadCourseDetailsView(courseId, enrollmentId);
            });
        })
        .fail(function(xhr) {
            const errorMsg = xhr.statusText || 'Could not connect to the server. Ensure the backend is running at http://localhost:5000.';
            $courseList.html(`<p class="text-red-500 text-center col-span-full">⚠️ Failed to load your courses: ${errorMsg}</p>`);
        });
}


// --- 8. Course Detail View (The most complex view) ---

function loadCourseDetailsView(courseId, enrollmentId = null, isTutorView = false) {
    clearContentArea();
    const userId = getLoggedInUserId();
    const userRole = getLoggedInUserType();
    
    // Set a loading state
    $('#content-area').html('<div class="p-10 text-center text-xl text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading course details...</div>');

    // Route: /api/courses/:courseId
    $.get(`${API_BASE_URL}/courses/${courseId}`, { userId, userRole })
        .done(function(course) {
            
            // Determine if the video can be played
            const isLocal = course.asset.type === 'local';
            const isRestricted = isLocal && course.asset.url === 'access_denied';
            
            // --- 1. Video Player HTML ---
            let videoHtml = '';
            if (isRestricted) {
                // RESTRICTED: Show an enrollment required message
                videoHtml = `
                    <div class="w-full rounded-lg shadow-xl aspect-video bg-gray-900 flex flex-col items-center justify-center p-8">
                        <i class="fas fa-lock text-white text-5xl mb-4"></i>
                        <h3 class="text-white text-2xl font-bold mb-2">Access Denied</h3>
                        <p class="text-gray-300 text-center">This is a local course asset. You must be enrolled to view the content.</p>
                        <button id="enroll-btn-restricted" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full transition">
                            Enroll Now
                        </button>
                    </div>
                `;
            } else if (isLocal) { 
                // LOCAL FILE: Use HTML5 <video> player
                const localVideoUrl = `${API_BASE_ROOT}/uploads/${course.asset.url}`;
                videoHtml = `
                    <video id="course-video-player" controls preload="metadata" class="w-full rounded-lg shadow-xl aspect-video">
                        <source src="${localVideoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else { 
                // YOUTUBE: Use embedded iframe
                videoHtml = `
                    <iframe id="course-video-player" class="w-full rounded-lg shadow-xl aspect-video" 
                            src="https://www.youtube.com/embed/${course.asset.url}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                `;
            }

            // --- 2. Action Button Logic ---
            let actionButtonHtml = '';
            if (isTutorView) {
                // Tutor View: Change Edit to DELETE
                actionButtonHtml = `
                    <button id="delete-course-btn" 
                            class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition"
                            data-course-id="${course._id}" 
                            data-course-title="${course.title}">
                        <i class="fas fa-trash-alt mr-2"></i> Delete Course
                    </button>
                `;
            } else if (course.isEnrolled) {
                // Student Enrolled View
                actionButtonHtml = `
                    <button id="start-course-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition">
                        <i class="fas fa-play-circle mr-2"></i> Start/Continue Course
                    </button>
                `;
            } else if (!userId) {
                // Logged Out View
                actionButtonHtml = `
                    <button id="enroll-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition">
                        <i class="fas fa-sign-in-alt mr-2"></i> Sign In to Enroll
                    </button>
                `;
            } else {
                // Student Not Enrolled View (only visible to logged in student)
                actionButtonHtml = `
                    <button id="enroll-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition">
                        <i class="fas fa-shopping-cart mr-2"></i> Enroll Now - $${course.price.toFixed(2)}
                    </button>
                `;
            }

            // --- 3. Progress Slider (Only for enrolled students) ---
            let progressSliderHtml = '';
            if (course.isEnrolled && !isTutorView) {
                const initialProgress = course.progressPercentage || 0;
                const progressColor = initialProgress === 100 ? 'text-green-600' : 'text-indigo-600';
                progressSliderHtml = `
                    <div class="mt-6 p-4 bg-white rounded-xl shadow-lg border-t-4 border-indigo-500">
                        <h4 class="text-lg font-bold text-gray-700 mb-3"><i class="fas fa-chart-line mr-2"></i>Your Course Progress</h4>
                        <div class="flex justify-between items-center mb-2">
                            <label for="progress-slider" class="text-gray-600">Mark Complete %:</label>
                            <span id="current-progress-text" class="text-xl font-extrabold ${progressColor}">${initialProgress}</span>%
                        </div>
                        <input type="range" min="0" max="100" value="${initialProgress}" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg" id="progress-slider">
                        <div class="flex justify-between text-sm text-gray-500 mt-1">
                            <span>0%</span>
                            <span>100% Complete</span>
                        </div>
                        <div id="progress-message" class="text-center mt-3"></div>
                        <button id="save-progress-btn" class="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition w-full">
                            Save Progress
                        </button>
                    </div>
                `;
            }

            // --- 4. Main Details HTML ---
            const mainHtml = `
                <div class="container mx-auto p-6 md:p-10">
                    <h1 class="text-4xl font-extrabold text-gray-900 mb-6">${course.title}</h1>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        <div class="lg:col-span-2 space-y-8">
                            <div class="video-player">
                                ${videoHtml}
                                <div id="course-detail-message" class="text-center mt-4"></div>
                            </div>
                            
                            <div class="description-box bg-white p-6 rounded-xl shadow-lg">
                                <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">About This Course</h2>
                                <p class="text-lg text-gray-700 mb-6">${course.description}</p>
                                <div class="flex items-center mb-4 text-xl">
                                    <span class="font-bold mr-2 text-indigo-700">Rating:</span>
                                    ${renderRating(course.averageRating)}
                                    <span class="text-gray-500 ml-2 text-base">(${course.totalReviews} reviews)</span>
                                </div>
                                <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-gray-600">
                                    <p class="font-semibold text-lg"><i class="fas fa-chalkboard-teacher mr-2"></i>Tutor: ${course.tutorId ? course.tutorId.name : 'Unknown'}</p>
                                    <p class="font-semibold text-lg"><i class="fas fa-users mr-2"></i>Enrolled: ${course.enrollmentCount}</p>
                                </div>
                            </div>
                            
                            <div class="chapters-info bg-white p-6 rounded-xl shadow-lg">
                                <h2 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Course Chapters</h2>
                                <ul class="list-none space-y-3">
                                    ${course.chapters.map((chapter, index) => `
                                        <li class="p-3 border-b last:border-b-0 flex items-center">
                                            <span class="text-lg font-bold text-indigo-500 mr-3">${index + 1}.</span>
                                            <span class="text-gray-700 text-lg">${chapter.title}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="lg:col-span-1 space-y-6">
                            <div class="action-box bg-white p-6 rounded-xl shadow-2xl border-t-4 border-${isTutorView ? 'red' : 'indigo'}-600">
                                <h3 class="text-3xl font-bold text-gray-800 mb-4">$${course.price.toFixed(2)}</h3>
                                ${actionButtonHtml}
                            </div>
                            ${progressSliderHtml}
                        </div>
                    </div>
                    
                    <div class="mt-10">
                        ${loadCommentSection(course, isTutorView, course.isEnrolled)}
                    </div>
                </div>
            `;

            $('#content-area').html(mainHtml);
            
            // --- 5. Attach Handlers ---

            // Enrollment / Sign In Button Handler
            $('#enroll-btn, #enroll-btn-restricted').off('click').on('click', function(e) {
                e.preventDefault();
                if (!userId) {
                    // Not logged in: Redirect to sign-in
                    loadStudentSignInView();
                } else if (userRole === 'Student') {
                    // Logged in as student: Handle enrollment
                    handleEnrollment(courseId);
                } else {
                    // Logged in as tutor: Alert (shouldn't happen with correct nav visibility)
                    alert('Only students can enroll in courses.');
                }
            });
            
            // Tutor Delete Course Handler
            $('#delete-course-btn').off('click').on('click', function(e) {
                e.preventDefault();
                const courseId = $(this).data('course-id');
                const courseTitle = $(this).data('course-title');
                handleDeleteCourse(courseId, courseTitle);
            });
            
            // Start Course Button Handler (Can reuse enrollment update logic)
            $('#start-course-btn').off('click').on('click', function(e) {
                 e.preventDefault();
                 // Automatically update progress to 1% to mark as started
                 if (enrollmentId && course.progressPercentage === 0) {
                     handleProgressUpdate(enrollmentId, 1, true); // Silent update
                 }
                 // Navigate to the video player (no actual navigation, just scrolling in a SPA)
                 $('html, body').animate({
                     scrollTop: $(".video-player").offset().top - 80 // Scroll up a bit
                 }, 500);
            });
            
            // Progress Handlers (Only available if enrolled)
            if (course.isEnrolled && !isTutorView) {
                updateVideoProgress(enrollmentId, course.progressPercentage);
            }
            
            // Comment Deletion Handler (Only for Tutor)
            if (isTutorView) {
                $('#comments-list').off('click', '.delete-comment-btn').on('click', '.delete-comment-btn', function(e) {
                    e.preventDefault();
                    const commentId = $(this).data('comment-id');
                    handleCommentDelete(commentId, courseId);
                });
            }
            
        })
        .fail(function(xhr) {
            const errorMsg = xhr.statusText || 'Could not connect to the server.';
            const message = xhr.responseJSON ? xhr.responseJSON.message : errorMsg;
            $('#content-area').html(`<div class="p-10 text-center text-red-500">⚠️ Failed to load course: ${message}</div>`);
        });
}

/**
 * NEW: Handles the AJAX call for a student to enroll in a course.
 */
function handleEnrollment(courseId) {
    const studentId = getLoggedInUserId();
    const $btn = $('#enroll-btn');
    const initialText = $btn.text();
    const messageArea = $('#course-detail-message');

    if (!studentId || getLoggedInUserType() !== 'Student') {
        alert('Please sign in as a student to enroll in a course.');
        return;
    }

    $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Enrolling...');
    messageArea.removeClass().text('');

    $.ajax({
        url: `${API_BASE_URL}/enrollments`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ studentId, courseId }),
        success: function(response) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text('Enrollment successful! Redirecting...');
            // Wait for a second then reload the view to show the 'Start Course' button
            setTimeout(() => {
                // Reload with the new enrollment ID to show the enrolled view
                loadCourseDetailsView(courseId, response.enrollmentId); 
            }, 1000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to enroll in the course.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
            $btn.prop('disabled', false).text(initialText);
        }
    });
}

function handleProgressUpdate(enrollmentId, progressPercentage, isSilent = false) {
    const $btn = $('#save-progress-btn');
    const initialText = $btn.text();
    const messageArea = $('#progress-message');

    // Only disable button and show loading if not a silent update
    if (!isSilent) {
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Saving...');
        messageArea.removeClass().text('');
    }

    $.ajax({
        url: `${API_BASE_URL}/enrollments/progress/${enrollmentId}`,
        method: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ progressPercentage }),
        success: function(response) {
            const isComplete = response.progress === 100;
            const statusText = isComplete ? 'Progress saved and course complete! 🎉' : 'Progress saved successfully.';
            
            // Only update UI if not a silent update
            if (!isSilent) {
                messageArea.removeClass().addClass('text-green-600 font-bold text-sm').text(statusText);
                $btn.prop('disabled', false).text(initialText);
                if (isComplete) {
                    // Visually update the progress text and color
                    $('#current-progress-text').removeClass('text-indigo-600').addClass('text-green-600');
                } else {
                     $('#current-progress-text').removeClass('text-green-600').addClass('text-indigo-600');
                }
            }
        },
        error: function() {
            if (!isSilent) {
                messageArea.removeClass().addClass('text-red-600 font-bold text-sm').text('Failed to update progress.');
                $btn.prop('disabled', false).text(initialText);
            }
        }
    });
}

function updateVideoProgress(enrollmentId, initialProgress) {
    const videoPlayer = document.getElementById('course-video-player');
    const $progressSlider = $('#progress-slider');
    const $currentProgressText = $('#current-progress-text');

    if (!videoPlayer || !enrollmentId) return;

    $progressSlider.val(initialProgress);
    $progressSlider.data('last-sent-progress', initialProgress);
    $currentProgressText.text(initialProgress);
    $progressSlider.data('enrollment-id', enrollmentId);

    // 8.1. Slider Change Handlers
    $progressSlider.off('input').on('input', function() {
        $currentProgressText.text($(this).val());
    });

    $progressSlider.off('mousedown touchstart').on('mousedown touchstart', function() {
        $progressSlider.data('is-dragging', true);
    });
    
    // Auto-save on slider release
    $progressSlider.off('mouseup touchend').on('mouseup touchend', function() {
        if ($progressSlider.data('is-dragging')) {
            $progressSlider.data('is-dragging', false);
            const newProgress = parseInt($(this).val());
            const lastSentProgress = parseInt($(this).data('last-sent-progress'));
            
            if (newProgress !== lastSentProgress) {
                handleProgressUpdate(enrollmentId, newProgress);
                $(this).data('last-sent-progress', newProgress);
            }
        }
    });
    
    // Explicit Save Button
    $('#save-progress-btn').off('click').on('click', function() {
        const newProgress = parseInt($progressSlider.val());
        handleProgressUpdate(enrollmentId, newProgress);
        $progressSlider.data('last-sent-progress', newProgress);
    });

    // 8.2. Auto-update for 100% completion when video finishes
    $(videoPlayer).off('ended').on('ended', function() {
        if (parseInt($progressSlider.val()) < 100) {
            $progressSlider.val(100);
            $currentProgressText.text(100);
            handleProgressUpdate(enrollmentId, 100);
            $progressSlider.data('last-sent-progress', 100);
        }
    });
}


// --- 9. Comment/Review Logic ---

/** * CRITICAL FIX: The comment form is now only loaded if the student 
 * is enrolled, preventing unauthorized reviews.
 */
function loadCommentSection(course, isTutorView, isStudentEnrolled) {
    let formHtml;
    
    const userType = getLoggedInUserType();
    
    if (userType === 'Student') {
        if (isStudentEnrolled) {
            // Student is enrolled - allow commenting
            formHtml = loadCommentForm(course.averageRating, course.totalReviews, course._id);
        } else {
            // Student is NOT enrolled - restrict
            formHtml = `
                <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-md">
                    <p class="text-yellow-800 font-medium text-lg"><i class="fas fa-lock mr-2"></i>You must be enrolled in this course to leave a review.</p>
                </div>
            `;
        }
    } else if (userType === 'Tutor') {
        // Tutors can see review stats but cannot post student reviews
        formHtml = `
            <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-md">
                <p class="text-indigo-800 font-medium text-lg"><i class="fas fa-user-tie mr-2"></i>Tutors cannot post student reviews, but you can delete comments from the list below.</p>
            </div>
        `;
    } else {
        // Logged out - prompt to sign in
         formHtml = `
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-md">
                <p class="text-blue-800 font-medium text-lg"><i class="fas fa-sign-in-alt mr-2"></i><a href="#" id="go-to-student-auth" class="text-blue-600 hover:text-blue-800 font-bold">Sign in as a student</a> to leave a review.</p>
            </div>
        `;
    }

    // Attach handler for sign-in prompt in comment section
    $(document).off('click', '#go-to-student-auth').on('click', '#go-to-student-auth', (e) => {
        e.preventDefault();
        loadStudentSignInView();
    });

    // Main section HTML structure
    const commentSectionHtml = `
        <div id="comment-section" class="mt-8">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Student Reviews & Comments</h2>
            
            <div class="comment-rating-summary bg-white p-6 rounded-xl shadow-lg mb-8 flex flex-col sm:flex-row justify-between items-center">
                <div>
                    <span class="text-5xl font-extrabold text-indigo-700">${course.averageRating.toFixed(1)}</span>
                    <span class="text-2xl text-gray-500"> / 5.0</span>
                </div>
                <div class="text-2xl mt-2 sm:mt-0">
                    ${renderRating(course.averageRating)}
                </div>
                <p class="text-gray-600 text-lg mt-2 sm:mt-0">${course.totalReviews} Total Reviews</p>
            </div>
            
            ${formHtml}
            
            <div class="mt-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-4">All Comments</h3>
                <div id="comments-list" class="space-y-4">
                    <p class="text-center text-gray-500">Loading comments...</p>
                </div>
            </div>
        </div>
    `;
    
    // Use a temporary container to render the section and immediately fetch comments
    const $commentSection = $(commentSectionHtml);
    
    // Fetch and display comments
    $.get(`${API_BASE_URL}/comments/${course._id}`)
        .done(function(comments) {
            const $commentList = $commentSection.find('#comments-list').empty();
            if (comments.length === 0) {
                $commentList.html('<p class="text-center text-gray-500">Be the first to leave a review!</p>');
                return;
            }
            comments.forEach(comment => {
                $commentList.append(renderComment(comment, isTutorView));
            });
        })
        .fail(function() {
            $commentSection.find('#comments-list').html('<p class="text-red-500 text-center">Failed to load comments.</p>');
        });

    return $commentSection.get(0).outerHTML; // Return the full HTML string
}


function loadCommentForm(averageRating, totalReviews, courseId) {
    const html = `
        <h3 class="text-xl font-bold text-indigo-700 mb-4">Leave a Review</h3>
        <form id="comment-post-form" class="space-y-4 bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-200">
            <div class="flex items-center space-x-4">
                <label class="font-semibold text-gray-700">Your Rating:</label>
                <div id="rating-stars" class="text-2xl cursor-pointer">
                    <i class="far fa-star text-yellow-400" data-rating="1"></i>
                    <i class="far fa-star text-yellow-400" data-rating="2"></i>
                    <i class="far fa-star text-yellow-400" data-rating="3"></i>
                    <i class="far fa-star text-yellow-400" data-rating="4"></i>
                    <i class="far fa-star text-yellow-400" data-rating="5"></i>
                </div>
                <input type="hidden" id="review-rating" value="0" required>
            </div>
            <div>
                <label class="block font-semibold text-gray-700 mb-2" for="review-text">Your Comment</label>
                <textarea id="review-text" rows="4" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Tell us what you think..." required></textarea>
            </div>
            <button id="post-comment-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition" type="submit">
                Post Comment
            </button>
            <div id="comment-message" class="mt-3 text-center"></div>
        </form>
    `;
    
    // Attach handlers after rendering (or use delegation)
    $(document).off('click', '#rating-stars i').on('click', '#rating-stars i', handleStarRatingClick);
    $(document).off('submit', '#comment-post-form').on('submit', '#comment-post-form', (e) => handleCommentPost(e, courseId));
    
    return html;
}

function handleStarRatingClick() {
    const $star = $(this);
    const rating = $star.data('rating');
    $('#review-rating').val(rating);
    
    // Update star visual state
    $star.parent().children('i').each(function() {
        const currentStarRating = $(this).data('rating');
        if (currentStarRating <= rating) {
            $(this).removeClass('far').addClass('fas');
        } else {
            $(this).removeClass('fas').addClass('far');
        }
    });
}

function handleCommentPost(e, courseId) {
    e.preventDefault();
    
    const studentId = getLoggedInUserId();
    const rating = parseInt($('#review-rating').val());
    const text = $('#review-text').val().trim();
    const messageArea = $('#comment-message');
    const $btn = $('#post-comment-btn');

    if (rating === 0 || text === '') {
        messageArea.removeClass().addClass('text-red-600 font-bold').text('Please select a rating and enter a comment.');
        return;
    }

    $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Posting...');
    messageArea.removeClass().text('');

    $.ajax({
        url: `${API_BASE_URL}/comments`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ courseId, studentId, rating, text }),
        success: function(response) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text('Comment posted successfully!');
            $btn.prop('disabled', false).text('Post Comment');
            
            // Clear form and add new comment to list
            $('#review-text').val('');
            $('#review-rating').val(0);
            $('#rating-stars i').removeClass('fas').addClass('far');
            
            const newCommentHtml = renderComment(response.comment, false);
            $('#comments-list').prepend(newCommentHtml);
            
            // Reload the course details to refresh the overall rating summary
            // This is a robust way to update the whole UI after a rating change
            loadCourseDetailsView(courseId, null, getLoggedInUserType() === 'Tutor'); 
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to post review.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(error);
            $btn.prop('disabled', false).text('Post Comment');
        }
    });
}

function renderComment(comment, isTutorView) {
    // Only tutors see the delete button
    const deleteBtn = isTutorView ? `
        <button class="delete-comment-btn text-red-500 hover:text-red-700 text-sm ml-4 transition" 
                data-comment-id="${comment._id}" 
                data-course-id="${comment.courseId}">
            <i class="fas fa-trash-alt"></i> Delete
        </button>` : '';
        
    return `
        <div class="comment-item bg-gray-50 p-4 rounded-xl shadow-sm border-l-4 border-indigo-200">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <p class="font-bold text-gray-800">${comment.studentId ? comment.studentId.name : 'Unknown Student'}</p>
                    <div class="text-sm text-gray-500">${new Date(comment.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="flex items-center">
                    ${renderRating(comment.rating)}
                    ${deleteBtn}
                </div>
            </div>
            <p class="text-gray-700 mt-2">${comment.text}</p>
        </div>
    `;
}

function handleCommentDelete(commentId, courseId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    $.ajax({
        url: `${API_BASE_URL}/comments/${commentId}`,
        method: 'DELETE',
        success: function() {
            alert('Comment deleted successfully.');
            // Reload the course details to remove the comment and refresh the overall rating summary
            loadCourseDetailsView(courseId, null, true); 
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to delete comment.';
            alert(`Error deleting comment: ${error}`);
        }
    });
}


// --- 10. Tutor Views ---

/** Renders a course as a card in the Tutor Dashboard view. */
function renderTutorCourseCard(course) {
    const isLocalAsset = course.asset.type === 'local';
    const imageUrl = isLocalAsset 
        ? 'https://via.placeholder.com/600x400.png?text=Local+Video'
        : `https://img.youtube.com/vi/${course.asset.url}/mqdefault.jpg`;
        
    const assetIcon = isLocalAsset 
        ? '<i class="fas fa-file-video mr-1"></i> Local Video' 
        : '<i class="fab fa-youtube mr-1"></i> YouTube';
        
    // CRITICAL FIX: Changed Edit button to Delete button
    const actionButton = `
        <button class="delete-course-btn bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg text-sm transition" 
                data-course-id="${course._id}" 
                data-course-title="${course.title}">
            <i class="fas fa-trash-alt mr-1"></i> Delete Course
        </button>
    `;

    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden course-card cursor-pointer hover:shadow-xl transform hover:-translate-y-1 transition duration-300" data-course-id="${course._id}">
            <img class="w-full h-48 object-cover" src="${imageUrl}" alt="${course.title}" onerror="this.onerror=null; this.src='https://via.placeholder.com/600x400.png?text=Video+Course+Asset';">
            <div class="p-5">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${course.title}</h3>
                <div class="flex items-center mb-3">
                    ${renderRating(course.averageRating)}
                    <span class="text-sm text-gray-500 ml-2">(${course.totalReviews} reviews)</span>
                </div>
                <p class="text-gray-700 text-sm mb-3">${truncateText(course.description)}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 pt-2 border-t mt-3">
                    <span>${assetIcon}</span>
                    ${actionButton}
                </div>
            </div>
        </div>
    `;
}

function loadTutorDashboardView() {
    clearContentArea();
    const tutorId = getLoggedInUserId();

    if (!tutorId) {
        loadTutorSignInView();
        return;
    }

    const html = `
        <div class="p-6 md:p-10">
            <h2 class="text-4xl font-bold text-indigo-700 mb-6 border-b pb-2">Tutor Dashboard</h2>
            <p class="text-lg text-gray-600 mb-6">Manage your created courses.</p>
            <div id="tutor-courses-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-center col-span-full text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading your courses...</p>
            </div>
        </div>
    `;
    $('#content-area').html(html);
    const $courseList = $('#tutor-courses-list');

    // Route: /api/courses/tutor/:tutorId
    $.get(`${API_BASE_URL}/courses/tutor/${tutorId}`)
        .done(function(courses) {
            $courseList.empty();
            if (courses.length === 0) {
                $courseList.html('<p class="text-center col-span-full text-gray-500">You have not created any courses yet. Start by clicking "Create Course".</p>');
                return;
            }
            courses.forEach(course => {
                $courseList.append(renderTutorCourseCard(course));
            });
            
            // Attach click handler for course details (view mode)
            $courseList.off('click', '.course-card').on('click', '.course-card', function() {
                // Check if the click originated from the delete button
                if ($(event.target).closest('.delete-course-btn').length) {
                    return; 
                }
                const courseId = $(this).data('course-id');
                loadCourseDetailsView(courseId, null, true); // true for isTutorView
            });

            // Attach NEW delete handler
            $courseList.off('click', '.delete-course-btn').on('click', '.delete-course-btn', function(e) {
                e.stopPropagation(); // Prevent the card click handler from firing
                const courseId = $(this).data('course-id');
                const courseTitle = $(this).data('course-title');
                handleDeleteCourse(courseId, courseTitle);
            });
        })
        .fail(function(xhr) {
            const errorMsg = xhr.statusText || 'Could not connect to the server. Ensure the backend is running at http://localhost:5000.';
            $courseList.html(`<p class="text-red-500 text-center col-span-full">⚠️ Failed to load your courses: ${errorMsg}</p>`);
        });
}

/** * NEW: Handles the AJAX call for a tutor to delete a course.
 */
function handleDeleteCourse(courseId, courseTitle) {
    if (!confirm(`Are you sure you want to permanently delete the course: "${courseTitle}"? This action cannot be undone and will remove all associated enrollments and comments.`)) {
        return;
    }

    const $btn = $(`[data-course-id="${courseId}"].delete-course-btn`); // Target the button on the card or detail view
    const initialText = $btn.text();
    $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...');

    $.ajax({
        url: `${API_BASE_URL}/courses/${courseId}`,
        method: 'DELETE',
        success: function() {
            alert(`Course "${courseTitle}" deleted successfully!`);
            loadTutorDashboardView(); // Reload dashboard
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Failed to delete course.';
            alert(`Error deleting course: ${error}`);
            $btn.prop('disabled', false).html(initialText);
        }
    });
}

// ... (Rest of the functions like loadCourseCreationView, handleCourseCreation remain) ...

function loadCourseCreationView() {
    clearContentArea();
    const tutorId = getLoggedInUserId();

    if (getLoggedInUserType() !== 'Tutor') {
        alert('You must be signed in as a Tutor to create a course.');
        loadTutorSignInView();
        return;
    }
    
    const html = `
        <div class="max-w-4xl mx-auto my-10 bg-white p-8 rounded-xl shadow-2xl border-t-4 border-indigo-600">
            <h2 class="text-3xl font-bold text-center text-indigo-700 mb-8">Create a New Course</h2>
            <form id="course-creation-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="col-span-1">
                        <label class="block text-gray-700 font-bold mb-2" for="title">Course Title</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="title" type="text" placeholder="e.g., Introduction to React" required>
                    </div>
                    <div class="col-span-1">
                        <label class="block text-gray-700 font-bold mb-2" for="price">Price ($)</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="price" type="number" step="0.01" placeholder="99.99" required>
                    </div>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-bold mb-2" for="description">Course Description</label>
                    <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="description" rows="4" placeholder="A detailed summary of what the student will learn..." required></textarea>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-bold mb-2" for="category">Category</label>
                    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="category" type="text" placeholder="e.g., Web Development, Design, Science" required>
                </div>

                <div class="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <h3 class="text-xl font-bold text-indigo-700 mb-4">Course Video Asset</h3>
                    <div class="mb-4">
                        <label class="block text-gray-700 font-bold mb-2" for="asset-type">Asset Type</label>
                        <select id="asset-type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                            <option value="youtube">YouTube Video</option>
                            <option value="local">Local Video File (Upload)</option>
                        </select>
                    </div>
                    <div class="mb-4" id="youtube-url-field">
                        <label class="block text-gray-700 font-bold mb-2" for="asset-url">YouTube Video ID (e.g., dQw4w9WgXcQ)</label>
                        <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="asset-url" type="text" placeholder="dQw4w9WgXcQ">
                        <p class="text-sm text-gray-500 mt-1">Extract the video ID from the YouTube URL.</p>
                    </div>
                    <div class="mb-4 hidden" id="local-upload-field">
                        <label class="block text-gray-700 font-bold mb-2" for="asset-file">Upload Video File (Max 500MB)</label>
                        <input class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                                id="asset-file" 
                                type="file" 
                                accept="video/mp4,video/quicktime,video/webm">
                    </div>
                </div>

                <div class="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <h3 class="text-xl font-bold text-indigo-700 mb-4">Course Chapters</h3>
                    <div id="chapters-container" class="space-y-3">
                        ${renderChapterInput(1)}
                    </div>
                    <button id="add-chapter-btn" type="button" class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition">
                        <i class="fas fa-plus mr-2"></i>Add Chapter
                    </button>
                </div>

                <div class="flex items-center justify-between pt-4">
                    <button id="submit-course-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full focus:outline-none focus:shadow-outline transition" type="submit">
                        <i class="fas fa-save mr-2"></i>Create Course
                    </button>
                </div>
                <div id="course-creation-message" class="mt-4 text-center"></div>
            </form>
        </div>
    `;
    $('#content-area').html(html);

    // Initial Chapter Index (already one is rendered)
    $('#chapters-container').data('chapter-count', 1);

    // Event handlers
    $('#asset-type').off('change').on('change', handleAssetTypeChange);
    $('#add-chapter-btn').off('click').on('click', handleAddChapter);
    $('#course-creation-form').off('submit').on('submit', handleCourseCreation);
}

function renderChapterInput(index) {
    return `
        <div class="chapter-input flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm" data-index="${index}">
            <label class="text-gray-700 font-medium">${index}.</label>
            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline chapter-title-input" 
                   type="text" 
                   placeholder="Chapter Title ${index}" 
                   required>
            <button type="button" class="remove-chapter-btn text-red-500 hover:text-red-700 text-lg transition">
                <i class="fas fa-times-circle"></i>
            </button>
        </div>
    `;
}

function handleAssetTypeChange() {
    const assetType = $('#asset-type').val();
    if (assetType === 'youtube') {
        $('#youtube-url-field').removeClass('hidden');
        $('#local-upload-field').addClass('hidden');
    } else {
        $('#youtube-url-field').addClass('hidden');
        $('#local-upload-field').removeClass('hidden');
    }
}

function handleAddChapter() {
    let count = $('#chapters-container').data('chapter-count');
    count++;
    $('#chapters-container').data('chapter-count', count);
    $('#chapters-container').append(renderChapterInput(count));

    // Attach handler for the new remove button
    $('#chapters-container').off('click', '.remove-chapter-btn').on('click', '.remove-chapter-btn', handleRemoveChapter);
}

function handleRemoveChapter(e) {
    const $chapterContainer = $('#chapters-container');
    const $chapterInput = $(e.target).closest('.chapter-input');
    
    // Do not allow removing the last chapter
    if ($chapterContainer.find('.chapter-input').length <= 1) {
        alert('A course must have at least one chapter.');
        return;
    }

    $chapterInput.remove();

    // Re-index remaining chapters
    $chapterContainer.find('.chapter-input').each(function(index) {
        const newIndex = index + 1;
        $(this).data('index', newIndex);
        $(this).find('label').text(`${newIndex}.`);
        $(this).find('.chapter-title-input').attr('placeholder', `Chapter Title ${newIndex}`);
    });

    $chapterContainer.data('chapter-count', $chapterContainer.find('.chapter-input').length);
}

function handleCourseCreation(e) {
    e.preventDefault();
    const tutorId = getLoggedInUserId();
    const messageArea = $('#course-creation-message');
    const $btn = $('#submit-course-btn');
    
    const title = $('#title').val().trim();
    const description = $('#description').val().trim();
    const price = $('#price').val();
    const category = $('#category').val().trim();
    const assetType = $('#asset-type').val();
    const assetUrl = $('#asset-url').val().trim();
    const assetFile = $('#asset-file')[0].files[0];
    
    // Gather chapters
    const chapters = $('#chapters-container .chapter-title-input').map(function() {
        return { title: $(this).val().trim() };
    }).get();

    // Basic Validation
    if (!title || !description || !price || !category || chapters.length === 0) {
        messageArea.removeClass().addClass('text-red-600 font-bold').text('Please fill in the Title, Description, Price, Category, and add at least one Chapter.');
        return;
    }
    
    if (assetType === 'youtube' && !assetUrl) {
        messageArea.removeClass().addClass('text-red-600 font-bold').text('Please provide a YouTube Video ID.');
        return;
    }
    
    if (assetType === 'local' && !assetFile) {
        messageArea.removeClass().addClass('text-red-600 font-bold').text('Please select a Local Video File to upload.');
        return;
    }

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('tutorId', tutorId);
    formData.append('chapters', JSON.stringify(chapters));
    formData.append('assetType', assetType);
    
    if (assetType === 'local') {
        formData.append('assetFile', assetFile);
    } else {
        formData.append('assetUrl', assetUrl); // YouTube video ID
    }

    messageArea.removeClass().html('<span class="text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Uploading and creating course. Please wait...</span>');
    $btn.prop('disabled', true);

    $.ajax({
        url: `${API_BASE_URL}/courses`,
        method: 'POST',
        data: formData,
        processData: false, // Tell jQuery not to process the data
        contentType: false, // Tell jQuery not to set contentType
        success: function(response) {
            messageArea.removeClass().addClass('text-green-600 font-bold').text(response.message + ' Redirecting to dashboard...');
            $btn.prop('disabled', false).text('Create Course');
            
            setTimeout(() => {
                loadTutorDashboardView();
            }, 1000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.message : 'Course creation failed. Server error.';
            messageArea.removeClass().addClass('text-red-600 font-bold').text(`Error: ${error}`);
            $btn.prop('disabled', false).html('<i class="fas fa-save mr-2"></i>Create Course');
            
            // Re-attach handlers if needed (though they are attached on form submit)
            $('#asset-type').off('change').on('change', handleAssetTypeChange);
            $('#add-chapter-btn').off('click').on('click', handleAddChapter);
        }
    });
}


// --- 11. Global Event Handlers ---

function attachGlobalHandlers() {
    // Mobile Menu Toggle
    $('#menu-icon').off('click').on('click', () => {
        $('#mobile-menu').removeClass('-translate-y-full').addClass('translate-y-0');
        $('#menu-icon').addClass('hidden');
        $('#close-icon').removeClass('hidden');
    });

    $('#close-icon').off('click').on('click', hideMobileMenu);

    // Desktop/Mobile Navigation Delegation Setup
    const $desktopNav = $('#desktop-menu-links');
    const $mobileNav = $('#mobile-menu-links');

    // Home / Logo
    $('#nav-home, #mobile-nav-home').off('click').on('click', (e) => {
        e.preventDefault(); 
        const userType = getLoggedInUserType();
        if (userType === 'Tutor') loadTutorDashboardView();
        else if (userType === 'Student') loadStudentCourseCatalog();
        else loadLandingPageView();
        hideMobileMenu();
    });

    // Catalog
    $desktopNav.add($mobileNav).off('click', '#nav-course-catalog, #mobile-nav-course-catalog').on('click', '#nav-course-catalog, #mobile-nav-course-catalog', (e) => {
        e.preventDefault(); 
        loadStudentCourseCatalog(); 
        hideMobileMenu();
    });

    // My Courses
    $desktopNav.add($mobileNav).off('click', '#nav-my-courses, #mobile-nav-my-courses').on('click', '#nav-my-courses, #mobile-nav-my-courses', (e) => {
        e.preventDefault(); 
        loadStudentEnrolledCoursesView(); 
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
}

// --- 12. Landing Page Handlers (Attached only on initial load if logged out) ---
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
    
    $('#browse-catalog-landing').off('click').on('click', (e) => {
        e.preventDefault();
        loadStudentCourseCatalog();
    });
}

// --- 13. Initialization ---

$(document).ready(function() {
    // 1. Attach handlers for the fixed navigation links (always present)
    attachGlobalHandlers();
    
    // 2. Check for logged-in user on load
    const userType = getLoggedInUserType();
    const isLoggedIn = !!userType;
    
    // 3. Update nav links and load initial view
    updateNavVisibility(userType, isLoggedIn);
    
    if (isLoggedIn) {
        if (userType === 'Tutor') loadTutorDashboardView();
        else loadStudentCourseCatalog();
    } else {
        loadLandingPageView();
    }
});