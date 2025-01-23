// Function to handle generate button click
document.getElementById("generateButton").onclick = () => {
    const advanced = document.getElementById("advancedToggle").checked;
    const negativeChance = advanced ? parseInt(document.getElementById("negativeChance").value) : 10;
    const minValue = advanced ? parseFloat(document.getElementById("minValue").value) : 1;
    const maxValue = advanced ? parseFloat(document.getElementById("maxValue").value) : 50000;
    const numberChance = advanced ? parseInt(document.getElementById("numberChance").value) : 50;
  
    // Send the parameters to the plugin code
    parent.postMessage(
      {
        pluginMessage: { type: "generateData", advanced, negativeChance, minValue, maxValue, numberChance },
      },
      "*"
    );
  
    // Trigger total recalculation after generating data
    parent.postMessage({ pluginMessage: { type: "calculateTotal" } }, "*");
  };
  
  // Function to handle calculate total button click
  document.getElementById("calculateTotalButton").onclick = () => {
    // Trigger total calculation without generating random data
    parent.postMessage({ pluginMessage: { type: "calculateTotal" } }, "*");
  };
  
  // Function to handle copy button click
  document.getElementById("copyButton").onclick = () => {
    const totalValue = document.getElementById("totalValue").innerText;
    // Send message to the main Figma code to copy the value to the clipboard
    parent.postMessage({ pluginMessage: { type: "copyToClipboard", total: totalValue } }, "*");
  };
  
  // Function to toggle the advanced options
  document.getElementById("advancedToggle").onchange = () => {
    const advancedOptions = document.getElementById("advancedOptions");
    advancedOptions.style.display = document.getElementById("advancedToggle").checked ? "block" : "none";
  };
  
  // Listen for total updates from the plugin side
  window.onmessage = (event) => {
    const { type, total } = event.data.pluginMessage;
    if (type === "updateTotal") {
      document.getElementById("totalValue").innerText = total;
      document.getElementById("copyButton").style.display = "inline-block"; // Show copy button
    }
  };
  