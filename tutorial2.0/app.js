// app.js (Frontend Code with REAL API Calls - FINAL)

// --- 1. API Configuration ---
const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_ROOT = 'http://localhost:5000'; // Used for fetching local assets

// --- 2. Helper Functions for User Session ---

/** Fetches the logged-in user's MongoDB ID. */
function getLoggedInUserId() {
    const tutor = localStorage.getItem('loggedInTutor');
    const student = localStorage.getItem('loggedInStudent');

    // CRITICAL FIX: Assumes MongoDB ID is stored as '_id'
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
    // Clear content, update nav, and reload landing page
    clearContentArea();
    updateNavVisibility(null, false);
    loadLandingPageView();
}

// --- 3. UI Helper Functions ---

const $contentArea = $('#content-area');

/** Clears the main content area. */
function clearContentArea() {
    $contentArea.html('');
}

/** Hides the mobile menu. */
function hideMobileMenu() {
    $('#mobile-menu').removeClass('translate-y-0').addClass('-translate-y-full');
    $('#menu-path').attr('d', 'M4 6h16M4 12h16M4 18h16'); // Menu Icon
}

/** Constructs the full URL for a course asset. */
function getAssetUrl(asset) {
    if (asset.type === 'local') {
        return `${API_BASE_ROOT}/uploads/${asset.url}`;
    }
    return asset.url; // YouTube URL
}

/** Truncates text for display in course cards. */
function truncateText(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

/** Generates star HTML based on a rating value. */
function renderStarRating(rating) {
    const maxRating = 5;
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < maxRating; i++) {
        if (i < fullStars) {
            starsHtml += `<i class="fas fa-star text-yellow-500"></i>`;
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += `<i class="fas fa-star-half-alt text-yellow-500"></i>`;
        } else {
            starsHtml += `<i class="far fa-star text-gray-400"></i>`;
        }
    }
    return `<span class="text-sm font-semibold mr-1">${rating.toFixed(1)}</span>${starsHtml}`;
}

/** Updates the navigation links based on user status. */
function updateNavVisibility(userType, isLoggedIn) {
    const user = getLoggedInUser();

    // Reset all links visibility
    $('.nav-signed-out, .nav-student, .nav-tutor, #nav-user-name, #mobile-nav-user-name').addClass('hidden');
    $('.nav-signed-in').removeClass('hidden'); // Logout is always visible when logged in

    let desktopHtml = '';
    let mobileHtml = '';

    if (isLoggedIn) {
        // Display user name
        const userNameHtml = `<span class="text-white text-lg font-semibold">${user.name.split(' ')[0]}</span>`;
        $('#nav-user-name').html(userNameHtml).removeClass('hidden');
        $('#mobile-nav-user-name').html(userNameHtml).removeClass('hidden');

        if (userType === 'Tutor') {
            $('.nav-tutor').removeClass('hidden');
            // Desktop links for Tutor
            desktopHtml = `
                <a href="#" id="nav-tutor-dashboard" class="text-white hover:text-indigo-200 transition">Dashboard</a>
                <a href="#" id="nav-create-course" class="bg-white text-indigo-700 px-4 py-2 rounded-full font-semibold hover:bg-indigo-100 transition shadow-md">New Course</a>
                <a href="#" id="nav-sign-out" class="text-white hover:text-indigo-200 transition">Sign Out</a>
            `;
            // Mobile links for Tutor
            mobileHtml = `
                <a href="#" id="mobile-nav-tutor-dashboard" class="block py-2 px-4 text-white hover:bg-indigo-600">Dashboard</a>
                <a href="#" id="mobile-nav-create-course" class="block py-2 px-4 text-white hover:bg-indigo-600">New Course</a>
                <a href="#" id="mobile-nav-sign-out" class="block py-2 px-4 text-white hover:bg-indigo-600">Sign Out</a>
            `;
        } else { // Student
            $('.nav-student').removeClass('hidden');
            // Desktop links for Student
            desktopHtml = `
                <a href="#" id="nav-course-catalog" class="text-white hover:text-indigo-200 transition">Catalog</a>
                <a href="#" id="nav-my-courses" class="text-white hover:text-indigo-200 transition">My Courses</a>
                <a href="#" id="nav-sign-out" class="text-white hover:text-indigo-200 transition">Sign Out</a>
            `;
            // Mobile links for Student
            mobileHtml = `
                <a href="#" id="mobile-nav-course-catalog" class="block py-2 px-4 text-white hover:bg-indigo-600">Course Catalog</a>
                <a href="#" id="mobile-nav-my-courses" class="block py-2 px-4 text-white hover:bg-indigo-600">My Courses</a>
                <a href="#" id="mobile-nav-sign-out" class="block py-2 px-4 text-white hover:bg-indigo-600">Sign Out</a>
            `;
        }
    } else {
        // Signed out (Guest)
        $('.nav-signed-out').removeClass('hidden');
        // Desktop links for Guest
        desktopHtml = `
            <a href="#" id="nav-course-catalog" class="text-white hover:text-indigo-200 transition">Course Catalog</a>
            <a href="#" id="nav-student-auth" class="text-white hover:text-indigo-200 transition">Student Sign In/Up</a>
            <a href="#" id="nav-tutor-auth" class="bg-green-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-green-600 transition shadow-md">Tutor Sign In</a>
        `;
        // Mobile links for Guest
        mobileHtml = `
            <a href="#" id="mobile-nav-course-catalog" class="block py-2 px-4 text-white hover:bg-indigo-600">Course Catalog</a>
            <a href="#" id="mobile-nav-student-auth" class="block py-2 px-4 text-white hover:bg-indigo-600">Student Sign In/Up</a>
            <a href="#" id="mobile-nav-tutor-auth" class="block py-2 px-4 text-white hover:bg-indigo-600">Tutor Sign In</a>
        `;
    }

    // Update the HTML
    $('#desktop-menu-links').html(desktopHtml);
    $('#mobile-menu-links').html(mobileHtml);
}

// --- 4. View Rendering Functions ---

/** Loads the initial landing page from index.html (when signing out). */
function loadLandingPageView() {
    clearContentArea();
    // Re-insert the landing page content from a hidden div or fetch from index.html (assuming it's the default content)
    // Since index.html has the landing page content initially, we can just reload the page or use a hidden template.
    // For a smoother SPA experience, we assume the landing page structure is contained in the index.html content initially.
    // As the default, we will just reload the page to restore the initial state defined in index.html.
    // If we want to keep it a true SPA, we need a template in index.html to load here.
    location.reload(); 
}

