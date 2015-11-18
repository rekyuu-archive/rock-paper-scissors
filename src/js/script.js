$(function () {

   var socket = io();   
   var $window = $(window);
   
   var username;
   var $username_input = $('.username');
   var submitted = false;
   var $current_input = $username_input.focus();

   // Cleans input from anyone trying to h4x0r5
   function clean_input (input) {
      return $('<div/>').text(input).text();
   }
   
   // Function for setting the players username.
   function set_username () {
      username = clean_input($username_input.val().trim());
      if (username) {
         $('#login').hide();
         $('#game').show();
         $('#login').off('click');
         
         socket.emit('add user', username);
      }
   }
   
   // Listens for [ENTER] for the user to submit his
   // or her username.
   $window.keydown (function (event) {
      if (!(event.ctrlKey || event.metaKey || event.altKey)) {
         $current_input.focus();
      }
      if (event.which === 13) {
         if (!username) set_username();   
      }
   });
   
   // If there is already two players, the third and onward will spectate.
   socket.on('room full', function () {
      $('#login').hide();
      $('#game').show();
      $('#login').off('click');
   });
   
   // Displays a listing of users.
   socket.on('user list', function (usernames) {
      $('.user_list').empty();
      for (user in usernames) {
         $('.user_list').append($('<li>').text(usernames[user]));
      }
   });
   
   // Once there's two players, the game will start.
   socket.on('game start', function () {
      $('.info').html('Make your choice.');
      submitted = false;
   });
   
   // Listens for the player to hit the submit button 
   // then sends the value of the radio he or she had selected.
   // Also checks if the player has made a submission.   
   $('.submit').click(function () {
      $('.info2, .results').remove();
      if (!submitted) {
         var choice = $('input[name=choice]:checked').val();
         socket.emit('player choice', username, choice);
         $('.info').html('Waiting for other player...');
         submitted = true;
      } else $('.info').html('You have already made a choice!');
   });
   
   // Countdown for added tension.
   function countdown (choices) {      
      setTimeout(function () {
         $('.info').html('3...'); 
      }, 0);
      setTimeout(function () {
         $('.info').html('2...'); 
      }, 1000);
      setTimeout(function () {
         $('.info').html('1...'); 
      }, 2000);
      setTimeout(function () {
         $('.info').html(choices[0]['user'] + ' picked ' + choices[0]['choice'] + '.'); 
      }, 3000);
      setTimeout(function () {
         $('.info').after('<h1 class="info2">' + choices[1]['user'] + ' picked ' + choices[1]['choice'] + '.</h1>'); 
      }, 4000);
   }
   
   // Displays if there is a tie.
   socket.on('tie', function (choices) {
      countdown(choices);
      setTimeout(function () {
         $('.info2').after('<h1 class="results">It was a tie.</h1>'); 
      }, 5000);
      submitted = false;
   });
   
   // Displays if the first player in the list wins.
   socket.on('player 1 win', function (choices) {
      countdown(choices);
      setTimeout(function () {
         $('.info2').after('<h1 class="results">' + choices[0]['user'] + ' wins!<h1>');
      }, 5000);
      submitted = false;
   });
   
   // Displays if the second player in the list wins.
   socket.on('player 2 win', function (choices) {
      countdown(choices);
      setTimeout(function () {
         $('.info2').after('<h1 class="results">' + choices[1]['user'] + ' wins!<h1>');
      }, 5000);
      submitted = false;
   });
});