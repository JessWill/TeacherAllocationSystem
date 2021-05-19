'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Helpers = use('Helpers')

const Route = use('Route')

//Authenticated Views
Route.get('/', ({view }) => {
    return view.render('home')
}).middleware(["auth"])

Route.get('/allocations', ({view }) => {
    return view.render('allocations')
}).middleware(["auth"])

Route.get('/academics', ({view }) => {
    return view.render('academics')
}).middleware(["auth"])

Route.get('/units', ({view }) => {
    return view.render('units')
}).middleware(["auth"])

Route.get('/import', ({view }) => {
    return view.render('import')
}).middleware(["auth"])

Route.get('/export', ({view }) => {
    return view.render('export')
}).middleware(["auth"])

Route.get('/help', ({view }) => {
    return view.render('help')
}).middleware(["auth"])

// Unauthenticated views
Route.get('/signup', ({view }) => {
    return view.render('signup')
})

Route.get('/login', ({view }) => {
    return view.render('login')
})

// Handle GET request
Route.get('posts', async ({ view }) => {
    return view.render('posts/index')
  })

Route.get('*', ({ view }) => {
    return view.render("404");
});

// Handle POST request
Route.post('posts', async ({ request }) => {
    return request.body()
  })

Route.post('upload', async ({ request }) => {
  const Alloc = request.file('Allocation', {
    size: '10mb'
  })

  await Alloc.move(Helpers.tmpPath('uploads'), {
    name: `${new Date().getTime()}.xlsm`
  })

  if (!Alloc.moved()) {
    return Alloc.error()
  }
  return 'File moved'
})

//UserController Routes
Route.post('/auth/login', 'UserController.login')
Route.post('/auth/signup', 'UserController.signup')
Route.post('/auth/refresh', 'UserController.refresh')
Route.get('/auth/whoami', 'UserController.whoami').middleware(["auth"])