/** Renders the student Sign In view. */
function loadStudentSignInView() {
    clearContentArea();
    const html = `
        <div class="max-w-md mx-auto my-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-500">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Student Sign In</h2>
            <form id="student-sign-in-form" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="student-email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="student-password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div id="student-sign-in-message" class="text-red-500 text-sm hidden"></div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign In
                </button>
            </form>
            <p class="mt-6 text-center text-sm text-gray-600">
                Don't have an account? 
                <a href="#" id="link-to-student-sign-up" class="font-medium text-indigo-600 hover:text-indigo-500">Sign Up here</a>
            </p>
        </div>
    `;
    $contentArea.html(html);

    // Attach local handlers
    $('#student-sign-in-form').on('submit', (e) => handleSignIn(e, 'student'));
    $('#link-to-student-sign-up').on('click', (e) => { e.preventDefault(); loadStudentSignUpView(); });
}

/** Renders the student Sign Up view. */
function loadStudentSignUpView() {
    clearContentArea();
    const html = `
        <div class="max-w-md mx-auto my-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-500">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Student Sign Up</h2>
            <form id="student-sign-up-form" class="space-y-6">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="student-name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="student-email-up" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="student-password-up" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div id="student-sign-up-message" class="text-red-500 text-sm hidden"></div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign Up
                </button>
            </form>
            <p class="mt-6 text-center text-sm text-gray-600">
                Already have an account? 
                <a href="#" id="link-to-student-sign-in" class="font-medium text-indigo-600 hover:text-indigo-500">Sign In here</a>
            </p>
        </div>
    `;
    $contentArea.html(html);

    // Attach local handlers
    $('#student-sign-up-form').on('submit', (e) => handleSignUp(e, 'student'));
    $('#link-to-student-sign-in').on('click', (e) => { e.preventDefault(); loadStudentSignInView(); });
}

/** Renders the tutor Sign In view. */
function loadTutorSignInView() {
    clearContentArea();
    const html = `
        <div class="max-w-md mx-auto my-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-green-500">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Tutor Sign In</h2>
            <form id="tutor-sign-in-form" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="tutor-email" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="tutor-password" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                </div>
                <div id="tutor-sign-in-message" class="text-red-500 text-sm hidden"></div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Sign In
                </button>
            </form>
            <p class="mt-6 text-center text-sm text-gray-600">
                Don't have an account? 
                <a href="#" id="link-to-tutor-sign-up" class="font-medium text-green-600 hover:text-green-500">Sign Up here</a>
            </p>
        </div>
    `;
    $contentArea.html(html);

    // Attach local handlers
    $('#tutor-sign-in-form').on('submit', (e) => handleSignIn(e, 'tutor'));
    $('#link-to-tutor-sign-up').on('click', (e) => { e.preventDefault(); loadTutorSignUpView(); });
}

/** Renders the tutor Sign Up view. */
function loadTutorSignUpView() {
    clearContentArea();
    const html = `
        <div class="max-w-md mx-auto my-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-green-500">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 text-center">Tutor Sign Up</h2>
            <form id="tutor-sign-up-form" class="space-y-6">
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="tutor-name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="tutor-email-up" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="tutor-password-up" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                </div>
                <div id="tutor-sign-up-message" class="text-red-500 text-sm hidden"></div>
                <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Sign Up
                </button>
            </form>
            <p class="mt-6 text-center text-sm text-gray-600">
                Already have an account? 
                <a href="#" id="link-to-tutor-sign-in" class="font-medium text-green-600 hover:text-green-500">Sign In here</a>
            </p>
        </div>
    `;
    $contentArea.html(html);

    // Attach local handlers
    $('#tutor-sign-up-form').on('submit', (e) => handleSignUp(e, 'tutor'));
    $('#link-to-tutor-sign-in').on('click', (e) => { e.preventDefault(); loadTutorSignInView(); });
}

