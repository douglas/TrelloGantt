'use strict';

angular.module('trelloGanttApp')
.factory('generalSettings', function () {
	var _members = null;

	return {
		/*MEMBER SETTINGS*/
		setMemberCache: function(members){
			_members = members;
		},
		getMemberCache: function(memberID){
			if(memberID === undefined){
				return _members;
			}
			else{
				for (var i = _members.length - 1; i >= 0; i--) {
					var m = _members[i];
					if(m.id === memberID)
						return m;
				}
			}
		}
	};
});
