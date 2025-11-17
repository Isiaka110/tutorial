// views.js

// ===============================================
// AUTHENTICATION FORMS
// ===============================================

/**
 * Renders the generic sign-up form.
 * @param {string} role - 'Tutor' or 'Student'
 */
function renderSignUpForm(role) {
    const isTutor = role === 'Tutor';
    const formId = isTutor ? 'tutor-signup-form' : 'student-signup-form';
    const title = isTutor ? 'Tutor Registration' : 'Student Registration';
    const linkText = isTutor ? 'Already have an account? Sign In as Tutor' : 'Already have an account? Sign In as Student';
    const linkHash = isTutor ? 'tutor-sign-in' : 'student-sign-in';

    return `
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-2xl transition hover:shadow-3xl">
            <h2 class="text-3xl font-extrabold text-indigo-700 mb-6 text-center">${title}</h2>
            <form id="${formId}" class="space-y-6">
                
                <input type="hidden" name="role" value="${role}">

                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="name" name="name" required 
                           class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="Enter your name">
                </div>
                
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" name="email" required 
                           class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="name@example.com">
                </div>
                
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" name="password" required 
                           class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="Must be at least 6 characters">
                </div>
                
                <div id="auth-message"></div>
                
                <div>
                    <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out">
                        Sign Up
                    </button>
                </div>
                
                <p class="text-center text-sm">
                    <a href="#${linkHash}" class="font-medium text-indigo-600 hover:text-indigo-500">${linkText}</a>
                </p>
            </form>
        </div>
    `;
}

/**
 * Renders the generic sign-in form.
 * @param {string} role - 'Tutor' or 'Student'
 */
function renderSignInForm(role) {
    const isTutor = role === 'Tutor';
    const formId = isTutor ? 'tutor-signin-form' : 'student-signin-form';
    const title = isTutor ? 'Tutor Sign In' : 'Student Sign In';
    const linkText = isTutor ? 'Need an account? Sign Up as Tutor' : 'Need an account? Sign Up as Student';
    const linkHash = isTutor ? 'tutor-sign-up' : 'student-sign-up';

    return `
        <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-2xl transition hover:shadow-3xl">
            <h2 class="text-3xl font-extrabold text-indigo-700 mb-6 text-center">${title}</h2>
            <form id="${formId}" class="space-y-6">

                <input type="hidden" name="role" value="${role}">
                
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" name="email" required 
                           class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="name@example.com">
                </div>
                
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" name="password" required 
                           class="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="Enter your password">
                </div>
                
                <div id="auth-message"></div>
                
                <div>
                    <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                        Sign In
                    </button>
                </div>
                
                <p class="text-center text-sm">
                    <a href="#${linkHash}" class="font-medium text-green-600 hover:text-green-500">${linkText}</a>
                </p>
            </form>
        </div>
    `;
}

// ===============================================
// DASHBOARD & COURSE UPLOAD VIEWS
// ===============================================

/**
 * Renders the Tutor's course upload form (used in the dashboard).
 */
function renderCourseUploadForm() {
    // This is the primary feature of the tutor portal
    return `
        <div class="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-lg border-t-4 border-green-500">
            <h2 class="text-3xl font-bold text-indigo-700 mb-6">Upload New Course Video</h2>
            <form id="course-upload-form" enctype="multipart/form-data" class="space-y-6">
                <div>
                    <label for="course-title" class="block text-sm font-medium text-gray-700">Course Title</label>
                    <input type="text" id="course-title" name="title" required 
                           class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="e.g., Introduction to Mongoose">
                </div>
                <div>
                    <label for="course-description" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="course-description" name="description" rows="3" required 
                              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Brief description of the course content"></textarea>
                </div>
                <div>
                    <label for="video-file" class="block text-sm font-medium text-gray-700">Video File</label>
                    <input type="file" id="video-file" name="videoFile" accept="video/*" required 
                           class="mt-1 block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
                    <p class="mt-1 text-sm text-gray-500">Supported formats: MP4, MOV, etc.</p>
                </div>
                <div id="upload-message"></div>
                <div>
                    <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out">
                        Upload Course
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * Renders the Tutor Dashboard layout.
 * @param {string} userName
 */
function renderTutorDashboard(userName) {
    return `
        <div id="tutor-dashboard-view" class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-extrabold text-gray-900 mb-4">👋 Tutor Content Portal</h1>
            <p class="text-lg text-gray-600 mb-8">Welcome, ${userName}. Upload your new video tutorials below to share your knowledge.</p>
            
            ${renderCourseUploadForm()}

            <div id="tutor-courses-list" class="mt-12">
                <h2 class="text-3xl font-bold text-indigo-700 mb-6">My Uploaded Courses</h2>
                <div id="my-courses-message"></div>
                <div id="my-courses-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    </div>
            </div>
        </div>
    `;
}

/**
 * Renders the Student Dashboard layout.
 * @param {string} userName
 */
function renderStudentDashboard(userName) {
    return `
        <div id="student-dashboard-view" class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 class="text-4xl font-extrabold text-gray-900 mb-8">📚 Student Dashboard</h1>
            <p class="text-lg text-gray-600 mb-6">Welcome back, ${userName}! Ready to learn? </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a href="#catalog" class="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-t-4 border-indigo-500 flex flex-col items-start">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Explore All Courses</h2>
                    <p class="text-gray-600">Browse the full catalog of available tutorials.</p>
                    <span class="mt-4 text-indigo-600 font-medium hover:text-indigo-800">Start Browsing →</span>
                </a>
                <a href="#my-courses" class="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-t-4 border-green-500 flex flex-col items-start">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">My Enrolled Courses</h2>
                    <p class="text-gray-600">View courses you have started. (Currently shows the full catalog)</p>
                    <span class="mt-4 text-green-600 font-medium hover:text-green-800">Go to My Courses →</span>
                </a>
            </div>
        </div>
    `;
}