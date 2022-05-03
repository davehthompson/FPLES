# FPLES Drift to Form 

FPLES needs to be able to reference data from Drift and SFDC to auto populate a form on a SFDC communities page in order to provide a great user experience for their enrollment flow. They do not want to have a site visitor provide information to Drift and then have to provide that same information during their enrollment process. By providing a SFDC ID as a query paramater on the SFDC community page FPLES will be able to automatically fill in the form data based off of that ID. 

# Application Logic
Server side application written in Node that listens for when a site visitor enters their email address and checks SFDC for logic pertaining to creating a new lead or referencing an already established lead to gather it's unique SFDC ID to send back to Drift. 



