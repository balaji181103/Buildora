#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Connect the SIM800L TX pin to Arduino pin 10
// Connect the SIM800L RX pin to Arduino pin 11
SoftwareSerial sim(10, 11);

// --- Configuration ---
// IMPORTANT: You must replace the ngrok URL with the one you get
// from running "ngrok http 9002" in your terminal.
const char* SERVER_URL = "https://<REPLACE-WITH-YOUR-NGROK-URL>.ngrok-free.app/api/getMission?droneId=SB-001";
const char* APN = "airtelgprs.com"; // APN for Airtel India

/**
 * @brief Sends an AT command to the SIM800L and waits for an expected response.
 * @param command The AT command to send.
 * @param expected_response The response string to wait for.
 * @param timeout The maximum time to wait for the response in milliseconds.
 * @return true if the expected response was received, false otherwise.
 */
bool sendATCommand(const char* command, const char* expected_response, unsigned long timeout) {
  unsigned long startTime = millis();
  sim.println(command);
  Serial.print(F("Sent: "));
  Serial.println(command);

  String response = "";
  response.reserve(100); // Reserve memory to avoid fragmentation

  while (millis() - startTime < timeout) {
    while (sim.available()) {
      char c = sim.read();
      response += c;
    }
    if (response.indexOf(expected_response) != -1) {
      Serial.print(F("Rcvd: "));
      Serial.println(response);
      return true;
    }
  }
  Serial.print(F("[ERROR] Timeout or incorrect response. Full response: "));
  Serial.println(response);
  return false;
}

/**
 * @brief Reads the body of an HTTP response.
 * @return A String containing the HTTP response body, typically JSON.
 */
String readHttpResponse() {
  String response = "";
  response.reserve(256); // Reserve memory for the JSON response
  unsigned long startTime = millis();
  bool foundJson = false;

  // Wait for the start of the JSON object '{'
  while (millis() - startTime < 10000) {
    if (sim.available()) {
      char c = sim.read();
      if (c == '{') {
        foundJson = true;
        response += c;
        break; // Start capturing the rest of the JSON
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
          break; // JSON object is complete
        }
      }
    }
  }
  return response;
}

/**
 * @brief Initializes the SIM800L module and connects to GPRS.
 * @return true if initialization is successful, false otherwise.
 */
bool initializeSIM() {
  Serial.println(F("--- Initializing SIM800L ---"));
  sim.begin(9600);
  delay(1000);

  if (!sendATCommand("AT", "OK", 2000)) return false;
  if (!sendATCommand("ATE0", "OK", 2000)) return false; // Disable echo
  if (!sendATCommand("AT+CPIN?", "READY", 5000)) return false;
  if (!sendATCommand("AT+CSQ", "OK", 2000)) return false;
  
  Serial.println(F("\n--- Connecting to GPRS ---"));
  if (!sendATCommand("AT+CGATT=1", "OK", 10000)) return false; // Attach to GPRS
  
  // Set the APN
  String cmd = "AT+CSTT=\"";
  cmd += APN;
  cmd += "\"";
  if (!sendATCommand(cmd.c_str(), "OK", 10000)) return false;
  
  // Bring up the wireless connection (this can take time)
  if (!sendATCommand("AT+CIICR", "OK", 20000)) return false;
  
  // Get the local IP address
  if (!sendATCommand("AT+CIFSR", ".", 10000)) return false;
  
  Serial.println(F("\n--- SIM Initialized and GPRS Connected ---"));
  return true;
}

/**
 * @brief Performs an HTTP GET request to the server to fetch mission details.
 */
void getCustomerDetails() {
  Serial.println(F("\n--- Performing HTTP GET Request ---"));
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) return;
  if (!sendATCommand("AT+HTTPPARA=\"CID\",1", "OK", 5000)) return;

  String url_cmd = "AT+HTTPPARA=\"URL\",\"";
  url_cmd += SERVER_URL;
  url_cmd += "\"";
  
  if (!sendATCommand(url_cmd.c_str(), "OK", 5000)) {
      sendATCommand("AT+HTTPTERM", "OK", 2000);
      return;
  }

  // Increased timeout to 30 seconds for the action
  if (!sendATCommand("AT+HTTPACTION=0", "+HTTPACTION: 0,200", 30000)) {
    Serial.println(F("[ERROR] HTTP GET failed. Check ngrok URL and server."));
    sendATCommand("AT+HTTPTERM", "OK", 2000);
    return;
  }

  sendATCommand("AT+HTTPREAD", "READ", 10000); // Wait for "READ"
  String jsonResponse = readHttpResponse();
  Serial.print(F("Extracted JSON: "));
  Serial.println(jsonResponse);

  sendATCommand("AT+HTTPTERM", "OK", 2000);

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
      Serial.println(latitude, 6); // Print with 6 decimal places
      Serial.print(F("Longitude: "));
      Serial.println(longitude, 6);
      Serial.println(F("------------------------"));
    } else {
      Serial.println(F("[ERROR] Valid JSON received but it's missing latitude/longitude keys."));
    }
  } else {
    Serial.println(F("[ERROR] No JSON object found in HTTP response."));
  }
}

// --- Arduino Standard Functions ---
void setup() {
  Serial.begin(9600);
  while (!Serial) { ; } // Wait for serial port to connect. Needed for native USB port only

  if (initializeSIM()) {
    Serial.println(F("\nSystem Ready."));
    Serial.println(F("Type 'g' and press Enter to GET mission details."));
  } else {
    Serial.println(F("\n[FATAL] SIM Initialization failed. Please check power and connections."));
    while (true) { delay(1000); } // Halt execution
  }
}

void loop() {
  if (Serial.available()) {
    char cmd = tolower(Serial.read());
    if (cmd == 'g') {
      getCustomerDetails();
    }
  }

  // This is just for live debugging, to see any unsolicited messages from the module
  if (sim.available()) {
    Serial.write(sim.read());
  }
}
