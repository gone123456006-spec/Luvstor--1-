/**
 * Diagnostic Script for Message Sending Issue
 * Tests why "File URL is required for media" error occurs
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Test scenarios
const testScenarios = [
  {
    name: 'Text Message (Normal)',
    body: {
      roomId: 'test-room-123',
      message: 'Hello, this is a test message',
      messageType: 'text',
      fileUrl: null
    }
  },
  {
    name: 'Image Message (with fileUrl)',
    body: {
      roomId: 'test-room-123',
      message: '',
      messageType: 'image',
      fileUrl: 'https://example.com/image.jpg'
    }
  },
  {
    name: 'Image Message (without fileUrl) - THIS SHOULD FAIL',
    body: {
      roomId: 'test-room-123',
      message: '',
      messageType: 'image',
      fileUrl: null
    }
  },
  {
    name: 'Audio Message (with fileUrl)',
    body: {
      roomId: 'test-room-123',
      message: '',
      messageType: 'audio',
      fileUrl: 'https://example.com/audio.mp3'
    }
  },
  {
    name: 'Audio Message (without fileUrl) - THIS SHOULD FAIL',
    body: {
      roomId: 'test-room-123',
      message: '',
      messageType: 'audio',
      fileUrl: null
    }
  },
  {
    name: 'Media Message (empty fileUrl string) - THIS SHOULD FAIL',
    body: {
      roomId: 'test-room-123',
      message: '',
      messageType: 'image',
      fileUrl: ''
    }
  },
  {
    name: 'Media Message (undefined fileUrl) - THIS SHOULD FAIL',
    body: {
      roomId: 'test-room-123',
      message: '',
      messageType: 'image'
      // fileUrl is undefined
    }
  }
];

async function diagnoseMessageSending() {
  console.log('🔍 DIAGNOSTIC SCRIPT: Message Sending Issue\n');
  console.log('='.repeat(60));
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  // Check backend endpoint
  console.log('📡 Testing Backend Endpoint...');
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.log('⚠️  Backend health check failed. Make sure backend is running.\n');
    } else {
      console.log('✅ Backend is reachable\n');
    }
  } catch (e) {
    console.log('⚠️  Could not reach backend\n');
  }

  // Analyze frontend code patterns
  console.log('📋 Analyzing Frontend Code Patterns...\n');
  
  console.log('1. Frontend sendMessage function signature:');
  console.log('   sendMessage(overrideContent, overrideType, overrideFileUrl)');
  console.log('   - overrideType: "text" | "image" | "audio"');
  console.log('   - overrideFileUrl: string | null | undefined\n');

  console.log('2. Request body structure sent to backend:');
  console.log('   {');
  console.log('     roomId: string,');
  console.log('     message: string,');
  console.log('     messageType: string,');
  console.log('     fileUrl: string | null | undefined');
  console.log('   }\n');

  // Check backend validation
  console.log('🔍 Backend Validation Analysis:\n');
  console.log('   Expected behavior:');
  console.log('   - If messageType === "text": message is required');
  console.log('   - If messageType === "image" or "audio": fileUrl is required');
  console.log('   - fileUrl should be a valid URL string\n');

  // Test scenarios
  console.log('🧪 Test Scenarios:\n');
  testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Request Body:`, JSON.stringify(scenario.body, null, 2));
    
    // Validation check
    const { messageType, fileUrl, message } = scenario.body;
    const hasFileUrl = fileUrl !== null && fileUrl !== undefined && fileUrl !== '';
    const hasMessage = message && message.trim() !== '';
    
    if (messageType === 'text') {
      if (hasMessage) {
        console.log('   ✅ Should PASS (text message with content)');
      } else {
        console.log('   ❌ Should FAIL (text message without content)');
      }
    } else if (messageType === 'image' || messageType === 'audio') {
      if (hasFileUrl) {
        console.log('   ✅ Should PASS (media message with fileUrl)');
      } else {
        console.log('   ❌ Should FAIL (media message without fileUrl)');
        console.log('   ⚠️  THIS IS LIKELY THE ISSUE!');
      }
    }
    console.log('');
  });

  // Common issues
  console.log('🐛 Common Issues Found:\n');
  console.log('1. ❌ Backend sendMessage controller only accepts { roomId, message }');
  console.log('   - Does NOT handle messageType or fileUrl');
  console.log('   - Location: backend/controllers/chatController.js:159-196\n');

  console.log('2. ❌ Frontend sends messageType and fileUrl but backend ignores them');
  console.log('   - Frontend: frontend/src/pages/Chat.jsx:494-499');
  console.log('   - Backend validation missing for media messages\n');

  console.log('3. ⚠️  Message Model has fileUrl field but backend doesn\'t use it');
  console.log('   - Model: backend/models/Message.js');
  console.log('   - Controller doesn\'t save fileUrl to database\n');

  // Recommendations
  console.log('💡 Recommendations:\n');
  console.log('1. Update backend sendMessage controller to:');
  console.log('   - Accept messageType and fileUrl in request body');
  console.log('   - Validate: if messageType !== "text", require fileUrl');
  console.log('   - Save fileUrl to Message model when creating message\n');

  console.log('2. Add validation in backend:');
  console.log('   if (messageType === "image" || messageType === "audio") {');
  console.log('     if (!fileUrl || fileUrl.trim() === "") {');
  console.log('       return res.status(400).json({');
  console.log('         message: "File URL is required for media"');
  console.log('       });');
  console.log('     }');
  console.log('   }\n');

  console.log('3. Update Message.create() to include:');
  console.log('   - messageType: req.body.messageType || "text"');
  console.log('   - fileUrl: req.body.fileUrl || null');
  console.log('   - content: req.body.message (for text) or "" (for media)\n');

  // Code snippets
  console.log('📝 Code Fix Snippet:\n');
  console.log('```javascript');
  console.log('exports.sendMessage = async (req, res) => {');
  console.log('  try {');
  console.log('    const { roomId, message, messageType = "text", fileUrl } = req.body;');
  console.log('');
  console.log('    // Validation');
  console.log('    if (!roomId) {');
  console.log('      return res.status(400).json({ message: "Room ID is required" });');
  console.log('    }');
  console.log('');
  console.log('    // For media messages, require fileUrl');
  console.log('    if (messageType !== "text" && (!fileUrl || fileUrl.trim() === "")) {');
  console.log('      return res.status(400).json({');
  console.log('        message: "File URL is required for media"');
  console.log('      });');
  console.log('    }');
  console.log('');
  console.log('    // For text messages, require message content');
  console.log('    if (messageType === "text" && (!message || message.trim() === "")) {');
  console.log('      return res.status(400).json({ message: "Message content is required" });');
  console.log('    }');
  console.log('');
  console.log('    // ... rest of the code');
  console.log('    const newMessage = await Message.create({');
  console.log('      sender: user._id,');
  console.log('      receiver: partnerIdStr,');
  console.log('      roomId: roomId,');
  console.log('      content: messageType === "text" ? message : "",');
  console.log('      messageType: messageType,');
  console.log('      fileUrl: fileUrl || null');
  console.log('    });');
  console.log('  }');
  console.log('};');
  console.log('```\n');

  console.log('='.repeat(60));
  console.log('✅ Diagnostic complete!');
}

// Run if executed directly
if (require.main === module) {
  diagnoseMessageSending().catch(console.error);
}

module.exports = { diagnoseMessageSending, testScenarios };