/** Renders a single course card. */
function renderCourseCard(course) {
    const tutorName = course.tutorId ? course.tutorId.name : 'Unknown Tutor';
    return `
        <div data-course-id="${course._id}" class="course-card bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer border border-gray-200">
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-2">${course.title}</h3>
                <p class="text-sm text-indigo-600 font-semibold mb-3">Tutor: ${tutorName}</p>
                <p class="text-gray-600 text-sm mb-4 h-12 overflow-hidden">${truncateText(course.description, 80)}</p>
                <div class="flex items-center text-sm text-gray-600 mb-4">
                    <span class="mr-3">${renderStarRating(course.averageRating)}</span>
                    <span class="text-gray-500">(${course.totalReviews || 0} reviews)</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-indigo-700">Chapters: ${course.chapters.length}</span>
                    <button class="view-course-btn bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-600 transition" data-course-id="${course._id}">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

/** Fetches and renders the full course catalog for students/guests. */
function loadStudentCourseCatalog() {
    clearContentArea();
    $contentArea.html(`
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">Course Catalog</h2>
            <div id="course-list-area" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-gray-500 col-span-full">Loading courses...</p>
            </div>
        </div>
    `);

    $.get(`${API_BASE_URL}/courses`)
        .done(function (courses) {
            const $listArea = $('#course-list-area').empty();
            if (courses.length === 0) {
                $listArea.html('<p class="text-gray-500 col-span-full">No courses are available yet.</p>');
            } else {
                courses.forEach(course => {
                    $listArea.append(renderCourseCard(course));
                });
                // Attach event listeners to the dynamically generated buttons/cards
                $('.view-course-btn, .course-card').on('click', function() {
                    const courseId = $(this).data('course-id');
                    loadCourseDetailView(courseId);
                });
            }
        })
        .fail(function () {
            $('#course-list-area').html('<p class="text-red-500 col-span-full">Error fetching course catalog. Please try again later.</p>');
        });
}

/** Fetches and renders the student's enrolled courses. */
function loadStudentCoursesView() {
    const studentId = getLoggedInUserId();
    if (!studentId) {
        loadStudentSignInView();
        return;
    }

    clearContentArea();
    $contentArea.html(`
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-extrabold text-gray-900 mb-8 border-b pb-4">My Courses</h2>
            <div id="my-courses-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-gray-500 col-span-full">Loading your enrolled courses...</p>
            </div>
        </div>
    `);

    $.get(`${API_BASE_URL}/enrollments/${studentId}`)
        .done(function (enrollments) {
            const $listArea = $('#my-courses-list').empty();
            if (enrollments.length === 0) {
                $listArea.html(`
                    <p class="text-gray-500 col-span-full">You are not currently enrolled in any courses.</p>
                    <a href="#" id="link-to-catalog" class="text-indigo-600 hover:text-indigo-800 font-semibold col-span-full">Browse the Course Catalog</a>
                `);
                $('#link-to-catalog').on('click', (e) => { e.preventDefault(); loadStudentCourseCatalog(); });
            } else {
                enrollments.forEach(enrollment => {
                    const course = enrollment.courseId; // The course data is populated here
                    if (course) {
                        const tutorName = course.tutorId ? course.tutorId.name : 'Unknown Tutor';
                        const cardHtml = `
                            <div data-course-id="${course._id}" class="my-course-card bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden cursor-pointer border border-indigo-200">
                                <div class="p-6">
                                    <h3 class="text-xl font-bold text-gray-900 mb-2">${course.title}</h3>
                                    <p class="text-sm text-indigo-600 font-semibold mb-3">Tutor: ${tutorName}</p>
                                    <div class="flex justify-between items-center mb-4">
                                        <p class="text-sm text-gray-600">Progress: <span class="font-bold">${enrollment.progressPercentage}%</span></p>
                                        <div class="w-1/2 bg-gray-200 rounded-full h-2.5">
                                            <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${enrollment.progressPercentage}%"></div>
                                        </div>
                                    </div>
                                    <button class="view-course-btn bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition" data-course-id="${course._id}">
                                        Continue Course
                                    </button>
                                </div>
                            </div>
                        `;
                        $listArea.append(cardHtml);
                    }
                });

                $('.view-course-btn, .my-course-card').on('click', function() {
                    const courseId = $(this).data('course-id');
                    loadCourseDetailView(courseId);
                });
            }
        })
        .fail(function (xhr) {
            $('#my-courses-list').html(`<p class="text-red-500 col-span-full">Error fetching your courses: ${xhr.responseJSON.message || 'Server error'}</p>`);
        });
}


/** Fetches and renders the tutor's dashboard with their courses. */
function loadTutorDashboardView() {
    const tutorId = getLoggedInUserId();
    if (!tutorId) {
        loadTutorSignInView();
        return;
    }

    clearContentArea();
    const tutor = getLoggedInUser();
    $contentArea.html(`
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-extrabold text-gray-900 mb-2">Welcome, ${tutor.name} (Tutor Dashboard)</h2>
            <p class="text-lg text-gray-600 mb-8 border-b pb-4">Manage your published courses and student enrollment.</p>

            <div class="flex justify-end mb-6">
                 <button id="add-new-course-btn" class="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition shadow-md">
                    <i class="fas fa-plus mr-2"></i> Create New Course
                </button>
            </div>

            <h3 class="text-2xl font-bold text-gray-800 mb-4">Your Courses</h3>
            <div id="tutor-courses-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <p class="text-gray-500 col-span-full">Loading your courses...</p>
            </div>
        </div>
    `);

    // Attach handler for the 'Create New Course' button
    $('#add-new-course-btn').on('click', () => loadCourseCreationView());

    $.get(`${API_BASE_URL}/courses/tutor/${tutorId}`)
        .done(function (courses) {
            const $listArea = $('#tutor-courses-list').empty();
            if (courses.length === 0) {
                $listArea.html('<p class="text-gray-500 col-span-full">You have not published any courses yet.</p>');
            } else {
                courses.forEach(course => {
                    const cardHtml = `
                        <div class="bg-white rounded-xl shadow-lg border-t-4 border-green-500 p-6">
                            <h3 class="text-xl font-bold text-gray-900 mb-2">${course.title}</h3>
                            <p class="text-gray-600 text-sm mb-4">${truncateText(course.description, 80)}</p>
                            <div class="text-sm text-gray-700 mb-4 space-y-1">
                                <p><strong><i class="fas fa-video mr-2"></i>Chapters:</strong> ${course.chapters.length}</p>
                                <p><strong><i class="fas fa-users mr-2"></i>Enrollments:</strong> <span id="enrollment-count-${course._id}">${course.enrollmentCount || 0}</span></p>
                                <p><strong><i class="fas fa-star mr-2"></i>Rating:</strong> ${renderStarRating(course.averageRating)} (${course.totalReviews || 0})</p>
                            </div>
                            <div class="flex space-x-3 mt-4">
                                <button class="manage-course-btn bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-600 transition" data-course-id="${course._id}">
                                    Manage Course
                                </button>
                                <button class="delete-course-btn bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition" data-course-id="${course._id}">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `;
                    $listArea.append(cardHtml);
                });

                $('.manage-course-btn').on('click', function() {
                    const courseId = $(this).data('course-id');
                    loadTutorView(courseId); // Use loadTutorView for the full management view
                });
                $('.delete-course-btn').on('click', function() {
                    const courseId = $(this).data('course-id');
                    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                        handleCourseDeletion(courseId);
                    }
                });
            }
        })
        .fail(function (xhr) {
            $('#tutor-courses-list').html(`<p class="text-red-500 col-span-full">Error fetching your courses: ${xhr.responseJSON.message || 'Server error'}</p>`);
        });
}

/** Renders the form for a tutor to create a new course. */
function loadCourseCreationView() {
    clearContentArea();
    const html = `
        <div class="max-w-4xl mx-auto my-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-green-500">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Create New Course</h2>
            <form id="course-creation-form" class="space-y-6">
                <div class="border border-gray-200 p-4 rounded-lg">
                    <h4 class="text-xl font-semibold mb-3 text-gray-700">1. Course Details</h4>
                    <div>
                        <label for="course-title" class="block text-sm font-medium text-gray-700">Course Title</label>
                        <input type="text" id="course-title" name="title" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    </div>
                    <div>
                        <label for="course-description" class="block text-sm font-medium text-gray-700 mt-4">Description</label>
                        <textarea id="course-description" name="description" rows="4" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                </div>

                <div class="border border-gray-200 p-4 rounded-lg">
                    <h4 class="text-xl font-semibold mb-3 text-gray-700">2. Course Video Asset</h4>
                    <div class="flex space-x-4 mb-4">
                        <label class="inline-flex items-center">
                            <input type="radio" name="asset-type" value="local" checked class="form-radio text-green-600 h-4 w-4">
                            <span class="ml-2 text-gray-700">Local Video File (.mp4)</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="radio" name="asset-type" value="youtube" class="form-radio text-green-600 h-4 w-4">
                            <span class="ml-2 text-gray-700">YouTube Embed URL</span>
                        </label>
                    </div>
                    
                    <div id="local-upload-area">
                        <label for="course-video-file" class="block text-sm font-medium text-gray-700">Upload Video File</label>
                        <input type="file" id="course-video-file" name="videoFile" accept="video/mp4" class="mt-1 block w-full text-sm text-gray-500">
                        <p class="text-xs text-gray-500 mt-1">Maximum file size is typically limited by server configuration (e.g., 25MB).</p>
                    </div>

                    <div id="youtube-url-area" class="hidden">
                        <label for="youtube-url" class="block text-sm font-medium text-gray-700">YouTube Video URL</label>
                        <input type="text" id="youtube-url" name="youtubeUrl" placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    </div>
                </div>

                <div class="border border-gray-200 p-4 rounded-lg">
                    <h4 class="text-xl font-semibold mb-3 text-gray-700">3. Chapters / Outline</h4>
                    <div id="chapters-container" class="space-y-4">
                        <div class="chapter-item flex space-x-2 p-2 bg-gray-50 rounded-md border">
                            <span class="chapter-number font-bold text-gray-600 pt-2">1.</span>
                            <input type="text" placeholder="Chapter Title" class="chapter-title flex-grow px-3 py-2 border border-gray-300 rounded-md text-sm">
                            <button type="button" class="remove-chapter-btn bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-200" title="Remove Chapter" disabled>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" id="add-chapter-btn" class="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-600 transition">
                        <i class="fas fa-plus mr-1"></i> Add Chapter
                    </button>
                </div>

                <div id="course-creation-message" class="text-red-500 text-sm hidden"></div>
                <button type="submit" id="submit-course-btn" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Publish Course
                </button>
            </form>
        </div>
    `;
    $contentArea.html(html);

    // Initial Chapter button state
    $('.remove-chapter-btn').prop('disabled', $('#chapters-container .chapter-item').length <= 1);

    // Attach local handlers
    $('input[name="asset-type"]').on('change', function() {
        if ($(this).val() === 'local') {
            $('#local-upload-area').removeClass('hidden');
            $('#youtube-url-area').addClass('hidden');
        } else {
            $('#local-upload-area').addClass('hidden');
            $('#youtube-url-area').removeClass('hidden');
        }
    });

    $('#add-chapter-btn').on('click', handleChapterAdd);
    $('#chapters-container').on('click', '.remove-chapter-btn', handleChapterRemove);

    $('#course-creation-form').on('submit', handleCourseCreation);

    // Run once to fix chapter numbers
    updateChapterNumbers();
}


/** Loads the detailed view for a single course (used by both Students/Guests and Tutors). */
function loadCourseDetailView(courseId) {
    clearContentArea();
    $contentArea.html('<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8"><p class="text-gray-500">Loading course details...</p></div>');

    const loggedInUserType = getLoggedInUserType();
    const loggedInUserId = getLoggedInUserId();

    // 1. Fetch Course Details, Tutor, and Enrollment Status (if student/tutor)
    const courseUrl = `${API_BASE_URL}/courses/${courseId}`;
    const enrollmentUrl = loggedInUserId && loggedInUserType === 'Student' ? `${API_BASE_URL}/enrollments/${loggedInUserId}/${courseId}` : null;
    const commentsUrl = `${API_BASE_URL}/comments/${courseId}`;

    const fetchPromises = [
        $.get(courseUrl),
        enrollmentUrl ? $.get(enrollmentUrl).fail(function(xhr) { if (xhr.status !== 404) console.error("Error fetching enrollment:", xhr); return null; }) : $.Deferred().resolve(null),
        $.get(commentsUrl),
    ];

    $.when(...fetchPromises)
        .done(function (courseResponse, enrollmentResponse, commentsResponse) {
            const course = courseResponse[0] || courseResponse;
            const enrollment = enrollmentResponse ? (enrollmentResponse[0] || enrollmentResponse) : null;
            const comments = commentsResponse[0] || commentsResponse;

            // Determine access level
            const isTutor = loggedInUserType === 'Tutor' && course.tutorId._id === loggedInUserId;
            const isStudent = loggedInUserType === 'Student';
            const isEnrolled = !!enrollment;

            renderCourseDetail(course, isEnrolled, isTutor, isStudent, comments);
            setupPlayerHandlers(course, isEnrolled || isTutor);

        })
        .fail(function (xhr, status, error) {
            $contentArea.html(`<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h2 class="text-3xl font-bold text-red-600 mb-4">Error</h2>
                <p class="text-gray-600">Could not load course details: ${xhr.responseJSON?.message || error}.</p>
            </div>`);
        });
}


/** Renders the Tutor's management view for a specific course. */
function loadTutorView(courseId) {
    // This function will re-use the loadCourseDetailView logic but ensure the tutor controls are visible.
    // Since loadCourseDetailView handles the tutor check (isTutor), we can simply call it.
    loadCourseDetailView(courseId);
    // Note: If you had dedicated Tutor-only forms (e.g., chapter editing), you would add them here.
}


/** Builds the main course detail HTML. */
function renderCourseDetail(course, isEnrolled, isTutor, isStudent, comments) {
    const courseAssetUrl = getAssetUrl(course.asset);
    const tutorName = course.tutorId ? course.tutorId.name : 'Unknown Tutor';
    const canAccessVideo = isEnrolled || isTutor;

    let playerHtml = '';
    let playerWarning = '';

    // A. Player Logic
    if (canAccessVideo) {
        if (course.asset.type === 'youtube') {
            playerHtml = `
                <div class="aspect-w-16 aspect-h-9">
                    <iframe id="course-video-player" width="100%" height="auto" 
                        src="${courseAssetUrl}"
                        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
                    </iframe>
                </div>
            `;
        } else { // local file
            playerHtml = `
                <video id="course-video-player" width="100%" controls class="rounded-lg shadow-xl">
                    <source src="${courseAssetUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }
    } else {
        playerWarning = `
            <div class="p-8 bg-gray-100 rounded-lg text-center">
                <i class="fas fa-lock text-4xl text-indigo-500 mb-4"></i>
                <p class="text-lg font-semibold text-gray-700">Video content is for enrolled students only.</p>
                ${isStudent ? '' : '<p class="text-sm text-gray-500">Please sign in as a student to enroll.</p>'}
            </div>
        `;
    }

    // B. Action Button Logic
    let actionButtonHtml = '';
    if (isTutor) {
        actionButtonHtml = `
            <div class="space-y-3">
                <button id="tutor-edit-course-btn" class="w-full bg-green-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition shadow-md">
                    <i class="fas fa-edit mr-2"></i> Manage/Edit Course
                </button>
                <button id="tutor-delete-course-btn" class="w-full bg-red-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition shadow-md">
                    <i class="fas fa-trash-alt mr-2"></i> Delete Course
                </button>
            </div>
        `;
    } else if (isStudent && !isEnrolled) {
        actionButtonHtml = `
            <button id="enroll-course-btn" class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition shadow-md" data-course-id="${course._id}">
                <i class="fas fa-hand-pointer mr-2"></i> Enroll Now (Free)
            </button>
        `;
    } else if (isStudent && isEnrolled) {
        actionButtonHtml = `
            <div class="p-3 bg-indigo-50 rounded-lg text-center">
                <i class="fas fa-check-circle text-indigo-600 mr-2"></i> 
                <span class="font-semibold text-indigo-700">You are Enrolled!</span>
                <p class="text-sm text-gray-500 mt-1">Start watching the video and track your progress.</p>
            </div>
        `;
    } else {
        actionButtonHtml = `
            <div class="p-3 bg-gray-100 rounded-lg text-center">
                <p class="font-semibold text-gray-700">Sign in as a Student to Enroll</p>
            </div>
        `;
    }

    // C. Chapters List
    const chaptersHtml = course.chapters.map((chapter, index) => `
        <li class="p-3 border-b border-gray-100 last:border-b-0">
            <a href="#" class="chapter-link block hover:bg-indigo-50 rounded-md p-2 transition" data-chapter-index="${index}" data-timestamp="${chapter.timestamp || '0:00'}">
                <span class="font-bold text-indigo-700 mr-2">${index + 1}.</span>
                <span class="text-gray-900">${chapter.title}</span>
                <span class="text-sm text-gray-500 float-right">${chapter.timestamp || ''}</span>
            </a>
        </li>
    `).join('');

    // D. Comments List
    let commentsListHtml = '';
    if (comments && comments.length > 0) {
        commentsListHtml = comments.map(comment => {
            const reviewerName = comment.studentId ? comment.studentId.name : 'Anonymous Student';
            const deleteButton = (isTutor && loggedInUserType === 'Tutor') ? 
                `<button class="delete-comment-btn text-red-500 hover:text-red-700 text-sm ml-4" data-comment-id="${comment._id}" title="Delete Comment"><i class="fas fa-times-circle"></i></button>` : '';

            return `
                <div class="p-4 border-b last:border-b-0 bg-gray-50 rounded-md mb-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-semibold text-gray-800">${reviewerName}</span>
                        <span class="text-xs text-gray-500">${new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="text-sm mb-2">${renderStarRating(comment.rating)}</div>
                    <p class="text-gray-700">${comment.text}</p>
                    ${deleteButton}
                </div>
            `;
        }).join('');
    } else {
        commentsListHtml = '<p class="text-gray-500 italic">No reviews or comments yet. Be the first!</p>';
    }
    
    // E. Comment Submission Form
    let commentFormHtml = '';
    if (isStudent && isEnrolled) {
        commentFormHtml = `
            <div class="mt-8 border-t pt-4">
                <h4 class="text-xl font-bold mb-4 text-gray-800">Leave a Review</h4>
                <form id="comment-submission-form" data-course-id="${course._id}">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                        <div id="rating-stars" class="flex space-x-1 text-2xl cursor-pointer">
                            <i class="far fa-star text-yellow-500 hover:text-yellow-600" data-rating="1"></i>
                            <i class="far fa-star text-yellow-500 hover:text-yellow-600" data-rating="2"></i>
                            <i class="far fa-star text-yellow-500 hover:text-yellow-600" data-rating="3"></i>
                            <i class="far fa-star text-yellow-500 hover:text-yellow-600" data-rating="4"></i>
                            <i class="far fa-star text-yellow-500 hover:text-yellow-600" data-rating="5"></i>
                        </div>
                        <input type="hidden" id="comment-rating" name="rating" value="0" required>
                    </div>
                    <div class="mb-4">
                        <label for="comment-text" class="block text-sm font-medium text-gray-700">Your Comment</label>
                        <textarea id="comment-text" name="text" rows="3" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                    <div id="comment-message" class="text-red-500 text-sm hidden mb-4"></div>
                    <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">
                        Submit Review
                    </button>
                </form>
            </div>
        `;
    } else if (isStudent && !isEnrolled) {
        commentFormHtml = `
            <div class="mt-8 p-4 bg-gray-100 rounded-lg text-center">
                <p class="text-gray-600">You must be enrolled in this course to leave a review.</p>
            </div>
        `;
    }


    // F. Final HTML Assembly
    const finalHtml = `
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div class="lg:grid lg:grid-cols-3 lg:gap-10">
                
                <div class="lg:col-span-2 space-y-8">
                    <h1 class="text-4xl font-extrabold text-gray-900">${course.title}</h1>
                    <p class="text-lg text-indigo-600 font-semibold mb-6">Tutor: ${tutorName}</p>

                    <div class="video-player-area">
                        ${playerWarning || playerHtml}
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-lg border">
                        <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Course Chapters (${course.chapters.length})</h3>
                        <ul id="chapter-list-nav" class="divide-y divide-gray-100">
                            ${chaptersHtml}
                        </ul>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-lg border">
                        <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Course Description</h3>
                        <p class="text-gray-700 whitespace-pre-wrap">${course.description}</p>
                    </div>

                </div>

                <div class="lg:col-span-1 space-y-8 mt-10 lg:mt-0">
                    
                    <div class="bg-white p-6 rounded-xl shadow-2xl border-t-4 ${isTutor ? 'border-green-500' : 'border-indigo-500'}">
                        <p class="text-sm font-semibold text-gray-500 mb-2">Course Status</p>
                        <div class="text-3xl font-bold text-gray-900 mb-4">
                            <span class="text-indigo-600">${course.enrollmentCount || 0}</span> Enrolled
                        </div>
                        <div class="flex items-center text-sm text-gray-600 mb-6">
                            ${renderStarRating(course.averageRating)}
                            <span class="ml-2 text-gray-500">(${course.totalReviews || 0} reviews)</span>
                        </div>
                        ${actionButtonHtml}
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-lg border">
                        <h3 class="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Student Reviews</h3>
                        <div id="comments-list-area">
                            ${commentsListHtml}
                        </div>
                        ${commentFormHtml}
                    </div>
                </div>
            </div>
        </div>
    `;

    $contentArea.html(finalHtml);
    
    // Attach general handlers for course detail
    $('#enroll-course-btn').on('click', (e) => handleEnrollment(e, course._id));
    $('#comment-submission-form').on('submit', handleCommentSubmission);
    $('#tutor-delete-course-btn').on('click', () => {
        if (confirm('Are you absolutely sure you want to delete this course and all associated enrollments/comments?')) {
            handleCourseDeletion(course._id);
        }
    });
    // Re-call detail view for edit/manage button to simply refresh (or point to creation form later)
    $('#tutor-edit-course-btn').on('click', () => loadTutorDashboardView()); 
    $('#comments-list-area').on('click', '.delete-comment-btn', function() {
        const commentId = $(this).data('comment-id');
        if (confirm('Are you sure you want to delete this comment?')) {
            handleCommentDeletion(commentId, course._id);
        }
    });

    // Star rating handler
    $('#rating-stars i').on('mouseover', function() {
        const rating = $(this).data('rating');
        $('#rating-stars i').each(function(index) {
            const $star = $(this);
            if (index < rating) {
                $star.removeClass('far').addClass('fas');
            } else {
                $star.removeClass('fas').addClass('far');
            }
        });
    }).on('click', function() {
        const rating = $(this).data('rating');
        $('#comment-rating').val(rating);
        // Persist the clicked rating
        $('#rating-stars i').removeClass('fas far').addClass('far');
        $('#rating-stars i').slice(0, rating).removeClass('far').addClass('fas');
    }).on('mouseout', function() {
        // Reset to selected rating
        const selectedRating = parseInt($('#comment-rating').val());
        $('#rating-stars i').removeClass('fas far').addClass('far');
        $('#rating-stars i').slice(0, selectedRating).removeClass('far').addClass('fas');
    });
}

