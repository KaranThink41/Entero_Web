require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verify required environment variables
const requiredEnvVars = [
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WEBHOOK_VERIFY_TOKEN',
  'API_VERSION',
  'REGISTER_FORM',
  'DOWNLOAD_HEALTHEDGE_APP',
  'CONTACT_CUSTOMER_CARE'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  // In a production environment, you might want to uncomment the line below to stop the server
  // process.exit(1);
}

const {
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WEBHOOK_VERIFY_TOKEN,
  API_VERSION,
  REGISTER_FORM,
  DOWNLOAD_HEALTHEDGE_APP,
  CONTACT_CUSTOMER_CARE
} = process.env;

const API_URL = `https://graph.facebook.com/${API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Session management (in-memory)
const userSessions = {};

// Get or create user session
const getUserSession = (phoneNumber) => {
  if (!userSessions[phoneNumber]) {
    userSessions[phoneNumber] = {
      current_step: 'start',
      first_message_sent: false,
      last_interaction: new Date().toISOString(),
      context_data: {
        last_action_title: null
      }
    };
  }
  return userSessions[phoneNumber];
};

// Update user session
const updateUserSession = (phoneNumber, updates) => {
  const session = getUserSession(phoneNumber);
  userSessions[phoneNumber] = {
    ...session,
    ...updates,
    last_interaction: new Date().toISOString()
  };
  return userSessions[phoneNumber];
};

// 🔹 Send plain text message
async function sendTextMessage(to, message) {
  try {
    console.log(`📤 Sending text message to ${to}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    const response = await axios.post(API_URL, {
      messaging_product: 'whatsapp',
      to,
      text: { body: message }
    }, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Text message sent successfully to ${to}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending text message to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Send a text message with an interactive button
async function sendTextWithButton(to, bodyText, buttonTitle, buttonId) {
  try {
    console.log(`📤 Sending text message with button to ${to}`);
    const messageData = {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: [{
            type: 'reply',
            reply: {
              id: buttonId,
              title: buttonTitle
            }
          }]
        }
      }
    };
    const response = await axios.post(API_URL, {
      messaging_product: 'whatsapp',
      to,
      ...messageData
    }, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Text message with button sent successfully to ${to}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending text message with button to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Send template message (optional header: IMAGE / DOCUMENT)
async function sendTemplateMessage(to, templateName, headerType = null, headerUrl = null) {
  try {
    console.log(`📤 Sending template message to ${to}: ${templateName} ${headerType ? `with ${headerType}` : ''}`);
    
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' }
      }
    };

    if (headerType && headerUrl) {
      payload.template.components = [
        {
          type: 'header',
          parameters: [
            {
              type: headerType,
              [headerType.toLowerCase()]: { link: headerUrl }
            }
          ]
        }
      ];
    }
    
    console.log('Template payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(API_URL, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Template message sent successfully to ${to}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending template message to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Send interactive list message
async function sendInteractiveListMessage(to, header, body, footer, buttonText, sections) {
  try {
    console.log(`📤 Sending interactive list to ${to}`);
    const messageData = {
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: header },
        body: { text: body },
        footer: { text: footer },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    };

    const response = await axios.post(API_URL, {
      messaging_product: 'whatsapp',
      to,
      ...messageData
    }, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Interactive list sent successfully to ${to}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending interactive list to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Send welcome message with options
async function sendWelcomeMessage(to) {
  try {
    const session = getUserSession(to);
    
    // Check if it's the very first interaction
    if (!session.first_message_sent) {
      updateUserSession(to, { current_step: 'welcome', first_message_sent: true, context_data: { last_action_title: null } });
      await sendTemplateMessage(
        to,
        'welcome_onboard',
        'IMAGE',
        'https://drive.google.com/uc?export=view&id=1EpjaXxUS8dY_sSHWPELr8zD1EXb7sn-g'
      );
      console.log(`✅ Initial welcome template sent to ${to}`);
    } else {
      // For subsequent main menu requests, create a dynamic message
      let bodyText;
      if (session.context_data.last_action_title) {
        bodyText = `We just helped you with "${session.context_data.last_action_title}".\n\nWhat else can we assist you with next? 🤝`;
      } else {
        bodyText = "How can we assist you today?";
      }

      await sendInteractiveListMessage(
        to,
        "HealthEdge Assistant",
        bodyText,
        "Select an option to proceed",
        "Main Menu",
        [
          {
            title: "Options",
            rows: [
              { id: "register", title: "Register on HealthEdge" },
              { id: "app_download", title: "Get Healthedge App" },
              { id: "know_more", title: "Know more about Program" },
              { id: "contact_care", title: "Customer Care Executive" }
            ]
          }
        ]
      );
      console.log(`✅ Dynamic welcome list sent to ${to}`);
      
      // Reset the last action after sending the menu
      updateUserSession(to, { context_data: { last_action_title: null } });
    }
  } catch (error) {
    console.error(`❌ Error sending welcome message to ${to}:`, error);
    
    // Fallback to plain text message if all else fails
    await sendTextMessage(to, "Welcome to HealthEdge! How can we help you today?");
  }
}


// 🔹 Handle specific actions
async function handleAction(from, actionId) {
  try {
    let messageBody = '';
    let actionTitle = '';
    
    switch (actionId) {
      case 'register':
        actionTitle = 'Register on HealthEdge';
        messageBody = `📝 *Registration Portal*\n\nThank you for your interest in registering with HealthEdge!\n\nComplete your registration process by clicking the link below:\n${REGISTER_FORM}\n\nBy registering, you'll get access to exclusive health services and personalized care plans.`;
        updateUserSession(from, { context_data: { last_action_title: actionTitle } });
        await sendTextWithButton(from, messageBody, "Back to Main Menu", "back_to_main");
        break;
      
      case 'app_download':
        actionTitle = 'Get Healthedge App';
        messageBody = `📲 *Download Our App*\n\nGet the HealthEdge app now and enjoy exclusive benefits:\n\n1. Get personalised website and app\n2. Earn with ABHA account\n3. Connect with network of 5000+ doctors\n4. Earn commission from top lab in India\n\nDownload link: ${DOWNLOAD_HEALTHEDGE_APP}`;
        updateUserSession(from, { context_data: { last_action_title: actionTitle } });
        await sendTextWithButton(from, messageBody, "Back to Main Menu", "back_to_main");
        break;
      
      case 'know_more':
        actionTitle = 'Know more about Program';
        messageBody = `📄 *About Our Program*\n\nYou can view our program details by clicking the link below:\n${process.env.PROGRAM_INFO_PDF_URL}`;
        updateUserSession(from, { context_data: { last_action_title: actionTitle } });
        await sendTextWithButton(from, messageBody, "Back to Main Menu", "back_to_main");
        break;
      
      case 'contact_care':
        actionTitle = 'Customer Care Executive';
        messageBody = `📞 *Customer Care*\n\nFor any assistance, please contact our customer care team:\n\nPhone: ${CONTACT_CUSTOMER_CARE}\n\nWe're available 24/7 to help you with any questions or concerns you may have.\n\nYour health is our priority!`;
        updateUserSession(from, { context_data: { last_action_title: actionTitle } });
        await sendTextWithButton(from, messageBody, "Back to Main Menu", "back_to_main");
        break;

      case 'back_to_main':
        await sendWelcomeMessage(from);
        break;

      default:
        await sendTextMessage(from, "Sorry, I don't recognize that option. Please try again.");
        await sendWelcomeMessage(from);
        break;
    }
  } catch (error) {
    console.error('❌ Error handling action:', error);
    await sendTextMessage(from, "Sorry, something went wrong. Please try again or contact support.");
    await sendWelcomeMessage(from);
  }
}

// 🔹 Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification request:', { mode, token });

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// 🔹 Handle incoming messages
async function handleIncomingMessage(from, message) {
  console.log(`📥 Processing message from ${from}:`, JSON.stringify(message, null, 2));
  
  const session = getUserSession(from);
  
  try {
    // If this is the first message from the user, send the welcome message and return.
    if (!session.first_message_sent) {
      await sendWelcomeMessage(from);
      return;
    }

    let actionId = null;

    // Handle interactive button reply (modern API)
    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
      actionId = message.interactive.button_reply.id;
      console.log(`🔘 Interactive button clicked: ${actionId}`);
    } 
    // Handle interactive list reply
    else if (message.type === 'interactive' && message.interactive?.type === 'list_reply') {
      actionId = message.interactive.list_reply.id;
      console.log(`📋 Interactive list item selected: ${actionId}`);
    }
    // Handle simple button message (older API, used by your welcome_onboard template's buttons)
    else if (message.type === 'button' && message.button?.text) {
      const buttonText = message.button.text.toLowerCase();
      console.log(`🔘 Simple button clicked: ${buttonText}`);
      
      // Map button text to an action ID
      if (buttonText.includes('register')) {
        actionId = 'register';
      } else if (buttonText.includes('app')) {
        actionId = 'app_download';
      } else if (buttonText.includes('know more') || buttonText.includes('program')) {
        actionId = 'know_more';
      } else if (buttonText.includes('care') || buttonText.includes('executive')) {
        actionId = 'contact_care';
      } else if (buttonText.includes('menu')) {
        actionId = 'back_to_main';
      } else {
        console.log(`⚠️ Unrecognized simple button text: ${buttonText}`);
        await sendTextMessage(from, "I'm sorry, I don't understand that option. Please use one of the buttons provided.");
        await sendWelcomeMessage(from);
        return;
      }
    }
    // Handle text or any other type of message
    else if (message.type === 'text') {
      const textBody = message.text.body.toLowerCase();
      console.log(`💬 Text message received: "${textBody}"`);
      
      if (textBody.includes('hi') || textBody.includes('hello') || textBody.includes('start') || textBody.includes('menu')) {
        actionId = 'back_to_main';
      } else {
        await sendTextMessage(from, "I'm sorry, I didn't understand that. Please use the menu buttons to navigate.");
        await sendWelcomeMessage(from);
        return;
      }
    } else {
      // For any other unhandled message type, send the welcome menu as a default
      console.log('⚠️ Received an unhandled message type. Sending welcome menu.');
      await sendWelcomeMessage(from);
      return;
    }

    // Process the determined action
    if (actionId) {
      await handleAction(from, actionId);
    } else {
      // Fallback if no actionId was determined
      await sendTextMessage(from, "I'm sorry, I'm having trouble with that request. Please try again or select from the main menu.");
      await sendWelcomeMessage(from);
    }
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    await sendTextMessage(from, "Sorry, something went wrong. Please try again or contact support.");
  }
}

// 🔹 Webhook message handler
app.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Received webhook:', JSON.stringify(req.body, null, 2));
    
    if (req.body.object === 'whatsapp_business_account') {
      for (const entry of req.body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const value = change.value;
            
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                const from = message.from;
                if (from && message.timestamp) {
                  await handleIncomingMessage(from, message);
                }
              }
            }
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                console.log(`📊 Message status update:`, status);
              }
            }
          }
        }
      }
    } else {
      console.log('⚠️ Received non-WhatsApp webhook event');
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook Error:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp bot server running on port ${PORT}`);
  console.log('📱 Webhook URL is configured and ready');
  console.log('🔐 Session management initialized');
});