//main function
function TrackTweets($scope) {
    $scope.count = 1;
    $scope.twitts = [];
    var socket = io.connect('http://localhost:3001');
    window.socket = socket;
    socket.on('newTwitt', function (item) {


        $scope.twitts.push(item);

        $scope.count++;

        //console.log(item);
        if ($scope.twitts.length > 15)
            $scope.twitts.splice(0, 1);
        $scope.$apply();

    })

}