// popup.js - Handle the extension popup interface

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const fillBtn = document.getElementById('fillBtn');
  const fillVisibleBtn = document.getElementById('fillVisibleBtn');
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  
  // Option checkboxes
  const useRealisticCheckbox = document.getElementById('useRealistic');
  const fillPasswordsCheckbox = document.getElementById('fillPasswords');
  const smartContextCheckbox = document.getElementById('smartContext');
  const consistentPersonCheckbox = document.getElementById('consistentPerson');
  const targetCountrySelect = document.getElementById('targetCountry');
  
  // Load saved settings
  const settings = await chrome.storage.local.get([
    'apiKey', 
    'model', 
    'useRealistic', 
    'fillPasswords', 
    'smartContext',
    'consistentPerson',
    'targetCountry'
  ]);
  
  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
    fillBtn.disabled = false;
    fillVisibleBtn.disabled = false;
  } else {
    fillBtn.disabled = true;
    fillVisibleBtn.disabled = true;
  }
  
  if (settings.model) {
    modelSelect.value = settings.model;
  }
  
  if (settings.targetCountry) {
    targetCountrySelect.value = settings.targetCountry;
  }
  
  // Load checkbox settings
  useRealisticCheckbox.checked = settings.useRealistic !== false;
  fillPasswordsCheckbox.checked = settings.fillPasswords !== false;
  smartContextCheckbox.checked = settings.smartContext !== false;
  consistentPersonCheckbox.checked = settings.consistentPerson !== false;
  
  // Save settings
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    
    if (!apiKey) {
      showStatus('Please enter your OpenAI API key', 'error');
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      showStatus('Invalid API key format', 'error');
      return;
    }
    
    // Save to storage
    await chrome.storage.local.set({
      apiKey,
      model,
      useRealistic: useRealisticCheckbox.checked,
      fillPasswords: fillPasswordsCheckbox.checked,
      smartContext: smartContextCheckbox.checked,
      consistentPerson: consistentPersonCheckbox.checked,
      targetCountry: targetCountrySelect.value
    });
    
    fillBtn.disabled = false;
    fillVisibleBtn.disabled = false;
    showStatus('Settings saved successfully!', 'success');
  });
  
  // Save checkbox states on change
  useRealisticCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ useRealistic: useRealisticCheckbox.checked });
  });
  
  fillPasswordsCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ fillPasswords: fillPasswordsCheckbox.checked });
  });
  
  smartContextCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ smartContext: smartContextCheckbox.checked });
  });
  
  consistentPersonCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ consistentPerson: consistentPersonCheckbox.checked });
  });
  
  targetCountrySelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ targetCountry: targetCountrySelect.value });
  });
  
  // Fill all forms
  fillBtn.addEventListener('click', async () => {
    await fillForms(false);
  });
  
  // Fill visible forms only
  fillVisibleBtn.addEventListener('click', async () => {
    await fillForms(true);
  });
  
  async function fillForms(visibleOnly) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we can inject content script
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') || tab.url.startsWith('about:') || 
        tab.url.startsWith('brave://') || tab.url.startsWith('opera://')) {
      showStatus('Cannot access browser pages', 'error');
      statsDiv.textContent = 'Please navigate to a regular website';
      return;
    }
    
    showStatus('Analyzing forms...', 'info');
    statsDiv.textContent = 'Detecting form fields...';
    
    try {
      // Use direct injection approach
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: analyzeAndGetForms,
        args: [visibleOnly, {
          useRealistic: useRealisticCheckbox.checked,
          fillPasswords: fillPasswordsCheckbox.checked,
          smartContext: smartContextCheckbox.checked
        }]
      });
      
      const response = injectionResults[0].result;
      
      if (!response || !response.fields || response.fields.length === 0) {
        showStatus('No form fields found on this page', 'info');
        statsDiv.textContent = 'No fillable forms detected';
        return;
      }
      
      showStatus(`Found ${response.fields.length} fields. Generating data...`, 'info');
      statsDiv.textContent = `Processing ${response.fields.length} fields...`;
      
      // Send to background script to generate data
      chrome.runtime.sendMessage({
        action: 'generateData',
        fields: response.fields,
        context: response.context,
        options: {
          useRealistic: useRealisticCheckbox.checked,
          smartContext: smartContextCheckbox.checked,
          consistentPerson: consistentPersonCheckbox.checked,
          targetCountry: targetCountrySelect.value
        }
      }, async (result) => {
        if (result.error) {
          showStatus(`Error: ${result.error}`, 'error');
          statsDiv.textContent = 'Failed to generate data';
          return;
        }
        
        // Fill forms using direct injection
        const fillResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: fillFormsWithData,
          args: [result.data.map(d => ({
            ...d,
            index: response.fields.find(f => f.id === d.fieldId)?.index
          }))]
        });
        
        const filledCount = fillResults[0].result;
        
        if (filledCount > 0) {
          showStatus('Forms filled successfully!', 'success');
          statsDiv.textContent = `Filled ${filledCount} of ${response.fields.length} fields`;
        } else {
          showStatus('No fields were filled', 'info');
          statsDiv.textContent = 'Check if fields already have values';
        }
      });
      
    } catch (error) {
      console.error('Script injection error:', error);
      showStatus('Error: Cannot access this page', 'error');
      statsDiv.textContent = 'This page may have restrictions';
    }
  }
  
  // Injected functions (will be stringified and executed in page context)
  function analyzeAndGetForms(visibleOnly, options) {
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
      date: /date|fecha|datum/i,
      birthdate: /birth|dob|fecha.*nacimiento|anniversaire/i,
      age: /age|edad/i,
      gender: /gender|sex|genero|sexe/i,
      title: /title|titulo|titre/i,
      description: /description|desc|message|comment|descripcion/i
    };

    // Helper functions
    function isElementVisible(element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      return rect.width > 0 && 
             rect.height > 0 && 
             style.display !== 'none' && 
             style.visibility !== 'hidden' &&
             style.opacity !== '0';
    }

    function getFieldLabel(input) {
      if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) return label.textContent.trim();
      }
      
      const parentLabel = input.closest('label');
      if (parentLabel) {
        return parentLabel.textContent.trim();
      }
      
      const parent = input.parentElement;
      if (parent) {
        const prevSibling = input.previousElementSibling;
        if (prevSibling && prevSibling.tagName === 'LABEL') {
          return prevSibling.textContent.trim();
        }
      }
      
      return '';
    }

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
        const options = Array.from(input.options)
          .filter(opt => opt.value && opt.value !== '')
          .map(opt => opt.value);
        
        if (options.some(opt => /male|female/i.test(opt))) return 'gender';
        if (options.some(opt => /mr|mrs|ms|dr/i.test(opt))) return 'title';
        if (fieldPatterns.country.test(combinedText)) return 'country';
        if (fieldPatterns.state.test(combinedText)) return 'state';
        return 'select';
      }
      
      return 'text';
    }

    // Main analysis
    const fields = [];
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input, index) => {
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
        id: `field_${index}_${Date.now()}`,
        index: index,
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
        options: input.tagName === 'SELECT' ? 
          Array.from(input.options)
            .filter(opt => opt.value && opt.value !== '')
            .map(opt => opt.value) : null
      };
      
      fields.push(fieldInfo);
    });
    
    // Get page context
    const pageContext = options.smartContext ? {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      formCount: document.querySelectorAll('form').length
    } : null;
    
    return {
      fields,
      context: pageContext
    };
  }

  function fillFormsWithData(data) {
    let filledCount = 0;
    const allInputs = document.querySelectorAll('input, select, textarea');
    
    data.forEach(fieldData => {
      if (fieldData.index !== undefined && allInputs[fieldData.index]) {
        const input = allInputs[fieldData.index];
        
        if (fieldData.value !== undefined && fieldData.value !== null) {
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
          input.style.transition = 'background-color 0.3s';
          input.style.backgroundColor = '#e8f5e9';
          setTimeout(() => {
            input.style.backgroundColor = '';
          }, 1000);
          
          filledCount++;
        }
      }
    });
    
    return filledCount;
  }
      
      if (!response || !response.fields || response.fields.length === 0) {
        showStatus('No form fields found on this page', 'info');
        statsDiv.textContent = 'No fillable forms detected';
        return;
      }
      
      showStatus(`Found ${response.fields.length} fields. Generating data...`, 'info');
      statsDiv.textContent = `Processing ${response.fields.length} fields...`;
      
      // Send to background script to generate data
      chrome.runtime.sendMessage({
        action: 'generateData',
        fields: response.fields,
        context: response.context,
        options: {
          useRealistic: useRealisticCheckbox.checked,
          smartContext: smartContextCheckbox.checked
        }
      }, (result) => {
        if (result.error) {
          showStatus(`Error: ${result.error}`, 'error');
          statsDiv.textContent = 'Failed to generate data';
          return;
        }
        
        // Send generated data back to content script to fill forms
        chrome.tabs.sendMessage(tab.id, {
          action: 'fillForms',
          data: result.data
        }, (fillResponse) => {
          if (fillResponse && fillResponse.success) {
            showStatus('Forms filled successfully!', 'success');
            statsDiv.textContent = `Filled ${fillResponse.filledCount} of ${response.fields.length} fields`;
          } else {
            showStatus('Error filling forms', 'error');
          }
        });
      });
    });
  }
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusDiv.className = 'status';
      }, 3000);
    }
  }
});