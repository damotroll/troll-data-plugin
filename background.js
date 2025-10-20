// background.js - Handle OpenAI API calls and data generation

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateData') {
    generateFormData(request.fields, request.context, request.options)
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Generate form data using OpenAI API
async function generateFormData(fields, context, options) {
  try {
    // Get API key and model from storage
    const settings = await chrome.storage.local.get(['apiKey', 'model']);
    if (!settings.apiKey) {
      throw new Error('API key not configured');
    }
    
    const model = settings.model || 'gpt-4o-mini';
    
    // Prepare the prompt
    const prompt = buildPrompt(fields, context, options);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a professional test data generator for forms. Generate consistent, realistic but fake data.
                     
CRITICAL RULES:
1. Return ONLY valid JSON without any markdown formatting, code blocks, or explanations
2. All data must be fake but realistic enough to pass validation
3. ${options.consistentPerson ? 'Use the SAME person\'s information across all name, email, and personal fields' : 'Generate different data for each field'}
4. ${options.targetCountry ? `Generate data specific to ${getCountryName(options.targetCountry)} with proper formats` : 'Use appropriate formats based on field context'}
5. Ensure all related fields are consistent (e.g., email should match the person's name)
6. Use proper formats for each country (phone numbers, postal codes, addresses, etc.)
7. ${options.useRealistic ? 'Create believable, professional data' : 'Use clearly fake test data like "Test User"'}

IMPORTANT: Your response must be ONLY a JSON object, nothing else.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let generatedData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedData = JSON.parse(cleanContent);
    } catch (e) {
      throw new Error('Failed to parse AI response');
    }
    
    // Map generated data to fields
    return fields.map(field => {
      const value = generatedData[field.id] || generateFallbackValue(field, options);
      return {
        fieldId: field.id,
        value: value
      };
    });
    
  } catch (error) {
    console.error('Error generating form data:', error);
    // Fallback to local generation
    return generateLocalData(fields, options);
  }
}

// Get country name from code
function getCountryName(code) {
  const countries = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'NZ': 'New Zealand',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'KR': 'South Korea',
    'ZA': 'South Africa',
    'AE': 'United Arab Emirates'
  };
  return countries[code] || code;
}

// Build prompt for OpenAI
function buildPrompt(fields, context, options) {
  const countryName = options.targetCountry ? getCountryName(options.targetCountry) : null;
  
  let prompt = `Generate test data for a form with ${fields.length} fields.\n\n`;
  
  if (countryName) {
    prompt += `COUNTRY CONTEXT: Generate all data for ${countryName}. `;
    prompt += `Use ${countryName} formats for:\n`;
    prompt += `- Phone numbers (proper country format)\n`;
    prompt += `- Addresses (real city names, proper postal/zip code format)\n`;
    prompt += `- State/Province names (if applicable)\n`;
    prompt += `- Date formats\n`;
    prompt += `- ID numbers (if applicable)\n\n`;
  }
  
  if (options.consistentPerson) {
    prompt += `CONSISTENCY REQUIREMENT: Use the SAME person throughout:\n`;
    prompt += `- Generate ONE person's full name\n`;
    prompt += `- Use that SAME name for all name fields\n`;
    prompt += `- Email should be based on that person's name\n`;
    prompt += `- Keep all personal data consistent for this one person\n\n`;
  }
  
  if (context) {
    prompt += `PAGE CONTEXT:\n`;
    prompt += `- Domain: ${context.domain}\n`;
    prompt += `- Page Title: ${context.title}\n`;
    if (context.hasLoginForm) prompt += `- Type: Login Form\n`;
    if (context.hasCheckoutForm) prompt += `- Type: Checkout Form\n`;
    if (context.hasRegistrationForm) prompt += `- Type: Registration Form\n`;
    prompt += '\n';
  }
  
  prompt += 'FIELDS TO FILL:\n';
  prompt += 'Generate appropriate values for each field ID. Each field has the following properties:\n\n';
  
  // Group fields by type for better context
  const groupedFields = {};
  fields.forEach(field => {
    if (!groupedFields[field.fieldType]) {
      groupedFields[field.fieldType] = [];
    }
    groupedFields[field.fieldType].push(field);
  });
  
  // Add fields with detailed information
  fields.forEach(field => {
    prompt += `Field ID: ${field.id}\n`;
    prompt += `- Type: ${field.fieldType}\n`;
    prompt += `- HTML Input Type: ${field.type}\n`;
    
    if (field.label) prompt += `- Label: "${field.label}"\n`;
    if (field.attributes.placeholder) prompt += `- Placeholder: "${field.attributes.placeholder}"\n`;
    if (field.attributes.name) prompt += `- Name attribute: "${field.attributes.name}"\n`;
    
    // Add constraints
    if (field.attributes.maxLength) prompt += `- Max Length: ${field.attributes.maxLength}\n`;
    if (field.attributes.pattern) prompt += `- Regex Pattern: ${field.attributes.pattern}\n`;
    if (field.attributes.min) prompt += `- Min Value: ${field.attributes.min}\n`;
    if (field.attributes.max) prompt += `- Max Value: ${field.attributes.max}\n`;
    if (field.attributes.required) prompt += `- Required: Yes\n`;
    
    // Add select options
    if (field.options && field.options.length > 0) {
      prompt += `- Available Options: ${field.options.slice(0, 10).join(', ')}\n`;
      if (field.options.length > 10) prompt += `  (and ${field.options.length - 10} more...)\n`;
    }
    
    prompt += '\n';
  });
  
  prompt += '\nGENERATION RULES:\n';
  prompt += '1. Return a JSON object where keys are field IDs and values are the generated data\n';
  prompt += '2. Follow all field constraints (maxLength, pattern, min/max)\n';
  prompt += '3. For select fields, choose from the provided options\n';
  prompt += '4. Generate valid, properly formatted data\n';
  prompt += '5. Keep related fields consistent\n';
  
  if (countryName) {
    prompt += `6. All geographic data must be valid for ${countryName}\n`;
    prompt += `7. Use real ${countryName} city names and valid postal codes\n`;
  }
  
  prompt += '\nReturn ONLY the JSON object with field IDs as keys and generated values.';
  
  return prompt;
}

