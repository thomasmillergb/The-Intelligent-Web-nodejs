 

$('a#twit-login').click(function(){
               window.onunload = refreshParent;
            function refreshParent() {
                window.opener.location.reload();
            }
  window.open('http://127.0.0.1:3000/auth/twitter/', 'window name', 'window settings');
  window.opener.location.reload();
      window.close();
  return false;

});


/*

$(element).click(function(){
    window.close();
});*/