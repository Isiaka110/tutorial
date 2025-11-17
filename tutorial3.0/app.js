// app.js (Fixed Scoping & Separate Views)

// Import the initializer for tutor-specific handlers
import { initTutorDashboardHandlers } from './tutor.js';

// ===============================================
// GLOBAL STATE & UTILITIES
// ===============================================

let userState = {
    isLoggedIn: false,
    userId: null,
    userName: null,
    userRole: null // 'Tutor' or 'Student'
};

/**
 * Helper function to handle API fetch requests. (EXPORTED to fix tutor.js error)
 */
export async function apiFetch(url, options = {}) { 
    try {
        const response = await fetch(url, options);
        // Check for content type to avoid errors when the response body is empty (e.g., Logout)
        const contentType = response.headers.get('content-type');
        const data = (contentType && contentType.includes('application/json')) ? await response.json() : {};
        
        if (!response.ok) {
            throw new Error(data.message || `API call failed with status: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

/**
 * Function to display messages (EXPORTED to fix tutor.js error)
 * @param {string|jQuery} container - Selector or element to display message in.
 * @param {string} message - The message content.
 * @param {boolean} [isError=false] - True for error message styling.
 */
export function displayMessage(container, message, isError = false) { 
    const containerElement = typeof container === 'string' ? $(container) : container;
    containerElement.html(`<div class="p-3 my-2 rounded-lg text-sm font-medium ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">${message}</div>`);
}

// ===============================================
// AUTHENTICATION AND NAVIGATION (UX IMPROVEMENT)
// ===============================================

function updateNavVisibility(role, isLoggedIn) {
    // Hide all role-specific and logged-in links initially
    $('.nav-tutor, .nav-student, .nav-logged-in').addClass('hidden');
    // Show authentication links by default
    $('.nav-auth').removeClass('hidden');

    if (isLoggedIn) {
        // Hide authentication links
        $('.nav-auth').addClass('hidden');
        // Show logged-in links and logout button
        $('.nav-logged-in').removeClass('hidden');
        
        if (role === 'Tutor') {
            $('.nav-tutor').removeClass('hidden');
            $('#user-display, #mobile-user-display').text(`Tutor: ${userState.userName}`).removeClass('hidden');
        } else if (role === 'Student') {
            $('.nav-student').removeClass('hidden');
            $('#user-display, #mobile-user-display').text(`Student: ${userState.userName}`).removeClass('hidden');
        }
    } else {
        // When logged out, clear and hide user info
        $('#user-display, #mobile-user-display').addClass('hidden').empty();
    }
}

async function checkSessionStatus() {
    try {
        const data = await apiFetch('/api/session'); 
        
        if (data.isLoggedIn) {
            userState.isLoggedIn = true;
            userState.userId = data.userId;
            userState.userName = data.userName;
            userState.userRole = data.userRole;
            updateNavVisibility(userState.userRole, true);
            
            // UX improvement: Redirect to dashboard if logged in and on an auth page
            const currentHash = window.location.hash.substring(1);
            if (!currentHash || currentHash === 'home' || currentHash.includes('sign')) {
                 if (userState.userRole === 'Tutor') {
                    loadTutorDashboardView(); 
                } else if (userState.userRole === 'Student') {
                    loadStudentDashboardView();
                }
            } else {
                router(); // Proceed to intended hash
            }
        } else {
            // Not logged in
            userState = { isLoggedIn: false, userId: null, userName: null, userRole: null };
            updateNavVisibility(null, false);
            // Fallback to home if no hash, otherwise router handles it (e.g., #catalog is allowed when logged out)
            if (!window.location.hash || window.location.hash === '#home') {
                loadHomeView();
            } else {
                router(); 
            }
        }
    } catch (error) {
        // Handle session error as logged out
        userState = { isLoggedIn: false, userId: null, userName: null, userRole: null };
        updateNavVisibility(null, false);
        window.location.hash ? router() : loadHomeView();
    }
}

// ===============================================
// VIEW LOADING FUNCTIONS
// ===============================================

function loadHomeView() { 
    window.location.hash = 'home';
    $('#content').html('<div id="welcome-view" class="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center"><h1 class="text-6xl font-extrabold text-gray-900 mb-4">Welcome to TutorHub</h1><p class="text-xl text-gray-600 mb-8">Your platform for learning and teaching.</p><a href="#catalog" id="view-tutorials" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Explore Courses</a></div>');
}

// --- Auth Views ---
function loadTutorSignInView() {
    if (userState.isLoggedIn) return userState.userRole === 'Tutor' ? loadTutorDashboardView() : loadHomeView();
    window.location.hash = 'tutor-sign-in';
    // renderSignInForm comes from views.js
    $('#content').html(renderSignInForm('Tutor')); 
}
function loadTutorSignUpView() {
    if (userState.isLoggedIn) return userState.userRole === 'Tutor' ? loadTutorDashboardView() : loadHomeView();
    window.location.hash = 'tutor-sign-up';
    // renderSignUpForm comes from views.js
    $('#content').html(renderSignUpForm('Tutor'));
}
function loadStudentSignInView() {
    if (userState.isLoggedIn) return userState.userRole === 'Student' ? loadStudentDashboardView() : loadHomeView();
    window.location.hash = 'student-sign-in';
    // renderSignInForm comes from views.js
    $('#content').html(renderSignInForm('Student'));
}
function loadStudentSignUpView() {
    if (userState.isLoggedIn) return userState.userRole === 'Student' ? loadStudentDashboardView() : loadHomeView();
    window.location.hash = 'student-sign-up';
    // renderSignUpForm comes from views.js
    $('#content').html(renderSignUpForm('Student'));
}

// --- Dashboard Views ---
function loadTutorDashboardView() {
    if (userState.userRole !== 'Tutor' || !userState.isLoggedIn) return loadHomeView();
    window.location.hash = 'tutor-dashboard';
    // renderTutorDashboard comes from views.js
    $('#content').html(renderTutorDashboard(userState.userName));
    
    // Delegate the heavy lifting to the new tutor.js module
    initTutorDashboardHandlers(); 
}

function loadStudentDashboardView() {
    if (userState.userRole !== 'Student' || !userState.isLoggedIn) return loadHomeView();
    window.location.hash = 'student-dashboard';
    // renderStudentDashboard comes from views.js
    $('#content').html(renderStudentDashboard(userState.userName));
}

function loadStudentCourseCatalog() {
    window.location.hash = 'catalog';
    const html = `
        <div id="student-course-catalog-view" class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-extrabold text-gray-900 mb-8">Course Catalog (All Available Courses)</h1>
            <div class="mb-8">
                <input type="text" id="course-search-input" placeholder="Search by course title or description..." class="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition">
            </div>
            <div id="catalog-message"></div>
            <div id="course-catalog-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                </div>
        </div>
    `;
    $('#content').html(html);
    // Use the unified fetch function for the full catalog
    fetchCourseCatalog('/api/courses', '#course-catalog-container', '#catalog-message');
}

/**
 * Handles the 'My Courses' link for students. Now fetches *enrolled* courses separately.
 */
function loadStudentMyCoursesView() {
    if (userState.userRole !== 'Student' || !userState.isLoggedIn) return loadHomeView();
    window.location.hash = 'my-courses';
    const html = `
        <div id="student-my-courses-view" class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-extrabold text-gray-900 mb-8">My Enrolled Courses</h1>
            <p class="text-lg text-gray-600 mb-6">These are the courses you are currently taking or have viewed recently. (Placeholder for Enrollment)</p>
            <div id="my-courses-message"></div>
            <div id="my-courses-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                </div>
        </div>
    `;
    $('#content').html(html);
    // NEW: Use the unified fetch function with a dedicated endpoint for student's enrolled courses
    fetchCourseCatalog('/api/student/my-courses', '#my-courses-container', '#my-courses-message'); 
}


// ===============================================
// DATA FETCHING FUNCTIONS 
// ===============================================

/**
 * Unified function to fetch and render a list of courses (either catalog or student's own).
 * @param {string} endpoint - The API endpoint to fetch courses from.
 * @param {string} containerSelector - The DOM selector for the course card container.
 * @param {string} messageSelector - The DOM selector for the message container.
 */
async function fetchCourseCatalog(endpoint, containerSelector, messageSelector) {
    try {
        const data = await apiFetch(endpoint);
        const courses = data.courses || [];
        
        // Only set up search if it's the main catalog view
        const isCatalog = endpoint === '/api/courses';

        if(isCatalog) {
            // Cache for search functionality
            sessionStorage.setItem('allCourses', JSON.stringify(courses));
        }

        renderCourseCatalog(courses, containerSelector, messageSelector);
        
        // Attach search handler only for the catalog
        if (isCatalog) {
            $('#course-search-input').off('keyup').on('keyup', function() {
                const searchTerm = $(this).val().toLowerCase();
                const allCourses = JSON.parse(sessionStorage.getItem('allCourses')) || [];
                
                const filteredCourses = allCourses.filter(course => 
                    course.title.toLowerCase().includes(searchTerm) || 
                    course.description.toLowerCase().includes(searchTerm)
                );
                renderCourseCatalog(filteredCourses, containerSelector, messageSelector);
            });
        }

    } catch (error) {
        displayMessage(messageSelector, 'Failed to load courses. Please ensure the server is running and the API endpoints are configured.', true);
    }
}


// ===============================================
// RENDERING HELPERS & COMMENT HANDLERS
// ===============================================

/**
 * Renders a list of course cards into a specified container.
 * @param {Array<Object>} courses - The list of course objects.
 * @param {string} containerSelector - The DOM selector to append the cards to.
 * @param {string} messageSelector - The DOM selector for status messages.
 */
function renderCourseCatalog(courses, containerSelector, messageSelector) {
    const container = $(containerSelector);
    container.empty();
    
    if (courses.length === 0) {
        const inputVal = $('#course-search-input').length ? $('#course-search-input').val().trim() : '';
        if(inputVal !== '') {
             displayMessage(messageSelector, 'No courses found matching your criteria.', false);
        } else {
             displayMessage(messageSelector, 'No courses are available yet.', false);
        }
        return;
    }
    // Clear the message if courses are found
    $(messageSelector).empty();

    courses.forEach(course => {
        container.append(`
            <div class="bg-white rounded-xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden">
                <div class="p-6">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">${course.title}</h3>
                    <p class="text-indigo-600 font-medium mb-3">Tutor: ${course.tutorName}</p>
                    <p class="text-gray-600 mb-4 line-clamp-3">${course.description}</p>
                    <a href="#course/${course._id}" class="course-card-link inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        View Course Details
                    </a>
                </div>
            </div>
        `);
    });
}

function renderComments(comments) {
    if (comments.length === 0) {
        return '<p class="text-gray-500">Be the first to leave a comment!</p>';
    }
    return comments.map(comment => `
        <div class="border-b border-gray-100 pb-4">
            <p class="text-sm font-semibold text-gray-900">${comment.userName} <span class="text-xs font-normal text-gray-500 ml-2">${new Date(comment.createdAt).toLocaleDateString()}</span></p>
            <p class="text-gray-700 mt-1">${comment.content}</p>
        </div>
    `).join('');
}


// FIX: Moved this function to the global scope so loadCourseDetails can access it.
/**
 * Sets up the event handler for posting a new comment.
 */
function setupCommentHandler() {
    $('body').off('submit', '#comment-form').on('submit', '#comment-form', async function(e) {
        e.preventDefault();
        // The MongoDB ID is stored in a data attribute
        const courseId = $(this).data('course-id'); 
        const content = $('#comment-content').val();
        const messageContainer = $('#comment-message');
        const button = $(this).find('button[type="submit"]');

        if (!content.trim()) return;

        button.prop('disabled', true).text('Posting...');
        messageContainer.empty();

        try {
            const data = await apiFetch(`/api/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, content })
            });
            
            displayMessage(messageContainer, data.message);
            $('#comment-content').val(''); // Clear form

            // Re-fetch and re-render comments
            const newCommentsData = await apiFetch(`/api/comments/${courseId}`); 
            $('#comment-list').html(renderComments(newCommentsData.comments));

        } catch (error) {
            displayMessage(messageContainer, `Comment failed: ${error.message}`, true);
        } finally {
            button.prop('disabled', false).text('Post Comment');
        }
    });
}


