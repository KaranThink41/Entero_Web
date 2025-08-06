// // require('dotenv').config()
// // const axios = require('axios')
// // const FormData = require('form-data')
// // const fs = require('fs')
// // const express = require('express')

// // async function sendTemplateMessage() {
// //     const response = await axios({
// //         url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //         method: 'post',
// //         headers: {
// //             'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //             'Content-Type': 'application/json'
// //         },
// //         data: JSON.stringify({
// //             messaging_product: 'whatsapp',
// //             to: 'phone_number',
// //             type: 'template',
// //             template:{
// //                 name: 'testing_temp',
// //                 language: {
// //                     code: 'en_US'
// //                 },
// //                 components: [
// //                     {
// //                         type: 'header',
// //                         parameters: [
// //                             {
// //                                 type: 'text',
// //                                 text: 'John Doe'
// //                             }
// //                         ]
// //                     },
// //                     {
// //                         type: 'body',
// //                         parameters: [
// //                             {
// //                                 type: 'text',
// //                                 text: '50'
// //                             }
// //                         ]
// //                     }
// //                 ]
// //             }
// //         })
// //     })

// //     console.log(response.data)
// // }

// // async function sendTextMessage() {
// //     const response = await axios({
// //         url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //         method: 'post',
// //         headers: {
// //             'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //             'Content-Type': 'application/json'
// //         },
// //         data: JSON.stringify({
// //             messaging_product: 'whatsapp',
// //             to: 'phone_number',
// //             type: 'text',
// //             text:{
// //                 body: 'This is a text message'
// //             }
// //         })
// //     })

// //     console.log(response.data) 
// // }

// // async function sendMediaMessage() {
// //     const response = await axios({
// //         url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //         method: 'post',
// //         headers: {
// //             'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //             'Content-Type': 'application/json'
// //         },
// //         data: JSON.stringify({
// //             messaging_product: 'whatsapp',
// //             to: 'phone_number',
// //             type: 'image',
// //             image:{
// //                 //link: 'https://dummyimage.com/600x400/000/fff.png&text=manfra.io',
// //                 id: '512126264622813',
// //                 caption: 'This is a media message'
// //             }
// //         })
// //     })

// //     console.log(response.data)    
// // }

// // async function uploadImage() {
// //     const data = new FormData()
// //     data.append('messaging_product', 'whatsapp')
// //     data.append('file', fs.createReadStream(process.cwd() + '/logo.png'), { contentType: 'image/png' })
// //     data.append('type', 'image/png')

// //     const response = await axios({
// //         url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
// //         method: 'post',
// //         headers: {
// //             'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
// //         },
// //         data: data
// //     })

// //     console.log(response.data)     
// // }

// // sendTemplateMessage()

// // // sendTextMessage()

// // // sendMediaMessage()

// // // uploadImage()

// // //********************** this above all are whatsapp api functions**********************    



// // // Use environment variables for tokens

// // const app = express()
// // app.use(express.json())

// // app.get('/', (req, res) => {
// //   res.send('Whatsapp with Node.js and Webhooks')
// // })

// // app.get('/webhook', (req, res) => {
// //   const mode = req.query['hub.mode']
// //   const challenge = req.query['hub.challenge']
// //   const token = req.query['hub.verify_token']

// //   if (mode && token === process.env.WEBHOOK_VERIFY_TOKEN) {
// //     res.status(200).send(challenge)
// //   } else {
// //     res.sendStatus(403)
// //   }
// // })

// // app.post('/webhook', async (req, res) => {
// //   const { entry } = req.body

// //   if (!entry || entry.length === 0) {
// //     return res.status(400).send('Invalid Request')
// //   }

// //   const changes = entry[0].changes

// //   if (!changes || changes.length === 0) {
// //     return res.status(400).send('Invalid Request')
// //   }

// //   const statuses = changes[0].value.statuses ? changes[0].value.statuses[0] : null
// //   const messages = changes[0].value.messages ? changes[0].value.messages[0] : null

