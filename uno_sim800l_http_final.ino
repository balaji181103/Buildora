
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Connect SIM800L TX to Arduino D10
// Connect SIM800L RX to Arduino D11
SoftwareSerial sim(10, 11);

// --- Configuration ---
// IMPORTANT: Use ngrok or a similar service to get a PUBLIC URL for your local server.
// A local IP like 192.168.x.x will NOT work.
const char* SERVER_URL = "http://your-ngrok-url.ngrok-free.app/api/getMission?droneId=SB-001";
const char* APN = "airtelgprs.com"; // APN for your SIM card provider (e.g., "airtelgprs.com")


// --- Helper Functions ---
/**
 * @brief Sends an AT command and waits for a specific response.
 * @param command The AT command to send.
 * @param expected_response The response to wait for.
 * @param timeout The maximum time to wait in milliseconds.
 * @return True if the expected response was received, false otherwise.
 */
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print(F("Sent: "));
  Serial.println(command);

  String response = "";
  response.reserve(100); // Pre-allocate memory for the response string

  while (millis() - startTime < timeout) {
    if (sim.available()) {
      char c = sim.read();
      response += c;
    }
    if (response.indexOf(expected_response) != -1) {
      Serial.print(F("Recv: "));
      Serial.print(response);
      return true;
    }
  }

  Serial.println(F("[ERROR] Timeout or incorrect response. Full response received:"));
  Serial.println(response);
  return false;
}

/**
 * @brief Reads the body of an HTTP response after it has been received.
 *        It specifically looks for a JSON object.
 * @return A String containing the JSON object, or an empty string if not found.
 */
String readHttpResponse() {
  String response = "";
  response.reserve(256); // Pre-allocate memory
  unsigned long startTime = millis();
  bool foundJson = false;
  int braceCount = 0;

  // Look for the start of the JSON body
  while(millis() - startTime < 5000) {
    if (sim.available()) {
        char c = sim.read();
        if (c == '{') {
            foundJson = true;
            braceCount++;
            response += c;
            break; // Found the start, now read the rest
        }
    }
  }

  if (foundJson) {
      startTime = millis(); // Reset timeout for reading the object
      while (millis() - startTime < 5000) {
          if (sim.available()) {
              char c = sim.read();
              response += c;
              if (c == '{') braceCount++;
              if (c == '}') braceCount--;
              if (braceCount == 0) break; // End of JSON object
          }
      }
  }

  return response;
}

/**
 * @brief Initializes the SIM800L module and connects to GPRS.
 * @return True on success, false on failure.
 */
bool initializeSIM() {
  Serial.println(F("Initializing SIM800L..."));
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Echo off
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 2000)) return false; // Check signal quality

  Serial.println(F("Attaching to GPRS..."));
  if (!sendATCommand("AT+CGATT=1", "OK", 10000)) return false;
  delay(2000); // Give module time to attach

  // --- New, more robust GPRS bearer setup ---
  Serial.println(F("Configuring GPRS Bearer..."));
  
  // Step 1: Close any previous bearer contexts (robustness)
  sendATCommand("AT+SAPBR=0,1", "OK", 5000); // We don't care if this fails, just a cleanup
  delay(1000);

  // Step 2: Set connection type to GPRS
  if (!sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK", 5000)) return false;

  // Step 3: Set the APN
  String apn_cmd = "AT+SAPBR=3,1,\"APN\",\"";
  apn_cmd += APN;
  apn_cmd += "\"";
  if (!sendATCommand(apn_cmd.c_str(), "OK", 5000)) return false;

  // Step 4: Open the GPRS bearer. This can take a while.
  Serial.println(F("Opening GPRS bearer..."));
  if (!sendATCommand("AT+SAPBR=1,1", "OK", 20000)) { // Increased timeout
    return false;
  }
  delay(3000); // Wait after opening

  // Step 5: Query the bearer to get the IP address
  if (!sendATCommand("AT+SAPBR=2,1", "+SAPBR: 1,1", 10000)) return false;

  Serial.println(F("\n[SUCCESS] SIM Initialized and GPRS Connected."));
  return true;
}


/**
 * @brief Makes an HTTP GET request to the server and parses the response.
 */
void getCustomerDetails() {
  Serial.println(F("\nInitializing HTTP..."));
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;

  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }
  
  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";

  Serial.println("Requesting: " + String(SERVER_URL));
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  // Set to non-SSL mode explicitly
  if (!sendATCommand("AT+HTTPSSL=0", "OK", 5000)) {
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 20000)) {
    Serial.println(F("[ERROR] HTTP GET failed. Check server URL and network."));
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  Serial.println(F("Reading HTTP Response..."));
  sendATCommand("AT+HTTPREAD", "+HTTPREAD", 10000); // Wait for the +HTTPREAD header
  String jsonResponse = readHttpResponse();
  Serial.println("Extracted JSON: " + jsonResponse);

  sendATCommand("AT+HTTPTERM", "OK", 2000); // Terminate HTTP session

  if (jsonResponse.length() > 0) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, jsonResponse);

    if (error) {
      Serial.print(F("[ERROR] JSON Parse Failed: "));
      Serial.println(error.f_str());
      return;
    }

    if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
      float latitude = doc["latitude"];
      float longitude = doc["longitude"];
      const char* orderId = doc["orderId"];

      Serial.println(F("\n--- Mission Details ---"));
      Serial.print(F("Order ID : "));
      Serial.println(orderId);
      Serial.print(F("Latitude : "));
      Serial.println(latitude, 6);
      Serial.print(F("Longitude: "));
      Serial.println(longitude, 6);
      Serial.println(F("------------------------"));
    } else {
      Serial.println(F("[INFO] No mission found or response missing location data."));
    }
  } else {
    Serial.println(F("[ERROR] No JSON object found in response."));
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial); // Wait for serial monitor to open

  if (initializeSIM()) {
    Serial.println(F("\nSystem Ready."));
  } else {
    Serial.println(F("\n[FATAL] Could not initialize SIM card. Check wiring, power, and signal."));
    while (true); // Halt execution
  }
}

void loop() {
  // Automatically get details every 30 seconds
  Serial.println(F("\nRequesting new mission details..."));
  getCustomerDetails();
  
  Serial.println(F("Waiting 30 seconds before next request..."));
  delay(30000);
}
