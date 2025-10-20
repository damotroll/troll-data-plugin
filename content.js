// content.js - Analyze and fill forms on the page

// Check if script is already injected
if (typeof window.smartFormFillerInjected === 'undefined') {
  window.smartFormFillerInjected = true;

  // Field type detection patterns
const fieldPatterns = {
  email: /email|e-mail|correo|courriel/i,
  phone: /phone|tel|mobile|cellular|telefono|telephone/i,
  name: /name|nombre|nom|ime/i,
  firstName: /first.*name|given.*name|prenom|nombre.*pila/i,
  lastName: /last.*name|surname|family.*name|apellido|nom.*famille/i,
  address: /address|street|direccion|adresse|addr/i,
  city: /city|ciudad|ville/i,
  state: /state|province|estado|region/i,
  zip: /zip|postal|postcode|codigo.*postal/i,
  country: /country|pais|pays/i,
  company: /company|organization|empresa|societe|org/i,
  website: /website|url|site|web/i,
  username: /username|user.*name|usuario|utilisateur/i,
  password: /password|pass|contrasena|mot.*passe/i,
  creditCard: /card.*number|cc.*num|credit.*card/i,
  cvv: /cvv|cvc|security.*code/i,
  expiry: /exp|expiry|expiration|vencimiento/i,
  ssn: /ssn|social.*security/i,
  date: /date|fecha|datum/i,
  birthdate: /birth|dob|fecha.*nacimiento|anniversaire/i,
  age: /age|edad/i,
  gender: /gender|sex|genero|sexe/i,
  title: /title|titulo|titre/i,
  description: /description|desc|message|comment|descripcion/i
};

// Analyze forms on the page
function analyzeForms(visibleOnly = false, options = {}) {
  const fields = [];
  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    // Skip if visible only mode and element is not visible
    if (visibleOnly && !isElementVisible(input)) {
      return;
    }
    
    // Skip certain input types
    if (input.type === 'hidden' || input.type === 'submit' || 
        input.type === 'button' || input.type === 'reset' ||
        input.type === 'file' || input.type === 'image') {
      return;
    }
    
    // Skip password fields if option is disabled
    if (!options.fillPasswords && input.type === 'password') {
      return;
    }
    
    // Skip if field already has a value
    if (input.value && input.value.trim() !== '') {
      return;
    }
    
    const fieldInfo = {
      id: generateFieldId(input),
      type: input.type || 'text',
      tagName: input.tagName.toLowerCase(),
      fieldType: detectFieldType(input),
      attributes: {
        name: input.name || '',
        id: input.id || '',
        className: input.className || '',
        placeholder: input.placeholder || '',
        maxLength: input.maxLength > 0 ? input.maxLength : null,
        pattern: input.pattern || null,
        required: input.required || false,
        min: input.min || null,
        max: input.max || null
      },
      label: getFieldLabel(input),
      options: input.tagName === 'SELECT' ? getSelectOptions(input) : null,
      context: options.smartContext ? getFieldContext(input) : null
    };
    
    fields.push(fieldInfo);
  });
  
  // Get page context if smart context is enabled
  const pageContext = options.smartContext ? {
    title: document.title,
    url: window.location.href,
    domain: window.location.hostname,
    formCount: document.querySelectorAll('form').length,
    hasLoginForm: detectLoginForm(),
    hasCheckoutForm: detectCheckoutForm(),
    hasRegistrationForm: detectRegistrationForm()
  } : null;
  
  return {
    fields,
    context: pageContext
  };
}

// Check if element is visible
function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return rect.width > 0 && 
         rect.height > 0 && 
         style.display !== 'none' && 
         style.visibility !== 'hidden' &&
         style.opacity !== '0';
}

// Generate unique field identifier
function generateFieldId(input) {
  const index = Array.from(document.querySelectorAll('input, select, textarea')).indexOf(input);
  return `field_${index}_${Date.now()}`;
}

// Detect field type based on various attributes and context
function detectFieldType(input) {
  const combinedText = [
    input.name,
    input.id,
    input.className,
    input.placeholder,
    getFieldLabel(input)
  ].join(' ').toLowerCase();
  
  // Check input type first
  if (input.type === 'email') return 'email';
  if (input.type === 'tel') return 'phone';
  if (input.type === 'url') return 'website';
  if (input.type === 'number') {
    if (fieldPatterns.age.test(combinedText)) return 'age';
    if (fieldPatterns.cvv.test(combinedText)) return 'cvv';
    return 'number';
  }
  if (input.type === 'date' || input.type === 'datetime-local') {
    if (fieldPatterns.birthdate.test(combinedText)) return 'birthdate';
    return 'date';
  }
  
  // Check patterns
  for (const [type, pattern] of Object.entries(fieldPatterns)) {
    if (pattern.test(combinedText)) {
      return type;
    }
  }
  
  // Check for textarea
  if (input.tagName === 'TEXTAREA') {
    return 'description';
  }
  
  // Check for select
  if (input.tagName === 'SELECT') {
    const options = getSelectOptions(input);
    if (options.some(opt => /male|female/i.test(opt))) return 'gender';
    if (options.some(opt => /mr|mrs|ms|dr/i.test(opt))) return 'title';
    if (fieldPatterns.country.test(combinedText)) return 'country';
    if (fieldPatterns.state.test(combinedText)) return 'state';
    return 'select';
  }
  
  return 'text';
}

