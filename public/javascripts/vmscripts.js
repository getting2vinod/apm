function refreshvm(card, vmname) {
    $(card).parent().parent().parent().find('.actionspinner').addClass("hidden").removeClass('fa-spin');
    $(card).addClass("fa-spin");
    $(card).parent().parent().parent().find('.vmip').html('');
    $(card).parent().parent().parent().find('.vmstate').html('');
    $(card).parent().parent().find('button').attr('disabled','disabled'); //disabling all the buttons untill complete
  //  debugger;
    $.get('/refresh/' + vmname, null, function (data) {
        if(data){
            var vmspec = JSON.parse(data);
            var rdp = $(card).parent().find('a[id="rdp_' + vmname + '"]');
            $(card).parent().parent().parent().find('.vmip').html(vmspec.IPAddress);
            if (vmspec.InstanceStatus == "ReadyRole"){
                $(card).parent().parent().parent().find('.vmstate').html('RUNNING');
                $(card).parent().parent().parent().find('button[class*="shutdownbtn"],button[class*="rebootbtn"]').removeAttr('disabled'); 
                $(rdp).removeClass('hidden');
                }
            else if(vmspec.InstanceStatus == "CreatingVM"){
                $(card).parent().parent().parent().find('.vmstate').html('STARTING');
                $(card).parent().parent().parent().find('button[class*="startbtn"],button[class*="rebootbtn"]').removeAttr('disabled'); 
                $('#refresh_' + vmname).attr('refresh','yes'); //set refresh tag to keep polling status once every 15 secs.
                $(rdp).addClass('hidden');
            }
            else{
                $(card).parent().parent().parent().find('.vmstate').html('STOPPED');
                $(card).parent().parent().parent().find('button[class*="startbtn"],button[class*="rebootbtn"]').removeAttr('disabled'); 
                $(rdp).addClass('hidden');
            }
            //Set port and vmname on RDP icon
            
            var port = '';
                for(var p = 0; p < vmspec.Network.Endpoints.length; p++){
                 // port += vm.Network.Endpoints[p]["name"];
                  if(vmspec.Network.Endpoints[p]["name"] == "Remote Desktop"){
                    port = vmspec.Network.Endpoints[p]["port"];
                  }
                }
            if(port != '') {
                $(rdp).attr("href",'/download/' + vmname + '/' + port );
            }


            $(card).removeClass("fa-spin");
        }
        else {
            $(card).removeClass("fa-spin");

        }
    });
    
}


function vmaction(card, action, vmname) {
    
    $(card).parent().parent().parent().parent().find('.actionspinner').addClass("fa-spin").removeClass('hidden');
    
    $(card).parent().parent().parent().parent().find('.vmstate').html(action.toUpperCase() + ' in progress');
    $(card).parent().parent().find('button').attr('disabled','disabled'); //disabling all the buttons untill complete
    // debugger;
   
    
    $.get('/azurevm/' + action + '/' + vmname, null, function (data) {
        if (data) {
            if(data.indexOf('OK') > 0){
                $(card).parent().parent().parent().parent().find('.actionspinner').addClass("hidden").removeClass('fa-spin');
                
                if(action == 'start'){
                    $(card).parent().parent().find('button[class*="shutdownbtn"],button[class*="rebootbtn"]').removeAttr('disabled'); 
                    $(card).parent().parent().parent().parent().find('.vmstate').html('RUNNING');
                }
                if(action == 'shutdown'){
                    $(card).parent().parent().find('button[class*="startbtn"],button[class*="rebootbtn"]').removeAttr('disabled'); 
                    $(card).parent().parent().parent().parent().find('.vmstate').html('STOPPED');
                }
                if(action == 'restart'){
                    $(card).parent().parent().find('button').removeAttr('disabled'); 
                    $(card).parent().parent().parent().parent().find('.vmstate').html(action.toUpperCase() + 'ed');
                }
                
                //$(card).parent().parent().parent().parent().find('a[id*="refresh"]').attr('refresh','true');
                $('#refresh_' + vmname).attr('refresh','yes');
               // alert($('#refresh_' + vmname).attr('refresh'));
            }
        }
        else {
            $(card).parent().parent().parent().parent().find('.vmstate').html('');
            $(card).parent().parent().parent().parent().find('.actionspinner').addClass("hidden").removeClass('fa-spin');
        }
    }); 

}

//Setting the timer to refresh cards 

function checkAndrefreshCard(){
$('a[id*="refresh"]').each(function(){
  if($(this).attr("refresh")){
    $(this).removeAttr('refresh');
    $(this).trigger('click');
  }
});

}
var timer = setInterval(checkAndrefreshCard, 30000); 