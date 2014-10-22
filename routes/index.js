var express = require('express');
var process = require('child_process');
var router = express.Router();
var fs = require('fs');
var ActiveDirectory = require('activedirectory');
var path = require('path');



var users = require('./../users.json');
var vmlistforuser = [];
/* GET home page. */

/*
router.get('/*', function (req, res) {
    console.log('Entered');
    if (!req.session.user)
        res.render('login', {});
});
*/

function loadJSONfile (filename, encoding) {
    try {
        // default encoding is utf8
        if (typeof (encoding) == 'undefined') encoding = 'utf8';
        
        // read file synchroneously
        var contents = fs.readFileSync(filename, encoding);

        // parse contents as JSON
        return JSON.parse(contents);
        
    } catch (err) {
        // an error occurred
        throw err;  
    }
} // loadJSONfile
var user = {name:null};


router.get('/login', function (req, res) {
    console.log('Entered');
    //req.session.user = null;
    console.log("Session:",req.session.user);
    user.name = null;
    req.session.user = user;
    //req.session = null;
    req.session.destroy();
    res.render('login', {});
});

router.get('/authenticate/:username/:password', function (req, res) {
    req.session.user = user;
    console.log(req.params.username,req.params.password);
    var ad = new ActiveDirectory({url:'ldap://rlindia.com',baseDN: 'OU=Users,DC=rlindia,DC=com'});

    ad.authenticate('rlindia\\' + req.params.username,req.params.password,function(err,auth){
        if(err){
            console.log('Error:' + JSON.stringify(err));
        }
        if (auth) {
    console.log('Authenticated!');
    user.name = req.params.username;
    res.send('OK');
  }
  else {
    console.log('Authentication failed!');
    res.send("bad");
  }


    }); 

   

   /* console.log('Entered ' + req.params.username);
    if(req.params.username){
        if(req.params.password == 'sd1'){
            req.session.user.name = req.params.username;
            res.send("OK");
        }
        else
            res.send("bad");
    }
    else
        res.send('bad'); */
    
}); 

router.get('/refreshvmlist', function (req, res) {
    console.log(req.session);
    if(!req.session.user){
        req.session.user = null;
        res.render('login', {});
        return;
    }

        var ls = process.exec('azure vm list --json', function (err, stdout, stderr) {
            if (err) {
                console.log(err.stack);
                console.log('Error code: ' + err.code);
                console.log('Signal received: ' + err.signal);
            }
            if (stdout) {
                console.log('stdout: ' + stdout);
                fs.writeFile("./vmlist.json", JSON.stringify(JSON.parse(stdout)) , function(err){
                    if (err) {console.log(err);res.send('Error');return;}
                    res.send('OK');
                    return;
                });
            }
            else{
                res.send('Error');
                return;
            }
        });

});


function renderVMList(vmlist,req,res){
    if(users){
        //users = loadJSONfile(__dirname +'/users.json');
        console.log('Users :', users);
        console.log('Session User',req.session.user.name)
       // users = JSON.parse(users);
      /*  for(var i = 0; i < users.length;i++){
            users[i].forEach(function(key,value){
                console.log(key,value);
            });
        } */

        for(var key in users){
            console.log(key,users[key]);
            for(var key1 in users[key]){
                if(key1 == req.session.user.name)
                    vmlistforuser = users[key][key1];
                console.log("key:",key1," Value",users[key][key1]);
            }
        }
        console.log("Nodes for user : ", users.length);

        console.log('recvd for vm list ' + vmlistforuser[0]);
        if(vmlistforuser[0] != "all"){
                for(var vm in vmlist){
                    

                }

                for(var i = 0;i < vmlistforuser.length;i++){
                    console.log('In vm filter : ' + vmlistforuser[i]);
                    //check if vm in vmlist 
                    for(var j =0;j<vmlist.length;j++){
                        if(vmlistforuser[i] == vmlist[j]["VMName"]){
                            vmlist1.push(vmlist[j]);
                        }
                    }
                    console.log(i,vmlistforuser.length - 1);
                    if(i >= vmlistforuser.length - 1){
                        console.log(req.session.user.name,"vmlist - filtered",JSON.stringify(vmlist1));
                             res.render('index', { username : req.session.user.name , vmlist :  JSON.stringify(vmlist1)});
                    }
                }
            }
            else{
                        console.log(req.session.user.name,"vmlist - full",JSON.stringify(vmlist));
                            res.render('index', { username : req.session.user.name , vmlist :  JSON.stringify(vmlist)});
            }

            console.log('Out of loop');

    }

}


router.get('/', function (req, res) {
    console.log(req.session);
    if(!req.session.user){
        req.session.user = null;
        res.render('login', {});
        return;
    }
    var vmlist = null;
    fs.readFile(path.resolve(__dirname, 'vmlist.json'), function(err, data){
            if(err){
                console.log(__dirname + err);
                res.send('error');
            }
            else{
                console.log('File Read' + data);
                var vmlist = JSON.parse(data);
                if(vmlist[0].DNSName == undefined){
                    //Decide if a refech is required.
                    console.log('Refresh Required');

                    var ls = process.exec('azure vm list --json', function (err, stdout, stderr) {
                        if (err) {
                            console.log(err.stack);
                            console.log('Error code: ' + err.code);
                            console.log('Signal received: ' + err.signal);
                        }
                        if (stdout) {
                            console.log('stdout: ' + stdout);
                            fs.writeFile(path.resolve(__dirname, 'vmlist.json'),stdout,function(err,data){
                                if (err) {
                                    return console.log(err);
                                  }
                                vmlist = JSON.parse(stdout);
                                renderVMList(vmlist,req,res);
                            });
                            
                        }
                    });
                }
                else
                {
                    renderVMList(vmlist,req,res);
                }
        }
    });
    

    
    
});