// Generate fallback value for a field
function generateFallbackValue(field, options) {
  const realistic = options.useRealistic;
  const country = options.targetCountry || 'US';
  
  // Country-specific data
  const countryData = {
    'US': {
      phone: '(555) 123-4567',
      zip: '94102',
      state: 'CA',
      city: 'San Francisco',
      address: '123 Main Street'
    },
    'GB': {
      phone: '+44 20 7946 0958',
      zip: 'SW1A 1AA',
      state: 'England',
      city: 'London',
      address: '123 High Street'
    },
    'CA': {
      phone: '(416) 555-0123',
      zip: 'M5H 2N2',
      state: 'ON',
      city: 'Toronto',
      address: '123 King Street'
    },
    'AU': {
      phone: '(02) 9123 4567',
      zip: '2000',
      state: 'NSW',
      city: 'Sydney',
      address: '123 George Street'
    },
    'DE': {
      phone: '+49 30 12345678',
      zip: '10115',
      state: 'Berlin',
      city: 'Berlin',
      address: 'Hauptstraße 123'
    },
    'FR': {
      phone: '+33 1 23 45 67 89',
      zip: '75001',
      state: 'Île-de-France',
      city: 'Paris',
      address: '123 Rue de la Paix'
    }
  };
  
  const countryInfo = countryData[country] || countryData['US'];
  
  switch (field.fieldType) {
    case 'email':
      return realistic ? 'john.doe@example.com' : 'test@test.com';
    case 'phone':
      return countryInfo.phone;
    case 'firstName':
      return realistic ? 'John' : 'Test';
    case 'lastName':
      return realistic ? 'Doe' : 'User';
    case 'name':
      return realistic ? 'John Doe' : 'Test User';
    case 'address':
      return countryInfo.address;
    case 'city':
      return countryInfo.city;
    case 'state':
      return field.options ? field.options[0] : countryInfo.state;
    case 'zip':
      return countryInfo.zip;
    case 'country':
      return field.options ? field.options[0] : getCountryName(country);
    case 'company':
      return realistic ? 'Acme Corporation' : 'Test Company';
    case 'website':
      return realistic ? 'https://example.com' : 'https://test.com';
    case 'username':
      return realistic ? 'johndoe' : 'testuser';
    case 'password':
      return realistic ? 'SecurePass123!' : 'Test123!';
    case 'creditCard':
      return '4111111111111111'; // Test Visa number
    case 'cvv':
      return '123';
    case 'expiry':
      return '12/25';
    case 'age':
      return realistic ? '28' : '25';
    case 'birthdate':
      return realistic ? '1995-06-15' : '2000-01-01';
    case 'gender':
      return field.options ? field.options[0] : 'male';
    case 'title':
      return field.options ? field.options[0] : 'Mr';
    case 'description':
      return realistic ? 
        'This is a sample description for testing purposes. It contains multiple sentences to simulate real user input.' :
        'Test description text.';
    case 'date':
      const today = new Date();
      const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return futureDate.toISOString().split('T')[0];
    case 'select':
      return field.options && field.options.length > 0 ? field.options[0] : '';
    case 'number':
      return '42';
    default:
      return realistic ? 'Sample text' : 'Test';
  }
}

// Generate local data without API
function generateLocalData(fields, options) {
  // If consistent person is enabled, generate one person's data
  const personData = options.consistentPerson ? {
    firstName: options.useRealistic ? 'Emily' : 'Test',
    lastName: options.useRealistic ? 'Johnson' : 'User',
    email: options.useRealistic ? 'emily.johnson@example.com' : 'test@test.com',
    username: options.useRealistic ? 'emilyjohnson' : 'testuser'
  } : null;
  
  return fields.map(field => {
    let value;
    
    // Use consistent person data if applicable
    if (personData) {
      switch (field.fieldType) {
        case 'firstName':
          value = personData.firstName;
          break;
        case 'lastName':
          value = personData.lastName;
          break;
        case 'name':
          value = `${personData.firstName} ${personData.lastName}`;
          break;
        case 'email':
          value = personData.email;
          break;
        case 'username':
          value = personData.username;
          break;
        default:
          value = generateFallbackValue(field, options);
      }
    } else {
      value = generateFallbackValue(field, options);
    }
    
    return {
      fieldId: field.id,
      value: value
    };
  });
}

// Demo data sets for different scenarios
const demoDataSets = {
  personal: {
    firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David'],
    lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'],
    email: ['john@example.com', 'jane@test.com', 'mike@demo.org'],
    phone: ['(555) 123-4567', '(555) 987-6543', '(555) 246-8135']
  },
  business: {
    company: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs'],
    website: ['https://acme.example.com', 'https://techstart.demo', 'https://global.test'],
    address: ['123 Business Blvd', '456 Corporate Way', '789 Enterprise St']
  },
  location: {
    city: ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Boston'],
    state: ['CA', 'NY', 'IL', 'TX', 'FL'],
    country: ['United States', 'Canada', 'United Kingdom', 'Australia'],
    zip: ['94102', '10001', '90001', '60601', '02101']
  }
};