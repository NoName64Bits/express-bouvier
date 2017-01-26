Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function getElementAttrs(el) {
  return [].slice.call(el.attributes).map((attr) => {
    if(attr.name != 'trigger'){
      return {
        name: attr.name,
        value: attr.value
      }
    }
    return null;
  });
}

var socket = io("http://localhost:3000");
  socket.on('connect', function() {
    socket.emit('bouvier-connect', {user: UUID});
  });
  socket.on('bouvier-update', function(data){
      if(data.id){
        if(data.content){
          $('#' + data.id).text(data.content);
        }
      } else if(data.class) {
        if(data.content){
          $('.' + data.class).text(data.content);
        }
      } else if(data.target) {
        $("[updateable]").each(function(i, obj){
          if($(obj).attr('from') == data.target){
            if(data.content){
              $(obj).text(data.content);
            }
          }
        });
      }
  });

  $(document).ready(function(){
    $(document).click(function(event){
      var attr = $(event.target).attr('trigger');
      if (typeof attr !== typeof undefined && attr !== false) {
        socket.emit('bouvier-trigger', {target: attr, attributes: getElementAttrs(event.target).clean(null), inside: $(event.target).text()});
      }
    });
  });