router.get('/download/:vmname/:port',function(req,res){

res.setHeader('Content-disposition', 'attachment; filename='+ req.params.vmname + '.rdp');
res.setHeader('Content-type', 'rdp');
//res.charset = 'UTF-8';
var rdptext = "full address:s:" + req.params.vmname + ".cloudapp.net:"+ req.params.port + "\n\r";
rdptext += "prompt for credentials:i:1"
res.write(rdptext);
res.end();

});

router.get('/testing', function (req, res) {
    if(!req.session.user.name){
        req.session.user.name = null;
        res.render('login', {});
    }
    console.log(req.session.user.name);
    if(users){
        //users = loadJSONfile(__dirname +'/users.json');
        console.log('Users :', users);
       // users = JSON.parse(users);
      /*  for(var i = 0; i < users.length;i++){
            users[i].forEach(function(key,value){
                console.log(key,value);
            });
        } */

        for(var key in users){
            for(var key1 in users[key]){
                if(key1 == req.session.user.name)
                    vmlistforuser = users[key][key1];
                console.log("key:",key1," Value",users[key][key1]);
            }
        }
        console.log("Nodes for user : ", users.length);
    }
    res.render('test', { title: 'Express' });
});

router.get('/refresh/:vmname', function (req, res) {
     if(!req.session.user["name"]){
        req.session.user = null;
        res.render('login', {});
    }
    console.log('recvd for ' + req.params.vmname);
    var ls = process.exec('azure vm show ' + req.params.vmname + ' --json', function (err, stdout, stderr) {
        if (err) {
            console.log(err.stack);
            console.log('Error code: ' + err.code);
            console.log('Signal received: ' + err.signal);
        }
        if (stdout) {
            console.log('stdout: ' + stdout);
            res.end(stdout);
            
            //res.render('index', { title: 'VM List', vmlist: vmlist });
            //var vms = JSON.parse(stdout);
            //vms.forEach(function (vm) {
            //    console.log(vm.VMName + ":" + vm.InstanceStatus);
            //});
        }
        if (stderr) {
            console.log('stderr: ' + stderr);
            res.end('[{Error}]');
        }

    });

});



router.get('/azurevm/:action/:vmname', function (req, res) {
     if(!req.session.user.name){
        req.session.user.name = null;
        res.render('login', {});
    }

    console.log('recvd for ' + req.params.vmname);

    var ls = process.exec('azure vm ' + req.params.action + ' ' + req.params.vmname , function (err, stdout, stderr) {
        if (err) {
            console.log(err.stack);
            console.log('Error code: ' + err.code);
            console.log('Signal received: ' + err.signal);
            res.send(500);
        }
        if (stdout) {
            console.log('stdout: ' + stdout);
            res.end(stdout);

            //res.render('index', { title: 'VM List', vmlist: vmlist });
            //var vms = JSON.parse(stdout);
            //vms.forEach(function (vm) {
            //    console.log(vm.VMName + ":" + vm.InstanceStatus);
            //});
        }
        if (stderr) {
            console.log('stderr: ' + stderr);
            res.end('[{Error}]');
        }

    });

});

router.get('/refreshvmjson', function (req, res) {
    console.log(req.session);
    if(!req.session.user){
        req.session.user = null;
        res.render('login', {});
        return;
    }
    fs.writeFile(path.resolve(__dirname, 'vmlist.json'),'[{}]',function(err,data){
        if (err) {
            return console.log(err);
          }
    });
    res.redirect('/');
});

router.get('/fetchvms', function (req, res) {
    console.log(req.session);
    if(!req.session.user){
        req.session.user = null;
        res.render('login', {});
        return;
    }
    var vmlist = null;
    fs.readFile(path.resolve(__dirname, 'vmlist.json'), function(err, data){
            if(err){
                console.log(__dirname + err);
                res.send('error');
            }
            else{
                console.log('File Read' + data);
                var vmlist = JSON.parse(data);
                if(vmlist[0].DNSName == undefined){
                    //Decide if a refech is required.
                    console.log('Refresh Required');

                    var ls = process.exec('azure vm list --json', function (err, stdout, stderr) {
                        if (err) {
                            console.log(err.stack);
                            console.log('Error code: ' + err.code);
                            console.log('Signal received: ' + err.signal);
                        }
                        if (stdout) {
                            console.log('stdout: ' + stdout);
                            fs.writeFile(path.resolve(__dirname, 'vmlist.json'),stdout,function(err,data){
                                if (err) {
                                    return console.log(err);
                                  }
                                vmlist = JSON.parse(stdout);
                                renderVMList(vmlist,req,res);
                            });
                            
                        }
                    });
                }
                else
                {
                    renderVMList(vmlist,req,res);
                }
        }
    });
    
});



module.exports = router;
