// Minimal test content script

console.log('✅ Test content script loaded!');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('📬 Test received message');

  if (request.action === 'test') {
    try {
      // Find any form elements
      const inputs = document.querySelectorAll('input').length;
      const textareas = document.querySelectorAll('textarea').length;
      const buttons = document.querySelectorAll('button').length;

      console.log('📊 Found elements:');
      console.log('- Inputs:', inputs);
      console.log('- Textareas:', textareas);
      console.log('- Buttons:', buttons);

      // Look for specific Indeed profile elements
      const summaryForm = document.querySelector('form[id*="summary"]');
      const profileSections = document.querySelectorAll('[data-testid*="section"]').length;

      console.log('- Summary form:', summaryForm ? 'found' : 'not found');
      console.log('- Profile sections:', profileSections);

      const responseData = {
        success: true,
        inputs: inputs,
        textareas: textareas,
        buttons: buttons,
        hasSummaryForm: !!summaryForm,
        profileSections: profileSections
      };

      console.log('📤 Sending response:', responseData);
      sendResponse(responseData);

    } catch (error) {
      console.error('❌ Error in test script:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  return true;
});