/** Sets up video player and chapter navigation handlers. */
function setupPlayerHandlers(course, isEnabled) {
    if (!isEnabled) return; // Only set up if enrolled or tutor

    const videoPlayer = document.getElementById('course-video-player');
    
    // Convert a timestamp string (e.g., "1:35") into seconds
    function timestampToSeconds(timestamp) {
        if (!timestamp) return 0;
        const parts = timestamp.split(':').map(Number).reverse(); // [S, M, H]
        let seconds = 0;
        if (parts.length >= 1) seconds += parts[0]; // Seconds
        if (parts.length >= 2) seconds += parts[1] * 60; // Minutes
        if (parts.length >= 3) seconds += parts[2] * 3600; // Hours
        return seconds;
    }

    // Attach click handler to all chapter links using delegation
    $('#chapter-list-nav').on('click', '.chapter-link', function(e) {
        e.preventDefault();
        
        const timestamp = $(this).data('timestamp');
        const seekTime = timestampToSeconds(timestamp);
        
        if (videoPlayer) {
            videoPlayer.currentTime = seekTime;
            if (videoPlayer.paused) {
                videoPlayer.play(); // Auto-play after seeking
            }
        }
        
        // Optional: Highlight the active chapter link
        $('#chapter-list-nav .chapter-link').removeClass('bg-indigo-100');
        $(this).addClass('bg-indigo-100');
    });
}


