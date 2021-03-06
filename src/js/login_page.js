var client_id = "85f22cf5c62d45a5850c744d876fc4a0";
var client_secret = "ee25f76fe69e4418adbf136ac8dfce32";
var redirect_uri = "http://localhost:8000/src/html/main_views/login_page.html";
var scopes = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-top-read user-library-modify user-library-read';
var base_url = 'https://accounts.spotify.com/authorize';
var url;
var stateKey = 'spotify_auth_state';

console.log("login_page.js running currently . . .");

authorize_user();

function authorize_user() {
	var params = getHashParams();
    var access_token = params.access_token,
        state = params.state,
        storedState = localStorage.getItem(stateKey);
        sessionStorage.setItem('OAuth',access_token);
    if (access_token && (state == null || state !== storedState)) {
        alert('There was an error during the authentication');
    } else {
        localStorage.removeItem(stateKey);
        if (access_token) {
            $.ajax({
            	url: 'https://api.spotify.com/v1/me',
            	headers: {
            	   	'Authorization': 'Bearer ' + access_token
                },
                success: function(response) {
                    //userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                   	console.log(response);
                    sessionStorage.setItem('user',JSON.stringify(response));
                    //console.log(JSON.parse(sessionStorage.getItem('user')));
                    $('#nav_button').show();
                    $('#login-button').hide();
                    var message = document.getElementById('message_login_screen');
                    message.innerHTML = "Hello, " + response.display_name  + ".";
                    var user_image = document.getElementById("user_image");
                    user_image.src = response.images[0].url;
                    $('#user_image').show();
                }	
            });
        } else {
            console.log("Could not authenticate.");
    	}
  		url = base_url + '?' + $.param({
    		'response_type' : 'code',
    		'client_id' : client_id,
    		'redirect_uri' : redirect_uri,
    		'scope' : scopes,
    		'show_dialog':'true'
  		});
  		console.log(url);
	}
};

// called when login button is set
function login() {
    console.log("Login");
    var state = generateRandomString(16);
    localStorage.setItem(stateKey, state);
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scopes);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);
    url += '&show_dialog' + encodeURIComponent('true');
    window.location = url;
};

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
  	var text = '';
  	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  	for (var i = 0; i < length; i++) {
 	 	text += possible.charAt(Math.floor(Math.random() * possible.length));
  	}
  	return text;
};

/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
function getHashParams() {
  	var hashParams = {};
  	var e, 
	  	r = /([^&;=]+)=?([^&;]*)/g,
  	    q = window.location.hash.substring(1);

  	while ( e = r.exec(q)) {
    	hashParams[e[1]] = decodeURIComponent(e[2]);
  	}
  	return hashParams;
};
