
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
  'API_VERSION',
  'REGISTER_FORM',
  'DOWNLOAD_HEALTHEDGE_APP',
  'CONTACT_CUSTOMER_CARE'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  // Uncomment in production to prevent starting with missing variables
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
      context_data: {}
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

    // Special handling for about_us template with document
    if (templateName === 'about_us' && headerType === 'DOCUMENT') {
      console.log(`📄 Adding document header for about_us template: ${headerUrl}`);
    }
    
    // For welcome_onboard, include the image header
    if (templateName === 'welcome_onboard' && headerType === 'IMAGE') {
      console.log(`🖼️ Adding image header for welcome_onboard template: ${headerUrl}`);
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

// 🔹 Send interactive buttons message
async function sendInteractiveButtonsMessage(to, headerText, bodyText, footerText, buttons) {
  try {
    console.log(`📤 Sending interactive buttons to ${to}`);
    
    const messageData = {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    // Add header if provided
    if (headerText) {
      messageData.interactive.header = {
        type: 'text',
        text: headerText
      };
    }

    // Add footer if provided
    if (footerText) {
      messageData.interactive.footer = {
        text: footerText
      };
    }

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
    
    console.log(`✅ Interactive buttons sent successfully to ${to}`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending interactive buttons to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Send welcome message with options
async function sendWelcomeMessage(to) {
  try {
    // Update session
    updateUserSession(to, {
      current_step: 'welcome',
      first_message_sent: true
    });

    // Send welcome_onboard template with image
    await sendTemplateMessage(
      to,
      'welcome_onboard',
      'IMAGE',
      'https://drive.google.com/uc?export=view&id=1EpjaXxUS8dY_sSHWPELr8zD1EXb7sn-g'
    );
    
    console.log(`✅ Welcome message sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending welcome message to ${to}:`, error);
    
    // Fallback to interactive buttons if template fails
    try {
      await sendInteractiveButtonsMessage(
        to,
        "HealthEdge Assistant",
        "Thank You for Connecting with HealthEdge. Please select your query so we can assist you better.",
        "Choose an option below",
        [
          { id: "register", title: "Register on HealthEdge" },
          { id: "app_download", title: "Get Healthedge App" },
          { id: "know_more", title: "Know more about Program" },
          { id: "contact_care", title: "Customer Care Executive" }
        ]
      );
      return true;
    } catch (fallbackError) {
      console.error(`❌ Fallback welcome message also failed for ${to}:`, fallbackError);
      await sendTextMessage(to, "Welcome to HealthEdge! How can we help you today?");
      return false;
    }
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
  
  // Get or create user session
  const session = getUserSession(from);
  
  try {
    // If this is the first message from the user, send welcome message
    if (!session.first_message_sent) {
      await sendWelcomeMessage(from);
      return;
    }

    // Handle button messages from WhatsApp
    if (message.button && message.button.text) {
      const buttonText = message.button.text.toLowerCase();
      console.log(`🔘 Button clicked: ${buttonText}`);

      if (buttonText.includes('register')) {
        await sendTextMessage(from, `📝 *Registration Portal*\n\nThank you for your interest in registering with HealthEdge!\n\nComplete your registration process by clicking the link below:\n${REGISTER_FORM}\n\nBy registering, you'll get access to exclusive health services and personalized care plans.`);
        
        // Update session
        updateUserSession(from, {
          current_step: 'registration_sent',
          context_data: { last_action: 'register' }
        });
        
      } else if (buttonText.includes('download') || buttonText.includes('app')) {
        await sendTextMessage(from, `📲 *Download Our App*\n\nGet the HealthEdge app now and enjoy exclusive benefits:\n\n• Special discounts on health services\n• Easy appointment scheduling\n• 24/7 health monitoring\n• Personalized health insights\n\nDownload link: ${DOWNLOAD_HEALTHEDGE_APP}`);
        
        // Update session
        updateUserSession(from, {
          current_step: 'app_download_sent',
          context_data: { last_action: 'app_download' }
        });
        
      } else if (buttonText.includes('contact') || buttonText.includes('care') || buttonText.includes('support')) {
        await sendTextMessage(from, `📞 *Customer Care*\n\nFor any assistance, please contact our customer care team:\n\nPhone: ${process.env.CONTACT_CUSTOMER_CARE || '+1-800-HEALTH-EDGE'}\n\nWe're available 24/7 to help you with any questions or concerns you may have.\n\nYour health is our priority!`);
        
        // Update session
        updateUserSession(from, {
          current_step: 'customer_care_contacted',
          context_data: { last_action: 'contacted_customer_care' }
        });
        
      } else if (buttonText.includes('about') || buttonText.includes('program') || buttonText.includes('know more')) {
        // Send the Google Drive link directly
        await sendTextMessage(
          from,
          `📄 *About Our Program*\n\nYou can view our program details by clicking the link below:\nhttps://drive.google.com/uc?export=view&id=1cXvisg-KBusMyPZpUP6EnJn5ObTAY14Y`
        );
        
        // Update session
        updateUserSession(from, {
          current_step: 'about_us_viewed',
          context_data: { last_action: 'viewed_program_info' }
        });
        
      } else {
        await sendTextMessage(from, "✅ Got your click! We'll get back to you.");
        
        // Update session with unknown button action
        updateUserSession(from, {
          current_step: 'unknown_button',
          context_data: { last_action: 'unknown_button', button_text: buttonText }
        });
      }
    } 
    // Handle interactive message (button reply)
    else if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
      const buttonReplyId = message.interactive.button_reply.id;
      console.log(`🔘 Interactive button clicked: ${buttonReplyId}`);
      
      // Handle specific button replies
      if (buttonReplyId === 'register') {
        await sendTextMessage(from, `📝 *Registration Portal*\n\nThank you for your interest in registering with HealthEdge!\n\nComplete your registration process by clicking the link below:\n${REGISTER_FORM}\n\nBy registering, you'll get access to exclusive health services and personalized care plans.`);
        
        // Update session
        updateUserSession(from, {
          current_step: 'registration_sent',
          context_data: { last_action: 'register' }
        });
        
      } else if (buttonReplyId === 'app_download') {
        await sendTextMessage(from, `📲 *Download Our App*\n\nGet the HealthEdge app now and enjoy exclusive benefits:\n\n• Special discounts on health services\n• Easy appointment scheduling\n• 24/7 health monitoring\n• Personalized health insights\n\nDownload link: ${DOWNLOAD_HEALTHEDGE_APP}`);
        
        // Update session
        updateUserSession(from, {
          current_step: 'app_download_sent',
          context_data: { last_action: 'app_download' }
        });
        
      } else if (buttonReplyId === 'more_options') {
        // Send additional options
        await sendInteractiveButtonsMessage(
          from,
          "More Options",
          "Please select an option to proceed:",
          "We're here to help you better!",
          [
            { id: "about_us", title: "About Program" },
            { id: "contact_care", title: "Customer Care" },
            { id: "back_to_main", title: "Main Menu" }
          ]
        );
        
        // Update session
        updateUserSession(from, {
          current_step: 'more_options',
          context_data: { last_action: 'more_options' }
        });
        
      } else if (buttonReplyId === 'contact_care') {
        await sendTextMessage(from, `📞 *Customer Care*\n\nFor any assistance, please contact our customer care team:\n\nPhone: ${process.env.CONTACT_CUSTOMER_CARE}\n\nWe're available 24/7 to help you with any questions or concerns you may have.\n\nYour health is our priority!`);
        
        // Update session
        updateUserSession(from, {
          current_step: 'customer_care_contacted',
          context_data: { last_action: 'contacted_customer_care' }
        });
        
      } else if (buttonReplyId === 'back_to_main') {
        // Back to main menu
        await sendWelcomeMessage(from);
      } else {
        // Unknown button ID
        await sendTextMessage(from, "Sorry, I don't recognize that option. Please try again.");
        await sendWelcomeMessage(from);
      }
    }
    // Handle text or any other type of message
    else {
      console.log(`💬 Regular message received, sending welcome message to ${from}`);
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
    
    // Check if this is a WhatsApp Business Account webhook
    if (req.body.object === 'whatsapp_business_account') {
      // Process each entry
      if (req.body.entry && req.body.entry.length > 0) {
        for (const entry of req.body.entry) {
          const changes = entry.changes;

          if (changes && changes.length > 0) {
            for (const change of changes) {
              if (change.field === 'messages') {
                const value = change.value;
                
                // Handle incoming messages
                if (value.messages && value.messages.length > 0) {
                  for (const message of value.messages) {
                    const from = message.from;
                    
                    // Skip if it's a status message or echo
                    if (from && message.timestamp) {
                      await handleIncomingMessage(from, message);
                    }
                  }
                }

                // Handle message statuses (optional)
                if (value.statuses && value.statuses.length > 0) {
                  for (const status of value.statuses) {
                    console.log(`📊 Message status update:`, status);
                  }
                }
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
