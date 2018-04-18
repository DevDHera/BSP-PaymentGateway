# BSP - Payment Gateway

>A simple payment gateway for BSP Customers. An initiative taken when creating BSP - Good Will Hunting. 



### System Overview

A simple Gateway for BSPs. Receive the handle send by BSP through mail and just simply do your tasks.

### Technologies Used

* Node.js      
* Express.js
* Passport.js
* MongoDB
* Nexmo
* Socket.io

### Steps To Run

1. Install the modules.
```bash
npm install
```
2. Simply Run the App.
```bash
npm start
```

### Sample Codings

Lot of times we are under the wrong preemption of paying money for free services. SMS sending through applications is like that. 

Here is how I achived this for free.

#### How to send SMS

```javascript
nexmo.message.sendSms('NEXMO', number, smsmessage, {type: 'unicode'},
                                                    (err, responseData) => {
                                                        if(err){
                                                            console.log(err);
                                                        }else{
                                                            console.dir(responseData);
                                                        }
                                                    }
                                                )
```

### Tasks To Achive

* [x] Nexmo Intergration
* [x] Socket.io intergration
* [ ] Real Time pushes  
