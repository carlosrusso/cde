
var NewMapComponent;
if (pen._modules)
 NewMapComponent = pen._modules['cde/components/Map/Map'];

require(['cde/components/Map/Map'], function(Map){
  NewMapComponent = Map;
});