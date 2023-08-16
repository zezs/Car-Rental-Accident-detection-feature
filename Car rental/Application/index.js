const neo4j = require('neo4j-driver');
const res = require('express/lib/response');
const { request } = require('express');
const uri = 'bolt://localhost:7687';
const user = 'neo4j';
const password = '123';
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static("www"));
app.listen(3000);

const mongoURI = 'mongodb://localhost:27017';
const { calculateObjectSize } = require('bson');
const { MongoClient } = require('mongodb');

const client = new MongoClient(mongoURI);
app.post("/con", async (req, res) => {
    let suspectedTrips = [];
    let responseDetails = [];
    let pathMatched =[];
    let userLat = req.body.lat;
    let userLon = req.body.lon;
    let carColor = req.body.color;
    let userDate = new Date(req.body.date);
    await client.connect();
    let filter = {};
    const db = client.db('CarRental');
    const coll = db.collection('TripsNew');
    // if (carColor != '')
    //     filter = { color: carColor };
    const allTrips = await coll.find().toArray();
    allTrips.forEach(async (trip) => {
        const tripStart = new Date(trip.trip_startDate);
        const tripEnd = new Date(trip.trip_endDate);
        console.log(userDate, tripStart, tripEnd);
        if (userDate >= tripStart && userDate <= tripEnd)
            suspectedTrips.push(trip);
            // console.log(suspectedTrips);
        })
            suspectedTrips.forEach(async trip => {
                if(checkTrips(trip, userLat, userLon))
                    console.log('Hello');
                    pathMatched.push(trip);
            })
    //console.log(pathMatched);
    const carColl = db.collection('Cars');
    for(let i=0;i<pathMatched.length;i++){
        const car_id = pathMatched[i].car_id;
        const car = await carColl.findOne({id:car_id});
        pathMatched[i].car = car;
    }
   // console.log(pathMatched);
    res.send(pathMatched);
})

async function checkTrips(trip,userLat, userLon){
    path = trip.path;
    suspectedCar =false;
    //console.log(suspectedTrips);
        //console.log(path);
        for(let i=0; i< path.length; i++){
            let lat = path[i].latitude;
            let lon = path[i].longitude;
    
            const session = driver.session();
            await session.run('MATCH (p) DELETE (p)');
            const create = await session.run(`CREATE(P:path{lat:${lat}, lon:${lon}}) return P`);
            const reply = await session.run(`MATCH (P:path)
            WITH point({latitude:P.lat, longitude:P.lon}) as P1, point({latitude:toFloat(${userLat}),longitude:toFloat(${userLon})}) as P2
            return point.distance(P1, P2)/1000`);
            reply.records.forEach(record=>{
                //console.log(record._fields[0]);
                if(record._fields[0]<=2000)
                suspectedCar = true;
            })

        }
        if(suspectedCar)
        return true;
}