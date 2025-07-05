# Storage Debugging Guide

## 🔍 **Debugging Steps**

### **Step 1: Check Console for Storage Messages**
Open Chrome DevTools (F12) → Console tab and look for:

**Good Signs:**
```
💾 Resume data saved to Chrome storage (source: linkedin)
📂 Resume data loaded from Chrome storage (source: linkedin, updated: timestamp)
✅ Background storage save successful
📦 Storage changed: {resumeData: {...}}
```

**Error Signs:**
```
❌ Chrome storage failed: [error message]
❌ Failed to save resume data: [error message]
❌ Background storage save failed: [error message]
```

### **Step 2: Test Storage Manually**
1. Open Chrome DevTools → Console
2. Run these commands on any job site:

```javascript
// Test direct Chrome storage
chrome.storage.local.set({test: 'data'}, () => {
  console.log('Direct storage test:', chrome.runtime.lastError || 'Success');
});

// Test background script communication
chrome.runtime.sendMessage({action: 'getStorageInfo'}, (response) => {
  console.log('Background storage info:', response);
});
```

### **Step 3: Check Extension Permissions**
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Details"
4. Verify "Storage" permission is enabled

### **Step 4: Test Cross-Tab Communication**
1. **Tab 1:** Extract LinkedIn data
2. **Tab 2:** Open console and run:
```javascript
chrome.storage.local.get(['resumeData'], (result) => {
  console.log('Cross-tab storage test:', result);
});
```

## 🛠️ **Quick Fixes**

### **Fix 1: Reload Extension**
1. Go to `chrome://extensions/`
2. Find your extension
3. Click the reload button (🔄)
4. Refresh all job site tabs

### **Fix 2: Clear and Re-test**
1. Open extension popup
2. Click "Clear Resume Data"
3. Extract LinkedIn data again
4. Test cross-tab persistence

### **Fix 3: Check Background Script**
1. Open `chrome://extensions/`
2. Click "Service Worker" for your extension
3. Check console for background script messages

## 🔧 **Advanced Debugging**

### **Test Storage API Directly**
```javascript
// Save test data
chrome.storage.local.set({
  'resumeData': {
    data: {test: 'data'},
    source: 'test',
    timestamp: new Date().toISOString(),
    version: '1.0'
  }
}, () => {
  console.log('Save result:', chrome.runtime.lastError || 'Success');
});

// Load test data
chrome.storage.local.get(['resumeData'], (result) => {
  console.log('Load result:', result);
});
```

### **Check Background Script Logs**
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Service Worker"
4. Look for console messages like:
   ```
   🔄 Background script loaded
   📦 Storage changed: {...}
   📨 Background received message: {...}
   ```

### **Test Content Script Communication**
```javascript
// Test if content script can communicate with background
chrome.runtime.sendMessage({action: 'getStorageInfo'}, (response) => {
  console.log('Background communication test:', response);
});
```

## 🎯 **Expected Behavior**

### **After LinkedIn Extraction:**
1. Console shows: `💾 Resume data saved to Chrome storage (source: linkedin)`
2. Background script shows: `📦 Storage changed: {resumeData: {...}}`
3. Storage info shows: `hasData: true, source: "linkedin"`

### **On Different Tab:**
1. Extension popup shows: "💾 Stored Resume Data Available"
2. Console shows: `📂 Resume data loaded from Chrome storage`
3. Auto-fill works immediately

### **After Browser Restart:**
1. Data still available in extension
2. Form filling still works
3. Storage info shows correct timestamp

## 🚨 **Common Issues**

### **Issue 1: "Chrome storage failed"**
**Cause:** Content script doesn't have proper storage access
**Fix:** Check manifest permissions, reload extension

### **Issue 2: "Background script not responding"**
**Cause:** Background script not loaded or has errors
**Fix:** Check background script console, reload extension

### **Issue 3: "No data found"**
**Cause:** Data not saved properly or cleared
**Fix:** Re-extract data, check console for save errors

### **Issue 4: "Cross-tab not working"**
**Cause:** Storage not persisting or loading incorrectly
**Fix:** Test storage manually, check background script logs

## 📊 **Debugging Checklist**

- [ ] Extension has "Storage" permission
- [ ] Background script loads without errors
- [ ] Content script can access chrome.storage.local
- [ ] LinkedIn extraction shows save success message
- [ ] Background script shows storage change event
- [ ] Different tab can load stored data
- [ ] Extension popup shows storage info
- [ ] Auto-fill works on different tab
- [ ] Data persists after browser restart

If any step fails, check the console for specific error messages and follow the corresponding fix above.