// Get field label
function getFieldLabel(input) {
  // Check for associated label
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }
  
  // Check for parent label
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.trim();
  }
  
  // Check for nearby text
  const parent = input.parentElement;
  if (parent) {
    const prevSibling = input.previousElementSibling;
    if (prevSibling && prevSibling.tagName === 'LABEL') {
      return prevSibling.textContent.trim();
    }
  }
  
  return '';
}

// Get select options
function getSelectOptions(select) {
  return Array.from(select.options)
    .filter(opt => opt.value && opt.value !== '')
    .map(opt => opt.value);
}

// Get field context
function getFieldContext(input) {
  const form = input.closest('form');
  if (!form) return null;
  
  return {
    formAction: form.action || '',
    formMethod: form.method || 'get',
    formClass: form.className || '',
    fieldsetLegend: getFieldsetLegend(input),
    nearbyHeadings: getNearbyHeadings(input)
  };
}

// Get fieldset legend
function getFieldsetLegend(input) {
  const fieldset = input.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend) return legend.textContent.trim();
  }
  return null;
}

// Get nearby headings
function getNearbyHeadings(input) {
  const headings = [];
  let element = input.parentElement;
  let depth = 0;
  
  while (element && depth < 5) {
    const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      headings.push(heading.textContent.trim());
    }
    element = element.parentElement;
    depth++;
  }
  
  return headings;
}

// Detect login form
function detectLoginForm() {
  const forms = document.querySelectorAll('form');
  return Array.from(forms).some(form => {
    const inputs = form.querySelectorAll('input');
    const hasUsername = Array.from(inputs).some(input => 
      fieldPatterns.username.test(input.name + input.id + input.placeholder) ||
      fieldPatterns.email.test(input.name + input.id + input.placeholder)
    );
    const hasPassword = Array.from(inputs).some(input => 
      input.type === 'password'
    );
    return hasUsername && hasPassword;
  });
}

// Detect checkout form
function detectCheckoutForm() {
  const pageText = document.body.textContent.toLowerCase();
  return /checkout|payment|billing|shipping|cart/i.test(pageText) &&
         document.querySelector('input[type="tel"], input[name*="card"], input[name*="credit"]');
}

// Detect registration form
function detectRegistrationForm() {
  const pageText = document.body.textContent.toLowerCase();
  return /register|sign.*up|create.*account|join/i.test(pageText) &&
         document.querySelector('input[type="password"]');
}

// Fill forms with generated data
function fillForms(data) {
  let filledCount = 0;
  
  data.forEach(fieldData => {
    const input = findFieldByInfo(fieldData.fieldId);
    if (input && fieldData.value !== undefined && fieldData.value !== null) {
      // Trigger focus event
      input.focus();
      
      // Set value
      if (input.tagName === 'SELECT') {
        // For select, try to match option value
        const option = Array.from(input.options).find(opt => 
          opt.value === fieldData.value || 
          opt.textContent.trim() === fieldData.value
        );
        if (option) {
          input.value = option.value;
        }
      } else {
        input.value = fieldData.value;
      }
      
      // Trigger change events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
      
      // Add visual feedback
      input.style.backgroundColor = '#e8f5e9';
      setTimeout(() => {
        input.style.backgroundColor = '';
      }, 1000);
      
      filledCount++;
    }
  });
  
  return filledCount;
}

// Find field by field info
function findFieldByInfo(fieldId) {
  // Try to find by the field ID we generated
  const allInputs = document.querySelectorAll('input, select, textarea');
  const index = parseInt(fieldId.split('_')[1]);
  if (allInputs[index]) {
    return allInputs[index];
  }
  return null;
}

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeForms') {
      try {
        const result = analyzeForms(request.visibleOnly, request.options);
        sendResponse(result);
      } catch (error) {
        console.error('Error analyzing forms:', error);
        sendResponse({ fields: [], context: null });
      }
    } else if (request.action === 'fillForms') {
      try {
        const filledCount = fillForms(request.data);
        sendResponse({ success: true, filledCount });
      } catch (error) {
        console.error('Error filling forms:', error);
        sendResponse({ success: false, filledCount: 0 });
      }
    }
    return true; // Keep message channel open for async response
  });
  
} // End of injection check