// //   if (statuses) {
// //     // Handle message status
// //     console.log(`
// //       MESSAGE STATUS UPDATE:
// //       ID: ${statuses.id},
// //       STATUS: ${statuses.status}
// //     `)
// //   }

// //   if (messages) {
// //     // Handle received messages
// //     if (messages.type === 'text') {
// //       if (messages.text.body.toLowerCase() === 'hello') {
// //         replyMessage(messages.from, 'Hello. How are you?', messages.id)
// //       }

// //       if (messages.text.body.toLowerCase() === 'list') {
// //         sendList(messages.from)
// //       }

// //       if (messages.text.body.toLowerCase() === 'buttons') {
// //         sendReplyButtons(messages.from)
// //       }
// //     }

// //     if (messages.type === 'interactive') {
// //       if (messages.interactive.type === 'list_reply') {
// //         sendMessage(messages.from, `You selected the option with ID ${messages.interactive.list_reply.id} - Title ${messages.interactive.list_reply.title}`)
// //       }

// //       if (messages.interactive.type === 'button_reply') {
// //         sendMessage(messages.from, `You selected the button with ID ${messages.interactive.button_reply.id} - Title ${messages.interactive.button_reply.title}`)
// //       }
// //     }
    
// //     console.log(JSON.stringify(messages, null, 2))
// //   }
  
// //   res.status(200).send('Webhook processed')
// // })

// // async function sendMessage(to, body) {
// //   await axios({
// //     url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //     method: 'post',
// //     headers: {
// //       'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //       'Content-Type': 'application/json'
// //     },
// //     data: JSON.stringify({
// //       messaging_product: 'whatsapp',
// //       to,
// //       type: 'text',
// //       text: {
// //         body
// //       }
// //     })
// //   })
// // }

// // async function replyMessage(to, body, messageId) {
// //   await axios({
// //     url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //     method: 'post',
// //     headers: {
// //       'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //       'Content-Type': 'application/json'
// //     },
// //     data: JSON.stringify({
// //       messaging_product: 'whatsapp',
// //       to,
// //       type: 'text',
// //       text: {
// //         body
// //       },
// //       context: {
// //         message_id: messageId
// //       }
// //     })
// //   })
// // }

// // async function sendList(to) {
// //   await axios({
// //     url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //     method: 'post',
// //     headers: {
// //       'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //       'Content-Type': 'application/json'
// //     },
// //     data: JSON.stringify({
// //       messaging_product: 'whatsapp',
// //       to,
// //       type: 'interactive',
// //       interactive: {
// //         type: 'list',
// //         header: {
// //           type: 'text',
// //           text: 'Message Header'
// //         },
// //         body: {
// //           text: 'This is a interactive list message'
// //         },
// //         footer: {
// //           text: 'This is the message footer'
// //         },
// //         action: {
// //           button: 'Tap for the options',
// //           sections: [
// //             {
// //               title: 'First Section',
// //               rows: [
// //                 {
// //                   id: 'first_option',
// //                   title: 'First option',
// //                   description: 'This is the description of the first option'
// //                 },
// //                 {
// //                   id: 'second_option',
// //                   title: 'Second option',
// //                   description: 'This is the description of the second option'
// //                 }
// //               ]
// //             },
// //             {
// //               title: 'Second Section',
// //               rows: [
// //                 {
// //                   id: 'third_option',
// //                   title: 'Third option'
// //                 }
// //               ]
// //             }
// //           ]
// //         }
// //       }
// //     })
// //   })
// // }

// // async function sendReplyButtons(to) {
// //   await axios({
// //     url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
// //     method: 'post',
// //     headers: {
// //       'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
// //       'Content-Type': 'application/json'
// //     },
// //     data: JSON.stringify({
// //       messaging_product: 'whatsapp',
// //       to,
// //       type: 'interactive',
// //       interactive: {
// //         type: 'button',
// //         header: {
// //           type: 'text',
// //           text: 'Message Header'
// //         },
// //         body: {
// //           text: 'This is a interactive reply buttons message'
// //         },
// //         footer: {
// //           text: 'This is the message footer'
// //         },
// //         action: {
// //           buttons: [
// //             {
// //               type: 'reply',
// //               reply: {
// //                 id: 'first_button',
// //                 title: 'First Button'
// //               }
// //             },
// //             {
// //               type: 'reply',
// //               reply: {
// //                 id: 'second_button',
// //                 title: 'Second Button'
// //               }
// //             }
// //           ]
// //         }
// //       }
// //     })
// //   })
// // }

