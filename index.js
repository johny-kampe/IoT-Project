const app = require('express')(); //loading express module
const http = require('http').createServer(app);  //creating server
const io = require('socket.io')(http); //loading socket.io module using HTTP transport
const parser = require('body-parser'); //loading body-parser module
const Data = require('nedb'); //loading nedb module
const nodemailer = require('nodemailer'); //loading nodemailer module
require('dotenv').config(); //for database security  


var temp_old_value = 0; //inserting the previous value of temperature
var temp_flag = 0; //flag to check if we got the previous value of temperature
var temp_result = 0; //inserting the percentage difference of temperature

var hum_old_value = 0; //inserting the previous value of air humidity
var hum_flag = 0; //flag to check if we got the previous value of air humidity
var hum_result = 0; //inserting the percentage difference of air humidity

var temp_list = []; //we need the lists to send the data to client
var air_list = [];
var ground_list = [];
var beauf_list = [];

var temp_count = 0; //our lists will have 10 values so we need counters to insert and update the values
var air_count = 0;
var ground_count = 0;
var beauf_count = 0;

app.use(parser.urlencoded({extended: true})); //precises that the request.body object will contain values of any type instead of just strings

const database = new Data('rasp_measurements.db'); //creating database with name rasp_measurements.db
database.loadDatabase(); //loading database or creating it if it doesn't exist


function calculate(old, neww){ //calculating the percentage difference between the old and the new measure
	return (neww-old)/old*100;
}


app.get('/', (req,res) => { //sending the page.html as a result of clients request
	res.sendFile(__dirname + '/page.html');
});

app.post('/', (request, response) => { //server sends data to Gmail, database and the client
	let transporter = nodemailer.createTransport({//to notify the client we need specify the name of the email service we will use
		service: 'gmail',
		auth: { //the file .env has the email and password and the file .gitignore makes sure the file .env never gets pushed
			user: process.env.EMAIL, 
			pass: process.env.PASSWORD
		}
	});

	if (request.body[0]){ 
		if(temp_flag == 0){ //if we don't have the previous value then..		
			temp_old_value = request.body[0]; //..insert it to temp_old_value
			temp_flag = 1;	//then set temp_flag to 1	
		} else if(temp_flag == 1){ //now that we have the previous value we will get the new value..
			console.log('Old value:',temp_old_value,', New value:',request.body[0]);
			temp_result = calculate(temp_old_value, request.body[0]); //..to find the percentage defference between the new and old value

			console.log('Temperature percentage difference:',temp_result.toFixed(1) + "%!\n");
			database.insert({measure: 'temperature',value:parseInt(request.body[0])}); //inserting the new values to database	
			temp_flag = 0; //making temp_flag = 0 to do the same things for the next values
		
			temp_list[temp_count] = parseInt(request.body[0]); //inserting the new value to list temp_list at temp_count position
			console.log('List of temperatures:',temp_list); //for better understanding
			temp_count +=1; //increasing the temp_count counter

			if(temp_count == 10){ //if we have 10 values in the list then insert at the 11th position the correct id (0 for temperature)
				temp_list[temp_count] = 0; //inserting the correct id
				temp_count = 0; //start from the begining and update the values

				io.on('connection', socket => { //then send the list to client
					console.log('We have a connection');
					socket.emit('graph', temp_list);			
				});
			}

			if(temp_result > 40){ //if temperature increased by 50% then send an email to kampe.test@gmail.com to warn him

				let mailOptions = { 
					from: process.env.EMAIL,
					to: 'kampe.test@gmail.com',
					subject: 'ATTENTION',
					text: 'Temperature increased alot!'
				};
			
				transporter.sendMail(mailOptions, function(err, data) { //sending the email
					if (err){
						console.log('Error Occurs');
					} else {
						console.log('Email sent (for temperature).');
					}
				});
			}
		}
	} else if (request.body[1]) {
		if(hum_flag == 0){	//if we don't have the previous value then..				
			hum_old_value = request.body[1]; //..insert it to temp_old_value		
			hum_flag = 1;	//then set temp_flag to 1		
		} else if(hum_flag == 1){ //now that we have the previous value we will get the new value..
			console.log('Old value:',hum_old_value,', New value:',request.body[1]);
			hum_result = calculate(hum_old_value, request.body[1]);//..to find the percentage defference between the new and old value

			console.log('Air humidity percentage difference:',hum_result.toFixed(1) + '%!');
			database.insert({measure: 'air humidity',value:parseInt(request.body[1])}); //inserting the new values to database	
			hum_flag = 0;	//making hum_flag = 0 to do the same things for the next values

			air_list[air_count] = parseInt(request.body[1]); //inserting the new value to list air_list at air_count position
			console.log('List of air humidity:',air_list); //for better understanding
			air_count +=1; //increasing the air_count counter

			if(air_count == 10){ //if we have 10 values in the list then insert at the 11th position the correct id (1 for air humidity)
				air_list[air_count] = 1; //inserting the correct id
				air_count = 0; //start from the begining and update the values

				io.on('connection', socket => { //then send the list to client
					console.log('We have a connection');
					socket.emit('graph', air_list);			
				});
			}

			if(hum_result < 50){ //if humidity decreased by 50% then send an email to kampe.test@gmail.com to warn him
				let mailOptions = {
					from: process.env.EMAIL,
					to: 'kampe.test@gmail.com',
					subject: 'ATTENTION',
					text: 'Humidity decreased alot!'
				};

				transporter.sendMail(mailOptions, function(err, data) { //sending the email
					if (err){
						console.log('Error Occurs');
					} else {
						console.log('Email sent (for air humidity).');
					}
				});			
			}		
	
		}
	} else if (request.body[2]) {
		ground_list[ground_count] = parseInt(request.body[2]); //inserting the new value to list ground_list at ground_count position
		console.log('List of air humidity:',ground_list); //for better understanding
		ground_count +=1; //increasing the air_count counter

		if(ground_count == 10){ //if we have 10 values in the list then insert at the 11th position the correct id (2 for ground humidity)
			ground_list[ground_count] = 2; //inserting the correct id
			ground_count = 0; //start from the begining and update the values

			io.on('connection', socket => { //then send the list to client
				console.log('We have a connection');
				socket.emit('graph', ground_list);			
			});
		}
		console.log('Ground humidity value: ',request.body[2]);
		database.insert({measure: 'ground humidity',value:parseInt(request.body[2])}); //inserting the new values to database	

	} else if (request.body[3]) {
		beauf_list[beauf_count] = parseInt(request.body[3]); //inserting the new value to list beauf_list at beauf_count position
		console.log('List of beaufort:',beauf_list); //for better understanding
		beauf_count +=1; //increasing the air_count counter

		if(beauf_count == 10){ //if we have 10 values in the list then insert at the 11th position the correct id (3 for beaufort)
			beauf_list[beauf_count] = 3; //inserting the correct id
			beauf_count = 0; //start from the begining and update the values

			io.on('connection', socket => { //then send the list to client
				console.log('We have a connection');
				socket.emit('graph', beauf_list);			
			});
		}
		console.log('Ground beaufort value: ',request.body[3]);
		database.insert({measure: 'beaufort',value:parseInt(request.body[3])}); //inserting the new values to database	

	}

	response.end(); //ending the event

}); 

http.listen(3000, () => { console.log('Server is listening...'); }); //listening at port 3000