// --- 5. Course Management Helpers (Chapter Management) ---

/** Helper to ensure chapter numbers are correct. */
function updateChapterNumbers() {
    $('#chapters-container .chapter-item').each(function(index) {
        $(this).find('.chapter-number').text(`${index + 1}.`);
        // Enable removal for all chapters except the first one
        $(this).find('.remove-chapter-btn').prop('disabled', index === 0);
    });
}

/** Adds a new chapter field to the course creation form. */
function handleChapterAdd() {
    const chapterCount = $('#chapters-container .chapter-item').length;
    const newChapterHtml = `
        <div class="chapter-item flex space-x-2 p-2 bg-gray-50 rounded-md border">
            <span class="chapter-number font-bold text-gray-600 pt-2">${chapterCount + 1}.</span>
            <input type="text" placeholder="Chapter Title" class="chapter-title flex-grow px-3 py-2 border border-gray-300 rounded-md text-sm" required>
            <input type="text" placeholder="Timestamp (e.g., 0:00)" class="chapter-timestamp flex-grow-0 w-32 px-3 py-2 border border-gray-300 rounded-md text-sm" value="0:00">
            <button type="button" class="remove-chapter-btn bg-red-100 text-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-200" title="Remove Chapter">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    $('#chapters-container').append(newChapterHtml);
    updateChapterNumbers();
}

/** Removes a chapter field from the course creation form. */
function handleChapterRemove(e) {
    e.preventDefault();
    $(this).closest('.chapter-item').remove();
    updateChapterNumbers();
}

// --- 6. Form Submission Handlers (Sign In/Up) ---

/** Handles the sign-in process for both students and tutors. */
function handleSignIn(e, role) {
    e.preventDefault();
    const email = $(`#${role}-email`).val();
    const password = $(`#${role}-password`).val();
    const $message = $(`#${role}-sign-in-message`);

    $message.hide().text('');

    $.ajax({
        url: `${API_BASE_URL}/users/signin`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email, password, role }),
        success: function(user) {
            // Store user data in localStorage
            localStorage.setItem(`loggedIn${role.charAt(0).toUpperCase() + role.slice(1)}`, JSON.stringify(user));
            
            // Redirect to appropriate dashboard/view
            clearContentArea();
            updateNavVisibility(role.charAt(0).toUpperCase() + role.slice(1), true);

            if (role === 'tutor') {
                loadTutorDashboardView();
            } else {
                loadStudentCoursesView();
            }
        },
        error: function(xhr) {
            const message = xhr.responseJSON ? xhr.responseJSON.message : 'An unknown sign-in error occurred.';
            $message.text(message).show();
        }
    });
}

