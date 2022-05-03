//import dependencies
const request = require('superagent')
const jsforce = require('jsforce')
const ngrok = require('ngrok')
const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config()

//define variables 
const app = express()
const port = process.env.PORT
const sfdcUser = process.env.EMAIL
const sfdcPass = process.env.PASSWORD 
const driftToken = process.env.DRIFTTOKEN
// const ngrokAuth = process.env.NGROKAUTH
// const subdomain = process.env.SUBDOMAIN
const driftQueryUrl = `https://driftapi.com/contacts`

//leverage middleware for response/request objects
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//serve server locally
app.listen(port, () => {
  console.log(`App running locally on: http://localhost:${port}`);
});
//expose local webserver to internet
startNgrok = async () => {
  const url = await ngrok.connect(port)
  console.log(`Payload digestion for listening for emails URL is: ${url}/emailinput`)
}
startNgrok()

//create an SFDC connection 
const sfdc = new jsforce.Connection({});

//Listening for Drift Events 
app.post('/emailinput', async (req, res) => {
  try {
    let siteVisitorEmail = req.body.data.attributes.email
    let driftContactId = req.body.data.id
    let driftContactFirstName = req.body.data.attributes.first_name
    let driftContactLastName = req.body.data.attributes.last_name
    console.log(`This is the Drift ID of the site visitor who just entered email into chat -- ${driftContactId}`)
    console.log(`This is email a site visitor just entered into the chat -- ${siteVisitorEmail}`)
    console.log(`This is the full name of the site visitor in the chat -- ${driftContactFirstName} ${driftContactLastName}`)
    sfdc.login(sfdcUser, sfdcPass, (err, userInfo) => {
      if (err) { return console.error(err) }
      console.log(`Logged into SFDC successfully`)
      sfdc.search(`FIND {${siteVisitorEmail}} IN EMAIL FIELDS RETURNING Lead`, (err, res) => {
        if (err) { return console.error(err); }
        if (res.searchRecords.length < 1) {
          console.log(`There is no lead in SFDC with email ${siteVisitorEmail}`)
          sfdc.sobject("Lead").create({
            firstName: `${driftContactFirstName}`,
            lastName: `${driftContactLastName}`,
            Email: `${siteVisitorEmail}`,
            Company: `Placeholder Account`,
          }, (err, ret) => {
            if (err) { return console.error(err, ret); }
            console.log("Created record id : " + ret.id);
            request
              .patch(`${driftQueryUrl}/${driftContactId}`)
              .set('Content-type', 'application/json')
              .set('Authorization', `Bearer ${driftToken}`)
              .send({ 'attributes': { 'SFDCID': `${ret.id}` } })
              .then(res => {
                console.log(`Drift Contact with Unique ID ` + res.body.data.id + ` and Email ` + res.body.data.attributes.email + ` has been updated with an SFDCID of ${ret.id}`)
              })
              .catch(err => {
                return {
                  error: err.message
                }
              })
          })
        } else {
          let sfdcId = res.searchRecords[0].Id  //If there is more than one lead just pick the first one in the list as the SFDC API returns an array of leads when queried
          console.log(`This is the SFDC ID of the contact that just entered email into the chat -- ${sfdcId}`)
          request
            .patch(`${driftQueryUrl}/${driftContactId}`)
            .set('Content-type', 'application/json')
            .set('Authorization', `Bearer ${driftToken}`)
            .send({ 'attributes': { 'SFDCID': `${sfdcId}` } })
            .then(res => {
              console.log(`Drift Contact with Unique ID ` + res.body.data.id + ` and Email ` + res.body.data.attributes.email + ` has been updated with an SFDCID of ${sfdcId}`)
            })
            .catch(err => {
              return {
                error: err.message
              }
            })
        }
      }
      )

    })
  } catch (error) {
    console.error(error)
  }
})

