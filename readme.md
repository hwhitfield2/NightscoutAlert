
# Nightscout Alert

This Node.JS application will query your Nightscout `deviceStatus` endpoint every 60 seconds. If your device hasn't checked in within the last 5 minutes this application will initiate a Twillio Studio Flow to notify additional parties there is a problem. 
## Deployment

You have a few options on how you deploy this project. I personally use Heroku because it is inexpensive and extremely easy to maintain.

    1. Fork this repository.
    2. Create a new app.
    3. Connect to GitHub.
    4. Search for the repository you forked. 
    5. Click Settings.
    6. Click Reveal Config Vars.
    7. Create the following config variables
        A. ACCOUNT_SID - Twilio Account SID (Can be found here: https://console.twilio.com/?frameUrl=/console)
        B. API_ENDPOINT - Nightscout API Endpoint (If using MyT1Pal, this can be found Configure -> Uploader)
        C. AUTH_TOKEN - Twilio Account Auth Token (Can be found here: https://console.twilio.com/?frameUrl=/console)
        D. FLOW_SID - Twilio Flow SID (Can be found under the flow settings, open the Flow Configuration, copy the REST API Url /Flows/xxxxxxxxxxxxxx/Executions)
        E. FROM_PHONE_NUMBER - The phone number assigned to your Twilio flow.
        F. TO_PHONE_NUMBERS - A list of comma separated phone numbers you want alerted. ['XXXXXXXXXX, XXXXXXXXXX']
## Support

For support, please join this Discord: https://discord.gg/WhD5gD5G

