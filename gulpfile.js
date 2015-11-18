var   gulp  = require('gulp');

// In-house plugins
var   del         = require('del'),
      spawn       = require('child_process').spawn,
      concat      = require('gulp-concat'),
      livereload  = require('gulp-livereload'),
      plumber     = require('gulp-plumber'),
      sass        = require('gulp-sass'),
      sourcemaps  = require('gulp-sourcemaps'),
      uglify      = require('gulp-uglify'),
      express     = require('express'),
      app         = express(),
      http        = require('http').Server(app),
      io          = require('socket.io')(http),
      path        = require('path');
      
var   port        = 8080;

// Clean the build folder
gulp.task('clean', function (cb) {
   del(['build'], cb);
});

// Process SCSS files
gulp.task('scss', function () {
   gulp.src('./src/scss/**/*.scss')
      .pipe(plumber())
      .pipe(sass())
      .pipe(gulp.dest('./build/static/css'))
      .pipe(livereload());
});

// Process JS files
gulp.task('js', function () {
   return gulp.src('./src/js/**/*.js')
      .pipe(plumber())
//      .pipe(sourcemaps.init())
//      .pipe(uglify())
//      .pipe(concat('all.min.js'))
//      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./build/static/js'))
      .pipe(livereload());
});

// Process images
gulp.task('img', function () {
   gulp.src('./src/img/**/*')
      .pipe(plumber())
      .pipe(gulp.dest('./build/static/img'))
      .pipe(livereload());
});

// Process HTML files
gulp.task('html', function () {
   return gulp.src('./src/jade/**/*.jade')
      .pipe(gulp.dest('./build/views'))
      .pipe(livereload());
});

// Socket.io
gulp.task('io', function () {
   var usernames = {};
   var choices = [];
   
   // Fires when the user connects.
   io.on('connection', function (socket) {
      var user_added = false;
      
      // Checks to see if there are already two players.
      // Otherwise, the connector will spectate.
      if (Object.keys(usernames).length == 2) {
         io.emit('room full');
         io.emit('user list', usernames);
      }
      
      // Fires once the connector types a username and hits ENTER.
      socket.on('add user', function (username) {  
         // Double checks to make sure a third user is not added.       
         if (Object.keys(usernames).length == 2) {
            io.emit('room full');
            io.emit('user list', usernames);
         } else {
            socket.username = username;
            usernames[username] = username;
            user_added = true;      
            
            io.emit('user list', usernames);
            console.log('[socket.io] %s has connected.', socket.username);
            
            // Once there are two players, the game will start.
            if (Object.keys(usernames).length == 2) {
               io.emit('game start');
            }
         }
      });
      
      // Listens for choice submissions from the players.
      socket.on('player choice', function (username, choice) {
         choices.push({'user': username, 'choice': choice});
         console.log('[socket.io] %s chose %s.', username, choice);
         
         // Once both players have submitted a choice, the game checks for the winner.
         if (choices.length == 2) {
            console.log('[socket.io] Both players have made choices.');            
            if (choices[0]['choice'] === 'rock') {
               if  (choices[1]['choice'] === 'rock')      io.emit('tie', choices);
               if  (choices[1]['choice'] === 'paper')     io.emit('player 2 win', choices);
               if  (choices[1]['choice'] === 'scissors')  io.emit('player 1 win', choices);
               choices = [];
            } else if (choices[0]['choice'] === 'paper') {
               if  (choices[1]['choice'] === 'rock')      io.emit('player 1 win', choices);
               if  (choices[1]['choice'] === 'paper')     io.emit('tie', choices);
               if  (choices[1]['choice'] === 'scissors')  io.emit('player 2 win', choices);
               choices = [];
            } else if (choices[0]['choice'] === 'scissors') {
               if  (choices[1]['choice'] === 'rock')      io.emit('player 2 win', choices);
               if  (choices[1]['choice'] === 'paper')     io.emit('player 1 win', choices);
               if  (choices[1]['choice'] === 'scissors')  io.emit('tie', choices);
               choices = [];
            }
         }
      });
      
      // Fires when a user disconnects.
      socket.on('disconnect', function () {
         // Removes player from the list and resets the game.
         if (user_added) {
            delete usernames[socket.username];
            
            io.emit('user list', usernames);
            console.log('[socket.io] %s has disconnected.', socket.username);
            choices = [];
         }
      });
   });
});

// Server routing
gulp.task('server', function () {
   app.set('view engine', 'jade');
   app.set('views', './build/views');
   app.use(express.static('./build/static'));
   
   app.get('/', function (req, res) {
      res.render('index', {
         title: 'Basic Page',
         text: "This index.html page is a placeholder with the CSS, font and favicon. It's just waiting for you to add some content! If you need some help hit up the <a href='http://www.getskeleton.com'>Skeleton documentation</a>."
      });
   });
   
   http.listen(port, function(){
      console.log('[Server] Listening on *:%d', port);
   });
});

// Run the server and watch files for changes
gulp.task('watch', function () {
   livereload.listen();
   gulp.watch('./src/scss/**/*.scss',  ['scss']);
   gulp.watch('./src/js/**/*.js',      ['js']);
   gulp.watch('./src/img/**/*',        ['img']);
   gulp.watch('./src/jade/**/*.jade',  ['html']);
});

// Run gulp tasks
gulp.task('default', ['scss', 'js', 'img', 'html', 'io', 'server', 'watch']);