#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11);  // SIM800L TX -> Arduino 10, RX -> Arduino 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 

// =================================================================================
// IMPORTANT: You MUST replace the placeholder URL below with your actual public
// server URL from a service like ngrok.
// Example: "http://f9a2-49-204-135-15.ngrok-free.app/api/getMission?droneId=SB-001"
// =================================================================================
const char* SERVER_URL = "http://<YOUR_NGROK_OR_PUBLIC_URL>/api/getMission?droneId=SB-001";

// --- Global State ---
bool gprsConnected = false;

// --- Helper Functions ---

/**
 * @brief Sends an AT command to the SIM800L and waits for a specific response.
 * @param command The AT command to send.
 * @param expected_response The response string to wait for.
 * @param timeout The maximum time to wait for the response in milliseconds.
 * @return True if the expected response was received, false otherwise.
 */
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print(">>> Sent: ");
  Serial.println(command);

  String response = "";
  while (millis() - startTime < timeout) {
    if (sim.available()) {
      char c = sim.read();
      response += c;
    }
  }

  // Print the full response for debugging
  Serial.println("<<< Received:");
  Serial.print(response);
  Serial.println("-----------");

  if (response.indexOf(expected_response) != -1) {
    return true;
  }
  
  Serial.println("[ERROR] Did not receive expected response.");
  return false;
}

/**
 * @brief Reads the JSON part of an HTTP response from the SIM module.
 * @return A string containing the JSON object, or an empty string if not found.
 */
String readHttpResponse() {
  String response = "";
  unsigned long startTime = millis();
  bool foundJson = false;

  Serial.println("Parsing HTTP response for JSON object...");

  while (millis() - startTime < 10000) { // 10-second timeout
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') {
        foundJson = true; // Start capturing when a '{' is found
      }
      if (foundJson) {
        response += c;
      }
      if (c == '}' && foundJson) {
        break; // Stop capturing when a '}' is found
      }
    }
  }
  return response;
}

/**
 * @brief Checks if the GPRS connection is active by querying the IP address.
 * @return True if connected, false otherwise.
 */
bool isGprsConnected() {
    return sendATCommand("AT+SAPBR=2,1", "+SAPBR: 1,1", 5000);
}

/**
 * @brief Initializes the SIM module and establishes a GPRS connection.
 * @return True on success, false on failure.
 */
bool initializeSIM() {
  Serial.println("--- Initializing SIM800L ---");
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Echo off
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  
  Serial.println("--- Attaching to GPRS Network ---");
  if (!sendATCommand("AT+CGATT=1", "OK", 10000)) return false;

  Serial.println("--- Setting up GPRS Bearer ---");
  // Close the bearer first, just in case it was left open
  sendATCommand("AT+SAPBR=0,1", "OK", 5000); 
  delay(1000);
  
  if (!sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 5000)) return false;
  
  String apnCmd = "AT+SAPBR=3,1,\"APN\",\"";
  apnCmd += APN;
  apnCmd += "\"";
  if (!sendATCommand(apnCmd.c_str(), "OK", 5000)) return false;

  Serial.println("--- Opening GPRS Bearer (this may take a moment) ---");
  if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) return false;

  if (!isGprsConnected()) {
    Serial.println("[FATAL] Failed to get an IP address.");
    return false;
  }
  
  Serial.println("\n--- SIM Initialized and GPRS Connected Successfully ---");
  gprsConnected = true;
  return true;
}

/**
 * @brief Performs an HTTP GET request to the server to fetch mission details.
 */
void getMissionDetails() {
  Serial.println("\n--- Starting HTTP Request ---");
  
  if (!sendATCommand("AT+HTTPINIT", "OK", 10000)) {
      Serial.println("[ERROR] Failed to initialize HTTP.");
      return;
  }
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";

  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) return;

  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println("[ERROR] HTTP GET request failed. Check server and URL.");
    sendATCommand("AT+HTTPTERM", "OK", 2000); // Terminate on failure
    return;
  }

  Serial.println("--- Reading HTTP Response ---");
  sendATCommand("AT+HTTPREAD", "OK", 10000); // Read the response data
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  sendATCommand("AT+HTTPTERM", "OK", 2000); // Always terminate the session
  Serial.println("--- HTTP Session Closed ---");

  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print("[ERROR] JSON Deserialization Failed: ");
      Serial.println(error.c_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println("\n✅ --- MISSION DETAILS --- ✅");
      Serial.print("   Order ID:  "); Serial.println(orderId);
      Serial.print("   Latitude:  "); Serial.println(latitude, 6);
      Serial.print("   Longitude: "); Serial.println(longitude, 6);
      Serial.println("--------------------------");
    } else {
      Serial.println("[ERROR] JSON received, but 'latitude' or 'longitude' keys are missing.");
    }
  } else {
    Serial.println("[ERROR] No valid JSON object found in the HTTP response.");
  }
}


// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for Serial to be ready
  delay(1000);

  if (!initializeSIM()) {
      Serial.println("\n[FATAL] Could not connect to the network. Check wiring, power, and SIM card. Halting.");
      while(true); // Stop execution
  }
}

void loop() {
  // Check GPRS connection before attempting to fetch data
  if (!isGprsConnected()) {
    Serial.println("\n[WARNING] GPRS connection lost. Re-initializing...");
    gprsConnected = false;
    if (!initializeSIM()) {
      Serial.println("Failed to re-initialize. Retrying in 30 seconds...");
      delay(30000);
      return; // Try again on the next loop
    }
  }
  
  if (gprsConnected) {
    getMissionDetails();
  }

  // Wait for 30 seconds before the next request
  Serial.println("\nWaiting 30 seconds before next check...");
  delay(30000); 
}
