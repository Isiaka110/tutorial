# TutorHub --- Online Video Tutorial Platform

TutorHub is a full-stack web application designed to host, manage, and
stream video tutorials. It enables tutors to upload course content and
students to view lessons and interact via comments.

This project follows a modern full-stack architecture:

-   **Backend:** Node.js + Express.js\
-   **Database:** MongoDB (via Mongoose)\
-   **Frontend:** HTML, Tailwind CSS, Vanilla JS (with jQuery)

------------------------------------------------------------------------

## 🚀 1. Getting Started

Follow the steps below to set up and run the project locally.

------------------------------------------------------------------------

## 💻 Prerequisites

Ensure the following are installed:

-   **Node.js + npm** (Recommended: v18+)
-   **MongoDB Atlas** account *or* a local MongoDB server

------------------------------------------------------------------------

## 🛠️ 2. Setup and Installation

### **A. Clone the Repository**

``` bash
git clone <your-repo-link>
cd TutorHub
```

------------------------------------------------------------------------

### **B. Install Backend Dependencies**

Install all Node modules defined in the project:

``` bash
npm install
```

### **Required Backend Packages**

  Dependency          Description
  ------------------- ------------------------------------
  **express**         Core web server framework
  **mongoose**        ODM used to interact with MongoDB
  **bcryptjs**        Password hashing and salting
  **jsonwebtoken**    JWT authentication handling
  **cookie-parser**   Parses cookies for JWT storage
  **multer**          Handles file uploads (video files)
  **body-parser**     Parses incoming request bodies

------------------------------------------------------------------------

### **C. Configure Environment Variables**

Update the configuration section inside **server.js**.

#### Replace with your actual values:

``` js
// MongoDB connection string
const MONGO_URI = "mongodb+srv://<user>:<password>@cluster0.mongodb.net/video_tutorial";

// JWT secret key (must be long and secure)
const JWT_SECRET = "your_very_long_random_secret_key_here";
```

------------------------------------------------------------------------

### **D. Create the Uploads Directory**

This directory stores uploaded video files.

``` bash
mkdir uploads
```

------------------------------------------------------------------------

## 🏃 3. Running the Application

### **A. Start the Server**

``` bash
node server.js
```

Expected console output:

    Connected to MongoDB Atlas
    Server running at http://localhost:3000

------------------------------------------------------------------------

## **B. Access the Frontend**

Open:

    http://localhost:3000/index.html

------------------------------------------------------------------------

## 📁 4. Project File Structure

  -----------------------------------------------------------------------
  File/Directory                                Purpose
  --------------------------------------------- -------------------------
  **server.js**                                 Main Express server,
                                                routes, JWT auth, and
                                                video streaming

  **models.js**                                 Mongoose schemas: User,
                                                Course, Comment

  **index.html**                                Main UI template with
                                                Tailwind and JS imports

  **app.js**                                    Core frontend logic
                                                (auth, navigation,
                                                storage)

  **tutor.js**                                  Tutor-side handlers for
                                                uploading and managing
                                                courses

  **views.js**                                  Functions for generating
                                                dynamic HTML interfaces

  **uploads/**                                  Stores uploaded video
                                                content
  -----------------------------------------------------------------------
