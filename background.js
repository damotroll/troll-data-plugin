// background.js - Handle Random User API calls and data generation

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateData') {
    generateFormData(request.fields, request.context, request.options)
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Generate form data using Random User API
async function generateFormData(fields, context, options) {
  try {
    // Get target country from options
    const country = options.targetCountry || '';

    // Map country codes to Random User API nationality codes
    const nationalityMap = {
      'US': 'us',
      'GB': 'gb',
      'CA': 'ca',
      'AU': 'au',
      'DE': 'de',
      'FR': 'fr',
      'ES': 'es',
      'IT': 'it',
      'NL': 'nl',
      'NO': 'no',
      'DK': 'dk',
      'FI': 'fi',
      'NZ': 'nz',
      'BR': 'br',
      'MX': 'mx',
      'CH': 'ch',
      'IE': 'ie',
      'TR': 'tr'
    };

    // Build Random User API URL
    let apiUrl = 'https://randomuser.me/api/?results=1';
    if (country && nationalityMap[country]) {
      apiUrl += `&nat=${nationalityMap[country]}`;
    }

    // Call Random User API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Random User API request failed');
    }

    const data = await response.json();
    const user = data.results[0];

    // Map Random User data to form fields
    return fields.map(field => {
      const value = mapRandomUserToField(user, field, options);
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

// Map Random User API data to specific field types
function mapRandomUserToField(user, field, options) {
  const realistic = options.useRealistic;

  switch (field.fieldType) {
    case 'email':
      return user.email;
    case 'phone':
      return user.phone || user.cell;
    case 'firstName':
      return user.name.first;
    case 'lastName':
      return user.name.last;
    case 'name':
      return `${user.name.first} ${user.name.last}`;
    case 'title':
      return field.options && field.options.length > 0 ?
        field.options.find(opt => opt.toLowerCase().includes(user.name.title.toLowerCase())) || field.options[0] :
        user.name.title;
    case 'address':
      return `${user.location.street.number} ${user.location.street.name}`;
    case 'city':
      return user.location.city;
    case 'state':
      // For select fields, try to match the state from options
      if (field.options && field.options.length > 0) {
        return field.options[0];
      }
      return user.location.state;
    case 'zip':
      return user.location.postcode.toString();
    case 'country':
      // For select fields, try to match the country
      if (field.options && field.options.length > 0) {
        const countryMatch = field.options.find(opt =>
          opt.toLowerCase().includes(user.location.country.toLowerCase()) ||
          user.location.country.toLowerCase().includes(opt.toLowerCase())
        );
        return countryMatch || field.options[0];
      }
      return user.location.country;
    case 'username':
      return user.login.username;
    case 'password':
      return realistic ? user.login.password : 'Test123!';
    case 'age':
      return user.dob.age.toString();
    case 'birthdate':
      // Format: YYYY-MM-DD
      const dob = new Date(user.dob.date);
      return dob.toISOString().split('T')[0];
    case 'gender':
      // Match gender to options if available
      if (field.options && field.options.length > 0) {
        const genderMatch = field.options.find(opt =>
          opt.toLowerCase().includes(user.gender.toLowerCase())
        );
        return genderMatch || field.options[0];
      }
      return user.gender;
    case 'company':
      return realistic ? `${user.name.last} Corporation` : 'Test Company';
    case 'website':
      return realistic ? `https://www.${user.login.username}.com` : 'https://test.com';
    case 'ssn':
      // Random User API provides SSN/ID for certain countries
      if (user.id && user.id.value) {
        return user.id.value;
      }
      return realistic ? '123-45-6789' : '000-00-0000';
    case 'creditCard':
      return '4111111111111111'; // Test Visa number
    case 'cvv':
      return '123';
    case 'expiry':
      return '12/25';
    case 'description':
      return realistic ?
        `This is a sample description for testing purposes. Contact me at ${user.email} for more information.` :
        'Test description text.';
    case 'date':
      const today = new Date();
      const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return futureDate.toISOString().split('T')[0];
    case 'select':
      return field.options && field.options.length > 0 ? field.options[0] : '';
    case 'number':
      return user.dob.age.toString();
    default:
      return generateFallbackValue(field, options);
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
    case 'ssn':
      return realistic ? '123-45-6789' : '000-00-0000';
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