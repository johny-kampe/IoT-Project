import requests, json, random
from time import sleep

url = 'http://localhost:3000'
old = [0, 0, 0, 0] #list to hold the previous values
new = [0, 0, 0, 0] #list to hold the new values
names = ["temperature", "air humidity", "ground humidity", "beaufort"]
flag = 0
diff = 0
timer = 0

while True:
	temp = random.randint(15,45) #Temperature
	ahum = random.randint(0,100) #Air humidity	
	ghum = random.randint(0,100) #Ground humidity
	wind = random.randint(0,17) #Beaufort (Bofor)
	
	print("Temperature:",temp)
	print("Air humidity:",ahum)
	print("Ground humidity:",ghum)
	print("Beaufort:",wind,"\n")

	new[0]=temp #assigning to list new the new values
	new[1]=ahum
	new[2]=ghum
	new[3]=wind
	
	if flag == 1: #we don't want to do calculations with zeros
		print("New temperature: ",new[0], ", Old temperature: ", old[0])
		print("New air humidity: ",new[1], ", Old air humidity: ", old[1])
		print("New ground humidity: ",new[2], ", Old ground humidity: ", old[2])
		print("New beaufort: ",new[3], ", Old beaufort: ", old[3],"\n")

		if timer==10: #if 5 minutes have passed then send the new values to server (10 x 30secs = 300 secs = 5 mins) 
			print("Send to server: 5 mins passed!")#send all the new data to server

			data = {0:new[i]} #sending the new value of temperature 
			r = requests.post(url, data) #sending a json object to the specified url

			data = {1:new[i]} #sending the new value of air humidity
			r = requests.post(url, data) #sending a json object to the specified url

			data = {2:new[i]} #sending the new value of ground humidity 
			r = requests.post(url, data) #sending a json object to the specified url

			data = {3:new[i]} #sending the new value of beaufort
			r = requests.post(url, data) #sending a json object to the specified url

		else:
			for i in range(4): 
				if (new[i] == 0) and (old[i] == 0): #if the previous value and the new one are 0 then continue
					continue
				elif old[i] == 0: #we can't devide a number with zero
					if new[i] > 2: #check if the new value is above 2 (10%)
						diff = new[i]
				elif new[i] == 0: #if the new value is 0 then
					if old[i] > 2: #check if the old value is above 2 (10%)
						diff = old[i]
				else:
					diff = round((abs((new[i]-old[i]))/old[i])*100,2) #calculating percentage difference
					print("Percentage difference of",names[i],":",diff) 
					
				if diff > 10: #if the new and old values differ by 10 then send the new value to server
					timer = 0
					print('Sending to server (10%)...')
					
					if(i == 0):

						data = {0:old[i]} #sending the old value
						r = requests.post(url, data)
						data = {0:new[i]} #sending the new value

					elif(i == 1):

						data = {1:old[i]} #sending the old value
						r = requests.post(url, data)
						data = {1:new[i]} #sending the new value

					elif(i == 2):

						data = {2:new[i]} #sending the old value
					
					elif(i == 3):

						data = {3:new[i]} #sending the old value
						
					r = requests.post(url, data) #sending a json object to the specified url
		
		print('\n')
							
	sleep(5) #produce data every 30 seconds
	timer+=1


	old[0]=temp #assigning to list old the old values
	old[1]=ahum
	old[2]=ghum
	old[3]=wind
	
	flag = 1

