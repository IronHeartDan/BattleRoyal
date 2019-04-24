var express = require('express');
var app = express();
var mysql = require('mysql');
var http = require('http').Server(app);
var io = require('socket.io')(http);


var Connection = mysql.createConnection({

 host:'104.197.12.6',
 user:'IronHeartDan',
 password:'Danish1915.',
  database:'battleroyal'

});


Connection.connect(function(err){
if (!!err){
console.log("Error...");
}else{
console.log("Connected To Database...");
} 
});



app.use(express.static('public'));


app.get('/', function(req, res) {
   res.sendfile('index.html');
});




//Whenever someone connects this gets executed

var Users = [];


io.on('connection', function(socket) {
   console.log('A Socket connected');




  socket.on("Sign-Up",function(data){

var Val ="SELECT * FROM users WHERE Email ='" + data.Email + "'";

 Connection.query(Val,function(err,result){

if(result == ""){


var Val ="SELECT * FROM users WHERE UserName ='" + data.UserName + "'";

 Connection.query(Val,function(err,result){

if(result == ""){


 var Val = "INSERT INTO users(Email,UserName,Password) VALUE(" + "'" + data.Email + "'" + "," + "'" + data.UserName + "'" + "," + "'" + data.Pass + "'" + ")";

 Connection.query(Val,function(err,result){

if(result != ""){

socket.emit("Sucess_SignUp");

}

});









} else{

socket.emit("UserName_fail");

}


}); // q2


} else {

socket.emit("Email_fail");

}

}); // q1




}); // signup








   socket.on("Login",function(data){



var Val = "SELECT * FROM users WHERE UserName ='" + data.Username + "' AND Password ='" + data.Pass +"'" ;



  Connection.query(Val , function (err,result){

if(result != ""){


var data = {"Email":result[0].Email ,"UserName":result[0].UserName , "Pass":result[0].Password , "FirstName":result[0].FirstName , "LastName":result[0].LastName};
socket.emit("Sucess_log",data);


Users.push({"UserName":result[0].UserName.toLowerCase(),"Socket_ID":socket.id});





Val = "SELECT * FROM requests WHERE To_User='"+ result[0].UserName +"' ORDER BY ID DESC" ;


Connection.query(Val,function(err,result_users_requests){

socket.emit("Users_Requests",result_users_requests);

});









}else{
socket.emit("Fail_log");
}

});

});



socket.on("Get_Friends",function(data){

Val = "SELECT * FROM friends WHERE UserName='"+ data +"' OR Friend='"+ data +"' ";


Connection.query(Val,function(err,result){



socket.emit("User_Friends",result);





});


});




socket.on("Accept",function(data){





Val = "INSERT INTO friends(UserName,Friend) VALUE('"+ data.UserName +"','"+ data.Friend +"')";

Connection.query(Val,function(err,result){



Val = "DELETE FROM requests WHERE From_User='"+ data.Friend.toLowerCase() + "' And To_User='"+ data.UserName.toLowerCase() +"'";

Connection.query(Val,function(err,result){

socket.emit("Accepted");

});


Val = "DELETE FROM requests WHERE From_User='"+ data.UserName + "' And To_User='"+ data.Friend +"'";

Connection.query(Val,function(err,result){



});




});



});




socket.on("Ignore",function(data){
Val = "DELETE FROM requests WHERE From_User='"+ data.Friend + "' And To_User='"+ data.UserName.toLowerCase() +"'";

Connection.query(Val,function(err,result){

socket.emit("Ignored");

});


});




socket.on("Requesting_Play",function(data){



var  X =0;

while(X<Users.length){



if(Users[X].UserName.toLowerCase() == data.To.toLowerCase()){



io.to(Users[X].Socket_ID).emit("Asking_Play",data.From);




}

X++;
}



});



socket.on("Accept_Play",function(data){

var Game_D_Arry = [];


var C_Tossed = [];

var X =0;
var Room = data.From + "_" +data.To;
console.log(Room);

var Client_1_Chance ="";
var Client_2_Chance ="";

var Client_1_Val ="";
var Client_2_Val ="";

while(X<Users.length){


if(Users[X].UserName.toLowerCase() == data.From.toLowerCase()){

io.sockets.connected[Users[X].Socket_ID].join(Room);




}else if(Users[X].UserName.toLowerCase() == data.To.toLowerCase()){

io.sockets.connected[Users[X].Socket_ID].join(Room);



}




X++;
}

io.sockets.in(Room).emit("Joined_Room",{"Client_1":data.From,"Client_2":data.To});



setTimeout(function(){

Toss = Math.floor(Math.random() * 2);


if(Toss == 0){
Client_1_Val = "X";
Client_2_Val = "O";
}else{
Client_1_Val = "O";
Client_2_Val = "X";
}


C_Tossed.push({"Client_1": data.From ,"Val": Client_1_Val });
C_Tossed.push({"Client_2": data.To ,"Val": Client_2_Val });


io.sockets.in(Room).emit("Val_Tossed",C_Tossed);


},2000);









setTimeout(function(){

Toss = Math.floor(Math.random() * 2);


if(Toss == 0){
Client_1_Chance = "1";
Client_2_Chance = "2";
}else{
Client_1_Chance = "2";
Client_2_Chance = "1";
}


C_Tossed = [];
C_Tossed.push({"Client_1": data.From ,"Chance": Client_1_Chance });
C_Tossed.push({"Client_2": data.To ,"Chance": Client_2_Chance });
C_Tossed.push({"Room":Room});



io.sockets.in(Room).emit("Chance_Tossed",C_Tossed);





Game_D_Arry.push({"Client_1":data.From,"Client_1_Val":Client_1_Val,"Client_1_Chance":Client_1_Chance});
Game_D_Arry.push({"Client_2":data.To,"Client_2_Val":Client_2_Val,"Client_2_Chance":Client_2_Chance});
Game_D_Arry.push({"Room":Room});

Game_On(Game_D_Arry);



},5000);









}); // Accepted Play Request




var Client_1 = "";
var Client_1_Val = "";
var Client_1_Chance = "";
var Client_1_Id ="";


var Client_2 = "";
var Client_2_Val ="";
var Client_2_Chance = "";
var Client_2_Id ="";



function Game_On(data){


function Game_Off(info){
	
	
if(info.From.toLowerCase() == Client_1.toLowerCase()){
	
	
		
		io.sockets.connected[Client_2_Id].leave(Room);
		io.sockets.connected[Client_2_Id ].emit("Player_Left");


	
}else{
	
	
	
	
	    io.sockets.connected[Client_1_Id].leave(Room);
		io.sockets.connected[Client_1_Id ].emit("Player_Left");
	
	
}




} //Game_Off








var Box1 ="";
var Box2 ="";
var Box3 ="";
var Box4 ="";
var Box5 ="";
var Box6 ="";
var Box7 ="";
var Box8 ="";
var Box9 ="";





Client_1 = data[0].Client_1;
Client_1_Val = data[0].Client_1_Val;
Client_1_Chance = data[0].Client_1_Chance;
Client_1_Id ="";


Client_2 = data[1].Client_2;
Client_2_Val = data[1].Client_2_Val;
Client_2_Chance = data[1].Client_2_Chance;
Client_2_Id ="";

var Room = data[2].Room;


var X=0;

while(X<Users.length){


if(Users[X].UserName.toLowerCase() == Client_1.toLowerCase()){

Client_1_Id =  Users[X].Socket_ID;

}else if(Users[X].UserName.toLowerCase() == Client_2.toLowerCase()){

Client_2_Id =  Users[X].Socket_ID;

}




X++;
}



                  // PLAYER LEFT IN ANY CASE


io.sockets.connected[Client_1_Id ].on("Exit_Req",function(Exit){
	
    Game_Off(Exit);

});

io.sockets.connected[Client_2_Id ].on("Exit_Req",function(Exit){
	
	Game_Off(Exit);

});




io.sockets.connected[Client_1_Id ].on('disconnect',function(){

	if(io.sockets.connected[Client_2_Id]){

		io.sockets.connected[Client_2_Id].leave(Room);
		io.sockets.connected[Client_2_Id ].emit("Player_Left");
	}

});




io.sockets.connected[Client_2_Id ].on('disconnect',function(){
	
	
	if(io.sockets.connected[Client_1_Id]){
	
	
		io.sockets.connected[Client_1_Id].leave(Room);
		io.sockets.connected[Client_1_Id ].emit("Player_Left");
	
	}
	

});




         // PLAYER LEFT IN ANY CASE END




function Change_Server_Chances(Changeit){



Client_1_Chance = Changeit[0].Client_1;
Client_2_Chance = Changeit[0].Client_2;




} // Server Chances




function Change_Scores(){


if((Box1 != "") && (Box2 != "") && (Box3 !="") && (Box4 != "") && (Box5 != "") && (Box6 !="") && (Box7 != "") && (Box8 != "") && (Box9 !="")){



var TIE_COMB = ["OOX","XOO","XXO","OXX","OXO","XOX"];
var Tied = [];

var X = 0;

while(X < TIE_COMB.length){


if (Box1 + Box2 + Box3 == TIE_COMB[X]){
Tied.push("1");
}


if (Box4 + Box5 + Box6 == TIE_COMB[X]){
Tied.push("2");
}

if (Box7 + Box8 + Box9 == TIE_COMB[X]){
Tied.push("3");
}


if(Box1 + Box5 + Box9 == TIE_COMB[X]){
Tied.push("4");
}

if(Box3 + Box5 + Box7 == TIE_COMB[X]){
Tied.push("5");
}

X++;
}



if(Tied.length == 5){

Send_Change_Scores("Tie");

}



} // TIE



if((Box1 != "") && (Box2 != "") && (Box3 !="")){

if((Box1 == Box2) && (Box2 == Box3)){

var Winner = Box1;

Send_Change_Scores(Winner);


}

} // If ! ""


if((Box4 != "") && (Box5 != "") && (Box6 !="")){

if((Box4 == Box5) && (Box5 == Box6)){

var Winner = Box4;

Send_Change_Scores(Winner);

}

} // If ! ""


if((Box7 != "") && (Box8 != "") && (Box9 !="")){

if((Box7 == Box8) && (Box8 == Box9)){

var Winner = Box7;

Send_Change_Scores(Winner);

}

} // If ! ""


if((Box1 != "") && (Box4 != "") && (Box7 !="")){

if((Box1 == Box4) && (Box4 == Box7)){

var Winner = Box1;

Send_Change_Scores(Winner);

}

} // If ! ""


if((Box2 != "") && (Box5 != "") && (Box8 !="")){

if((Box2 == Box5) && (Box5 == Box8)){

var Winner = Box2;

Send_Change_Scores(Winner);

}

} // If ! ""


if((Box3 != "") && (Box6 != "") && (Box9 !="")){

if((Box3 == Box6) && (Box6 == Box9)){

var Winner = Box3;

Send_Change_Scores(Winner);

}

} // If ! ""


if((Box1 != "") && (Box5 != "") && (Box9 !="")){

if((Box1 == Box5) && (Box5 == Box9)){
var Winner = Box1;

Send_Change_Scores(Winner);

}

} // If ! ""


if((Box3 != "") && (Box5 != "") && (Box7 !="")){

if((Box3 == Box5) && (Box5 == Box7)){

var Winner = Box3;

Send_Change_Scores(Winner);

}

} // If ! ""




} // Change Scores


io.sockets.connected[Client_1_Id ].on("Box_Clicked",function(Clicked_Info){

 Box_Clicked(Clicked_Info);



});


io.sockets.connected[Client_2_Id ].on("Box_Clicked",function(Clicked_Info){
 Box_Clicked(Clicked_Info);



});












function Box_Clicked(Clicked_Info){









if(Clicked_Info.UserName.toLowerCase() == Client_1.toLowerCase() ){






if(Client_1_Chance == 1){


var Box = Clicked_Info.Box;




if(Box == "box1"){

if(Box1 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box1 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box2"){

if(Box2 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box2 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box3"){

if(Box3 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box3 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box4"){

if(Box4 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box4 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box5"){

if(Box5 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box5 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box6"){

if(Box6 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box6 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box7"){

if(Box7 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box7 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box8"){

if(Box8 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box8 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box9"){

if(Box9 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_1);
Box9 = Client_1_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_1_Val});
var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
} 












// If Chance Else This

}else{

console.log("Incorrect Click");

}










}else{




if(Client_2_Chance == 1){


var Box = Clicked_Info.Box;







if(Box == "box1"){

if(Box1 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box1 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box2"){

if(Box2 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box2 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box3"){

if(Box3 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box3 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box4"){

if(Box4 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box4 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box5"){

if(Box5 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box5 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box6"){

if(Box6 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box6 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box7"){

if(Box7 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box7 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box8"){

if(Box8 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box8 = Client_2_Val;
io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
}


if(Box == "box9"){

if(Box9 == ""){
io.sockets.in(Room).emit("Chance_Noti",Client_2);
Box9 = Client_2_Val;

io.sockets.in(Room).emit("Board_Changed",{"Box":Box,"Val":Client_2_Val});
var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);
Change_Scores();
}
} 
























}else{

console.log("Incorrect Click");

}






} // If C1 or C2 End



} // Fun Box_Clicked




function Send_Change_Scores(data){




Box1 ="";
Box2 ="";
Box3 ="";
Box4 ="";
Box5 ="";
Box6 ="";
Box7 ="";
Box8 ="";
Box9 ="";


if(data == "Tie"){

io.sockets.in(Room).emit("Change_Scores",{"Winner":"Tie"});

}else if(data == Client_1_Val){
io.sockets.in(Room).emit("Change_Scores",{"Winner":Client_1,"Val":Client_1_Val});
io.sockets.in(Room).emit("Chance_Noti",Client_2);

var  GlobalChange = [{"Client_1":1,"Client_2":2}];
Change_Server_Chances(GlobalChange);


}else{
io.sockets.in(Room).emit("Change_Scores",{"Winner":Client_2,"Val":Client_2_Val});
io.sockets.in(Room).emit("Chance_Noti",Client_1);

var  GlobalChange = [{"Client_1":2,"Client_2":1}];
Change_Server_Chances(GlobalChange);

}






} // Fun Change Scores








} // Game ON











socket.on("Change_info",function(data){


if(data.Email){

var Val ="SELECT * FROM users WHERE Email ='" + data.Email + "'";

Connection.query(Val,function(err,result){

if(result == ''){


var Val = "UPDATE users SET Email='" + data.Email + "' WHERE Email='" + data.ORG_EMAIL + "'";

Connection.query(Val,function(err,result){

if(result != ""){
socket.emit("Changed_Email");
}
});


}else{
socket.emit("Change_E_Err");
}

});

















} // Email Changed...


if(data.UserName){

var Val ="SELECT * FROM users WHERE UserName ='" + data.UserName + "'";

Connection.query(Val,function(err,result){

if(result == ''){


var Val = "UPDATE users SET UserName='" + data.UserName + "' WHERE Email='" + data.ORG_EMAIL + "'";

Connection.query(Val,function(err,result){

if(result != ""){
socket.emit("Changed_UserName");
}
});


}else{
socket.emit("Change_U_Err");
}

});

} // UserName Changed...



if(data.FirstName){
var Val = "UPDATE users SET FirstName='" + data.FirstName + "' WHERE Email='" + data.ORG_EMAIL + "'";

Connection.query(Val,function(err,result){

if(result != ""){
socket.emit("Changed_FirstName");
}

});

} // FirstName Changed...



if(data.LastName){
var Val = "UPDATE users SET LastName='" + data.LastName + "' WHERE Email='" + data.ORG_EMAIL + "'";

Connection.query(Val,function(err,result){

if(result != ""){
socket.emit("Changed_LastName");
}

});

} // LastName Changed...

if(data.Pass){
var Val = "UPDATE users SET Password='" + data.Pass + "' WHERE Email='" + data.ORG_EMAIL + "'";

Connection.query(Val,function(err,result){

if(result != ""){
socket.emit("Changed_Pass");
}

});

} // Pass Changed...


});





var Clients = [];  // All Searched Clients
var Check = [];  // All Requested Clients
var Friends = []; // All Friends
var All = []; // All Searched Clients And Updated Requesred CLients
var X = 0;
var Y = 0;
var Z =0;

socket.on("Search_Users",function(data){


if(data.UserName !=''){



var Val = "SELECT UserName FROM users WHERE UserName LIKE '%"+ data.UserName +"%' And UserName !='"+ data.User +"'";

Connection.query(Val,function(err,result){

if(result != ''){
Clients = [];
X = 0;


while(X<result.length){
Clients.push({"UserName": result[X].UserName.toLowerCase() ,"Status":"Clear","Friend":"No"});
X++;
}





Val = "SELECT * FROM requests WHERE From_User ='"+ data.User +"'";

Connection.query(Val,function(err,filter){

Check = [];
Y = 0;

while(Y<filter.length){
Check.push(filter[Y].To_User);
Y++;
}




X = 0;
Y = 0;







while(X<Clients.length){





if(Check != ""){




Y=0;

while(Y<Check.length){





if(Clients[X].UserName == Check[Y]){

Clients[X].Status = "Requested";

}




Y++;
}







}







X++;
} // loop end check







Val = "SELECT * FROM 	friends WHERE UserName='" + data.User +"' OR Friend='"+ data.User +"'";


Connection.query(Val, function(err,friends){


if(result != ""){

Z=0;


while(Z<Clients.length){

XX =0;
while(XX < friends.length){



if(friends[XX].UserName.toLowerCase() == data.User.toLowerCase()){

if(Clients[Z].UserName.toLowerCase() == friends[XX].Friend.toLowerCase()){

Clients[Z].Friend = "Yes";


}



}else{

if(Clients[Z].UserName.toLowerCase() == friends[XX].UserName.toLowerCase()){

if(Clients[Z].UserName.toLowerCase() == friends[XX].UserName.toLowerCase()){

Clients[Z].Friend = "Yes";


}

}

}





XX++;
}




Z++;
}



}



 socket.emit("Users_Data",Clients);

});



















}); // Check QUERY




















} // result if
}); // Query Main

} // If Empty







}); // Socket












socket.on("Send_Request",function(data){

var Id;

Val = "SELECT * FROM requests WHERE To_User='"+ data.To.toLowerCase() +"'";


Connection.query(Val,function(err,result){

Id = result.length;






var Val = "INSERT INTO requests(Id,From_User,To_User) VALUE('"+ Id +"','"+ data.From +"','"+ data.To.toLowerCase() +"')";

Connection.query(Val , function(err,result){

if(result != ""){
socket.emit("Requested");


var X = 0;
while(X<Users.length){

if(Users[X].UserName == data.To.toLowerCase()){

io.to(Users[X].Socket_ID).emit("Got_A_REQUEST",data.From);


}


X++;
}

}

});


});
});






   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {



         var X=0;

  while(X<Users.length){

  if(Users[X].Socket_ID == socket.id){
        console.log( Users[X].UserName +' disconnected');
  Users.splice(X,1);

}



X++;
}

if(Users == ""){
console.log("Server Is Empty...");
}


   });
});

http.listen(80, function() {
   console.log('listening on *:80');
});
