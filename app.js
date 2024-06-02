const axios = require('axios');
const cron = require('node-cron');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const moment = require('moment-timezone');
const app = express();
const port = process.env.PORT || 3000;
const YAML = require('yamljs');
const path = require('path');
const { format } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
require('dotenv').config();

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const FLOW_SID = process.env.FLOW_SID;
const FROM_PHONE_NUMBER = process.env.FROM_PHONE_NUMBER;
const TO_PHONE_NUMBERS = process.env.TO_PHONE_NUMBERS.split(',');
const API_ENDPOINT = process.env.API_ENDPOINT;
const API_KEY = process.env.API_KEY;
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yml'));

let lastEventCheckTime = null;
const COOLDOWN_PERIOD = 30 * 60 * 1000;

const getPhoenixTimestamp = () => {
  return moment().tz("America/Phoenix").format('YYYY-MM-DD HH:mm:ss Z');
};

const triggerStudioFlow = async (toPhoneNumber) => {
  const url = `https://studio.twilio.com/v2/Flows/${FLOW_SID}/Executions`;

  const data = new URLSearchParams({
    To: toPhoneNumber,
    From: FROM_PHONE_NUMBER,
    Parameters: JSON.stringify({ custom_parameter: 'custom_value' })
  });

  const auth = {
    username: ACCOUNT_SID,
    password: AUTH_TOKEN
  };

  try {
    const response = await axios.post(url, data, {
      auth,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log(`[${getPhoenixTimestamp()}] Flow triggered successfully for ${toPhoneNumber}: ${response.data.sid}`);
  } catch (error) {
    console.error(`[${getPhoenixTimestamp()}] Error triggering flow for ${toPhoneNumber}:`, error.response ? error.response.data : error.message);
  }
};

const checkEvents = async () => {
    try {
      const currentTime = new Date();
      const fiveMinutesAgo = new Date(currentTime - 5 * 60 * 1000);
      const queryParams = {
        'find[created_at][$gte]': fiveMinutesAgo.toISOString()
      };
  
      const headers = {
        'Authorization': `Bearer ${API_KEY}`
      };
  
      console.log(`[${getPhoenixTimestamp()}] Query params:`, queryParams);
      console.log(`[${getPhoenixTimestamp()}] Headers:`, headers);
      console.log(`[${getPhoenixTimestamp()}] API endpoint:`, API_ENDPOINT);
  
      const response = await axios.get(API_ENDPOINT, { params: queryParams });
  
      if (response.status === 200) {
        const data = response.data;
        console.log(`[${getPhoenixTimestamp()}] Event data:`, data);
        if (data.length === 0) {
          if (!lastTriggerTime || currentTime - lastTriggerTime >= COOLDOWN_PERIOD) {
            for (const toPhoneNumber of TO_PHONE_NUMBERS) {
              await triggerStudioFlow(toPhoneNumber);
            }
            lastTriggerTime = currentTime;
          } else {
            console.log(`[${getPhoenixTimestamp()}] Skipping trigger due to cooldown period.`);
          }
        }
        return data; 
      } else {
        console.log(`[${getPhoenixTimestamp()}] Failed to fetch events.`);
        return null;
      }
    } catch (error) {
      console.error(`[${getPhoenixTimestamp()}] Error checking events:`, error.response ? error.response.data : error.message);
      return null;
    }
  };


cron.schedule('* * * * *', checkEvents);

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); 
});

app.post('/check-events', async (req, res) => {
  try {
    const eventData = await checkEvents();
    if (eventData) {
      res.json({ message: 'Events checked successfully', data: eventData });
    } else {
      res.status(500).json({ message: 'No events data returned or error occurred.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking events', error: error.message });
  }
});

app.post('/trigger-flow', async (req, res) => {
    try {
        for (const toPhoneNumber of TO_PHONE_NUMBERS) {
            await triggerStudioFlow(toPhoneNumber);
          }
      res.json(result);
      console.log('Manually triggered Twillio flow. ', getPhoenixTimestamp());
    } catch (error) {
      res.status(500).json({ message: 'Error triggering flow', error: error.message });
    }
  });

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`[${getPhoenixTimestamp()}] Server is running on http://localhost:${port}`);
});

console.log(`Current Phoenix timestamp: ${getPhoenixTimestamp()}`);