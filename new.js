require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment Variables
const {
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WEBHOOK_VERIFY_TOKEN,
  API_VERSION = 'v21.0'
} = process.env;

const API_URL = `https://graph.facebook.com/${API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// 🔹 ENHANCED HARDCODED DATA - MORE MEDICINES AND STOCK STATUS
const MEDICINES = {
  // Original medicines (last order items)
  '1': { id: '1', name: 'Dolo 650', price: 25.00, category: 'Pain Relief', stock: 'in_stock' },
  '2': { id: '2', name: 'Benadryl DR Syrup', price: 140, category: 'Pain Relief', stock: 'in_stock' },
  '3': { id: '3', name: 'Lubistar Eye Drops', price: 89, category: 'Eye Care', stock: 'out_of_stock' }, // Modified for testing
  '4': { id: '4', name: 'Vitamin D3', price: 120.75, category: 'Supplements', stock: 'in_stock' },
  '5': { id: '5', name: 'B-Complex Tablets', price: 45.00, category: 'Supplements', stock: 'in_stock' },
  '6': { id: '6', name: 'Paracetamol 500mg', price: 15.00, category: 'Pain Relief', stock: 'in_stock' },
  
  // Additional medicines for "Explore More" section
  '7': { id: '7', name: 'Cetrizine 10mg', price: 18.00, category: 'Allergy', stock: 'in_stock' },
  '8': { id: '8', name: 'Amoxicillin 250mg', price: 85.00, category: 'Antibiotic', stock: 'out_of_stock' }, // Modified for testing
  '9': { id: '9', name: 'Calcium Tablets', price: 75.50, category: 'Supplements', stock: 'in_stock' },
  '10': { id: '10', name: 'Iron Folic Acid', price: 32.00, category: 'Supplements', stock: 'in_stock' },
  '11': { id: '11', name: 'Cough Syrup', price: 68.00, category: 'Cold & Flu', stock: 'in_stock' },
  '12': { id: '12', name: 'Digene Gel', price: 42.00, category: 'Digestive', stock: 'in_stock' },
  '13': { id: '13', name: 'ENO Powder', price: 35.00, category: 'Digestive', stock: 'in_stock' },
  '14': { id: '14', name: 'Vicks VapoRub', price: 95.00, category: 'Cold & Flu', stock: 'in_stock' }
};

// 🔹 HARDCODED RECOMMENDATIONS
// Maps medicine ID to a list of recommended medicine IDs
const RECOMMENDATIONS = {
  '1': ['6', '12'], // Dolo 650 -> Paracetamol, Digene
  '2': ['11', '14'], // Benadryl DR Syrup -> Cough Syrup, Vicks
  '3': ['4', '5'], // Lubistar Eye Drops -> Vitamin D3, B-Complex
  '7': ['11', '14'], // Cetrizine -> Cough Syrup, Vicks
  '11': ['14', '7'], // Cough Syrup -> Vicks, Cetrizine
  '12': ['13'], // Digene Gel -> ENO Powder
  '14': ['11', '2'] // Vicks VapoRub -> Cough Syrup, Benadryl
};

// 🔹 NEW - HARDCODED SUBSTITUTION DATA
// Maps medicine ID to a list of substitute medicine IDs
const SUBSTITUTIONS = {
  '3': ['1', '6'], // Lubistar Eye Drops -> Dolo 650, Paracetamol (example substitution)
  '8': ['7', '11'] // Amoxicillin 250mg -> Cetrizine, Cough Syrup (example substitution)
};

// 🔹 HARDCODED EXISTING CUSTOMER
const EXISTING_CUSTOMER = {
  phone_number: '919672618163',
  name: 'Karan',
  last_order_items: ['1', '3', '5']
};

// 🔹 IN-MEMORY SESSION MANAGEMENT
const userSessions = new Map();

// Get or create user session
const getUserSession = (phoneNumber) => {
  if (!userSessions.has(phoneNumber)) {
    userSessions.set(phoneNumber, {
      current_step: 'start',
      cart: [],
      current_category: null,
      last_interaction: new Date().toISOString()
    });
  }
  return userSessions.get(phoneNumber);
};

// Update user session
const updateUserSession = (phoneNumber, updates) => {
  const session = getUserSession(phoneNumber);
  const updatedSession = {
    ...session,
    ...updates,
    last_interaction: new Date().toISOString()
  };
  userSessions.set(phoneNumber, updatedSession);
  return updatedSession;
};

// Clear user cart
const clearUserCart = (phoneNumber) => {
  const session = getUserSession(phoneNumber);
  session.cart = [];
  userSessions.set(phoneNumber, session);
};

// Helper function to format titles to stay under the character limit (24 chars)
function formatRowTitle(name, stockStatus, maxLength = 24) {
  const stockText = stockStatus === 'out_of_stock' ? ' (OOS)' : '';
  const remainingLength = maxLength - stockText.length;
  const shortName = name.length > remainingLength ? name.substring(0, remainingLength).trim() : name;
  return `${shortName}${stockText}`;
}

// 🔹 WHATSAPP API FUNCTIONS

// Send text message
async function sendTextMessage(to, message) {
  try {
    console.log(`📤 Sending text to ${to}: ${message.substring(0, 50)}...`);
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
    console.log(`✅ Text sent successfully to ${to}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending text to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// Send interactive buttons (max 3 buttons)