// // app.listen(3000, () => {
// //   console.log('Server started on port 3000')
// // })


// // //********************** this above all are whatsapp message functionality**********************    














// require('dotenv').config();
// const axios = require('axios');
// const express = require('express');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Verify required environment variables are set
// const requiredEnvVars = [
//     'WHATSAPP_TOKEN',
//     'WHATSAPP_PHONE_NUMBER_ID',
//     'API_VERSION',
//     'REGISTER_FORM',
//     'DOWNLOAD_HEALTHEDGE_APP'
// ];
// const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// if (missingVars.length > 0) {
//     console.error('Missing required environment variables:', missingVars.join(', '));
//     // process.exit(1); // Keep this commented during development to avoid frequent restarts
// }

// // Configuration
// const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
// const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
// const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'HealthEdge_Bot_Verify';
// const WHATSAPP_API_URL = `https://graph.facebook.com/${process.env.API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
// const REGISTER_FORM = process.env.REGISTER_FORM;
// const DOWNLOAD_HEALTHEDGE_APP = process.env.DOWNLOAD_HEALTHEDGE_APP;

// // Session management for users (simple in-memory)
// const userSessions = {};

// // Get or create a user session
// const getUserSession = (phoneNumber) => {
//     if (!userSessions[phoneNumber]) {
//         userSessions[phoneNumber] = {
//             current_step: 'start',
//             context_data: {}
//         };
//     }
//     return userSessions[phoneNumber];
// };

// // Update user session
// const updateUserSession = (phoneNumber, updates) => {
//     const session = getUserSession(phoneNumber);
//     userSessions[phoneNumber] = {
//         ...session,
//         ...updates
//     };
//     return userSessions[phoneNumber];
// };

// // Function to send WhatsApp template messages
// const sendTemplateMessage = async (to, templateName, languageCode = 'en_US', components = []) => {
//     try {
//         // Base template message
//         const messageData = {
//             type: 'template',
//             template: {
//                 name: templateName,
//                 language: {
//                     code: languageCode
//                 },
//                 components: []
//             }
//         };

//         // Add header component if it's the know_more template
//         if (templateName === 'know_more') {
//             messageData.template.components.push({
//                 type: 'header',
//                 parameters: [{
//                     type: 'document',
//                     document: {
//                         link: 'https://www.enterohealthcare.com/program_info.pdf', // Replace with your actual PDF URL
//                         filename: 'entero_program_details.pdf' // Descriptive filename with .pdf extension
//                     }
//                 }]
//             });
//         }

//         // Add other components if provided
//         if (components.length > 0) {
//             messageData.template.components = [
//                 ...messageData.template.components,
//                 ...components
//             ];
//         }

//         return await sendWhatsAppMessage(to, messageData);
//     } catch (error) {
//         console.error('Error sending template message:', error.response?.data?.error || error.message);
//         throw error;
//     }
// };

// // Function to send media messages (image, document, etc.)
// const sendMediaMessage = async (to, mediaType, mediaUrl, caption = '') => {
//     try {
//         const response = await axios({
//             url: `https://graph.facebook.com/${process.env.API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
//             method: 'post',
//             headers: {
//                 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
//                 'Content-Type': 'application/json'
//             },
//             data: {
//                 messaging_product: 'whatsapp',
//                 to: to,
//                 type: mediaType,
//                 [mediaType]: {
//                     link: mediaUrl,
//                     caption: caption
//                 }
//             }
//         });
//         console.log('Media message sent successfully:', response.data);
//         return response.data;
//     } catch (error) {
//         console.error('Error sending media message:', error.response?.data?.error || error.message);
//         throw error;
//     }
// };

