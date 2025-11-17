// tutor.js

// NEW: Import utility functions from app.js to fix the ReferenceError
import { apiFetch, displayMessage } from './app.js';

/**
 * Attaches the submit handler for the course upload form.
 * FIX: Uses FormData correctly for multi-part file upload.
 */
function setupCourseUploadHandler() {
    $('body').off('submit', '#course-upload-form').on('submit', '#course-upload-form', async function(e) {
        e.preventDefault();
        const form = $(this);
        const messageContainer = form.find('#upload-message');
        const button = form.find('button[type="submit"]');
        
        messageContainer.empty();
        button.prop('disabled', true).text('Uploading...');

        // KEY FIX: Use FormData for file uploads. The input name MUST be 'videoFile'
        const formData = new FormData(this); 

        try {
            // apiFetch is now imported
            const data = await apiFetch('/api/courses', {
                method: 'POST',
                // Content-Type MUST NOT be set when using FormData with a file input
                body: formData 
            });

            displayMessage(messageContainer, data.message);
            form.trigger("reset"); 
            fetchTutorCourses(); // Reload the courses list after successful upload
        } catch (error) {
            // error.message comes from the thrown error in apiFetch (which gets the server's response message)
            displayMessage(messageContainer, `Upload failed: ${error.message}`, true);
        } finally {
            button.prop('disabled', false).text('Upload Course');
        }
    });
}

/**
 * Fetches and renders the courses uploaded by the currently logged-in tutor.
 */
async function fetchTutorCourses() {
    // This correctly acts as the Tutor's "My Courses" view
    try {
        const data = await apiFetch('/api/tutor/courses');
        const tutorCourses = data.courses || [];
        const container = $('#my-courses-container');
        container.empty();
        $('#my-courses-message').empty(); // Clear any previous message

        if (tutorCourses.length === 0) {
            $('#my-courses-message').html('<p class="text-gray-500">You have not uploaded any courses yet. Use the form above to get started!</p>');
            return;
        }

        tutorCourses.forEach(course => {
             container.append(`
                <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500">
                    <h3 class="text-xl font-semibold text-gray-900">${course.title}</h3>
                    <p class="mt-2 text-gray-600">${course.description}</p>
                    <a href="#course/${course._id}" data-course-id="${course._id}" class="course-card-link text-sm text-indigo-600 hover:text-indigo-800 mt-4 inline-block">Manage Course</a>
                </div>
            `);
        });

    } catch (error) {
        displayMessage('#my-courses-message', 'Failed to load your courses. Please ensure you are signed in.', true);
    }
}

/**
 * Initializes all handlers for the Tutor Dashboard view.
 * This function will be called by loadTutorDashboardView in app.js.
 */
export function initTutorDashboardHandlers() {
    setupCourseUploadHandler();
    fetchTutorCourses();
}