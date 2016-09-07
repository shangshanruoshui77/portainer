angular.module('volumes', [])
.controller('VolumesController', ['$scope', '$state', 'Volume', 'Messages',
function ($scope, $state, Volume, Messages) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Driver';
  $scope.sortReverse = true;

  $scope.config = {
    Name: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  function prepareVolumeConfiguration() {
    var config = angular.copy($scope.config);
    config.Driver = 'local-persist';
    config.DriverOpts = {};
    config.DriverOpts.mountpoint = '/volume/' + config.Name;
    return config;
  }

  $scope.createVolume = function() {
    $('#createVolumeSpinner').show();
    var config = prepareVolumeConfiguration();
    Volume.create(config, function (d) {
      if (d.message) {
        $('#createVolumeSpinner').hide();
        Messages.error('Unable to create volume', {}, d.message);
      } else {
        Messages.send("Volume created", d.Name);
        $('#createVolumeSpinner').hide();
        $state.go('volumes', {}, {reload: true});
      }
    }, function (e) {
      $('#createVolumeSpinner').hide();
      Messages.error("Failure", e, 'Unable to create volume');
    });
  };

  $scope.removeAction = function () {
    $('#loadVolumesSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadVolumesSpinner').hide();
      }
    };
    angular.forEach($scope.volumes, function (volume) {
      if (volume.Checked) {
        counter = counter + 1;
        Volume.remove({name: volume.Name}, function (d) {
          if (d.message) {
            Messages.error("Unable to remove volume", {}, d.message);
          } else {
            Messages.send("Volume deleted", volume.Name);
            var index = $scope.volumes.indexOf(volume);
            $scope.volumes.splice(index, 1);
          }
          complete();
        }, function (e) {
          Messages.error("Failure", e, "Unable to remove volume");
          complete();
        });
      }
    });
  };

  function fetchVolumes() {
    $('#loadVolumesSpinner').show();
    Volume.query({}, function (d) {
      $scope.volumes = _.uniqBy(d.Volumes, 'Name');
      $('#loadVolumesSpinner').hide();
    }, function (e) {
      $('#loadVolumesSpinner').hide();
      Messages.error("Failure", e, "Unable to retrieve volumes");
    });
  }
  fetchVolumes();
}]);
