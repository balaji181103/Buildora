
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> Arduino 10, RX -> Arduino 11

// --- Configuration ---
// IMPORTANT: You get this from running 'ngrok http 9002' on your computer
// It will look like: https://xxxxxxxxxxxx.ngrok-free.app
const char* NGROK_URL = "https://your-ngrok-url.ngrok-free.app"; 
const char* APN = "airtelgprs.com";

// --- Helper Functions ---

/**
 * @brief Sends an AT command to the SIM800L module and waits for an expected response.
 * @param command The AT command to send.
 * @param expected_response The string to look for in the module's response.
 * @param timeout The maximum time to wait for the response in milliseconds.
 * @return True if the expected response was received, false otherwise.
 */
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print("Sent: ");
  Serial.println(command);

  String response = "";
  while (millis() - startTime < timeout) {
    if (sim.available()) {
      char c = sim.read();
      response += c;
    }
    if (response.indexOf(expected_response) != -1) {
      Serial.print("Rcvd: ");
      Serial.print(response);
      return true;
    }
  }
  Serial.println("[ERROR] Timeout or incorrect response. Full response:");
  Serial.println(response);
  return false;
}

/**
 * @brief Reads the body of an HTTP response from the SIM800L.
 * @return A String containing the JSON part of the response.
 */
String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;
  
  // Wait for the start of the JSON object '{'
  while(millis() - startTime < 5000) {
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') {
        foundJson = true;
        response += c;
        break;
      }
    }
  }

  // If JSON start was found, read until the end '}'
  if (foundJson) {
    startTime = millis();
    while (millis() - startTime < 5000) {
      if (sim.available()) {
        char c = sim.read();
        response += c;
        if (c == '}') {
          break; // End of JSON object
        }
      }
    }
  }
  
  return response;
}


/**
 * @brief Initializes the SIM800L module and connects to GPRS.
 * This function uses the more reliable AT+SAPBR command sequence.
 * @return True on success, false on failure.
 */
bool initializeSIM() {
  Serial.println("\n--- Initializing SIM800L ---");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Echo off
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 2000)) { // Check signal quality
      Serial.println("[WARNING] Could not check signal quality, but continuing.");
  }
  
  Serial.println("\n--- Connecting to GPRS ---");
  if (!sendATCommand("AT+CGATT?", "+CGATT: 1", 5000)) {
    Serial.println("[ERROR] Not attached to GPRS.");
    return false;
  }
  
  // Set the Bearer Profile (more reliable method)
  String cmd = "AT+SAPBR=3,1,\"APN\",\"";
  cmd += APN;
  cmd += "\"";
  if (!sendATCommand(cmd.c_str(), "OK", 5000)) return false;

  // Enable the Bearer
  if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) {
     Serial.println("[ERROR] Could not enable GPRS Bearer.");
     return false;
  }
  
  // Get IP Address
  if (!sendATCommand("AT+SAPBR=2,1", "+SAPBR:", 10000)) {
    Serial.println("[ERROR] Failed to get an IP address.");
    return false;
  }

  Serial.println("\n--- SIM Initialized and GPRS Connected ---");
  return true;
}

/**
 * @brief Performs an HTTP GET request to the server and parses the location data.
 */
void getCustomerDetails() {
  Serial.println("\n--- Performing HTTP GET Request ---");
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  
  // Set Bearer Profile for HTTP
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  // Set the URL for the request
  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += NGROK_URL;
  url_cmd += "/api/getMission?droneId=SB-001\"";
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000); // Clean up on failure
    return;
  }
  
  // Start GET action
  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET failed. Check server or URL.");
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  // Read the response from the server
  Serial.println("Reading HTTP Response...");
  sendATCommand("AT+HTTPREAD", "+HTTPREAD:", 10000); // Wait for the read header
  
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  sendATCommand("AT+HTTPTERM", "OK", 3000); // Terminate HTTP session

  // --- JSON Parsing ---
  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Parse Failed: ");
      Serial.println(error.f_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n--- Mission Details Received ---");
      Serial.print("  Order ID : ");
      Serial.println(orderId);
      Serial.print("  Latitude : ");
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print("  Longitude: ");
      Serial.println(longitude, 6);
      Serial.println("--------------------------------");
    } else {
      Serial.println("[WARNING] Valid JSON received, but it's missing 'latitude' or 'longitude'.");
      Serial.println("Check the server response.");
    }
  } else {
    Serial.println("[ERROR] No JSON object was found in the HTTP response.");
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial to connect

  if (initializeSIM()) {
    Serial.println("\nSystem Ready.");
    Serial.println("Type 'g' and press Enter to get the mission details.");
  } else {
    Serial.println("\n[FATAL] SIM Initialization failed. Please check power and connections.");
    while (true); // Halt execution
  }
}

void loop() {
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  // This is useful for manual debugging with an AT command tool
  while (sim.available()) {
    Serial.write(sim.read());
  }
}
