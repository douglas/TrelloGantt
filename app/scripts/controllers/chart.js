'use strict';

var obj = angular.module('trelloGanttApp.chart', [
    'gantt',
    'gantt.tooltips',
    'gantt.groups',
    'gantt.tree',
    'gantt.movable'
])
.controller('ChartCtrl', function ($scope, Trelloservice, generalSettings, $location, $modal, $routeParams) {

	/*Auxilary functions*/

        /*SCOPE functions*/
        $scope.registerApi = function(api){
            api.core.on.ready($scope, function(){
               api.tasks.on.moveEnd($scope, function(task){$scope.updateCard(task)});

                api.tasks.on.resizeEnd($scope, function(task){$scope.updateCard(task)});

            });
        };

        $scope.updateCard = function(task){
            var card = task.model;
            Trelloservice.updateCard({
		id: card.id,
		due: card.from.toDate()
	    }).then(function(data){
		console.log(data);
	    });
        };

        $scope.buildTasksData = function(cardList){
            var generatedData = [];
            var minStartDate,
                maxEndDate;
            generatedData.push({name: cardList.name});

            var cardsLength = cardList.cards.length;
            for(var cardIndex = 0; cardIndex < cardsLength; cardIndex++){
                var currentCard = cardList.cards[cardIndex];
                var generatedTask = {};
                generatedTask.name = currentCard.name;
                generatedTask.parent = cardList.name;
                var start = new Date();
                if(currentCard.due)
                    start = new Date(currentCard.due);

                start.setHours(0);
                start.setMinutes(0);
                var end = new Date(start);
                end.setHours(23);
                end.setMinutes(59);

                if(!minStartDate || minStartDate > start)
                    minStartDate = start;
                if(!maxEndDate || maxEndDate < end)
                    maxEndDate = end;

                generatedTask.tasks = [];
                generatedTask.tasks.push({
                    id: currentCard.id,
                    name: currentCard.name,
                    color: '#95a5a6',
                    from: start,
                    to: end
                });
                generatedData.push(generatedTask);
            }
            if(minStartDate)
                minStartDate = new Date(minStartDate);
            if(maxEndDate)
                maxEndDate = new Date(maxEndDate);

            return {minStartDate: minStartDate,
                    maxEndDate: maxEndDate,
                    data: generatedData};
        };

	$scope.buildGanttData = function (lists){
		var ganttData = [];
		var len = lists.length;
                var minStartDate,
                    maxEndDate;
		for (var i = 0; i < len; i++) {
			var list = lists[i];
                        var listData = $scope.buildTasksData(list);
                        ganttData = ganttData.concat(listData.data);
                        if(!minStartDate || minStartDate > listData.minStartDate)
                            minStartDate = listData.minStartDate;
                        if(!maxEndDate || maxEndDate < listData.maxEndDate)
                            maxEndDate = listData.maxEndDate;
		}
                return {
                    minStartDate: new Date(minStartDate),
                    maxEndDate: new Date(maxEndDate),
                    data:ganttData
                };
	}

	$scope.updateGantt = function (boardID){
		Trelloservice.getCardsFromBoard(boardID).then(function(data){
			$scope.clearData();

			var ganttData = $scope.buildGanttData(data);

                        ganttData.minStartDate.setDate(ganttData.minStartDate.getDate() - 10);
                        ganttData.maxEndDate.setDate(ganttData.maxEndDate.getDate() + 10);
                        $scope.gantt.fromDate = ganttData.minStartDate;
                        $scope.gantt.toDate = ganttData.maxEndDate;

                        $scope.loadData(ganttData.data);

			/*setTimeout(function(){
				$scope.scrollToDate(new Date());
			},500);*/
		})
	}

	$scope.getLabelColor = function(label){
		var color;
		switch(label){
		case 'red': color='#e74c3c'; break;
		case 'orange': color='#e67e22'; break;
		case 'yellow': color='#f1c40f'; break;
		case 'green': color='#1abc9c'; break;
		case 'blue': color='#3498db'; break;
		case 'purple': color='#9b59b6'; break;
                    default: color='#8c8c8c';break;
		}
		return color;
	};

	/*$scope.taskEvent = function(event) {
		var dirty = false;
		var current = event.task;
		var previous = event.task.data;
		if(current.from !== previous.from){
			dirty = true;
		}
		else if(current.to !== current.to){
			dirty = true;
		}

		if(dirty){
			var second=1000, minute=second*60, hour=minute*60, day=hour*24;
			var difference = (current.to-current.from)/day;
			difference = Math.ceil(difference);
			var regObj = /\[[1-9](0-9)*d\]/;
			if(regObj.test(current.subject)){
				current.subject = current.subject.replace(regObj, '['+difference+'d]');
			}
			else{
				current.subject = current.subject + ' ['+difference+'d]';
			}
			Trelloservice.updateCard({
				id: current.id,
				name: current.subject,
				due: current.from
			}).then(function(data){
				console.log(data);
			})
		}
	};*/

        $scope.clearData = function(){
            $scope.data = undefined;
        };

        $scope.loadData = function(data){
            $scope.data = data;
        };

	$scope.loadCardDetail = function(card){
		$modal.open({
			templateUrl: 'views/carddetail.html',
			controller: 'CarddetailsCtrl',
			resolve: {
				card: function () {
					return card;
				}
			}
		});
	}

        if(!Trelloservice.isUserLogged())
		$location.path('/');

	var boardID = $routeParams.boardID;
	if(boardID === null)
		$location.path('/');
	else{
                $scope.gantt  = {
                    headers: ['month','day'],
                    currentDate: 'column'
                };

		Trelloservice.getBoardInfo(boardID).then(function(board){
			$scope.board = board;
			generalSettings.setMemberCache(board.members);
		});
                $scope.updateGantt(boardID);
	}

});

obj[ '$inject' ] = ['$scope', 'Trelloservice', 'generalSettings', '$location', '$modal', '$routeParams'];
