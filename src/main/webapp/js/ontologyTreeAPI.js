/* 
 * The following JavaScript functions allow you to interact with the Jquery BioPortal Ontology Tree.  
 */

var NEWTREE_afterSelect = function(event, classId, prefLabel, selectedNode){
	  
	  var ontoIndex = prefLabel.attr("href").indexOf("/ontologies/");
	  var clasIndex = prefLabel.attr("href").indexOf("/classes/");
	  
	  var ontology = prefLabel.attr("href").substring(ontoIndex+12,clasIndex);
	  var conceptId = prefLabel.attr("data-id");
	  
	  lookupAnnotationParam([{name:'ontologyID', value:ontology}, {name:'nodeID', value:conceptId}]);
};

var NEWTREE_afterJumpToClass = function(event, classId){
	var classObj = widget_tree.selectedClass();
	
	var ontoIndex = classObj.URL.indexOf("/ontologies/");
	var clasIndex = classObj.URL.indexOf("/classes/");
	
	var ontology = classObj.URL.substring(ontoIndex+12,clasIndex);
	var conceptId = classObj.id;
	  
	lookupAnnotationParam([{name:'ontologyID', value:ontology}, {name:'nodeID', value:conceptId}]);
};