async function sendInteractiveButtons(to, bodyText, buttons, headerText = null, footerText = null) {
  try {
    console.log(`📤 Sending interactive buttons to ${to}`);
    
    if (buttons.length > 3) {
      console.error(`❌ Error: Too many buttons. Max allowed is 3, but you provided ${buttons.length}`);
      throw new Error('Invalid buttons count. Min allowed buttons: 1, Max allowed buttons: 3');
    }

    const messageData = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              // Use substring to ensure title is max 20 characters
              title: btn.title.substring(0, 20)
            }
          }))
        }
      }
    };

    if (headerText) {
      messageData.interactive.header = {
        type: 'text',
        text: headerText
      };
    }

    if (footerText) {
      messageData.interactive.footer = {
        text: footerText
      };
    }

    const response = await axios.post(API_URL, messageData, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Interactive buttons sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending buttons to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// Send interactive list (for more than 3 options)
async function sendInteractiveList(to, bodyText, buttonText, sections, headerText = null, footerText = null) {
  try {
    console.log(`📤 Sending interactive list to ${to}`);
    
    const totalRows = sections.reduce((sum, section) => sum + section.rows.length, 0);
    if (totalRows > 10) {
      console.error(`❌ Error: Total list row count exceeds maximum of 10. Found ${totalRows} rows.`);
      throw new Error('Invalid list row count. Max allowed is 10.');
    }
    
    const messageData = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    };

    if (headerText) {
      messageData.interactive.header = {
        type: 'text',
        text: headerText
      };
    }

    if (footerText) {
      messageData.interactive.footer = {
        text: footerText
      };
    }

    const response = await axios.post(API_URL, messageData, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Interactive list sent to ${to}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending list to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

// 🔹 BOT LOGIC FUNCTIONS

// Check if user is existing customer
const isExistingCustomer = (phoneNumber) => {
  return phoneNumber === EXISTING_CUSTOMER.phone_number;
};

// Get medicine by ID
const getMedicineById = (id) => {
  return MEDICINES[id];
};

// Calculate cart total
const calculateCartTotal = (cart) => {
  return cart.reduce((total, medicineId) => {
    const medicine = getMedicineById(medicineId);
    return total + (medicine ? medicine.price : 0);
  }, 0);
};

// Format cart items for display
const formatCartItems = (cart) => {
  return cart.map(medicineId => {
    const medicine = getMedicineById(medicineId);
    return medicine ? `• ${medicine.name} - ₹${medicine.price}` : '';
  }).filter(item => item !== '').join('\n');
};

// Group medicines by category
const groupMedicinesByCategory = (medicineIds) => {
  const groups = {};
  medicineIds.forEach(id => {
    const medicine = getMedicineById(id);
    if (medicine) {
      if (!groups[medicine.category]) {
        groups[medicine.category] = [];
      }
      groups[medicine.category].push(medicine);
    }
  });
  return groups;
};

// 🔹 UPDATED sendWelcomeMessage function
async function sendWelcomeMessage(to) {
  try {
    if (!isExistingCustomer(to)) {
      await sendTextMessage(to, "Sorry, this pharmacy bot is currently in POC mode and only serves registered customers. Please contact support for assistance.");
      return;
    }

    const welcomeText = `Hi! Welcome to Ganesh Medicals. \n\nHow can we help you today?`;

    const welcomeButtons = [
      {
        id: 'reorder',
        title: '🔁 Reorder'
      },
      {
        id: 'place_new_order',
        title: '🔍 Explore More'
      }
    ];

    await sendInteractiveButtons(
      to,
      welcomeText,
      welcomeButtons
    );

    updateUserSession(to, { current_step: 'welcome_sent' });

  } catch (error) {
    console.error('❌ Error sending welcome message:', error);
    await sendTextMessage(to, "Welcome to Ganesh Medicals! How can I help you today?");
  }
}

// Send selective last order items
async function sendLastOrderSelection(to) {
  try {
    const lastOrderText = "Select items from your last order:";
    
    const sections = [{
      title: "Your Last Order Items",
      rows: EXISTING_CUSTOMER.last_order_items.map(id => {
        const medicine = getMedicineById(id);
        const title = formatRowTitle(medicine.name, medicine.stock);
        return {
          id: `add_${id}`,
          title: title,
          description: `₹${medicine.price} - ${medicine.category}`
        };
      })
    }, {
      title: "Options",
      rows: [
        {
          id: 'reorder_all_last',
          title: '🔁 Reorder All Items',
          description: 'Add all items from last order'
        },
        {
          id: 'back_to_main',
          title: '⬅️ Back to Main Menu',
          description: 'Return to main options'
        }
      ]
    }];

    await sendInteractiveList(
      to,
      lastOrderText,
      "Select Items",
      sections,
      "📦 Last Order Items",
      "Tap to select individual items"
    );

    updateUserSession(to, { current_step: 'last_order_selection' });

  } catch (error) {
    console.error('❌ Error sending last order selection:', error);
    await sendTextMessage(to, "Sorry, couldn't load your last order items. Please try again.");
  }
}

// Send medicine categories as a list
async function sendMedicineCategories(to) {
  try {
    const allMedicineIds = Object.keys(MEDICINES);
    const categories = groupMedicinesByCategory(allMedicineIds);
    
    const categoryRows = Object.keys(categories).map(category => ({
      id: `category_${category}`,
      title: `${category}`,
      description: `View all ${category} medicines`
    }));

    categoryRows.push({
      id: 'back_to_main',
      title: '⬅️ Back to Main',
      description: 'Return to main options'
    });

    const sections = [{
      title: "Select a Category",
      rows: categoryRows
    }];

    await sendInteractiveList(
      to,
      "To view our medicines, please select a category:",
      "Browse Categories",
      sections,
      "🔬 All Medicines"
    );

    updateUserSession(to, { current_step: 'exploring_categories' });

  } catch (error) {
    console.error('❌ Error sending medicine categories:', error);
    await sendTextMessage(to, "Sorry, couldn't load medicine categories. Please try again.");
  }
}

// Send medicines for a selected category
async function sendMedicinesByCategory(to, category) {
  try {
    const allMedicineIds = Object.keys(MEDICINES);
    const categories = groupMedicinesByCategory(allMedicineIds);
    const medicinesForCategory = categories[category];

    if (!medicinesForCategory || medicinesForCategory.length === 0) {
      await sendTextMessage(to, "No medicines found for that category. Please try again.");
      await sendMedicineCategories(to);
      return;
    }

    const medicineRows = medicinesForCategory.map(medicine => {
      const title = formatRowTitle(medicine.name, medicine.stock);
      return {
        id: `add_${medicine.id}`,
        title: title,
        description: `₹${medicine.price}`
      };
    });

    const sections = [{
      title: `${category} Medicines`,
      rows: medicineRows
    }];

    sections.push({
      title: "Navigation",
      rows: [
        {
          id: 'back_to_explore',
          title: '⬅️ Back to Categories',
          description: 'Choose a different category'
        }
      ]
    });
    
    await sendInteractiveList(
      to,
      `Select a medicine from the ${category} category:`,
      "Add to Cart",
      sections,
      `💊 ${category}`
    );

    updateUserSession(to, { 
      current_step: 'exploring_medicines',
      current_category: category 
    });

  } catch (error) {
    console.error('❌ Error sending medicines for category:', error);
    await sendTextMessage(to, "Sorry, couldn't load medicines for this category. Please try again.");
  }
}

// Send medicine details before adding to cart
async function sendMedicineDetails(to, medicineId) {
  try {
    const medicine = getMedicineById(medicineId);
    if (!medicine) {
      await sendTextMessage(to, "Sorry, medicine not found.");
      return;
    }

    const detailsText = `💊 ${medicine.name}\n\n` +
      `💰 Price: ₹${medicine.price}\n` +
      `🏷️ Category: ${medicine.category}\n\n` +
      `Would you like to add this to your cart?`;

    const detailButtons = [
      {
        id: `confirm_add_${medicineId}`,
        title: '✅ Add to Cart'
      },
      {
        id: 'place_new_order',
        title: '🔍 Continue Shopping'
      },
      {
        id: 'view_cart',
        title: '🛒 View Cart'
      }
    ];

    await sendInteractiveButtons(
      to,
      detailsText,
      detailButtons,
      "📋 Medicine Details",
      "Confirm to add to cart"
    );

    updateUserSession(to, { 
      current_step: 'medicine_details',
      pending_medicine: medicineId 
    });

  } catch (error) {
    console.error('❌ Error sending medicine details:', error);
    await sendTextMessage(to, "Sorry, couldn't load medicine details. Please try again.");
  }
}

// Send recommendations after adding an item
async function sendRecommendations(to, lastAddedMedicineId) {
  try {
    const recommendedItems = RECOMMENDATIONS[lastAddedMedicineId];
    if (!recommendedItems || recommendedItems.length === 0) {
      // No recommendations found, just send a simple prompt to continue
      const continueShoppingButtons = [
        { id: 'place_new_order', title: '➕ Add More Items' },
        { id: 'view_cart', title: '🛒 View Cart' }
      ];

      await sendInteractiveButtons(
        to,
        "What would you like to do next?",
        continueShoppingButtons,
        "Item Added"
      );
      return;
    }

    const recommendedRows = recommendedItems.map(id => {
      const medicine = getMedicineById(id);
      const title = formatRowTitle(medicine.name, medicine.stock);
      return {
        id: `add_${id}`,
        title: title,
        description: `₹${medicine.price} - ${medicine.category}`
      };
    });
    
    recommendedRows.push({
      id: 'view_cart',
      title: '🛒 View Cart',
      description: 'Review your order total'
    });

    recommendedRows.push({
      id: 'back_to_explore',
      title: '⬅️ Continue Shopping',
      description: 'Choose a different medicine'
    });
    
    const sections = [{
      title: "You might also like...",
      rows: recommendedRows
    }];

    await sendInteractiveList(
      to,
      "Based on your recent selection, these items might interest you:",
      "View Recommendations",
      sections,
      "💡 Recommendations",
      "We've curated these just for you!"
    );
    
    updateUserSession(to, { current_step: 'recommendations_sent' });
  } catch (error) {
    console.error('❌ Error sending recommendations:', error);
  }
}

// 🔹 NEW FUNCTION: Send medicine substitutions
async function sendSubstitutions(to, medicineId) {
  try {
    const originalMedicine = getMedicineById(medicineId);
    const substituteIds = SUBSTITUTIONS[medicineId];

    if (!originalMedicine || !substituteIds || substituteIds.length === 0) {
      // If no substitutes are found, inform the user and offer to continue shopping.
      await sendTextMessage(to, `Sorry, we are out of stock for ${originalMedicine.name} and could not find a suitable substitute at this time.`);
      await sendMedicineCategories(to);
      return;
    }

    const substituteRows = substituteIds.map(id => {
      const medicine = getMedicineById(id);
      const title = formatRowTitle(medicine.name, medicine.stock);
      return {
        id: `add_${id}`,
        title: title,
        description: `₹${medicine.price} - ${medicine.category}`
      };
    });
    
    substituteRows.push({
      id: 'back_to_explore',
      title: '⬅️ Back to Categories',
      description: 'Choose a different medicine'
    });

    const sections = [{
      title: "Available Substitutes",
      rows: substituteRows
    }];

    await sendInteractiveList(
      to,
      `Sorry, ${originalMedicine.name} is out of stock. We recommend these substitutes:`,
      "Choose a Substitute",
      sections,
      `💊 Substitutions for ${originalMedicine.name}`,
      "Tap to select an alternative"
    );

    updateUserSession(to, { 
      current_step: 'awaiting_substitution',
      pending_medicine: medicineId 
    });
    
  } catch (error) {
    console.error('❌ Error sending substitutions:', error);
    await sendTextMessage(to, "Sorry, we are out of stock for that medicine. Please try another one.");
    await sendMedicineCategories(to);
  }
}

// Send cart status with options
async function sendCartStatus(to) {
  try {
    const session = getUserSession(to);
    const cart = session.cart || [];

    if (cart.length === 0) {
      await sendTextMessage(to, "Your cart is empty. Let me show you our medicines.");
      await sendWelcomeMessage(to);
      return;
    }

    const cartItems = formatCartItems(cart);
    const total = calculateCartTotal(cart);
    
    const cartText = `Here's what's in your cart:\n\n${cartItems}\n\n💰 Subtotal: ₹${total.toFixed(2)}\n\nWhat would you like to do next?`;

    const cartButtons = [
      { id: 'confirm_order', title: '✅ Confirm Order' },
      { id: 'place_new_order', title: '➕ Add More' },
      { id: 'clear_cart', title: '🗑️ Clear Cart' }
    ];

    await sendInteractiveButtons(
      to,
      cartText,
      cartButtons,
      "🛍️ Shopping Cart",
      "Choose your next action"
    );

    updateUserSession(to, { current_step: 'cart_review' });

  } catch (error) {
    console.error('❌ Error sending cart status:', error);
    await sendTextMessage(to, "Sorry, couldn't display cart. Please try again.");
  }
}

// Send payment options
async function sendPaymentOptions(to) {
  try {
    const session = getUserSession(to);
    const cart = session.cart || [];
    const total = calculateCartTotal(cart);

    const paymentText = `📋 Order Summary:\n\n${formatCartItems(cart)}\n\n💰 Total Amount: ₹${total.toFixed(2)}\n\nPlease select your payment method:`;

    const paymentButtons = [
      { id: 'payment_cod', title: '💵 Cash on Delivery' },
      { id: 'back_to_cart', title: '⬅️ Back to Cart' }
    ];

    await sendInteractiveButtons(
      to,
      paymentText,
      paymentButtons,
      "💳 Payment Options",
      "Secure payment processing"
    );

    updateUserSession(to, { current_step: 'payment' });

  } catch (error) {
    console.error('❌ Error sending payment options:', error);
    await sendTextMessage(to, "Sorry, couldn't process payment. Please try again.");
  }
}

// Send final order confirmation
async function sendOrderConfirmation(to) {
  try {
    const session = getUserSession(to);
    const cart = session.cart || [];
    const total = calculateCartTotal(cart);

    const orderId = `ORD${Date.now().toString().slice(-6)}`;

    const confirmationText = `🎉 Order Placed Successfully!\n\n` +
      `📦 Order ID: ${orderId}\n` +
      `👤 Customer: ${EXISTING_CUSTOMER.name}\n\n` +
      `📝 Items Ordered:\n${formatCartItems(cart)}\n\n` +
      `💸 Total Amount: ₹${total.toFixed(2)}\n` +
      `🚚 Payment Method: Cash on Delivery\n\n` +
      `⏱️ Your order will be delivered within 30-60 minutes.\n` +
      `📞 For any queries, call: +91-9876543210\n\n` +
      `Thank you for choosing Ganesh Medicals! ✨`;

    await sendTextMessage(to, confirmationText);

    clearUserCart(to);
    updateUserSession(to, { 
      current_step: 'order_completed',
      last_order_id: orderId 
    });

    setTimeout(async () => {
      const restartButtons = [
        { id: 'new_order', title: '🛒 Place New Order' },
        { id: 'track_order', title: '📦 Track Order' }
      ];

      await sendInteractiveButtons(
        to,
        "Need anything else?",
        restartButtons,
        null,
        "We're here to help!"
      );
    }, 2000);

  } catch (error) {
    console.error('❌ Error sending order confirmation:', error);
    await sendTextMessage(to, "Order placed successfully! You'll receive confirmation shortly.");
  }
}

// 🔹 MAIN MESSAGE HANDLER
async function handleIncomingMessage(from, message) {
  console.log(`📥 Processing message from ${from}:`, JSON.stringify(message, null, 2));
  
  const session = getUserSession(from);
  
  try {
    // Handle interactive button replies
    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
      const buttonId = message.interactive.button_reply.id;
      console.log(`🔘 Button clicked: ${buttonId}`);

      if (buttonId === 'reorder') {
        await sendLastOrderSelection(from);
      }
      else if (buttonId === 'place_new_order') {
        await sendMedicineCategories(from);
      }
      else if (buttonId.startsWith('confirm_add_')) {
        const medicineId = buttonId.replace('confirm_add_', '');
        const medicine = getMedicineById(medicineId);
        
        if (medicine) {
          const updatedCart = [...(session.cart || []), medicineId];
          updateUserSession(from, { cart: updatedCart });
          
          await sendTextMessage(from, `✅ Added ${medicine.name} to your cart!`);
          
          // Call the sendRecommendations function to integrate the feature
          await sendRecommendations(from, medicineId);
        }
      }
      else if (buttonId === 'confirm_order') {
        await sendPaymentOptions(from);
      }
      else if (buttonId === 'payment_cod') {
        await sendOrderConfirmation(from);
      }
      else if (buttonId === 'clear_cart') {
        clearUserCart(from);
        await sendTextMessage(from, "🗑️ Cart cleared successfully!");
        await sendWelcomeMessage(from);
      }
      else if (buttonId === 'back_to_cart') {
        await sendCartStatus(from);
      }
      else if (buttonId === 'back_to_main') {
        await sendWelcomeMessage(from);
      }
      else if (buttonId === 'new_order') {
        clearUserCart(from);
        updateUserSession(from, { current_step: 'start' });
        await sendWelcomeMessage(from);
      }
      else if (buttonId === 'track_order') {
        const orderId = session.last_order_id || 'ORD123456';
        await sendTextMessage(from, `📦 Order Status for ${orderId}:\n\n🚚 Your order is being prepared and will be delivered soon!\n\n📞 For updates, call: +91-9876543210`);
      }
      else if (buttonId === 'view_cart') {
        await sendCartStatus(from);
      }
      else {
        await sendTextMessage(from, "Sorry, I didn't understand that. Let me help you start over.");
        await sendWelcomeMessage(from);
      }
    }
    // Handle interactive list replies
    else if (message.type === 'interactive' && message.interactive?.type === 'list_reply') {
      const listId = message.interactive.list_reply.id;
      console.log(`📋 List item selected: ${listId}`);

      // Handle category selection
      if (listId.startsWith('category_')) {
        const category = listId.replace('category_', '');
        await sendMedicinesByCategory(from, category);
      }
      // Handle adding medicine from list
      else if (listId.startsWith('add_')) {
        const medicineId = listId.replace('add_', '');
        const medicine = getMedicineById(medicineId);

        if (medicine && medicine.stock === 'out_of_stock') {
          // If out of stock, send substitutions instead of details
          await sendSubstitutions(from, medicineId);
        } else {
          // If in stock, proceed with the usual details flow
          await sendMedicineDetails(from, medicineId);
        }
      }
      else if (listId === 'reorder_all_last') {
        const lastOrderItems = EXISTING_CUSTOMER.last_order_items;
        const updatedCart = [...(session.cart || []), ...lastOrderItems];
        updateUserSession(from, { cart: updatedCart });
        
        await sendTextMessage(from, `✅ Added all items from your last order to the cart!`);
        await sendCartStatus(from);
      }
      else if (listId === 'back_to_main') {
        await sendWelcomeMessage(from);
      }
      else if (listId === 'back_to_explore') {
        await sendMedicineCategories(from);
      }
      else if (listId === 'view_cart') {
        await sendCartStatus(from);
      }
      else {
        await sendTextMessage(from, "Sorry, I didn't understand that selection. Let me help you start over.");
        await sendWelcomeMessage(from);
      }
    }
    // Handle text messages or first interaction
    else {
      console.log(`💬 Text message received: "${message.text?.body || 'No text'}"`);
      
      const messageText = (message.text?.body || '').toLowerCase();
      if (messageText.includes('hi') || messageText.includes('hello') || messageText.includes('start') || session.current_step === 'start') {
        await sendWelcomeMessage(from);
      } else {
        await sendWelcomeMessage(from);
      }
    }

  } catch (error) {
    console.error('❌ Error handling message:', error);
    await sendTextMessage(from, "Oops! Something went wrong. Let me help you start fresh.");
    await sendWelcomeMessage(from);
  }
}

// 🔹 WEBHOOK ENDPOINTS

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification:', { mode, token });

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook message handler
app.post('/webhook', async (req, res) => {
  try {
    console.log('📩 Webhook received:', JSON.stringify(req.body, null, 2));
    
    if (req.body.object === 'whatsapp_business_account') {
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
                    
                    if (from && message.timestamp) {
                      await handleIncomingMessage(from, message);
                    }
                  }
                }

                // Handle message statuses
                if (value.statuses && value.statuses.length > 0) {
                  for (const status of value.statuses) {
                    console.log(`📊 Message status:`, status.status, 'for:', status.recipient_id);
                  }
                }
              }
            }
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    sessions: userSessions.size,
    medicines: Object.keys(MEDICINES).length,
    categories: Object.keys(groupMedicinesByCategory(Object.keys(MEDICINES))).length
  });
});

// 🔹 START SERVER
app.listen(PORT, () => {
  console.log('🚀 Enhanced PharmaCare WhatsApp POC Bot Started!');
  console.log(`📱 Server running on port ${PORT}`);
  console.log('💊 Total medicines loaded:', Object.keys(MEDICINES).length);
  console.log('👤 Existing customer configured:', EXISTING_CUSTOMER.name);
  console.log('🔄 Session management initialized');
  console.log('🎯 POC Mode: Only serves registered customers');
  
  console.log('\n📋 Enhanced Configuration:');
  console.log('- Total medicines:', Object.keys(MEDICINES).length);
  console.log('- Medicine categories:', Object.keys(groupMedicinesByCategory(Object.keys(MEDICINES))).length);
  console.log('- Test customer phone:', EXISTING_CUSTOMER.phone_number);
  console.log('- Customer name:', EXISTING_CUSTOMER.name);
  console.log('- Last order items:', EXISTING_CUSTOMER.last_order_items.length);
  console.log('- New features: Selective reordering, Enhanced medicine Browse, Category organization, and Substitution logic.');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Enhanced PharmaCare Bot...');
  console.log(`📊 Final session count: ${userSessions.size}`);
  process.exit(0);
});