// // WhatsApp API helper functions
// const sendWhatsAppMessage = async (to, message) => {
//     try {
//         const response = await axios.post(
//             WHATSAPP_API_URL,
//             {
//                 messaging_product: "whatsapp",
//                 to: to,
//                 ...message
//             },
//             {
//                 headers: {
//                     'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );
//         console.log('Message sent successfully:', response.data);
//         return response.data;
//     } catch (error) {
//         console.error('Error sending WhatsApp message:', error.response?.data?.error || error.message);
//         throw error;
//     }
// };

// const sendTextMessage = async (to, text) => {
//     return sendWhatsAppMessage(to, {
//         type: "text",
//         text: { body: text }
//     });
// };

// const sendInteractiveButtonsMessage = async (to, headerText, bodyText, footerText, buttons) => {
//     const messageData = {
//         type: 'interactive',
//         interactive: {
//             type: 'button',
//             body: {
//                 text: bodyText
//             },
//             action: {
//                 buttons: buttons.map(btn => ({
//                     type: 'reply',
//                     reply: {
//                         id: btn.id,
//                         title: btn.title
//                     }
//                 }))
//             }
//         }
//     };

//     // Add header if provided
//     if (headerText) {
//         messageData.interactive.header = {
//             type: 'text',
//             text: headerText
//         };
//     }

//     // Add footer if provided
//     if (footerText) {
//         messageData.interactive.footer = {
//             text: footerText
//         };
//     }

//     return sendWhatsAppMessage(to, messageData);
// };

// // Main message handler
// const handleIncomingMessage = async (from, message) => {
//     try {
//         const session = getUserSession(from);
//         console.log('Processing message:', JSON.stringify(message, null, 2));

//         // Check for interactive message (button reply)
//         if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
//             const buttonReplyId = message.interactive.button_reply.id;
//             console.log(`Button clicked: ${buttonReplyId}`);
            
//             // Handle specific button replies
//             if (buttonReplyId === 'register') {
//                 await sendTextMessage(from,
//                     `Thank you for your interest in registering with HealthEdge. Please use this link to register: ${REGISTER_FORM}`
//                 );
                
//                 // Update session
//                 updateUserSession(from, {
//                     current_step: 'registration_sent',
//                     context_data: { last_action: 'register' }
//                 });
                
//             } else if (buttonReplyId === 'app_download') {
//                 await sendTextMessage(from,
//                     `Thank you for your interest in the HealthEdge app. Download it here: ${DOWNLOAD_HEALTHEDGE_APP}`
//                 );
                
//                 // Update session
//                 updateUserSession(from, {
//                     current_step: 'app_download_sent',
//                     context_data: { last_action: 'app_download' }
//                 });
                
//             } else if (buttonReplyId === 'load_more') {
//                 // Send additional options when Load More is clicked
//                 await sendInteractiveButtonsMessage(
//                     from,
//                     "More Options",
//                     "Please select an option to proceed:",
//                     "We're here to help you better!",
//                     [
//                         { id: "know_more", title: "About Program" },
//                         { id: "contact_care_executive", title: "Customer Care" },
//                         { id: "back_to_main", title: "Main Menu" }
//                     ]
//                 );
                
//                 // Update session
//                 updateUserSession(from, {
//                     current_step: 'more_options',
//                     context_data: { last_action: 'load_more' }
//                 });
                
//             } else if (buttonReplyId === 'know_more') {
//                 // Send the know_more template
//                 await sendTemplateMessage(
//                     from,
//                     'know_more',
//                     'en_US'  // Using US English as per the template
//                 );
                
//                 // Update session
//                 updateUserSession(from, {
//                     current_step: 'know_more_viewed',
//                     context_data: { last_action: 'viewed_program_info' }
//                 });
                
//             } else if (buttonReplyId === 'contact_care_executive') {
//                 // Send customer care contact information
//                 await sendTextMessage(
//                     from,
//                     `For any assistance, please contact our customer care at: ${process.env.CONTACT_CUSTOMER_CARE}\n\nWe're available 24/7 to help you.`
//                 );
                