/** Handles the sign-up process for both students and tutors. */
function handleSignUp(e, role) {
    e.preventDefault();
    const name = $(`#${role}-name`).val();
    const email = $(`#${role}-email-up`).val();
    const password = $(`#${role}-password-up`).val();
    const $message = $(`#${role}-sign-up-message`);

    $message.hide().text('');

    $.ajax({
        url: `${API_BASE_URL}/users/signup`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name, email, password, role }),
        success: function(user) {
            // Sign-up successful, now automatically sign them in
            localStorage.setItem(`loggedIn${role.charAt(0).toUpperCase() + role.slice(1)}`, JSON.stringify(user));
            
            // Redirect to appropriate dashboard/view
            clearContentArea();
            updateNavVisibility(role.charAt(0).toUpperCase() + role.slice(1), true);

            if (role === 'tutor') {
                loadTutorDashboardView();
            } else {
                loadStudentCoursesView();
            }
        },
        error: function(xhr) {
            const message = xhr.responseJSON ? xhr.responseJSON.message : 'An unknown sign-up error occurred.';
            $message.text(message).show();
        }
    });
}

// --- 7. Course API Handlers ---

/** Handles the submission of the new course form. */
function handleCourseCreation(e) {
    e.preventDefault();

    const tutorId = getLoggedInUserId();
    if (!tutorId) {
        alert('You must be signed in as a Tutor to create a course.');
        loadTutorSignInView();
        return;
    }

    const $form = $('#course-creation-form');
    const $message = $('#course-creation-message');
    $message.hide().text('');
    $('#submit-course-btn').prop('disabled', true).text('Publishing...');

    const title = $('#course-title').val();
    const description = $('#course-description').val();
    const assetType = $('input[name="asset-type"]:checked').val();
    const videoFile = $('#course-video-file')[0].files[0];
    const youtubeUrl = $('#youtube-url').val();
    
    // 1. Collect Chapters
    const chapters = [];
    let isValidChapters = true;
    $('#chapters-container .chapter-item').each(function() {
        const title = $(this).find('.chapter-title').val().trim();
        const timestamp = $(this).find('.chapter-timestamp').val().trim() || '0:00'; // Default to 0:00
        if (title) {
            chapters.push({ title, timestamp });
        } else {
            isValidChapters = false;
        }
    });

    if (!isValidChapters) {
        $message.text('All chapters must have a title.').show();
        $('#submit-course-btn').prop('disabled', false).text('Publish Course');
        return;
    }


    // 2. Prepare FormData (for file uploads) or JSON (for YouTube URL)
    let postData;
    let url = `${API_BASE_URL}/courses`;
    let contentType = 'application/json'; // Default for JSON, or false for FormData

    if (assetType === 'local') {
        if (!videoFile) {
            $message.text('Please select a video file or choose YouTube URL.').show();
            $('#submit-course-btn').prop('disabled', false).text('Publish Course');
            return;
        }

        postData = new FormData();
        postData.append('tutorId', tutorId);
        postData.append('title', title);
        postData.append('description', description);
        postData.append('assetType', 'local');
        postData.append('videoFile', videoFile);
        postData.append('chapters', JSON.stringify(chapters)); // Send chapters as a JSON string

        contentType = false; // Important for file upload with FormData
    } else { // youtube
        if (!youtubeUrl) {
            $message.text('Please enter a YouTube URL.').show();
            $('#submit-course-btn').prop('disabled', false).text('Publish Course');
            return;
        }
        
        // Extract the YouTube ID (a common requirement for embeds)
        // A simple pattern for watch?v=ID or youtu.be/ID
        const youtubeIdMatch = youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/i);
        const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : null;

        if (!youtubeId) {
             $message.text('Invalid YouTube URL format. Please ensure it contains the video ID.').show();
             $('#submit-course-btn').prop('disabled', false).text('Publish Course');
             return;
        }
        
        // Construct the embed URL
        const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;

        postData = JSON.stringify({
            tutorId,
            title,
            description,
            asset: { type: 'youtube', url: embedUrl },
            chapters
        });
        contentType = 'application/json';
    }


    // 3. Send AJAX request
    $.ajax({
        url: url,
        method: 'POST',
        data: postData,
        contentType: contentType,
        processData: contentType === false ? false : undefined, // Important for FormData
        success: function(response) {
            alert('Course published successfully!');
            // Redirect to the new course's management view
            loadTutorView(response.course._id); 
        },
        error: function(xhr) {
            const message = xhr.responseJSON ? xhr.responseJSON.message : 'Server error: Could not publish course.';
            $message.text(message).show();
            $('#submit-course-btn').prop('disabled', false).text('Publish Course');
        }
    });
}