// ===============================================
// CORE EVENT HANDLERS
// ===============================================

$(document).ready(function() {
    
    // Check initial session status and load view
    checkSessionStatus();

    // --- Authentication Handlers ---

    function handleAuthForm(formId, endpoint, successCallback, role) {
        $('body').off('submit', formId).on('submit', formId, async function(e) {
            e.preventDefault();
            const form = $(this);
            const messageContainer = form.find('#auth-message');
            const button = form.find('button[type="submit"]');

            messageContainer.empty();
            button.prop('disabled', true).text('Processing...');

            const formData = form.serializeArray().reduce((obj, item) => {
                obj[item.name] = item.value;
                return obj;
            }, {});

            try {
                const data = await apiFetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                displayMessage(messageContainer, data.message);
                
                if (endpoint.includes('signup')) {
                    if (successCallback) successCallback(); 
                } else {
                    // Successful login -> Update State and Redirect
                    userState.isLoggedIn = true;
                    userState.userId = data.user.id;
                    userState.userName = data.user.name;
                    userState.userRole = data.user.role;
                    updateNavVisibility(userState.userRole, true);
                    
                    if (role === 'Tutor') {
                        loadTutorDashboardView();
                    } else if (role === 'Student') {
                        loadStudentDashboardView();
                    }
                }
            } catch (error) {
                displayMessage(messageContainer, error.message, true);
            } finally {
                button.prop('disabled', false).text(endpoint.includes('login') ? 'Sign In' : 'Sign Up');
            }
        });
    }

    // Attach handlers for API endpoints
    handleAuthForm('#tutor-signup-form', '/api/signup', loadTutorSignInView, 'Tutor');
    handleAuthForm('#tutor-signin-form', '/api/login', null, 'Tutor');
    handleAuthForm('#student-signup-form', '/api/signup', loadStudentSignInView, 'Student');
    handleAuthForm('#student-signin-form', '/api/login', null, 'Student');
    
    // Logout Handler
    $('#logout-button, #mobile-logout-button').off('click').on('click', async function(e) {
        e.preventDefault();
        try {
            await apiFetch('/api/logout', { method: 'POST' });
            userState = { isLoggedIn: false, userId: null, userName: null, userRole: null };
            updateNavVisibility(null, false);
            loadHomeView();
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    });

    
    // --- Navigation and Routing Logic (Simplified UX) ---
    
    const router = () => {
        const hash = window.location.hash.substring(1); 

        if (!hash || hash === 'home') {
            loadHomeView();
        } else if (hash === 'tutor-sign-in') {
            loadTutorSignInView();
        } else if (hash === 'tutor-sign-up') {
            loadTutorSignUpView();
        } else if (hash === 'student-sign-in') {
            loadStudentSignInView();
        } else if (hash === 'student-sign-up') {
            loadStudentSignUpView();
        } else if (hash === 'tutor-dashboard') {
            loadTutorDashboardView();
        } else if (hash === 'student-dashboard') {
            loadStudentDashboardView();
        } else if (hash === 'catalog') {
            loadStudentCourseCatalog();
        } else if (hash === 'my-courses') {
            loadStudentMyCoursesView(); 
        } else if (hash.startsWith('course/')) {
            const courseId = hash.split('/')[1];
            loadCourseDetails(courseId);
        } else {
            // Handle unknown hash gracefully
            loadHomeView();
        }
    };

    // Listen for hash change events (browser back/forward)
    $(window).on('hashchange', router);

    // Consolidated hash link click handler for better UX
    // Clicks on <a href="#hash"> elements simply change the hash, which triggers the router.
    $('body').off('click', 'a[href^="#"]').on('click', 'a[href^="#"]', function(e) {
        const href = $(this).attr('href');
        if (href.length > 1 && href !== '#') {
            e.preventDefault(); 
            window.location.hash = href.substring(1); 
        }
    });
    
    // Initial router call for the first page load
    router();
});


// --- Other View Loads (Course Details) ---

async function loadCourseDetails(courseId) {
    if (!userState.isLoggedIn) {
        alert('You must sign in to view course details.');
        return loadStudentSignInView();
    }
    window.location.hash = `course/${courseId}`;
    $('#content').html('<div class="text-center py-20"><p class="text-lg text-gray-500">Loading course details...</p></div>');

    try {
        // Assume API returns course details with its video_path
        const courseData = await apiFetch(`/api/course/${courseId}`); 
        const commentsData = await apiFetch(`/api/comments/${courseId}`); 
        
        const course = courseData.course;
        // In the backend, we should use course._id (the MongoDB ObjectId)
        const displayCourseId = course._id; 
        const comments = commentsData.comments;

        const html = `
            <div id="student-course-details-view" class="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <h1 class="text-4xl font-extrabold text-gray-900 mb-4">${course.title}</h1>
                <p class="text-lg text-indigo-600 mb-6">Tutor: ${course.tutorName}</p>
                
                <div id="video-player-container" class="bg-black rounded-xl overflow-hidden shadow-2xl mb-8">
                    <video id="course-video-player" controls preload="metadata" width="100%" class="aspect-video">
                        <source src="/api/video/${displayCourseId}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-lg mb-10">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Course Description</h2>
                    <p class="text-gray-700">${course.description}</p>
                </div>
                
                <div id="comment-section" class="bg-white p-6 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">Comments (${comments.length})</h2>
                    <div id="comment-list" class="space-y-4 mb-6">
                        ${renderComments(comments)}
                    </div>

                    <form id="comment-form" data-course-id="${displayCourseId}" class="space-y-4"> 
                        <textarea id="comment-content" name="content" rows="3" required placeholder="Write a comment..." class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        <div id="comment-message"></div>
                        <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition">
                            Post Comment
                        </button>
                    </form>
                </div>
            </div>
        `;
        $('#content').html(html);
        // This function is now accessible!
        setupCommentHandler(); 

    } catch (error) {
        displayMessage('#content', `Failed to load course details: ${error.message}.`, true);
    }
}