//                 // Update session
//                 updateUserSession(from, {
//                     current_step: 'customer_care_contacted',
//                     context_data: { last_action: 'contacted_customer_care' }
//                 });
                
//             } else if (buttonReplyId === 'back_to_main') {
//                 // Handle back to main menu
//                 await sendWelcomeMessage(from);
//             } else {
//                 // Unknown button ID
//                 await sendTextMessage(from, 'Sorry, I don\'t recognize that option. Please try again.');
//                 await sendWelcomeMessage(from);
//             }
//         } 
//         // Handle text messages or any other type of message
//         else {
//             // Send welcome message with buttons for any incoming message
//             await sendWelcomeMessage(from);
//         }

//     } catch (error) {
//         console.error('Error handling message:', error);
//         await sendTextMessage(from,
//             "Sorry, something went wrong. Please try again or contact support."
//         );
//     }
// };

// // Function to send welcome message with interactive buttons
// const sendWelcomeMessage = async (from) => {
//     try {
//         // Update session
//         updateUserSession(from, {
//             current_step: 'welcome',
//             context_data: {}
//         });

//         // Send interactive buttons message
//         await sendInteractiveButtonsMessage(
//             from,
//             "HealthEdge Assistant", // Header
//             "Thank You for Connecting with HealthEdge. Please select your query so we can assist you better.", // Body
//             "Choose an option below", // Footer
//             [
//                 { id: "register", title: "Register" },
//                 { id: "app_download", title: "Download App" },
//                 { id: "load_more", title: "Load More" }
//             ]
//         );
        
//         console.log(`Welcome message with buttons sent to ${from}`);
//     } catch (error) {
//         console.error('Error sending welcome message:', error);
//         // Fallback to simple text message
//         await sendTextMessage(from, "Welcome to HealthEdge! Please type 'help' for assistance.");
//     }
// };

// // Webhook endpoints
// app.get('/webhook', (req, res) => {
//     const mode = req.query['hub.mode'];
//     const token = req.query['hub.verify_token'];
//     const challenge = req.query['hub.challenge'];

//     console.log('Webhook verification request:', { mode, token, challenge });

//     if (mode && token) {
//         if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
//             console.log('Webhook verified successfully');
//             res.status(200).send(challenge);
//             return;
//         }
//     }
    
//     console.log('Webhook verification failed');
//     res.sendStatus(403);
// });

// app.post('/webhook', async (req, res) => {
//     try {
//         const body = req.body;
//         console.log('Received webhook:', JSON.stringify(body, null, 2));

//         if (body.object === 'whatsapp_business_account') {
//             // Process each entry
//             if (body.entry && body.entry.length > 0) {
//                 for (const entry of body.entry) {
//                     const changes = entry.changes;

//                     if (changes && changes.length > 0) {
//                         for (const change of changes) {
//                             if (change.field === 'messages') {
//                                 const value = change.value;
                                
//                                 // Handle incoming messages
//                                 if (value.messages && value.messages.length > 0) {
//                                     for (const message of value.messages) {
//                                         const from = message.from;
//                                         console.log(`Processing message from ${from}:`, message);

//                                         // Skip if it's a status message or echo
//                                         if (message.from && message.timestamp) {
//                                             await handleIncomingMessage(from, message);
//                                         }
//                                     }
//                                 }

//                                 // Handle message statuses (optional)
//                                 if (value.statuses && value.statuses.length > 0) {
//                                     for (const status of value.statuses) {
//                                         console.log(`Message status update:`, status);
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }

//         res.status(200).send('OK');
//     } catch (error) {
//         console.error('Webhook processing error:', error);
//         res.status(500).send('Error');
//     }
// });



// // Start server
// app.listen(PORT, () => {
//     console.log(`🚀 HealthEdge Bot server running on port ${PORT}`);
//     console.log('📱 Webhook URL is configured and ready');
// });

// module.exports = app;