/** Handles the deletion of a course by a tutor. */
function handleCourseDeletion(courseId) {
    $.ajax({
        url: `${API_BASE_URL}/courses/${courseId}`,
        method: 'DELETE',
        success: function(response) {
            alert(response.message);
            loadTutorDashboardView();
        },
        error: function(xhr) {
            alert(`Error deleting course: ${xhr.responseJSON?.message || 'Server error'}`);
        }
    });
}

// --- 8. Student/Course Interaction Handlers ---

/** Handles a student enrolling in a course. */
function handleEnrollment(e, courseId) {
    e.preventDefault();
    const studentId = getLoggedInUserId();
    const $button = $('#enroll-course-btn');
    
    if (!studentId) {
        alert('Please sign in as a student to enroll.');
        loadStudentSignInView();
        return;
    }

    $button.prop('disabled', true).text('Enrolling...');

    $.ajax({
        url: `${API_BASE_URL}/enrollments`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ studentId, courseId }),
        success: function(response) {
            alert(`Successfully enrolled in: ${response.courseTitle}!`);
            // Reload the course detail view to show the 'Enrolled' status and player
            loadCourseDetailView(courseId); 
        },
        error: function(xhr) {
            const message = xhr.responseJSON ? xhr.responseJSON.message : 'An unknown enrollment error occurred.';
            alert(`Enrollment failed: ${message}`);
            $button.prop('disabled', false).text('Enroll Now (Free)');
        }
    });
}

