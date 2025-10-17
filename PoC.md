This will be a desktop application which will allow to learn programming and IT related things interactive way.

# Overview
Application should provide a entry view/dashboard where possible courses are with internal links to particular course.
Courses will not be initially downloaded, downloading the course means that application will clone corresponding course public repository.
App will check if it can pull course repo when we are going to this course with possibility to update the course and refresh the view.

# Courses from public repo
Example course structure would be
overview.md
1_basics
  1_hello_world
    _meta
      description.md

      meta.json
      -- { "initCmd": "<command to run to initialize the exercise>", "testCmd": "command to run to run tests on current exercise" }
      tests
        example_test.js
    helloworld.js
    package.json
    -- possible other task files in exercise root folder
  2_add_numbers
    _meta
      description.md
      meta.json
      -- { "initCmd": "<command to run to initialize the exercise>", "testCmd": "command to run to run tests on current exercise" }
      tests
        example_test.js
    addNumbers.js
    package.json
    -- possible other task files in exercise root folder
  

The goal in this structure is that to keep it efficient, for example, in javascript project we can use pnpm to reuse node_modules across exercises to reduce storage use.

Example public repo link (work in progress) - https://github.com/artur-kot/learn-programming-javascript.git

# Views
I see views structure like this:
/(root) 
  dashboard, home route with hardcoded list of all courses
/course/<slug>
  Course view will have in state current exercise.
  If no exercise is selected from the left bar, display in <main> area contents of overview.md file

  course view, there will be a left panel (can be collapsed) with tree view of exercises in current course
  main container will be a left panel with exercise description
  right panel (wide one) will be a place where we can edit code with monaco editor. There can be multiple files so something like topbar like in visual studio code
  where we can select focused file would be needed. App should save automatically files (think about efficient way to do this). Saved exercise workspace will be saved in filesystem, for example in application data.

  Current exercise should be automatically initialized with "initCmd" command (installing pnpm packages for example)

  Topbar of exercise should have possibility to: check exercise (run test command and see the return status code), move to previous exercise, move to next exercise

# Saving progress of course
SQLite database should save progress of each exercise (if it's done).
On courses view there should be a progress bar which informs how much of course user has done.
On course view there should be a checkmark or other indicator informing that user has completed particular exercise.
Think about the way to identify exercises, I was thinking about slug + exercise path, for example - javascript_2_add_numbers. However, there is possibility that data will be lost/unreachable when we will pull new version of course and that exercise will be shifted to for example javascript_3_add_numbers. In this scenario, exercise id will be not relevant anymore.

# Libraries
Use shadcn-svelte as UI library