/** Handles the submission of a comment/review. */
function handleCommentSubmission(e) {
    e.preventDefault();
    
    const courseId = $(this).data('course-id');
    const studentId = getLoggedInUserId();
    const text = $('#comment-text').val();
    const rating = parseInt($('#comment-rating').val());
    const $message = $('#comment-message');
    const $submitBtn = $(this).find('button[type="submit"]');

    if (!studentId) {
        $message.text('You must be logged in to leave a review.').show();
        return;
    }
    if (rating === 0) {
        $message.text('Please select a star rating.').show();
        return;
    }
    if (!text.trim()) {
        $message.text('Please enter a comment.').show();
        return;
    }

    $message.hide().text('');
    $submitBtn.prop('disabled', true).text('Submitting...');

    $.ajax({
        url: `${API_BASE_URL}/comments`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ courseId, studentId, text, rating }),
        success: function(response) {
            alert('Review submitted successfully!');
            // Reload the course detail view to update the comments list and rating
            loadCourseDetailView(courseId); 
        },
        error: function(xhr) {
            const message = xhr.responseJSON ? xhr.responseJSON.message : 'An unknown error occurred.';
            $message.text(`Submission failed: ${message}`).show();
            $submitBtn.prop('disabled', false).text('Submit Review');
        }
    });
}

/** Handles the deletion of a comment by a tutor. */
function handleCommentDeletion(commentId, courseId) {
    const $commentsList = $('#comments-list-area');

    $.ajax({
        url: `${API_BASE_URL}/comments/${commentId}`,
        method: 'DELETE',
        success: function(response) {
            alert(response.message);
            // Reload the course detail view to refresh the comments list and average rating
            loadCourseDetailView(courseId); 
        },
        error: function(xhr) {
            alert(`Error deleting comment: ${xhr.responseJSON?.message || 'Server error'}`);
        }
    });
}


// --- 9. Document Ready (Initialization) ---
$(document).ready(function () {

    // 1. Initial State Check
    const userType = getLoggedInUserType();
    const isLoggedIn = !!userType;

    // 2. Load Navigation and Initial View
    updateNavVisibility(userType, isLoggedIn);

    // 3. Decide which view to load
    if (isLoggedIn) {
        clearContentArea(); 
        if (userType === 'Tutor') loadTutorDashboardView();
        else loadStudentCoursesView();
    } else {
        // If logged out: The landing page is already in index.html, just attach handlers
        attachLandingPageHandlers();
        // If the initial content area is empty (which happens if it was cleared before), 
        // load the course catalog as a fallback for guest users.
        if ($contentArea.children().length === 0) {
            loadStudentCourseCatalog();
        }
    }

    // --- 4. Global Link Handlers (Attached once) ---

    // Mobile menu toggle
    $('#mobile-menu-toggle').on('click', function () {
        $('#mobile-menu').toggleClass('-translate-y-full translate-y-0');
        const $iconPath = $('#menu-path');
        if ($('#mobile-menu').hasClass('translate-y-0')) {
             $iconPath.attr('d', 'M6 18L18 6M6 6l12 12'); // Close Icon
        } else {
             $iconPath.attr('d', 'M4 6h16M4 12h16M4 18h16'); // Menu Icon
        }
    });

    // Home link handler
    $('#home-nav-link').off('click').on('click', (e) => { 
        e.preventDefault();
        const loggedInUserType = getLoggedInUserType();
        if (loggedInUserType === 'Tutor') loadTutorDashboardView();
        else if (loggedInUserType === 'Student') loadStudentCoursesView();
        else loadLandingPageView(); 
    });

    // --- Dynamic Nav Link Handlers (Delegation and Specific Calls) ---
    // These need to be attached after updateNavVisibility runs, 
    // but we use off().on() to prevent multiple bindings if updateNavVisibility is called multiple times.
    
    // Student Sign Up/In
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-student-auth, #mobile-nav-student-auth').on('click', '#nav-student-auth, #mobile-nav-student-auth', (e) => { 
        e.preventDefault(); 
        clearContentArea(); 
        loadStudentSignInView(); 
        hideMobileMenu();
    });

    // Tutor Sign Up/In
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-tutor-auth, #mobile-nav-tutor-auth').on('click', '#nav-tutor-auth, #mobile-nav-tutor-auth', (e) => { 
        e.preventDefault(); 
        clearContentArea(); 
        loadTutorSignInView(); 
        hideMobileMenu();
    });

    // Course Catalog
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-course-catalog, #mobile-nav-course-catalog').on('click', '#nav-course-catalog, #mobile-nav-course-catalog', (e) => { 
        e.preventDefault(); 
        loadStudentCourseCatalog(); 
        hideMobileMenu();
    });
    
    // Student My Courses
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-my-courses, #mobile-nav-my-courses').on('click', '#nav-my-courses, #mobile-nav-my-courses', (e) => { 
        e.preventDefault(); 
        loadStudentCoursesView(); 
        hideMobileMenu();
    });

    // Tutor Dashboard
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-tutor-dashboard, #mobile-nav-tutor-dashboard').on('click', '#nav-tutor-dashboard, #mobile-nav-tutor-dashboard', (e) => { 
        e.preventDefault(); 
        loadTutorDashboardView(); 
        hideMobileMenu();
    });

    // Tutor Create Course
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-create-course, #mobile-nav-create-course').on('click', '#nav-create-course, #mobile-nav-create-course', (e) => { 
        e.preventDefault(); 
        loadCourseCreationView(); 
        hideMobileMenu();
    });

    // Sign Out
    $('#desktop-menu-links, #mobile-menu-links').off('click', '#nav-sign-out, #mobile-nav-sign-out').on('click', '#nav-sign-out, #mobile-nav-sign-out', handleSignOut);
});

// --- 10. Landing Page Handlers (Attached only on initial load if logged out) ---
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